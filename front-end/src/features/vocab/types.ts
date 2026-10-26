import {
  CertLevel,
  PartOfSpeechType,
  SrsAlgorithmVersion,
  SrsCardState,
  SrsReviewQuality,
  VocabPackStatus,
} from '@/types/enums';
import type { DictionaryData } from '@/features/dictionary/types';

export interface SRSProgress {
  id: string;
  user_id: string;
  word_id: string;
  ease_factor: number;
  stability?: number;
  difficulty?: number;
  interval_days: number;
  review_count: number;
  next_review_date: string;
  last_reviewed_at?: string;
}

export interface Word {
  id: string;
  classroom_id: string;
  added_by?: string;
  word: string;
  translation?: string;
  ipa?: string;
  pos?: string;
  example?: string;
  /** Bản dịch VI tự nhiên của example — sub khi học từ mới */
  example_vi?: string | null;
  source_url?: string;
  status?: string;
  created_at: string;
  image_url?: string;
  image_source?: string;
  image_confidence?: number | null;
  synonyms?: string[];
  antonyms?: string[];
  dictionary_data?: DictionaryData | null;
  // Joined SRS for current user
  srs?: SRSProgress;
  isDue?: boolean;
  srsLevel?: number;
}

export interface ServerSrsReviewResponseDto {
  wordId: string;
  state: SrsCardState;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string;
  reps: number;
  lapses: number;
  xpAwarded: number;
}

export interface ServerWordWithSrsDto {
  id: string;
  term: string;
  ipa: string;
  translation: string;
  partOfSpeech: PartOfSpeechType | string;
  imageUrl: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  topic: string;
  level: CertLevel | string;
  srsState: SrsCardState | string;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string | null;
}

export enum SpellingVerdict {
  Correct = 'correct',
  Close = 'close',
  Wrong = 'wrong',
}

export interface SrsCardScheduleDto {
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  stability: number;
  difficulty: number;
  lapses: number;
  state: SrsCardState;
  lastReviewedAt?: string | null;
}

export interface SrsReviewResultDto extends SrsCardScheduleDto {
  nextReviewAt: string;
  retrievability: number;
  algorithmVersion: SrsAlgorithmVersion;
}

export interface VocabImportItemDto {
  key: string;
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeechType;
  meaningVi: string;
  exampleEn?: string;
  exampleVi?: string;
  certLevel: CertLevel;
  errorMessage?: string;
}

export interface VocabPackDto {
  id: string;
  title: string;
  description: string;
  certLevel: CertLevel;
  totalWords: number;
  masteredWords: number;
  dueWords: number;
  status: VocabPackStatus;
}

export interface VocabQuizQuestionDto {
  wordId: string;
  promptWord: string;
  phonetic: string;
  partOfSpeech: string;
  certLevel: CertLevel;
  exampleEn: string;
  options: string[];
  correctOptionIndex: number;
  correctMeaningVi: string;
}

export interface VocabWordDto {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: PartOfSpeechType;
  meaningVi: string;
  definitionEn: string;
  exampleEn: string;
  exampleVi: string;
  certLevel: CertLevel;
  audioUrl?: string | null;
  cardState: SrsCardState;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  stability: number;
  difficulty: number;
  lapses: number;
}

export type NewVocabWordInput = Omit<
  VocabWordDto,
  | 'id'
  | 'cardState'
  | 'nextReviewAt'
  | 'intervalDays'
  | 'easeFactor'
  | 'repetitions'
  | 'stability'
  | 'difficulty'
  | 'lapses'
>;

export interface SubmitWordReviewParams {
  wordId: string;
  quality: SrsReviewQuality;
}

export interface FlashcardShortcutOptions {
  isFlipped: boolean;
  isBusy: boolean;
  onToggleFlip: () => void;
  onGrade: (quality: SrsReviewQuality) => void;
}
