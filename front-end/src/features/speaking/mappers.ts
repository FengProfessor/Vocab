import { CertLevel } from '@/types/enums';
import type {
  ServerAiSpeakingFeedbackDto,
  ServerDiagnosticProbeDto,
} from '@/features/speaking/types';

export function mapDiagnosticProbeDto(
  raw: Record<string, unknown>,
): ServerDiagnosticProbeDto {
  return {
    conceptId: String(raw.conceptId ?? ''),
    conceptCode: String(raw.conceptCode ?? ''),
    headword: String(raw.headword ?? ''),
    ipa: String(raw.ipa ?? ''),
    meaningVi: String(raw.meaningVi ?? ''),
    frequencyBand: Number(raw.frequencyBand ?? 1),
    certLevel: (raw.certLevel as CertLevel) ?? CertLevel.A1,
  };
}

export function mapSpeakingFeedbackDto(
  raw: Record<string, unknown> | null | undefined,
): ServerAiSpeakingFeedbackDto {
  return {
    response: String(raw?.response ?? ''),
    feedback: String(raw?.feedback ?? ''),
    suggestedResponse: String(raw?.suggestedResponse ?? ''),
  };
}
