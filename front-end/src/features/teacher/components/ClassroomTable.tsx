import React from 'react';
import { Button, Card, Empty, Skeleton, Space, Table, Tag, Tooltip, Typography } from '@/components/ui/Primitives';
import type { ColumnsType } from '@/components/ui/Primitives';
import { BellOutlined, PlusOutlined } from '@/components/ui/Icons';
import styles from '@/features/teacher/components/ClassroomTable.module.css';
import { ClassroomTableProps } from '@/features/teacher/types/ClassroomTableProps';
import { ServerClassroomDto } from '@/types/teacher/ServerClassroomDto';

/**
 * Teacher's classrooms with invite codes and enrollment size.
 * TODO: [Backend API Required] GET /api/v1/classrooms/{id}/students (roster) and completion statistics
 * (legacy student_daily_stats); drill assignment needs a concrete StudentId, so the action stays disabled until then.
 */
export const ClassroomTable: React.FC<ClassroomTableProps> = ({
  classrooms,
  isLoading,
  onOpenCreateModal,
}) => {
  const columns: ColumnsType<ServerClassroomDto> = [
    {
      title: 'Tên lớp học',
      dataIndex: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          {record.description && <Typography.Text type="secondary">{record.description}</Typography.Text>}
        </Space>
      ),
    },
    {
      title: 'Mã mời',
      dataIndex: 'inviteCode',
      render: (code: string) => <Typography.Text copyable>{code}</Typography.Text>,
    },
    {
      title: 'Học viên',
      dataIndex: 'studentCount',
      render: (count: number) => <Tag color="geekblue">{count} học viên</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Giao bài',
      key: 'actions',
      render: () => (
        <Tooltip title="Cần API danh sách học viên của lớp để chọn người nhận bài (TODO).">
          <Button size="small" icon={<BellOutlined />} disabled>
            Giao bài FSRS
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      className={styles.card}
      title="Danh sách lớp học"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreateModal}>
          Tạo lớp mới
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : classrooms.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lớp học nào được tạo.">
          <Button type="primary" onClick={onOpenCreateModal}>
            Tạo lớp học đầu tiên
          </Button>
        </Empty>
      ) : (
        <Table<ServerClassroomDto>
          rowKey="id"
          columns={columns}
          dataSource={classrooms}
          pagination={{ pageSize: 5 }}
        />
      )}
    </Card>
  );
};
