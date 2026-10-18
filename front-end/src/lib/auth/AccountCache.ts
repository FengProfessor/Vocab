/**
 * Removes per-account cached data so one user's data can never be shown to another after an
 * account switch or sign-out (port of the original clearAccountCache). Offline study decks and
 * preferences are intentionally preserved.
 */
export class AccountCache {
  private static readonly ACCOUNT_KEY_PATTERN =
    /^(lp:(profile|gamification|teacher|word-summary|dashboard-words):|lp:last_user_id$|lp_ref_checked$|lp:upsell:paid_|lingopro\.admin\.)/;

  public static clear(): void {
    if (typeof window === 'undefined') return;

    for (const name of ['localStorage', 'sessionStorage'] as const) {
      try {
        const storage = window[name];
        const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
        for (const key of keys) {
          if (key && AccountCache.ACCOUNT_KEY_PATTERN.test(key)) {
            storage.removeItem(key);
          }
        }
      } catch {
        // Offline preferences are independent of authentication.
      }
    }
  }
}
