import React from 'react';
import { Card, Empty, Skeleton, Space, Tag, Typography } from '@/components/ui/Primitives';
import styles from '@/features/grammar/components/GrammarTopicList.module.css';
import { GrammarTopicListProps } from '@/features/grammar/types/GrammarTopicListProps';

/**
 * Vertical list of canonical grammar topics (CEFR level and category) with skeleton and empty states.
 */
export const GrammarTopicList: React.FC<GrammarTopicListProps> = ({
  topics,
  selectedTopicId,
  isLoading = false,
  onSelectTopic,
}) => {
  if (isLoading) {
    return (
      <Space direction="vertical" size={12} className="lp-full-width">
        {[0, 1, 2].map((key) => (
          <Card key={key}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </Space>
    );
  }

  if (topics.length === 0) {
    return <Empty description="Chưa có chuyên đề ngữ pháp nào." />;
  }

  return (
    <Space direction="vertical" size={12} className="lp-full-width">
      {topics.map((topic) => (
        <Card
          key={topic.id}
          hoverable
          className={`${styles.card} ${selectedTopicId === topic.id ? styles.cardSelected : ''}`}
          onClick={() => onSelectTopic(topic.id)}
        >
          <Space direction="vertical" size={6} className="lp-full-width">
            <Space>
              <Tag color="geekblue">{String(topic.certLevel).toUpperCase()}</Tag>
              <Tag color="cyan">{topic.category}</Tag>
            </Space>
            <Typography.Text strong className={styles.title}>
              {topic.titleVi ?? topic.title}
            </Typography.Text>
            <Typography.Text type="secondary" className={styles.subtitle}>
              {topic.title}
            </Typography.Text>
          </Space>
        </Card>
      ))}
    </Space>
  );
};
