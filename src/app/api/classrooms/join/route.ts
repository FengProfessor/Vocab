import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    // Xác thực user từ token
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { inviteCode?: string };
    const inviteCode = body.inviteCode?.trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ success: false, error: 'inviteCode is required' }, { status: 400 });
    }

    // 1. Lookup classroom by invite_code
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name, description, invite_code, created_at, teacher_id')
      .eq('invite_code', inviteCode)
      .single();

    if (classroomError || !classroom) {
      return NextResponse.json({ success: false, error: 'Classroom not found' }, { status: 404 });
    }

    // 2. Check not already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('classroom_id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already enrolled in this classroom' }, { status: 409 });
    }

    // 3. Insert into enrollments
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({ classroom_id: classroom.id, student_id: user.id });

    if (enrollError) {
      console.error('[Join] Enroll error:', enrollError.message);
      return NextResponse.json({ success: false, error: 'Failed to join classroom' }, { status: 500 });
    }

    const { count: enrollmentCount, error: countError } = await supabase
      .from('enrollments')
      .select('student_id', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id);
    if (countError) console.error('[Join] Enrollment count error:', countError.message);

    return NextResponse.json({
      success: true,
      data: { ...classroom, enrollment_count: countError ? null : enrollmentCount },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Join] Unexpected error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
