import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SocialApi } from '@/features/social/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading the referral hub and study groups.
 */
export function useReferralHubQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.referralHub(),
    queryFn: () => SocialApi.getReferralHub(),
    enabled,
  });
}

/**
 * React Query hook for loading the user's study groups.
 */
export function useMyGroupsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.groupsMine(),
    queryFn: () => SocialApi.getMyGroups(),
    enabled,
  });
}

/**
 * React Query mutation for joining a study group.
 */
export function useJoinGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => SocialApi.joinGroup({ inviteCode: code }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all });
    },
  });
}
