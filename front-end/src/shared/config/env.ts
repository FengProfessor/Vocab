/**
 * Centralized environment configuration reader and validator for the LingoPro SPA.
 * Reads from `import.meta.env.VITE_*` and normalizes URLs, flags, and public keys.
 */

export type AppEnvironment = 'development' | 'staging' | 'production';

type RawMetaEnv = Record<string, string | boolean | undefined>;

function getMetaEnv(): RawMetaEnv {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env as unknown as RawMetaEnv;
    }
  } catch {
    // Fallback for non-Vite execution contexts
  }
  return {};
}

function cleanString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\r/g, '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
}

function resolveUrl(raw: unknown, fallback: string): string {
  const cleaned = cleanString(raw);
  if (!cleaned || cleaned.includes('0.0.0.0')) {
    return fallback.replace(/\/+$/, '');
  }
  return cleaned.replace(/\/+$/, '');
}

const rawEnv = getMetaEnv();
const rawMode = cleanString(rawEnv.MODE) || 'development';

const environment: AppEnvironment =
  rawMode === 'staging' || rawMode === 'production' ? rawMode : 'development';

export const env = {
  environment,
  isDevelopment: environment === 'development',
  isStaging: environment === 'staging',
  isProduction: environment === 'production',

  /** Absolute base URL of the .NET 10 API, e.g. http://localhost:5000/api/v1. */
  apiBaseUrl: resolveUrl(rawEnv.VITE_API_BASE_URL, 'http://localhost:5000/api/v1'),

  /** Origin of the .NET 10 server without trailing slash. */
  serverOrigin: resolveUrl(rawEnv.VITE_SERVER_ORIGIN, 'http://localhost:5000'),

  /** Canonical public site URL for sharing and referral links. */
  siteUrl: resolveUrl(
    rawEnv.VITE_SITE_URL || rawEnv.VITE_APP_URL,
    'https://lingopro.online',
  ),

  /** PostHog public analytics configuration. */
  posthogKey: cleanString(rawEnv.VITE_POSTHOG_KEY),
  posthogHost: resolveUrl(rawEnv.VITE_POSTHOG_HOST, 'https://us.i.posthog.com'),

  /** Feature entitlement enforcement flag. */
  entitlementEnforced: cleanString(rawEnv.VITE_ENTITLEMENT_ENFORCED) === 'true',

  /** Client-side anti-scraping HMAC salts. */
  toeicSecuritySecret:
    cleanString(rawEnv.VITE_TOEIC_SECURITY_SECRET) ||
    'lingopro_anti_scraping_guard_2026_salt_f79a29e1c',
  vstepSecuritySecret:
    cleanString(rawEnv.VITE_VSTEP_SECURITY_SECRET) ||
    'lingopro_vstep_anti_scraping_guard_2026_b1b2c1',

  /** Optional Firebase Web Push public config overrides. */
  firebase: {
    apiKey: cleanString(rawEnv.VITE_FIREBASE_API_KEY),
    authDomain: cleanString(rawEnv.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: cleanString(rawEnv.VITE_FIREBASE_PROJECT_ID),
    storageBucket: cleanString(rawEnv.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: cleanString(rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: cleanString(rawEnv.VITE_FIREBASE_APP_ID),
    vapidKey: cleanString(rawEnv.VITE_FIREBASE_VAPID_KEY),
  },
} as const;
