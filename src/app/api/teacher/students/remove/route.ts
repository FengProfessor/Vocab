import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, forbidden, isValidString, safeErrorResponse } from '@/lib/api-security';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const classroomId = typeof body.classroomId === 'string' ? body.classroomId.trim() : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';

    if (!isValidString(classroomId, 60) || !isValidString(studentId, 60)) {
      return NextResponse.json(
        { success: false, error: 'classroomId and studentId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Verify classroom ownership
    const { data: classroom, error: classErr } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', classroomId)
      .maybeSingle();

    if (classErr) throw classErr;
    if (!classroom || classroom.teacher_id !== auth.userId) {
      return forbidden('Bạn không có quyền quản lý lớp học này');
    }

    // 2. Remove enrollment
    const { error: deleteErr } = await supabase
      .from('enrollments')
      .delete()
      .eq('classroom_id', classroomId)
      .eq('student_id', studentId);

    if (deleteErr) throw deleteErr;

    return NextResponse.json({
      success: true,
      message: 'Đã xóa học sinh khỏi lớp thành công',
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Không thể xóa học sinh khỏi lớp');
  }
}
