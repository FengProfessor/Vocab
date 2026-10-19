/**
 * Single source of truth for environment-specific settings. Values come from Vite env files selected by
 * the build mode: `.env.development` (npm run dev), `.env.staging` (--mode staging) and `.env.production`
 * (npm run build). Nothing else in the app may read `import.meta.env` directly.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

function requireUrl(name: 'VITE_API_BASE_URL' | 'VITE_SERVER_ORIGIN'): string {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  if (!value) {
    throw new Error(`Missing ${name}. Define it in the .env.${import.meta.env.MODE} file.`);
  }
  return value.replace(/\/+$/, '');
}

export const appConfig = {
  /** Which deployment this bundle was built for. */
  environment: (import.meta.env.MODE === 'staging' || import.meta.env.MODE === 'production'
    ? import.meta.env.MODE
    : 'development') as AppEnvironment,

  /** Absolute base URL of the .NET API, e.g. https://api.lingopro.online/api/v1. */
  apiBaseUrl: requireUrl('VITE_API_BASE_URL'),

  /** Origin of the .NET server (marketing/SSR pages), without a path. */
  serverOrigin: requireUrl('VITE_SERVER_ORIGIN'),
} as const;
