import { ServerStudyGroupDto } from '@/types/social/ServerStudyGroupDto';

/**
 * Referral hub returned by GET /api/v1/social/referrals/hub.
 */
export interface ServerReferralHubDto {
  /** The learner's own referral code. */
  referralCode: string;
  /** Total users registered through the learner's code. */
  totalReferredUsers: number;
  /** Referred users who activated (completed onboarding or purchased). */
  activatedReferrals: number;
  /** Reward balance currently available, in VND. */
  totalAvailableRewardsVnd: number;
  /** Study groups the learner belongs to. */
  activeGroups: ServerStudyGroupDto[];
}
