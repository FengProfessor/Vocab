import React from 'react';
import { Card, Space, Tag, Typography } from '@/components/ui/Primitives';
import styles from '@/components/common/PageHeaderCard.module.css';
import { PageHeaderCardProps } from '@/components/types/PageHeaderCardProps';

/**
 * Standardized page header card rendered at the top of each LingoPro feature module.
 */
export const PageHeaderCard: React.FC<PageHeaderCardProps> = ({ badgeText, title, subtitle, extra }) => {
  return (
    <Card className={styles.card}>
      <div className={styles.layout}>
        <Space direction="vertical" size={4}>
          <Tag color="indigo" className={styles.badge}>
            {badgeText}
          </Tag>
          <Typography.Title level={3} className={styles.title}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </Space>
        {extra && <div>{extra}</div>}
      </div>
    </Card>
  );
};
