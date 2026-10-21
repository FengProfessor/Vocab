import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * Props for the FlashcardSessionPanel component.
 */
export interface FlashcardSessionPanelProps {
  /** Active card, or undefined when the due queue is empty. */
  word?: VocabWordDto;
  /** Number of cards still waiting in the session queue (including the active one). */
  remainingCount: number;
  /** Whether the due queue is being loaded. */
  isLoading: boolean;
  /** Whether a review is being synced to the API. */
  isGrading: boolean;
  /** Whether the active card is flipped. */
  isFlipped: boolean;
  /** Flips the active card. */
  onToggleFlip: () => void;
  /** Grades the active card. */
  onGrade: (quality: SrsReviewQuality) => void;
  /** Opens the bulk import drawer from the empty state. */
  onOpenImport: () => void;
  /** Restarts practice over the whole deck from the empty state. */
  onRestart: () => void;
}
