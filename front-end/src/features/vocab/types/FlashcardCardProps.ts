import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * Props for the FlashcardCard component.
 */
export interface FlashcardCardProps {
  /** The current active vocabulary word item. */
  word: VocabWordDto;
  /** Whether the card is currently flipped to reveal the definition. */
  isFlipped: boolean;
  /** Callback to flip or unflip the flashcard. */
  onToggleFlip: () => void;
}
