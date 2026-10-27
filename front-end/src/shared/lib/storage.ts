/**
 * Centralized, user-namespaced browser storage abstraction (`localStorage` + `sessionStorage`).
 * Ensures instant 0ms client-side hydration while strictly isolating account-scoped cache data
 * across users and preserving offline study decks and theme preferences on sign-out.
 */

export const STORAGE_KEYS = {
  LAST_USER_ID: 'lp:last_user_id',
  PROFILE: 'profile',
  GAMIFICATION: 'gamification',
  DASHBOARD_WORDS: 'dashboard-words',
  DASHBOARD_SECONDARY: 'dashboard-secondary',
  DAILY_READING: 'daily-reading',
  PROFILE_STATS: 'profile-stats',
  ROADMAP: 'roadmap',
  CHALLENGE_WIDGET: 'challenge-widget',
  PRO_MILESTONE: 'pro-milestone',
  WORD_SUMMARY: 'word-summary',
  TEACHER: 'teacher',
  LIBRARY_CATALOG: 'lp:library-catalog:v1',
  READING_LIBRARY_QUERY_PREFIX: 'lp:reading_library:query_v1',
  READING_LIBRARY_BOOKMARKS: 'lp:reading_library:bookmarks_v1',
  REFERRAL_CHECKED: 'lp_ref_checked',
} as const;

const DEFAULT_USER_SCOPED_NAMESPACES = new Set<string>([
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.GAMIFICATION,
  STORAGE_KEYS.DASHBOARD_WORDS,
  STORAGE_KEYS.DASHBOARD_SECONDARY,
  STORAGE_KEYS.DAILY_READING,
  STORAGE_KEYS.PROFILE_STATS,
  STORAGE_KEYS.ROADMAP,
  STORAGE_KEYS.CHALLENGE_WIDGET,
  STORAGE_KEYS.PRO_MILESTONE,
  STORAGE_KEYS.WORD_SUMMARY,
  STORAGE_KEYS.TEACHER,
  'v1:user',
]);

const registeredUserNamespaces = new Set<string>(DEFAULT_USER_SCOPED_NAMESPACES);

const PRESERVED_KEY_PATTERNS = [
  /^theme$/i,
  /^vite-ui-theme$/i,
  /^next-themes/i,
  /^lp:theme/i,
  /^lp:offline/i,
  /^offline/i,
  /^lingopro_offline/i,
  /^lp:library-catalog:/,
  /^lp:reading_library:bookmarks_/,
];

export function isPreservedStorageKey(rawKey: string): boolean {
  return PRESERVED_KEY_PATTERNS.some((pattern) => pattern.test(rawKey));
}

