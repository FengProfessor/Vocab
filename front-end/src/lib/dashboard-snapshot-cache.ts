import type { Profile, UserGamification, Word } from '@/lib/supabase';
import {
  STORAGE_KEYS,
  userStorage,
  clearUserAccountStorage,
  getLastUserId,
  getBrowserStorages,
} from '@/shared/lib/storage';

export type ShellProfile = Profile & {
  telegram_id?: string | null;
};

export interface DashboardSnapshot {
  profile: ShellProfile | null;
  gamification: UserGamification | null;
  words: Word[] | null;
}

const LAST_USER_ID_KEY = STORAGE_KEYS.LAST_USER_ID;
const keyForProfile = (userId: string) => `lp:${STORAGE_KEYS.PROFILE}:${userId}`;
const keyForGamification = (userId: string) => `lp:${STORAGE_KEYS.GAMIFICATION}:${userId}`;
const keyForDashboardWords = (userId: string) => `lp:${STORAGE_KEYS.DASHBOARD_WORDS}:${userId}`;

function safeReadJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  for (const storage of getBrowserStorages()) {
    try {
      const raw = storage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // JSON parse error or access denied
    }
  }
  return null;
}

/**
 * Đọc cached profile của userId xác định (từ sessionStorage hoặc localStorage).
 */
export function readProfileCache(userId: string): ShellProfile | null {
  if (!userId) return null;
  return userStorage(userId).get<ShellProfile>(STORAGE_KEYS.PROFILE);
}

/**
 * Đọc cached gamification của userId xác định.
 */
export function readGamificationCache(userId: string): UserGamification | null {
  if (!userId) return null;
  return userStorage(userId).get<UserGamification>(STORAGE_KEYS.GAMIFICATION);
}

/**
 * Đọc cached dashboard preview words của userId xác định.
 */
