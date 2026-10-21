import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';

/**
 * Presentation metadata of one FSRS rating button.
 */
export interface FlashcardRatingOption {
  /** FSRS review quality sent to the scheduler. */
  quality: SrsReviewQuality;
  /** Vietnamese label. */
  label: string;
  /** Keyboard shortcut displayed next to the label. */
  shortcut: string;
  /** Visual emphasis of the button. */
  appearance: 'danger' | 'default' | 'ghost' | 'primary';
}
