import React from 'react';
import { Card, Segmented, Space, Typography } from '@/components/ui/Primitives';
import { ROADMAP_TRACK_OPTIONS } from '@/config/roadmapTrackOptions';
import styles from '@/features/roadmap/components/RoadmapTrackSelector.module.css';
import { RoadmapTrackSelectorProps } from '@/features/roadmap/types/RoadmapTrackSelectorProps';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Segmented switcher between the learning tracks (VSTEP, TOEIC, CEFR, THPT, VNU Bậc 3).
 */
export const RoadmapTrackSelector: React.FC<RoadmapTrackSelectorProps> = ({
  activeTrack,
  onChangeTrack,
}) => {
  return (
    <Card size="small" className={styles.selector}>
      <div className="lp-row-between">
        <Typography.Text strong>Lựa chọn lộ trình học mục tiêu:</Typography.Text>
        <Segmented<RoadmapTrackType>
          value={activeTrack}
          onChange={onChangeTrack}
          options={ROADMAP_TRACK_OPTIONS.map((option) => ({
            value: option.value,
            label: (
              <Space size={6}>
                {option.icon}
                <span>{option.label}</span>
              </Space>
            ),
          }))}
        />
      </div>
    </Card>
  );
};
