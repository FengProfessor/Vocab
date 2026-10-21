import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { DictionaryEntryMapper } from '@/lib/mappers/dictionaryEntryMapper';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerDictionaryEntryDto } from '@/types/dictionary/ServerDictionaryEntryDto';
import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Looks a term up in the dictionary and adds it, with its real meaning, to the FSRS deck
 * (used when saving words from the reading room).
 */
export function useSaveTermToDeck() {
  const { message } = App.useApp();
  const addWordToDeck = useStudyStore((state) => state.addWordToDeck);
  const certLevel = useAuthStore((state) => state.user?.targetCertLevel ?? CertLevel.B1);

  return useMutation({
    mutationFn: async (term: string) => {
      const response = await apiClient.get<ApiResponse<ServerDictionaryEntryDto>>(
        '/dictionary/lookup',
        { params: { term } }
      );
      return response.data.data;
    },
    onSuccess: (dto, term) => {
      if (!dto) {
        void message.warning(`Không tìm thấy nghĩa của "${term}" trong từ điển.`);
        return;
      }
      const word = DictionaryEntryMapper.toDeckWord(DictionaryEntryMapper.fromServer(dto), certLevel);
      addWordToDeck(word);
      void message.success(`Đã thêm "${term}" vào hàng đợi ôn tập FSRS v5!`);
    },
  });
}
