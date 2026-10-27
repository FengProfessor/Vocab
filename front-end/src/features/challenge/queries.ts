import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChallengeApi } from '@/features/challenge/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading commitment challenges.
 */
export function useChallengesQuery(includeAll = false, enabled = true) {
  return useQuery({
    queryKey: queryKeys.challenge.list(includeAll),
    queryFn: () => ChallengeApi.getChallenges(includeAll ? { includeAll: 1 } : undefined),
    enabled,
  });
}

/**
 * React Query hook for the dashboard challenge widget.
 */
export function useChallengeWidgetQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.challenge.widget(),
    queryFn: () => ChallengeApi.getWidget(),
    enabled,
  });
}

/**
 * React Query mutation for joining a challenge.
 */
export function useJoinChallengeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, body }: { challengeId: string; body?: Record<string, any> }) =>
      ChallengeApi.joinChallenge(challengeId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.challenge.all });
    },
  });
}