export function getBrowserStorages(): Storage[] {
  if (typeof window === 'undefined') return [];
  const list: Storage[] = [];
  try {
    if (typeof window.localStorage !== 'undefined' && window.localStorage) {
      list.push(window.localStorage);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  try {
    if (typeof window.sessionStorage !== 'undefined' && window.sessionStorage) {
      list.push(window.sessionStorage);
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return list;
}

/**
 * Normalizes a logical key into its user-scoped storage key: `lp:<namespace>:<userId>`
 * (or `lp:roadmap:<userId>:<track>` for roadmap keys).
 */
export function buildUserStorageKey(userId: string, key: string): string {
  const cleanKey = key.replace(/^lp:/, '');
  if (cleanKey.startsWith('roadmap:')) {
    const track = cleanKey.slice('roadmap:'.length);
    registeredUserNamespaces.add('roadmap');
    return `lp:roadmap:${userId}:${track}`;
  }
  const baseNamespace = cleanKey.split(':')[0] || cleanKey;
  registeredUserNamespaces.add(baseNamespace);
  return `lp:${cleanKey}:${userId}`;
}

export function getLastUserId(): string | null {
  for (const store of getBrowserStorages()) {
    try {
      const value = store.getItem(STORAGE_KEYS.LAST_USER_ID);
      if (value) return value;
    } catch {
      // Ignore access error
    }
  }
  return null;
}

export function setLastUserId(userId: string): void {
  if (!userId) return;
  for (const store of getBrowserStorages()) {
    try {
      store.setItem(STORAGE_KEYS.LAST_USER_ID, userId);
    } catch {
      // Ignore quota error
    }
  }
}

export interface UserScopedStorage {
  readonly userId: string;
  key(key: string): string;
  get<T>(key: string, fallback?: T | null): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

/**
 * Creates a user-scoped storage accessor that isolates cached JSON records by `userId`.
 */
export function userStorage(userId: string): UserScopedStorage {
  const normalizedUserId = String(userId || '').trim();

  return {
    userId: normalizedUserId,

    key(key: string): string {
      return buildUserStorageKey(normalizedUserId, key);
    },

    get<T>(key: string, fallback: T | null = null): T | null {
      if (!normalizedUserId || typeof window === 'undefined') {
        return fallback;
      }
      const fullKey = buildUserStorageKey(normalizedUserId, key);
      for (const store of getBrowserStorages()) {
        try {
          const raw = store.getItem(fullKey);
          if (raw !== null && raw !== undefined && raw !== '') {
            return JSON.parse(raw) as T;
          }
        } catch {
          // Corrupted JSON or storage error — try next store or return fallback
        }
      }
      return fallback;
    },

    set<T>(key: string, value: T): void {
      if (!normalizedUserId || typeof window === 'undefined') {
        return;
      }
      const fullKey = buildUserStorageKey(normalizedUserId, key);
      let serialized: string;
      try {
        serialized = JSON.stringify(value);
      } catch {
        return;
      }
      for (const store of getBrowserStorages()) {
        try {
          store.setItem(fullKey, serialized);
          store.setItem(STORAGE_KEYS.LAST_USER_ID, normalizedUserId);
        } catch {
          // Ignore QuotaExceededError or private mode restriction
        }
      }
    },

    remove(key: string): void {
      if (!normalizedUserId || typeof window === 'undefined') {
        return;
      }
      const fullKey = buildUserStorageKey(normalizedUserId, key);
      for (const store of getBrowserStorages()) {
        try {
          store.removeItem(fullKey);
        } catch {
          // Ignore storage error
        }
      }
    },

    clear(): void {
      if (!normalizedUserId) return;
      clearUserAccountStorage(normalizedUserId);
    },
  };
}

function isAccountScopedKey(rawKey: string, targetUserId?: string | null): boolean {
  if (!rawKey || isPreservedStorageKey(rawKey)) {
    return false;
  }

  if (targetUserId) {
    const uid = targetUserId.trim();
    if (!uid) return false;
    if (rawKey.startsWith('lp:')) {
      if (rawKey.endsWith(`:${uid}`) || rawKey.includes(`:${uid}:`)) {
        return true;
      }
    }
    return false;
  }

  if (
    rawKey === STORAGE_KEYS.LAST_USER_ID ||
    rawKey === STORAGE_KEYS.REFERRAL_CHECKED ||
    rawKey.startsWith('lp:upsell:paid_') ||
    rawKey.startsWith('lingopro.auth.')
  ) {
    return true;
  }

  for (const ns of registeredUserNamespaces) {
    if (rawKey.startsWith(`lp:${ns}:`)) {
      return true;
    }
  }

  return false;
}

/**
 * Purges user account cache from both `localStorage` and `sessionStorage` on sign-out or account switch,
 * while preserving offline study decks and theme preferences.
 */
export function clearUserAccountStorage(userId?: string | null): void {
  if (typeof window === 'undefined') return;

  for (const store of getBrowserStorages()) {
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && isAccountScopedKey(key, userId)) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        store.removeItem(key);
      }
      if (userId) {
        const lastId = store.getItem(STORAGE_KEYS.LAST_USER_ID);
        if (lastId === userId) {
          store.removeItem(STORAGE_KEYS.LAST_USER_ID);
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }
}

/**
 * Provides safe, typed wrappers around browser localStorage and sessionStorage
 * to support instant 0ms client-side state hydration without throwing in restricted environments.
 */
export class BrowserStorage {
  /**
   * Reads and parses a JSON value from localStorage, returning the fallback on failure.
   */
  public static getLocal<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Serializes and writes a value to localStorage.
   */
  public static setLocal<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota exceeded or private browsing errors
    }
  }

  /**
   * Removes a key from localStorage.
   */
  public static removeLocal(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Reads and parses a JSON value from sessionStorage, returning the fallback on failure.
   */
  public static getSession<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') {
      return fallback;
    }

    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Serializes and writes a value to sessionStorage for instant dashboard hydration.
   */
  public static setSession<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * Removes a key from sessionStorage.
   */
  public static removeSession(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  }
}

export const storage = {
  keys: STORAGE_KEYS,
  user: userStorage,
  clearUserAccountStorage,
  getLastUserId,
  setLastUserId,
  local: {
    get: BrowserStorage.getLocal,
    set: BrowserStorage.setLocal,
    remove: BrowserStorage.removeLocal,
  },
  session: {
    get: BrowserStorage.getSession,
    set: BrowserStorage.setSession,
    remove: BrowserStorage.removeSession,
  },
} as const;
