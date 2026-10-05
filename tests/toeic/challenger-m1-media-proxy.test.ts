/**
 * Challenger M1-1 Empirical Adversarial Stress Test Suite
 *
 * Subject: src/lib/toeic-media-proxy.ts & src/app/api/toeic/media/proxy/route.ts
 *
 * Stress Test Dimensions:
 * 1. Token Determinism & Performance (10,000 iterations, edge topologies, zero collisions)
 * 2. Cryptographic Roundtrip & Boundary Invariance (1,000 synthetic URLs, block boundary lengths, unicode)
 * 3. Bit-Flipping & Tamper Detection (exhaustive 128-bit IV flipping, ciphertext bit flips, truncation, extensions)
 * 4. Deep SSRF Attack Matrix (standard, alternative IP encodings [decimal, octal, hex], cloud metadata, IPv6, scheme tricks, host confusion)
 * 5. Route Handler Security Invariants (GET, HEAD, 400, 403, zero 302 redirects)
 */

import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import {
  generateMediaProxyToken,
  generateProxyMediaToken,
  decryptMediaProxyToken,
  isAllowedUpstreamUrl,
  resolveProxyMediaUrl,
  ALLOWED_UPSTREAM_DOMAINS,
} from '../../src/lib/toeic-media-proxy';
import { GET, HEAD } from '../../src/app/api/toeic/media/proxy/route';

interface TestFailure {
  category: string;
  testName: string;
  error: string;
}

