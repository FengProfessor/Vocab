import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoadmapApi } from '@/features/roadmap/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for loading the learner's roadmap tree.
 */
export function useRoadmapQuery(track?: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roadmap.tree(track),
    queryFn: () => RoadmapApi.getRoadmap(track),
    enabled,
  });
}

/**
 * React Query hook for loading a roadmap unit checkpoint.
 */
export function useRoadmapCheckpointQuery(unitId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.roadmap.checkpoint(unitId ?? ''),
    queryFn: () => RoadmapApi.getCheckpoint(unitId!),
    enabled: Boolean(unitId) && enabled,
  });
}

/**
 * React Query mutation for completing a roadmap step.
 */
export function useCompleteRoadmapStepMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { stepId: string; score?: number; unitId?: string; levelId?: string }) =>
      RoadmapApi.completeStep(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.roadmap.all });
    },
  });
}
