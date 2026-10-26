import { CurrencyType, OrderKind as DotNetOrderKind, OrderStatus, SubscriptionPlanType } from '@/types/enums';

export type OrderKind = 'individual' | 'group' | 'challenge';

/**
 * Coupon validation DTO returned by GET /api/v1/billing/coupons/validate.
 */
export interface ServerCouponValidationDto {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  isValid: boolean;
}

/**
 * Order returned by POST /api/v1/billing/orders.
 */
export interface ServerOrderDto {
  id: string;
  userId: string;
  planId: SubscriptionPlanType;
  orderKind: DotNetOrderKind;
  durationMonths: number;
  seatLimit: number;
  amount: number;
  currency: string;
  status: OrderStatus | string;
  transferCode: string;
  vietQrUrl: string;
  createdAt: string;
  paidAt: string | null;
}

/**
 * Marketing definition of one subscription plan shown on the pricing page.
 */
export interface SubscriptionTierDto {
  planType: SubscriptionPlanType;
  name: string;
  priceAmount: number;
  currency: CurrencyType;
  billingPeriodLabel: string;
  durationMonths: number;
  badgeText?: string;
  features: string[];
}

export interface CreateOrderParams {
  tier: SubscriptionTierDto;
  couponCode: string | null;
}
