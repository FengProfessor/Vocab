import { useEffect } from 'react';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { FlashcardShortcutOptions } from '@/hooks/types/FlashcardShortcutOptions';

/** Keyboard keys mapped to FSRS ratings (legacy flashcard shortcuts). */
const KEY_TO_QUALITY: Readonly<Record<string, SrsReviewQuality>> = {
  '1': SrsReviewQuality.Again,
  '2': SrsReviewQuality.Hard,
  '3': SrsReviewQuality.Good,
  '4': SrsReviewQuality.Easy,
};

/**
 * Registers the flashcard keyboard shortcuts: Space flips, 1-4 grade the flipped card.
 */
export function useFlashcardShortcuts({
  isFlipped,
  isBusy,
  onToggleFlip,
  onGrade,
}: FlashcardShortcutOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        onToggleFlip();
        return;
      }
      const quality = KEY_TO_QUALITY[event.key];
      if (quality !== undefined && isFlipped && !isBusy) {
        onGrade(quality);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isBusy, onToggleFlip, onGrade]);
}
