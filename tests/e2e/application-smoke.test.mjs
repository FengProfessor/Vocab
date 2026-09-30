// Real Chromium + production Next.js + HTTP; external providers are blocked.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { once } from 'node:events';
import puppeteer from 'puppeteer';

const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' },
  stdio: 'ignore',
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('[E2E] Next server exited before readiness');
    try {
      const health = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (health.ok && (await health.json()).status === 'ok') { ready = true; break; }
    } catch { /* Chờ server thật khởi động, không gọi production. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert(ready, 'local production server must become healthy');
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    // Không gửi login/data/analytics tới provider thật từ smoke suite.
    if (url.startsWith(`${origin}/`) || url.startsWith('data:') || url.startsWith('blob:')) void request.continue();
    else void request.abort();
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.name));
  await page.evaluateOnNewDocument(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push(`${event.effectiveDirective}:${event.blockedURI}`);
    });
  });
  for (const route of ['/', '/auth', '/grammar']) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle0' });
    assert.equal(response.status(), 200, `${route}: HTTP 200`);
    assert(!response.headers()['content-security-policy'].includes("'unsafe-eval'"));
    assert(await page.$('body'));
    if (route === '/auth') {
      await page.waitForSelector('#email');
      await page.type('#email', 'fixture@example.invalid');
      await page.type('#password', 'fixture-password');
      await page.click('button[aria-label="Hiện mật khẩu"]');
      assert.equal(await page.$eval('#password', (element) => element.type), 'text');
      await page.click('button[aria-label="Ẩn mật khẩu"]');
      assert.equal(await page.$eval('#password', (element) => element.type), 'password');
      assert.equal(await page.$eval('#email', (element) => element.value), 'fixture@example.invalid');
    }
    if (route === '/grammar') {
      await page.waitForSelector('input[type="text"]');
      await page.type('input[type="text"]', 'no-match-e2e-fixture');
      await page.waitForFunction(() => document.body.innerText.includes('Không tìm thấy chủ điểm phù hợp'));
      await page.reload({ waitUntil: 'networkidle0' });
      assert.equal(await page.$eval('input[type="text"]', (element) => element.value), '');
    }
    assert.deepEqual(await page.evaluate(() => window.__cspViolations), [], `${route}: unexpected CSP violation`);
  }
  assert.deepEqual(errors, [], 'no uncaught browser errors');
  console.log('[E2E] real Chromium/Next/HTTP: health, page hydration, auth controls, grammar filter/reload, CSP PASS');
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    const exited = once(server, 'exit');
    server.kill();
    await exited;
  }
}
