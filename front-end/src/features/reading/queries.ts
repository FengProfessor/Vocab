import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReadingApi } from '@/features/reading/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading reading library articles.
 */
export function useReadingArticlesQuery(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reading.articles(params),
    queryFn: () => ReadingApi.getArticles(params),
    enabled,
  });
}

/**
 * React Query hook for loading the daily reading exercise.
 */
export function useDailyReadingQuery(params?: { recent?: number }, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reading.daily(params),
    queryFn: () => ReadingApi.getDailyReading(params),
    enabled,
  });
}

/**
 * React Query mutation for recording reading progress.
 */
export function useSubmitReadingProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => ReadingApi.submitProgress(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reading.all });
    },
  });
}
