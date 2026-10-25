import React, { useState } from 'react';
import { Modal, Radio, Space, Typography } from '@/components/ui/Primitives';
import { ROADMAP_LEVELS_BY_TRACK, ROADMAP_LEVEL_LABEL } from '@/config/roadmapLevels';
import styles from '@/features/roadmap/components/RoadmapPlacementModal.module.css';
import { RoadmapPlacementModalProps } from '@/features/roadmap/types/RoadmapPlacementModalProps';
import { useSubmitPlacement } from '@/hooks/roadmap/useSubmitPlacement';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';

/**
 * Lets the learner enroll in the active track at a self-selected starting level (placement `selfSelect`).
 */
export const RoadmapPlacementModal: React.FC<RoadmapPlacementModalProps> = ({
  open,
  track,
  onClose,
}) => {
  const levels = ROADMAP_LEVELS_BY_TRACK[track];
  const [selected, setSelected] = useState<RoadmapLevelId | null>(null);
  const placement = useSubmitPlacement(track, onClose);

  const effectiveLevel = selected && levels.includes(selected) ? selected : levels[0];

  return (
    <Modal
      title="Chọn cấp độ xuất phát"
      open={open}
      onCancel={onClose}
      onOk={() => placement.mutate(effectiveLevel)}
      confirmLoading={placement.isPending}
      okText="Xác nhận cấp độ"
      cancelText="Hủy"
      width={480}
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <Typography.Paragraph type="secondary" className={styles.intro}>
          Chọn cấp độ hiện tại để hệ thống ghi danh bạn vào lộ trình {track.toUpperCase()} và bỏ qua
          các chặng cơ bản không cần thiết.
        </Typography.Paragraph>
        <Radio.Group
          className={styles.group}
          value={effectiveLevel}
          onChange={(event) => setSelected(event.target.value)}
        >
          <Space direction="vertical" size={12}>
            {levels.map((level) => (
              <Radio key={level} value={level}>
                {ROADMAP_LEVEL_LABEL[level]}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </Space>
    </Modal>
  );
};
