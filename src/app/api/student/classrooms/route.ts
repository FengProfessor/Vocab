import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';

/**
 * GET /api/student/classrooms
 * Returns all classrooms that the authenticated student is currently enrolled in,
 * with teacher info and enrollment date.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const supabase = createServiceClient();

    // 1. Fetch student enrollments
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('classroom_id, joined_at')
      .eq('student_id', auth.userId)
      .order('joined_at', { ascending: false });

    if (enrErr) throw enrErr;

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, classrooms: [] });
    }

    const classroomIds = enrollments.map((e) => e.classroom_id);

    // 2. Fetch classroom details (exclude __personal__)
    const { data: classRows, error: classErr } = await supabase
      .from('classrooms')
      .select('id, name, description, invite_code, teacher_id, created_at')
      .in('id', classroomIds)
      .neq('name', '__personal__');

    if (classErr) throw classErr;

    const teacherIds = [...new Set((classRows || []).map((c) => c.teacher_id).filter(Boolean))];
    const { data: teacherProfiles } = teacherIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, email').in('id', teacherIds)
      : { data: [] };

    const teacherMap = new Map((teacherProfiles || []).map((t) => [t.id, t]));
    const enrMap = new Map(enrollments.map((e) => [e.classroom_id, e.joined_at]));

    const enrichedClassrooms = (classRows || []).map((cls) => {
      const teacher = teacherMap.get(cls.teacher_id);
      return {
        id: cls.id,
        name: cls.name,
        description: cls.description,
        invite_code: cls.invite_code,
        joined_at: enrMap.get(cls.id) || null,
        teacher: {
          id: cls.teacher_id,
          name: teacher?.full_name || 'Giáo viên',
          email: teacher?.email || '',
        },
      };
    });

    return NextResponse.json({
      success: true,
      classrooms: enrichedClassrooms,
    });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Không thể tải danh sách lớp học');
  }
}