export function readDashboardWordsCache(userId: string): Word[] | null {
  if (!userId) return null;
  return userStorage(userId).get<Word[]>(STORAGE_KEYS.DASHBOARD_WORDS);
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
    for (const storage of getBrowserStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(`lp:${STORAGE_KEYS.PROFILE}:`)) {
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
    for (const storage of getBrowserStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(`lp:${STORAGE_KEYS.GAMIFICATION}:`)) {
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
    for (const storage of getBrowserStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(`lp:${STORAGE_KEYS.DASHBOARD_WORDS}:`)) {
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
  userStorage(userId).set(STORAGE_KEYS.PROFILE, profile);
}

/**
 * Lưu gamification state vào cả localStorage và sessionStorage.
 */
export function writeDashboardGamificationCache(userId: string, gamification: UserGamification): void {
  if (typeof window === 'undefined' || !userId) return;
  userStorage(userId).set(STORAGE_KEYS.GAMIFICATION, gamification);
}

/**
 * Lưu danh sách top preview words vào cả localStorage và sessionStorage.
 */
export function writeDashboardWordsCache(userId: string, words: Word[]): void {
  if (typeof window === 'undefined' || !userId) return;
  const preview = words.slice(0, 20);
  userStorage(userId).set(STORAGE_KEYS.DASHBOARD_WORDS, preview);
}

export interface DashboardSecondarySnapshot {
  dailyActivity?: Array<{ date: string; count: number; day?: string; words?: number; xp?: number; isToday?: boolean }>;
  todayWords?: number;
  todayNewWords?: number;
  todayReviewWords?: number;
  studyStreak?: number;
  vocabPacks?: Array<unknown>;
  dailyReadingStatus?: {
    hasNew: boolean;
    title: string;
    wordCount: number;
    completedCount: number;
    doneCount?: number;
    totalCount: number;
  };
  updatedAt?: number;
}

export interface DailyReadingSnapshot {
  date?: string;
  exercises: unknown[];
  doneCount?: number;
  totalCount?: number;
  hasNew?: boolean;
  title?: string;
  wordCount?: number;
  canGenerateToday?: boolean;
  hasUncompleted?: boolean;
  uncompletedExerciseId?: string | null;
  updatedAt: number;
}

function getTodayKeyVN(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  }
}

export interface ProfileStatsSnapshot {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  dueForReview: number;
  streak: number;
  totalXp: number;
  level: number;
  accuracy: number;
  weeklyWords: number;
  dailyGoal: number;
  todayWords: number;
  dailyActivity: { day: string; words: number; xp: number }[];
  achievements: unknown[];
  updatedAt?: number;
}

export interface LibraryCatalogSnapshot {
  routes: unknown[];
  microPackSize: number;
  catalogVersion: string;
  updatedAt: number;
}

const keyForDashboardSecondary = (userId: string) => `lp:${STORAGE_KEYS.DASHBOARD_SECONDARY}:${userId}`;
const keyForDailyReading = (userId: string) => `lp:${STORAGE_KEYS.DAILY_READING}:${userId}`;
const keyForProfileStats = (userId: string) => `lp:${STORAGE_KEYS.PROFILE_STATS}:${userId}`;
const keyForLibraryCatalog = () => STORAGE_KEYS.LIBRARY_CATALOG;
const keyForRoadmap = (userId: string, track: string) => `lp:${STORAGE_KEYS.ROADMAP}:${userId}:${track}`;
const keyForChallengeWidget = (userId: string) => `lp:${STORAGE_KEYS.CHALLENGE_WIDGET}:${userId}`;
const keyForProMilestone = (userId: string) => `lp:${STORAGE_KEYS.PRO_MILESTONE}:${userId}`;

function safeWriteJson(key: string, value: unknown, userId?: string): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(value);
  for (const storage of getBrowserStorages()) {
    try {
      storage.setItem(key, serialized);
      if (userId) {
        storage.setItem(LAST_USER_ID_KEY, userId);
      }
    } catch {
      // QuotaExceededError or private browsing mode
    }
  }
}

function readByUserOrPrefix<T>(
  keyBuilder: (uid: string) => string,
  prefix: string,
  validator?: (val: T) => boolean,
): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const lastUserId = getLastUserId();
    if (lastUserId) {
      const cached = safeReadJson<T>(keyBuilder(lastUserId));
      if (cached && (!validator || validator(cached))) return cached;
    }
    for (const storage of getBrowserStorages()) {
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) {
          const raw = storage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as T;
              if (parsed && (!validator || validator(parsed))) return parsed;
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

export function readLastDashboardSecondaryCache(userId?: string | null): DashboardSecondarySnapshot | null {
  if (userId) {
    const direct = userStorage(userId).get<DashboardSecondarySnapshot>(STORAGE_KEYS.DASHBOARD_SECONDARY);
    if (direct && typeof direct === 'object') return direct;
  }
  return readByUserOrPrefix<DashboardSecondarySnapshot>(
    keyForDashboardSecondary,
    `lp:${STORAGE_KEYS.DASHBOARD_SECONDARY}:`,
    (v) => typeof v === 'object' && v !== null,
  );
}

export function writeDashboardSecondaryCache(
  userId: string,
  partial: Partial<DashboardSecondarySnapshot>,
): void {
  if (typeof window === 'undefined' || !userId) return;
  const existing = userStorage(userId).get<DashboardSecondarySnapshot>(STORAGE_KEYS.DASHBOARD_SECONDARY) || {};
  const merged: DashboardSecondarySnapshot = {
    ...existing,
    ...partial,
    updatedAt: Date.now(),
  };
  userStorage(userId).set(STORAGE_KEYS.DASHBOARD_SECONDARY, merged);
}

export function readLastDailyReadingCache(userId?: string | null): DailyReadingSnapshot | null {
  const snap = userId
    ? userStorage(userId).get<DailyReadingSnapshot>(STORAGE_KEYS.DAILY_READING)
    : readByUserOrPrefix<DailyReadingSnapshot>(
        keyForDailyReading,
        `lp:${STORAGE_KEYS.DAILY_READING}:`,
        (v) => typeof v === 'object' && v !== null && Array.isArray(v.exercises),
      );
  if (!snap || !Array.isArray(snap.exercises) || snap.exercises.length === 0) return null;
  const todayKey = getTodayKeyVN();
  if (snap.date && snap.date !== todayKey) return null;
  return snap;
}

export function writeDailyReadingCache(
  userId: string,
  payload: Omit<DailyReadingSnapshot, 'updatedAt' | 'date'>,
): void {
  if (typeof window === 'undefined' || !userId || !Array.isArray(payload.exercises)) return;
  const todayKey = getTodayKeyVN();
  const record: DailyReadingSnapshot = {
    ...payload,
    date: todayKey,
    updatedAt: Date.now(),
  };
  userStorage(userId).set(STORAGE_KEYS.DAILY_READING, record);
}

export function readLastProfileStatsCache<T = Record<string, unknown>>(userId?: string | null): T | null {
  if (userId) {
    const direct = userStorage(userId).get<T>(STORAGE_KEYS.PROFILE_STATS);
    if (direct && typeof direct === 'object') return direct;
  }
  return readByUserOrPrefix<T>(
    keyForProfileStats,
    `lp:${STORAGE_KEYS.PROFILE_STATS}:`,
    (v) =>
      typeof v === 'object' &&
      v !== null &&
      ('wordStats' in (v as Record<string, unknown>) || 'totalWords' in (v as Record<string, unknown>)),
  );
}

export function writeProfileStatsCache<T = Record<string, unknown>>(userId: string, stats: T): void {
  if (typeof window === 'undefined' || !userId || !stats || typeof stats !== 'object') return;
  userStorage(userId).set(STORAGE_KEYS.PROFILE_STATS, {
    ...(stats as Record<string, unknown>),
    updatedAt: Date.now(),
  });
}

export function readLibraryCatalogCache(): LibraryCatalogSnapshot | null {
  const snap = safeReadJson<LibraryCatalogSnapshot>(keyForLibraryCatalog());
  if (!snap || !Array.isArray(snap.routes) || snap.routes.length === 0) return null;
  return snap;
}

export function writeLibraryCatalogCache(payload: Omit<LibraryCatalogSnapshot, 'updatedAt'>): void {
  if (typeof window === 'undefined' || !Array.isArray(payload.routes)) return;
  safeWriteJson(keyForLibraryCatalog(), { ...payload, updatedAt: Date.now() });
}

export function readLastRoadmapCache<T = unknown>(track: string, userId?: string | null): T[] | null {
  if (typeof window === 'undefined' || !track) return null;
  const uid = userId || getLastUserId() || 'anon';
  const snap = userStorage(uid).get<{ nodes: T[]; updatedAt: number }>(`${STORAGE_KEYS.ROADMAP}:${track}`);
  if (snap && Array.isArray(snap.nodes) && snap.nodes.length > 0) return snap.nodes;
  for (const storage of getBrowserStorages()) {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(`lp:${STORAGE_KEYS.ROADMAP}:`) && k.endsWith(`:${track}`)) {
        const parsed = safeReadJson<{ nodes: T[]; updatedAt: number }>(k);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          return parsed.nodes;
        }
      }
    }
  }
  return null;
}

