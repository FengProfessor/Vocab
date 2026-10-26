const LEGACY_TOKEN_KEYS = [
  'lp:auth:access_token',
  'lp:auth:refresh_token',
  'lp:auth:expires_at',
  'lingopro.auth.session.v1',
] as const;

const LEGACY_SUPABASE_KEY_PATTERN = /^sb-[a-z0-9-]+-auth-token.*$/i;
const LEGACY_LP_AUTH_KEY_PATTERN = /^lp:auth:/i;

let memoryAccessToken: string | null = null;
let memoryExpiresAt: number | null = null;

/**
 * In-memory access token store (Decision D2).
 * Access tokens live exclusively in JavaScript memory; refresh tokens live in the
 * server-managed HttpOnly cookie (`Path=/api/v1/auth`). Neither token is ever written
 * to `localStorage` or `sessionStorage`.
 */
export class TokenStore {
  /**
   * Purges any legacy Supabase (`sb-*`) or `lp:auth:*` token entries from web storage.
   */
  public static purgeLegacyStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    for (const storageName of ['localStorage', 'sessionStorage'] as const) {
      try {
        const storage = window[storageName];
        for (const key of LEGACY_TOKEN_KEYS) {
          storage.removeItem(key);
        }
        const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
        for (const key of keys) {
          if (
            key &&
            (LEGACY_SUPABASE_KEY_PATTERN.test(key) || LEGACY_LP_AUTH_KEY_PATTERN.test(key))
          ) {
            storage.removeItem(key);
          }
        }
      } catch {
        // Web storage may be disabled in strict privacy modes.
      }
    }
  }

  /**
   * Reads an OAuth/magic-link access token from the URL fragment (`#access_token=...`),
   * stores it in memory, and strips the fragment from the address bar.
   * Skips password-recovery fragments (`type=recovery`) so the recovery form can consume them.
   */
  public static captureFromUrlHash(): void {
    TokenStore.purgeLegacyStorage();

    if (typeof window === 'undefined' || !window.location.hash.includes('access_token=')) {
      return;
    }

    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type')?.toLowerCase() === 'recovery') {
      return;
    }

    const accessToken = params.get('access_token');
    if (accessToken) {
      const expiresIn = Number(params.get('expires_in'));
      TokenStore.save(
        accessToken,
        null,
        Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : null,
      );
    }

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  /**
   * Stores the short-lived access token in memory.
   * Refresh tokens are managed via the HttpOnly `/api/v1/auth` cookie and are never persisted here.
   */
  public static save(
    accessToken: string,
    _refreshToken?: string | null,
    expiresInSeconds?: number | null,
  ): void {
    TokenStore.purgeLegacyStorage();
    memoryAccessToken = accessToken || null;
    memoryExpiresAt =
      typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
        ? Date.now() + expiresInSeconds * 1000
        : null;
  }

  public static getAccessToken(): string | null {
    return memoryAccessToken;
  }

  /**
   * Always returns null because the refresh token is stored exclusively in the HttpOnly cookie.
   */
  public static getRefreshToken(): string | null {
    return null;
  }

  public static getExpiresAt(): number | null {
    return memoryExpiresAt;
  }

  public static clear(): void {
    memoryAccessToken = null;
    memoryExpiresAt = null;
    TokenStore.purgeLegacyStorage();
  }
}
