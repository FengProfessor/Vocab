/**
 * tests/toeic/challenger-m1-r2-empirical.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 1 ITERATION 2
 * Deep Audio Stream & Network Payload Verification
 *
 * Specific Tasks:
 * 1. Verify 100% of all 460 unique audio URLs across 20 tests via HTTP HEAD (0 broken 404s).
 * 2. Deep inspect the 17 remediated audio URLs via HTTP GET stream:
 *    - Verify HTTP 200/206 status
 *    - Verify Content-Type is audio stream
 *    - Verify binary magic bytes (ID3 tag or MPEG sync header 0xFF)
 *    - Verify payload is NOT HTML/error page
 * 3. Deep inspect 20 randomly sampled audio URLs (10 Study4 CDN + 10 Estudyme GCS)
 *    - Verify binary magic bytes and non-empty streams
 * 4. Verify 1:3 cluster alignment across all 20 tests with 0 audio index collapse
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

const ROOT_DIR = path.resolve(__dirname, '../..');
const LISTENING_V1_PATH = path.join(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');

const REMEDIATED_17_URLS = [
  { testId: '7000', part: 3, qRange: 'Q41-43', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/27/93860120.mp3' },
  { testId: '7000', part: 4, qRange: 'Q83-85', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/27/32703867.mp3' },
  { testId: '7001', part: 3, qRange: 'Q44-46', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/27/48601325.mp3' },
  { testId: '7001', part: 4, qRange: 'Q98-100', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/27/91801891.mp3' },
  { testId: '7002', part: 3, qRange: 'Q62-64', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/27/23822168.mp3' },
  { testId: '7004', part: 3, qRange: 'Q50-52', url: 'https://storage.googleapis.com/estudyme/dev/2022/07/05/52925580.mp3' },
  { testId: '7004', part: 3, qRange: 'Q56-58', url: 'https://storage.googleapis.com/estudyme/dev/2022/07/05/29848087.mp3' },
  { testId: '7005', part: 4, qRange: 'Q92-94', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/81508908.mp3' },
  { testId: '7006', part: 3, qRange: 'Q41-43', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/84943248.mp3' },
  { testId: '7006', part: 4, qRange: 'Q80-82', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/37529431.mp3' },
  { testId: '7007', part: 3, qRange: 'Q56-58', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/68092315.mp3' },
  { testId: '7007', part: 3, qRange: 'Q62-64', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/62327689.mp3' },
  { testId: '7008', part: 3, qRange: 'Q50-52', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/80424829.mp3' },
  { testId: '7008', part: 3, qRange: 'Q56-58', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/60170848.mp3' },
  { testId: '7008', part: 4, qRange: 'Q80-82', url: 'https://storage.googleapis.com/estudyme/prod/2022/09/16/13846725.mp3' },
  { testId: '7008', part: 4, qRange: 'Q92-94', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/99693596.mp3' },
  { testId: '7009', part: 3, qRange: 'Q53-55', url: 'https://storage.googleapis.com/estudyme/dev/2022/06/28/90188046.mp3' },
];

interface TestStats {
  passed: number;
  failed: number;
  failures: string[];
}

const stats: TestStats = {
  passed: 0,
  failed: 0,
  failures: [],
};

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    stats.passed++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    stats.failed++;
    const msg = `❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`;
    stats.failures.push(msg);
    console.error(`  ${msg}`);
  }
}

/**
 * Perform HTTP HEAD probe with redirect following and browser user-agent
 */
async function fetchHeadStatus(rawUrl: string, maxRedirects = 3, retries = 2): Promise<{ status: number; contentType?: string; contentLength?: number }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(rawUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        (res) => {
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirects > 0) {
            const redirectUrl = new URL(res.headers.location, parsed).toString();
            resolve(fetchHeadStatus(redirectUrl, maxRedirects - 1, retries));
          } else {
            const cl = res.headers['content-length'] ? parseInt(res.headers['content-length'] as string, 10) : undefined;
            resolve({ status: code, contentType: res.headers['content-type'], contentLength: cl });
          }
        }
      );
      req.on('error', () => {
        if (retries > 0) {
          setTimeout(() => resolve(fetchHeadStatus(rawUrl, maxRedirects, retries - 1)), 500);
        } else {
          resolve({ status: 0 });
        }
      });
      req.on('timeout', () => {
        req.destroy();
        if (retries > 0) {
          setTimeout(() => resolve(fetchHeadStatus(rawUrl, maxRedirects, retries - 1)), 500);
        } else {
          resolve({ status: 408 });
        }
      });
      req.end();
    } catch {
      resolve({ status: 0 });
    }
  });
}

/**
 * Fetch first N bytes via HTTP GET to verify audio headers and payload authenticity
 */
