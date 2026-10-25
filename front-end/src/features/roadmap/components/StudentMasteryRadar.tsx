import React from 'react';
import { Card, Col, Progress, Row, Space, Typography } from '@/components/ui/Primitives';
import { SKILL_MASTERY_DEFINITIONS } from '@/config/skillMasteryDefinitions';
import styles from '@/features/roadmap/components/StudentMasteryRadar.module.css';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { useStudyStore } from '@/stores/useStudyStore';
import { SkillMasteryItem } from '@/types/roadmap/SkillMasteryItem';

/**
 * Skill mastery overview. Vocabulary mastery is computed from the learner's real FSRS deck;
 * the other skills show "Chưa có dữ liệu" until the backend exposes them.
 * TODO: [Backend API Required] GET /api/v1/student/mastery for grammar, reading and listening mastery.
 */
export const StudentMasteryRadar: React.FC = () => {
  const words = useStudyStore((state) => state.words);

  const vocabPercent =
    words.length === 0
      ? null
      : Math.round(
          words.reduce(
            (sum, w) => sum + FsrsEngine.getStrengthPercent(w.repetitions, w.easeFactor, w.stability),
            0
          ) / words.length
        );

  const items: SkillMasteryItem[] = SKILL_MASTERY_DEFINITIONS.map((definition) => ({
    ...definition,
    percent: definition.key === 'vocab' ? vocabPercent : null,
  }));

  return (
    <Card title="Độ thành thạo các kỹ năng cốt lõi" className={styles.card}>
      <Row gutter={[24, 20]}>
        {items.map((item) => (
          <Col xs={24} sm={12} key={item.key}>
            <Space direction="vertical" size={6} className="lp-full-width">
              <div className={styles.rowHeader}>
                <Space size={8}>
                  {item.icon}
                  <Typography.Text strong>{item.name}</Typography.Text>
                </Space>
                {item.percent === null ? (
                  <Typography.Text type="secondary">Chưa có dữ liệu</Typography.Text>
                ) : (
                  <Typography.Text strong className={styles.percent}>
                    {item.percent}%
                  </Typography.Text>
                )}
              </div>
              <Progress percent={item.percent ?? 0} showInfo={false} size="small" />
            </Space>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
