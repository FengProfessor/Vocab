import React from 'react';
import { Button, Card, Descriptions, Input, Space, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { VSTEP_ESSAY_MIN_CHARACTERS } from '@/config/vstepSkills';
import styles from '@/features/exam-vstep/components/VstepWritingGrader.module.css';
import { VstepWritingGraderProps } from '@/features/exam-vstep/types/VstepWritingGraderProps';

/**
 * AI essay grading for VSTEP Writing Task 2: the learner supplies the prompt and the essay;
 * the server returns four analytic criterion scores and Vietnamese feedback.
 * TODO: [Backend API Required] Writing prompt bank so the prompt can be chosen instead of typed.
 */
export const VstepWritingGrader: React.FC<VstepWritingGraderProps> = ({
  promptText,
  essayText,
  isEvaluating,
  evaluation,
  onChangePrompt,
  onChangeEssay,
  onEvaluate,
}) => {
  const canEvaluate = promptText.trim().length > 0 && essayText.trim().length >= VSTEP_ESSAY_MIN_CHARACTERS;

  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <RobotOutlined />
          <span>Chấm bài luận VSTEP Task 2 (AI)</span>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <div>
          <Typography.Text strong className={styles.fieldLabel}>
            Đề bài:
          </Typography.Text>
          <Input.TextArea
            rows={2}
            value={promptText}
            placeholder="Nhập đề bài Task 2..."
            onChange={(event) => onChangePrompt(event.target.value)}
          />
        </div>

        <div>
          <Typography.Text strong className={styles.fieldLabel}>
            Bài viết (tối thiểu {VSTEP_ESSAY_MIN_CHARACTERS} ký tự):
          </Typography.Text>
          <Input.TextArea
            rows={8}
            value={essayText}
            placeholder="Write your essay in English here..."
            onChange={(event) => onChangeEssay(event.target.value)}
          />
        </div>

        <div className={styles.footer}>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            disabled={!canEvaluate}
            loading={isEvaluating}
            onClick={onEvaluate}
          >
            Chấm bài & Phân tích tiêu chí
          </Button>
        </div>

        {evaluation && (
          <div className={styles.result}>
            <Typography.Title level={4} className={styles.overall}>
              Điểm tổng kết: {evaluation.overallScore.toFixed(1)} / 10.0
            </Typography.Title>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Task Achievement">
                {evaluation.taskAchievement.toFixed(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Coherence & Cohesion">
                {evaluation.coherenceAndCohesion.toFixed(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Lexical Resource">
                {evaluation.lexicalResource.toFixed(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Grammatical Range">
                {evaluation.grammaticalRange.toFixed(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Nhận xét chi tiết" span={2}>
                {evaluation.overallFeedbackVi}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Space>
    </Card>
  );
};
