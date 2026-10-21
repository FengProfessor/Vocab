import { ServerReadingArticleDto } from '@/types/reading/ServerReadingArticleDto';

/**
 * Props for the ReadingArticleViewer component.
 */
export interface ReadingArticleViewerProps {
  /** Article to display, if one is selected. */
  article?: ServerReadingArticleDto;
  /** Vocabulary words of the passage that can be added to the FSRS deck. */
  keywords: string[];
  /** Word currently being looked up and saved, if any. */
  savingWord?: string | null;
  /** Adds a word to the FSRS deck. */
  onSaveWord: (word: string) => void;
}
