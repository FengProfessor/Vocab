import { App } from '@/components/ui/Primitives';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerClassroomDto } from '@/types/teacher/ServerClassroomDto';

/**
 * Creates a classroom via POST /api/v1/classrooms and refreshes the list.
 */
export function useCreateClassroom(onCreated: () => void) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; description: string }) => {
      const response = await apiClient.post<ApiResponse<ServerClassroomDto>>('/classrooms', params);
      return response.data.data;
    },
    onSuccess: (created) => {
      if (created) {
        void message.success(`Đã tạo lớp "${created.name}" (Mã tham gia: ${created.inviteCode})`);
      }
      void queryClient.invalidateQueries({ queryKey: ['teacher-classrooms'] });
      onCreated();
    },
  });
}
