import { NewVocabWordInput } from '@/stores/types/NewVocabWordInput';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * State contract for the FSRS v5 vocabulary flashcard study store.
 */
export interface StudyStoreState {
  /** Local cache of the learner's deck (server due cards plus locally added words). */
  words: VocabWordDto[];

  /** Ordered ids of the cards still to review in the current session; the head is the active card. */
  sessionQueue: string[];

  /** Whether the back side (meaning & examples) of the active flashcard is revealed. */
  isCardFlipped: boolean;

  /** Number of grading actions performed in the current session. */
  completedInSession: number;

  /** XP granted by the server during the current session. */
  sessionXpEarned: number;

  /** Flips the active flashcard between front and back. */
  toggleFlip: () => void;

  /** Merges cards returned by GET /vocab/due (server state wins) and queues the ones that are due. */
  loadServerDueWords: (serverWords: VocabWordDto[]) => void;

  /** Applies an FSRS rating locally, advances the queue and re-queues the card when it was forgotten. */
  gradeCard: (wordId: string, quality: SrsReviewQuality) => void;

  /** Adds a locally created word (dictionary, reading or import) to the deck as a new due card. */
  addWordToDeck: (word: NewVocabWordInput) => void;

  /** Starts a fresh practice session over the whole deck. */
  restartSession: () => void;

  /** Accumulates XP reported by the server for the current session. */
  addSessionXp: (xp: number) => void;
}
