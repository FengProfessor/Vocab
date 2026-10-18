import { CurrencyType } from '@/types/enums/CurrencyType';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Represents a subscription pricing plan tier for learners or institutions.
 */
export interface SubscriptionTierDto {
  /** Plan identifier enum. */
  planType: SubscriptionPlanType;

  /** Display name of the plan. */
  name: string;

  /** Price amount in the specified currency. */
  priceAmount: number;

  /** Billing currency. */
  currency: CurrencyType;

  /** Billing cycle description (e.g., "30 ngày", "90 ngày", "365 ngày"). */
  billingPeriodLabel: string;

  /** Highlight badge text if recommended. */
  badgeText?: string;

  /** List of included feature bullets. */
  features: string[];
}
