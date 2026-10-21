import { DictionaryEntryData } from '@/types/dictionary/DictionaryEntryData';

/**
 * Props for the DictionaryEntryCard component.
 */
export interface DictionaryEntryCardProps {
  /** Parsed dictionary entry to display. */
  entry: DictionaryEntryData;
  /** Adds the entry's headword to the FSRS deck. */
  onAddToDeck: (entry: DictionaryEntryData) => void;
}
