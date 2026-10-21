import { ChallengeParticipantStatus } from '@/types/enums/ChallengeParticipantStatus';

/**
 * Result of POST /api/v1/challenges/{id}/join.
 */
export interface ServerJoinChallengeResponseDto {
  /** Participant record id. */
  participantId: string;
  /** Joined challenge id. */
  challengeId: string;
  /** Participation status (Pending until the deposit is paid). */
  participantStatus: ChallengeParticipantStatus | string;
  /** Deposit order id when a payment is required. */
  orderId: string | null;
  /** Bank transfer content for the deposit, when a payment is required. */
  transferCode: string | null;
}