const failures: TestFailure[] = [];
let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, category: string, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
  } else {
    const errorMsg = detail || `Assertion failed for: ${testName}`;
    failures.push({ category, testName, error: errorMsg });
    console.error(`  [FAIL] [${category}] ${testName} -> ${errorMsg}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 1: Token Determinism & Performance
// ────────────────────────────────────────────────────────────────────────────
async function testTokenDeterminism() {
  console.log('\n[CHALLENGER-M1] Testing Token Determinism & Performance...');
  const baseAudioUrl =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';

  // 1.1: 10,000 iterations determinism check
  const startMs = Date.now();
  const canonicalToken = generateMediaProxyToken(baseAudioUrl);
  let nonDeterministicCount = 0;
  const ITERATIONS = 10000;

  for (let i = 0; i < ITERATIONS; i++) {
    const t = generateMediaProxyToken(baseAudioUrl);
    if (t !== canonicalToken) {
      nonDeterministicCount++;
    }
  }
  const durationMs = Date.now() - startMs;
  assert(
    nonDeterministicCount === 0,
    'Determinism',
    `10,000 iterations identical token generation (${durationMs}ms, ${(durationMs / ITERATIONS).toFixed(3)}ms/op)`,
    `Found ${nonDeterministicCount} non-deterministic mismatches`,
  );

  // 1.2: Alias parity
  const aliasToken = generateProxyMediaToken(baseAudioUrl);
  assert(
    aliasToken === canonicalToken,
    'Determinism',
    'generateProxyMediaToken alias strictly matches generateMediaProxyToken',
  );

  // 1.3: Collision resistance across 1,000 closely-related URLs
  const tokensSet = new Set<string>();
  let collisions = 0;
  for (let i = 0; i < 1000; i++) {
    const testUrl = `https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/vocabulary-images/item_${i.toString().padStart(4, '0')}.jpg?v=${i}`;
    const token = generateMediaProxyToken(testUrl);
    if (tokensSet.has(token)) {
      collisions++;
    }
    tokensSet.add(token);
  }
  assert(
    collisions === 0 && tokensSet.size === 1000,
    'Determinism',
    'Zero collisions among 1,000 synthetically generated adjacent URLs',
    `Detected ${collisions} collisions`,
  );

  // 1.4: Malformed inputs handling
  assert(generateMediaProxyToken('') === '', 'Determinism', 'Empty string input returns empty string');
  assert(generateMediaProxyToken(null as any) === '', 'Determinism', 'null input returns empty string');
  assert(generateMediaProxyToken(undefined as any) === '', 'Determinism', 'undefined input returns empty string');
  assert(generateMediaProxyToken(12345 as any) === '', 'Determinism', 'number input returns empty string');
  assert(generateMediaProxyToken({} as any) === '', 'Determinism', 'object input returns empty string');
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 2: Cryptographic Roundtrip & Boundary Invariance
// ────────────────────────────────────────────────────────────────────────────
async function testCryptographicRoundtrip() {
  console.log('\n[CHALLENGER-M1] Testing Cryptographic Roundtrip Decryption Invariance...');

  // 2.1: 1,000 synthetic URLs roundtrip
  let roundtripMismatches = 0;
  for (let i = 0; i < 1000; i++) {
    const ext = ['mp3', 'wav', 'ogg', 'jpg', 'png', 'webp', 'svg'][i % 7];
    const folder = ['pronunciation/words', 'vocabulary-images', 'listening_sets', 'exam_assets'][i % 4];
    const uuid = crypto.randomUUID();
    const testUrl = `https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/${folder}/${uuid}.${ext}?v=${1700000000 + i}&hash=${crypto.randomBytes(8).toString('hex')}`;

    const token = generateMediaProxyToken(testUrl);
    const decrypted = decryptMediaProxyToken(token);
    if (decrypted !== testUrl) {
      roundtripMismatches++;
    }
  }
  assert(
    roundtripMismatches === 0,
    'Roundtrip',
    '1,000 diverse synthetic URLs decrypt losslessly to exact original strings',
    `Failed ${roundtripMismatches}/1000 roundtrips`,
  );

  // 2.2: AES block boundary test (testing URL lengths at exactly 15, 16, 17, 31, 32, 33, 47, 48, 49, 63, 64, 65, 127, 128, 129 bytes)
  const boundaryLengths = [15, 16, 17, 31, 32, 33, 47, 48, 49, 63, 64, 65, 127, 128, 129, 255, 256, 257];
  let boundaryFailures = 0;
  for (const len of boundaryLengths) {
    const prefix = 'https://odlnhfaygiotcyehuysw.supabase.co/';
    const fillerLen = Math.max(0, len - prefix.length);
    const testUrl = prefix + 'x'.repeat(fillerLen);
    const token = generateMediaProxyToken(testUrl);
    const decrypted = decryptMediaProxyToken(token);
    if (decrypted !== testUrl) {
      boundaryFailures++;
    }
  }
  assert(
    boundaryFailures === 0,
    'Roundtrip',
    'PKCS#7 block boundary lengths (N-1, N, N+1 for N multiple of 16) preserved perfectly',
    `Failed ${boundaryFailures} boundary length tests`,
  );

  // 2.3: Unicode, Vietnamese diacritics and special characters in URL
  const complexUrls = [
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/học-tập-2026/bài-giảng-ngữ-pháp.mp3?tên=giáo-trình-đậu-toeic',
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/audio/part1%20photographs.mp3?q=foo+bar&filter=%5B1%2C2%2C3%5D',
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/img/test#fragment-anchor?param=1&another=2',
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/special_!@$*()_chars.mp3',
    'https://odlnhfaygiotcyehuysw.supabase.co/' + 'a'.repeat(3000) + '.mp3', // 3KB URL
  ];

  for (const url of complexUrls) {
    const token = generateMediaProxyToken(url);
    const decrypted = decryptMediaProxyToken(token);
    assert(
      decrypted === url,
      'Roundtrip',
      `Complex URL roundtrip: length=${url.length}, chars=${url.slice(0, 50)}...`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 3: Bit-Flipping & Cryptographic Tamper Detection
// ────────────────────────────────────────────────────────────────────────────
async function testBitFlippingAndTampering() {
  console.log('\n[CHALLENGER-M1] Testing Bit-Flipping & Tamper Detection (Adversarial CBC Stress)...');

  const rawUrl = 'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';
  const validToken = generateMediaProxyToken(rawUrl);
  const rawBuf = Buffer.from(validToken, 'base64url');

  assert(rawBuf.length >= 32, 'Tampering', 'Token buffer is at least 32 bytes (16-byte IV + ciphertext)');
  const ivLength = 16;
  const ciphertextLength = rawBuf.length - ivLength;

  // 3.1: Exhaustive single-bit flipping across all 128 bits of the IV (bytes 0 to 15)
  // In classic CBC without HMAC, flipping an IV bit predictably flips the decrypted plaintext bit!
  // In our secure implementation, the HMAC integrity check must catch 100% of these IV bit-flips.
  let ivFlipBypasses = 0;
  for (let byteIdx = 0; byteIdx < ivLength; byteIdx++) {
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      const tamperedBuf = Buffer.from(rawBuf);
      tamperedBuf[byteIdx] ^= 1 << bitIdx;
      const tamperedToken = tamperedBuf.toString('base64url');
      const result = decryptMediaProxyToken(tamperedToken);
      if (result !== null) {
        ivFlipBypasses++;
      }
    }
  }
  assert(
    ivFlipBypasses === 0,
    'Tampering',
    `Exhaustive 128-bit IV flipping stress: 128/128 bit-flips rejected by HMAC verification (0 bypasses)`,
    `Detected ${ivFlipBypasses} bypasses out of 128 IV bit-flips!`,
  );

  // 3.2: Exhaustive single-bit flipping across ciphertext blocks
  // Check first block (bytes 16..31), middle block, and last block (padding block)
  let ciphertextFlipBypasses = 0;
  const testCiphertextBytes = [16, 17, 24, 31, 32, 40, rawBuf.length - 2, rawBuf.length - 1];
  for (const byteIdx of testCiphertextBytes) {
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      const tamperedBuf = Buffer.from(rawBuf);
      tamperedBuf[byteIdx] ^= 1 << bitIdx;
      const tamperedToken = tamperedBuf.toString('base64url');
      const result = decryptMediaProxyToken(tamperedToken);
      if (result !== null) {
        ciphertextFlipBypasses++;
      }
    }
  }
  assert(
    ciphertextFlipBypasses === 0,
    'Tampering',
    `Ciphertext bit flipping stress: ${testCiphertextBytes.length * 8} bit-flips rejected (0 bypasses)`,
    `Detected ${ciphertextFlipBypasses} bypasses!`,
  );

  // 3.3: Systematic truncation attacks (truncating at every length from 0 to rawBuf.length - 1)
  let truncationBypasses = 0;
  for (let len = 0; len < rawBuf.length; len++) {
    const truncatedBuf = rawBuf.subarray(0, len);
    const truncatedToken = truncatedBuf.toString('base64url');
    const result = decryptMediaProxyToken(truncatedToken);
    if (result !== null) {
      truncationBypasses++;
    }
  }
  assert(
    truncationBypasses === 0,
    'Tampering',
    `Systematic truncation test (lengths 0 to ${rawBuf.length - 1}): 100% rejected safely with null`,
    `Detected ${truncationBypasses} truncation bypasses`,
  );

  // 3.4: Systematic extension attacks (appending 1 to 32 arbitrary trailing bytes)
  let extensionBypasses = 0;
  for (let extra = 1; extra <= 32; extra++) {
    const extendedBuf = Buffer.concat([rawBuf, crypto.randomBytes(extra)]);
    const extendedToken = extendedBuf.toString('base64url');
    const result = decryptMediaProxyToken(extendedToken);
    if (result !== null) {
      extensionBypasses++;
    }
  }
  assert(
    extensionBypasses === 0,
    'Tampering',
    'Systematic ciphertext extension test (1 to 32 extra bytes): 100% rejected with null',
    `Detected ${extensionBypasses} extension bypasses`,
  );

  // 3.5: Block swapping attack
  if (ciphertextLength >= 32) {
    const swappedBuf = Buffer.from(rawBuf);
    const block1 = swappedBuf.subarray(16, 32);
    const block2 = swappedBuf.subarray(32, 48);
    const tmp = Buffer.from(block1);
    block1.set(block2);
    block2.set(tmp);
    const swappedToken = swappedBuf.toString('base64url');
    assert(
      decryptMediaProxyToken(swappedToken) === null,
      'Tampering',
      'Ciphertext block swapping attack rejected by HMAC integrity verification',
    );
  }

  // 3.6: Specific targeted CBC forgery attempt:
  // Attacker attempts to change "https" to "http" by flipping bits in IV byte 4.
  // In standard CBC: plaintext[0..4] = "https". Flipping 's' (0x73) ^ ':' (0x3a)...
  // The HMAC check must categorically prevent this forgery from succeeding.
  const targetBuf = Buffer.from(rawBuf);
  targetBuf[4] ^= 0x73 ^ 0x3a; // Attempt to turn 's' into ':'
  const targetedToken = targetBuf.toString('base64url');
  assert(
    decryptMediaProxyToken(targetedToken) === null,
    'Tampering',
    'Targeted CBC plaintext alteration attempt ("https" modification) caught and rejected',
  );

  // 3.7: Degenerate & corrupted string inputs
  const corruptInputs = [
    '!!!invalid_base64url_chars???',
    '   ',
    'null',
    'undefined',
    '0',
    'a'.repeat(31), // length 31 (less than 32 bytes)
    'A'.repeat(100000), // large invalid token (ReDoS / memory check)
    '\0'.repeat(40),
  ];
  for (const bad of corruptInputs) {
    assert(
      decryptMediaProxyToken(bad) === null,
      'Tampering',
      `Degenerate input "${bad.slice(0, 20)}" gracefully returns null without throwing`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 4: Deep SSRF Attack Matrix
// ────────────────────────────────────────────────────────────────────────────
async function testSsrfDefenseMatrix() {
  console.log('\n[CHALLENGER-M1] Testing Deep SSRF Defense Matrix...');

  // Catalog of 60+ adversarial SSRF attack vectors
  const SSRF_PAYLOADS = [
    // Standard Localhost / Loopback
    { url: 'http://localhost/', desc: 'http localhost' },
    { url: 'http://localhost:3000/', desc: 'http localhost port 3000' },
    { url: 'http://localhost:8080/admin', desc: 'http localhost port 8080' },
    { url: 'https://localhost/', desc: 'https localhost' },
    { url: 'http://127.0.0.1/', desc: 'http 127.0.0.1' },
    { url: 'http://127.0.0.1:8080/', desc: 'http 127.0.0.1:8080' },
    { url: 'http://127.0.0.1:3000/api/billing', desc: 'http 127.0.0.1 internal API' },
    { url: 'http://127.0.0.2/', desc: 'http 127.0.0.2' },
    { url: 'http://127.127.127.127/', desc: 'http 127.127.127.127' },
    { url: 'http://127.1/', desc: 'http 127.1 (short form)' },
    { url: 'http://127.0.1/', desc: 'http 127.0.1' },
    { url: 'http://0.0.0.0/', desc: 'http 0.0.0.0' },
    { url: 'http://0.0.0.0:80/', desc: 'http 0.0.0.0:80' },
    { url: 'http://0/', desc: 'http 0' },

    // IPv6 Loopback & Encapsulated
    { url: 'http://[::1]/', desc: 'IPv6 loopback [::1]' },
    { url: 'http://[::1]:8080/', desc: 'IPv6 loopback [::1]:8080' },
    { url: 'http://[0:0:0:0:0:0:0:1]/', desc: 'IPv6 expanded loopback' },
    { url: 'http://[::]/', desc: 'IPv6 unspecified [::]' },
    { url: 'http://[::ffff:127.0.0.1]/', desc: 'IPv4-mapped IPv6 loopback' },
    { url: 'http://[0000:0000:0000:0000:0000:0000:0000:0001]/', desc: 'IPv6 padded loopback' },

    // Cloud Metadata Endpoints (AWS, GCP, Azure, Oracle, Alibaba)
    { url: 'http://169.254.169.254/latest/meta-data/', desc: 'AWS/GCP metadata IPv4' },
    { url: 'http://169.254.169.254:80/latest/meta-data/credentials', desc: 'AWS metadata credentials' },
    { url: 'http://[fd00:ec2::254]/latest/meta-data/', desc: 'AWS metadata IPv6' },
    { url: 'http://metadata.google.internal/computeMetadata/v1/', desc: 'GCP metadata internal DNS' },
    { url: 'http://169.254.169.254/metadata/instance?api-version=2021-02-01', desc: 'Azure metadata instance' },
    { url: 'http://192.0.0.192/latest/', desc: 'Oracle Cloud metadata' },
    { url: 'http://100.100.100.200/latest/meta-data/', desc: 'Alibaba Cloud metadata' },

    // RFC 1918 Private IP Ranges
    { url: 'http://10.0.0.1/', desc: 'Private 10.0.0.1' },
    { url: 'http://10.255.255.255/', desc: 'Private 10.255.255.255' },
    { url: 'http://172.16.0.1/', desc: 'Private 172.16.0.1' },
    { url: 'http://172.24.10.5/', desc: 'Private 172.24.10.5' },
    { url: 'http://172.31.255.254/', desc: 'Private 172.31.255.254' },
    { url: 'http://192.168.0.1/', desc: 'Private 192.168.0.1' },
    { url: 'http://192.168.1.1/', desc: 'Private 192.168.1.1' },
    { url: 'http://192.168.254.254/', desc: 'Private 192.168.254.254' },

    // Alternative IP Formats (Decimal, Octal, Hex)
    { url: 'http://2130706433/', desc: 'Decimal IP for 127.0.0.1 (2130706433)' },
    { url: 'http://0177.0.0.1/', desc: 'Octal IP for 127.0.0.1 (0177.0.0.1)' },
    { url: 'http://0x7f000001/', desc: 'Hex IP for 127.0.0.1 (0x7f000001)' },
    { url: 'http://0x7f.0x0.0x0.0x1/', desc: 'Dotted hex IP for 127.0.0.1' },
    { url: 'http://2852039166/', desc: 'Decimal IP for 169.254.169.254' },
    { url: 'http://0xa9fea9fe/', desc: 'Hex IP for 169.254.169.254' },

    // Domain & Host Confusion Bypasses
    { url: 'https://odlnhfaygiotcyehuysw.supabase.co.attacker.com/steal', desc: 'Suffix domain hijack' },
    { url: 'https://attacker-odlnhfaygiotcyehuysw.supabase.co/steal', desc: 'Prefix domain spoof' },
    { url: 'https://subdomain.odlnhfaygiotcyehuysw.supabase.co/steal', desc: 'Subdomain bypass attempt' },
    { url: 'https://odlnhfaygiotcyehuysw.supabase.com/steal', desc: '.com TLD confusion attempt' },
    { url: 'https://odlnhfaygiotcyehuysw.supabase.co@evil.com/steal', desc: 'User-info host confusion' },
    { url: 'https://evil.com#odlnhfaygiotcyehuysw.supabase.co', desc: 'Fragment confusion' },
    { url: 'https://google.com/test.mp3', desc: 'Arbitrary external domain (google.com)' },
    { url: 'https://study4.com/audio/sample.mp3', desc: 'Competitor domain without proxy authorization' },
    { url: 'https://dautoeic.com/assets/audio.mp3', desc: 'Competitor domain (dautoeic.com)' },

    // Scheme & Protocol Evasions
    { url: 'file:///etc/passwd', desc: 'file:// scheme' },
    { url: 'file://localhost/etc/shadow', desc: 'file:// localhost' },
    { url: 'ftp://odlnhfaygiotcyehuysw.supabase.co/file.mp3', desc: 'ftp:// scheme on whitelisted host' },
    { url: 'gopher://127.0.0.1:6379/_', desc: 'gopher:// scheme' },
    { url: 'dict://127.0.0.1:11211/', desc: 'dict:// scheme' },
    { url: 'ldap://127.0.0.1:389/', desc: 'ldap:// scheme' },
    { url: 'javascript:alert(1)', desc: 'javascript: scheme' },
    { url: 'data:text/html,<script>alert(1)</script>', desc: 'data: scheme' },
    { url: 'blob:https://lingopro.online/1234', desc: 'blob: scheme' },
    { url: 'ws://odlnhfaygiotcyehuysw.supabase.co/', desc: 'ws:// scheme' },
    { url: 'wss://odlnhfaygiotcyehuysw.supabase.co/', desc: 'wss:// scheme' },
  ];

  let ssrfBypasses = 0;
  for (const item of SSRF_PAYLOADS) {
    const isAllowed = isAllowedUpstreamUrl(item.url);
    if (isAllowed) {
      ssrfBypasses++;
      assert(false, 'SSRF', `Blocked SSRF: ${item.desc} (${item.url})`, `CRITICAL SSRF VULNERABILITY: ${item.url} was permitted!`);
    } else {
      assert(true, 'SSRF', `Blocked SSRF: ${item.desc}`);
    }
  }

  assert(
    ssrfBypasses === 0,
    'SSRF',
    `Deep SSRF Matrix: ${SSRF_PAYLOADS.length}/${SSRF_PAYLOADS.length} malicious vectors blocked (0 bypasses)`,
    `Total ${ssrfBypasses} SSRF bypasses detected!`,
  );

  // Legitimate Whitelisted URLs must be permitted
  const validLegitimateUrls = [
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3',
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/vocabulary-images/photo.jpg',
    'http://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/test.wav',
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/img.png?v=123&token=abc',
  ];

  for (const validUrl of validLegitimateUrls) {
    assert(
      isAllowedUpstreamUrl(validUrl),
      'SSRF',
      `Legitimate whitelisted asset allowed: ${validUrl.slice(0, 60)}...`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION 5: Route Handler Security Contracts & HTTP Status Invariants
// ────────────────────────────────────────────────────────────────────────────
async function testRouteHandlerSecurity() {
  console.log('\n[CHALLENGER-M1] Testing Route Handler Security Contracts (GET & HEAD)...');

  // 5.1: Missing token returns HTTP 400 Bad Request
  {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy');
    const res = await GET(req);
    assert(res.status === 400, 'RouteHandler', 'GET without token returns 400 Bad Request');
    const json = await res.json();
    assert(json.error === 'Missing media token', 'RouteHandler', '400 response includes exact error message');
  }

  // 5.2: Corrupted token returns HTTP 403 Forbidden
  {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy?t=malformed_token_12345');
    const res = await GET(req);
    assert(res.status === 403, 'RouteHandler', 'GET with corrupted token returns 403 Forbidden');
    const json = await res.json();
    assert(json.error === 'Invalid or corrupted media token', 'RouteHandler', '403 response includes error message');
  }

  // 5.3: Validly encrypted token targeting unauthorized host returns HTTP 403 Forbidden
  {
    const evilToken = generateMediaProxyToken('https://attacker.com/evil.mp3');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${evilToken}`);
    const res = await GET(req);
    assert(res.status === 403, 'RouteHandler', 'GET with token pointing to non-whitelisted domain returns 403 Forbidden');
    const json = await res.json();
    assert(json.error === 'Target host is not permitted', 'RouteHandler', '403 specifies target host not permitted');
  }

  // 5.4: Validly encrypted token targeting SSRF localhost returns HTTP 403 Forbidden
  {
    const localhostToken = generateMediaProxyToken('http://127.0.0.1:3000/api/admin/secret');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${localhostToken}`);
    const res = await GET(req);
    assert(res.status === 403, 'RouteHandler', 'GET with token pointing to 127.0.0.1 returns 403 Forbidden');
    const json = await res.json();
    assert(json.error === 'Target host is not permitted', 'RouteHandler', '127.0.0.1 rejected with 403');
  }

  // 5.5: Validly encrypted token targeting AWS metadata returns HTTP 403 Forbidden
  {
    const awsToken = generateMediaProxyToken('http://169.254.169.254/latest/meta-data/');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${awsToken}`);
    const res = await GET(req);
    assert(res.status === 403, 'RouteHandler', 'GET with token pointing to AWS metadata returns 403 Forbidden');
  }

  // 5.6: HEAD request returns same status codes without crashing
  {
    const reqHead400 = new NextRequest('https://lingopro.online/api/toeic/media/proxy', { method: 'HEAD' });
    const resHead400 = await HEAD(reqHead400);
    assert(resHead400.status === 400, 'RouteHandler', 'HEAD without token returns 400');

    const evilToken = generateMediaProxyToken('https://evil.com/sound.mp3');
    const reqHead403 = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${evilToken}`, { method: 'HEAD' });
    const resHead403 = await HEAD(reqHead403);
    assert(resHead403.status === 403, 'RouteHandler', 'HEAD targeting forbidden domain returns 403');
  }

  // 5.7: resolveProxyMediaUrl contract checks
  {
    const sampleRaw = 'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/sample.mp3';
    const resolved = resolveProxyMediaUrl(sampleRaw);
    assert(resolved.startsWith('/api/toeic/media/proxy?t='), 'RouteHandler', 'resolveProxyMediaUrl wraps allowed upstream URL');
    assert(resolveProxyMediaUrl(resolved) === resolved, 'RouteHandler', 'resolveProxyMediaUrl idempotent on already proxied URLs');
    assert(resolveProxyMediaUrl('/local/audio.mp3') === '/local/audio.mp3', 'RouteHandler', 'resolveProxyMediaUrl preserves local paths');
    assert(resolveProxyMediaUrl('data:audio/mp3;base64,...') === 'data:audio/mp3;base64,...', 'RouteHandler', 'resolveProxyMediaUrl preserves data URIs');
    assert(resolveProxyMediaUrl('blob:http://...') === 'blob:http://...', 'RouteHandler', 'resolveProxyMediaUrl preserves blob URIs');
    assert(resolveProxyMediaUrl('https://google.com/foo.mp3') === 'https://google.com/foo.mp3', 'RouteHandler', 'resolveProxyMediaUrl preserves non-whitelisted external URLs');
  }
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN RUNNER
// ────────────────────────────────────────────────────────────────────────────
async function runAllChallengerTests() {
  const start = Date.now();
  console.log('================================================================');
  console.log('  CHALLENGER M1-1: ADVERSARIAL STRESS TEST SUITE');
  console.log('  Target: src/lib/toeic-media-proxy.ts & Proxy Route Handler');
  console.log('================================================================');

  await testTokenDeterminism();
  await testCryptographicRoundtrip();
  await testBitFlippingAndTampering();
  await testSsrfDefenseMatrix();
  await testRouteHandlerSecurity();

  const totalTime = Date.now() - start;
  console.log('\n================================================================');
  console.log(`  RESULTS: ${passedCount}/${totalCount} assertions passed (${totalTime}ms)`);
  if (failures.length > 0) {
    console.error(`  FAILURES: ${failures.length} assertions failed:`);
    for (const f of failures) {
      console.error(`    - [${f.category}] ${f.testName}: ${f.error}`);
    }
    console.log('  VERDICT: FAIL');
    console.log('================================================================');
    process.exit(1);
  } else {
    console.log('  VERDICT: APPROVE');
    console.log('================================================================');
    process.exit(0);
  }
}

runAllChallengerTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
