const REFERRAL_COOKIE_NAME = 'lingopro_ref';
const REFERRAL_STORAGE_KEY = 'lingopro_ref_code';
const REFERRAL_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const REFERRAL_CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

/**
 * Referral attribution tracker (port of the original src/lib/referral-tracker.ts).
 * Captures ?ref= / ?invite= / /invite/:code, persists it in a first-party cookie (30 days) with a
 * sessionStorage backup, and exposes it for the post-login claim step.
 */
export class ReferralTracker {
  /**
   * Captures a referral code from the current (or supplied) URL and persists it.
   */
  public static capture(customUrl?: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const url = new URL(customUrl || window.location.href);
      let code: string | null = null;

      const queryCode = url.searchParams.get('ref') || url.searchParams.get('invite');
      if (queryCode && queryCode.trim()) {
        code = queryCode.trim().toUpperCase();
      }

      if (!code && url.pathname.startsWith('/invite/')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2 && parts[0] === 'invite' && parts[1]) {
          code = decodeURIComponent(parts[1]).trim().toUpperCase();
        }
      }

      if (!code || !REFERRAL_CODE_PATTERN.test(code)) return null;

      const isSecure = window.location.protocol === 'https:';
      document.cookie =
        `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${REFERRAL_MAX_AGE_SECONDS}; SameSite=Lax` +
        (isSecure ? '; Secure' : '');

      try {
        sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
      } catch {
        // Ignore storage errors
      }

      return code;
    } catch {
      return null;
    }
  }

  /**
   * Reads the stored referral code from the cookie, falling back to sessionStorage.
   */
  public static getStoredCode(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const match = document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${REFERRAL_COOKIE_NAME}=`));

      if (match) {
        const value = decodeURIComponent(match.substring(REFERRAL_COOKIE_NAME.length + 1)).trim().toUpperCase();
        if (REFERRAL_CODE_PATTERN.test(value)) return value;
      }

      const stored = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
      if (stored) {
        const value = stored.trim().toUpperCase();
        if (REFERRAL_CODE_PATTERN.test(value)) return value;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clears the stored referral code after a successful attribution claim.
   */
  public static clear(): void {
    if (typeof window === 'undefined') return;

    try {
      document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
