import { create } from 'zustand';
import { VstepScoreCalculator } from '@/lib/vstepScoreCalculator';
import { ExamStoreState } from '@/stores/types/ExamStoreState';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';

/** VSTEP calculator starts empty instead of with invented scores. */
const EMPTY_VSTEP_SCORES: VstepRawSkillScoresDto = {
  listening: 0,
  reading: 0,
  writing: 0,
  speaking: 0,
};

/**
 * Global Zustand store for the TOEIC practice test and the VSTEP score calculator.
 * TOEIC content is loaded from the API; nothing is seeded locally.
 */
export const useExamStore = create<ExamStoreState>((set) => ({
  toeicTestId: null,
  toeicQuestions: [],
  selectedAnswers: {},
  flaggedQuestions: {},
  startedAtMs: null,
  toeicResult: null,
  vstepRawScores: EMPTY_VSTEP_SCORES,
  vstepResult: VstepScoreCalculator.calculateResult(EMPTY_VSTEP_SCORES),

  loadToeicTest: (testId, questions) =>
    set({
      toeicTestId: testId,
      toeicQuestions: questions,
      selectedAnswers: {},
      flaggedQuestions: {},
      startedAtMs: null,
      toeicResult: null,
    }),

  selectAnswer: (questionId, option) =>
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: option },
      startedAtMs: state.startedAtMs ?? Date.now(),
    })),

  toggleFlagQuestion: (questionId) =>
    set((state) => ({
      flaggedQuestions: {
        ...state.flaggedQuestions,
        [questionId]: !state.flaggedQuestions[questionId],
      },
    })),

  setToeicResult: (result) => set({ toeicResult: result }),

  resetToeic: () =>
    set({ selectedAnswers: {}, flaggedQuestions: {}, startedAtMs: null, toeicResult: null }),

  updateVstepRawScores: (partial) =>
    set((state) => {
      const merged: VstepRawSkillScoresDto = { ...state.vstepRawScores, ...partial };
      return { vstepRawScores: merged, vstepResult: VstepScoreCalculator.calculateResult(merged) };
    }),
}));
