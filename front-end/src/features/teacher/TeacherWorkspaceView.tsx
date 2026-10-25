import React, { useState } from 'react';
import { Button } from '@/components/ui/Primitives';
import { SyncOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { ClassroomTable } from '@/features/teacher/components/ClassroomTable';
import { CreateClassroomModal } from '@/features/teacher/components/CreateClassroomModal';
import { TeacherMetricsCard } from '@/features/teacher/components/TeacherMetricsCard';
import { useClassroomsQuery } from '@/hooks/teacher/useClassroomsQuery';
import { useCreateClassroom } from '@/hooks/teacher/useCreateClassroom';

/**
 * Teacher workspace (B2B): classrooms from GET /classrooms and creation through POST /classrooms.
 */
export const TeacherWorkspaceView: React.FC = () => {
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const classroomsQuery = useClassroomsQuery();
  const createClassroom = useCreateClassroom(() => setCreateOpen(false));

  const classrooms = classroomsQuery.data ?? [];
  const totalStudents = classrooms.reduce((sum, classroom) => sum + classroom.studentCount, 0);

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 11 • TEACHER PORTAL"
        title="Cổng Quản Lý Lớp Học Giảng Viên"
        subtitle="Tạo lớp, chia sẻ mã mời và theo dõi số lượng học viên."
        extra={
          <Button
            icon={<SyncOutlined spin={classroomsQuery.isFetching} />}
            loading={classroomsQuery.isFetching}
            onClick={() => void classroomsQuery.refetch()}
          >
            Đồng bộ từ Server
          </Button>
        }
      />

      <TeacherMetricsCard
        totalClassrooms={classrooms.length}
        totalStudents={totalStudents}
        isLoading={classroomsQuery.isLoading}
      />

      <ClassroomTable
        classrooms={classrooms}
        isLoading={classroomsQuery.isLoading}
        onOpenCreateModal={() => setCreateOpen(true)}
      />

      <CreateClassroomModal
        open={createOpen}
        isSubmitting={createClassroom.isPending}
        onClose={() => setCreateOpen(false)}
        onCreate={(name, description) => createClassroom.mutate({ name, description })}
      />
    </div>
  );
};
