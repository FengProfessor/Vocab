/**
 * Maps `.NET 10` reading articles list into `{ success, articles, data }`.
 */
export function mapReadingArticlesResponse(items: Record<string, any>[] | null | undefined, ok = true) {
  const safeList = Array.isArray(items) ? items : [];
  return {
    success: ok,
    articles: safeList,
    data: safeList,
  };
}

/**
 * Maps `.NET 10` daily reading DTO into `{ success, data, exercise }`.
 */
export function mapDailyReadingResponse(dto: Record<string, any> | null | undefined, ok = true) {
  return {
    success: ok,
    data: dto ?? null,
    exercise: dto ?? null,
  };
}
