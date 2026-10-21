import { VocabWordDto } from '@/types/vocab/VocabWordDto';

export interface VocabQuizCardProps {
  /** Complete list of vocabulary words available in the current deck. */
  words: VocabWordDto[];
  /** Callback when user finishes a question or scores points. */
  onScoreChange?: (score: number) => void;
}
