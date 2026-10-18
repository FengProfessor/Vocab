import { SrsCardState } from '@/types/enums/SrsCardState';

/**
 * Represents the memory scheduling parameters of a spaced repetition flashcard.
 */
export interface SrsCardScheduleDto {
  /** Current interval in days until the next review. */
  intervalDays: number;

  /** Number of consecutive successful recalls. */
  repetitions: number;

  /** Legacy SM-2 ease factor (maintained for backward compatibility). */
  easeFactor: number;

  /** FSRS v5 memory stability in days. */
  stability: number;

  /** FSRS v5 item difficulty on a [1.0, 10.0] scale. */
  difficulty: number;

  /** Total count of times the card was forgotten after being learned. */
  lapses: number;

  /** Current lifecycle state of the card in the FSRS state machine. */
  state: SrsCardState;

  /** ISO 8601 timestamp of the previous review, if any. */
  lastReviewedAt?: string | null;
}
