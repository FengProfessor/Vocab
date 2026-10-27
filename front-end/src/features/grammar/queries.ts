import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GrammarApi } from '@/features/grammar/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading grammar topics.
 */
export function useGrammarTopicsQuery(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grammar.topics(params),
    queryFn: () => GrammarApi.getTopics(params),
    enabled,
  });
}

/**
 * React Query hook for loading grammar progress & due counts.
 */
export function useGrammarProgressQuery(params?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grammar.progress(params),
    queryFn: () => GrammarApi.getProgress(params),
    enabled,
  });
}

/**
 * React Query hook for loading grammar theory for a topic.
 */
export function useGrammarTheoryQuery(topicSlug: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.grammar.theory(topicSlug ?? ''),
    queryFn: () => GrammarApi.getTheory(topicSlug!),
    enabled: Boolean(topicSlug) && enabled,
  });
}

/**
 * React Query mutation for recording grammar mastery progress.
 */
export function useSubmitGrammarProgressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => GrammarApi.submitProgress(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.grammar.all });
    },
  });
}
