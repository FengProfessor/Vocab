import { OrderKind } from '@/types/enums/OrderKind';
import { OrderStatus } from '@/types/enums/OrderStatus';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Order returned by POST /api/v1/billing/orders.
 */
export interface ServerOrderDto {
  /** Order id. */
  id: string;
  /** Owner user id. */
  userId: string;
  /** Ordered plan. */
  planId: SubscriptionPlanType;
  /** Individual, group or challenge order. */
  orderKind: OrderKind;
  /** Subscription length in months. */
  durationMonths: number;
  /** Seats included (group orders). */
  seatLimit: number;
  /** Amount to pay after discounts. */
  amount: number;
  /** Currency code. */
  currency: string;
  /** Payment status. */
  status: OrderStatus | string;
  /** Bank transfer content the learner must enter. */
  transferCode: string;
  /** VietQR image URL to scan. */
  vietQrUrl: string;
  /** Creation time. */
  createdAt: string;
  /** Payment confirmation time, if paid. */
  paidAt: string | null;
}
