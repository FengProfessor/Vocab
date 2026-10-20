import React from 'react';
import { Button, Card, Space, Tag, Typography, theme } from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  LockOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapStepMetadataDto } from '@/types/roadmap/RoadmapStepMetadataDto';

interface RoadmapStepCardProps {
  /** Sequential index of the step (1-based). */
  stepNumber: number;
  /** Step metadata. */
  step: RoadmapStepMetadataDto;
  /** Whether completion mutation is loading. */
  isCompleting: boolean;
  /** Callback to mark step as completed via API. */
  onCompleteStep: (stepId: string) => void;
}

/**
 * Individual interactive roadmap milestone card presenting lesson overview,
 * duration, XP reward, and direct execution action.
 */
export const RoadmapStepCard: React.FC<RoadmapStepCardProps> = ({
  stepNumber,
  step,
  isCompleting,
  onCompleteStep,
}) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  const isCompleted = step.status === RoadmapStepStatus.Completed;
  const isLocked = step.status === RoadmapStepStatus.Locked;

  const renderStatusTag = (): React.ReactNode => {
    if (isCompleted) {
      return (
        <Tag color="success" icon={<CheckCircleFilled />}>
          Hoàn thành
        </Tag>
      );
    }
    if (isLocked) {
      return (
        <Tag icon={<LockOutlined />}>
          Chưa mở khóa
        </Tag>
      );
    }
    return (
      <Tag color="processing">
        Đang học
      </Tag>
    );
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        background: isCompleted ? token.colorFillAlter : token.colorBgContainer,
        borderColor: isCompleted ? token.colorSuccessBorder : token.colorBorderSecondary,
        opacity: isLocked ? 0.65 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Space size={14} align="start">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isCompleted ? token.colorSuccess : token.colorPrimary,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {isCompleted ? <CheckCircleFilled /> : stepNumber}
          </div>

          <div>
            <Space size={8} style={{ marginBottom: 4 }}>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {step.title}
              </Typography.Text>
              {renderStatusTag()}
            </Space>
            <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
              {step.description}
            </Typography.Text>
            <Space size={14} style={{ marginTop: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {step.estimatedMinutes} phút
              </Typography.Text>
              <Typography.Text style={{ fontSize: 12, color: '#ca8a04', fontWeight: 600 }}>
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

          {!isCompleted && !isLocked && (
            <Button
              loading={isCompleting}
              onClick={() => onCompleteStep(step.stepId)}
            >
              Đánh dấu xong
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};
