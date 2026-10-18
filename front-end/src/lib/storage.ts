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
}
