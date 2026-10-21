import React from 'react';
import { Card, Empty, Skeleton, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styles from '@/features/admin/components/AdminPilotLeadsTable.module.css';
import { AdminPilotLeadsTableProps } from '@/features/admin/types/AdminPilotLeadsTableProps';
import { AdminPilotLeadDto } from '@/types/admin/AdminPilotLeadDto';

const COLUMNS: ColumnsType<AdminPilotLeadDto> = [
  {
    title: 'Giáo viên / Người đăng ký',
    dataIndex: 'teacherName',
    render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
  },
  { title: 'Đơn vị / Trung tâm', dataIndex: 'organization' },
  { title: 'Quy mô', dataIndex: 'studentScale' },
  {
    title: 'Trạng thái CRM',
    dataIndex: 'status',
    render: (status: AdminPilotLeadDto['status']) => <Tag>{String(status).toUpperCase()}</Tag>,
  },
];

/**
 * Teacher pilot leads table.
 * TODO: [Backend API Required] GET /api/v1/admin/leads (list) and PATCH /api/v1/admin/leads/{id}/status
 * (activate the 60-day pilot). Only the aggregate counter exists today, so the table stays empty.
 */
export const AdminPilotLeadsTable: React.FC<AdminPilotLeadsTableProps> = ({
  leads,
  pendingCount,
  isLoading = false,
}) => {
  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <span>Đăng ký Chương trình Giáo viên Tiên phong (60 ngày)</span>
          <Tag color="gold">{pendingCount} đơn chờ duyệt</Tag>
        </Space>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : leads.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Danh sách hồ sơ đối tác sẽ hiển thị khi backend cung cấp API liệt kê leads."
        />
      ) : (
        <Table<AdminPilotLeadDto>
          rowKey="id"
          columns={COLUMNS}
          dataSource={leads}
          pagination={{ pageSize: 5 }}
        />
      )}
    </Card>
  );
};
