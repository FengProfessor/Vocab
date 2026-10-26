import { StudyGroupStatus } from '@/types/enums';
import type { Plan, Profile } from '@/features/auth/types';

export type GroupStatus = 'active' | 'expired' | 'cancelled';

/** Gói nhóm đã kích hoạt: 1 owner trả gộp, chia ghế Pro cho nhóm bạn. */
export interface Group {
  id: string;
  owner_id: string;
  plan: Exclude<Plan, 'free'>;
  seat_limit: number;
  invite_code: string;
  status: GroupStatus;
  starts_at?: string | null;
  expires_at?: string | null;
  order_id?: string | null;
  created_at: string;
  // Joined fields
  owner?: Profile;
  members?: GroupMember[];
  seats_used?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  // Joined fields
  profile?: Profile;
}

export interface ServerStudyGroupDto {
  id: string;
  name: string;
  inviteCode: string;
  seatLimit: number;
  status: StudyGroupStatus | string;
  expiresAt: string | null;
}

export interface ServerReferralHubDto {
  referralCode: string;
  totalReferredUsers: number;
  activatedReferrals: number;
  totalAvailableRewardsVnd: number;
  activeGroups: ServerStudyGroupDto[];
}
