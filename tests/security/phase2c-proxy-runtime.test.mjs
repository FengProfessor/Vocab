// Production Next HTTP server with Cloudflare-style headers; no real credentials/database.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import http from 'node:http';

const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1',
    UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '', AUTH_SESSION_ENCRYPTION_KEY: '' }, stdio: 'ignore',
});
const headers = { Host: 'lingopro.online', Origin: 'https://lingopro.online', 'X-Forwarded-Host': 'lingopro.online',
  'X-Forwarded-Proto': 'https', 'X-LingoPro-Request': '1', 'Sec-Fetch-Site': 'same-origin' };
// Node fetch có thể thay Host bằng loopback host; HTTP client giữ header proxy thật.
const status = (path, requestHeaders, method = 'GET') => new Promise((resolve, reject) => {
  const request = http.request({ hostname: '127.0.0.1', port, path, method, headers: requestHeaders }, response => {
    response.resume(); resolve(response.statusCode);
  });
  request.on('error', reject);
  request.setTimeout(10000, () => request.destroy(new Error('[ProxyTest] Request timeout')));
  request.end();
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('[ProxyTest] Next exited before readiness');
    try { if ((await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Wait for local server. */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert(ready);
  assert.equal(await status('/api/auth/session', headers), 401);
  assert.equal(await status('/api/auth/session', { ...headers, Host: 'www.lingopro.online', Origin: 'https://www.lingopro.online' }), 401);
  for (const changed of [{ Host: 'evil.example' }, { Origin: 'https://evil.example' }, { 'X-LingoPro-Request': '' }, { 'Sec-Fetch-Site': 'cross-site' }, { 'X-Forwarded-Proto': 'http' }]) {
    assert.equal(await status('/api/auth/session', { ...headers, ...changed }), 403);
  }
  const withoutOrigin = { ...headers }; delete withoutOrigin.Origin;
  assert.equal(await status('/api/auth/logout', withoutOrigin, 'POST'), 403);
  assert.equal(await status('/api/auth/logout', headers, 'POST'), 200);
  assert.equal(await status('/api/practice/pack-passage', headers),200,'public pack catalog remains public');
  const cookieHeaders = { ...headers, Cookie: '__Host-lingopro-session='+ 'N'.repeat(43) };
  for (const [path, method] of [['/api/practice/pack-passage','GET'],['/api/hub/presence','DELETE']]) {
    assert.equal(await status(path,{...cookieHeaders,Origin:'https://evil.example'},method),403,'real Next must preserve CSRF denial');
    assert.equal(await status(path,cookieHeaders,method),503,'missing vault config must fail closed before DB/side effects');
  }
  console.log('[P3A] Real Next HTTP: public pack200, pack/presence CSRF403 and vault-missing503 PASS');
  console.log('[P2C] Real Next proxy HTTP: valid public Host/anonymous401, wrong Host/Origin/proof/site/HTTP403, logout CSRF PASS');
} finally {
  if (server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
}
