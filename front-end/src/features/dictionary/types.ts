import { CoachMessageSender } from '@/types/enums';

export interface RichCollocationEntry {
  phrase: string;
  meaning_vi?: string;
  type?: string; // e.g. 'v+n', 'adj+n', 'prep+n', 'phrasal_verb'
  example?: string;
}

export interface MorphologyAffix {
  affix: string;
  meaning_vi?: string;
}

export interface MorphologyData {
  rootWord?: string;
  rootMeaning?: string;
  prefixes?: MorphologyAffix[];
  suffixes?: MorphologyAffix[];
}

export interface CoreSenseEntry {
  pos: string;
  label_vi?: string;
  definition_vi?: string;
  definition_en?: string;
  cefr?: string;
  region?: string;
  register?: string;
  example?: string;
  example_vi?: string;
  collocations?: string[];
  popularity?: number;
}

export interface DictionaryMeaning {
  pos?: string;
  definition?: string;
  definition_en?: string;
  label_vi?: string;
  example?: string;
  /** Sub VI của example (nếu có) */
  example_vi?: string;
  cefr?: string;
  popularity?: number;
  isPrimary?: boolean;
  toeic_tip?: string;
  collocations?: (string | RichCollocationEntry)[];
}

/** Một từ trong word family (từ phái sinh) kèm nghĩa Việt. */
export interface WordFamilyEntry {
  word: string;
  pos?: string;
  meaning?: string;
  ipa?: string;
  example?: string;
}

export interface DictionaryData {
  word?: string;
  pronunciations?: { ipa?: string; region?: 'UK' | 'US' | null }[];
  results?: { meanings?: DictionaryMeaning[] }[];
  core_senses?: CoreSenseEntry[];
  /** Dạng cũ: string[] ("word (pos)"). Dạng mới: WordFamilyEntry[] (có nghĩa Việt). Reader phải chấp nhận cả hai. */
  familyWords?: (string | WordFamilyEntry)[];
  wordFamily?: (string | WordFamilyEntry)[];
  word_family?: (string | WordFamilyEntry)[];
  collocations?: (string | RichCollocationEntry)[];
  morphology?: MorphologyData;
  synonyms?: string[];
  antonyms?: string[];
  image_search_query?: string;
  definition?: string;
  pos?: string;
  example?: string;
  example_vi?: string;
  toeic_tip?: string;
}

export interface GlobalDictionaryEntry {
  id: string;
  word: string;
  tags: string[];
  data: DictionaryData;
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  image_query?: string;
  image_verified_at?: string;
  created_at: string;
}

export interface DictionarySenseItem {
  sense?: number;
  en: string;
  vi: string;
  example?: string;
}

export interface DictionaryEntryData {
  id: string;
  term: string;
  ipa: string;
  partOfSpeech: string;
  senses: DictionarySenseItem[];
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
}

export interface ServerDictionaryEntryDto {
  id: string;
  term: string;
  ipa: string;
  partOfSpeech: string;
  definitionsJson: string;
  collocationsJson: string;
  synonymsJson: string;
  antonymsJson: string;
  bestContextualSenseIndex: number | null;
}

export interface CoachMessageItem {
  id: string;
  sender: CoachMessageSender;
  text: string;
}

export interface ServerAiSentenceAnalysisDto {
  mainClause: string;
  secondaryClauses: string[];
  kernel: Record<string, unknown>;
  buildLevels: string[];
  chunks: unknown[];
  aiSource: string;
}

export interface OcrExtractParams {
  base64Image: string;
  mimeType: string;
}

export type * from '@/types/sentence-analysis';
export type * from '@/types/translation';
