import React from 'react';
import { Button, Card, Space, Tag, Tooltip, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/reading/components/DailyReadingCard.module.css';
import { DailyReadingCardProps } from '@/features/reading/types/DailyReadingCardProps';

/**
 * Daily personalized reading (built from the learner's own words) with its completion status.
 * TODO: [Backend API Required] define the `mcqQuestionsJson` / `clozeItemsJson` schema so the exercise can be answered
 * in-app and POST /api/v1/reading/daily/submit receives real McqScore / ClozeScore values.
 */
export const DailyReadingCard: React.FC<DailyReadingCardProps> = ({
  daily,
  keywords,
  savingWord,
  onSaveWord,
}) => {
  if (!daily) {
    return null;
  }

  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <BookOutlined />
          <span>Bài đọc hàng ngày ({daily.exerciseDate})</span>
        </Space>
      }
      extra={
        daily.isCompletedToday ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Đã hoàn thành hôm nay
          </Tag>
        ) : (
          <Tooltip title="Cần API định nghĩa câu hỏi để chấm điểm bài tập (TODO).">
            <Tag color="warning">Chưa hoàn thành</Tag>
          </Tooltip>
        )
      }
    >
      <Space direction="vertical" size={12} className="lp-full-width">
        <Space>
          <CertLevelTag level={daily.certLevel} />
          <Typography.Text strong className={styles.passageTitle}>
            {daily.title}
          </Typography.Text>
        </Space>
        <Typography.Paragraph
          className={styles.passage}
          ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}
        >
          {daily.passageContent}
        </Typography.Paragraph>
        {keywords.length > 0 && (
          <div className={styles.keywordRow}>
            <Typography.Text type="secondary">Từ vựng của bạn trong bài:</Typography.Text>
            {keywords.map((keyword) => (
              <Button
                key={keyword}
                size="small"
                icon={<PlusCircleOutlined />}
                loading={savingWord === keyword}
                onClick={() => onSaveWord(keyword)}
              >
                {keyword}
              </Button>
            ))}
          </div>
        )}
      </Space>
    </Card>
  );
};
