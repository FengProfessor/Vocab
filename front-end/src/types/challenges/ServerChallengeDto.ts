import { ChallengeStatus } from '@/types/enums/ChallengeStatus';

/**
 * Commitment challenge returned by GET /api/v1/challenges.
 */
export interface ServerChallengeDto {
  /** Challenge id. */
  id: string;
  /** Title. */
  title: string;
  /** Description. */
  description: string;
  /** Start date (yyyy-MM-dd). */
  startDate: string;
  /** End date (yyyy-MM-dd). */
  endDate: string;
  /** Words the learner must study each day. */
  dailyTargetWords: number;
  /** Maximum number of participants. */
  maxParticipants: number;
  /** Number of learners already enrolled. */
  currentParticipantsCount: number;
  /** Deposit (commitment fund) in VND. */
  depositAmount: number;
  /** Lifecycle status. */
  status: ChallengeStatus | string;
}
