import { create } from 'zustand';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { BrowserStorage } from '@/lib/storage';
import { StudyStoreState } from '@/stores/types/StudyStoreState';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/** Local storage key for the offline cache of the learner's FSRS vocabulary deck. */
const STUDY_DECK_STORAGE_KEY = 'lingopro.study.fsrs_deck.v2';

/** Default FSRS parameters for a brand-new card. */
const NEW_CARD_EASE_FACTOR = 2.5;
const NEW_CARD_DIFFICULTY = 5.0;

/**
 * Whether the card is due for review right now.
 */
function isDue(word: VocabWordDto): boolean {
  return new Date(word.nextReviewAt).getTime() <= Date.now();
}

/**
 * Orders due cards by their scheduled time (oldest first) and returns their ids.
 */
function buildQueue(words: VocabWordDto[], excludeIds: ReadonlySet<string> = new Set()): string[] {
  return words
    .filter((word) => isDue(word) && !excludeIds.has(word.id))
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
    .map((word) => word.id);
}

/**
 * Global Zustand store for FSRS v5 spaced repetition flashcard sessions.
 * The deck is hydrated from the API; nothing is seeded locally.
 */
export const useStudyStore = create<StudyStoreState>((set) => ({
  words: BrowserStorage.getLocal<VocabWordDto[]>(STUDY_DECK_STORAGE_KEY, []),
  sessionQueue: [],
  isCardFlipped: false,
  completedInSession: 0,
  sessionXpEarned: 0,

  toggleFlip: () => set((state) => ({ isCardFlipped: !state.isCardFlipped })),

  loadServerDueWords: (serverWords) =>
    set((state) => {
      const serverIds = new Set(serverWords.map((w) => w.id));
      const serverTerms = new Set(serverWords.map((w) => w.word.toLowerCase()));

      // Server state wins: drop stale copies (same id) and local placeholders of the same term.
      const kept = state.words.filter(
        (w) => !serverIds.has(w.id) && !serverTerms.has(w.word.toLowerCase())
      );
      const merged = [...serverWords, ...kept];
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, merged);

      const alreadyQueued = new Set(state.sessionQueue);
      const incoming = buildQueue(merged).filter((id) => !alreadyQueued.has(id));
      return {
        words: merged,
        sessionQueue: [...state.sessionQueue.filter((id) => merged.some((w) => w.id === id)), ...incoming],
      };
    }),

  gradeCard: (wordId, quality) =>
    set((state) => {
      const updatedWords = state.words.map((card) => {
        if (card.id !== wordId) {
          return card;
        }
        const schedule = FsrsEngine.calculateNextReview(quality, {
          intervalDays: card.intervalDays,
          repetitions: card.repetitions,
          easeFactor: card.easeFactor,
          stability: card.stability,
          difficulty: card.difficulty,
          lapses: card.lapses,
          state: card.cardState,
        });
        return {
          ...card,
          cardState: schedule.state,
          intervalDays: schedule.intervalDays,
          repetitions: schedule.repetitions,
          easeFactor: schedule.easeFactor,
          stability: schedule.stability,
          difficulty: schedule.difficulty,
          lapses: schedule.lapses,
          nextReviewAt: schedule.nextReviewAt,
        };
      });
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, updatedWords);

      // Business rule (SRS_02): a forgotten card re-appears at the end of the same session.
      const remaining = state.sessionQueue.filter((id) => id !== wordId);
      const sessionQueue = quality === SrsReviewQuality.Again ? [...remaining, wordId] : remaining;

      return {
        words: updatedWords,
        sessionQueue,
        isCardFlipped: false,
        completedInSession: state.completedInSession + 1,
      };
    }),

  addWordToDeck: (newWordInput) =>
    set((state) => {
      const exists = state.words.some(
        (w) => w.word.toLowerCase() === newWordInput.word.toLowerCase()
      );
      if (exists) {
        return state;
      }
      const created: VocabWordDto = {
        ...newWordInput,
        id: `local_${crypto.randomUUID()}`,
        cardState: SrsCardState.New,
        nextReviewAt: new Date().toISOString(),
        intervalDays: 0,
        easeFactor: NEW_CARD_EASE_FACTOR,
        repetitions: 0,
        stability: 0,
        difficulty: NEW_CARD_DIFFICULTY,
        lapses: 0,
      };
      const updatedWords = [created, ...state.words];
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, updatedWords);
      return { words: updatedWords, sessionQueue: [...state.sessionQueue, created.id] };
    }),

  restartSession: () =>
    set((state) => {
      const nowIso = new Date(Date.now() - 1000).toISOString();
      const refreshed = state.words.map((w) => ({ ...w, nextReviewAt: nowIso }));
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, refreshed);
      return {
        words: refreshed,
        sessionQueue: buildQueue(refreshed),
        isCardFlipped: false,
        completedInSession: 0,
        sessionXpEarned: 0,
      };
    }),

  addSessionXp: (xp) => set((state) => ({ sessionXpEarned: state.sessionXpEarned + xp })),
}));
