import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerReferralHubDto } from '@/types/social/ServerReferralHubDto';

/**
 * Loads referral stats and the learner's study groups from GET /api/v1/social/referrals/hub.
 */
export function useReferralHubQuery() {
  return useQuery({
    queryKey: ['social-referral-hub'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerReferralHubDto>>('/social/referrals/hub');
      return response.data.data ?? null;
    },
  });
}
