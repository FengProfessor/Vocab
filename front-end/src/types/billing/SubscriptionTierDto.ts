import { CurrencyType } from '@/types/enums/CurrencyType';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Marketing definition of one subscription plan shown on the pricing page.
 */
export interface SubscriptionTierDto {
  /** Plan sent to the API when ordering. */
  planType: SubscriptionPlanType;
  /** Display name. */
  name: string;
  /** List price. */
  priceAmount: number;
  /** Price currency. */
  currency: CurrencyType;
  /** Billing period label (e.g. "3 tháng"). */
  billingPeriodLabel: string;
  /** Subscription length sent to the API (must match the label). */
  durationMonths: number;
  /** Optional ribbon text. */
  badgeText?: string;
  /** Feature bullet points. */
  features: string[];
}
