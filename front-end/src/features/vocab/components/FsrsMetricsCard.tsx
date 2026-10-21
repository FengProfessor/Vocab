import React from 'react';
import { Card, Descriptions, Progress } from 'antd';
import { FsrsMetricsCardProps } from '@/features/vocab/types/FsrsMetricsCardProps';
import { FsrsEngine } from '@/lib/fsrsEngine';

/** Minimum values keeping R(t) numerically stable for brand-new cards. */
const MIN_ELAPSED_DAYS = 1;
const MIN_STABILITY_DAYS = 0.5;

/**
 * Read-only panel showing the FSRS v5 memory model (stability, difficulty, retrievability) of the active card.
 */
export const FsrsMetricsCard: React.FC<FsrsMetricsCardProps> = ({ word }) => {
  const retrievability =
    FsrsEngine.computeRetrievability(
      Math.max(MIN_ELAPSED_DAYS, word.intervalDays),
      Math.max(MIN_STABILITY_DAYS, word.stability)
    ) * 100;

  return (
    <Card title="Thông số Toán học FSRS v5 của Thẻ hiện tại">
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Stability S (Độ bền trí nhớ)">
          {word.stability.toFixed(2)} ngày
        </Descriptions.Item>
        <Descriptions.Item label="Difficulty D (Độ khó nội tại)">
          {word.difficulty.toFixed(2)} / 10.0
        </Descriptions.Item>
        <Descriptions.Item label="Retrievability R(t)">{retrievability.toFixed(1)}%</Descriptions.Item>
        <Descriptions.Item label="Số lần nhớ liên tiếp">
          {word.repetitions} lần (Quên: {word.lapses})
        </Descriptions.Item>
        <Descriptions.Item label="Độ thuần thục tổng hợp">
          <Progress
            percent={FsrsEngine.getStrengthPercent(word.repetitions, word.easeFactor, word.stability)}
            size="small"
            status="active"
          />
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};
