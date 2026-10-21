import { SubscriptionTierDto } from '@/types/billing/SubscriptionTierDto';

export interface CreateOrderParams {
  tier: SubscriptionTierDto;
  couponCode: string | null;
}
