import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerDailyReadingDto } from '@/types/reading/ServerDailyReadingDto';
import { ServerReadingArticleDto } from '@/types/reading/ServerReadingArticleDto';

/**
 * Loads the published article catalog and today's daily exercise in parallel
 * (GET /api/v1/reading/articles and GET /api/v1/reading/daily).
 */
export function useReadingRoomQuery() {
  return useQuery({
    queryKey: ['reading-room-data'],
    queryFn: async () => {
      const [articlesResponse, dailyResponse] = await Promise.all([
        apiClient.get<ApiResponse<ServerReadingArticleDto[]>>('/reading/articles'),
        apiClient.get<ApiResponse<ServerDailyReadingDto>>('/reading/daily'),
      ]);
      return {
        articles: articlesResponse.data.data ?? [],
        daily: dailyResponse.data.data ?? null,
      };
    },
  });
}
