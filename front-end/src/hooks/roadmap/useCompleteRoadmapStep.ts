import { App } from '@/components/ui/Primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { CompleteStepResultDto } from '@/types/roadmap/CompleteStepResultDto';
import { RoadmapStepMetadataDto } from '@/types/roadmap/RoadmapStepMetadataDto';

/**
 * Marks a station as completed via POST /api/v1/roadmap/steps/complete and refreshes the roadmap.
 * Checkpoint / exit-exam stations must carry a score (>= 80% passes); plain lessons send no score.
 */
export function useCompleteRoadmapStep(track: RoadmapTrackType) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: RoadmapStepMetadataDto) => {
      const response = await apiClient.post<ApiResponse<CompleteStepResultDto>>(
        '/roadmap/steps/complete',
        {
          track,
          stepId: step.stepId,
          isCheckpointOrExam: step.isCheckpointOrExam,
          score: null,
        }
      );
      return response.data.data;
    },
    onSuccess: (result) => {
      void message.success(`Đã hoàn thành chặng học! (+${result?.xpAwarded ?? 0} XP)`);
      void queryClient.invalidateQueries({ queryKey: ['roadmap', track] });
    },
  });
}
