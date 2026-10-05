import { sessionErrorResponse } from '@/lib/session-response';
import { createServiceClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { getBatchStudentActivity, computeTrueLastActive } from '@/lib/activity/universal-activity';

/**
 * GET /api/teacher/stats?classroomId=yyy
 * Fetches teacher dashboard stats bypassing RLS recursion issues.
 * Auth is required.
 */
export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');

    const supabase = createServiceClient();

    // 1. Get classrooms (filter out personal word collections)
    const { data: classrooms, error: classErr } = await supabase
      .from('classrooms')
      .select('id, name, description, invite_code, created_at, teacher_id, enrollments(count)')
      .eq('teacher_id', auth.userId)
      .neq('name', '__personal__')
      .order('created_at', { ascending: false });

    if (classErr) throw classErr;

    // Join-like enrollment count
    const enriched = (classrooms || []).map(c => ({
      ...c,
      enrollment_count: c.enrollments?.[0]?.count || 0
    }));

    // 2. Get students for selected classroom if provided
    let students = [];
    if (classroomId) {
      // Verify classroom ownership from already fetched teacher classrooms (eliminates duplicate roundtrip)
      const isOwner = (classrooms || []).some(c => c.id === classroomId);
      if (!isOwner) {
        return unauthorized();
      }

      const { data: studentData, error: studentErr } = await supabase
        .from('student_progress')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('avg_quiz_accuracy', { ascending: false });

      if (studentErr) throw studentErr;

      const studentIds = (studentData || []).map(s => s.student_id);
      const [profilesRes, enrollmentsRes, quizzesRes, wordsRes, activitySummaryMap] = studentIds.length > 0 ? await Promise.all([
        supabase.from('profiles').select('id, plan, plan_expires_at').in('id', studentIds),
        supabase.from('enrollments').select('student_id, joined_at').eq('classroom_id', classroomId).in('student_id', studentIds),
        supabase
          .from('quiz_results')
          .select('user_id, score, total_questions, accuracy, completed_at, quiz_type')
          .in('user_id', studentIds)
          .order('completed_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('words')
          .select('added_by, created_at')
          .in('added_by', studentIds)
          .order('created_at', { ascending: false, nullsFirst: false }),
        getBatchStudentActivity(studentIds, supabase),
      ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, new Map()];

      const profMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const enrMap = new Map((enrollmentsRes.data || []).map(e => [e.student_id, e.joined_at]));

      // Latest quiz per student
      const latestQuizMap = new Map<string, { score: number; total_questions: number; accuracy: number; completed_at: string; quiz_type?: string }>();
      for (const q of quizzesRes.data || []) {
        if (q.completed_at && !latestQuizMap.has(q.user_id)) {
          latestQuizMap.set(q.user_id, {
            score: q.score,
            total_questions: q.total_questions,
            accuracy: q.accuracy,
            completed_at: q.completed_at,
            quiz_type: q.quiz_type,
          });
        }
      }

      // Count words saved and latest word created_at per student
      const savedWordsCountMap = new Map<string, number>();
      const latestWordMap = new Map<string, string>();
      for (const w of wordsRes.data || []) {
        if (w.added_by) {
          savedWordsCountMap.set(w.added_by, (savedWordsCountMap.get(w.added_by) || 0) + 1);
          if (w.created_at) {
            const cur = latestWordMap.get(w.added_by);
            if (!cur || new Date(w.created_at) > new Date(cur)) {
              latestWordMap.set(w.added_by, w.created_at);
            }
          }
        }
      }

      // Map to include TESOL metrics, recent activity & student plan details
      students = (studentData || []).map(s => {
        const accuracy = s.avg_quiz_accuracy || 0;
        const vms = s.vms || 0;
        const words = s.words_reviewed || 0;

        // Active Vocabulary is roughly 60-80% of passive vocabulary indexed by accuracy
        const activeVms = Math.round(vms * (0.6 + (accuracy * 0.4)));
        const depth = Math.round((vms + (s.lcs || 0)) / 2);

        // CEFR Level Mapping
        let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
        if (words >= 1000) cefr = 'C2';
        else if (words >= 600) cefr = 'C1';
        else if (words >= 300) cefr = 'B2';
        else if (words >= 150) cefr = 'B1';
        else if (words >= 50) cefr = 'A2';

        const p = profMap.get(s.student_id);
        const joinedAt = enrMap.get(s.student_id);
        const latestQuiz = latestQuizMap.get(s.student_id) || null;
        const savedWordsCount = savedWordsCountMap.get(s.student_id) || 0;
        const latestWordAt = latestWordMap.get(s.student_id);

        // Determine true last active timestamp across all 9 learning modules
        const actSummary = activitySummaryMap.get(s.student_id);
        const trueLastActive = computeTrueLastActive([
          s.last_active,
          latestQuiz?.completed_at,
          latestWordAt,
          actSummary?.trueLastActive,
        ]);

        return {
          ...s,
          last_active: trueLastActive,
          true_last_active: trueLastActive,
          active_vms: activeVms,
          communicative_depth: depth,
          cefr_level: cefr,
          plan: p?.plan || 'free',
          plan_expires_at: p?.plan_expires_at || null,
          joined_at: joinedAt || null,
          latest_quiz: latestQuiz,
          saved_words_count: Math.max(savedWordsCount, actSummary?.wordCount || 0),
        };
      });
    }

    const cacheHeader = classroomId
      ? 'private, no-cache, no-store, must-revalidate'
      : 'private, max-age=5, stale-while-revalidate=15';

    return NextResponse.json(
      {
        success: true,
        classrooms: enriched,
        students,
      },
      {
        headers: { 'Cache-Control': cacheHeader },
      }
    );
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Teacher API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
