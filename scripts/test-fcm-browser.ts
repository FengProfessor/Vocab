/**
 * Headless Chrome test FCM token trên production.
 * Chạy: npx tsx scripts/test-fcm-browser.ts
 */
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

const URL = process.env.FCM_TEST_URL ?? 'https://lingopro.online/test-fcm';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe` : '',
].filter(Boolean);

function findChrome(): string {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!hit) throw new Error('Không tìm thấy Chrome. Set CHROME_PATH env.');
  return hit;
}

async function main(): Promise<void> {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? findChrome(),
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const failedRequests: string[] = [];
  page.on('requestfailed', (req) => {
    failedRequests.push(`FAIL ${req.failure()?.errorText ?? 'unknown'} ${req.url()}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`HTTP ${res.status()} ${res.url()}`);
  });

  const consoleLogs: string[] = [];
  page.on('console', (msg) => {
    const line = `[console.${msg.type()}] ${msg.text()}`;
    consoleLogs.push(line);
    console.log(line);
  });

  await page.setViewport({ width: 1280, height: 900 });
  const ctx = browser.defaultBrowserContext();
  await ctx.overridePermissions(URL, ['notifications']);

  console.log('[FCM-Test] Mở', URL);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Bấm nút lấy token
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some((b) => b.textContent?.includes('Lấy'));
  }, { timeout: 15000 });

  const buttons = await page.$$('button');
  let clicked = false;
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent ?? '', btn);
    if (text.includes('Lấy') && text.includes('Token')) {
      await btn.click();
      clicked = true;
      console.log('[FCM-Test] Đã bấm:', text.trim());
      break;
    }
  }
  if (!clicked) throw new Error('Không tìm thấy nút Lấy token');

  // Đợi log panel hoặc toast
  await new Promise((r) => setTimeout(r, 25000));

  const logPanel = await page.evaluate(() => {
    const pre = document.querySelector('div.font-mono');
    return pre?.textContent ?? '';
  });

  console.log('\n[FCM-Test] === UI LOG PANEL ===');
  console.log(logPanel || '(trống)');

  const swInfo = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { error: 'no SW support' };
    const regs = await navigator.serviceWorker.getRegistrations();
    return {
      permission: Notification.permission,
      registrations: regs.map((r) => ({
        scope: r.scope,
        script: r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? null,
        state: r.active?.state ?? r.installing?.state ?? r.waiting?.state ?? null,
      })),
    };
  });

  console.log('\n[FCM-Test] === SW STATE ===');
  console.log(JSON.stringify(swInfo, null, 2));

  const fcmErrors = consoleLogs.filter((l) =>
    /FCM|token-subscribe|authentication credential|Lỗi/i.test(l)
  );
  console.log('\n[FCM-Test] === FAILED HTTP ===');
  failedRequests.filter((l) => /googleapis|fcm|firebase/i.test(l)).forEach((l) => console.log(l));

  console.log('\n[FCM-Test] === FCM CONSOLE ===');
  fcmErrors.forEach((l) => console.log(l));

  const success = /THÀNH CÔNG|Token registered|Token đã được lưu/i.test(logPanel + consoleLogs.join('\n'));
  console.log(success ? '\n[FCM-Test] ✅ PASS' : '\n[FCM-Test] ❌ FAIL');

  await browser.close();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('[FCM-Test] Fatal:', err);
  process.exit(1);
});