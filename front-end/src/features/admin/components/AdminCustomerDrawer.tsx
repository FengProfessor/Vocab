import React from 'react';
import { Button, Descriptions, Drawer, Space, Tag, Typography, theme } from 'antd';
import { CheckCircleOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { AdminPilotLeadDto } from '@/types/admin/AdminPilotLeadDto';
import { PilotLeadStatus } from '@/types/enums/PilotLeadStatus';

interface AdminCustomerDrawerProps {
  /** The selected lead to display. Null if closed. */
  lead: AdminPilotLeadDto | null;
  /** Callback to close drawer. */
  onClose: () => void;
  /** Callback to approve/activate pilot. */
  onActivatePilot: (id: string) => void;
}

/**
 * Slide-out drawer presenting comprehensive teacher partner lead profile, contact info,
 * and immediate administrative onboarding actions.
 */
export const AdminCustomerDrawer: React.FC<AdminCustomerDrawerProps> = ({
  lead,
  onClose,
  onActivatePilot,
}) => {
  const { token } = theme.useToken();

  if (!lead) return null;

  return (
    <Drawer
      title="Hồ Sơ Giáo Viên Đối Tác Tiên Phong"
      open={Boolean(lead)}
      onClose={onClose}
      width={480}
      extra={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={lead.status === PilotLeadStatus.ActivePilot}
            onClick={() => {
              onActivatePilot(lead.id);
              onClose();
            }}
          >
            Kích hoạt Pilot 60 Ngày
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <div
          style={{
            padding: 16,
            background: token.colorFillAlter,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
            {lead.teacherName}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {lead.organization}
          </Typography.Text>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Mã hồ sơ">
            <code>{lead.id}</code>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái CRM">
            <Tag color={lead.status === PilotLeadStatus.ActivePilot ? 'success' : 'processing'}>
              {String(lead.status).toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Quy mô học sinh">
            <strong>{lead.studentScale}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Email liên hệ">
            <Space>
              <MailOutlined />
              <span>{lead.email ?? 'teacher@example.edu.vn'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <Space>
              <PhoneOutlined />
              <span>{lead.phone ?? '0987 654 321'}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Đặc quyền gói Pilot">
            60 ngày miễn phí Teacher Pro, quản lý tối đa 200 học viên, phân quyền bài tập tùy chỉnh.
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Drawer>
  );
};
