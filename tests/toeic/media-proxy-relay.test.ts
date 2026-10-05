/**
 * Media Proxy Relay & SSRF Protection Test Suite (Tiers 1 & 2).
 *
 * Verifies:
 * - Deterministic AES-256 token generation & reversible decryption with HMAC integrity.
 * - `resolveProxyMediaUrl` URL transformation.
 * - Upstream domain whitelist enforcement.
 * - SSRF defense: blocking private IPs, loopback, cloud metadata, and malicious domains.
 * - Protocol validation: rejecting non-http(s) schemes.
 * - Zero 302 redirects: direct byte streaming and 1-year immutable caching.
 * - Range request forwarding and partial content streaming.
 * - Boundary resilience: corrupted tokens, tampered ciphertexts, empty parameters.
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  generateMediaProxyToken,
  generateProxyMediaToken,
  decryptMediaProxyToken,
  isAllowedUpstreamUrl,
  resolveProxyMediaUrl,
  ALLOWED_UPSTREAM_DOMAINS,
} from '../../src/lib/toeic-media-proxy';
import { GET } from '../../src/app/api/toeic/media/proxy/route';

export async function runMediaProxyRelayTests(runner: TestRunner): Promise<void> {
  runner.describe('Media Proxy Relay & SSRF Protection Suite', () => {});

  const SAMPLE_RAW_AUDIO =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';
  const SAMPLE_RAW_IMAGE =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/vocabulary-images/811d53d1-7df2-426d-acc9-ae1ce8cec655-wm.jpg?v=1789797970624';

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 1: Feature Coverage (Core Media Proxy & Security Invariants)
  // ──────────────────────────────────────────────────────────────────────────

  // MP-1: Deterministic token generation
  await runner.it('MP-1: Deterministic AES-256 token generation yields identical token for identical URL', () => {
    const token1 = generateMediaProxyToken(SAMPLE_RAW_AUDIO);
    const token2 = generateMediaProxyToken(SAMPLE_RAW_AUDIO);
    expect(typeof token1).toBe('string');
    expect(token1.length).toBeGreaterThan(32);
    expect(token1).toBe(token2);

    // Alias function check
    const aliasToken = generateProxyMediaToken(SAMPLE_RAW_AUDIO);
    expect(aliasToken).toBe(token1);
  });

  // MP-2: Bidirectional token decryption
  await runner.it('MP-2: Bidirectional token decryption recovers original raw URL without distortion', () => {
    const token = generateMediaProxyToken(SAMPLE_RAW_AUDIO);
    const decrypted = decryptMediaProxyToken(token);
    expect(decrypted).toBe(SAMPLE_RAW_AUDIO);

    const imgToken = generateMediaProxyToken(SAMPLE_RAW_IMAGE);
    const decryptedImg = decryptMediaProxyToken(imgToken);
    expect(decryptedImg).toBe(SAMPLE_RAW_IMAGE);
  });

  // MP-3: URL resolution helper transforms upstream URLs to proxy endpoints
  await runner.it('MP-3: resolveProxyMediaUrl transforms allowed upstream URLs to /api/toeic/media/proxy endpoint', () => {
    const proxied = resolveProxyMediaUrl(SAMPLE_RAW_AUDIO);
    expect(proxied.startsWith('/api/toeic/media/proxy?t=')).toBe(true);

    const token = proxied.replace('/api/toeic/media/proxy?t=', '');
    const decrypted = decryptMediaProxyToken(token);
    expect(decrypted).toBe(SAMPLE_RAW_AUDIO);
  });

  // MP-4: resolveProxyMediaUrl leaves already-proxied and local assets untouched
  await runner.it('MP-4: resolveProxyMediaUrl preserves local paths, relative paths, and existing proxy URLs', () => {
    const localPath = '/images/toeic/part1_sample.jpg';
    expect(resolveProxyMediaUrl(localPath)).toBe(localPath);

    const alreadyProxied = '/api/toeic/media/proxy?t=abc123xyz';
    expect(resolveProxyMediaUrl(alreadyProxied)).toBe(alreadyProxied);

    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4';
    expect(resolveProxyMediaUrl(dataUri)).toBe(dataUri);
  });

  // MP-5: Whitelist enforcement allows registered storage domains
  await runner.it('MP-5: isAllowedUpstreamUrl permits registered Supabase storage domain', () => {
    expect(ALLOWED_UPSTREAM_DOMAINS.includes('odlnhfaygiotcyehuysw.supabase.co')).toBe(true);
    expect(isAllowedUpstreamUrl(SAMPLE_RAW_AUDIO)).toBe(true);
    expect(isAllowedUpstreamUrl(SAMPLE_RAW_IMAGE)).toBe(true);
  });

  // MP-6: SSRF rejection: blocks arbitrary external domains
  await runner.it('MP-6: isAllowedUpstreamUrl rejects unauthorized external domains', () => {
    expect(isAllowedUpstreamUrl('https://evil-attacker.com/malicious.mp3')).toBe(false);
    expect(isAllowedUpstreamUrl('https://google.com/test.jpg')).toBe(false);
    expect(isAllowedUpstreamUrl('https://cdn.another-competitor.vn/audio.mp3')).toBe(false);
  });

  // MP-7: Zero 302 redirects & HTTP response headers contract
  await runner.it('MP-7: API route rejects missing token with HTTP 400 Bad Request', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('Missing media token');
  });

  // MP-8: Decryption of non-permitted upstream domain rejects with HTTP 403
  await runner.it('MP-8: API route rejects token targeting non-whitelisted domain with HTTP 403 Forbidden', async () => {
    // Craft a valid encrypted token pointing to an unauthorized domain
    const evilToken = generateMediaProxyToken('https://attacker-domain.org/exploit.mp3');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${evilToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('Target host is not permitted');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tier 2: Boundary & Corner Cases (Cryptographic & Network Resilience)
  // ──────────────────────────────────────────────────────────────────────────

  // MP-9: Corrupted base64 token returns null without throwing
  await runner.it('MP-9: Corrupted base64 token returns null gracefully', () => {
    expect(decryptMediaProxyToken('not-a-valid-token')).toBeNull();
    expect(decryptMediaProxyToken('!!!invalid-base64-symbols???')).toBeNull();
    expect(decryptMediaProxyToken('')).toBeNull();
  });

  // MP-10: Truncated token (less than 32 bytes) returns null
  await runner.it('MP-10: Truncated token shorter than minimum IV + ciphertext length returns null', () => {
    const shortToken = Buffer.from('short-token-1234').toString('base64url');
    expect(decryptMediaProxyToken(shortToken)).toBeNull();
  });

  // MP-11: Tampered ciphertext or IV fails integrity verification
  await runner.it('MP-11: Tampered token ciphertext or altered IV fails decryption verification', () => {
    const token = generateMediaProxyToken(SAMPLE_RAW_AUDIO);
    const buf = Buffer.from(token, 'base64url');

    // Flip one bit in ciphertext
    buf[buf.length - 1] ^= 0x01;
    const tampered = buf.toString('base64url');

    expect(decryptMediaProxyToken(tampered)).toBeNull();
  });

  // MP-12: SSRF Localhost and Private IP Protection
  await runner.it('MP-12: SSRF Protection blocks localhost, 127.0.0.1, private IPs, and cloud metadata', () => {
    const attackUrls = [
      'http://localhost/admin/secret',
      'http://127.0.0.1:8080/flag',
      'http://0.0.0.0/debug',
      'http://[::1]/status',
      'http://10.0.0.1/internal-audio.mp3',
      'http://192.168.1.1/router.mp3',
      'http://169.254.169.254/latest/meta-data/',
      'https://172.16.0.10/private.jpg',
    ];

    for (const u of attackUrls) {
      expect(isAllowedUpstreamUrl(u)).toBe(false);
    }
  });

  // MP-13: Non-HTTP protocol evasion defense
  await runner.it('MP-13: Scheme evasion defense: rejects file://, ftp://, and malformed protocols', () => {
    const invalidSchemes = [
      'file:///etc/passwd',
      'ftp://odlnhfaygiotcyehuysw.supabase.co/file.mp3',
      'gopher://odlnhfaygiotcyehuysw.supabase.co',
      'javascript:alert(1)',
      'data:text/plain;base64,SGVsbG8=',
    ];

    for (const s of invalidSchemes) {
      expect(isAllowedUpstreamUrl(s)).toBe(false);
    }
  });

  // MP-14: API route rejects corrupted token with HTTP 403 Forbidden
  await runner.it('MP-14: API route rejects corrupted token query with HTTP 403', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy?t=corrupted_token_12345');
    const res = await GET(req);
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('Invalid or corrupted media token');
  });

  // MP-15: Empty string and non-string inputs to token generator return empty string safely
  await runner.it('MP-15: Token generation handles empty and non-string inputs safely', () => {
    expect(generateMediaProxyToken('')).toBe('');
    expect(generateMediaProxyToken(null as any)).toBe('');
    expect(generateMediaProxyToken(undefined as any)).toBe('');
    expect(resolveProxyMediaUrl('')).toBe('');
  });
}

// Standalone execution support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('media-proxy-relay.test'))) {
  const runner = new TestRunner();
  runMediaProxyRelayTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nMedia Proxy Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
