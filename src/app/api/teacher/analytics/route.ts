import { sessionErrorResponse } from '@/lib/session-response';
import { fetchAllRows } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';
import { getBatchStudentActivity } from '@/lib/activity/universal-activity';
import type { ActivityItem } from '@/components/teacher/types';

/**
 * GET /api/teacher/analytics?classroomId=yyy
 * Returns enhanced analytics for teacher dashboard. Auth is required.
 * - Class stats (active students, total words, avg accuracy, words due today)
 * - Top students by mastery (VMS)
 * - Struggling students (least reviews, low LCS)
 * - Vocabulary coverage per word in classroom
 * - Recent activity feed (quiz + SRS reviews)
 */
export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');

    if (!classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify classroom ownership
    const { data: classroom, error: classroomErr } = await supabase
      .from('classrooms')
      .select('teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classroomErr) throw classroomErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return unauthorized();
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const todayDate = new Date().toISOString().split('T')[0];

    // 1. Get all student progress for the class
    const { data: students, error: studErr } = await supabase
      .from('student_progress')
      .select('student_id, student_name, email, words_reviewed, total_words, mastered_words, vms, lcs, avg_quiz_accuracy, quizzes_taken, last_active')
      .eq('classroom_id', classroomId);

    if (studErr) throw studErr;

    const studentList = students || [];
    const studentIds = studentList.map(s => s.student_id);

    // 2. Class stats
    const activityMap = studentIds.length > 0 ? await getBatchStudentActivity(studentIds, supabase) : new Map();
    const activeStudents = studentList.filter(s => {
      const summary = activityMap.get(s.student_id);
      const trueActive = summary?.trueLastActive || s.last_active;
      return trueActive && new Date(trueActive) >= sevenDaysAgo;
    }).length;

    const totalClassWords = studentList.length > 0
      ? studentList.reduce((sum, s) => sum + (s.words_reviewed || 0), 0)
      : 0;

    const avgAccuracy = studentList.length > 0
      ? studentList.reduce((sum, s) => sum + (s.avg_quiz_accuracy || 0), 0) / studentList.length
      : 0;

    // ── BATCH A: các truy vấn chỉ cần studentIds + classroomId → chạy song song ──
    type QuizRow = { id: string; user_id: string; score: number; total_questions: number; accuracy: number; completed_at: string };
    type ReviewRow = { user_id: string; last_reviewed_at: string };
    type GrammarRow = { id: string; user_id: string; lesson_id: string; mastery_score: number; last_reviewed_at: string };
    type ReadingRow = { id: string; user_id: string; exercise_id: string; completed_at: string; mcq_score: number; mcq_total: number };
    type ToeicRow = { id: string; user_id: string; part: number; is_correct: boolean; last_answered_at: string };
    type AssessmentRow = { id: string; user_id: string; track?: string; score: number; passed?: boolean; created_at: string };

    let wordsDueToday = 0;
    let words: { id: string; word: string }[] = [];
    let recentQuizzes: QuizRow[] = [];
    let recentReviews: ReviewRow[] = [];
    let recentGrammar: GrammarRow[] = [];
    let recentReading: ReadingRow[] = [];
    let recentToeic: ToeicRow[] = [];
    let recentAssessments: AssessmentRow[] = [];

    if (studentIds.length > 0) {
      const [dueRes, wordsRes, quizRes, reviewRes, grammarRes, readingRes, toeicRes, assessmentRes] = await Promise.all([
        supabase
          .from('srs_progress')
          .select('id', { count: 'exact', head: true })
          .in('user_id', studentIds)
          .lte('next_review_date', todayDate),
        supabase
          .from('words')
          .select('id, word')
          .eq('classroom_id', classroomId)
          .order('created_at', { ascending: true })
          .limit(50),
        supabase
          .from('quiz_results')
          .select('id, user_id, score, total_questions, accuracy, completed_at')
          .in('user_id', studentIds)
          .gte('completed_at', sevenDaysAgoISO)
          .order('completed_at', { ascending: false })
          .limit(20),
        supabase
          .from('srs_progress')
          .select('user_id, last_reviewed_at')
          .in('user_id', studentIds)
          .gte('last_reviewed_at', sevenDaysAgoISO)
          .order('last_reviewed_at', { ascending: false })
          .limit(30),
        supabase
          .from('grammar_progress')
          .select('id, user_id, lesson_id, mastery_score, last_reviewed_at')
          .in('user_id', studentIds)
          .gte('last_reviewed_at', sevenDaysAgoISO)
          .order('last_reviewed_at', { ascending: false })
          .limit(20),
        supabase
          .from('daily_reading_completions')
          .select('id, user_id, exercise_id, completed_at, mcq_score, mcq_total')
          .in('user_id', studentIds)
          .gte('completed_at', sevenDaysAgoISO)
          .order('completed_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_toeic_question_history')
          .select('id, user_id, part, is_correct, last_answered_at')
          .in('user_id', studentIds)
          .gte('last_answered_at', sevenDaysAgoISO)
          .order('last_answered_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_roadmap_assessments')
          .select('id, user_id, track, score, passed, created_at')
          .in('user_id', studentIds)
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);
      wordsDueToday = dueRes.count || 0;
      words = (wordsRes.data as { id: string; word: string }[] | null) || [];
      recentQuizzes = (quizRes.data as QuizRow[] | null) || [];
      recentReviews = (reviewRes.data as unknown as ReviewRow[] | null) || [];
      recentGrammar = (grammarRes.data as unknown as GrammarRow[] | null) || [];
      recentReading = (readingRes.data as unknown as ReadingRow[] | null) || [];
      recentToeic = (toeicRes.data as unknown as ToeicRow[] | null) || [];
      recentAssessments = (assessmentRes.data as unknown as AssessmentRow[] | null) || [];
    }

    // 3. Top students by VMS (mastery score), top 5
    const topStudents = [...studentList]
      .sort((a, b) => (b.vms || 0) - (a.vms || 0))
      .slice(0, 5)
      .map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        email: s.email,
        vms: s.vms || 0,
        words_reviewed: s.words_reviewed || 0,
        lcs: s.lcs || 0,
      }));

    // 4. Struggling students: avg_accuracy < 60%, sorted by accuracy asc, top 5
    const strugglingStudents = [...studentList]
      .filter(s => (s.words_reviewed || 0) > 0 && (s.avg_quiz_accuracy || 0) < 0.6)
      .sort((a, b) => (a.avg_quiz_accuracy || 0) - (b.avg_quiz_accuracy || 0))
      .slice(0, 5)
      .map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        email: s.email,
        avg_accuracy: Math.round((s.avg_quiz_accuracy || 0) * 100),
        words_reviewed: s.words_reviewed || 0,
        lcs: s.lcs || 0,
        last_active: s.last_active,
      }));

    // 5. Vocabulary coverage: for each word in classroom, count how many enrolled students have reviewed it
    const enrolledCount = studentList.length;
    let wordCoverage: Array<{
      word_id: string;
      word: string;
      students_reviewed: number;
      coverage_pct: number;
    }> = [];

    // 6. Word difficulty: top 10 từ có fail rate cao nhất
    // Proxy: dùng srs_progress — từ có review_count cao nhưng stability thấp = khó nhớ
    type WordDifficultyItem = {
      word_id: string;
      word: string;
      fail_rate: number; // % số lần review thất bại (stability thấp / review nhiều)
    };
    let wordDifficulty: WordDifficultyItem[] = [];

    // ── BATCH B: coverage + difficulty đọc chung `words` (50 từ) → 2 truy vấn srs song song ──
    if (words.length > 0) {
      const wordIds = words.map(w => w.id);
      const [covResData, diffResData] = await Promise.all([
        fetchAllRows((f, t) => supabase
          .from('srs_progress')
          .select('word_id, user_id')
          .in('word_id', wordIds)
          .in('user_id', studentIds)
          .gt('review_count', 0)
          .range(f, t)),
        fetchAllRows((f, t) => supabase
          .from('srs_progress')
          .select('word_id, review_count, stability')
          .in('word_id', wordIds)
          .in('user_id', studentIds)
          .gt('review_count', 1)
          .range(f, t)),
      ]);

      const coverage = covResData;
      if (coverage) {
        const countMap = new Map<string, Set<string>>();
        for (const row of coverage) {
          if (!countMap.has(row.word_id)) countMap.set(row.word_id, new Set());
          countMap.get(row.word_id)!.add(row.user_id);
        }
        wordCoverage = words.map(w => {
          const reviewers = countMap.get(w.id)?.size || 0;
          return {
            word_id: w.id,
            word: w.word,
            students_reviewed: reviewers,
            coverage_pct: enrolledCount > 0 ? Math.round((reviewers / enrolledCount) * 100) : 0,
          };
        });
      }

      const diffProgress = diffResData;
      if (diffProgress && diffProgress.length > 0) {
        const wordMap = new Map<string, { totalScore: number; count: number }>();
        for (const row of diffProgress) {
          const stability = row.stability as number ?? 1;
          const failScore = stability > 0 ? (row.review_count as number) / stability : row.review_count as number;
          if (!wordMap.has(row.word_id)) wordMap.set(row.word_id, { totalScore: 0, count: 0 });
          const entry = wordMap.get(row.word_id)!;
          entry.totalScore += failScore;
          entry.count += 1;
        }
        const wordLookup = new Map(words.map(w => [w.id, w.word]));
        wordDifficulty = [...wordMap.entries()]
          .map(([wid, { totalScore, count }]) => ({
            word_id: wid,
            word: wordLookup.get(wid) || '',
            fail_rate: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0,
          }))
          .sort((a, b) => b.fail_rate - a.fail_rate)
          .slice(0, 10);
      }
    }

    // 7. Recent activity feed: activities across enrolled students
    const nameMap = new Map(studentList.map(s => [s.student_id, s.student_name || s.email]));

    let activityFeed: ActivityItem[] = [];

    if (studentIds.length > 0) {
      const quizActivities: ActivityItem[] = recentQuizzes.map(q => ({
        type: 'quiz',
        student_id: q.user_id,
        student_name: nameMap.get(q.user_id) || 'Unknown',
        detail: `Completed quiz — ${q.score}/${q.total_questions} (${Math.round((q.accuracy || 0) * 100)}%)`,
        timestamp: q.completed_at,
      }));

      // Group SRS reviews by user + day to avoid per-word spam
      const reviewGroups = new Map<string, { user_id: string; timestamp: string; count: number }>();
      for (const r of recentReviews) {
        if (!r.last_reviewed_at) continue;
        const day = (r.last_reviewed_at as string).split('T')[0];
        const key = `${r.user_id}_${day}`;
        if (!reviewGroups.has(key)) {
          reviewGroups.set(key, { user_id: r.user_id, timestamp: r.last_reviewed_at as string, count: 0 });
        }
        reviewGroups.get(key)!.count += 1;
      }

      const reviewActivities: ActivityItem[] = [...reviewGroups.values()].map(g => ({
        type: 'review',
        student_id: g.user_id,
        student_name: nameMap.get(g.user_id) || 'Unknown',
        detail: `Reviewed ${g.count} word${g.count > 1 ? 's' : ''}`,
        timestamp: g.timestamp,
      }));

      const grammarActivities: ActivityItem[] = recentGrammar.map(g => ({
        type: 'grammar',
        student_id: g.user_id,
        student_name: nameMap.get(g.user_id) || 'Unknown',
        detail: `Studied grammar — ${g.lesson_id} (${g.mastery_score || 0}%)`,
        timestamp: g.last_reviewed_at,
      }));

      const readingActivities: ActivityItem[] = recentReading.map(r => ({
        type: 'reading',
        student_id: r.user_id,
        student_name: nameMap.get(r.user_id) || 'Unknown',
        detail: `Completed daily reading — ${r.mcq_score || 0}/${r.mcq_total || 0} correct`,
        timestamp: r.completed_at,
      }));

      const toeicActivities: ActivityItem[] = recentToeic.map(t => ({
        type: 'toeic',
        student_id: t.user_id,
        student_name: nameMap.get(t.user_id) || 'Unknown',
        detail: `Practiced TOEIC Part ${t.part} — ${t.is_correct ? 'Correct' : 'Incorrect'}`,
        timestamp: t.last_answered_at,
      }));

      const assessmentActivities: ActivityItem[] = recentAssessments.map(a => ({
        type: 'assessment',
        student_id: a.user_id,
        student_name: nameMap.get(a.user_id) || 'Unknown',
        detail: `Took assessment: ${a.track ? a.track.toUpperCase() : 'TOEIC'} (${a.score}%)`,
        timestamp: a.created_at,
      }));

      activityFeed = [
        ...quizActivities,
        ...reviewActivities,
        ...grammarActivities,
        ...readingActivities,
        ...toeicActivities,
        ...assessmentActivities,
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
    }

    return NextResponse.json(
      {
        success: true,
        classStats: {
          active_students: activeStudents,
          total_enrolled: enrolledCount,
          total_class_words: totalClassWords,
          avg_accuracy: Math.round(avgAccuracy * 100),
          words_due_today: wordsDueToday,
        },
        topStudents,
        strugglingStudents,
        wordCoverage,
        wordDifficulty,
        activityFeed,
      },
      { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' } },
    );
  } catch (error: unknown) {
    const sessionFailure = sessionErrorResponse(error);
    if (sessionFailure) return sessionFailure;
    return safeErrorResponse(error, 'Không tải được phân tích lớp');
  }
}
