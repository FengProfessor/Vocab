import React from 'react';
import { Button, Modal, Result, Statistic, Tag, Typography } from '@/components/ui/Primitives';
import { ThunderboltFilled, TrophyFilled } from '@/components/ui/Icons';
import styles from '@/features/toeic/components/ToeicScoreModal.module.css';
import { ToeicScoreModalProps } from '@/features/toeic/types/ToeicScoreModalProps';

/** Maximum scaled score of one TOEIC section. */
const SECTION_MAX_SCORE = 495;
/** Maximum total TOEIC score. */
const TOTAL_MAX_SCORE = 990;

/**
 * Result modal showing the server-computed TOEIC scaled score, CEFR band and XP reward.
 */
export const ToeicScoreModal: React.FC<ToeicScoreModalProps> = ({ open, result, onClose }) => {
  if (!result) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={480}
      centered
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Hoàn tất
        </Button>,
      ]}
    >
      <Result
        status="success"
        icon={<TrophyFilled className={styles.trophy} />}
        title="Kết quả bài thi TOEIC"
        subTitle="Điểm đã được quy đổi theo thang 10-990 và lưu trên hệ thống."
        extra={
          <div className={styles.panel}>
            <div className="lp-center">
              <Typography.Text type="secondary">Tổng điểm</Typography.Text>
              <Typography.Title level={1} className={styles.total}>
                {result.totalScaledScore} / {TOTAL_MAX_SCORE}
              </Typography.Title>
              <Tag color="purple" className={styles.band}>
                {result.proficiencyBand} ({result.certLevel})
              </Tag>
            </div>
            <div className={styles.stats}>
              <Statistic
                title="Listening"
                value={result.listeningScaledScore}
                suffix={`/ ${SECTION_MAX_SCORE}`}
              />
              <Statistic
                title="Reading"
                value={result.readingScaledScore}
                suffix={`/ ${SECTION_MAX_SCORE}`}
              />
              <Statistic
                title="XP nhận được"
                value={result.xpAwarded}
                prefix={<ThunderboltFilled className={styles.xpIcon} />}
              />
            </div>
          </div>
        }
      />
    </Modal>
  );
};
