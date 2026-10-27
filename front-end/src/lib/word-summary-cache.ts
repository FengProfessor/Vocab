/**
 * Cache ngắn (sessionStorage + localStorage) cho newCount / reviewDueCount.
 * Stale-while-revalidate: paint số cũ ngay → fetch background → ghi đè.
 */

import {
  STORAGE_KEYS,
  userStorage,
  getLastUserId,
  getBrowserStorages,
} from '@/shared/lib/storage';

export type WordSummaryCache = {
  total: number;
  newCount: number;
  reviewDueCount: number;
  dueCount?: number;
  levelCounts?: number[];
  classroomId?: string | null;
  ts: number;
};

const TTL_MS = 60_000;
const LAST_USER_ID_KEY = STORAGE_KEYS.LAST_USER_ID;

export function readWordSummaryCache(userId: string): WordSummaryCache | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const parsed = userStorage(userId).get<WordSummaryCache>(STORAGE_KEYS.WORD_SUMMARY);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    // Vẫn trả stale (kể cả hết TTL) — caller quyết định revalidate
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Đọc cache của user đăng nhập gần nhất ngay tại Frame 0 (không cần đợi getSession async).
 */
export function readLastWordSummaryCache(): WordSummaryCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastUserId = getLastUserId();
    if (lastUserId) {
      const cached = readWordSummaryCache(lastUserId);
      if (cached) return cached;
    }
    // Fallback nếu không có lastUserId: tìm key lp:word-summary:* đầu tiên
    for (const store of getBrowserStorages()) {
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k?.startsWith(`lp:${STORAGE_KEYS.WORD_SUMMARY}:`)) {
          const raw = store.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw) as WordSummaryCache;
            if (parsed && typeof parsed.ts === 'number') return parsed;
          }
        }
      }
    }
    return null;
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
  if (typeof window === 'undefined' || !userId) return;
  try {
    const existing = readWordSummaryCache(userId);
    const hasNonZeroLevels =
      Array.isArray(data.levelCounts) && data.levelCounts.some((n) => Number(n) > 0);
    const resolvedLevels = hasNonZeroLevels
      ? data.levelCounts
      : data.total === 0
        ? [0, 0, 0, 0, 0, 0]
        : existing?.levelCounts ?? data.levelCounts;
    const payload: WordSummaryCache = {
      ...data,
      ...(resolvedLevels ? { levelCounts: resolvedLevels } : {}),
      ts: Date.now(),
    };
    userStorage(userId).set(STORAGE_KEYS.WORD_SUMMARY, payload);
  } catch {
    // quota / private mode — silent
  }
}

export function invalidateWordSummaryCache(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      userStorage(userId).remove(STORAGE_KEYS.WORD_SUMMARY);
      return;
    }
    for (const store of getBrowserStorages()) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k?.startsWith(`lp:${STORAGE_KEYS.WORD_SUMMARY}:`)) {
          keys.push(k);
        }
      }
      for (const k of keys) {
        store.removeItem(k);
      }
      store.removeItem(LAST_USER_ID_KEY);
    }
  } catch {
    // silent
  }
}

export const WORD_SUMMARY_EVENTS = {
  SAVED: 'lp:word_saved_optimistic',
  SAVE_ROLLBACK: 'lp:word_save_rollback',
  REVIEWED: 'lp:word_reviewed_optimistic',
} as const;

export function notifyWordSavedOptimistic(userId?: string | null): void {
  const cached = userId ? readWordSummaryCache(userId) : readLastWordSummaryCache();
  if (cached) {
    const nextLevels = Array.isArray(cached.levelCounts) && cached.levelCounts.length >= 6
      ? [cached.levelCounts[0] + 1, ...cached.levelCounts.slice(1)]
      : cached.levelCounts;
    const updated: WordSummaryCache = {
      ...cached,
      total: cached.total + 1,
      newCount: cached.newCount + 1,
      dueCount: (cached.dueCount ?? cached.reviewDueCount + cached.newCount) + 1,
      ...(nextLevels ? { levelCounts: nextLevels } : {}),
      ts: Date.now(),
    };
    if (userId) writeWordSummaryCache(userId, updated);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WORD_SUMMARY_EVENTS.SAVED));
  }
}

export function notifyWordSaveRollback(userId?: string | null): void {
  const cached = userId ? readWordSummaryCache(userId) : readLastWordSummaryCache();
  if (cached) {
    const nextLevels = Array.isArray(cached.levelCounts) && cached.levelCounts.length >= 6
      ? [Math.max(0, cached.levelCounts[0] - 1), ...cached.levelCounts.slice(1)]
      : cached.levelCounts;
    const updated: WordSummaryCache = {
      ...cached,
      total: Math.max(0, cached.total - 1),
      newCount: Math.max(0, cached.newCount - 1),
      dueCount: Math.max(0, (cached.dueCount ?? 1) - 1),
      ...(nextLevels ? { levelCounts: nextLevels } : {}),
      ts: Date.now(),
    };
    if (userId) writeWordSummaryCache(userId, updated);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WORD_SUMMARY_EVENTS.SAVE_ROLLBACK));
  }
}

export function notifyWordReviewedOptimistic(userId?: string | null): void {
  const cached = userId ? readWordSummaryCache(userId) : readLastWordSummaryCache();
  if (cached) {
    const updated: WordSummaryCache = {
      ...cached,
      reviewDueCount: Math.max(0, cached.reviewDueCount - 1),
      dueCount: Math.max(0, (cached.dueCount ?? 1) - 1),
      ts: Date.now(),
    };
    if (userId) writeWordSummaryCache(userId, updated);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WORD_SUMMARY_EVENTS.REVIEWED));
  }
}
