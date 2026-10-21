import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';

export interface FlashcardShortcutOptions {
  isFlipped: boolean;
  isBusy: boolean;
  onToggleFlip: () => void;
  onGrade: (quality: SrsReviewQuality) => void;
}
