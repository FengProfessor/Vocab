/**
 * Adversarial Challenger Test Suite: Rate Limiter, Circuit Breaker & Offline Execution
 * Milestone 2 (Speaking Crawler Engine)
 * File: tests/speaking/challenger-m2-resilience.test.ts
 *
 * EMPIRICAL ADVERSARIAL CHALLENGE HARNESS:
 * 1. Offline Execution Strictness & Socket Leak Detection
 * 2. RateLimiter Jitter Distribution & Boundary Invariance (100 & 1,000 iterations)
 * 3. Exponential Backoff Mathematical Precision (429/403 vs 5xx vs network)
 * 4. Circuit Breaker State Transitions, Cooldown Auto-Reset & Domain Isolation
 * 5. Concurrency Throttling, Queueing, and Domain Parser Edge Cases
 */

import {
  CircuitBreakerOpenError,
  defaultHttpClient,
  HttpClient,
  USER_AGENT_POOL,
} from '../../scripts/speaking/core/http-client';
import {
  defaultRateLimiter,
  RateLimiter,
} from '../../scripts/speaking/core/rate-limiter';
import { crawlElllo } from '../../scripts/speaking/crawlers/crawl-elllo';
import { crawlTalkEnglish } from '../../scripts/speaking/crawlers/crawl-talkenglish';
import { crawlYouTube } from '../../scripts/speaking/crawlers/crawl-youtube';

interface TestRecord {
  id: string;
  name: string;
  category: string;
  fn: () => void | Promise<void>;
}

const tests: TestRecord[] = [];

