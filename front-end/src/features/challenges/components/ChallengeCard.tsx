import React from 'react';
import { Button, Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from '@/components/ui/Primitives';
import { FireFilled, SafetyCertificateOutlined } from '@/components/ui/Icons';
import styles from '@/features/challenges/components/ChallengeCard.module.css';
import { ChallengeCardProps } from '@/features/challenges/types/ChallengeCardProps';

/**
 * One commitment challenge: schedule, daily target, enrollment progress, deposit and the join action.
 * TODO: [Backend API Required] reward choice at completion (cash refund vs. Pro extension) and per-learner progress.
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, isJoining, onJoin }) => {
  const enrolledPercent = Math.round(
    (challenge.currentParticipantsCount / Math.max(1, challenge.maxParticipants)) * 100
  );
  const isFull = challenge.currentParticipantsCount >= challenge.maxParticipants;

  return (
    <Card
      title={
        <Space>
          <FireFilled className={styles.flame} />
          <span>{challenge.title}</span>
        </Space>
      }
      extra={<Tag color="success">{String(challenge.status).toUpperCase()}</Tag>}
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <Typography.Paragraph className={styles.description}>{challenge.description}</Typography.Paragraph>
        <Typography.Text type="secondary">
          {challenge.startDate} → {challenge.endDate}
        </Typography.Text>

        <Row gutter={16}>
          <Col span={8}>
            <Statistic title="Mục tiêu mỗi ngày" value={challenge.dailyTargetWords} suffix="từ" />
          </Col>
          <Col span={8}>
            <Statistic
              title="Học viên tham gia"
              value={challenge.currentParticipantsCount}
              suffix={`/ ${challenge.maxParticipants}`}
            />
          </Col>
          <Col span={8}>
            <Statistic
              className={styles.fund}
              title="Quỹ cam kết"
              value={challenge.depositAmount.toLocaleString('vi-VN')}
              suffix="₫"
            />
          </Col>
        </Row>

        <Progress percent={enrolledPercent} status="active" />

        <Button
          type="primary"
          icon={<SafetyCertificateOutlined />}
          disabled={isFull}
          loading={isJoining}
          onClick={() => onJoin(challenge.id)}
        >
          {isFull ? 'Đã đủ người tham gia' : 'Tham gia thử thách'}
        </Button>
      </Space>
    </Card>
  );
};
