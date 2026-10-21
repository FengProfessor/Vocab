import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { VSTEP_SELF_ASSESSMENT_TEST_ID } from '@/config/vstepSkills';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ExamType } from '@/types/enums/ExamType';
import { ServerVstepScoreResult } from '@/types/exam/ServerVstepScoreResult';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';

/**
 * Saves the four VSTEP skill scores via POST /api/v1/exams/vstep/submit (server re-computes the official result).
 */
export function useSubmitVstepScores() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (scores: VstepRawSkillScoresDto) => {
      const response = await apiClient.post<ApiResponse<ServerVstepScoreResult>>('/exams/vstep/submit', {
        examType: ExamType.Vstep,
        testId: VSTEP_SELF_ASSESSMENT_TEST_ID,
        listeningScore: scores.listening,
        readingScore: scores.reading,
        writingScore: scores.writing,
        speakingScore: scores.speaking,
      });
      return response.data.data;
    },
    onSuccess: (result) => {
      if (result) {
        void message.success(
          `Máy chủ đã chấm VSTEP: ${result.roundedScore.toFixed(1)}/10.0 (${result.statusLabel})`
        );
      }
    },
  });
}
