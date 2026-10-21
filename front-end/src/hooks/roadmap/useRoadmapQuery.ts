import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { ServerRoadmapProgressDto } from '@/types/roadmap/ServerRoadmapProgressDto';

/**
 * Loads the learner's enrollment and completed stations for a track from GET /api/v1/roadmap?track=.
 */
export function useRoadmapQuery(track: RoadmapTrackType) {
  return useQuery({
    queryKey: ['roadmap', track],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerRoadmapProgressDto>>('/roadmap', {
        params: { track },
      });
      return response.data.data ?? null;
    },
  });
}
