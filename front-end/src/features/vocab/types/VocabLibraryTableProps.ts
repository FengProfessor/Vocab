import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * Props for the VocabLibraryTable component.
 */
export interface VocabLibraryTableProps {
  /** All cards in the learner's deck. */
  words: VocabWordDto[];
  /** Whether the deck is still loading from the API. */
  isLoading: boolean;
}
