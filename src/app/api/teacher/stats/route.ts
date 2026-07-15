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

    // 1. Get classrooms
    const { data: classrooms, error: classErr } = await supabase
      .from('classrooms')
      .select('*, enrollments(count)')
      .eq('teacher_id', auth.userId)
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

      // Map to include TESOL metrics (Simulated based on pedagogical heuristics for this prototype)
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

        return {
          ...s,
          active_vms: activeVms,
          communicative_depth: depth,
          cefr_level: cefr
        };
      });
    }

    return NextResponse.json(
      {
        success: true,
        classrooms: enriched,
        students,
      },
      {
        headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=40' },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Teacher API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
