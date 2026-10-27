/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MappedClassroomItem {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  teacher_id: string;
  enrollment_count: number;
  created_at: string;
  [key: string]: any;
}

/**
 * Maps `.NET 10` `ClassroomDto[]` items into the classroom list shape expected by teacher and student views.
 */
export function mapClassroomsList(items: Record<string, any>[] | null | undefined) {
  const safeList = Array.isArray(items) ? items : [];
  const list: MappedClassroomItem[] = safeList.map((c) => ({
    id: String(c.id ?? ''),
    name: String(c.name ?? ''),
    description: String(c.description ?? ''),
    invite_code: String(c.inviteCode || c.invite_code || ''),
    teacher_id: String(c.teacherId || c.teacher_id || ''),
    enrollment_count: Number(c.studentCount ?? c.enrollment_count ?? 0),
    created_at: String(c.createdAt || c.created_at || new Date().toISOString()),
  }));
  return {
    success: true,
    data: list as any[],
    classrooms: list as any[],
  };
}
