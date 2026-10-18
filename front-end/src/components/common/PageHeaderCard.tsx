import React from 'react';
import { Card, Space, Tag, Typography } from 'antd';

/**
 * Props for the PageHeaderCard component.
 */
interface PageHeaderCardProps {
  /** Module badge label (e.g., "MODULE 03 • VOCABULARY & FSRS v5"). */
  badgeText: string;

  /** Main Vietnamese page title. */
  title: string;

  /** Subtitle description explaining the module's learning purpose. */
  subtitle: string;

  /** Optional right-aligned action buttons or metric widgets. */
  extra?: React.ReactNode;
}

/**
 * Standardized page header card rendered at the top of each LingoPro feature module.
 */
export const PageHeaderCard: React.FC<PageHeaderCardProps> = ({
  badgeText,
  title,
  subtitle,
  extra,
}) => {
  return (
    <Card
      style={{
        marginBottom: 20,
        background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)',
        borderColor: '#e0e7ff',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Space direction="vertical" size={4}>
          <Tag color="indigo" style={{ fontWeight: 700, width: 'fit-content' }}>
            {badgeText}
          </Tag>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">{subtitle}</Typography.Text>
        </Space>
        {extra && <div>{extra}</div>}
      </div>
    </Card>
  );
};
