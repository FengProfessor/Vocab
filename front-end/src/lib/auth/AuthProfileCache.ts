import { BrowserStorage } from '@/lib/storage';
import { AuthSessionDto } from '@/types/auth/AuthSessionDto';

const AUTH_PROFILE_CACHE_KEY = 'lingopro.auth.profile.v2';
const LEGACY_SESSION_KEY = 'lingopro.auth.session.v1';

/**
 * Caches only the non-secret user profile for instant, offline-tolerant hydration.
 * The cache is never an authentication credential: the server cookie remains the sole source of truth.
 */
export class AuthProfileCache {
  /**
   * Reads the cached session profile (no tokens).
   */
  public static read(): AuthSessionDto | null {
    // v1 stored access/refresh tokens in localStorage; purge it so no credential outlives the migration.
    BrowserStorage.removeLocal(LEGACY_SESSION_KEY);

    const cached = BrowserStorage.getLocal<AuthSessionDto | null>(AUTH_PROFILE_CACHE_KEY, null);
    return cached?.user?.id ? { user: cached.user } : null;
  }

  public static write(session: AuthSessionDto): void {
    BrowserStorage.setLocal(AUTH_PROFILE_CACHE_KEY, { user: session.user });
  }

  public static clear(): void {
    BrowserStorage.removeLocal(AUTH_PROFILE_CACHE_KEY);
    BrowserStorage.removeLocal(LEGACY_SESSION_KEY);
  }
}
