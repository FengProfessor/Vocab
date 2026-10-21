import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { LexicalEvidenceSource } from '@/types/enums/LexicalEvidenceSource';
import { LexicalStatusBucket } from '@/types/enums/LexicalStatusBucket';
import { LexicalSupportLevel } from '@/types/enums/LexicalSupportLevel';
import { RecordEvidenceParams } from '@/hooks/types/RecordEvidenceParams';

/**
 * Records learner lexical evidence via POST /api/v1/speaking-foundation/evidence (latency measured by the caller).
 */
export function useRecordLexicalEvidence() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (params: RecordEvidenceParams) => {
      const response = await apiClient.post<ApiResponse<LexicalStatusBucket>>('/speaking-foundation/evidence', {
        conceptId: params.conceptId,
        evidenceSource: LexicalEvidenceSource.Learner,
        supportLevel: LexicalSupportLevel.Independent,
        probeType: params.modality,
        isSuccessful: params.isSuccessful,
        responseLatencyMs: params.responseLatencyMs,
      });
      return response.data.data;
    },
    onSuccess: (bucket) => {
      void message.success(`Đã lưu kết quả luyện phát âm (trạng thái từ: ${String(bucket)})`);
    },
  });
}
