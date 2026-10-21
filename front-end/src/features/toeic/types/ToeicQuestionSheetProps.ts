import { ToeicAnswerOption } from '@/types/enums/ToeicAnswerOption';
import { ToeicQuestionDto } from '@/types/exam/ToeicQuestionDto';

/**
 * Props for the ToeicQuestionSheet component.
 */
export interface ToeicQuestionSheetProps {
  /** Questions of the loaded TOEIC test. */
  questions: ToeicQuestionDto[];
  /** Selected option per question id. */
  selectedAnswers: Record<string, ToeicAnswerOption>;
  /** Review flag per question id. */
  flaggedQuestions: Record<string, boolean>;
  /** Records an answer. */
  onSelectAnswer: (questionId: string, option: ToeicAnswerOption) => void;
  /** Toggles the review flag of a question. */
  onToggleFlag: (questionId: string) => void;
}
