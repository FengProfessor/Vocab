import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DictionaryEntryMapper } from '@/lib/mappers/dictionaryEntryMapper';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerDictionaryEntryDto } from '@/types/dictionary/ServerDictionaryEntryDto';

/**
 * Looks a term up through GET /api/v1/dictionary/lookup; disabled while the term is empty.
 */
export function useDictionaryLookup(term: string) {
  return useQuery({
    queryKey: ['dictionary-lookup', term],
    enabled: term.trim().length > 0,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerDictionaryEntryDto>>(
        '/dictionary/lookup',
        { params: { term } }
      );
      const dto = response.data.data;
      return dto ? DictionaryEntryMapper.fromServer(dto) : null;
    },
  });
}
