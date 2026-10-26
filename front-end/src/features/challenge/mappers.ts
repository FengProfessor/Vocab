/**
 * Maps `.NET 10` `ChallengeDto[]` items into `{ success, challenges, data }`.
 */
export function mapChallengesListResponse(items: Record<string, any>[] | null | undefined, ok = true) {
  const safeList = Array.isArray(items) ? items : [];
  return {
    success: ok,
    challenges: safeList,
    data: safeList,
  };
}
