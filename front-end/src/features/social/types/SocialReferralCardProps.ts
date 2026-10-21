import { ServerReferralHubDto } from '@/types/social/ServerReferralHubDto';

/**
 * Props for the SocialReferralCard component.
 */
export interface SocialReferralCardProps {
  /** Referral stats, or undefined while loading. */
  hub?: ServerReferralHubDto | null;
}
