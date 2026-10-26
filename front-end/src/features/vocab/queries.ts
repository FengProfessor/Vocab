import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VocabApi, VocabWordsQuery } from '@/features/vocab/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading vocabulary words and FSRS level distribution.
 */
export function useVocabWordsQuery(query?: VocabWordsQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vocab.words((query as Record<string, unknown>) ?? {}),
    queryFn: () => VocabApi.getWords(query),
    enabled,
  });
}

/**
 * React Query hook for loading student dashboard FSRS and XP statistics.
 */
export function useStudentStatsQuery(lite = false, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vocab.stats(lite),
    queryFn: () => VocabApi.getStudentStats({ lite }),
    enabled,
  });
}

/**
 * React Query hook for loading a single vocabulary word's details.
 */
export function useVocabWordDetailQuery(wordId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vocab.wordDetail(wordId ?? ''),
    queryFn: () => VocabApi.getWordById(wordId!),
    enabled: Boolean(wordId) && enabled,
  });
}

/**
 * React Query mutation for submitting an FSRS card review.
 */
export function useSubmitSrsReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => VocabApi.submitSrsReview(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vocab.all });
    },
  });
}
