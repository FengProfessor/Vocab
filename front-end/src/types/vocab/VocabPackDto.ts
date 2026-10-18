import { CertLevel } from '@/types/enums/CertLevel';
import { VocabPackStatus } from '@/types/enums/VocabPackStatus';

/**
 * Represents a curated vocabulary deck or thematic word pack.
 */
export interface VocabPackDto {
  /** Unique pack identifier. */
  id: string;

  /** Title of the vocabulary pack. */
  title: string;

  /** Subtitle or thematic description. */
  description: string;

  /** Target CEFR / VSTEP certification level. */
  certLevel: CertLevel;

  /** Total number of words in the pack. */
  totalWords: number;

  /** Number of words already mastered by the current learner. */
  masteredWords: number;

  /** Number of words currently due for FSRS review. */
  dueWords: number;

  /** Publication status of the pack. */
  status: VocabPackStatus;
}
