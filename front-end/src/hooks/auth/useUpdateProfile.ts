import { App } from '@/components/ui/Primitives';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { UserProfileFormValues } from '@/features/auth/types/UserProfileFormValues';

/**
 * Saves profile preferences via PUT /api/v1/auth/onboarding, then re-reads the profile so every screen shows the saved values.
 */
export function useUpdateProfile(onSaved: () => void) {
  const { message } = App.useApp();
  const verifyServerSession = useAuthStore((state) => state.verifyServerSession);

  return useMutation({
    mutationFn: async (values: UserProfileFormValues) => {
      const response = await apiClient.put<ApiResponse<unknown>>('/auth/onboarding', values);
      return response.data;
    },
    onSuccess: async () => {
      await verifyServerSession();
      void message.success('Đã cập nhật hồ sơ học viên.');
      onSaved();
    },
  });
}
