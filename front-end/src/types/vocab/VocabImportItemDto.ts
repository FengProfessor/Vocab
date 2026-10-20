import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';

/**
 * Data transfer object representing a parsed vocabulary item ready for bulk deck import.
 */
export interface VocabImportItemDto {
  /** Temporary client unique key for table row tracking. */
  key: string;
  /** Vocabulary headword term. */
  word: string;
  /** Phonetic notation string (optional). */
  phonetic: string;
  /** Normalized part of speech. */
  partOfSpeech: PartOfSpeechType;
  /** Primary Vietnamese definition. */
  meaningVi: string;
  /** English contextual example sentence (optional). */
  exampleEn?: string;
  /** Vietnamese translation of the example sentence (optional). */
  exampleVi?: string;
  /** CEFR target level. */
  certLevel: CertLevel;
  /** Validation error message if the row format is incomplete. */
  errorMessage?: string;
}
