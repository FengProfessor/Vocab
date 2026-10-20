import React, { useEffect } from 'react';
import { Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

interface FlashcardRatingBarProps {
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

/**
 * Interactive FSRS rating button group allowing users to grade recall difficulty
 * with estimated repetition interval previews and keyboard shortcuts (1, 2, 3, 4, Space).
 */
export const FlashcardRatingBar: React.FC<FlashcardRatingBarProps> = ({
  word,
  isLoading,
  isFlipped,
  onGrade,
  onToggleFlip,
}) => {
  const scheduleSnapshot = {
    intervalDays: word.intervalDays,
    repetitions: word.repetitions,
    easeFactor: word.easeFactor,
    stability: word.stability,
    difficulty: word.difficulty,
    lapses: word.lapses,
    state: word.cardState,
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        onToggleFlip();
      } else if (isFlipped && !isLoading) {
        if (event.key === '1') {
          onGrade(SrsReviewQuality.Again);
        } else if (event.key === '2') {
          onGrade(SrsReviewQuality.Hard);
        } else if (event.key === '3') {
          onGrade(SrsReviewQuality.Good);
        } else if (event.key === '4') {
          onGrade(SrsReviewQuality.Easy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isLoading, onGrade, onToggleFlip]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginTop: 16,
      }}
    >
      <Button
        danger
        disabled={!isFlipped}
        loading={isLoading}
        onClick={() => onGrade(SrsReviewQuality.Again)}
        style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontWeight: 600 }}>Quên (1)</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {FsrsEngine.getIntervalPreviewLabel(SrsReviewQuality.Again, scheduleSnapshot)}
        </span>
      </Button>

      <Button
        disabled={!isFlipped}
        loading={isLoading}
        onClick={() => onGrade(SrsReviewQuality.Hard)}
        style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontWeight: 600 }}>Khó (2)</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {FsrsEngine.getIntervalPreviewLabel(SrsReviewQuality.Hard, scheduleSnapshot)}
        </span>
      </Button>

      <Button
        type="primary"
        ghost
        disabled={!isFlipped}
        loading={isLoading}
        onClick={() => onGrade(SrsReviewQuality.Good)}
        style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontWeight: 600 }}>Tốt (3)</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {FsrsEngine.getIntervalPreviewLabel(SrsReviewQuality.Good, scheduleSnapshot)}
        </span>
      </Button>

      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        disabled={!isFlipped}
        loading={isLoading}
        onClick={() => onGrade(SrsReviewQuality.Easy)}
        style={{ height: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontWeight: 600 }}>Dễ (4)</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>
          {FsrsEngine.getIntervalPreviewLabel(SrsReviewQuality.Easy, scheduleSnapshot)}
        </span>
      </Button>
    </div>
  );
};
