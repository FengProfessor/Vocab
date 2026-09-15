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
const LAST_USER_ID_KEY = 'lp:last_user_id';
const keyFor = (userId: string) => `lp:word-summary:${userId}`;

export function readWordSummaryCache(userId: string): WordSummaryCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(keyFor(userId)) || localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WordSummaryCache;
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
    const lastUserId = localStorage.getItem(LAST_USER_ID_KEY) || sessionStorage.getItem(LAST_USER_ID_KEY);
    if (lastUserId) {
      const cached = readWordSummaryCache(lastUserId);
      if (cached) return cached;
    }
    // Fallback nếu không có lastUserId: tìm key lp:word-summary:* đầu tiên
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('lp:word-summary:')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw) as WordSummaryCache;
          if (parsed && typeof parsed.ts === 'number') return parsed;
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
  if (typeof window === 'undefined') return;
  try {
    const payload: WordSummaryCache = { ...data, ts: Date.now() };
    const serialized = JSON.stringify(payload);
    sessionStorage.setItem(keyFor(userId), serialized);
    localStorage.setItem(keyFor(userId), serialized);
    sessionStorage.setItem(LAST_USER_ID_KEY, userId);
    localStorage.setItem(LAST_USER_ID_KEY, userId);
  } catch {
    // quota / private mode — silent
  }
}

export function invalidateWordSummaryCache(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      sessionStorage.removeItem(keyFor(userId));
      localStorage.removeItem(keyFor(userId));
      return;
    }
    // Xóa mọi key lp:word-summary:* nếu không biết userId
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith('lp:word-summary:')) keys.push(k);
    }
    keys.forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
    sessionStorage.removeItem(LAST_USER_ID_KEY);
    localStorage.removeItem(LAST_USER_ID_KEY);
  } catch {
    // silent
  }
}
