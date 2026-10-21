import { ToeicPart } from '@/types/enums/ToeicPart';
import { ToeicAnswerOption } from '@/types/enums/ToeicAnswerOption';
import { ToeicQuestionDto } from '@/types/exam/ToeicQuestionDto';

/** Parts that belong to the Listening section (Parts 1-4). */
const LISTENING_PARTS: ReadonlySet<ToeicPart> = new Set([
  ToeicPart.Part1,
  ToeicPart.Part2,
  ToeicPart.Part3,
  ToeicPart.Part4,
]);

/**
 * Pure scoring helper that derives the raw Listening / Reading correct counts from the learner's answers.
 */
export class ToeicExamScorer {
  /**
   * Counts correct answers per section by comparing selections with each question's correct option.
   */
  public static countCorrect(
    questions: readonly ToeicQuestionDto[],
    answers: Readonly<Record<string, ToeicAnswerOption>>
  ): { listeningCorrect: number; readingCorrect: number } {
    let listeningCorrect = 0;
    let readingCorrect = 0;

    for (const question of questions) {
      if (answers[question.id] !== question.correctOption) {
        continue;
      }
      if (LISTENING_PARTS.has(question.part)) {
        listeningCorrect += 1;
      } else {
        readingCorrect += 1;
      }
    }
    return { listeningCorrect, readingCorrect };
  }
}
