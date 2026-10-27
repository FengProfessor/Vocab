import {
  CertLevel,
  FoundationClarityRating,
  FoundationModalityType,
} from '@/types/enums';

export interface ServerDiagnosticProbeDto {
  conceptId: string;
  conceptCode: string;
  headword: string;
  ipa: string;
  meaningVi: string;
  frequencyBand: number;
  certLevel: CertLevel;
}

export interface ServerAiSpeakingFeedbackDto {
  response: string;
  feedback: string;
  suggestedResponse: string;
}

export interface RecordEvidenceParams {
  conceptId: string;
  modality: FoundationModalityType;
  isSuccessful: boolean;
  responseLatencyMs: number;
}

export interface SpeakingDialogueParams {
  lastTranscript: string;
  history: string[];
}

export interface AudioRecorderProps {
  promptText: string;
  onRecordingComplete?: (clarity: FoundationClarityRating) => void;
}

export type * from '@/types/ipa';
export type * from '@/types/pronunciation';
export type * from '@/types/speaking-foundation';
export type * from '@/types/speaking-topic-library';
export type {
  SpeakingPhaseId,
  SpeakingCurriculumLesson,
} from '@/types/speaking-curriculum';
