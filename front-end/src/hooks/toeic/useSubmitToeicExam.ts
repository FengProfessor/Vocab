import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ToeicExamScorer } from '@/lib/toeicExamScorer';
import { useExamStore } from '@/stores/useExamStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerToeicSubmissionResponseDto } from '@/types/exam/ServerToeicSubmissionResponseDto';

/**
 * Scores the loaded TOEIC test: correct counts are derived from the learner's real answers and sent with the duration
 * to POST /api/v1/exams/toeic/submit; the server returns the scaled 10-990 result.
 */
export function useSubmitToeicExam() {
  const setToeicResult = useExamStore((state) => state.setToeicResult);

  return useMutation({
    mutationFn: async () => {
      const { toeicTestId, toeicQuestions, selectedAnswers, startedAtMs } = useExamStore.getState();
      if (!toeicTestId) {
        throw new Error('No TOEIC test is loaded.');
      }
      const { listeningCorrect, readingCorrect } = ToeicExamScorer.countCorrect(
        toeicQuestions,
        selectedAnswers
      );
      const durationSeconds = startedAtMs ? Math.round((Date.now() - startedAtMs) / 1000) : 0;

      const response = await apiClient.post<ApiResponse<ServerToeicSubmissionResponseDto>>(
        '/exams/toeic/submit',
        {
          testId: toeicTestId,
          listeningCorrectCount: listeningCorrect,
          readingCorrectCount: readingCorrect,
          durationSeconds,
          userAnswers: selectedAnswers,
        }
      );
      return response.data.data;
    },
    onSuccess: (result) => {
      if (result) {
        setToeicResult(result);
      }
    },
  });
}
