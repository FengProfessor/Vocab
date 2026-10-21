import React from 'react';
import { Card, Col, Row, Slider, Space, Statistic, Tag, Typography } from 'antd';
import { VSTEP_SKILLS } from '@/config/vstepSkills';
import styles from '@/features/exam-vstep/components/VstepScoreSliders.module.css';
import { VstepScoreSlidersProps } from '@/features/exam-vstep/types/VstepScoreSlidersProps';

/** Slider bounds and step of the official VSTEP 10-point scale. */
const SCORE_MIN = 0;
const SCORE_MAX = 10;
const SCORE_STEP = 0.5;

/**
 * Four-skill VSTEP calculator: sliders for each skill; the rounded score and CEFR band come from the
 * shared VstepScoreCalculator (Ministry of Education 0.5 rounding), not re-implemented here.
 */
export const VstepScoreSliders: React.FC<VstepScoreSlidersProps> = ({
  scores,
  result,
  onChangeScore,
}) => {
  return (
    <Card
      title="Bảng điểm 4 kỹ năng (thang 10.0)"
      className={styles.card}
      extra={<Tag color="geekblue">{String(result.achievedLevel)}</Tag>}
    >
      <Row gutter={[24, 20]} align="middle">
        <Col xs={24} md={16}>
          <Space direction="vertical" size={14} className="lp-full-width">
            {VSTEP_SKILLS.map((skill) => (
              <div key={skill.key}>
                <div className={styles.skillHeader}>
                  <Typography.Text strong>{skill.label}:</Typography.Text>
                  <Typography.Text strong className={styles.skillValue}>
                    {scores[skill.key].toFixed(1)} / {SCORE_MAX.toFixed(1)}
                  </Typography.Text>
                </div>
                <Slider
                  min={SCORE_MIN}
                  max={SCORE_MAX}
                  step={SCORE_STEP}
                  value={scores[skill.key]}
                  onChange={(value) => onChangeScore(skill.key, value)}
                />
              </div>
            ))}
          </Space>
        </Col>

        <Col xs={24} md={8}>
          <div className={styles.summary}>
            <Statistic
              title="Điểm tổng kết (quy tròn 0.5)"
              value={result.overallScore.toFixed(1)}
              suffix={`/ ${SCORE_MAX.toFixed(1)}`}
            />
            <Typography.Text type="secondary" className={styles.average}>
              Trung bình thực: {result.rawAverage.toFixed(2)}
            </Typography.Text>
            <Typography.Text className={styles.average}>{result.summaryVi}</Typography.Text>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