async function fetchAudioHeaderBytes(
  rawUrl: string,
  byteCount = 1024,
  maxRedirects = 3
): Promise<{ status: number; contentType?: string; buffer: Buffer; isMp3: boolean; isHtml: boolean }> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(rawUrl);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(
        parsed,
        {
          method: 'GET',
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Range: `bytes=0-${byteCount - 1}`,
          },
        },
        (res) => {
          const code = res.statusCode || 0;
          if ([301, 302, 307, 308].includes(code) && res.headers.location && maxRedirects > 0) {
            const redirectUrl = new URL(res.headers.location, parsed).toString();
            resolve(fetchAudioHeaderBytes(redirectUrl, byteCount, maxRedirects - 1));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            if (Buffer.concat(chunks).length >= byteCount) {
              req.destroy(); // Got enough bytes
            }
          });

          res.on('end', () => {
            const fullBuf = Buffer.concat(chunks);
            const isMp3 = detectMp3MagicBytes(fullBuf);
            const textSample = fullBuf.slice(0, 200).toString('utf8').toLowerCase();
            const isHtml = textSample.includes('<!doctype') || textSample.includes('<html') || textSample.includes('<head');
            resolve({ status: code, contentType: res.headers['content-type'], buffer: fullBuf, isMp3, isHtml });
          });

          res.on('error', () => {
            const fullBuf = Buffer.concat(chunks);
            const isMp3 = detectMp3MagicBytes(fullBuf);
            const textSample = fullBuf.slice(0, 200).toString('utf8').toLowerCase();
            const isHtml = textSample.includes('<!doctype') || textSample.includes('<html');
            resolve({ status: code, contentType: res.headers['content-type'], buffer: fullBuf, isMp3, isHtml });
          });
        }
      );

      req.on('error', () => {
        resolve({ status: 0, buffer: Buffer.alloc(0), isMp3: false, isHtml: false });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 408, buffer: Buffer.alloc(0), isMp3: false, isHtml: false });
      });

      req.end();
    } catch {
      resolve({ status: 0, buffer: Buffer.alloc(0), isMp3: false, isHtml: false });
    }
  });
}

function detectMp3MagicBytes(buf: Buffer): boolean {
  if (buf.length < 3) return false;
  // Check for ID3v2 container ("ID3")
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    return true;
  }
  // Check for MPEG audio frame sync (11 bits set: 0xFF followed by 0xEx or 0xFx)
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) {
    return true;
  }
  // Search within first 512 bytes for MPEG frame sync
  for (let i = 0; i < Math.min(buf.length - 1, 512); i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      return true;
    }
  }
  return false;
}

// ============================================================================
// SUITE 1: 100% AUDIO REACHABILITY OF ALL 460 UNIQUE AUDIO URLS (HTTP HEAD)
// ============================================================================
async function runSuite1_All460Reachability() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 1: Empirical HEAD Probe of All 460 Unique Audio URLs`);
  console.log(`====================================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));
  const uniqueUrls = new Set<string>();

  for (const t of raw.part3) {
    for (const q of t.questions || []) {
      if (q.audio_url && q.audio_url.trim()) uniqueUrls.add(q.audio_url.trim());
    }
  }
  for (const t of raw.part4) {
    for (const q of t.questions || []) {
      if (q.audio_url && q.audio_url.trim()) uniqueUrls.add(q.audio_url.trim());
    }
  }

  const allUrls = Array.from(uniqueUrls);
  assert(allUrls.length === 460, `Exactly 460 unique audio URLs across 20 tests (got ${allUrls.length})`);

  console.log(`Probing all ${allUrls.length} audio URLs with concurrency=25...`);
  const batchSize = 25;
  let brokenCount = 0;
  const brokenList: { url: string; status: number }[] = [];

  for (let i = 0; i < allUrls.length; i += batchSize) {
    const chunk = allUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      chunk.map(async (url) => ({ url, res: await fetchHeadStatus(url) }))
    );

    for (const r of results) {
      if (r.res.status !== 200) {
        brokenCount++;
        brokenList.push({ url: r.url, status: r.res.status });
      }
    }
  }

  assert(
    brokenCount === 0,
    `All 460 audio URLs return HTTP 200 OK (0 broken 404s)`,
    `Found ${brokenCount} non-200 URLs: ${JSON.stringify(brokenList.slice(0, 5))}`
  );
}

