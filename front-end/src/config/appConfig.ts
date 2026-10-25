import { AppEnvironment } from '@/config/types/AppEnvironment';

function resolveUrl(name: 'VITE_API_BASE_URL' | 'VITE_SERVER_ORIGIN', fallback: string): string {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  if (!value) {
    return fallback;
  }
  return value.replace(/\/+$/, '');
}

export const appConfig = {
  /** Which deployment this bundle was built for. */
  environment: (import.meta.env.MODE === 'staging' || import.meta.env.MODE === 'production'
    ? import.meta.env.MODE
    : 'development') as AppEnvironment,

  /** Absolute base URL of the .NET API, e.g. http://localhost:5000/api/v1. */
  apiBaseUrl: resolveUrl('VITE_API_BASE_URL', 'http://localhost:5000/api/v1'),

  /** Origin of the .NET server, without a path. */
  serverOrigin: resolveUrl('VITE_SERVER_ORIGIN', 'http://localhost:5000'),
} as const;
