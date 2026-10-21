import React from 'react';
import { Alert, Avatar, Card, Space, Tag, Typography } from 'antd';
import { TrophyFilled, UserOutlined } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/social/components/WeeklyLeaderboardCard.module.css';
import { useGamificationStats } from '@/hooks/useGamificationStats';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Weekly leaderboard. Only the signed-in learner's real standing is shown for now.
 * TODO: [Backend API Required] GET /api/v1/social/leaderboard?period=week returning the ranked learners.
 */
export const WeeklyLeaderboardCard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { streakDays, totalXp } = useGamificationStats();

  return (
    <Card
      title={
        <Space>
          <TrophyFilled />
          <span>Bảng xếp hạng tuần</span>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        {user && (
          <div className={styles.row}>
            <Avatar className={styles.avatar} icon={<UserOutlined />} />
            <div>
              <Space>
                <Typography.Text strong className={styles.name}>
                  {user.fullName} (Bạn)
                </Typography.Text>
                <CertLevelTag level={user.targetCertLevel} />
              </Space>
              <Space>
                <Tag color="volcano">{streakDays} ngày Streak</Tag>
                <Tag color="gold">{totalXp.toLocaleString('vi-VN')} XP</Tag>
              </Space>
            </div>
          </div>
        )}
        <Alert
          type="info"
          showIcon
          message="Bảng xếp hạng toàn bộ học viên sẽ hiển thị khi backend cung cấp API xếp hạng."
        />
      </Space>
    </Card>
  );
};
