import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerClassroomDto } from '@/types/teacher/ServerClassroomDto';

/**
 * Loads the teacher's classrooms from GET /api/v1/classrooms.
 */
export function useClassroomsQuery() {
  return useQuery({
    queryKey: ['teacher-classrooms'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerClassroomDto[]>>('/classrooms');
      return response.data.data ?? [];
    },
  });
}
