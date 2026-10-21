import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { OcrExtractParams } from '@/hooks/types/OcrExtractParams';

/**
 * Extracts vocabulary from an uploaded image through POST /api/v1/dictionary/ocr/extract (returns word list).
 */
export function useOcrExtractWords() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (params: OcrExtractParams) => {
      const response = await apiClient.post<ApiResponse<string[]>>('/dictionary/ocr/extract', params);
      return response.data.data ?? [];
    },
    onSuccess: (words) => {
      if (words.length === 0) {
        void message.info('Không nhận diện được từ vựng nào trong ảnh.');
      } else {
        void message.success(`Đã nhận diện ${words.length} từ vựng!`);
      }
    },
  });
}
