import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClassroomApi } from '@/features/classroom/api';
import { queryKeys } from '@/shared/api/queryKeys';

/**
 * React Query hook for listing classrooms.
 */
export function useClassroomsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.classroom.list(),
    queryFn: () => ClassroomApi.getClassrooms(),
    enabled,
  });
}

/**
 * React Query hook for classroom leaderboard.
 */
export function useClassroomLeaderboardQuery(classroomId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.classroom.leaderboard(classroomId ?? ''),
    queryFn: () => ClassroomApi.getLeaderboard(classroomId!),
    enabled: Boolean(classroomId) && enabled,
  });
}

/**
 * React Query mutation for joining a classroom by invite code.
 */
export function useJoinClassroomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => ClassroomApi.joinClassroom({ inviteCode }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classroom.all });
    },
  });
}
