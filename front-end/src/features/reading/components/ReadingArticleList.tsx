import React from 'react';
import { Card, Empty, List, Space, Tag, Typography } from '@/components/ui/Primitives';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/reading/components/ReadingArticleList.module.css';
import { ReadingArticleListProps } from '@/features/reading/types/ReadingArticleListProps';

/**
 * Reading library list with CEFR level, word count and topic of each published article.
 */
export const ReadingArticleList: React.FC<ReadingArticleListProps> = ({
  articles,
  selectedArticleId,
  onSelectArticle,
}) => {
  return (
    <Card title="Thư viện Bài đọc" size="small" className={styles.card}>
      {articles.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài đọc nào được xuất bản." />
      ) : (
        <List
          dataSource={articles}
          renderItem={(article) => (
            <List.Item
              key={article.id}
              className={`${styles.item} ${article.id === selectedArticleId ? styles.itemSelected : ''}`}
              onClick={() => onSelectArticle(article.id)}
            >
              <Space direction="vertical" size={2} className="lp-full-width">
                <Space>
                  <CertLevelTag level={article.certLevel} />
                  <Tag>{article.wordCount} từ</Tag>
                </Space>
                <Typography.Text strong>{article.title}</Typography.Text>
                <Typography.Text type="secondary">{article.topic}</Typography.Text>
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};
