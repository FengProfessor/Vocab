import { App } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { ServerRoadmapProgressDto } from '@/types/roadmap/ServerRoadmapProgressDto';

/**
 * Enrolls the learner in a track at a self-selected level via POST /api/v1/roadmap/placement.
 * TODO: [Backend API Required] GET /api/v1/roadmap/placement/questions to support the scored placement test (`answers`).
 */
export function useSubmitPlacement(track: RoadmapTrackType, onDone: () => void) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (selfSelectLevelId: RoadmapLevelId) => {
      const response = await apiClient.post<ApiResponse<ServerRoadmapProgressDto>>(
        '/roadmap/placement',
        { track, selfSelectLevelId, answers: null }
      );
      return response.data.data;
    },
    onSuccess: (progress) => {
      void message.success(`Đã ghi danh lộ trình ở cấp độ ${progress?.levelId ?? ''}`);
      void queryClient.invalidateQueries({ queryKey: ['roadmap', track] });
      onDone();
    },
  });
}
