import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Data transfer object representing a dynamically generated vocabulary quiz question.
 */
export interface VocabQuizQuestionDto {
  /** Target word identifier. */
  wordId: string;
  /** English headword being tested. */
  promptWord: string;
  /** Phonetic pronunciation transcript. */
  phonetic: string;
  /** Part of speech label. */
  partOfSpeech: string;
  /** Target CEFR certificate level. */
  certLevel: CertLevel;
  /** Contextual example sentence with the target word blanked or highlighted. */
  exampleEn: string;
  /** List of 4 distinct answer choices (Vietnamese meanings). */
  options: string[];
  /** Zero-based index of the correct option in the options array. */
  correctOptionIndex: number;
  /** Full Vietnamese translation for the correct word. */
  correctMeaningVi: string;
}
