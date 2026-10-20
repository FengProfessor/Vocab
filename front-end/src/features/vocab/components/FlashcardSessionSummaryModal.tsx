import React from 'react';
import { Button, Modal, Result, Space, Statistic, theme } from 'antd';
import {
  FireFilled,
  RedoOutlined,
  ThunderboltFilled,
  TrophyOutlined,
} from '@ant-design/icons';

interface FlashcardSessionSummaryModalProps {
  /** Whether the summary modal is visible. */
  open: boolean;
  /** Number of cards successfully reviewed during the current study session. */
  cardsReviewedCount: number;
  /** Total XP earned in this review session. */
  xpEarned: number;
  /** Active user streak days. */
  streakDays: number;
  /** Callback to start a new review session. */
  onRestart: () => void;
  /** Callback to close the modal. */
  onClose: () => void;
}

/**
 * Gamified celebration modal displayed upon completing a flashcard review session.
 * Summarizes cards processed, XP granted, and streak updates.
 */
export const FlashcardSessionSummaryModal: React.FC<FlashcardSessionSummaryModalProps> = ({
  open,
  cardsReviewedCount,
  xpEarned,
  streakDays,
  onRestart,
  onClose,
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={460}
      styles={{ body: { padding: '24px 16px' } }}
    >
      <Result
        status="success"
        title="Hoàn thành phiên ôn tập FSRS v5!"
        subTitle="Bạn đã hoàn thành toàn bộ các thẻ từ vựng đến hạn hôm nay. Bộ não của bạn đã củng cố liên kết trí nhớ dài hạn."
        icon={<TrophyOutlined style={{ color: token.colorSuccess, fontSize: 56 }} />}
        extra={[
          <div
            key="stats"
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              padding: '16px 8px',
              marginBottom: 20,
              background: token.colorFillAlter,
              borderRadius: 12,
            }}
          >
            <Statistic
              title="Thẻ đã ôn"
              value={cardsReviewedCount}
              suffix="thẻ"
              valueStyle={{ color: token.colorPrimary, fontWeight: 700 }}
            />
            <Statistic
              title="XP Nhận được"
              value={xpEarned}
              prefix={<ThunderboltFilled style={{ color: '#eab308' }} />}
              valueStyle={{ color: '#ca8a04', fontWeight: 700 }}
            />
            <Statistic
              title="Chuỗi Streak"
              value={streakDays}
              prefix={<FireFilled style={{ color: '#ef4444' }} />}
              suffix="ngày"
              valueStyle={{ color: '#dc2626', fontWeight: 700 }}
            />
          </div>,
          <Space key="actions" size={12} style={{ display: 'flex', justifyContent: 'center' }}>
            <Button icon={<RedoOutlined />} onClick={onRestart}>
              Ôn thêm từ mới
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
