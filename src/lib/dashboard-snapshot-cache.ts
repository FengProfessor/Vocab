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

export interface DashboardSecondarySnapshot {
  dailyActivity?: Array<{ date: string; count: number; day?: string; words?: number; xp?: number; isToday?: boolean }>;
  todayWords?: number;
  todayNewWords?: number;
  todayReviewWords?: number;
  studyStreak?: number;
  vocabPacks?: Array<any>;
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
  exercises: any[];
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
  achievements: any[];
  updatedAt?: number;
}

export interface LibraryCatalogSnapshot {
  routes: any[];
  microPackSize: number;
  catalogVersion: string;
  updatedAt: number;
}

const keyForDashboardSecondary = (userId: string) => `lp:dashboard-secondary:${userId}`;
const keyForDailyReading = (userId: string) => `lp:daily-reading:${userId}`;
const keyForProfileStats = (userId: string) => `lp:profile-stats:${userId}`;
const keyForLibraryCatalog = () => `lp:library-catalog:v1`;
const keyForRoadmap = (userId: string, track: string) => `lp:roadmap:${userId}:${track}`;
const keyForChallengeWidget = (userId: string) => `lp:challenge-widget:${userId}`;
const keyForProMilestone = (userId: string) => `lp:pro-milestone:${userId}`;

function safeWriteJson(key: string, value: unknown, userId?: string): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(value);
  for (const storage of getStorages()) {
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
    for (const storage of getStorages()) {
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
    const direct = safeReadJson<DashboardSecondarySnapshot>(keyForDashboardSecondary(userId));
    if (direct && typeof direct === 'object') return direct;
  }
  return readByUserOrPrefix<DashboardSecondarySnapshot>(
    keyForDashboardSecondary,
    'lp:dashboard-secondary:',
    (v) => typeof v === 'object' && v !== null,
  );
}

export function writeDashboardSecondaryCache(
  userId: string,
  partial: Partial<DashboardSecondarySnapshot>,
): void {
  if (typeof window === 'undefined' || !userId) return;
  const existing = safeReadJson<DashboardSecondarySnapshot>(keyForDashboardSecondary(userId)) || {};
  const merged: DashboardSecondarySnapshot = {
    ...existing,
    ...partial,
    updatedAt: Date.now(),
  };
  safeWriteJson(keyForDashboardSecondary(userId), merged, userId);
}

export function readLastDailyReadingCache(userId?: string | null): DailyReadingSnapshot | null {
  const snap = userId
    ? safeReadJson<DailyReadingSnapshot>(keyForDailyReading(userId))
    : readByUserOrPrefix<DailyReadingSnapshot>(
        keyForDailyReading,
        'lp:daily-reading:',
        (v) => typeof v === 'object' && v !== null && Array.isArray(v.exercises),
      );
  if (!snap || !Array.isArray(snap.exercises) || snap.exercises.length === 0) return null;
  // Invalidate if cached from a previous calendar day in Vietnam timezone (Asia/Ho_Chi_Minh)
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
  safeWriteJson(keyForDailyReading(userId), record, userId);
}

export function readLastProfileStatsCache<T = any>(userId?: string | null): T | null {
  if (userId) {
    const direct = safeReadJson<T>(keyForProfileStats(userId));
    if (direct && typeof direct === 'object') return direct;
  }
  return readByUserOrPrefix<T>(
    keyForProfileStats,
    'lp:profile-stats:',
    (v) => typeof v === 'object' && v !== null && ('wordStats' in (v as any) || 'totalWords' in (v as any)),
  );
}

export function writeProfileStatsCache<T = any>(userId: string, stats: T): void {
  if (typeof window === 'undefined' || !userId || !stats || typeof stats !== 'object') return;
  safeWriteJson(keyForProfileStats(userId), { ...(stats as any), updatedAt: Date.now() }, userId);
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

export function readLastRoadmapCache<T = any>(track: string, userId?: string | null): T[] | null {
  if (typeof window === 'undefined' || !track) return null;
  const uid = userId || getLastUserId() || 'anon';
  const snap = safeReadJson<{ nodes: T[]; updatedAt: number }>(keyForRoadmap(uid, track));
  if (snap && Array.isArray(snap.nodes) && snap.nodes.length > 0) return snap.nodes;
  // Fallback scan for any user's cached track if getLastUserId wasn't set yet
  for (const storage of getStorages()) {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith('lp:roadmap:') && k.endsWith(`:${track}`)) {
        const parsed = safeReadJson<{ nodes: T[]; updatedAt: number }>(k);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          return parsed.nodes;
        }
      }
    }
  }
  return null;
}

export function writeRoadmapCache<T = any>(track: string, nodes: T[], userId?: string | null): void {
  if (typeof window === 'undefined' || !track || !Array.isArray(nodes) || nodes.length === 0) return;
  const uid = userId || getLastUserId() || 'anon';
  safeWriteJson(keyForRoadmap(uid, track), { nodes, updatedAt: Date.now() }, userId || undefined);
}

export function readLastChallengeWidgetCache<T = any>(userId?: string | null): T | null {
  if (userId) {
    const direct = safeReadJson<{ data: T; updatedAt: number }>(keyForChallengeWidget(userId));
    if (direct && direct.data !== undefined) return direct.data;
  }
  const found = readByUserOrPrefix<{ data: T; updatedAt: number }>(
    keyForChallengeWidget,
    'lp:challenge-widget:',
    (v) => typeof v === 'object' && v !== null && 'data' in v,
  );
  return found ? found.data : null;
}

export function writeChallengeWidgetCache<T = any>(userId: string, data: T): void {
  if (typeof window === 'undefined' || !userId) return;
  safeWriteJson(keyForChallengeWidget(userId), { data, updatedAt: Date.now() }, userId);
}

export function readLastProMilestoneCache<T = any>(userId?: string | null): T | null {
  if (userId) {
    const direct = safeReadJson<{ data: T; updatedAt: number }>(keyForProMilestone(userId));
    if (direct && direct.data !== undefined) return direct.data;
  }
  const found = readByUserOrPrefix<{ data: T; updatedAt: number }>(
    keyForProMilestone,
    'lp:pro-milestone:',
    (v) => typeof v === 'object' && v !== null && 'data' in v,
  );
  return found ? found.data : null;
}

export function writeProMilestoneCache<T = any>(userId: string, data: T): void {
  if (typeof window === 'undefined' || !userId) return;
  safeWriteJson(keyForProMilestone(userId), { data, updatedAt: Date.now() }, userId);
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

const USER_SCOPED_PREFIXES = [
  'lp:profile:',
  'lp:gamification:',
  'lp:dashboard-words:',
  'lp:dashboard-secondary:',
  'lp:daily-reading:',
  'lp:profile-stats:',
  'lp:roadmap:',
  'lp:challenge-widget:',
  'lp:pro-milestone:',
];

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
      } else {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (
            k &&
            (USER_SCOPED_PREFIXES.some((prefix) => k.startsWith(prefix)) ||
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

