import { App } from '@/components/ui/Primitives';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { GuidUtils } from '@/lib/guidUtils';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerSrsReviewResponseDto } from '@/types/vocab/ServerSrsReviewResponseDto';
import { SubmitWordReviewParams } from '@/hooks/types/SubmitWordReviewParams';

/**
 * Posts an FSRS rating to POST /api/v1/vocab/review.
 * Words that only exist locally (not a server GUID) are scheduled on the client only.
 * TODO: [Backend API Required] POST /api/v1/vocab/words (create/import) so local words can be persisted and reviewed server-side.
 */
export function useSubmitWordReview() {
  const { message } = App.useApp();
  const addSessionXp = useStudyStore((state) => state.addSessionXp);

  return useMutation({
    mutationFn: async ({ wordId, quality }: SubmitWordReviewParams) => {
      if (!GuidUtils.isGuid(wordId)) {
        return null;
      }
      const response = await apiClient.post<ApiResponse<ServerSrsReviewResponseDto>>(
        '/vocab/review',
        { wordId, quality, reviewId: crypto.randomUUID() }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data) {
        addSessionXp(data.xpAwarded);
        void message.success(
          `Đã ghi nhận FSRS (+${data.xpAwarded} XP • Chu kỳ mới: ${data.intervalDays} ngày)`
        );
      }
    },
  });
}
