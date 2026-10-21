import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerChallengeDto } from '@/types/challenges/ServerChallengeDto';

/**
 * Loads the open commitment challenges from GET /api/v1/challenges.
 */
export function useChallengesQuery() {
  return useQuery({
    queryKey: ['challenges-list'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerChallengeDto[]>>('/challenges');
      return response.data.data ?? [];
    },
  });
}
