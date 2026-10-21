import { ServerDailyReadingDto } from '@/types/reading/ServerDailyReadingDto';

/**
 * Props for the DailyReadingCard component.
 */
export interface DailyReadingCardProps {
  /** Today's reading exercise from the server, if available. */
  daily?: ServerDailyReadingDto | null;
  /** Vocabulary words of the passage that can be added to the FSRS deck. */
  keywords: string[];
  /** Word currently being looked up and saved, if any. */
  savingWord?: string | null;
  /** Adds a word to the FSRS deck. */
  onSaveWord: (word: string) => void;
}
