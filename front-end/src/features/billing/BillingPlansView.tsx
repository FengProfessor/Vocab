import React, { useState } from 'react';
import { Col, Row } from '@/components/ui/Primitives';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { PRICING_TIERS } from '@/config/pricingTiers';
import { CouponBar } from '@/features/billing/components/CouponBar';
import { OrderQrModal } from '@/features/billing/components/OrderQrModal';
import { PricingTierCard } from '@/features/billing/components/PricingTierCard';
import { useCreateOrder } from '@/hooks/billing/useCreateOrder';
import { useValidateCoupon } from '@/hooks/billing/useValidateCoupon';
import { useAuthStore } from '@/stores/useAuthStore';
import { ServerOrderDto } from '@/types/billing/ServerOrderDto';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Subscription plans and VietQR checkout: coupons validated by GET /billing/coupons/validate,
 * orders created by POST /billing/orders.
 */
export const BillingPlansView: React.FC = () => {
  const currentPlan = useAuthStore((state) => state.user?.subscriptionPlan ?? SubscriptionPlanType.Free);

  const [couponCode, setCouponCode] = useState<string>('');
  const [order, setOrder] = useState<ServerOrderDto | null>(null);

  const validateCoupon = useValidateCoupon();
  const createOrder = useCreateOrder();

  const appliedCoupon = validateCoupon.data?.isValid ? validateCoupon.data.code : null;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 12 • SUBSCRIPTION & VIETQR BILLING"
        title="Nâng Cấp Tài Khoản LingoPro Pro & Thanh Toán"
        subtitle="Kiểm tra mã giảm giá và tạo mã QR chuyển khoản; gói được kích hoạt sau khi thanh toán được xác nhận."
      />

      <CouponBar
        code={couponCode}
        validation={validateCoupon.data ?? null}
        isValidating={validateCoupon.isPending}
        onChangeCode={setCouponCode}
        onValidate={(code) => validateCoupon.mutate(code)}
      />

      <Row gutter={[20, 20]}>
        {PRICING_TIERS.map((tier) => (
          <Col xs={24} lg={8} key={tier.planType}>
            <PricingTierCard
              tier={tier}
              currentPlan={currentPlan}
              isOrdering={createOrder.isPending}
              onOrder={(selected) =>
                createOrder.mutate(
                  { tier: selected, couponCode: appliedCoupon },
                  { onSuccess: (created) => setOrder(created ?? null) }
                )
              }
            />
          </Col>
        ))}
      </Row>

      <OrderQrModal order={order} onClose={() => setOrder(null)} />
    </div>
  );
};
