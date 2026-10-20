import React, { useState } from 'react';
import {
  Avatar,
  Dropdown,
  Layout,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  CheckOutlined,
  DesktopOutlined,
  DownOutlined,
  FireFilled,
  LogoutOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SunOutlined,
  ThunderboltFilled,
  UserOutlined,
} from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { AccountLinkingModal } from '@/features/auth/AccountLinkingModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppTheme } from '@/theme/ThemeContext';
import { ThemeMode } from '@/theme/ThemeMode';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Top navigation header bar displaying target certificate selection, streak, XP,
 * and user profile dropdown incorporating theme preferences (Light/Dark/System) and sign-out.
 */
export const TopHeaderBar: React.FC = () => {
  const { token } = theme.useToken();
  const { mode, setThemeMode } = useAppTheme();
  const { user, setTargetCertLevel, signOut } = useAuthStore();
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
            {user?.fullName ?? 'Học viên LingoPro'}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email ?? 'student@lingopro.online'}
          </Typography.Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="geekblue">{user?.role ?? 'Học viên'}</Tag>
          </div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'theme-group',
      label: 'Giao diện',
      children: [
        {
          key: ThemeMode.Light,
          icon: <SunOutlined />,
          label: (
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Giao diện Sáng</span>
              {mode === ThemeMode.Light && <CheckOutlined style={{ color: token.colorPrimary }} />}
            </Space>
          ),
          onClick: () => setThemeMode(ThemeMode.Light),
        },
        {
          key: ThemeMode.Dark,
          icon: <MoonOutlined />,
          label: (
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Giao diện Tối</span>
              {mode === ThemeMode.Dark && <CheckOutlined style={{ color: token.colorPrimary }} />}
            </Space>
          ),
          onClick: () => setThemeMode(ThemeMode.Dark),
        },
        {
          key: ThemeMode.System,
          icon: <DesktopOutlined />,
          label: (
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Theo hệ thống</span>
              {mode === ThemeMode.System && <CheckOutlined style={{ color: token.colorPrimary }} />}
            </Space>
          ),
          onClick: () => setThemeMode(ThemeMode.System),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'server-session',
      icon: <SafetyCertificateOutlined />,
      label: 'Phiên Server & Liên kết',
      onClick: () => setAccountModalOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Đăng xuất',
      onClick: () => signOut(),
    },
  ];

  return (
    <>
      <Layout.Header
        style={{
          background: token.colorBgContainer,
          padding: '0 24px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <Space size={16}>
          <Typography.Text strong style={{ fontSize: 15, color: token.colorText }}>
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

          <Tag color="volcano" icon={<FireFilled />} style={{ fontWeight: 700, margin: 0 }}>
            {user?.streakDays ?? 14} ngày Streak
          </Tag>

          <Tag color="gold" icon={<ThunderboltFilled />} style={{ fontWeight: 700, margin: 0 }}>
            {(user?.totalXp ?? 4850).toLocaleString('vi-VN')} XP
          </Tag>

          <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
            <Space
              size={8}
              style={{
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
                transition: 'background 0.2s',
              }}
            >
              <Avatar size="small" style={{ backgroundColor: token.colorPrimary }} icon={<UserOutlined />} />
              <Typography.Text strong style={{ fontSize: 13, color: token.colorText }}>
                {user?.fullName ?? 'Học viên LingoPro'}
              </Typography.Text>
              <DownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
            </Space>
          </Dropdown>
        </Space>
      </Layout.Header>

      <AccountLinkingModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
    </>
  );
};
