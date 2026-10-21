import { SubscriptionTierDto } from '@/types/billing/SubscriptionTierDto';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Props for the PricingTierCard component.
 */
export interface PricingTierCardProps {
  /** Plan definition to render. */
  tier: SubscriptionTierDto;
  /** Plan the learner currently has. */
  currentPlan: SubscriptionPlanType;
  /** Whether an order request is in flight. */
  isOrdering: boolean;
  /** Starts the checkout for this tier. */
  onOrder: (tier: SubscriptionTierDto) => void;
}
