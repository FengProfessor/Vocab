import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

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
      .select('*, enrollments(count)')
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
      // Verify classroom ownership first
      const { data: classroom, error: classroomErr } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', classroomId)
        .maybeSingle();

      if (classroomErr) throw classroomErr;
      if (!classroom || classroom.teacher_id !== auth.userId) {
        return unauthorized();
      }

      const { data: studentData, error: studentErr } = await supabase
        .from('student_progress')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('avg_quiz_accuracy', { ascending: false });
      
      if (studentErr) throw studentErr;

      const studentIds = (studentData || []).map(s => s.student_id);
      const [profilesRes, enrollmentsRes] = studentIds.length > 0 ? await Promise.all([
        supabase.from('profiles').select('id, plan, plan_expires_at').in('id', studentIds),
        supabase.from('enrollments').select('student_id, joined_at').eq('classroom_id', classroomId).in('student_id', studentIds),
      ]) : [{ data: [] }, { data: [] }];

      const profMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
      const enrMap = new Map((enrollmentsRes.data || []).map(e => [e.student_id, e.joined_at]));

      // Map to include TESOL metrics & student plan details
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

        return {
          ...s,
          active_vms: activeVms,
          communicative_depth: depth,
          cefr_level: cefr,
          plan: p?.plan || 'free',
          plan_expires_at: p?.plan_expires_at || null,
          joined_at: joinedAt || null,
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
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Teacher API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
