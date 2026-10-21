export interface FlashcardSessionSummaryModalProps {
  /** Whether the summary modal is visible. */
  open: boolean;
  /** Number of cards successfully reviewed during the current study session. */
  cardsReviewedCount: number;
  /** Total XP earned in this review session. */
  xpEarned: number;
  /** Active user streak days. */
  streakDays: number;
  /** Callback to start a new review session. */
  onRestart: () => void;
  /** Callback to close the modal. */
  onClose: () => void;
}
