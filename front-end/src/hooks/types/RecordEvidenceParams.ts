import { FoundationModalityType } from '@/types/enums/FoundationModalityType';

export interface RecordEvidenceParams {
  conceptId: string;
  modality: FoundationModalityType;
  isSuccessful: boolean;
  responseLatencyMs: number;
}
