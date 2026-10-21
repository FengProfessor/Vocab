import { AccountStatus } from '@/types/enums/AccountStatus';
import { AuthProviderType } from '@/types/enums/AuthProviderType';
import { CertLevel } from '@/types/enums/CertLevel';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Represents the authenticated learner, teacher, or administrator profile.
 */
export interface UserProfileDto {
  /** Unique user identifier (UUID). */
  id: string;

  /** Primary email address. */
  email: string;

  /** Display name of the user. */
  fullName: string;

  /** Optional avatar image URL. */
  avatarUrl: string | null;

  /** Primary RBAC role assigned to the user. */
  role: UserRole;

  /** Authentication provider used for account creation. */
  authProvider: AuthProviderType;

  /** Current lifecycle status of the account. */
  accountStatus: AccountStatus;

  /** Target English certification level selected by the learner. */
  targetCertLevel: CertLevel;

  /** Active subscription plan tier. */
  subscriptionPlan: SubscriptionPlanType;

  /** Consecutive daily study streak count. */
  streakDays: number;

  /** Total accumulated XP points. */
  totalXp: number;

  /** Learning goal chosen during onboarding, if any. */
  learningGoal?: string | null;

  /** Daily study target in minutes (5..180). */
  dailyTargetMins?: number;
}
