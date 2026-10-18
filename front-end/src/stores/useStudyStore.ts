import { create } from 'zustand';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { BrowserStorage } from '@/lib/storage';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/** Local storage key for persisting the user's FSRS vocabulary deck. */
const STUDY_DECK_STORAGE_KEY = 'lingopro.study.fsrs_deck.v1';

/**
 * Initial curated seed deck across VSTEP B1, B2, and C1 and high-frequency TOEIC vocabulary.
 */
const INITIAL_VOCAB_DECK: VocabWordDto[] = [
  {
    id: 'voc_01',
    word: 'sustainable',
    phonetic: '/səˈsteɪ.nə.bəl/',
    partOfSpeech: PartOfSpeechType.Adjective,
    meaningVi: 'bền vững, thân thiện với môi trường lâu dài',
    definitionEn: 'Able to be maintained at a certain rate or level without depleting natural resources.',
    exampleEn: 'The government is investing heavily in sustainable energy solutions.',
    exampleVi: 'Chính phủ đang đầu tư mạnh vào các giải pháp năng lượng bền vững.',
    certLevel: CertLevel.B2,
    audioUrl: null,
    cardState: SrsCardState.Review,
    nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    intervalDays: 3,
    easeFactor: 2.5,
    repetitions: 2,
    stability: 3.2,
    difficulty: 4.8,
    lapses: 0,
  },
  {
    id: 'voc_02',
    word: 'implement',
    phonetic: '/ˈɪm.plɪ.ment/',
    partOfSpeech: PartOfSpeechType.Verb,
    meaningVi: 'triển khai, thực thi (kế hoạch, chính sách)',
    definitionEn: 'Put a decision, plan, agreement, or policy into effect.',
    exampleEn: 'Our department will implement the new quality control protocol next Monday.',
    exampleVi: 'Phòng ban của chúng tôi sẽ triển khai quy trình kiểm soát chất lượng mới vào thứ Hai tới.',
    certLevel: CertLevel.B1,
    audioUrl: null,
    cardState: SrsCardState.New,
    nextReviewAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    stability: 0,
    difficulty: 5.0,
    lapses: 0,
  },
  {
    id: 'voc_03',
    word: 'unprecedented',
    phonetic: '/ʌnˈpres.ɪ.den.tɪd/',
    partOfSpeech: PartOfSpeechType.Adjective,
    meaningVi: 'chưa từng có tiền lệ',
    definitionEn: 'Never done or known before in history.',
    exampleEn: 'Rapid artificial intelligence adoption has created unprecedented productivity gains.',
    exampleVi: 'Việc ứng dụng trí tuệ nhân tạo nhanh chóng đã tạo ra mức tăng năng suất chưa từng có tiền lệ.',
    certLevel: CertLevel.C1,
    audioUrl: null,
    cardState: SrsCardState.Learning,
    nextReviewAt: new Date(Date.now() - 600 * 1000).toISOString(),
    intervalDays: 1,
    easeFactor: 2.35,
    repetitions: 1,
    stability: 1.4,
    difficulty: 6.2,
    lapses: 1,
  },
  {
    id: 'voc_04',
    word: 'reimburse',
    phonetic: '/ˌriː.ɪmˈbɜːs/',
    partOfSpeech: PartOfSpeechType.Verb,
    meaningVi: 'hoàn trả chi phí, bồi hoàn',
    definitionEn: 'Repay a person who has spent or lost money for business expenses.',
    exampleEn: 'The accounting office will reimburse all approved travel expenses within five business days.',
    exampleVi: 'Phòng kế toán sẽ hoàn trả mọi chi phí công tác được duyệt trong vòng 5 ngày làm việc.',
    certLevel: CertLevel.B2,
    audioUrl: null,
    cardState: SrsCardState.Review,
    nextReviewAt: new Date(Date.now() - 900 * 1000).toISOString(),
    intervalDays: 6,
    easeFactor: 2.6,
    repetitions: 3,
    stability: 6.8,
    difficulty: 4.3,
    lapses: 0,
  },
  {
    id: 'voc_05',
    word: 'mitigate',
    phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
    partOfSpeech: PartOfSpeechType.Verb,
    meaningVi: 'giảm thiểu, làm dịu bớt (rủi ro, hậu quả)',
    definitionEn: 'Make something bad less severe, serious, or painful.',
    exampleEn: 'Planting urban forests helps mitigate the heat island effect in major cities.',
    exampleVi: 'Trồng rừng đô thị giúp giảm thiểu hiệu ứng đảo nhiệt tại các thành phố lớn.',
    certLevel: CertLevel.C1,
    audioUrl: null,
    cardState: SrsCardState.New,
    nextReviewAt: new Date(Date.now() - 300 * 1000).toISOString(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    stability: 0,
    difficulty: 5.5,
    lapses: 0,
  },
];

/**
 * State contract for the FSRS v5 vocabulary flashcard study store.
 */
interface StudyStoreState {
  /** Complete list of vocabulary flashcards in the user's deck. */
  words: VocabWordDto[];

  /** Index of the currently active card during a flashcard review session. */
  activeCardIndex: number;

  /** Whether the back side (meaning & examples) of the current flashcard is revealed. */
  isCardFlipped: boolean;

  /** Total number of reviews completed in the current session. */
  completedInSession: number;

  /** Flips the current flashcard between front and back. */
  toggleFlip: () => void;

  /** Submits an FSRS v5 review rating for a vocabulary card and advances to the next card. */
  gradeCard: (wordId: string, quality: SrsReviewQuality) => void;

  /** Adds a new word from the Dictionary or Reading module to the FSRS deck. */
  addWordToDeck: (word: Omit<VocabWordDto, 'id' | 'cardState' | 'nextReviewAt' | 'intervalDays' | 'easeFactor' | 'repetitions' | 'stability' | 'difficulty' | 'lapses'>) => void;

  /** Resets the due timestamps on all cards so the user can practice a fresh session immediately. */
  resetAllCardsDueNow: () => void;
}

/**
 * Global Zustand store for FSRS v5 spaced repetition flashcard sessions.
 */
export const useStudyStore = create<StudyStoreState>((set) => ({
  words: BrowserStorage.getLocal<VocabWordDto[]>(STUDY_DECK_STORAGE_KEY, INITIAL_VOCAB_DECK),
  activeCardIndex: 0,
  isCardFlipped: false,
  completedInSession: 0,

  toggleFlip: () =>
    set((state) => ({
      isCardFlipped: !state.isCardFlipped,
    })),

  gradeCard: (wordId: string, quality: SrsReviewQuality) =>
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

      const nextIndex =
        state.words.length > 0 ? (state.activeCardIndex + 1) % state.words.length : 0;

      return {
        words: updatedWords,
        activeCardIndex: nextIndex,
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
        id: `voc_${Date.now()}`,
        cardState: SrsCardState.New,
        nextReviewAt: new Date().toISOString(),
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        stability: 0,
        difficulty: 5.0,
        lapses: 0,
      };

      const updatedWords = [created, ...state.words];
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, updatedWords);
      return { words: updatedWords };
    }),

  resetAllCardsDueNow: () =>
    set((state) => {
      const nowIso = new Date(Date.now() - 1000).toISOString();
      const updatedWords = state.words.map((w) => ({
        ...w,
        nextReviewAt: nowIso,
      }));
      BrowserStorage.setLocal(STUDY_DECK_STORAGE_KEY, updatedWords);
      return {
        words: updatedWords,
        activeCardIndex: 0,
        isCardFlipped: false,
      };
    }),
}));
