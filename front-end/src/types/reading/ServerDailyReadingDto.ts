import { CertLevel } from '@/types/enums/CertLevel';

/**
 * Daily reading exercise returned by GET /api/v1/reading/daily.
 */
export interface ServerDailyReadingDto {
  /** Exercise identifier. */
  id: string;
  /** Exercise date (yyyy-MM-dd). */
  exerciseDate: string;
  /** Passage title. */
  title: string;
  /** Passage text. */
  passageContent: string;
  /** Target CEFR level. */
  certLevel: CertLevel;
  /** JSON array of the learner's vocabulary words woven into the passage. */
  usedWordsJson: string;
  /** JSON array of multiple-choice comprehension questions. */
  mcqQuestionsJson: string;
  /** JSON array of cloze (fill-in-the-blank) items. */
  clozeItemsJson: string;
  /** Whether the learner already completed today's exercise. */
  isCompletedToday: boolean;
}
