import React from 'react';
import { Button } from 'antd';
import { FLASHCARD_RATING_OPTIONS } from '@/config/flashcardRatingOptions';
import styles from '@/features/vocab/components/FlashcardRatingBar.module.css';
import { FlashcardRatingBarProps } from '@/features/vocab/types/FlashcardRatingBarProps';
import { useFlashcardShortcuts } from '@/hooks/vocab/useFlashcardShortcuts';
import { FsrsEngine } from '@/lib/fsrsEngine';

/**
 * FSRS rating button group with interval previews; also wires the keyboard shortcuts (Space, 1-4).
 */
export const FlashcardRatingBar: React.FC<FlashcardRatingBarProps> = ({
  word,
  isLoading,
  isFlipped,
  onGrade,
  onToggleFlip,
}) => {
  useFlashcardShortcuts({ isFlipped, isBusy: isLoading, onToggleFlip, onGrade });

  const schedule = {
    intervalDays: word.intervalDays,
    repetitions: word.repetitions,
    easeFactor: word.easeFactor,
    stability: word.stability,
    difficulty: word.difficulty,
    lapses: word.lapses,
    state: word.cardState,
  };

  return (
    <div className={styles.bar}>
      {FLASHCARD_RATING_OPTIONS.map((option) => (
        <Button
          key={option.quality}
          className={styles.button}
          danger={option.appearance === 'danger'}
          type={option.appearance === 'primary' || option.appearance === 'ghost' ? 'primary' : 'default'}
          ghost={option.appearance === 'ghost'}
          disabled={!isFlipped}
          loading={isLoading}
          onClick={() => onGrade(option.quality)}
        >
          <span className={styles.label}>
            {option.label} ({option.shortcut})
          </span>
          <span className={styles.interval}>
            {FsrsEngine.getIntervalPreviewLabel(option.quality, schedule)}
          </span>
        </Button>
      ))}
    </div>
  );
};
