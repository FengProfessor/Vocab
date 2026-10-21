import React from 'react';
import { Button, Modal, Result, Space, Statistic } from 'antd';
import { FireFilled, RedoOutlined, ThunderboltFilled, TrophyOutlined } from '@ant-design/icons';
import styles from '@/features/vocab/components/FlashcardSessionSummaryModal.module.css';
import { FlashcardSessionSummaryModalProps } from '@/features/vocab/types/FlashcardSessionSummaryModalProps';

/**
 * Celebration modal shown when the due queue is empty: cards reviewed, XP granted by the server and streak.
 */
export const FlashcardSessionSummaryModal: React.FC<FlashcardSessionSummaryModalProps> = ({
  open,
  cardsReviewedCount,
  xpEarned,
  streakDays,
  onRestart,
  onClose,
}) => {
  return (
    <Modal open={open} footer={null} onCancel={onClose} centered width={460}>
      <Result
        status="success"
        title="Hoàn thành phiên ôn tập FSRS v5!"
        subTitle="Bạn đã hoàn thành toàn bộ các thẻ từ vựng đến hạn hôm nay."
        icon={<TrophyOutlined className={styles.trophy} />}
        extra={[
          <div key="stats" className={styles.stats}>
            <Statistic title="Lượt chấm" value={cardsReviewedCount} suffix="lượt" />
            <Statistic
              title="XP Nhận được"
              value={xpEarned}
              prefix={<ThunderboltFilled className={styles.xpIcon} />}
            />
            <Statistic
              title="Chuỗi Streak"
              value={streakDays}
              prefix={<FireFilled className={styles.streakIcon} />}
              suffix="ngày"
            />
          </div>,
          <Space key="actions" size={12} className={styles.actions}>
            <Button icon={<RedoOutlined />} onClick={onRestart}>
              Ôn lại toàn bộ thẻ
            </Button>
            <Button type="primary" onClick={onClose}>
              Xem danh sách từ
            </Button>
          </Space>,
        ]}
      />
    </Modal>
  );
};
