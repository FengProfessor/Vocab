import { ChallengeParticipantStatus } from '@/types/enums/ChallengeParticipantStatus';
import { ChallengeRewardChoice } from '@/types/enums/ChallengeRewardChoice';
import { ChallengeStatus } from '@/types/enums/ChallengeStatus';

/**
 * Represents a streak commitment challenge where learners earn back their deposit or bonus days.
 */
export interface StudyChallengeDto {
  /** Unique challenge identifier. */
  id: string;

  /** Display title of the challenge. */
  title: string;

  /** Duration of the challenge in consecutive days. */
  durationDays: number;

  /** Completed days by the current learner. */
  completedDays: number;

  /** Required minimum study minutes per day. */
  dailyTargetMinutes: number;

  /** Commitment deposit amount in VND. */
  depositAmountVnd: number;

  /** Lifecycle status of the challenge cohort. */
  challengeStatus: ChallengeStatus;

  /** Current user's participation status. */
  participantStatus: ChallengeParticipantStatus;

  /** Selected reward distribution preference upon completion. */
  rewardChoice: ChallengeRewardChoice;
}
