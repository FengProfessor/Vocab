import { useMutation } from '@tanstack/react-query';
import { AI_COACH_TOPIC } from '@/config/aiCoach';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerAiSpeakingFeedbackDto } from '@/types/aicoach/ServerAiSpeakingFeedbackDto';
import { SpeakingDialogueParams } from '@/hooks/types/SpeakingDialogueParams';

/**
 * Sends the learner's utterance to the Socratic tutor via POST /api/v1/ai-coaching/speaking/dialogue.
 */
export function useSpeakingDialogue() {
  return useMutation({
    mutationFn: async ({ lastTranscript, history }: SpeakingDialogueParams) => {
      const response = await apiClient.post<ApiResponse<ServerAiSpeakingFeedbackDto>>(
        '/ai-coaching/speaking/dialogue',
        { topic: AI_COACH_TOPIC, lastTranscript, history }
      );
      return response.data.data;
    },
  });
}
