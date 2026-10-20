import React from 'react';
import { Button, Card, Col, Progress, Row, Skeleton, Space, Statistic, Tag, Typography, theme } from 'antd';
import {
  FireFilled,
  FormOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { CertLevel } from '@/types/enums/CertLevel';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

interface RoadmapMetricsOverviewProps {
  /** Target certification or level ID. */
  levelId: RoadmapLevelId | string;
  /** Active track. */
  track: RoadmapTrackType;
  /** Overall completion percentage. */
  completionPercent: number;
  /** Number of steps completed out of total. */
  completedCount: number;
  /** Total steps count. */
  totalCount: number;
  /** User streak in days. */
  streakDays: number;
  /** Total user XP. */
  totalXp: number;
  /** Whether data is loading from the server. */
  isLoading?: boolean;
  /** Callback to trigger placement test modal. */
  onOpenPlacementModal: () => void;
}

/**
 * Metric summary card cluster showcasing active level progress, completion percentage,
 * streak, and diagnostic test launcher with Skeleton reload feedback.
 */
export const RoadmapMetricsOverview: React.FC<RoadmapMetricsOverviewProps> = ({
  levelId,
  track,
  completionPercent,
  completedCount,
  totalCount,
  streakDays,
  totalXp,
  isLoading = false,
  onOpenPlacementModal,
}) => {
  const { token } = theme.useToken();

  return (
    <Card
      style={{
        marginBottom: 24,
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={10}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Cấp độ hiện tại:
                </Typography.Title>
                <CertLevelTag level={(levelId as CertLevel) || CertLevel.B1} />
                <Tag color="purple">{String(track).toUpperCase()}</Tag>
              </div>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Tiến độ hoàn thành: {completedCount} / {totalCount} chặng học
              </Typography.Text>
              <Progress
                percent={completionPercent}
                strokeColor={{ '0%': '#4f46e5', '100%': '#10b981' }}
                status="active"
              />
            </Space>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Statistic
              title="Chuỗi ngày Streak"
              value={streakDays}
              prefix={<FireFilled style={{ color: '#ef4444' }} />}
              suffix="ngày"
              valueStyle={{ color: '#dc2626', fontWeight: 700 }}
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Statistic
              title="Kinh nghiệm (XP)"
              value={totalXp}
              prefix={<ThunderboltFilled style={{ color: '#eab308' }} />}
              valueStyle={{ color: '#ca8a04', fontWeight: 700 }}
            />
          </Col>

          <Col xs={24} sm={12} md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              icon={<FormOutlined />}
              onClick={onOpenPlacementModal}
              style={{ width: '100%', minHeight: 40 }}
            >
              Đánh giá Đầu vào
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};
