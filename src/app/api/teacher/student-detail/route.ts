import { getAuthUser, unauthorized } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const classroomId = searchParams.get('classroomId');

    if (!studentId || !classroomId) {
      return NextResponse.json({ success: false, error: 'Missing studentId or classroomId' }, { status: 400 });
    }

    const supabase = createServiceClient();

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

    // 1. Fetch current student progress
    const { data: current, error: curErr } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .maybeSingle();

    if (curErr) throw curErr;
    if (!current) {
      return NextResponse.json({ success: false, error: 'Học sinh không tồn tại trong lớp này' }, { status: 404 });
    }

    // 2. Parallel fetch history, quizzes, profile, and enrollment
    const [historyRes, quizzesRes, profileRes, enrollmentRes] = await Promise.all([
      supabase
        .from('student_daily_stats')
        .select('recorded_at, vms, lcs')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .order('recorded_at', { ascending: true })
        .limit(30),
      supabase
        .from('quiz_results')
        .select('completed_at, score, total_questions, accuracy')
        .eq('user_id', studentId)
        .eq('classroom_id', classroomId)
        .order('completed_at', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', studentId)
        .maybeSingle(),
      supabase
        .from('enrollments')
        .select('joined_at')
        .eq('student_id', studentId)
        .eq('classroom_id', classroomId)
        .maybeSingle(),
    ]);

    // Compute TESOL metrics & CEFR level identical to stats route
    const accuracy = current.avg_quiz_accuracy || 0;
    const vms = current.vms || 0;
    const words = current.words_reviewed || current.total_words || 0;
    const activeVms = Math.round(vms * (0.6 + (accuracy * 0.4)));
    const depth = Math.round((vms + (current.lcs || 0)) / 2);

    let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
    if (words >= 1000) cefr = 'C2';
    else if (words >= 600) cefr = 'C1';
    else if (words >= 300) cefr = 'B2';
    else if (words >= 150) cefr = 'B1';
    else if (words >= 50) cefr = 'A2';

    const enrichedCurrent = {
      ...current,
      words_reviewed: words,
      active_vms: activeVms,
      communicative_depth: depth,
      cefr_level: cefr,
      plan: profileRes.data?.plan || 'free',
      plan_expires_at: profileRes.data?.plan_expires_at || null,
      joined_at: enrollmentRes.data?.joined_at || null,
    };

    return NextResponse.json({
      success: true,
      current: enrichedCurrent,
      history: historyRes.data || [],
      quizzes: quizzesRes.data || [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Student Detail API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
