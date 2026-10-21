export interface ServerClassroomDto {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  teacherId: string;
  studentCount: number;
  createdAt: string;
}
