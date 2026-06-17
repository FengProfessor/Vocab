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
      .single();

    if (curErr) throw curErr;

    // 2. Fetch history (last 30 days)
    const { data: history } = await supabase
      .from('student_daily_stats')
      .select('recorded_at, vms, lcs')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .order('recorded_at', { ascending: true })
      .limit(30);

    // 3. Fetch recent quiz results
    const { data: quizzes } = await supabase
      .from('quiz_results')
      .select('completed_at, score, total_questions, accuracy')
      .eq('user_id', studentId)
      .eq('classroom_id', classroomId)
      .order('completed_at', { ascending: true })
      .limit(10);

    return NextResponse.json({
      success: true,
      current,
      history: history || [],
      quizzes: quizzes || [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Student Detail API Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
