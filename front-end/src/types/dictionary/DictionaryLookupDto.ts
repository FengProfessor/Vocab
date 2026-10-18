import { CertLevel } from '@/types/enums/CertLevel';
import { LexicalStatusBucket } from '@/types/enums/LexicalStatusBucket';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';

/**
 * Represents a comprehensive dictionary lookup entry with collocations, synonyms, and lexical memory status.
 */
export interface DictionaryLookupDto {
  /** Headword in English. */
  word: string;

  /** British and American IPA phonetic transcription. */
  phonetic: string;

  /** Primary grammatical part of speech. */
  partOfSpeech: PartOfSpeechType;

  /** CEFR / VSTEP band classification. */
  certLevel: CertLevel;

  /** Primary Vietnamese meaning. */
  meaningVi: string;

  /** Detailed English definition. */
  definitionEn: string;

  /** High-frequency academic and TOEIC collocations. */
  collocations: string[];

  /** Synonyms for lexical paraphrasing in Writing & Speaking. */
  synonyms: string[];

  /** Bilingual example sentences. */
  examples: Array<{ en: string; vi: string }>;

  /** Current lexical retention status bucket for the authenticated learner. */
  lexicalBucket: LexicalStatusBucket;
}
