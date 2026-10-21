/**
 * Single source of truth for environment-specific settings. Values come from Vite env files selected by
 * the build mode: `.env.development` (npm run dev), `.env.staging` (--mode staging) and `.env.production`
 * (npm run build). Nothing else in the app may read `import.meta.env` directly.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';
