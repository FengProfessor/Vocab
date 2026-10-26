import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExamApi } from '@/features/exam/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading the VNU Bậc 3 exam catalog.
 */
export function useVnuCatalogQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.exam.vnuCatalog(),
    queryFn: () => ExamApi.getVnuCatalog(),
    enabled,
  });
}

/**
 * React Query hook for loading the learner's TOEIC question history.
 */
export function useToeicHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.exam.toeicHistory(),
    queryFn: () => ExamApi.getToeicHistory(),
    enabled,
  });
}

/**
 * React Query mutation for submitting a TOEIC exam.
 */
export function useSubmitToeicExamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, any>) => ExamApi.submitToeicExam(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.exam.all });
    },
  });
}

/**
 * React Query mutation for evaluating a VSTEP or VNU essay.
 */
export function useEvaluateWritingMutation(examType: 'Vstep' | 'VnuBac3' = 'Vstep') {
  return useMutation({
    mutationFn: (body: Record<string, any>) => ExamApi.evaluateWriting(body, examType),
  });
}
