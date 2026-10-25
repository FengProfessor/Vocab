import React from 'react';
import { Avatar, Dropdown, Tag, Typography } from '@/components/ui/Primitives';
import type { MenuProps } from '@/components/ui/Primitives';
import {
  CheckOutlined,
  DownOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@/components/ui/Icons';
import { THEME_MODE_OPTIONS } from '@/config/themeModeOptions';
import styles from '@/components/layout/ProfileDropdown.module.css';
import { ProfileDropdownProps } from '@/components/types/ProfileDropdownProps';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppTheme } from '@/theme/ThemeContext';

/**
 * Header profile menu: account summary, profile dialog, appearance (light / dark / system),
 * server session and sign-out.
 */
export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onOpenProfile, onOpenSession }) => {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { mode, setThemeMode } = useAppTheme();

  const items: MenuProps['items'] = [
    {
      key: 'account',
      disabled: true,
      label: (
        <div className={styles.info}>
          <Typography.Text strong className={styles.infoName}>
            {user?.fullName}
          </Typography.Text>
          <Typography.Text type="secondary" className={styles.infoEmail}>
            {user?.email}
          </Typography.Text>
          <div>
            <Tag color="geekblue">{user?.role}</Tag>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: 'Hồ sơ & mục tiêu học tập', onClick: onOpenProfile },
    {
      key: 'appearance',
      label: 'Giao diện',
      children: THEME_MODE_OPTIONS.map((option) => ({
        key: option.mode,
        icon: option.icon,
        onClick: () => setThemeMode(option.mode),
        label: (
          <span className={styles.optionRow}>
            <span>{option.label}</span>
            {mode === option.mode && <CheckOutlined className={styles.check} />}
          </span>
        ),
      })),
    },
    { type: 'divider' },
    { key: 'session', icon: <SafetyCertificateOutlined />, label: 'Phiên Server & liên kết', onClick: onOpenSession },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, danger: true, label: 'Đăng xuất', onClick: signOut },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <div className={styles.trigger}>
        <Avatar size="small" className={styles.avatar} icon={<UserOutlined />} />
        <Typography.Text strong className={styles.name}>
          {user?.fullName}
        </Typography.Text>
        <DownOutlined className={styles.caret} />
      </div>
    </Dropdown>
  );
};
