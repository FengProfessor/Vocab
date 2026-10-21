import { CertLevel } from '@/types/enums/CertLevel';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';
import { UserRole } from '@/types/enums/UserRole';

/**
 * Profile payload returned by GET /api/v1/auth/profile (backend ProfileDto, camelCase JSON).
 */
export interface ServerProfilePayload {
  /** User id. */
  id: string;
  /** Account e-mail. */
  email: string;
  /** Display name. */
  fullName: string;
  /** Avatar image URL. */
  avatarUrl: string | null;
  /** Authorization role (serialized as a string enum). */
  role: UserRole | string;
  /** Subscription plan. */
  plan?: SubscriptionPlanType | string;
  /** Legacy alias of `plan`. */
  subscriptionPlan?: SubscriptionPlanType;
  /** Total XP. */
  totalXp?: number;
  /** Current streak in days. */
  currentStreak?: number;
  /** Legacy alias of `currentStreak`. */
  streakDays?: number;
  /** Learning goal chosen during onboarding. */
  learningGoal?: string | null;
  /** Daily study target in minutes. */
  dailyTargetMins?: number;
  /** Target certificate level when the server stores one. */
  targetCertLevel?: CertLevel;
}
