import { create } from 'zustand';
import { ToeicBaremCalculator } from '@/lib/toeicBaremCalculator';
import { VstepScoreCalculator } from '@/lib/vstepScoreCalculator';
import { ToeicPart } from '@/types/enums/ToeicPart';
import { ToeicQuestionDto } from '@/types/exam/ToeicQuestionDto';
import { ToeicScoreReportDto } from '@/types/exam/ToeicScoreReportDto';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';
import { VstepScoreResultDto } from '@/types/exam/VstepScoreResultDto';

/**
 * Curated sample TOEIC Listening & Reading questions across Parts 2, 5, and 7.
 */
const SAMPLE_TOEIC_QUESTIONS: ToeicQuestionDto[] = [
  {
    id: 'toeic_q1',
    questionNumber: 101,
    part: ToeicPart.Part5,
    prompt:
      'All employees must submit their travel reimbursement forms ------- Friday afternoon to receive payment in the next payroll cycle.',
    options: {
      A: 'by',
      B: 'until',
      C: 'during',
      D: 'while',
    },
    correctOption: 'A',
    explanationVi:
      'Giới từ "by" + mốc thời gian mang nghĩa "trước hoặc muộn nhất là vào thời điểm đó" (hoàn thành hành động nộp đơn). "Until" dùng cho hành động kéo dài liên tục.',
  },
  {
    id: 'toeic_q2',
    questionNumber: 102,
    part: ToeicPart.Part5,
    prompt:
      'Ms. Tanaka was promoted to Regional Director because of her ------- performance in expanding the Southeast Asian market.',
    options: {
      A: 'exception',
      B: 'exceptional',
      C: 'exceptionally',
      D: 'excepted',
    },
    correctOption: 'B',
    explanationVi:
      'Sau tính từ sở hữu "her" và trước danh từ "performance" cần một tính từ bổ nghĩa: "exceptional" (xuất sắc, vượt trội).',
  },
  {
    id: 'toeic_q3',
    questionNumber: 103,
    part: ToeicPart.Part5,
    prompt:
      'Should you ------- any technical difficulties while installing the accounting software, please contact our IT Helpdesk.',
    options: {
      A: 'encounter',
      B: 'encounters',
      C: 'encountered',
      D: 'encountering',
    },
    correctOption: 'A',
    explanationVi:
      'Cấu trúc đảo ngữ câu điều kiện loại 1 với "Should + S + V_infinitive": cần động từ nguyên mẫu "encounter".',
  },
  {
    id: 'toeic_q4',
    questionNumber: 147,
    part: ToeicPart.Part7,
    passageText:
      'MEMORANDUM — To: All Marketing Staff | From: David Nguyen, Facilities Manager | Subject: Conference Room B Renovation. Please note that Conference Room B on the 4th floor will be closed for audiovisual upgrades from October 20 to October 24. All client presentations scheduled during this period have been relocated to the Executive Boardroom on the 6th floor.',
    prompt: 'According to the memorandum, why will Conference Room B be unavailable?',
    options: {
      A: 'It is being repainted for an annual inspection.',
      B: 'New audio and video equipment is being installed.',
      C: 'It has been reserved for a week-long board meeting.',
      D: 'The fourth floor is undergoing air-conditioning repairs.',
    },
    correctOption: 'B',
    explanationVi:
      'Thông báo nêu rõ: "closed for audiovisual upgrades" (đóng cửa để nâng cấp hệ thống âm thanh hình ảnh), tương đương với đáp án B.',
  },
];

/**
 * State contract for the TOEIC & VSTEP exam simulation store.
 */
interface ExamStoreState {
  /** Active TOEIC question bank. */
  toeicQuestions: ToeicQuestionDto[];

  /** Map of questionId -> selected option ('A' | 'B' | 'C' | 'D'). */
  selectedAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;

  /** Map of questionId -> flagged boolean for review. */
  flaggedQuestions: Record<string, boolean>;

  /** Whether the TOEIC practice test has been submitted for grading. */
  isToeicSubmitted: boolean;

  /** Simulated raw Listening correct count (0..100) for the ETS 990 barem calculator. */
  simulatedListeningCorrect: number;

  /** Simulated raw Reading correct count (0..100) for the ETS 990 barem calculator. */
  simulatedReadingCorrect: number;

  /** Computed TOEIC 990 score report. */
  toeicScoreReport: ToeicScoreReportDto;

  /** Raw 4-skill scores for the VSTEP 0.5-increment grading simulator. */
  vstepRawScores: VstepRawSkillScoresDto;

  /** Computed VSTEP official score breakdown and certification level. */
  vstepResult: VstepScoreResultDto;

  /** Selects an answer option for a TOEIC question. */
  selectAnswer: (questionId: string, option: 'A' | 'B' | 'C' | 'D') => void;

  /** Toggles the review flag on a question. */
  toggleFlagQuestion: (questionId: string) => void;

  /** Submits or resets the TOEIC practice test. */
  setToeicSubmitted: (submitted: boolean) => void;

  /** Updates the TOEIC Listening/Reading raw counts and recalculates the ETS 990 barem report. */
  updateToeicRawCounts: (listeningCorrect: number, readingCorrect: number) => void;

  /** Updates the VSTEP 4-skill raw scores and recalculates the 0.5-rounded certification result. */
  updateVstepRawScores: (partialScores: Partial<VstepRawSkillScoresDto>) => void;
}

const initialVstepScores: VstepRawSkillScoresDto = {
  listening: 6.5,
  reading: 7.0,
  writing: 6.0,
  speaking: 6.0,
};

/**
 * Global Zustand store for TOEIC 990 and VSTEP B1/B2/C1 exam simulations.
 */
export const useExamStore = create<ExamStoreState>((set) => ({
  toeicQuestions: SAMPLE_TOEIC_QUESTIONS,
  selectedAnswers: {},
  flaggedQuestions: {},
  isToeicSubmitted: false,
  simulatedListeningCorrect: 78,
  simulatedReadingCorrect: 74,
  toeicScoreReport: ToeicBaremCalculator.calculateReport(78, 74),
  vstepRawScores: initialVstepScores,
  vstepResult: VstepScoreCalculator.calculateResult(initialVstepScores),

  selectAnswer: (questionId, option) =>
    set((state) => ({
      selectedAnswers: {
        ...state.selectedAnswers,
        [questionId]: option,
      },
    })),

  toggleFlagQuestion: (questionId) =>
    set((state) => ({
      flaggedQuestions: {
        ...state.flaggedQuestions,
        [questionId]: !state.flaggedQuestions[questionId],
      },
    })),

  setToeicSubmitted: (submitted) =>
    set({
      isToeicSubmitted: submitted,
    }),

  updateToeicRawCounts: (listeningCorrect, readingCorrect) =>
    set({
      simulatedListeningCorrect: listeningCorrect,
      simulatedReadingCorrect: readingCorrect,
      toeicScoreReport: ToeicBaremCalculator.calculateReport(listeningCorrect, readingCorrect),
    }),

  updateVstepRawScores: (partialScores) =>
    set((state) => {
      const merged: VstepRawSkillScoresDto = {
        ...state.vstepRawScores,
        ...partialScores,
      };
      return {
        vstepRawScores: merged,
        vstepResult: VstepScoreCalculator.calculateResult(merged),
      };
    }),
}));