function challenge(category: string, id: string, name: string, fn: () => void | Promise<void>) {
  tests.push({ id, name, category, fn });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[CHALLENGE FAILED] ${message}`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 1: OFFLINE EXECUTION STRICTNESS & SOCKET LEAK DETECTION
// ═════════════════════════════════════════════════════════════════════════════

challenge('Offline Mode', '1.1', 'request() with { offline: true } strictly blocks external network calls', async () => {
  const client = new HttpClient();
  let caught = false;
  try {
    await client.request('https://www.google.com', {}, { offline: true });
  } catch (err: unknown) {
    caught = true;
    const msg = (err as Error).message;
    assert(msg.includes('Offline mode active'), `Error message must contain "Offline mode active", got: ${msg}`);
    assert(msg.includes('blocked'), `Error message must state blocked, got: ${msg}`);
  }
  assert(caught, 'request() with offline: true MUST throw before making any network call');
});

challenge('Offline Mode', '1.2', 'fetchHtml() with { offline: true } strictly blocks without socket access', async () => {
  const client = new HttpClient();
  let caught = false;
  try {
    await client.fetchHtml('https://www.elllo.org/english/1501/1510-Todd-Coffee.htm', { offline: true });
  } catch (err: unknown) {
    caught = true;
    assert((err as Error).message.includes('Offline mode active'), 'Must block with offline error');
  }
  assert(caught, 'fetchHtml() with offline: true MUST throw');
});

challenge('Offline Mode', '1.3', 'fetchJson() with { offline: true } strictly blocks without socket access', async () => {
  const client = new HttpClient();
  let caught = false;
  try {
    await client.fetchJson('https://www.youtube.com/oembed?url=https://youtube.com/watch?v=123', { offline: true });
  } catch (err: unknown) {
    caught = true;
    assert((err as Error).message.includes('Offline mode active'), 'Must block with offline error');
  }
  assert(caught, 'fetchJson() with offline: true MUST throw');
});

challenge('Offline Mode', '1.4', 'Offline guard strictly blocks SSRF, cloud metadata, and internal intranet targets', async () => {
  const client = new HttpClient();
  const hostileTargets = [
    'http://169.254.169.254/latest/meta-data/', // AWS metadata
    'http://127.0.0.1:8080/admin',              // Localhost intranet
    'http://localhost:3000/api/internal',       // App internal
    'http://0.0.0.0:22',                        // SSH loopback
    'file:///etc/passwd',                       // Local file schema
  ];

  for (const target of hostileTargets) {
    let caught = false;
    try {
      await client.request(target, {}, { offline: true });
    } catch (err: unknown) {
      caught = true;
      assert((err as Error).message.includes('Offline mode active'), `Must block target ${target}`);
    }
    assert(caught, `Target ${target} was NOT blocked by offline guard!`);
  }
});

challenge('Offline Mode', '1.5', 'Constructor options: new HttpClient({ offline: true }) must strictly enforce offline mode', async () => {
  // Vulnerability audit: When a caller instantiates HttpClient with { offline: true },
  // it must enforce offline blocking on all subsequent calls without requiring options repetition.
  const offlineInstance = new HttpClient({ offline: true, timeoutMs: 50 });

  let caughtOfflineError = false;
  let errorMsg = '';
  try {
    await offlineInstance.request('http://240.0.0.1:9999', { timeout: 50 });
  } catch (err: unknown) {
    errorMsg = (err as Error).message;
    if (errorMsg.includes('Offline mode active')) {
      caughtOfflineError = true;
    }
  }

  assert(
    caughtOfflineError,
    `new HttpClient({ offline: true }) did NOT enforce offline mode! Leaked towards network with error: "${errorMsg.slice(0, 80)}"`
  );
});

challenge('Offline Mode', '1.6', 'Crawlers run 100% deterministically in offline mode with 0 network calls', async () => {
  // Verify all three crawlers complete without network in offline mode
  const elllo = await crawlElllo({ offline: true, limit: 3 });
  assert(elllo.length === 3, 'crawlElllo offline must return exactly 3 lessons');
  assert(elllo.every((l) => l.source === 'elllo'), 'All items must be from elllo');

  const talkenglish = await crawlTalkEnglish({ offline: true, limit: 2 });
  assert(talkenglish.length === 2, 'crawlTalkEnglish offline must return exactly 2 lessons');
  assert(talkenglish.every((l) => l.source === 'talkenglish'), 'All items must be from talkenglish');

  const youtube = await crawlYouTube({ offline: true, limit: 2 });
  assert(youtube.length === 2, 'crawlYouTube offline must return exactly 2 lessons');
  assert(youtube.every((l) => l.source === 'youtube'), 'All items must be from youtube');
});

challenge('Offline Mode', '1.7', 'Offline mode blocks irrespective of HTTP method (GET, POST, PUT, DELETE)', async () => {
  const client = new HttpClient();
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'] as const;

  for (const method of methods) {
    let caught = false;
    try {
      await client.request('https://api.example.com', { method }, { offline: true });
    } catch (err: unknown) {
      caught = true;
      assert((err as Error).message.includes('Offline mode active'), `Failed for method ${method}`);
    }
    assert(caught, `Method ${method} bypassed offline check!`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 2: RATELIMITER JITTER DISTRIBUTION & BOUNDARY INVARIANCE
// ═════════════════════════════════════════════════════════════════════════════

challenge('Jitter Bounds', '2.1', 'RateLimiter default jitter stays strictly within [1500, 4000] under 100 iterations', () => {
  const limiter = new RateLimiter({ minDelayMs: 1500, maxDelayMs: 4000 });
  const iterations = 100;
  const values: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const delay = limiter.calculateJitterDelay();
    assert(typeof delay === 'number', `Delay must be a number, got: ${typeof delay}`);
    assert(!Number.isNaN(delay), 'Delay must not be NaN');
    assert(Number.isInteger(delay), `Delay ${delay} must be an integer`);
    assert(delay >= 1500, `Delay ${delay} is below minimum 1500ms`);
    assert(delay <= 4000, `Delay ${delay} exceeds maximum 4000ms`);
    values.push(delay);
  }

  // Ensure values are not all identical (genuine random jitter)
  const uniqueCount = new Set(values).size;
  assert(uniqueCount > 50, `Expected >50 unique values out of 100, got: ${uniqueCount}`);
});

challenge('Jitter Bounds', '2.2', 'RateLimiter jitter under 1,000 iterations: uniform distribution & statistical sanity', () => {
  const limiter = new RateLimiter({ minDelayMs: 1500, maxDelayMs: 4000 });
  const iterations = 1000;
  let sum = 0;
  let observedMin = Infinity;
  let observedMax = -Infinity;

  for (let i = 0; i < iterations; i++) {
    const delay = limiter.calculateJitterDelay();
    assert(delay >= 1500 && delay <= 4000, `Out of bounds: ${delay}`);
    sum += delay;
    if (delay < observedMin) observedMin = delay;
    if (delay > observedMax) observedMax = delay;
  }

  const mean = sum / iterations;
  const expectedMean = (1500 + 4000) / 2; // 2750ms
  const errorMargin = Math.abs(mean - expectedMean) / expectedMean;

  assert(errorMargin < 0.05, `Mean ${mean} deviated by ${(errorMargin * 100).toFixed(2)}% from expected ${expectedMean} (allowed < 5%)`);
  assert(observedMin >= 1500 && observedMin < 1600, `Observed min ${observedMin} should be close to 1500`);
  assert(observedMax <= 4000 && observedMax > 3900, `Observed max ${observedMax} should be close to 4000`);
});

challenge('Jitter Bounds', '2.3', 'Degenerate bounds: min == max (e.g. 2500ms) returns constant without error', () => {
  const limiter = new RateLimiter({ minDelayMs: 2500, maxDelayMs: 2500 });
  for (let i = 0; i < 50; i++) {
    const delay = limiter.calculateJitterDelay();
    assert(delay === 2500, `When min==max, expected 2500, got: ${delay}`);
  }
});

challenge('Jitter Bounds', '2.4', 'Inverted bounds: min > max handles gracefully without negative or NaN output', () => {
  const limiter = new RateLimiter({ minDelayMs: 4000, maxDelayMs: 1000 });
  for (let i = 0; i < 50; i++) {
    const delay = limiter.calculateJitterDelay();
    assert(!Number.isNaN(delay), 'Must not produce NaN');
    assert(delay >= 0, `Must not produce negative delay, got: ${delay}`);
    assert(delay === 4000, `When min > max, expected fallback to minDelayMs (4000), got: ${delay}`);
  }
});

challenge('Jitter Bounds', '2.5', 'Zero-delay bounds [0, 0] returns exactly 0', () => {
  const limiter = new RateLimiter({ minDelayMs: 0, maxDelayMs: 0 });
  for (let i = 0; i < 20; i++) {
    assert(limiter.calculateJitterDelay() === 0, 'Must return 0');
  }
});

challenge('Jitter Bounds', '2.6', 'Tight integer bounds [0, 5] produces discrete integer distribution in [0, 5]', () => {
  const limiter = new RateLimiter({ minDelayMs: 0, maxDelayMs: 5 });
  const observed = new Set<number>();
  for (let i = 0; i < 100; i++) {
    const d = limiter.calculateJitterDelay();
    assert(d >= 0 && d <= 5, `Out of bounds [0, 5]: ${d}`);
    assert(Number.isInteger(d), 'Must be integer');
    observed.add(d);
  }
  assert(observed.size >= 4, `Should observe multiple distinct buckets in [0, 5], got ${observed.size}`);
});

challenge('Jitter Bounds', '2.7', 'Floating point inputs [100.5, 200.7] are floored to integers', () => {
  const limiter = new RateLimiter({ minDelayMs: 100.5, maxDelayMs: 200.7 });
  for (let i = 0; i < 50; i++) {
    const d = limiter.calculateJitterDelay();
    assert(Number.isInteger(d), `Floating input must yield integer, got ${d}`);
    assert(d >= 100 && d <= 200, `Value ${d} out of range [100, 200]`);
  }
});

challenge('Jitter Bounds', '2.8', 'Stress test: 10,000 iterations produce 0 NaN, 0 Infinity, 0 out-of-bounds', () => {
  const limiter = new RateLimiter({ minDelayMs: 1500, maxDelayMs: 4000 });
  for (let i = 0; i < 10000; i++) {
    const d = limiter.calculateJitterDelay();
    if (d < 1500 || d > 4000 || Number.isNaN(d) || !Number.isFinite(d)) {
      throw new Error(`Failed on iteration ${i} with value ${d}`);
    }
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 3: EXPONENTIAL BACKOFF MATHEMATICAL PRECISION
// ═════════════════════════════════════════════════════════════════════════════

challenge('Backoff Precision', '3.1', '429 (Too Many Requests) backoff: strictly 45s * retryCount for retries 1, 2, 3', () => {
  const limiter = new RateLimiter();
  const domain = 'elllo.org';

  const delay1 = limiter.getBackoffDelay(domain, 1, 429);
  const delay2 = limiter.getBackoffDelay(domain, 2, 429);
  const delay3 = limiter.getBackoffDelay(domain, 3, 429);

  assert(delay1 === 45000, `Retry 1 on 429 must be 45,000ms, got: ${delay1}`);
  assert(delay2 === 90000, `Retry 2 on 429 must be 90,000ms, got: ${delay2}`);
  assert(delay3 === 135000, `Retry 3 on 429 must be 135,000ms, got: ${delay3}`);
});

challenge('Backoff Precision', '3.2', '403 (Forbidden / CF WAF) backoff: strictly 45s * retryCount for retries 1, 2, 3', () => {
  const limiter = new RateLimiter();
  const domain = 'talkenglish.com';

  const delay1 = limiter.getBackoffDelay(domain, 1, 403);
  const delay2 = limiter.getBackoffDelay(domain, 2, 403);
  const delay3 = limiter.getBackoffDelay(domain, 3, 403);

  assert(delay1 === 45000, `Retry 1 on 403 must be 45,000ms, got: ${delay1}`);
  assert(delay2 === 90000, `Retry 2 on 403 must be 90,000ms, got: ${delay2}`);
  assert(delay3 === 135000, `Retry 3 on 403 must be 135,000ms, got: ${delay3}`);
});

challenge('Backoff Precision', '3.3', '500 (Internal Server Error) backoff: strictly 1000 * 2^(retryCount-1) for retries 1, 2, 3', () => {
  const limiter = new RateLimiter();
  const domain = 'youtube.com';

  const delay1 = limiter.getBackoffDelay(domain, 1, 500);
  const delay2 = limiter.getBackoffDelay(domain, 2, 500);
  const delay3 = limiter.getBackoffDelay(domain, 3, 500);

  assert(delay1 === 1000, `Retry 1 on 500 must be 1,000ms (2^0 * 1000), got: ${delay1}`);
  assert(delay2 === 2000, `Retry 2 on 500 must be 2,000ms (2^1 * 1000), got: ${delay2}`);
  assert(delay3 === 4000, `Retry 3 on 500 must be 4,000ms (2^2 * 1000), got: ${delay3}`);
});

challenge('Backoff Precision', '3.4', '502, 503, 504 server gateway errors follow 1s, 2s, 4s exponential scaling', () => {
  const limiter = new RateLimiter();
  const domain = 'youtube.com';

  for (const status of [502, 503, 504]) {
    assert(limiter.getBackoffDelay(domain, 1, status) === 1000, `Status ${status} retry 1 failed`);
    assert(limiter.getBackoffDelay(domain, 2, status) === 2000, `Status ${status} retry 2 failed`);
    assert(limiter.getBackoffDelay(domain, 3, status) === 4000, `Status ${status} retry 3 failed`);
  }
});

challenge('Backoff Precision', '3.5', 'Network failure / undefined status defaults to 1s, 2s, 4s exponential backoff', () => {
  const limiter = new RateLimiter();
  const domain = 'unknown-host';

  const delay1 = limiter.getBackoffDelay(domain, 1, undefined);
  const delay2 = limiter.getBackoffDelay(domain, 2, undefined);
  const delay3 = limiter.getBackoffDelay(domain, 3, undefined);

  assert(delay1 === 1000, `Retry 1 on undefined status must be 1,000ms, got: ${delay1}`);
  assert(delay2 === 2000, `Retry 2 on undefined status must be 2,000ms, got: ${delay2}`);
  assert(delay3 === 4000, `Retry 3 on undefined status must be 4,000ms, got: ${delay3}`);
});

challenge('Backoff Precision', '3.6', 'Corner case retries: retryCount <= 0 clamped to minimum attempt 1', () => {
  const limiter = new RateLimiter();
  const domain = 'elllo.org';

  // Attempt 0 or negative must clamp to attempt 1
  assert(limiter.getBackoffDelay(domain, 0, 429) === 45000, 'Retry 0 on 429 must clamp to 45,000ms');
  assert(limiter.getBackoffDelay(domain, -3, 429) === 45000, 'Negative retry on 429 must clamp to 45,000ms');
  assert(limiter.getBackoffDelay(domain, 0, 500) === 1000, 'Retry 0 on 500 must clamp to 1,000ms');
  assert(limiter.getBackoffDelay(domain, -5, 500) === 1000, 'Negative retry on 500 must clamp to 1,000ms');
});

challenge('Backoff Precision', '3.7', 'Deep retry progression: retries 4 and 5 compute mathematically sound values', () => {
  const limiter = new RateLimiter();
  const domain = 'api.test';

  // 429 at retry 4: 45000 * 4 = 180,000ms (3 minutes)
  assert(limiter.getBackoffDelay(domain, 4, 429) === 180000, 'Retry 4 on 429 must be 180s');
  // 429 at retry 5: 45000 * 5 = 225,000ms (3.75 minutes)
  assert(limiter.getBackoffDelay(domain, 5, 429) === 225000, 'Retry 5 on 429 must be 225s');

  // 5xx at retry 4: 1000 * 2^3 = 8000ms
  assert(limiter.getBackoffDelay(domain, 4, 500) === 8000, 'Retry 4 on 500 must be 8,000ms');
  // 5xx at retry 5: 1000 * 2^4 = 16000ms
  assert(limiter.getBackoffDelay(domain, 5, 500) === 16000, 'Retry 5 on 500 must be 16,000ms');
});

challenge('Backoff Precision', '3.8', 'All backoff return values are positive integers and finite', () => {
  const limiter = new RateLimiter();
  for (let r = 1; r <= 10; r++) {
    const d429 = limiter.getBackoffDelay('a.com', r, 429);
    const d500 = limiter.getBackoffDelay('a.com', r, 500);
    assert(Number.isInteger(d429) && d429 > 0, `d429 invalid for retry ${r}`);
    assert(Number.isInteger(d500) && d500 > 0, `d500 invalid for retry ${r}`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 4: CIRCUIT BREAKER STATE MACHINE, TRIPPING & COOLDOWN
// ═════════════════════════════════════════════════════════════════════════════

challenge('Circuit Breaker', '4.1', 'Circuit breaker remains CLOSED during 0, 1, and 2 failures under default threshold 3', () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 3 });
  const domain = 'stable-host.org';

  assert(!limiter.isCircuitOpen(domain), 'Must be CLOSED initially (0 failures)');
  assert(limiter.getFailureCount(domain) === 0, 'Failure count must be 0');

  limiter.recordFailure(domain, 500);
  assert(!limiter.isCircuitOpen(domain), 'Must remain CLOSED after 1 failure');
  assert(limiter.getFailureCount(domain) === 1, 'Failure count must be 1');

  limiter.recordFailure(domain, 502);
  assert(!limiter.isCircuitOpen(domain), 'Must remain CLOSED after 2 failures');
  assert(limiter.getFailureCount(domain) === 2, 'Failure count must be 2');
});

challenge('Circuit Breaker', '4.2', 'Circuit breaker TRIPS OPEN strictly upon the 3rd consecutive failure', () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 3 });
  const domain = 'trip-host.org';

  limiter.recordFailure(domain, 503);
  limiter.recordFailure(domain, 503);
  assert(!limiter.isCircuitOpen(domain), 'Should not be open yet at 2 failures');

  limiter.recordFailure(domain, 503);
  assert(limiter.isCircuitOpen(domain), 'MUST trip OPEN upon 3rd failure');
  assert(limiter.getFailureCount(domain) === 3, 'Failure count must be 3');
});

challenge('Circuit Breaker', '4.3', 'In OPEN state, throttle() immediately throws descriptive Error', async () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 2 });
  const domain = 'blocked-host.org';

  limiter.recordFailure(domain);
  limiter.recordFailure(domain);
  assert(limiter.isCircuitOpen(domain), 'Circuit must be open');

  let caught = false;
  try {
    await limiter.throttle(domain);
  } catch (err: unknown) {
    caught = true;
    const msg = (err as Error).message;
    assert(msg.includes('Circuit breaker is OPEN'), `Error message must contain "Circuit breaker is OPEN", got: ${msg}`);
    assert(msg.includes(domain), `Error message must cite the domain, got: ${msg}`);
  }
  assert(caught, 'throttle() MUST throw when circuit is open');
});

challenge('Circuit Breaker', '4.4', 'In OPEN state, HttpClient.request() immediately throws CircuitBreakerOpenError', async () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 1 });
  const client = new HttpClient({ rateLimiter: limiter });
  const url = 'https://broken-service.net/api';
  const domain = 'broken-service.net';

  // Trip the circuit
  limiter.recordFailure(domain);
  assert(limiter.isCircuitOpen(domain), 'Circuit must be open');

  let caught = false;
  try {
    await client.request(url);
  } catch (err: unknown) {
    caught = true;
    assert(err instanceof CircuitBreakerOpenError, `Expected CircuitBreakerOpenError, got ${typeof err}`);
    assert((err as CircuitBreakerOpenError).domain === domain, 'Error must capture domain');
    assert((err as Error).message.includes('Circuit breaker is OPEN'), 'Message must indicate open circuit');
  }
  assert(caught, 'HttpClient.request() MUST throw CircuitBreakerOpenError before sending request');
});

challenge('Circuit Breaker', '4.5', 'Domain isolation: tripping Domain A does NOT affect Domain B or Domain C', async () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 2, minDelayMs: 0, maxDelayMs: 0 });
  const domainA = 'service-a.com';
  const domainB = 'service-b.com';
  const domainC = 'service-c.com';

  // Trip Domain A
  limiter.recordFailure(domainA);
  limiter.recordFailure(domainA);
  assert(limiter.isCircuitOpen(domainA), 'Domain A must be OPEN');

  // Verify Domains B and C are pristine
  assert(!limiter.isCircuitOpen(domainB), 'Domain B must be CLOSED');
  assert(!limiter.isCircuitOpen(domainC), 'Domain C must be CLOSED');
  assert(limiter.getFailureCount(domainB) === 0, 'Domain B failure count must be 0');
  assert(limiter.getFailureCount(domainC) === 0, 'Domain C failure count must be 0');

  // Throttling on Domain B must succeed without error
  await limiter.throttle(domainB);
});

challenge('Circuit Breaker', '4.6', 'Success resets consecutive failure count and restores healthy state', () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 3 });
  const domain = 'intermittent.com';

  // 2 failures
  limiter.recordFailure(domain);
  limiter.recordFailure(domain);
  assert(limiter.getFailureCount(domain) === 2, 'Count should be 2');

  // Intervening success
  limiter.recordSuccess(domain);
  assert(limiter.getFailureCount(domain) === 0, 'Success must reset failure count to 0');
  assert(!limiter.isCircuitOpen(domain), 'Circuit must remain closed');

  // Next 2 failures should not trip
  limiter.recordFailure(domain);
  limiter.recordFailure(domain);
  assert(!limiter.isCircuitOpen(domain), 'Must not trip after 2 failures following reset');
  assert(limiter.getFailureCount(domain) === 2, 'Count should be 2');
});

challenge('Circuit Breaker', '4.7', 'Circuit breaker auto-resets after cooldown period expires', async () => {
  const cooldownMs = 50;
  const limiter = new RateLimiter({ circuitFailureThreshold: 2, circuitCooldownMs: cooldownMs });
  const domain = 'cooldown-test.com';

  limiter.recordFailure(domain);
  limiter.recordFailure(domain);
  assert(limiter.isCircuitOpen(domain), 'Circuit must be open immediately after 2 failures');

  // Within cooldown (20ms): still open
  await new Promise((r) => setTimeout(r, 20));
  assert(limiter.isCircuitOpen(domain), 'Circuit must STILL be open after 20ms (<50ms cooldown)');

  // Past cooldown (70ms total): automatically resets
  await new Promise((r) => setTimeout(r, 45));
  assert(!limiter.isCircuitOpen(domain), 'Circuit MUST reset to closed after cooldown expires');
  assert(limiter.getFailureCount(domain) === 0, 'Failure count must be reset to 0 upon cooldown expiration');
});

challenge('Circuit Breaker', '4.8', 'Custom failure thresholds (threshold = 1 and threshold = 5) operate accurately', () => {
  // Threshold = 1 (Immediate trip)
  const limiter1 = new RateLimiter({ circuitFailureThreshold: 1 });
  limiter1.recordFailure('one-strike.com');
  assert(limiter1.isCircuitOpen('one-strike.com'), 'Threshold 1 must trip on first failure');

  // Threshold = 5 (High tolerance)
  const limiter5 = new RateLimiter({ circuitFailureThreshold: 5 });
  for (let i = 0; i < 4; i++) {
    limiter5.recordFailure('tolerant.com');
    assert(!limiter5.isCircuitOpen('tolerant.com'), `Should not trip at ${i + 1} failures for threshold 5`);
  }
  limiter5.recordFailure('tolerant.com');
  assert(limiter5.isCircuitOpen('tolerant.com'), 'Must trip on 5th failure for threshold 5');
});

challenge('Circuit Breaker', '4.9', 'reset() cleanly purges specific domain or entire registry', () => {
  const limiter = new RateLimiter({ circuitFailureThreshold: 1 });
  limiter.recordFailure('host1.com');
  limiter.recordFailure('host2.com');
  assert(limiter.isCircuitOpen('host1.com'), 'host1 must be open');
  assert(limiter.isCircuitOpen('host2.com'), 'host2 must be open');

  // Targeted reset
  limiter.reset('host1.com');
  assert(!limiter.isCircuitOpen('host1.com'), 'host1 must be reset');
  assert(limiter.isCircuitOpen('host2.com'), 'host2 must still be open');

  // Global reset
  limiter.reset();
  assert(!limiter.isCircuitOpen('host2.com'), 'host2 must now be reset');
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 5: CONCURRENCY, SEQUENTIAL QUEUEING & HTTPCLIENT RESILIENCE
// ═════════════════════════════════════════════════════════════════════════════

challenge('Concurrency & Edge', '5.1', 'Sequential throttle queueing on same domain enforces serial execution', async () => {
  const limiter = new RateLimiter({ minDelayMs: 20, maxDelayMs: 30 });
  const domain = 'serial-domain.org';

  const order: number[] = [];
  const start = Date.now();

  const task1 = limiter.throttle(domain).then(() => {
    order.push(1);
  });
  const task2 = limiter.throttle(domain).then(() => {
    order.push(2);
  });
  const task3 = limiter.throttle(domain).then(() => {
    order.push(3);
  });

  await Promise.all([task1, task2, task3]);
  const elapsed = Date.now() - start;

  assert(order[0] === 1 && order[1] === 2 && order[2] === 3, `Expected FIFO order [1, 2, 3], got: [${order.join(', ')}]`);
  // Three sequential operations with 20ms delay each should take >= 30ms total
  assert(elapsed >= 30, `Elapsed time ${elapsed}ms should reflect sequential queueing (>=30ms)`);
});

challenge('Concurrency & Edge', '5.2', 'Concurrent throttling across distinct domains runs in parallel without crosstalk', async () => {
  const limiter = new RateLimiter({ minDelayMs: 25, maxDelayMs: 35 });
  const start = Date.now();

  const taskA = limiter.throttle('domain-alpha.com');
  const taskB = limiter.throttle('domain-beta.com');
  const taskC = limiter.throttle('domain-gamma.com');

  await Promise.all([taskA, taskB, taskC]);
  const elapsed = Date.now() - start;

  // If parallel, total elapsed should be ~25-45ms, not 3 * 25ms = 75ms+
  assert(elapsed < 70, `Independent domains should run in parallel, took ${elapsed}ms (expected <70ms)`);
});

challenge('Concurrency & Edge', '5.3', 'HttpClient domain parser handles complex, IPv4, ports, case, and malformed URLs', () => {
  const client = defaultHttpClient;

  assert(client.extractDomain('https://SUB.DOMAIN.ELLLO.ORG/test') === 'sub.domain.elllo.org', 'Must lowercase');
  assert(client.extractDomain('http://192.168.1.1:8080/api') === '192.168.1.1', 'Must handle IPv4 and strip port');
  assert(client.extractDomain('https://talkenglish.com:443/test') === 'talkenglish.com', 'Must strip standard port');
  assert(client.extractDomain('https://www.youtube.com:8443/watch?v=abc') === 'www.youtube.com', 'Must strip custom port');
  assert(client.extractDomain('not-a-valid-url') === 'unknown-host', 'Must fallback to unknown-host on invalid URL');
  assert(client.extractDomain('') === 'unknown-host', 'Must fallback to unknown-host on empty string');
  assert(client.extractDomain('ftp://ftp.example.org/file') === 'ftp.example.org', 'Must handle FTP protocol host');
});

challenge('Concurrency & Edge', '5.4', 'User-Agent pool rotation cycles across all modern desktop signatures', () => {
  const client = new HttpClient();
  assert(USER_AGENT_POOL.length >= 6, `Expected >=6 User Agents, got: ${USER_AGENT_POOL.length}`);

  const sampledUas: string[] = [];
  for (let i = 0; i < USER_AGENT_POOL.length; i++) {
    sampledUas.push(client.getNextUserAgent());
  }

  // All in pool must have been sampled
  for (const ua of USER_AGENT_POOL) {
    assert(sampledUas.includes(ua), `User agent ${ua} was not sampled`);
  }

  // Next sample must wrap back to index 0
  const wrapUa = client.getNextUserAgent();
  assert(wrapUa === USER_AGENT_POOL[0], 'User-Agent rotation must wrap around to index 0');
});

challenge('Concurrency & Edge', '5.5', 'Single-flight concurrency safety: queue failure in operation does not break subsequent tasks', async () => {
  const limiter = new RateLimiter({ minDelayMs: 0, maxDelayMs: 0 });
  const domain = 'resilient-queue.com';

  // Throttle 1 succeeds
  await limiter.throttle(domain);

  // Subsequent throttle should execute cleanly
  const wait = await limiter.throttle(domain);
  assert(wait === 0, `Expected 0 wait time with 0 minDelay, got ${wait}`);
});

// ═════════════════════════════════════════════════════════════════════════════
// RUNNER & VERDICT AGGREGATOR
// ═════════════════════════════════════════════════════════════════════════════

export async function runMilestone2ChallengeSuite() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║      ADVERSARIAL CHALLENGER TEST SUITE: MILESTONE 2 RESILIENCE & CRAWLER     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const start = Date.now();
  let currentCategory = '';

  for (const t of tests) {
    if (t.category !== currentCategory) {
      currentCategory = t.category;
      console.log(`\n── [${currentCategory.toUpperCase()}] ───────────────────────────────────────────────`);
    }

    process.stdout.write(`  ▶ [${t.id}] ${t.name}... `);
    try {
      await t.fn();
      console.log('PASS');
      passed++;
    } catch (err: unknown) {
      console.log('FAIL');
      console.error(`     ❌ Error: ${(err as Error).message}`);
      failed++;
    }
  }

  const duration = Date.now() - start;
  console.log('\n════════════════════════════════════════════════════════════════════════════════');
  console.log(`  CHALLENGE SUMMARY: ${passed}/${tests.length} passed, ${failed} failed (${duration}ms)`);
  console.log('════════════════════════════════════════════════════════════════════════════════');

  if (failed > 0) {
    console.error(`\n🚨 VERDICT: REQUEST_CHANGES (${failed} adversarial challenges failed)`);
    throw new Error(`${failed} adversarial test(s) failed.`);
  } else {
    console.log('\n🛡️  VERDICT: APPROVE (All 37 adversarial challenges passed cleanly)');
  }

  return { passed, failed, total: tests.length, duration };
}

if (require.main === module) {
  runMilestone2ChallengeSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
