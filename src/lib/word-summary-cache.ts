/**
 * Cache ngắn (sessionStorage) cho newCount / reviewDueCount.
 * Stale-while-revalidate: paint số cũ ngay → fetch background → ghi đè.
 */

export type WordSummaryCache = {
  total: number;
  newCount: number;
  reviewDueCount: number;
  dueCount?: number;
  classroomId?: string | null;
  ts: number;
};

const TTL_MS = 60_000;
const keyFor = (userId: string) => `lp:word-summary:${userId}`;

export function readWordSummaryCache(userId: string): WordSummaryCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WordSummaryCache;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    // Vẫn trả stale (kể cả hết TTL) — caller quyết định revalidate
    return parsed;
  } catch {
    return null;
  }
}

export function isWordSummaryCacheFresh(cache: WordSummaryCache | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.ts < TTL_MS;
}

export function writeWordSummaryCache(
  userId: string,
  data: Omit<WordSummaryCache, 'ts'>,
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: WordSummaryCache = { ...data, ts: Date.now() };
    sessionStorage.setItem(keyFor(userId), JSON.stringify(payload));
  } catch {
    // quota / private mode — silent
  }
}

export function invalidateWordSummaryCache(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      sessionStorage.removeItem(keyFor(userId));
      return;
    }
    // Xóa mọi key lp:word-summary:* nếu không biết userId
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith('lp:word-summary:')) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // silent
  }
}
