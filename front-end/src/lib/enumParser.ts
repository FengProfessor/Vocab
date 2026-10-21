/**
 * Case-insensitive parser that maps loosely typed API values onto the members of a string enum.
 */
export class EnumParser {
  /**
   * Returns the enum member whose value matches `raw` (ignoring case), or `fallback` when none matches.
   */
  public static parse<TEnum extends string>(
    enumObject: Record<string, TEnum>,
    raw: unknown,
    fallback: TEnum
  ): TEnum {
    if (typeof raw !== 'string') {
      return fallback;
    }
    const needle = raw.trim().toLowerCase();
    const match = Object.values(enumObject).find((member) => member.toLowerCase() === needle);
    return match ?? fallback;
  }
}
