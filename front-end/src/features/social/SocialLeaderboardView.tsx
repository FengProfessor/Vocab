import React from 'react';
import { Button, Col, Row } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { SocialReferralCard } from '@/features/social/components/SocialReferralCard';
import { StudyGroupsCard } from '@/features/social/components/StudyGroupsCard';
import { WeeklyLeaderboardCard } from '@/features/social/components/WeeklyLeaderboardCard';
import { useJoinStudyGroup } from '@/hooks/social/useJoinStudyGroup';
import { useReferralHubQuery } from '@/hooks/social/useReferralHubQuery';

/**
 * Social hub: leaderboard, study groups and referral program.
 */
export const SocialLeaderboardView: React.FC = () => {
  const hubQuery = useReferralHubQuery();
  const joinGroup = useJoinStudyGroup();

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 14 • STUDY GROUPS, LEADERBOARD & REFERRALS"
        title="Bảng Xếp Hạng, Nhóm Học Tập & Giới Thiệu Bạn Bè"
        subtitle="Thống kê giới thiệu và nhóm học được đồng bộ từ máy chủ."
        extra={
          <Button
            icon={<SyncOutlined spin={hubQuery.isFetching} />}
            loading={hubQuery.isFetching}
            onClick={() => void hubQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <WeeklyLeaderboardCard />
        </Col>
        <Col xs={24} lg={10}>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <StudyGroupsCard
                groups={hubQuery.data?.activeGroups ?? []}
                isJoining={joinGroup.isPending}
                onJoin={(inviteCode) => joinGroup.mutate(inviteCode)}
              />
            </Col>
            <Col span={24}>
              <SocialReferralCard hub={hubQuery.isLoading ? undefined : hubQuery.data} />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};
