import { ServerWritingEvaluationDto } from '@/types/exam/ServerWritingEvaluationDto';

/**
 * Props for the VstepWritingGrader component.
 */
export interface VstepWritingGraderProps {
  /** Essay prompt (Task 2 question) entered by the learner. */
  promptText: string;
  /** Essay draft. */
  essayText: string;
  /** Whether the AI evaluation request is in flight. */
  isEvaluating: boolean;
  /** AI evaluation result, or null before grading. */
  evaluation: ServerWritingEvaluationDto | null;
  /** Updates the prompt. */
  onChangePrompt: (value: string) => void;
  /** Updates the essay draft. */
  onChangeEssay: (value: string) => void;
  /** Sends the essay for AI grading. */
  onEvaluate: () => void;
}
