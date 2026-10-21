import { ServerChallengeDto } from '@/types/challenges/ServerChallengeDto';

/**
 * Props for the ChallengeCard component.
 */
export interface ChallengeCardProps {
  /** Challenge to display. */
  challenge: ServerChallengeDto;
  /** Whether a join request is in flight. */
  isJoining: boolean;
  /** Joins the challenge. */
  onJoin: (challengeId: string) => void;
}