export function writeRoadmapCache<T = unknown>(track: string, nodes: T[], userId?: string | null): void {
  if (typeof window === 'undefined' || !track || !Array.isArray(nodes) || nodes.length === 0) return;
  const uid = userId || getLastUserId() || 'anon';
  safeWriteJson(keyForRoadmap(uid, track), { nodes, updatedAt: Date.now() }, userId || undefined);
}

export function readLastChallengeWidgetCache<T = unknown>(userId?: string | null): T | null {
  if (userId) {
    const direct = userStorage(userId).get<{ data: T; updatedAt: number }>(STORAGE_KEYS.CHALLENGE_WIDGET);
    if (direct && direct.data !== undefined) return direct.data;
  }
  const found = readByUserOrPrefix<{ data: T; updatedAt: number }>(
    keyForChallengeWidget,
    `lp:${STORAGE_KEYS.CHALLENGE_WIDGET}:`,
    (v) => typeof v === 'object' && v !== null && 'data' in v,
  );
  return found ? found.data : null;
}

export function writeChallengeWidgetCache<T = unknown>(userId: string, data: T): void {
  if (typeof window === 'undefined' || !userId) return;
  userStorage(userId).set(STORAGE_KEYS.CHALLENGE_WIDGET, { data, updatedAt: Date.now() });
}

export function readLastProMilestoneCache<T = unknown>(userId?: string | null): T | null {
  if (userId) {
    const direct = userStorage(userId).get<{ data: T; updatedAt: number }>(STORAGE_KEYS.PRO_MILESTONE);
    if (direct && direct.data !== undefined) return direct.data;
  }
  const found = readByUserOrPrefix<{ data: T; updatedAt: number }>(
    keyForProMilestone,
    `lp:${STORAGE_KEYS.PRO_MILESTONE}:`,
    (v) => typeof v === 'object' && v !== null && 'data' in v,
  );
  return found ? found.data : null;
}

export function writeProMilestoneCache<T = unknown>(userId: string, data: T): void {
  if (typeof window === 'undefined' || !userId) return;
  userStorage(userId).set(STORAGE_KEYS.PRO_MILESTONE, { data, updatedAt: Date.now() });
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
  if (userId) {
    for (const storage of getBrowserStorages()) {
      try {
        storage.removeItem(keyForProfile(userId));
        storage.removeItem(keyForGamification(userId));
        storage.removeItem(keyForDashboardWords(userId));
        storage.removeItem(keyForDashboardSecondary(userId));
        storage.removeItem(keyForDailyReading(userId));
        storage.removeItem(keyForProfileStats(userId));
        storage.removeItem(keyForChallengeWidget(userId));
        storage.removeItem(keyForProMilestone(userId));
        for (const track of ['cefr', 'thpt', 'toeic']) {
          storage.removeItem(keyForRoadmap(userId, track));
        }
        const lastId = storage.getItem(LAST_USER_ID_KEY);
        if (lastId === userId) storage.removeItem(LAST_USER_ID_KEY);
      } catch {
        // ignore
      }
    }
  } else {
    clearUserAccountStorage();
  }
}
