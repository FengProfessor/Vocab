import React from 'react';
import { Button, Card, Empty, Skeleton, Space, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { AdminPilotLeadDto } from '@/types/admin/AdminPilotLeadDto';
import { PilotLeadStatus } from '@/types/enums/PilotLeadStatus';

interface AdminPilotLeadsTableProps {
  /** Array of registered pilot leads. */
  leads: AdminPilotLeadDto[];
  /** Pending orders count. */
  pendingCount: number;
  /** Whether data is loading from the server. */
  isLoading?: boolean;
  /** Callback to activate a 60-day pilot account. */
  onActivateLead: (id: string) => void;
  /** Callback to view lead details. */
  onSelectLead: (lead: AdminPilotLeadDto) => void;
}

/**
 * Interactive management table for B2B teacher pilot applications.
 * Displays professional Skeleton states during data reloading.
 */
export const AdminPilotLeadsTable: React.FC<AdminPilotLeadsTableProps> = ({
  leads,
  pendingCount,
  isLoading = false,
  onActivateLead,
  onSelectLead,
}) => {
  const { token } = theme.useToken();

  const columns: ColumnsType<AdminPilotLeadDto> = [
    {
      title: 'Giáo viên / Người đăng ký',
      dataIndex: 'teacherName',
      key: 'teacherName',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Đơn vị / Trung tâm',
      dataIndex: 'organization',
      key: 'organization',
    },
    {
      title: 'Quy mô học sinh',
      dataIndex: 'studentScale',
      key: 'studentScale',
    },
    {
      title: 'Trạng thái CRM',
      dataIndex: 'status',
      key: 'status',
      render: (status: PilotLeadStatus) => {
        const color =
          status === PilotLeadStatus.ActivePilot
            ? 'success'
            : status === PilotLeadStatus.Contacted
              ? 'processing'
              : 'warning';
        return <Tag color={color}>{String(status).toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size={8}>
          <Button
            size="small"
            type="primary"
            disabled={record.status === PilotLeadStatus.ActivePilot}
            icon={<CheckCircleOutlined />}
            onClick={() => onActivateLead(record.id)}
          >
            Kích hoạt Pilot
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onSelectLead(record)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <span>Danh Sách Đăng Ký Chương Trình Giáo Viên Tiên Phong (60 Ngày)</span>
          <Tag color="gold">{pendingCount} đơn chờ duyệt</Tag>
        </Space>
      }
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : leads.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có hồ sơ đối tác giáo viên nào (Đang chờ đồng bộ từ API)"
        />
      ) : (
        <Table<AdminPilotLeadDto>
          rowKey="id"
          columns={columns}
          dataSource={leads}
          pagination={{ pageSize: 5 }}
        />
      )}
    </Card>
  );
};
