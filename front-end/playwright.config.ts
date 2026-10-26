import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the browser smoke test (tests/e2e/*.spec.ts).
 *
 * Environment:
 *   E2E_BASE_URL  URL of a running SPA (e.g. http://localhost:5173 from `npm run dev`, with the .NET API running).
 *   E2E_EMAIL     Email of a dedicated test account (email/password login).
 *   E2E_PASSWORD  Password of that account.
 * The smoke test skips itself when any of these is missing.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  outputDir: 'test-results/e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
  ],
});
