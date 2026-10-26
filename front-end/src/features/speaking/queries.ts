import { useMutation, useQuery } from '@tanstack/react-query';
import { SpeakingApi } from '@/features/speaking/api';
import type {
  RecordEvidenceParams,
  SpeakingDialogueParams,
} from '@/features/speaking/types';

export function useSpeakingDiagnosticProbesQuery(enabled = true) {
  return useQuery({
    queryKey: ['speaking', 'diagnostic-probes'] as const,
    queryFn: () => SpeakingApi.getDiagnosticProbes(),
    enabled,
  });
}

export function useRecordSpeakingEvidenceMutation() {
  return useMutation({
    mutationFn: (params: RecordEvidenceParams) => SpeakingApi.recordEvidence(params),
  });
}

export function useSpeakingDialogueMutation() {
  return useMutation({
    mutationFn: (params: SpeakingDialogueParams) =>
      SpeakingApi.submitSpeakingDialogue(params),
  });
}
