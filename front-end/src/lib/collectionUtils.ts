/**
 * Collection helpers that are not specific to any feature.
 */
export class CollectionUtils {
  /**
   * Returns a new array shuffled with the unbiased Fisher-Yates algorithm.
   */
  public static shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
