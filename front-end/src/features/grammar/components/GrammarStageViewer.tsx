import React, { useState } from 'react';
import { Alert, Button, Card, Descriptions, Slider, Space, Steps, Typography } from 'antd';
import { ExperimentOutlined, ReadOutlined } from '@ant-design/icons';
import { GRAMMAR_MASTERY_THRESHOLD } from '@/config/businessRules';
import styles from '@/features/grammar/components/GrammarStageViewer.module.css';
import { GrammarStageViewerProps } from '@/features/grammar/types/GrammarStageViewerProps';

/** Accuracy preselected on the slider before the learner reports a result. */
const INITIAL_ACCURACY_PERCENT = 80;

/**
 * Grammar topic panel: the 4-stage cycle, the practice-result recorder and the latest FSRS schedule.
 * TODO: [Backend API Required] GET /api/v1/grammar/topics/{slug}/theory and /exercises (theory + 3 exercise
 * types: multiple choice, fill blank, error correction) so accuracy is computed from real exercises
 * instead of being reported by the learner.
 */
export const GrammarStageViewer: React.FC<GrammarStageViewerProps> = ({
  topic,
  isSubmitting = false,
  lastResult,
  onSubmitAccuracy,
}) => {
  const [accuracy, setAccuracy] = useState<number>(INITIAL_ACCURACY_PERCENT);
  const isMastered = (lastResult?.masteryScore ?? 0) >= GRAMMAR_MASTERY_THRESHOLD;

  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <ReadOutlined />
          <span>{topic.titleVi ?? topic.title}</span>
        </Space>
      }
    >
      <Space direction="vertical" size={18} className="lp-full-width">
        <Steps
          size="small"
          current={isMastered ? 3 : lastResult ? 2 : 0}
          items={[
            { title: '1. Khám phá' },
            { title: '2. Luyện tập' },
            { title: '3. Kiểm tra' },
            { title: '4. Làm chủ' },
          ]}
        />

        <Alert
          type="info"
          showIcon
          message={`Chuyên đề: ${topic.title} (${topic.category})`}
          description="Lý thuyết và bài tập tương tác sẽ hiển thị tại đây khi backend cung cấp API nội dung."
        />

        <Card
          size="small"
          title={
            <Space>
              <ExperimentOutlined />
              <span>Ghi nhận kết quả luyện tập</span>
            </Space>
          }
        >
          <Space direction="vertical" size={12} className="lp-full-width">
            <Typography.Text>Độ chính xác của lần luyện tập: {accuracy}%</Typography.Text>
            <Slider
              className={styles.slider}
              min={0}
              max={100}
              value={accuracy}
              onChange={setAccuracy}
            />
            <Button
              type="primary"
              loading={isSubmitting}
              onClick={() => onSubmitAccuracy(topic.slug, accuracy)}
            >
              Ghi nhận kết quả
            </Button>
          </Space>
        </Card>

        {lastResult && (
          <div className={`${styles.result} ${isMastered ? styles.resultMastered : ''}`}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" title="Lịch ôn tập FSRS">
              <Descriptions.Item label="Độ thông thạo">
                {lastResult.masteryScore.toFixed(0)}%{isMastered ? ' — Đã làm chủ' : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{lastResult.state}</Descriptions.Item>
              <Descriptions.Item label="Chu kỳ tiếp theo">
                {lastResult.intervalDays} ngày
              </Descriptions.Item>
              <Descriptions.Item label="Ngày ôn lại">{lastResult.nextReviewDate}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Space>
    </Card>
  );
};
