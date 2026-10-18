/**
 * Represents the calculated TOEIC 2-Skill score report using the official ETS 990 barem.
 */
export interface ToeicScoreReportDto {
  /** Number of correct answers in the Listening section (0..100). */
  listeningRaw: number;

  /** Number of correct answers in the Reading section (0..100). */
  readingRaw: number;

  /** Scaled Listening score (5..495) in 5-point increments. */
  listeningScaled: number;

  /** Scaled Reading score (5..495) in 5-point increments. */
  readingScaled: number;

  /** Total scaled TOEIC score (10..990). */
  totalScaled: number;

  /** Equivalent CEFR proficiency band label. */
  cefrBand: string;
}
