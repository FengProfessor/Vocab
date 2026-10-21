import React from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  LockOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '@/features/roadmap/components/RoadmapStepCard.module.css';
import { RoadmapStepCardProps } from '@/features/roadmap/types/RoadmapStepCardProps';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';

/**
 * Roadmap station card: status, estimated duration, XP reward and the action to open or complete it.
 * Checkpoint / exam stations cannot be self-marked; they complete only after a scored attempt.
 */
export const RoadmapStepCard: React.FC<RoadmapStepCardProps> = ({
  stepNumber,
  step,
  isCompleting,
  onCompleteStep,
}) => {
  const navigate = useNavigate();
  const isCompleted = step.status === RoadmapStepStatus.Completed;
  const isLocked = step.status === RoadmapStepStatus.Locked;

  const cardClassName = [
    styles.card,
    isCompleted ? styles.cardCompleted : '',
    isLocked ? styles.cardLocked : '',
  ].join(' ');

  return (
    <Card className={cardClassName}>
      <div className={styles.content}>
        <Space size={14} align="start">
          <div className={`${styles.badge} ${isCompleted ? styles.badgeCompleted : ''}`}>
            {isCompleted ? <CheckCircleFilled /> : stepNumber}
          </div>
          <div>
            <Space size={8}>
              <Typography.Text strong className={styles.title}>
                {step.title}
              </Typography.Text>
              {isCompleted && <Tag color="success">Hoàn thành</Tag>}
              {isLocked && <Tag icon={<LockOutlined />}>Chưa mở khóa</Tag>}
              {!isCompleted && !isLocked && <Tag color="processing">Đang học</Tag>}
              {step.isCheckpointOrExam && <Tag color="gold">Kiểm tra ≥ 80%</Tag>}
            </Space>
            <Typography.Text type="secondary" className={styles.description}>
              {step.description}
            </Typography.Text>
            <Space size={14} className={styles.meta}>
              <Typography.Text type="secondary">
                <ClockCircleOutlined /> {step.estimatedMinutes} phút
              </Typography.Text>
              <Typography.Text className={styles.xp}>
                <ThunderboltFilled /> +{step.xpReward} XP
              </Typography.Text>
            </Space>
          </div>
        </Space>

        <Space wrap>
          <Button
            type="primary"
            disabled={isLocked}
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(step.actionRoute)}
          >
            Vào bài học
          </Button>
          {!isCompleted && !isLocked && !step.isCheckpointOrExam && (
            <Button loading={isCompleting} onClick={() => onCompleteStep(step)}>
              Đánh dấu xong
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};
