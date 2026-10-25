import { App } from '@/components/ui/Primitives';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ExamType } from '@/types/enums/ExamType';
import { ServerWritingEvaluationDto } from '@/types/exam/ServerWritingEvaluationDto';
import { EvaluateEssayParams } from '@/hooks/types/EvaluateEssayParams';

/**
 * Requests AI grading of a Writing Task 2 essay via POST /api/v1/exams/writing/evaluate.
 */
export function useEvaluateWritingEssay() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (params: EvaluateEssayParams) => {
      const response = await apiClient.post<ApiResponse<ServerWritingEvaluationDto>>(
        '/exams/writing/evaluate',
        { examType: ExamType.Vstep, ...params }
      );
      return response.data.data;
    },
    onSuccess: (evaluation) => {
      if (evaluation) {
        void message.success(`Đã chấm xong bài viết: ${evaluation.overallScore.toFixed(1)}/10.0`);
      }
    },
  });
}
