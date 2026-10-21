import React from 'react';
import { Alert, Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import styles from '@/features/ai-coach/components/SentenceAnalysisCard.module.css';
import { SentenceAnalysisCardProps } from '@/features/ai-coach/types/SentenceAnalysisCardProps';

/**
 * Syntactic breakdown of the last analyzed sentence: main clause, secondary clauses, kernel and build-up levels.
 * Sentence analysis is a Pro feature; free learners see an upgrade hint instead.
 */
export const SentenceAnalysisCard: React.FC<SentenceAnalysisCardProps> = ({
  analysis,
  isAvailable,
  isLoading,
}) => {
  const renderBody = (): React.ReactNode => {
    if (!isAvailable) {
      return (
        <Alert
          type="warning"
          showIcon
          message="Phân tích cú pháp câu là tính năng của gói Pro."
          description="Nâng cấp tại mục Gói Pro & Thanh toán để mở khóa."
        />
      );
    }
    if (isLoading) {
      return <Skeleton active paragraph={{ rows: 5 }} />;
    }
    if (!analysis) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Gửi một câu để xem phân tích cú pháp." />;
    }
    return (
      <Space direction="vertical" size={14} className="lp-full-width">
        <div>
          <Typography.Text strong className={styles.section}>
            Mệnh đề chính
          </Typography.Text>
          <Typography.Text>{analysis.mainClause}</Typography.Text>
        </div>

        {analysis.secondaryClauses.length > 0 && (
          <div>
            <Typography.Text strong className={styles.section}>
              Mệnh đề phụ
            </Typography.Text>
            <List size="small" dataSource={analysis.secondaryClauses} renderItem={(clause) => <List.Item>{clause}</List.Item>} />
          </div>
        )}

        <div>
          <Typography.Text strong className={styles.section}>
            Hạt nhân câu
          </Typography.Text>
          <pre className={styles.kernel}>{JSON.stringify(analysis.kernel, null, 2)}</pre>
        </div>

        {analysis.buildLevels.length > 0 && (
          <div>
            <Typography.Text strong className={styles.section}>
              Các bước mở rộng câu
            </Typography.Text>
            <List
              size="small"
              dataSource={analysis.buildLevels}
              renderItem={(level, index) => (
                <List.Item>
                  <Tag>{index + 1}</Tag> {level}
                </List.Item>
              )}
            />
          </div>
        )}
      </Space>
    );
  };

  return (
    <Card
      title={
        <Space>
          <ApartmentOutlined />
          <span>Phân tích cú pháp câu</span>
        </Space>
      }
    >
      {renderBody()}
    </Card>
  );
};
