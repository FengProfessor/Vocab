import React, { useState } from 'react';
import { Avatar, Button, Layout, Select, Space, Tag, Tooltip, Typography } from 'antd';
import {
  FireFilled,
  LogoutOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { AccountLinkingModal } from '@/features/auth/AccountLinkingModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { CertLevel } from '@/types/enums/CertLevel';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Top navigation header bar displaying user streak, XP, target VSTEP band, RBAC switcher,
 * server session modal, and server-side logout action.
 */
export const TopHeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchRole, setTargetCertLevel, signOut } = useAuthStore();
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);

  const handleRoleChange = (nextRole: UserRole): void => {
    switchRole(nextRole);
    if (nextRole === UserRole.Teacher) {
      navigate('/teacher');
    } else if (nextRole === UserRole.Admin) {
      navigate('/admin');
    } else {
      navigate('/app');
    }
  };

  return (
    <>
      <Layout.Header
        style={{
          background: '#ffffff',
          padding: '0 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <Space size={16}>
          <Typography.Text strong style={{ fontSize: 15 }}>
            Không gian học tập thông minh LingoPro (.NET 10 + React 19)
          </Typography.Text>
          {user && <CertLevelTag level={user.targetCertLevel} />}
        </Space>

        <Space size={14} wrap>
          <Tooltip title="Mục tiêu chứng chỉ VSTEP / CEFR">
            <Select<CertLevel>
              size="small"
              value={user?.targetCertLevel ?? CertLevel.B2}
              onChange={(level) => setTargetCertLevel(level)}
              options={[
                { value: CertLevel.B1, label: 'Mục tiêu: VSTEP B1' },
                { value: CertLevel.B2, label: 'Mục tiêu: VSTEP B2' },
                { value: CertLevel.C1, label: 'Mục tiêu: VSTEP C1' },
              ]}
              style={{ width: 155 }}
            />
          </Tooltip>

          <Tooltip title="Chuyển đổi phân quyền RBAC (Học viên / Giáo viên / Quản trị viên)">
            <Select<UserRole>
              size="small"
              value={user?.role ?? UserRole.Student}
              onChange={handleRoleChange}
              options={[
                { value: UserRole.Student, label: 'Vai trò: Học viên' },
                { value: UserRole.Teacher, label: 'Vai trò: Giáo viên' },
                { value: UserRole.Admin, label: 'Vai trò: Quản trị' },
              ]}
              style={{ width: 155 }}
            />
          </Tooltip>

          <Tag color="volcano" icon={<FireFilled />} style={{ fontWeight: 700, margin: 0 }}>
            {user?.streakDays ?? 14} ngày Streak
          </Tag>

          <Tag color="gold" icon={<ThunderboltFilled />} style={{ fontWeight: 700, margin: 0 }}>
            {(user?.totalXp ?? 4850).toLocaleString('vi-VN')} XP
          </Tag>

          <Space
            size={8}
            style={{ cursor: 'pointer' }}
            onClick={() => setAccountModalOpen(true)}
          >
            <Avatar size="small" style={{ backgroundColor: '#4f46e5' }} icon={<UserOutlined />} />
            <Typography.Text strong style={{ fontSize: 13 }}>
              {user?.fullName ?? 'Học viên LingoPro'}
            </Typography.Text>
          </Space>

          <Button
            size="small"
            icon={<SafetyCertificateOutlined />}
            onClick={() => setAccountModalOpen(true)}
          >
            Phiên Server
          </Button>

          <Button
            size="small"
            danger
            icon={<LogoutOutlined />}
            onClick={() => signOut()}
          >
            Đăng xuất
          </Button>
        </Space>
      </Layout.Header>

      <AccountLinkingModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
};
