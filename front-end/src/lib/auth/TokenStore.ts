const ACCESS_KEY = 'lp:auth:access_token';
const REFRESH_KEY = 'lp:auth:refresh_token';
const EXPIRES_AT_KEY = 'lp:auth:expires_at';

/**
 * Holds the Supabase access/refresh tokens handed over by the server after login.
 * The server redirects to the SPA with the tokens in the URL fragment (`#access_token=...`); this store
 * captures them once, removes them from the address bar, and keeps them in sessionStorage for the tab.
 * Requests attach the access token as a Bearer header; the HttpOnly cookies remain a fallback.
 */
export class TokenStore {
  /**
   * Reads tokens from the current URL fragment, persists them, and strips the fragment from history
   * so the tokens never stay in the address bar. Safe to call repeatedly.
   */
  public static captureFromUrlHash(): void {
    if (typeof window === 'undefined' || !window.location.hash.includes('access_token=')) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken) {
      const expiresIn = Number(params.get('expires_in'));
      TokenStore.save(accessToken, refreshToken, Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : null);
    }

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  /** Persists a token pair; `expiresInSeconds` is optional because some hand-offs do not know it. */
  public static save(accessToken: string, refreshToken: string | null, expiresInSeconds: number | null): void {
    try {
      sessionStorage.setItem(ACCESS_KEY, accessToken);
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_KEY, refreshToken);
      }
      if (expiresInSeconds) {
        sessionStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
      } else {
        sessionStorage.removeItem(EXPIRES_AT_KEY);
      }
    } catch {
      // Storage unavailable: the HttpOnly cookie fallback still authenticates requests.
    }
  }

  public static getAccessToken(): string | null {
    try {
      return sessionStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  }

  public static getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  }

  public static clear(): void {
    try {
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(EXPIRES_AT_KEY);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  }
}
