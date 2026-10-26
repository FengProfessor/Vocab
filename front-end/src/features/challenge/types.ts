import {
  ChallengeParticipantStatus,
  ChallengeRewardChoice,
  ChallengeStatus,
} from '@/types/enums';

/**
 * Commitment challenge returned by GET /api/v1/challenges.
 */
export interface ServerChallengeDto {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  dailyTargetWords: number;
  maxParticipants: number;
  currentParticipantsCount: number;
  depositAmount: number;
  status: ChallengeStatus | string;
}

/**
 * Result of POST /api/v1/challenges/{id}/join.
 */
export interface ServerJoinChallengeResponseDto {
  participantId: string;
  challengeId: string;
  participantStatus: ChallengeParticipantStatus | string;
  orderId: string | null;
  transferCode: string | null;
}

/**
 * Represents a streak commitment challenge where learners earn back their deposit or bonus days.
 */
export interface StudyChallengeDto {
  id: string;
  title: string;
  durationDays: number;
  completedDays: number;
  dailyTargetMinutes: number;
  depositAmountVnd: number;
  challengeStatus: ChallengeStatus;
  participantStatus: ChallengeParticipantStatus;
  rewardChoice: ChallengeRewardChoice;
}
