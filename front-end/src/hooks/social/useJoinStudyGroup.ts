import { App } from '@/components/ui/Primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerStudyGroupDto } from '@/types/social/ServerStudyGroupDto';

/**
 * Joins a study group by invite code via POST /api/v1/social/groups/join and refreshes the hub.
 */
export function useJoinStudyGroup() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.post<ApiResponse<ServerStudyGroupDto>>('/social/groups/join', {
        inviteCode,
      });
      return response.data.data;
    },
    onSuccess: (group) => {
      void message.success(`Đã tham gia nhóm học "${group?.name ?? ''}"`);
      void queryClient.invalidateQueries({ queryKey: ['social-referral-hub'] });
    },
  });
}
