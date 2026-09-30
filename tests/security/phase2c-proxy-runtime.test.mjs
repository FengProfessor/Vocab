// Production Next HTTP server with Cloudflare-style headers; no real credentials/database.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';

const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'ignore',
});
const headers = { Host: 'lingopro.online', Origin: 'https://lingopro.online', 'X-Forwarded-Host': 'lingopro.online',
  'X-Forwarded-Proto': 'https', 'X-LingoPro-Request': '1', 'Sec-Fetch-Site': 'same-origin' };
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('[ProxyTest] Next exited before readiness');
    try { if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Wait for local server. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert(ready);
  assert.equal((await fetch(`${base}/api/auth/session`, { headers })).status, 401);
  assert.equal((await fetch(`${base}/api/auth/session`, { headers: { ...headers, Host: 'www.lingopro.online', Origin: 'https://www.lingopro.online' } })).status, 401);
  for (const changed of [{ Host: 'evil.example' }, { Origin: 'https://evil.example' }, { 'X-LingoPro-Request': '' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'X-Forwarded-Proto': 'http' }]) {
    assert.equal((await fetch(`${base}/api/auth/session`, { headers: { ...headers, ...changed } })).status, 403);
  }
  const withoutOrigin = { ...headers }; delete withoutOrigin.Origin;
  assert.equal((await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: withoutOrigin })).status, 403);
  assert.equal((await fetch(`${base}/api/auth/logout`, { method: 'POST', headers })).status, 200);
  console.log('[P2C] Real Next proxy HTTP: valid public Host/anonymous401, wrong Host/Origin/proof/site/HTTP403, logout CSRF PASS');
} finally {
  if (server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
}
