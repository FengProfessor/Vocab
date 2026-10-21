import React from 'react';
import { Button, Card, Col, Progress, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd';
import { FireFilled, FormOutlined, ThunderboltFilled } from '@ant-design/icons';
import { ROADMAP_LEVEL_LABEL } from '@/config/roadmapLevels';
import styles from '@/features/roadmap/components/RoadmapMetricsOverview.module.css';
import { RoadmapMetricsOverviewProps } from '@/features/roadmap/types/RoadmapMetricsOverviewProps';
import { EnumParser } from '@/lib/enumParser';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';

/**
 * Summary of the active track: current level, completion progress, streak, XP and the placement launcher.
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
  const level = levelId ? EnumParser.parse(RoadmapLevelId, levelId, RoadmapLevelId.A0) : null;

  return (
    <Card className={styles.card}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={10}>
            <Space direction="vertical" size={10} className="lp-full-width">
              <div className={styles.titleRow}>
                <Typography.Title level={4} className={styles.title}>
                  Cấp độ hiện tại:
                </Typography.Title>
                <Tag color={level ? 'blue' : 'default'}>
                  {level ? ROADMAP_LEVEL_LABEL[level] : 'Chưa ghi danh'}
                </Tag>
                <Tag color="purple">{track.toUpperCase()}</Tag>
              </div>
              <Typography.Text type="secondary" className={styles.detail}>
                Tiến độ hoàn thành: {completedCount} / {totalCount} chặng học
              </Typography.Text>
              <Progress percent={completionPercent} status="active" />
            </Space>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Statistic
              title="Chuỗi ngày Streak"
              value={streakDays}
              suffix="ngày"
              prefix={<FireFilled className={styles.streakIcon} />}
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Statistic
              title="Kinh nghiệm (XP)"
              value={totalXp}
              prefix={<ThunderboltFilled className={styles.xpIcon} />}
            />
          </Col>

          <Col xs={24} sm={12} md={4} className={styles.placementCol}>
            <Button
              type="primary"
              icon={<FormOutlined />}
              className={styles.placementButton}
              onClick={onOpenPlacementModal}
            >
              Chọn cấp độ
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};
