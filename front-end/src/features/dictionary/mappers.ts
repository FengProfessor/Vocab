/**
 * Maps a `.NET 10` dictionary lookup response into the unified lookup envelope expected by UI components.
 */
export function mapDictionaryLookupResponse(
  dto: Record<string, any> | null | undefined,
  ok = true,
  message?: string | null,
) {
  return {
    success: ok,
    data: dto ?? null,
    entry: dto ?? null,
    ...(dto && typeof dto === 'object' ? dto : {}),
    error: ok ? undefined : message || undefined,
  };
}

/**
 * Maps `.NET 10` OCR extracted word list (`string[]`) into `{ success, words, data }`.
 */
export function mapOcrExtractResponse(words: string[] | null | undefined, ok = true) {
  const safeWords = Array.isArray(words) ? words : [];
  return {
    success: ok,
    words: safeWords,
    data: safeWords,
  };
}
