import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerGrammarTopicDto } from '@/types/grammar/ServerGrammarTopicDto';

/**
 * Loads the canonical grammar topic catalog from GET /api/v1/grammar/topics.
 */
export function useGrammarTopicsQuery() {
  return useQuery({
    queryKey: ['grammar-topics'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerGrammarTopicDto[]>>('/grammar/topics');
      return response.data.data ?? [];
    },
  });
}
