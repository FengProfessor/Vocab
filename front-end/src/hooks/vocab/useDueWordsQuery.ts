import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { VocabWordMapper } from '@/lib/mappers/vocabWordMapper';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerWordWithSrsDto } from '@/types/vocab/ServerWordWithSrsDto';

/** Maximum number of due cards requested per session. */
const DUE_WORDS_LIMIT = 50;

/**
 * Loads the due FSRS queue from GET /api/v1/vocab/due and merges it into the study store.
 */
export function useDueWordsQuery() {
  const loadServerDueWords = useStudyStore((state) => state.loadServerDueWords);

  const query = useQuery({
    queryKey: ['vocab-due'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerWordWithSrsDto[]>>(
        `/vocab/due?limit=${DUE_WORDS_LIMIT}`
      );
      return response.data.data ?? [];
    },
  });

  useEffect(() => {
    if (query.data) {
      loadServerDueWords(query.data.map(VocabWordMapper.fromServer));
    }
  }, [query.data, loadServerDueWords]);

  return query;
}
