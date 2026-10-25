import React from 'react';
import { App, Button, Card, Col, Row, Skeleton, Statistic } from '@/components/ui/Primitives';
import { CopyOutlined } from '@/components/ui/Icons';
import { appConfig } from '@/config/appConfig';
import styles from '@/features/social/components/SocialReferralCard.module.css';
import { SocialReferralCardProps } from '@/features/social/types/SocialReferralCardProps';

/**
 * Referral card: converted vs. total referrals, reward balance and the shareable referral link.
 */
export const SocialReferralCard: React.FC<SocialReferralCardProps> = ({ hub }) => {
  const { message } = App.useApp();

  const handleCopy = async (): Promise<void> => {
    if (!hub) {
      return;
    }
    const link = `${appConfig.serverOrigin}/?ref=${hub.referralCode}`;
    await navigator.clipboard?.writeText(link);
    void message.success('Đã sao chép liên kết giới thiệu!');
  };

  return (
    <Card title="Giới thiệu bạn bè — nhận thưởng đôi bên">
      {!hub ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <Row gutter={12}>
            <Col span={12}>
              <Statistic
                title="Lượt giới thiệu kích hoạt"
                value={hub.activatedReferrals}
                suffix={`/ ${hub.totalReferredUsers}`}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Số dư khả dụng"
                value={hub.totalAvailableRewardsVnd.toLocaleString('vi-VN')}
                suffix="₫"
                className={styles.balance}
              />
            </Col>
          </Row>
          <div className={styles.actions}>
            <Button icon={<CopyOutlined />} onClick={() => void handleCopy()}>
              Sao chép liên kết: {hub.referralCode}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
