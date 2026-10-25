import React from 'react';
import { Button, Card, Input, Space, Tag, Typography } from '@/components/ui/Primitives';
import { TagOutlined } from '@/components/ui/Icons';
import styles from '@/features/billing/components/CouponBar.module.css';
import { CouponBarProps } from '@/features/billing/types/CouponBarProps';

/**
 * Coupon field: the code is validated on the server before it is applied to an order.
 */
export const CouponBar: React.FC<CouponBarProps> = ({
  code,
  validation,
  isValidating,
  onChangeCode,
  onValidate,
}) => {
  return (
    <Card className={styles.bar}>
      <Space wrap align="center">
        <TagOutlined className={styles.icon} />
        <Typography.Text strong>Mã ưu đãi:</Typography.Text>
        <Input
          className={styles.input}
          value={code}
          placeholder="Nhập mã giảm giá..."
          onChange={(event) => onChangeCode(event.target.value)}
        />
        <Button loading={isValidating} disabled={!code.trim()} onClick={() => onValidate(code.trim())}>
          Kiểm tra
        </Button>
        {validation?.isValid && (
          <Tag color="green">
            Đã áp dụng {validation.code}: -{validation.discountPercent}%
          </Tag>
        )}
      </Space>
    </Card>
  );
};
