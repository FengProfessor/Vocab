import { StudyGroupStatus } from '@/types/enums/StudyGroupStatus';

/**
 * Study group DTO returned inside GET /api/v1/social/referral-hub.
 */
export interface ServerStudyGroupDto {
  id: string;
  name: string;
  inviteCode: string;
  seatLimit: number;
  status: StudyGroupStatus | string;
  expiresAt: string | null;
}
