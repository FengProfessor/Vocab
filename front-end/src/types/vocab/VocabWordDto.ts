import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';

/**
 * Represents a vocabulary entry with FSRS spaced repetition metadata.
 */
export interface VocabWordDto {
  /** Unique identifier of the vocabulary card. */
  id: string;

  /** English headword or phrase. */
  word: string;

  /** IPA phonetic transcription. */
  phonetic: string;

  /** Grammatical part of speech. */
  partOfSpeech: PartOfSpeechType;

  /** Vietnamese translation and concise meaning. */
  meaningVi: string;

  /** English contextual definition. */
  definitionEn: string;

  /** Contextual example sentence in English. */
  exampleEn: string;

  /** Vietnamese translation of the example sentence. */
  exampleVi: string;

  /** Associated CEFR / VSTEP certification level. */
  certLevel: CertLevel;

  /** Optional audio pronunciation URL. */
  audioUrl?: string | null;

  /** Current FSRS card learning state. */
  cardState: SrsCardState;

  /** Next scheduled review timestamp in ISO 8601 format. */
  nextReviewAt: string;

  /** Current scheduled interval in days. */
  intervalDays: number;

  /** FSRS ease factor (legacy SM-2 compatibility) or difficulty weight. */
  easeFactor: number;

  /** Consecutive successful review count. */
  repetitions: number;

  /** FSRS v5 memory stability (S) in days. */
  stability: number;

  /** FSRS v5 memory difficulty (D) on [1, 10] scale. */
  difficulty: number;

  /** Total number of lapses (forgotten reviews). */
  lapses: number;
}
