/**
 * Final Challenger M6-1 — Tier 5 Adversarial Hardening Suite:
 * Rapid Sequential Proxy Range Requests & Audio Scrubbing Stress Test.
 *
 * Requirements:
 * - Test rapid sequential proxy range requests (audio player scrubbing / seeking simulation).
 * - Verify HTTP 206 Partial Content, Content-Range, Accept-Ranges, Content-Length headers.
 * - Verify zero 302 redirects, SSRF protection under range requests, and error boundary containment.
 * - Stress-test high-velocity sequential requests (100 consecutive chunks) and concurrent burst (50 concurrent).
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  generateMediaProxyToken,
  decryptMediaProxyToken,
  isAllowedUpstreamUrl,
} from '../../src/lib/toeic-media-proxy';
import { GET } from '../../src/app/api/toeic/media/proxy/route';

export async function runChallengerProxyRangeTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger Tier 5: Media Proxy Rapid Sequential Range Requests', () => {});

  const SAMPLE_RAW_AUDIO =
    'https://odlnhfaygiotcyehuysw.supabase.co/storage/v1/object/public/pronunciation/words/inspiring-us-v2.mp3';
  const VALID_TOKEN = generateMediaProxyToken(SAMPLE_RAW_AUDIO);
  const TOTAL_AUDIO_SIZE = 102400; // 100 KB simulated audio file
  const fullAudioBuffer = Buffer.alloc(TOTAL_AUDIO_SIZE, 0xaa);

  // Save original fetch
  const originalFetch = global.fetch;

  const mockUpstreamFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = String(input);
    const method = init?.method || 'GET';
    const headers = new Headers(init?.headers);
    const rangeHeader = headers.get('range') || headers.get('Range');

    // Simulate upstream behavior for odlnhfaygiotcyehuysw.supabase.co
    if (!urlStr.includes('odlnhfaygiotcyehuysw.supabase.co')) {
      return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
    }

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/i);
      if (!match) {
        return new Response(JSON.stringify({ error: 'Invalid range' }), { status: 416 });
      }

      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : TOTAL_AUDIO_SIZE - 1;

      // Suffix range: bytes=-500
      if (!match[1] && match[2]) {
        const suffixLen = parseInt(match[2], 10);
        start = Math.max(0, TOTAL_AUDIO_SIZE - suffixLen);
        end = TOTAL_AUDIO_SIZE - 1;
      }

      if (start >= TOTAL_AUDIO_SIZE || start > end) {
        return new Response(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${TOTAL_AUDIO_SIZE}`,
          },
        });
      }

      end = Math.min(end, TOTAL_AUDIO_SIZE - 1);
      const chunkSize = end - start + 1;
      const slice = fullAudioBuffer.subarray(start, end + 1);

      const resHeaders = new Headers({
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(chunkSize),
        'Content-Range': `bytes ${start}-${end}/${TOTAL_AUDIO_SIZE}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });

      if (method === 'HEAD') {
        return new Response(null, { status: 206, headers: resHeaders });
      }

      return new Response(slice, { status: 206, headers: resHeaders });
    }

    // Full file response (200 OK)
    const resHeaders = new Headers({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(TOTAL_AUDIO_SIZE),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers: resHeaders });
    }

    return new Response(fullAudioBuffer, { status: 200, headers: resHeaders });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-1: Core Range Contract & HTTP 206 Streaming Invariants
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-1.1: Single partial content request returns HTTP 206 with correct headers', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=0-1023' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(res.headers.get('Content-Range')).toBe('bytes 0-1023/102400');
      expect(res.headers.get('Content-Length')).toBe('1024');
      expect(res.headers.get('Accept-Ranges')).toBe('bytes');
      expect(res.headers.get('Cache-Control')).toContain('max-age=31536000');

      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBe(1024);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-1.2: Full file request without Range header returns HTTP 200 and entire byte stream', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
      expect(res.headers.get('Content-Length')).toBe(String(TOTAL_AUDIO_SIZE));
      expect(res.headers.get('Accept-Ranges')).toBe('bytes');

      const buf = await res.arrayBuffer();
      expect(buf.byteLength).toBe(TOTAL_AUDIO_SIZE);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-1.3: Zero 302 redirects invariant: streaming directly to client', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=2048-4095' },
        }
      );
      const res = await GET(req);
      // Status must be 206, never 301 or 302
      expect(res.status).toBe(206);
      expect(res.headers.get('location')).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-2: Rapid Sequential Audio Scrubbing (100 Consecutive Requests)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-2.1: 100 rapid sequential range requests simulate continuous player scrubbing', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const CHUNK_COUNT = 100;
      const CHUNK_SIZE = 1024; // 1 KB chunks
      let successfulChunks = 0;

      for (let i = 0; i < CHUNK_COUNT; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE - 1;
        const req = new NextRequest(
          `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
          {
            headers: { Range: `bytes=${start}-${end}` },
          }
        );
        const res = await GET(req);

        expect(res.status).toBe(206);
        expect(res.headers.get('Content-Range')).toBe(`bytes ${start}-${end}/${TOTAL_AUDIO_SIZE}`);
        expect(res.headers.get('Content-Length')).toBe(String(CHUNK_SIZE));

        const bodyBuf = await res.arrayBuffer();
        expect(bodyBuf.byteLength).toBe(CHUNK_SIZE);
        successfulChunks++;
      }

      expect(successfulChunks).toBe(100);
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-3: Concurrent Range Burst (50 Concurrent Audio Seek Requests)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-3.1: 50 concurrent range requests resolve simultaneously without race conditions', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const CONCURRENT_COUNT = 50;
      const promises = Array.from({ length: CONCURRENT_COUNT }, async (_, idx) => {
        const start = idx * 1000;
        const end = start + 999;
        const req = new NextRequest(
          `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
          {
            headers: { Range: `bytes=${start}-${end}` },
          }
        );
        const res = await GET(req);
        const body = await res.arrayBuffer();
        return {
          status: res.status,
          contentRange: res.headers.get('Content-Range'),
          size: body.byteLength,
        };
      });

      const results = await Promise.all(promises);
      expect(results.length).toBe(50);
      for (let idx = 0; idx < results.length; idx++) {
        const r = results[idx];
        expect(r.status).toBe(206);
        expect(r.size).toBe(1000);
        expect(r.contentRange).toBe(`bytes ${idx * 1000}-${idx * 1000 + 999}/${TOTAL_AUDIO_SIZE}`);
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-4: Range Header Edge Cases & Boundary Variations
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-4.1: Probe request bytes=0-0 returns single first byte with HTTP 206', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=0-0' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('Content-Range')).toBe(`bytes 0-0/${TOTAL_AUDIO_SIZE}`);
      expect(res.headers.get('Content-Length')).toBe('1');
      const body = await res.arrayBuffer();
      expect(body.byteLength).toBe(1);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-4.2: Open-ended range bytes=50000- streams from offset to end of file', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=50000-' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('Content-Range')).toBe(`bytes 50000-${TOTAL_AUDIO_SIZE - 1}/${TOTAL_AUDIO_SIZE}`);
      const expectedLen = TOTAL_AUDIO_SIZE - 50000;
      expect(res.headers.get('Content-Length')).toBe(String(expectedLen));
      const body = await res.arrayBuffer();
      expect(body.byteLength).toBe(expectedLen);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-4.3: Suffix range bytes=-500 streams exact last 500 bytes of media', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=-500' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('Content-Range')).toBe(`bytes 101900-102399/${TOTAL_AUDIO_SIZE}`);
      expect(res.headers.get('Content-Length')).toBe('500');
      const body = await res.arrayBuffer();
      expect(body.byteLength).toBe(500);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-4.4: Out-of-bounds range request propagates HTTP 416 Range Not Satisfiable', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=999999-1000000' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(416);
      const body = await res.json();
      expect(body.error).toContain('Upstream resource unavailable (416)');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-5: HEAD Request Range Probing
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-5.1: HEAD request with Range returns null body and HTTP 206 headers', async () => {
    global.fetch = mockUpstreamFetch as any;
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          method: 'HEAD',
          headers: { Range: 'bytes=0-1023' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(206);
      expect(res.headers.get('Content-Range')).toBe(`bytes 0-1023/${TOTAL_AUDIO_SIZE}`);
      expect(res.headers.get('Accept-Ranges')).toBe('bytes');
      expect(res.body).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-6: Upstream Failure & Network Resilience
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-6.1: Upstream network disconnect returns HTTP 502 Bad Gateway safely', async () => {
    global.fetch = async () => {
      throw new Error('ECONNRESET: Connection reset by peer');
    };
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${VALID_TOKEN}`,
        {
          headers: { Range: 'bytes=0-1023' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('Failed to stream media from upstream');
      expect(body.details).toContain('ECONNRESET');
    } finally {
      global.fetch = originalFetch;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ADV-PR-7: Security Under Range Requests (SSRF & Tampering)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('ADV-PR-7.1: Range request with tampered token is blocked before making fetch call', async () => {
    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    };
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=tampered_token_xyz`,
        {
          headers: { Range: 'bytes=0-1023' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
      expect(fetchCalled).toBe(false);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await runner.it('ADV-PR-7.2: Range request targeting SSRF private IP is rejected with HTTP 403', async () => {
    const evilToken = generateMediaProxyToken('http://169.254.169.254/latest/meta-data');
    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    };
    try {
      const req = new NextRequest(
        `https://lingopro.online/api/toeic/media/proxy?t=${evilToken}`,
        {
          headers: { Range: 'bytes=0-1023' },
        }
      );
      const res = await GET(req);

      expect(res.status).toBe(403);
      expect(fetchCalled).toBe(false);
      const body = await res.json();
      expect(body.error).toContain('Target host is not permitted');
    } finally {
      global.fetch = originalFetch;
    }
  });
}

// Standalone execution support
if (
  require.main === module ||
  (typeof process !== 'undefined' && process.argv[1]?.includes('challenger-tier5-proxy-range.test'))
) {
  const runner = new TestRunner();
  runChallengerProxyRangeTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nProxy Range Test Run Complete: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
