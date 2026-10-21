import React, { useState } from 'react';
import { Layout, Select, Space, Tag, Tooltip, Typography } from 'antd';
import { FireFilled, ThunderboltFilled } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import styles from '@/components/layout/TopHeaderBar.module.css';
import { AccountLinkingModal } from '@/features/auth/AccountLinkingModal';
import { UserProfileModal } from '@/features/auth/components/UserProfileModal';
import { useGamificationStats } from '@/hooks/useGamificationStats';
import { useAuthStore } from '@/stores/useAuthStore';
import { CertLevel } from '@/types/enums/CertLevel';

/** Certificate targets selectable from the header. */
const TARGET_LEVEL_OPTIONS = [
  { value: CertLevel.B1, label: 'Mục tiêu: VSTEP B1' },
  { value: CertLevel.B2, label: 'Mục tiêu: VSTEP B2' },
  { value: CertLevel.C1, label: 'Mục tiêu: VSTEP C1' },
];

/**
 * Top bar: learning target, streak and XP of the signed-in learner, and the profile menu
 * (appearance, profile, server session, sign-out).
 */
export const TopHeaderBar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setTargetCertLevel = useAuthStore((state) => state.setTargetCertLevel);
  const { streakDays, totalXp } = useGamificationStats();

  const [sessionOpen, setSessionOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  return (
    <>
      <Layout.Header className={styles.header}>
        <Space size={16}>
          <Typography.Text strong className={styles.title}>
            Không gian học tập LingoPro
          </Typography.Text>
          {user && <CertLevelTag level={user.targetCertLevel} />}
        </Space>

        <Space size={14} wrap>
          <Tooltip title="Mục tiêu chứng chỉ VSTEP / CEFR">
            <Select<CertLevel>
              size="small"
              className={styles.select}
              value={user?.targetCertLevel}
              options={TARGET_LEVEL_OPTIONS}
              onChange={setTargetCertLevel}
            />
          </Tooltip>

          <Tag color="volcano" icon={<FireFilled />} className={styles.tag}>
            {streakDays} ngày Streak
          </Tag>
          <Tag color="gold" icon={<ThunderboltFilled />} className={styles.tag}>
            {totalXp.toLocaleString('vi-VN')} XP
          </Tag>

          <ProfileDropdown
            onOpenProfile={() => setProfileOpen(true)}
            onOpenSession={() => setSessionOpen(true)}
          />
        </Space>
      </Layout.Header>

      <AccountLinkingModal open={sessionOpen} onClose={() => setSessionOpen(false)} />
      <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
};
