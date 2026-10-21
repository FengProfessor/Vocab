import { ListeningUtils } from '@/lib/listeningUtils';
import { SpellingVerdict } from '@/types/vocab/SpellingVerdict';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';

/** Maximum edit distance still treated as a small typo. */
const TYPO_TOLERANCE = 2;
/** Words shorter than this must be typed exactly. */
const MIN_LENGTH_FOR_TOLERANCE = 4;

/**
 * Pure domain logic for the active-recall spelling exercise (ported from legacy src/app/writing).
 */
export class SpellingEvaluator {
  /**
   * Compares the typed answer with the target word using Levenshtein distance with typo tolerance.
   */
  public static evaluate(target: string, typed: string): SpellingVerdict {
    const expected = target.trim().toLowerCase();
    const attempt = typed.trim().toLowerCase();
    const distance = ListeningUtils.levenshteinDistance(expected, attempt);

    if (distance === 0) {
      return SpellingVerdict.Correct;
    }
    if (distance <= TYPO_TOLERANCE && expected.length >= MIN_LENGTH_FOR_TOLERANCE) {
      return SpellingVerdict.Close;
    }
    return SpellingVerdict.Wrong;
  }

  /**
   * Maps a spelling verdict onto the FSRS review quality sent to the scheduler.
   */
  public static toReviewQuality(verdict: SpellingVerdict): SrsReviewQuality {
    switch (verdict) {
      case SpellingVerdict.Correct:
        return SrsReviewQuality.Easy;
      case SpellingVerdict.Close:
        return SrsReviewQuality.Hard;
      default:
        return SrsReviewQuality.Again;
    }
  }

  /**
   * Replaces every occurrence of the headword inside an example sentence with a blank for cloze practice.
   */
  public static maskWord(sentence: string, word: string): string {
    if (!sentence || !word) {
      return sentence;
    }
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sentence.replace(new RegExp(escaped, 'gi'), '_______');
  }
}
