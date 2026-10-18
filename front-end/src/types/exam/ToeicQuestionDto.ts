import { ToeicPart } from '@/types/enums/ToeicPart';

/**
 * Represents a single TOEIC Listening or Reading question item.
 */
export interface ToeicQuestionDto {
  /** Unique question identifier. */
  id: string;

  /** Official TOEIC test question number (1..200). */
  questionNumber: number;

  /** TOEIC Part (Part 1 through Part 7). */
  part: ToeicPart;

  /** Question prompt or stem text. */
  prompt: string;

  /** Optional reading passage or transcript context. */
  passageText?: string | null;

  /** Optional audio stream URL for Listening parts. */
  audioUrl?: string | null;

  /** Optional photograph URL for Part 1. */
  imageUrl?: string | null;

  /** Multiple-choice option map keyed by 'A' | 'B' | 'C' | 'D'. */
  options: Record<'A' | 'B' | 'C' | 'D', string>;

  /** Correct option key ('A' | 'B' | 'C' | 'D'). */
  correctOption: 'A' | 'B' | 'C' | 'D';

  /** Detailed explanation in Vietnamese for review mode. */
  explanationVi: string;
}
