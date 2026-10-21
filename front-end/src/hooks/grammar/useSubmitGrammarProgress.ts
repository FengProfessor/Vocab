import { useState } from 'react';
import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { GrammarProgressDto } from '@/types/grammar/GrammarProgressDto';
import { SubmitGrammarProgressParams } from '@/hooks/types/SubmitGrammarProgressParams';

/**
 * Records a grammar attempt via POST /api/v1/grammar/progress (the server maps accuracy to an FSRS rating)
 * and keeps the latest result per topic for display.
 */
export function useSubmitGrammarProgress() {
  const { message } = App.useApp();
  const [results, setResults] = useState<Record<string, GrammarProgressDto>>({});

  const mutation = useMutation({
    mutationFn: async (params: SubmitGrammarProgressParams) => {
      const response = await apiClient.post<ApiResponse<GrammarProgressDto>>(
        '/grammar/progress',
        params
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      if (!data) {
        return;
      }
      setResults((previous) => ({ ...previous, [data.topicSlug]: data }));
      void message.success(`Đã cập nhật tiến độ ngữ pháp (+${data.xpAwarded} XP)`);
    },
  });

  return { ...mutation, results };
}
