import { ToeicAnswerOption } from '@/types/enums/ToeicAnswerOption';
import { ToeicQuestionDto } from '@/types/exam/ToeicQuestionDto';
import { ServerToeicSubmissionResponseDto } from '@/types/exam/ServerToeicSubmissionResponseDto';
import { VstepRawSkillScoresDto } from '@/types/exam/VstepRawSkillScoresDto';
import { VstepScoreResultDto } from '@/types/exam/VstepScoreResultDto';

/**
 * State contract for the TOEIC practice test and VSTEP score calculator store.
 */
export interface ExamStoreState {
  /** Identifier of the loaded TOEIC test, or null when no test is loaded. */
  toeicTestId: string | null;

  /** Questions of the loaded TOEIC test. */
  toeicQuestions: ToeicQuestionDto[];

  /** Map of questionId -> selected answer option. */
  selectedAnswers: Record<string, ToeicAnswerOption>;

  /** Map of questionId -> flagged for review. */
  flaggedQuestions: Record<string, boolean>;

  /** Epoch milliseconds of the first answer, used to compute the test duration. */
  startedAtMs: number | null;

  /** Server scoring result once the test was submitted. */
  toeicResult: ServerToeicSubmissionResponseDto | null;

  /** Raw 4-skill scores entered for the VSTEP calculator. */
  vstepRawScores: VstepRawSkillScoresDto;

  /** Official VSTEP breakdown derived from the raw scores. */
  vstepResult: VstepScoreResultDto;

  /** Loads a TOEIC test (clears previous answers and result). */
  loadToeicTest: (testId: string, questions: ToeicQuestionDto[]) => void;

  /** Records an answer and starts the duration clock on the first answer. */
  selectAnswer: (questionId: string, option: ToeicAnswerOption) => void;

  /** Toggles the review flag of a question. */
  toggleFlagQuestion: (questionId: string) => void;

  /** Stores the server scoring result. */
  setToeicResult: (result: ServerToeicSubmissionResponseDto) => void;

  /** Clears answers, flags, timer and result for a retry. */
  resetToeic: () => void;

  /** Updates VSTEP skill scores and recomputes the official result. */
  updateVstepRawScores: (partial: Partial<VstepRawSkillScoresDto>) => void;
}
