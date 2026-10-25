/**
 * Challenger M1-2 Empirical Adversarial Test Harness
 *
 * Exhaustively stress-tests:
 * 1. HTTP 206 Partial Content & Range requests (audio scrubbing / seeking)
 * 2. Zero 302 Redirects invariant (streamed bytes, no browser redirection)
 * 3. Missing, corrupted, and tampered token resilience (cryptographic HMAC validation)
 * 4. Non-whitelisted target rejection & SSRF defense
 * 5. Zero-Bulk-Leak type exclusion & runtime leak verification
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { TestRunner, expect } from './test-harness';
import {
  generateMediaProxyToken,
  decryptMediaProxyToken,
  isAllowedUpstreamUrl,
  resolveProxyMediaUrl,
  ALLOWED_UPSTREAM_DOMAINS,
} from '../../src/lib/toeic-media-proxy';
import { GET, HEAD } from '../../src/app/api/toeic/media/proxy/route';
import {
  stripSensitiveToeicData,
  stripSensitiveClusterData,
} from '../../src/lib/toeic-test-loader';
import type {
  ToeicUnifiedQuestion,
  ToeicSanitizedQuestion,
  ToeicQuestionCluster,
} from '../../src/types/toeic';

export async function runChallengerEmpiricalTests(runner: TestRunner): Promise<void> {
  const ALLOWED_AUDIO_URL =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';
  const ALLOWED_IMAGE_URL =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/vocabulary-images/sample-photo.jpg';

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: Range Requests (HTTP 206 Partial Content) & Audio Scrubbing
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger Suite 1: Range Requests & HTTP 206 Partial Content', () => {});

  await runner.it('RNG-1: Range request bytes=0-499 returns HTTP 206 with Content-Range and partial body', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const mockAudioBytes = Buffer.alloc(2000, 0x41); // 2000 'A's
    const originalFetch = globalThis.fetch;

    try {
      let forwardedRangeHeader: string | null = null;
      globalThis.fetch = async (url: any, init: any) => {
        forwardedRangeHeader = init?.headers?.['Range'] || null;
        const range = init?.headers?.['Range'];
        if (range === 'bytes=0-499') {
          return new Response(mockAudioBytes.subarray(0, 500), {
            status: 206,
            headers: {
              'content-type': 'audio/mpeg',
              'content-range': 'bytes 0-499/2000',
              'content-length': '500',
              'accept-ranges': 'bytes',
            },
          });
        }
        return new Response(mockAudioBytes, { status: 200 });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`, {
        headers: { Range: 'bytes=0-499' },
      });
      const res = await GET(req);

      expect(forwardedRangeHeader).toBe('bytes=0-499');
      expect(res.status).toBe(206);
      expect(res.headers.get('content-range')).toBe('bytes 0-499/2000');
      expect(res.headers.get('content-length')).toBe('500');
      expect(res.headers.get('accept-ranges')).toBe('bytes');
      expect(res.headers.get('content-type')).toBe('audio/mpeg');
      expect(res.headers.get('cache-control')).toContain('immutable');

      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(500);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await runner.it('RNG-2: Mid-stream Range request bytes=500-999 streams exact byte window', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const mockAudioBytes = Buffer.alloc(2000, 0x42);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async (url: any, init: any) => {
        return new Response(mockAudioBytes.subarray(500, 1000), {
          status: 206,
          headers: {
            'content-type': 'audio/mpeg',
            'content-range': 'bytes 500-999/2000',
            'content-length': '500',
            'accept-ranges': 'bytes',
          },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`, {
        headers: { Range: 'bytes=500-999' },
      });
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('content-range')).toBe('bytes 500-999/2000');
      expect(res.headers.get('content-length')).toBe('500');
      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(500);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await runner.it('RNG-3: Non-range request receives HTTP 200 OK with full payload and Accept-Ranges', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const mockAudioBytes = Buffer.alloc(2000, 0x43);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async (url: any, init: any) => {
        return new Response(mockAudioBytes, {
          status: 200,
          headers: {
            'content-type': 'audio/mpeg',
            'content-length': '2000',
            'accept-ranges': 'bytes',
          },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('accept-ranges')).toBe('bytes');
      expect(res.headers.get('content-length')).toBe('2000');
      const arrayBuffer = await res.arrayBuffer();
      expect(arrayBuffer.byteLength).toBe(2000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await runner.it('RNG-4: Upstream HTTP 416 Range Not Satisfiable is properly propagated to client', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async () => {
        return new Response(null, {
          status: 416,
          headers: { 'content-range': 'bytes */2000' },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`, {
        headers: { Range: 'bytes=99999-100000' },
      });
      const res = await GET(req);

      expect(res.status).toBe(416);
      const json = await res.json();
      expect(json.error).toContain('Upstream resource unavailable (416)');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: Zero 302 Redirects Invariant & Direct Streaming
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger Suite 2: Zero 302 Redirects Invariant', () => {});

  await runner.it('RED-1: Proxy NEVER issues HTTP 301, 302, 307, or 308 redirect to client', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      // Simulate upstream with redirect flag follow
      globalThis.fetch = async (url: any, init: any) => {
        expect(init?.redirect).toBe('follow');
        return new Response(Buffer.from('mp3-binary-stream'), {
          status: 200,
          headers: { 'content-type': 'audio/mpeg' },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      const redirectStatuses = [301, 302, 303, 307, 308];
      expect(redirectStatuses.includes(res.status)).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await runner.it('RED-2: HEAD requests return HTTP 200 with headers but zero body', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async (url: any, init: any) => {
        expect(init?.method).toBe('HEAD');
        return new Response(null, {
          status: 200,
          headers: {
            'content-type': 'audio/mpeg',
            'content-length': '2048',
            'accept-ranges': 'bytes',
          },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`, {
        method: 'HEAD',
      });
      const res = await HEAD(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('audio/mpeg');
      expect(res.headers.get('content-length')).toBe('2048');
      expect(res.headers.get('accept-ranges')).toBe('bytes');
      const text = await res.text();
      expect(text).toBe('');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await runner.it('RED-3: Upstream storage bucket URL is never leaked in headers', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async () => {
        return new Response(Buffer.from('binary-content'), {
          status: 200,
          headers: {
            'content-type': 'audio/mpeg',
            'x-upstream-origin': 'odlnhfaygiotcyehuysw.supabase.co',
          },
        });
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`);
      const res = await GET(req);

      // Verify no response header leaks the upstream host
      const allHeaders = Array.from(res.headers.entries());
      for (const [key, val] of allHeaders) {
        expect(val.includes('odlnhfaygiotcyehuysw')).toBe(false);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: Missing, Malformed, and Tampered Token Resilience
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger Suite 3: Token Attack & Tampering Scenarios', () => {});

  await runner.it('TOK-1: Missing token parameter returns HTTP 400 Bad Request', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing media token');
  });

  await runner.it('TOK-2: Empty token parameter returns HTTP 400 Bad Request', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy?t=');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing media token');
  });

  await runner.it('TOK-3: Corrupted non-base64 token returns HTTP 403 Forbidden', async () => {
    const req = new NextRequest('https://lingopro.online/api/toeic/media/proxy?t=not-valid-base64!@#$');
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid or corrupted media token');
  });

  await runner.it('TOK-4: Truncated token (<32 bytes base64url) returns HTTP 403 Forbidden', async () => {
    const shortToken = Buffer.from('too-short').toString('base64url');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${shortToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid or corrupted media token');
  });

  await runner.it('TOK-5: Tampered IV in token triggers HMAC failure and returns HTTP 403 Forbidden', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const buf = Buffer.from(validToken, 'base64url');
    // Alter IV first byte
    buf[0] ^= 0xff;
    const tamperedToken = buf.toString('base64url');

    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${tamperedToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid or corrupted media token');
  });

  await runner.it('TOK-6: Tampered Ciphertext triggers HMAC mismatch and returns HTTP 403 Forbidden', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const buf = Buffer.from(validToken, 'base64url');
    // Alter ciphertext last byte
    buf[buf.length - 1] ^= 0x01;
    const tamperedToken = buf.toString('base64url');

    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${tamperedToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid or corrupted media token');
  });

  await runner.it('TOK-7: Token forged with different AES secret is rejected with HTTP 403', async () => {
    // Generate token with attacker key
    const attackerKey = crypto.createHash('sha256').update('attacker-secret-key-666').digest();
    const iv = crypto.createHmac('sha256', attackerKey).update(ALLOWED_AUDIO_URL).digest().subarray(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', attackerKey, iv);
    const encrypted = Buffer.concat([cipher.update(ALLOWED_AUDIO_URL, 'utf8'), cipher.final()]);
    const forgedToken = Buffer.concat([iv, encrypted]).toString('base64url');

    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${forgedToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid or corrupted media token');
  });

  await runner.it('TOK-8: Massive 64KB token payload returns HTTP 403 without denial of service', async () => {
    const massiveToken = 'A'.repeat(65536);
    const start = Date.now();
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${massiveToken}`);
    const res = await GET(req);
    const duration = Date.now() - start;

    expect(res.status).toBe(403);
    expect(duration).toBeLessThan(200); // Must resolve rapidly
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: SSRF Defense & Non-Whitelisted Target Rejection
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger Suite 4: SSRF Defense & Domain Whitelist', () => {});

  await runner.it('SRF-1: External arbitrary target rejected with HTTP 403 Forbidden', async () => {
    const evilToken = generateMediaProxyToken('https://attacker-site.com/exploit.mp3');
    const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${evilToken}`);
    const res = await GET(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Target host is not permitted');
  });

  await runner.it('SRF-2: Localhost loopback addresses blocked (127.0.0.1, ::1, 0.0.0.0)', () => {
    const loopbacks = [
      'http://127.0.0.1:3000/api/admin',
      'http://localhost/secret',
      'http://0.0.0.0:8080/data',
      'http://[::1]:5432/db',
    ];
    for (const url of loopbacks) {
      expect(isAllowedUpstreamUrl(url)).toBe(false);
      const token = generateMediaProxyToken(url);
      expect(decryptMediaProxyToken(token)).toBe(url); // Decrypts but SSRF check must reject
    }
  });

  await runner.it('SRF-3: Cloud metadata and internal private IPs blocked', () => {
    const privateTargets = [
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.1/admin',
      'http://172.16.0.5/api',
      'http://192.168.1.1/gateway',
    ];
    for (const url of privateTargets) {
      expect(isAllowedUpstreamUrl(url)).toBe(false);
    }
  });

  await runner.it('SRF-4: Subdomain evasion and suffix attacks blocked', () => {
    const evasionUrls = [
      'https://odlnhfaygiotcyehuysw.supabase.co.attacker.org/file.mp3',
      'https://fake-odlnhfaygiotcyehuysw.supabase.co/file.mp3',
      'https://odlnhfaygiotcyehuysw.supabase.co@evil.com/file.mp3',
    ];
    for (const url of evasionUrls) {
      expect(isAllowedUpstreamUrl(url)).toBe(false);
    }
  });

  await runner.it('SRF-5: Non-http schemes rejected (file://, ftp://, gopher://)', () => {
    const invalidSchemes = [
      'file:///etc/passwd',
      'ftp://odlnhfaygiotcyehuysw.supabase.co/audio.mp3',
      'gopher://odlnhfaygiotcyehuysw.supabase.co',
      'javascript:alert(1)',
    ];
    for (const url of invalidSchemes) {
      expect(isAllowedUpstreamUrl(url)).toBe(false);
    }
  });

  await runner.it('SRF-6: Upstream network exception results in HTTP 502 Bad Gateway', async () => {
    const validToken = generateMediaProxyToken(ALLOWED_AUDIO_URL);
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async () => {
        throw new Error('ECONNREFUSED connect to upstream storage');
      };

      const req = new NextRequest(`https://lingopro.online/api/toeic/media/proxy?t=${validToken}`);
      const res = await GET(req);

      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.error).toContain('Failed to stream media from upstream');
      expect(json.details).toContain('ECONNREFUSED');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: Zero-Bulk-Leak Type Exclusion & Runtime Sanitization Verification
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Challenger Suite 5: Zero-Bulk-Leak Invariant & Runtime Sanitization', () => {});

  await runner.it('ZBL-1: ToeicSanitizedQuestion type statically excludes sensitive fields', () => {
    type AssertKeysExcluded<T, K extends string> = K extends keyof T ? false : true;
    type Test1 = AssertKeysExcluded<ToeicSanitizedQuestion, 'correctAnswer'>;
    type Test2 = AssertKeysExcluded<ToeicSanitizedQuestion, 'explanationVi'>;
    type Test3 = AssertKeysExcluded<ToeicSanitizedQuestion, 'transcript'>;
    type Test4 = AssertKeysExcluded<ToeicSanitizedQuestion, 'passageTranslationVi'>;
    type Test5 = AssertKeysExcluded<ToeicSanitizedQuestion, 'dichNghia'>;

    const test1Passed: Test1 = true;
    const test2Passed: Test2 = true;
    const test3Passed: Test3 = true;
    const test4Passed: Test4 = true;
    const test5Passed: Test5 = true;

    expect(test1Passed).toBe(true);
    expect(test2Passed).toBe(true);
    expect(test3Passed).toBe(true);
    expect(test4Passed).toBe(true);
    expect(test5Passed).toBe(true);
  });

  await runner.it('ZBL-2: stripSensitiveToeicData strips correctAnswer, explanationVi, and transcript', () => {
    const mockQuestion: ToeicUnifiedQuestion = {
      id: 'mock-q1',
      testId: 'test-1',
      questionNumber: 101,
      part: 5,
      section: 'reading',
      prompt: 'Choose the correct option',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
      correctAnswer: 'A',
      explanationVi: 'Top secret explanation',
      transcript: 'Top secret transcript',
    };

    const [sanitized] = stripSensitiveToeicData([mockQuestion]);
    expect((sanitized as any).correctAnswer).toBeUndefined();
    expect((sanitized as any).explanationVi).toBeUndefined();
    expect((sanitized as any).transcript).toBeUndefined();
  });

  await runner.it('ZBL-3: [EMPIRICAL ADVERSARIAL] stripSensitiveToeicData MUST strip passageTranslationVi and dichNghia', () => {
    const mockReadingQuestion: ToeicUnifiedQuestion = {
      id: 'mock-q150',
      testId: 'ets-pro-01',
      questionNumber: 150,
      part: 7,
      section: 'reading',
      passage: 'Original English email text...',
      passageTranslationVi: 'BẢN DỊCH TOÀN VĂN TIẾNG VIỆT CỦA BÀI ĐỌC (RÒ RỈ NỘI DUNG)',
      dichNghia: 'DỊCH NGHĨA BÀI ĐỌC (RÒ RỈ NỘI DUNG)',
      options: [
        { key: 'A', text: 'Option A' },
        { key: 'B', text: 'Option B' },
      ],
      correctAnswer: 'B',
      explanationVi: 'Lý giải chi tiết',
      transcript: 'Audio transcript',
    };

    const [sanitized] = stripSensitiveToeicData([mockReadingQuestion]);

    // Zero-Bulk-Leak Invariant: Neither passageTranslationVi nor dichNghia may be delivered prior to submission
    const leakedTranslation = (sanitized as any).passageTranslationVi;
    const leakedDichNghia = (sanitized as any).dichNghia;

    if (leakedTranslation !== undefined || leakedDichNghia !== undefined) {
      throw new Error(
        `CRITICAL ZERO-BULK-LEAK VIOLATION: stripSensitiveToeicData leaked sensitive fields to client! ` +
        `passageTranslationVi="${leakedTranslation}", dichNghia="${leakedDichNghia}"`
      );
    }

    expect(leakedTranslation).toBeUndefined();
    expect(leakedDichNghia).toBeUndefined();
  });

  await runner.it('ZBL-4: [EMPIRICAL ADVERSARIAL] stripSensitiveClusterData MUST strip passageTranslationVi and dichNghia in questions', () => {
    const mockCluster: ToeicQuestionCluster = {
      clusterId: 'cluster-p7-01',
      part: 7,
      clusterType: 'text_dialogue',
      startQuestionNumber: 151,
      endQuestionNumber: 153,
      audioUrl: '',
      questions: [
        {
          id: 'mock-q151',
          testId: 'ets-pro-01',
          questionNumber: 151,
          part: 7,
          section: 'reading',
          options: [{ key: 'A', text: 'Opt A' }],
          correctAnswer: 'A',
          explanationVi: 'Explain',
          passageTranslationVi: 'LEAKED PASSAGE TRANSLATION IN CLUSTER',
          dichNghia: 'LEAKED DICH NGHIA IN CLUSTER',
        },
      ],
    };

    const sanitizedCluster = stripSensitiveClusterData(mockCluster);
    const leakedClusterTranslation = (sanitizedCluster.questions[0] as any).passageTranslationVi;
    const leakedClusterDichNghia = (sanitizedCluster.questions[0] as any).dichNghia;

    if (leakedClusterTranslation !== undefined || leakedClusterDichNghia !== undefined) {
      throw new Error(
        `CRITICAL ZERO-BULK-LEAK VIOLATION: stripSensitiveClusterData leaked sensitive fields in cluster questions! ` +
        `passageTranslationVi="${leakedClusterTranslation}", dichNghia="${leakedClusterDichNghia}"`
      );
    }

    expect(leakedClusterTranslation).toBeUndefined();
    expect(leakedClusterDichNghia).toBeUndefined();
  });
}

// Standalone execution support
if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-m1-2-empirical'))) {
  const runner = new TestRunner();
  runChallengerEmpiricalTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\n============================================================`);
    console.log(`Challenger M1-2 Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    console.log(`============================================================\n`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
