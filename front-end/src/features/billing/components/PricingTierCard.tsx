import React from 'react';
import { Badge, Button, Card, List, Space, Tag, Typography } from '@/components/ui/Primitives';
import { CheckOutlined, CrownFilled, QrcodeOutlined } from '@/components/ui/Icons';
import styles from '@/features/billing/components/PricingTierCard.module.css';
import { PricingTierCardProps } from '@/features/billing/types/PricingTierCardProps';

/**
 * Pricing card of one subscription plan with feature list and checkout button.
 */
export const PricingTierCard: React.FC<PricingTierCardProps> = ({
  tier,
  currentPlan,
  isOrdering,
  onOrder,
}) => {
  const isCurrent = tier.planType === currentPlan;
  const isFree = tier.priceAmount === 0;

  const card = (
    <Card
      className={styles.card}
      title={
        <Space>
          <CrownFilled className={styles.crown} />
          <span>{tier.name}</span>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <div>
          <Typography.Title level={2} className={styles.price}>
            {tier.priceAmount.toLocaleString('vi-VN')} ₫
          </Typography.Title>
          <Tag>{tier.billingPeriodLabel}</Tag>
        </div>

        <List
          size="small"
          dataSource={tier.features}
          renderItem={(feature) => (
            <List.Item className={styles.feature}>
              <Space>
                <CheckOutlined className={styles.check} />
                <Typography.Text>{feature}</Typography.Text>
              </Space>
            </List.Item>
          )}
        />

        <Button
          block
          type={isCurrent || isFree ? 'default' : 'primary'}
          disabled={isCurrent || isFree}
          loading={isOrdering}
          icon={<QrcodeOutlined />}
          onClick={() => onOrder(tier)}
        >
          {isCurrent ? 'Đang sử dụng' : isFree ? 'Gói mặc định' : 'Tạo mã thanh toán VietQR'}
        </Button>
      </Space>
    </Card>
  );

  return tier.badgeText ? (
    <Badge.Ribbon text={tier.badgeText} color="indigo">
      {card}
    </Badge.Ribbon>
  ) : (
    card
  );
};
