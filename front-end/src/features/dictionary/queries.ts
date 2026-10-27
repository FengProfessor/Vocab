import { useMutation, useQuery } from '@tanstack/react-query';
import { DictionaryApi } from '@/features/dictionary/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for dictionary word lookup.
 */
export function useDictionaryLookupQuery(term: string, context?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dictionary.lookup(term, context),
    queryFn: () => DictionaryApi.lookup({ term, context }),
    enabled: Boolean(term.trim()) && enabled,
  });
}

/**
 * React Query hook for dictionary autocomplete suggestions.
 */
export function useDictionarySuggestQuery(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dictionary.suggest(query),
    queryFn: () => DictionaryApi.suggest(query),
    enabled: Boolean(query.trim()) && enabled,
  });
}

/**
 * React Query mutation for AI sentence syntactic analysis.
 */
export function useAnalyzeSentenceMutation() {
  return useMutation({
    mutationFn: (body: { sentence: string; targetWord?: string | null }) =>
      DictionaryApi.analyzeSentence(body),
  });
}

/**
 * React Query mutation for OCR vocabulary extraction.
 */
export function useExtractOcrMutation() {
  return useMutation({
    mutationFn: (body: { base64Image: string; mimeType?: string }) =>
      DictionaryApi.extractOcrWords(body),
  });
}