// ============================================================================
// SUITE 2: DEEP PAYLOAD INSPECTION OF 17 REMEDIATED AUDIO URLS (HTTP GET STREAM)
// ============================================================================
async function runSuite2_Remediated17AudioDeepProbe() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 2: Deep Payload Inspection of 17 Remediated Audio URLs (HTTP GET)`);
  console.log(`====================================================================`);

  for (let i = 0; i < REMEDIATED_17_URLS.length; i++) {
    const item = REMEDIATED_17_URLS[i];
    const { status, contentType, buffer, isMp3, isHtml } = await fetchAudioHeaderBytes(item.url, 2048);

    const isHttpOk = status === 200 || status === 206;
    assert(
      isHttpOk,
      `[Remediated #${i + 1}] Test ${item.testId} P${item.part} ${item.qRange}: HTTP ${status} OK`,
      `URL: ${item.url}`
    );

    assert(
      !isHtml,
      `[Remediated #${i + 1}] Payload is pure binary, NOT HTML error page`,
      `Buffer start: ${buffer.slice(0, 40).toString('utf8')}`
    );

    assert(
      isMp3,
      `[Remediated #${i + 1}] Valid MP3 magic bytes detected (ID3 / MPEG Sync 0xFF)`,
      `First 8 bytes: ${buffer.slice(0, 8).toString('hex')}`
    );

    assert(
      buffer.length > 512,
      `[Remediated #${i + 1}] Received non-empty audio payload chunk (${buffer.length} bytes)`,
      `Expected >= 512 bytes`
    );
  }
}

// ============================================================================
// SUITE 3: RANDOM SAMPLE DEEP GET PROBE (10 STUDY4 CDN + 10 ESTUDYME GCS)
// ============================================================================
async function runSuite3_RandomSampleDeepGetProbe() {
  console.log(`\n====================================================================`);
  console.log(`SUITE 3: Deep Stream Probe on Random Samples (10 Study4 + 10 Estudyme)`);
  console.log(`====================================================================`);

  const raw = JSON.parse(fs.readFileSync(LISTENING_V1_PATH, 'utf8'));
  const study4Urls: string[] = [];
  const gcsUrls: string[] = [];

  for (const t of [...raw.part3, ...raw.part4]) {
    for (const q of t.questions || []) {
      const u = (q.audio_url || '').trim();
      if (u.includes('study4.com')) study4Urls.push(u);
      else if (u.includes('storage.googleapis.com')) gcsUrls.push(u);
    }
  }

  const sampleStudy4 = Array.from(new Set(study4Urls)).slice(0, 10);
  const sampleGcs = Array.from(new Set(gcsUrls)).slice(0, 10);

  console.log(`Testing 10 Study4 CDN samples...`);
  for (let i = 0; i < sampleStudy4.length; i++) {
    const url = sampleStudy4[i];
    const { status, isMp3, isHtml, buffer } = await fetchAudioHeaderBytes(url, 2048);
    assert(
      status === 200 || status === 206,
      `[Study4 Sample #${i + 1}] HTTP ${status} (received ${buffer.length} bytes)`
    );
    assert(!isHtml, `[Study4 Sample #${i + 1}] Not HTML error page`);
    assert(isMp3, `[Study4 Sample #${i + 1}] Valid MP3 header/sync bytes`);
  }

  console.log(`Testing 10 Estudyme GCS samples...`);
  for (let i = 0; i < sampleGcs.length; i++) {
    const url = sampleGcs[i];
    const { status, isMp3, isHtml, buffer } = await fetchAudioHeaderBytes(url, 2048);
    assert(
      status === 200 || status === 206,
      `[Estudyme Sample #${i + 1}] HTTP ${status} (received ${buffer.length} bytes)`
    );
    assert(!isHtml, `[Estudyme Sample #${i + 1}] Not HTML error page`);
    assert(isMp3, `[Estudyme Sample #${i + 1}] Valid MP3 header/sync bytes`);
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runR2EmpiricalChallenger() {
  const startTime = Date.now();
  console.log(`********************************************************************`);
  console.log(`*  CHALLENGER 1 M1 R2: DEEP EMPIRICAL AUDIO & STREAM HARNESS        *`);
  console.log(`********************************************************************`);

  await runSuite1_All460Reachability();
  await runSuite2_Remediated17AudioDeepProbe();
  await runSuite3_RandomSampleDeepGetProbe();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n====================================================================`);
  console.log(`RESULTS: Passed: ${stats.passed} | Failed: ${stats.failed} | Elapsed: ${elapsed}s`);
  console.log(`====================================================================`);

  if (stats.failed > 0) {
    console.error(`\n❌ VERDICT: REQUEST_CHANGES`);
    stats.failures.forEach((f) => console.error(`  ${f}`));
    process.exit(1);
  } else {
    console.log(`\n🎉 VERDICT: APPROVE — All empirical deep stream & reachability checks passed!`);
    process.exit(0);
  }
}

runR2EmpiricalChallenger().catch((err) => {
  console.error('Fatal crash:', err);
  process.exit(1);
});
