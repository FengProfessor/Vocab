import { SrsCardState } from '@/types/enums/SrsCardState';

/**
 * Result of POST /api/v1/grammar/progress: updated FSRS schedule of a grammar topic.
 */
export interface GrammarProgressDto {
  /** Topic slug the progress belongs to. */
  topicSlug: string;
  /** Mastery score (0..100); at least 80 marks the topic as mastered. */
  masteryScore: number;
  /** FSRS card state of the topic. */
  state: SrsCardState | string;
  /** FSRS stability in days. */
  stability: number;
  /** FSRS difficulty (1..10). */
  difficulty: number;
  /** Days until the next review. */
  intervalDays: number;
  /** Next review date (yyyy-MM-dd). */
  nextReviewDate: string;
  /** XP granted for the attempt. */
  xpAwarded: number;
}
