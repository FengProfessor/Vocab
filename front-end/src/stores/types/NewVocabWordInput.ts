import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * Fields the caller provides when adding a locally created word (import, dictionary, reading); the store fills the FSRS schedule.
 */
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
