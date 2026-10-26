import { expect, test } from '@playwright/test';

/**
 * Regression smoke test for the main learner journey:
 * email login -> /student dashboard -> dictionary lookup -> logout.
 *
 * Requires E2E_BASE_URL, E2E_EMAIL and E2E_PASSWORD (see playwright.config.ts); skipped otherwise.
 * TODO: extend with "review one SRS card" and "take one TOEIC test" once those flows go through the .NET API.
 */
const baseUrl = process.env.E2E_BASE_URL;
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe('learner smoke journey', () => {
  test.skip(!baseUrl || !email || !password, 'Set E2E_BASE_URL, E2E_EMAIL and E2E_PASSWORD to run the smoke test.');

  test('login, open dashboard, look up a word, logout', async ({ page }) => {
    // 1. Email/password login.
    await page.goto('/auth');
    await page.locator('input#email').fill(email!);
    await page.locator('input#password').fill(password!);
    await page.locator('form button[type="submit"]').click();

    // 2. Landing on the student dashboard (onboarding may redirect first-time accounts elsewhere).
    await page.waitForURL(/\/student(\/|\?|$)/, { timeout: 45_000 });
    await expect(page.getByRole('button', { name: 'Đăng xuất' }).filter({ visible: true }).first()).toBeVisible();

    // 3. Dictionary lookup.
    await page.goto('/dictionary');
    const searchBox = page.getByPlaceholder('Gõ từ, cụm hoặc dán câu…');
    await expect(searchBox).toBeVisible();
    await searchBox.fill('apple');
    await searchBox.press('Enter');
    await expect(page.getByText(/apple/i).first()).toBeVisible();
    await expect(page.locator('main, body').first()).not.toContainText(/Không kết nối được máy chủ/);

    // 4. Logout from the student shell.
    await page.goto('/student');
    await page.getByRole('button', { name: 'Đăng xuất' }).filter({ visible: true }).first().click();
    await page.waitForURL(/\/auth(\/|\?|$)/, { timeout: 30_000 });

    // A protected page must not be reachable after logout.
    await page.goto('/student');
    await page.waitForURL(/\/auth(\/|\?|$)/, { timeout: 30_000 });
  });
});
