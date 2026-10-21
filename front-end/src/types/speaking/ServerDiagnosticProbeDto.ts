import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Diagnostic probe returned by GET /api/v1/speaking-foundation/diagnostic/probes (backend DiagnosticProbeDto).
 */
export interface ServerDiagnosticProbeDto {
  /** Concept id used when recording lexical evidence. */
  conceptId: string;
  /** Stable concept code. */
  conceptCode: string;
  /** English headword to practice. */
  headword: string;
  /** IPA transcription. */
  ipa: string;
  /** Vietnamese meaning. */
  meaningVi: string;
  /** Frequency band of the word (lower = more frequent). */
  frequencyBand: number;
  /** CEFR level of the concept. */
  certLevel: CertLevel;
}
