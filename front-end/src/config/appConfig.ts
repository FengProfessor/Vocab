import { env, type AppEnvironment } from '@/shared/config/env';

export type { AppEnvironment };

/**
 * Single source of truth for environment-specific settings. Values come from Vite env files selected by
 * the build mode: `.env.development` (npm run dev), `.env.staging` (--mode staging) and `.env.production`
 * (npm run build).
 */
export const appConfig = {
  /** Which deployment this bundle was built for. */
  environment: env.environment,

  /** Absolute base URL of the .NET API, e.g. http://localhost:5000/api/v1. */
  apiBaseUrl: env.apiBaseUrl,

  /** Origin of the .NET server, without a path. */
  serverOrigin: env.serverOrigin,

  /** Canonical public site origin. */
  siteUrl: env.siteUrl,
} as const;
