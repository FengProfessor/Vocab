import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

export interface FlashcardRatingBarProps {
  /** Target word being graded. */
  word: VocabWordDto;
  /** Whether rating action is currently syncing with the backend API. */
  isLoading: boolean;
  /** Whether the card is flipped. Ratings are typically disabled until flipped. */
  isFlipped: boolean;
  /** Callback triggered when user submits a quality score. */
  onGrade: (quality: SrsReviewQuality) => void;
  /** Callback to flip card via keyboard shortcut (Space). */
  onToggleFlip: () => void;
}
