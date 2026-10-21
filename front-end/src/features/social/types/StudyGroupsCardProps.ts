import { ServerStudyGroupDto } from '@/types/social/ServerStudyGroupDto';

/**
 * Props for the StudyGroupsCard component.
 */
export interface StudyGroupsCardProps {
  /** Groups the learner belongs to. */
  groups: ServerStudyGroupDto[];
  /** Whether a join request is in flight. */
  isJoining: boolean;
  /** Joins a group with the entered invite code. */
  onJoin: (inviteCode: string) => void;
}
