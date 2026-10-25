import { App } from '@/components/ui/Primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerJoinChallengeResponseDto } from '@/types/challenges/ServerJoinChallengeResponseDto';

/**
 * Enrolls in a challenge via POST /api/v1/challenges/{id}/join and refreshes the list.
 */
export function useJoinChallenge() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiClient.post<ApiResponse<ServerJoinChallengeResponseDto>>(
        `/challenges/${challengeId}/join`
      );
      return response.data.data;
    },
    onSuccess: (result) => {
      const paymentHint = result?.transferCode
        ? ` Chuyển khoản tiền cam kết với nội dung: ${result.transferCode}.`
        : '';
      void message.success(`Đã đăng ký tham gia thử thách.${paymentHint}`);
      void queryClient.invalidateQueries({ queryKey: ['challenges-list'] });
    },
  });
}
