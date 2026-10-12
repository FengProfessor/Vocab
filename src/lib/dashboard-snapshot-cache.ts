import type { Profile, UserGamification, Word } from '@/lib/supabase';

export type ShellProfile = Profile & {
  telegram_id?: string | null;
};

export interface DashboardSnapshot {
  profile: ShellProfile | null;
  gamification: UserGamification | null;
  words: Word[] | null;
}

const LAST_USER_ID_KEY = 'lp:last_user_id';
const keyForProfile = (userId: string) => `lp:profile:${userId}`;
const keyForGamification = (userId: string) => `lp:gamification:${userId}`;
const keyForDashboardWords = (userId: string) => `lp:dashboard-words:${userId}`;

function getStorages(): Storage[] {
  if (typeof window === 'undefined') return [];
  const list: Storage[] = [];
  try {
    if (typeof localStorage !== 'undefined' && localStorage) list.push(localStorage);
  } catch {}
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage) list.push(sessionStorage);
  } catch {}
  return list;
}

function safeReadJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  for (const storage of getStorages()) {
    try {
      const raw = storage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // JSON parse error or access denied
    }
  }
  return null;
}

function getLastUserId(): string | null {
  for (const storage of getStorages()) {
    try {
      const val = storage.getItem(LAST_USER_ID_KEY);
      if (val) return val;
    } catch {}
  }
  return null;
}

/**
 * Đọc cached profile của userId xác định (từ sessionStorage hoặc localStorage).
 */
export function readProfileCache(userId: string): ShellProfile | null {
  if (!userId) return null;
  return safeReadJson<ShellProfile>(keyForProfile(userId));
}

/**
 * Đọc cached gamification của userId xác định.
 */
export function readGamificationCache(userId: string): UserGamification | null {
  if (!userId) return null;
  return safeReadJson<UserGamification>(keyForGamification(userId));
}

/**
 * Đọc cached dashboard preview words của userId xác định.
 */
export function readDashboardWordsCache(userId: string): Word[] | null {
  if (!userId) return null;
  return safeReadJson<Word[]>(keyForDashboardWords(userId));
}

/**
 * Synchronous getter: Đọc cached profile của user đăng nhập gần nhất ngay tại Frame 0 (<50ms).
 */
export function readLastProfileCache(): ShellProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastUserId = getLastUserId();
    if (lastUserId) {
      const cached = readProfileCache(lastUserId);
      if (cached) return cached;
    }
    // Fallback: Quét tìm key lp:profile:* đầu tiên
    for (const storage of getStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith('lp:profile:')) {
          const raw = storage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as ShellProfile;
              if (parsed && typeof parsed.id === 'string') return parsed;
            } catch {}
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronous getter: Đọc cached gamification của user đăng nhập gần nhất ngay tại Frame 0.
 */
export function readLastGamificationCache(): UserGamification | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastUserId = getLastUserId();
    if (lastUserId) {
      const cached = readGamificationCache(lastUserId);
      if (cached) return cached;
    }
    // Fallback: Quét tìm key lp:gamification:* đầu tiên
    for (const storage of getStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith('lp:gamification:')) {
          const raw = storage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as UserGamification;
              if (parsed && typeof parsed.user_id === 'string') return parsed;
            } catch {}
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronous getter: Đọc cached preview words của user đăng nhập gần nhất ngay tại Frame 0.
 */
export function readLastDashboardWordsCache(): Word[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastUserId = getLastUserId();
    if (lastUserId) {
      const cached = readDashboardWordsCache(lastUserId);
      if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    }
    // Fallback: Quét tìm key lp:dashboard-words:* đầu tiên
    for (const storage of getStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith('lp:dashboard-words:')) {
          const raw = storage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Word[];
              if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch {}
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lưu profile metadata vào cả localStorage và sessionStorage.
 */
export function writeDashboardProfileCache(userId: string, profile: ShellProfile): void {
  if (typeof window === 'undefined' || !userId) return;
  const serialized = JSON.stringify(profile);
  for (const storage of getStorages()) {
    try {
      storage.setItem(keyForProfile(userId), serialized);
      storage.setItem(LAST_USER_ID_KEY, userId);
    } catch {
      // QuotaExceededError or private browsing mode
    }
  }
}

/**
 * Lưu gamification state vào cả localStorage và sessionStorage.
 */
export function writeDashboardGamificationCache(userId: string, gamification: UserGamification): void {
  if (typeof window === 'undefined' || !userId) return;
  const serialized = JSON.stringify(gamification);
  for (const storage of getStorages()) {
    try {
      storage.setItem(keyForGamification(userId), serialized);
      storage.setItem(LAST_USER_ID_KEY, userId);
    } catch {
      // QuotaExceededError or private browsing mode
    }
  }
}

/**
 * Lưu danh sách top preview words vào cả localStorage và sessionStorage.
 */
export function writeDashboardWordsCache(userId: string, words: Word[]): void {
  if (typeof window === 'undefined' || !userId) return;
  // Lưu tối đa 20 từ preview để payload snapshot nhẹ và parse tức thì (<1ms)
  const preview = words.slice(0, 20);
  const serialized = JSON.stringify(preview);
  for (const storage of getStorages()) {
    try {
      storage.setItem(keyForDashboardWords(userId), serialized);
      storage.setItem(LAST_USER_ID_KEY, userId);
    } catch {
      // QuotaExceededError or private browsing mode
    }
  }
}

/**
 * Helper lưu đồng bộ toàn bộ snapshot Frame 0.
 */
export function writeDashboardSnapshot(
  userId: string,
  snapshot: {
    profile?: ShellProfile | null;
    gamification?: UserGamification | null;
    words?: Word[] | null;
  },
): void {
  if (snapshot.profile) writeDashboardProfileCache(userId, snapshot.profile);
  if (snapshot.gamification) writeDashboardGamificationCache(userId, snapshot.gamification);
  if (snapshot.words) writeDashboardWordsCache(userId, snapshot.words);
}

/**
 * Xóa cache snapshot khi logout hoặc switch account.
 */
export function clearDashboardSnapshotCache(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  for (const storage of getStorages()) {
    try {
      if (userId) {
        storage.removeItem(keyForProfile(userId));
        storage.removeItem(keyForGamification(userId));
        storage.removeItem(keyForDashboardWords(userId));
        const lastId = storage.getItem(LAST_USER_ID_KEY);
        if (lastId === userId) storage.removeItem(LAST_USER_ID_KEY);
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (
            k &&
            (k.startsWith('lp:profile:') ||
              k.startsWith('lp:gamification:') ||
              k.startsWith('lp:dashboard-words:') ||
              k === LAST_USER_ID_KEY)
          ) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          storage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  }
}
