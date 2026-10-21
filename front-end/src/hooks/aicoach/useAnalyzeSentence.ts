import { useMutation } from '@tanstack/react-query';
import { AI_COACH_ANALYSIS_CONTEXT } from '@/config/aiCoach';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerAiSentenceAnalysisDto } from '@/types/aicoach/ServerAiSentenceAnalysisDto';

/**
 * Requests a syntactic breakdown of a sentence via POST /api/v1/ai-coaching/sentence/analyze (Pro plan only).
 */
export function useAnalyzeSentence() {
  return useMutation({
    mutationFn: async (sentence: string) => {
      const response = await apiClient.post<ApiResponse<ServerAiSentenceAnalysisDto>>(
        '/ai-coaching/sentence/analyze',
        { sentence, context: AI_COACH_ANALYSIS_CONTEXT }
      );
      return response.data.data;
    },
  });
}
