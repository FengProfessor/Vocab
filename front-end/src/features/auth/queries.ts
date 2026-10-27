import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '@/features/auth/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook fetching the signed-in user's profile from `.NET 10` (`GET /api/v1/auth/profile`).
 */
export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => AuthApi.getProfile(),
    enabled,
  });
}

/**
 * React Query hook fetching the signed-in user's gamification state (`GET /api/v1/auth/profile`).
 */
export function useGamificationQuery(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.auth.gamification(userId),
    queryFn: () => AuthApi.getGamification(userId ?? ''),
    enabled: Boolean(userId),
  });
}

/**
 * React Query mutation updating user profile/onboarding settings.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => AuthApi.updateProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
