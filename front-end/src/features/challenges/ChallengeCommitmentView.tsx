import React from 'react';
import { Button, Card, Col, Empty, Row, Skeleton, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { ChallengeCard } from '@/features/challenges/components/ChallengeCard';
import { useChallengesQuery } from '@/hooks/challenges/useChallengesQuery';
import { useJoinChallenge } from '@/hooks/challenges/useJoinChallenge';

/**
 * Commitment challenges: open campaigns from GET /challenges and enrollment through POST /challenges/{id}/join.
 */
export const ChallengeCommitmentView: React.FC = () => {
  const challengesQuery = useChallengesQuery();
  const joinChallenge = useJoinChallenge();
  const challenges = challengesQuery.data ?? [];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 13 • COMMITMENT CHALLENGES"
        title="Thử Thách Cam Kết Kỷ Luật"
        subtitle="Tham gia chiến dịch học đều mỗi ngày với quỹ cam kết; danh sách được tải từ máy chủ."
        extra={
          <Button
            icon={<SyncOutlined spin={challengesQuery.isFetching} />}
            loading={challengesQuery.isFetching}
            onClick={() => void challengesQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      {challengesQuery.isLoading ? (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
        </Row>
      ) : challenges.length === 0 ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Hiện chưa có thử thách nào đang mở." />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={16} className="lp-full-width">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isJoining={joinChallenge.isPending && joinChallenge.variables === challenge.id}
                  onJoin={(challengeId) => joinChallenge.mutate(challengeId)}
                />
              ))}
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};
