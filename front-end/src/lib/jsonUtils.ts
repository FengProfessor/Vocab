/**
 * Defensive JSON helpers for the *Json string columns returned by the .NET API
 * (definitions, collocations, used words, ...).
 */
export class JsonUtils {
  /**
   * Parses a JSON string into an array; returns an empty array when the input is empty, invalid or not an array.
   */
  public static parseArray<T>(json: string | null | undefined): T[] {
    if (!json) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(json);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
}
