/**
 * Referral Tracking Utilities — Client-side attribution capture.
 *
 * Captures referral codes from query parameters (?ref= or ?invite=) or /invite/[code] path,
 * persisting in first-party cookie (30 days) and sessionStorage across Google OAuth PKCE flows.
 */

export const REFERRAL_COOKIE_NAME = 'lingopro_ref';
export const REFERRAL_STORAGE_KEY = 'lingopro_ref_code';
export const REFERRAL_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Capture referral code from current URL and persist to cookie & storage.
 */
export function captureReferralCode(customUrl?: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(customUrl || window.location.href);
    let code: string | null = null;

    // 1. Check query parameters ?ref=CODE or ?invite=CODE
    const queryCode = url.searchParams.get('ref') || url.searchParams.get('invite');
    if (queryCode && queryCode.trim()) {
      code = queryCode.trim().toUpperCase();
    }

    // 2. Check /invite/[code] path
    if (!code && url.pathname.startsWith('/invite/')) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] === 'invite' && parts[1]) {
        code = decodeURIComponent(parts[1]).trim().toUpperCase();
      }
    }

    if (!code) return null;

    // Sanitize: allow alphanumeric, underscore, hyphen (3 to 32 chars)
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return null;
    }

    // Persist in first-party cookie
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${REFERRAL_MAX_AGE_SECONDS}; SameSite=Lax${isSecure ? '; Secure' : ''}`;

    // Persist in sessionStorage as backup for OAuth PKCE redirect
    try {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
    } catch {
      // ignore quota / storage errors
    }

    return code;
  } catch {
    return null;
  }
}

/**
 * Read the current stored referral code from cookie or sessionStorage.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check Cookie first
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${REFERRAL_COOKIE_NAME}=`));

    if (match) {
      const raw = match.substring(REFERRAL_COOKIE_NAME.length + 1);
      const val = decodeURIComponent(raw).trim().toUpperCase();
      if (/^[A-Z0-9_-]{3,32}$/.test(val)) return val;
    }

    // 2. Fallback to sessionStorage
    const stored = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    if (stored) {
      const val = stored.trim().toUpperCase();
      if (/^[A-Z0-9_-]{3,32}$/.test(val)) return val;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clear stored referral code upon successful attribution claim.
 */
export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;

  try {
    document.cookie = `${REFERRAL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Resolves the canonical public origin for referral share links.
 * Strictly avoids internal binding IPs like 0.0.0.0 or private addresses.
 */
export function resolvePublicOrigin(req?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('0.0.0.0')) {
    return envUrl.replace(/\/$/, '');
  }

  if (req) {
    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';

    if (forwardedHost && !forwardedHost.includes('0.0.0.0')) {
      if (
        (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1')) &&
        process.env.NODE_ENV === 'development'
      ) {
        return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
      }

      if (forwardedHost.includes('lingopro.online')) {
        return `https://${forwardedHost}`.replace(/\/$/, '');
      }
    }
  }

  return 'https://lingopro.online';
}

/**
 * Ensures the share URL in the browser always uses a valid routable host.
 * Guarantees 0.0.0.0 or internal dev hosts are replaced with the browser's origin or lingopro.online.
 */
export function getClientShareUrl(code?: string, rawShareUrl?: string): string {
  const cleanCode = (code || '').trim();
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    if (currentOrigin && !currentOrigin.includes('0.0.0.0')) {
      return cleanCode
        ? `${currentOrigin}/invite/${cleanCode}`
        : rawShareUrl?.replace(/https?:\/\/0\.0\.0\.0(:\d+)?/, currentOrigin) || '';
    }
  }

  if (rawShareUrl && !rawShareUrl.includes('0.0.0.0')) {
    return rawShareUrl;
  }

  return cleanCode ? `https://lingopro.online/invite/${cleanCode}` : 'https://lingopro.online';
}

