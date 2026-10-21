import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { FlashcardRatingOption } from '@/config/types/FlashcardRatingOption';

/**
 * The four FSRS rating buttons in display order (legacy flashcard: Quên / Khó / Tốt / Dễ).
 */
export const FLASHCARD_RATING_OPTIONS: readonly FlashcardRatingOption[] = [
  { quality: SrsReviewQuality.Again, label: 'Quên', shortcut: '1', appearance: 'danger' },
  { quality: SrsReviewQuality.Hard, label: 'Khó', shortcut: '2', appearance: 'default' },
  { quality: SrsReviewQuality.Good, label: 'Tốt', shortcut: '3', appearance: 'ghost' },
  { quality: SrsReviewQuality.Easy, label: 'Dễ', shortcut: '4', appearance: 'primary' },
];
