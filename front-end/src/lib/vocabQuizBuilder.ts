import { CollectionUtils } from '@/lib/collectionUtils';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/** Number of answer choices per multiple-choice question. */
export const QUIZ_OPTION_COUNT = 4;

/**
 * Pure builder for the 4-choice vocabulary quiz generated from the learner's own deck.
 */
export class VocabQuizBuilder {
  /**
   * Whether the deck has enough distinct meanings to build real distractors.
   */
  public static canBuild(words: readonly VocabWordDto[]): boolean {
    const distinct = new Set(words.map((w) => w.meaningVi));
    return distinct.size >= QUIZ_OPTION_COUNT;
  }

  /**
   * Builds shuffled answer options (1 correct + distractors) for the target word. Returns the options and the correct index.
   */
  public static buildOptions(
    target: VocabWordDto,
    deck: readonly VocabWordDto[]
  ): { options: string[]; correctIndex: number } {
    const distractors = CollectionUtils.shuffle(
      Array.from(new Set(deck.filter((w) => w.id !== target.id).map((w) => w.meaningVi))).filter(
        (meaning) => meaning !== target.meaningVi
      )
    ).slice(0, QUIZ_OPTION_COUNT - 1);

    const options = CollectionUtils.shuffle([target.meaningVi, ...distractors]);
    return { options, correctIndex: options.indexOf(target.meaningVi) };
  }
}
