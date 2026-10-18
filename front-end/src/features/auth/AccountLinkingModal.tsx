import React from 'react';
import { Alert, Button, Descriptions, Modal, Space, Tag, Typography } from 'antd';
import { CheckCircleFilled, LogoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthProviderType } from '@/types/enums/AuthProviderType';

/**
 * Props for the AccountLinkingModal component.
 */
interface AccountLinkingModalProps {
  /** Whether the modal dialog is visible. */
  open: boolean;
  /** Callback invoked when the modal is closed. */
  onClose: () => void;
}

/**
 * Read-only view of the signed-in session. The SPA performs no authentication operation: signing in,
 * Google linking and sign-out are all owned by the server, so the only action here hands the browser to it.
 */
export const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({ open, onClose }) => {
  const { user, signOut } = useAuthStore();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: '#4f46e5' }} />
          <span>Phiên đăng nhập</span>
        </Space>
      }
      width={600}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleFilled />}
          message="Đã xác thực bởi máy chủ (HttpOnly cookie)"
          description="Đăng nhập, đăng ký và ủy quyền Google đều thực hiện tại máy chủ. Ứng dụng này chỉ dùng cookie phiên và tự gia hạn khi hết hạn."
        />

        {user && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID học viên">{user.id}</Descriptions.Item>
            <Descriptions.Item label="Họ và tên">{user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Phương thức xác thực">
              <Tag color="blue">
                {user.authProvider === AuthProviderType.Google ? 'Google (máy chủ)' : 'Email (máy chủ)'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Chuỗi ngày học & XP">
              <Tag color="volcano">{user.streakDays} ngày Streak</Tag>
              <Tag color="gold">{user.totalXp.toLocaleString('vi-VN')} XP</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button danger type="primary" icon={<LogoutOutlined />} onClick={() => signOut()}>
            Đăng xuất
          </Button>
        </div>

        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Nhấn &ldquo;Đăng xuất&rdquo; sẽ chuyển trình duyệt sang máy chủ để xóa cookie và hiển thị trang đăng nhập.
        </Typography.Text>
      </Space>
    </Modal>
  );
};
