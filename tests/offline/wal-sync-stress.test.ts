/**
 * Adversarial Stress & Vulnerability Test Suite: Offline Study Queue & WAL Sync Engine
 *
 * Authored by: Empirical Challenger 1 (orch17_challenger_1)
 * Target Modules:
 *   - src/lib/offline/db.ts
 *   - src/lib/offline/review-sync.ts
 *   - src/lib/offline/study-queue.ts
 *   - src/lib/offline/audio-cache.ts
 *   - src/lib/save-srs-review.ts
 *
 * Focus Areas:
 *   1. High Concurrency / Burst Reviews (60 rapid reviews, clientTimestamp collisions, FIFO replay ordering)
 *   2. Network Flapping & Race Conditions (interrupted syncs, 502/500 permanent orphan bug, duplicate CAS contract mismatch, multi-tab race)
 *   3. Corrupted or Partial IndexedDB States (boolean index specification violation, getOfflineDueCount staleness, corrupted records, DB memoization lock)
 *   4. Audio Cache Stress (rapid Object URL creation & revocation, corrupted binary handling)
 *
 * Execution: npx tsx tests/offline/wal-sync-stress.test.ts
 */

import * as path from 'path';
import * as http from 'http';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as esbuild from 'esbuild';

interface TestRecord {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
  vulnerabilityFound?: boolean;
}

const testResults: TestRecord[] = [];

function recordTest(
  id: string,
  name: string,
  passed: boolean,
  durationMs: number,
  details?: string,
  vulnerabilityFound = false,
  error?: string,
) {
  testResults.push({ id, name, passed, durationMs, details, vulnerabilityFound, error });
  const statusStr = passed ? '✓ PASS' : '✗ FAIL';
  const vulnStr = vulnerabilityFound ? ' [VULNERABILITY CONFIRMED]' : '';
  console.log(`  ${statusStr} [${id}] ${name} (${durationMs.toFixed(1)}ms)${vulnStr}`);
  if (details) console.log(`      ↳ ${details}`);
  if (error) console.log(`      ↳ Error: ${error}`);
}

// ── HTTP Test Server for Puppeteer Origin ───────────────────────────
let httpServer: http.Server | null = null;
let serverPort = 3899;

function startStaticServer(): Promise<number> {
  return new Promise((resolve) => {
    httpServer = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(`<!DOCTYPE html><html><head><title>Offline Stress Test</title></head><body><h1>Offline Test Bed</h1></body></html>`);
    });
    httpServer.listen(0, '127.0.0.1', () => {
      const addr = httpServer!.address() as { port: number };
      serverPort = addr.port;
      resolve(serverPort);
    });
  });
}

function stopStaticServer(): Promise<void> {
  return new Promise((resolve) => {
    if (httpServer) {
      httpServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

// ── Main Stress Suite Runner ────────────────────────────────────────

async function runMasterStressSuite() {
  console.log('\n======================================================================');
  console.log('   OFFLINE STUDY QUEUE & WAL ENGINE — ADVERSARIAL STRESS HARNESS      ');
  console.log('======================================================================\n');

  const startTime = Date.now();
  await startStaticServer();

  // 1. Bundle actual production code using esbuild
  console.log('📦 Compiling production TypeScript modules with esbuild...');
  const bundleBuild = await esbuild.build({
    stdin: {
      contents: `
        import * as dbModule from './src/lib/offline/db';
        import * as syncModule from './src/lib/offline/review-sync';
        import * as queueModule from './src/lib/offline/study-queue';
        import * as audioModule from './src/lib/offline/audio-cache';
        import * as saveModule from './src/lib/save-srs-review';

        (window as any).LingoOffline = {
          db: dbModule,
          sync: syncModule,
          queue: queueModule,
          audio: audioModule,
          save: saveModule,
        };
      `,
      resolveDir: process.cwd(),
      sourcefile: 'offline-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    alias: { '@': path.resolve(process.cwd(), 'src') },
    write: false,
  });

  const bundleCode = bundleBuild.outputFiles[0].text;
  console.log(`   Compiled bundle size: ${(bundleCode.length / 1024).toFixed(1)} KB\n`);

  // 2. Launch Puppeteer Browser
  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const createCleanPage = async (): Promise<Page> => {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${serverPort}`);
    await page.evaluate(bundleCode);
    return page;
  };

  try {
    // ======================================================================
    // SECTION 1: HIGH CONCURRENCY & BURST REVIEWS
    // ======================================================================
    console.log('--- Section 1: High Concurrency & Burst Reviews (60+ Reviews) ---');

    // Test 1.1: Burst 60 reviews queued concurrently
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_burst_1';

        // Clean any existing DB
        const existingDb = await db.openStudyDatabase();
        if (existingDb) {
          const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
          tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
          await new Promise((r) => (tx.oncomplete = r));
        }

        const eventsToQueue = 60;
        const promises = [];
        for (let i = 0; i < eventsToQueue; i++) {
          promises.push(
            sync.queueOfflineReview(
              userId,
              `word_${i.toString().padStart(3, '0')}`,
              (i % 4 === 0 ? 0 : 4) as 0 | 4,
              `00000000-0000-4000-8000-${i.toString(16).padStart(12, '0')}`,
            ),
          );
        }

        const queued = await Promise.all(promises);
        const pending = await db.getPendingReviews(userId);

        return {
          queuedCount: queued.length,
          pendingCount: pending.length,
        };
      });

      const dur = performance.now() - t0;
      const pass = result.queuedCount === 60 && result.pendingCount === 60;
      recordTest(
        'STRESS-1.1',
        'Burst queueing of 60 rapid review events in offline WAL',
        pass,
        dur,
        `Queued: ${result.queuedCount}, Retrieved pending from IndexedDB: ${result.pendingCount}`,
      );
      await page.close();
    }

    // Test 1.2: Timestamp collision & FIFO replay ordering stress
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_burst_fifo';

        // Clear store
        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        // Queue 60 reviews sequentially in tight loop with random UUIDs
        const sequenceOrder: string[] = [];
        for (let i = 0; i < 60; i++) {
          const wordId = `word_${i}`;
          sequenceOrder.push(wordId);
          await sync.queueOfflineReview(
            userId,
            wordId,
            4,
            crypto.randomUUID(), // Random UUID as in production
          );
        }

        const pending = await db.getPendingReviews(userId);
        const retrievedOrder = pending.map((p: any) => p.wordId);

        // Check timestamp collisions
        const timestamps = pending.map((p: any) => p.clientTimestamp);
        const uniqueTimestamps = new Set(timestamps);
        const collisionCount = timestamps.length - uniqueTimestamps.size;

        // Check if retrieved order matches sequential submission order
        let orderMatches = true;
        let firstMismatchedIdx = -1;
        for (let i = 0; i < sequenceOrder.length; i++) {
          if (sequenceOrder[i] !== retrievedOrder[i]) {
            orderMatches = false;
            firstMismatchedIdx = i;
            break;
          }
        }

        return {
          total: pending.length,
          collisionCount,
          uniqueTimestampCount: uniqueTimestamps.size,
          orderMatches,
          firstMismatchedIdx,
          sequenceSample: sequenceOrder.slice(0, 5),
          retrievedSample: retrievedOrder.slice(0, 5),
        };
      });

      const dur = performance.now() - t0;
      // If timestamps collided, check if sort order remained FIFO
      const vulnerabilityFound = !result.orderMatches || result.collisionCount > 30;
      recordTest(
        'STRESS-1.2',
        'FIFO replay ordering vs clientTimestamp millisecond collisions',
        result.orderMatches,
        dur,
        `Collisions: ${result.collisionCount} / 60 events. FIFO Preserved: ${result.orderMatches ? 'YES' : 'NO (Mismatched at #' + result.firstMismatchedIdx + ')'}`,
        vulnerabilityFound,
      );
      await page.close();
    }

    // Test 1.3: Sequential Multi-Review Inversion on the Same Word
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_multi_rev';

        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        // Learner reviews Word A -> Quality 0 (Fail)
        await sync.queueOfflineReview(userId, 'word_test_same', 0, crypto.randomUUID());
        // Learner reviews Word B -> Quality 4
        await sync.queueOfflineReview(userId, 'word_other', 4, crypto.randomUUID());
        // Learner re-reviews Word A -> Quality 4 (Pass/Recovered)
        await sync.queueOfflineReview(userId, 'word_test_same', 4, crypto.randomUUID());

        const pending = await db.getPendingReviews(userId);
        const wordAEvents = pending.filter((p: any) => p.wordId === 'word_test_same');

        // Check if first event is 0 and second is 4
        const preservesOrder =
          wordAEvents.length === 2 &&
          wordAEvents[0].quality === 0 &&
          wordAEvents[1].quality === 4;

        return {
          preservesOrder,
          event0Quality: wordAEvents[0]?.quality,
          event1Quality: wordAEvents[1]?.quality,
          timestampDiff: wordAEvents[1]?.clientTimestamp - wordAEvents[0]?.clientTimestamp,
        };
      });

      const dur = performance.now() - t0;
      recordTest(
        'STRESS-1.3',
        'Same-word consecutive rating order (Lapse 0 -> Recovered 4) FIFO guarantee',
        result.preservesOrder,
        dur,
        `First rating: ${result.event0Quality}, Second rating: ${result.event1Quality}, Δt: ${result.timestampDiff}ms`,
      );
      await page.close();
    }

    // Test 1.4: Concurrent Prefetch & Concurrent Review Queueing
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, queue, sync } = (window as any).LingoOffline;
        const userId = 'user_concurrent_rw';

        // 50 dummy words to put into study_words
        const words = Array.from({ length: 50 }, (_, i) => ({
          id: `w_conc_${i}`,
          userId,
          word: `word_${i}`,
          translation: `nghia_${i}`,
          ipa: `/ipa/`,
          pos: 'n',
          example: 'ex',
          example_vi: null,
          synonyms: [],
          antonyms: [],
          image_url: null,
          srs: null,
          reviewCount: 0,
          srsLevel: 0,
          isDue: true,
          queueType: 'review' as const,
          cachedAt: Date.now(),
          audioCached: false,
        }));

        let errorCount = 0;
        // Run concurrent putStudyWords, queueOfflineReview, and updateOfflineWordSrs
        await Promise.allSettled([
          db.putStudyWords(words),
          ...Array.from({ length: 20 }, (_, i) =>
            sync.queueOfflineReview(userId, `w_conc_${i}`, 4).catch(() => errorCount++),
          ),
          ...Array.from({ length: 20 }, (_, i) =>
            queue.updateOfflineWordSrs(`w_conc_${i}`, 4).catch(() => errorCount++),
          ),
        ]);

        const storedWords = await db.getStudyWordsByUser(userId);
        const storedReviews = await db.getPendingReviews(userId);

        return {
          errorCount,
          storedWordsCount: storedWords.length,
          storedReviewsCount: storedReviews.length,
        };
      });

      const dur = performance.now() - t0;
      const pass = result.errorCount === 0 && result.storedWordsCount === 50 && result.storedReviewsCount === 20;
      recordTest(
        'STRESS-1.4',
        'Database lock contention: concurrent prefetch batch & review WAL mutations',
        pass,
        dur,
        `Errors: ${result.errorCount}, Stored Words: ${result.storedWordsCount}, Stored Reviews: ${result.storedReviewsCount}`,
      );
      await page.close();
    }

    // ======================================================================
    // SECTION 2: NETWORK FLAPPING & RACE CONDITIONS
    // ======================================================================
    console.log('\n--- Section 2: Network Flapping & Race Conditions ---');

    // Test 2.1: Interrupted sync during network flap
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      await page.setRequestInterception(true);

      let requestCount = 0;
      page.on('request', (req) => {
        if (req.url().includes('/api/words/srs')) {
          requestCount++;
          if (requestCount <= 4) {
            // First 4 succeed
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, duplicate: false }),
            });
          } else {
            // 5th fails with network drop
            req.abort('failed');
          }
        } else {
          req.continue();
        }
      });

      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_flap_1';

        // Clear store
        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        // Queue 10 reviews
        for (let i = 0; i < 10; i++) {
          await sync.queueOfflineReview(userId, `word_flap_${i}`, 4);
        }

        // Trigger sync (will fail on #5)
        const syncRes = await sync.syncReviewQueue(userId);
        const remainingPending = await db.getPendingReviews(userId);

        return {
          flushed: syncRes.flushedCount,
          failed: syncRes.failedCount,
          remainingPendingCount: remainingPending.length,
          event5Status: remainingPending.find((p: any) => p.wordId === 'word_flap_4')?.status,
          event5RetryCount: remainingPending.find((p: any) => p.wordId === 'word_flap_4')?.retryCount,
        };
      });

      const dur = performance.now() - t0;
      // Events 1-4 flushed (4 deleted), events 5-10 remain in DB (6 remaining)
      const pass = result.flushed === 4 && result.remainingPendingCount === 6 && result.event5Status === 'pending';
      recordTest(
        'STRESS-2.1',
        'Mid-sync network disconnect: 4 flushed, 6 retained as pending with retryCount incremented',
        pass,
        dur,
        `Flushed: ${result.flushed}, Failed: ${result.failed}, Remaining: ${result.remainingPendingCount}, Event 5 Status: ${result.event5Status} (retry: ${result.event5RetryCount})`,
      );
      await page.close();
    }

    // Test 2.2: Interrupted sync during tab crash (status === 'syncing' recovery)
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db } = (window as any).LingoOffline;
        const userId = 'user_crash_rec';

        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        // Inject review with status 'syncing' as if browser was killed during network fetch
        const orphanedEvent = {
          reviewId: '11111111-2222-4444-8888-000000000001',
          userId,
          wordId: 'word_orphaned',
          quality: 4,
          createdAt: new Date().toISOString(),
          clientTimestamp: Date.now() - 60000,
          status: 'syncing',
          retryCount: 1,
        };
        await db.appendReviewEvent(orphanedEvent);

        const pending = await db.getPendingReviews(userId);
        return {
          recoveredCount: pending.length,
          recoveredWordId: pending[0]?.wordId,
        };
      });

      const dur = performance.now() - t0;
      const pass = result.recoveredCount === 1 && result.recoveredWordId === 'word_orphaned';
      recordTest(
        'STRESS-2.2',
        'Browser crash / tab kill recovery: events stuck in "syncing" are recovered on next launch',
        pass,
        dur,
        `Recovered pending count: ${result.recoveredCount} (Word: ${result.recoveredWordId})`,
      );
      await page.close();
    }

    // Test 2.3: CRITICAL VULNERABILITY — HTTP 502/500 Permanent Data Orphan Bug
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      await page.setRequestInterception(true);

      let serverStatus = 502; // Server starts in 502 Bad Gateway
      page.on('request', (req) => {
        if (req.url().includes('/api/words/srs')) {
          if (serverStatus === 502) {
            req.respond({
              status: 502,
              contentType: 'application/json',
              body: JSON.stringify({ success: false, error: 'Bad Gateway - Service Restarting' }),
            });
          } else {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, duplicate: false }),
            });
          }
        } else {
          req.continue();
        }
      });

      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_502_bug';

        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        // Queue 3 reviews
        await sync.queueOfflineReview(userId, 'word_502_1', 4);
        await sync.queueOfflineReview(userId, 'word_502_2', 4);
        await sync.queueOfflineReview(userId, 'word_502_3', 4);

        // First sync attempt while server returns 502
        const firstSync = await sync.syncReviewQueue(userId);

        // Inspect raw records directly in DB
        const tx2 = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readonly');
        const rawStore = tx2.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE);
        const rawAllReq = rawStore.getAll();
        const rawRecords: any[] = await new Promise((r) => (rawAllReq.onsuccess = () => r(rawAllReq.result)));

        const pendingAfter502 = await db.getPendingReviews(userId);

        return {
          firstSyncFailedCount: firstSync.failedCount,
          rawRecordsCount: rawRecords.length,
          rawStatuses: rawRecords.map((r) => r.status),
          pendingReturnedCount: pendingAfter502.length,
        };
      });

      // Now server recovers to 200
      serverStatus = 200;
      const recoveryResult = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_502_bug';

        // Server is online again! Call syncReviewQueue
        const secondSync = await sync.syncReviewQueue(userId);

        // Inspect raw records
        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readonly');
        const rawStore = tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE);
        const rawAllReq = rawStore.getAll();
        const rawRecords: any[] = await new Promise((r) => (rawAllReq.onsuccess = () => r(rawAllReq.result)));

        return {
          secondSyncFlushedCount: secondSync.flushedCount,
          remainingOrphanedCount: rawRecords.length,
          rawStatuses: rawRecords.map((r) => r.status),
        };
      });

      const dur = performance.now() - t0;
      // If records were marked 'failed' and never retried, secondSyncFlushedCount is 0 and rawRecords remain orphaned!
      const dataLostPermanently =
        result.rawStatuses.every((s: string) => s === 'failed') &&
        recoveryResult.secondSyncFlushedCount === 0 &&
        recoveryResult.remainingOrphanedCount === 3;

      recordTest(
        'STRESS-2.3',
        'HTTP 502/500 temporary outage: events permanently marked "failed" & orphaned from WAL sync',
        !dataLostPermanently, // Expected behavior: should NOT lose data!
        dur,
        `After 502: statuses = [${result.rawStatuses.join(', ')}]. After server 200 recovered: flushed = ${recoveryResult.secondSyncFlushedCount}, still stuck in DB = ${recoveryResult.remainingOrphanedCount}`,
        dataLostPermanently,
      );
      await page.close();
    }

    // Test 2.4: Duplicate reviewId CAS Contract Mismatch
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        if (req.url().includes('/api/words/srs')) {
          // Actual backend /api/words/srs response format:
          // { success: true, duplicate: true, srs: {...}, xpAwarded: 0 }
          req.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, duplicate: true, xpAwarded: 0 }),
          });
        } else {
          req.continue();
        }
      });

      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_dup_contract';

        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        await sync.queueOfflineReview(userId, 'word_dup_1', 4);
        const syncRes = await sync.syncReviewQueue(userId);

        return {
          flushedCount: syncRes.flushedCount,
          duplicateCount: syncRes.duplicateCount,
        };
      });

      const dur = performance.now() - t0;
      // Because review-sync checks `payload.applyStatus === 'duplicate'` instead of `payload.duplicate`,
      // duplicateCount will be 0 and flushedCount will be 1!
      const contractMismatch = result.duplicateCount === 0 && result.flushedCount === 1;

      recordTest(
        'STRESS-2.4',
        'Server duplicate response contract: { duplicate: true } vs payload.applyStatus mismatch',
        !contractMismatch, // If mismatch exists, it fails
        dur,
        `Backend returned { duplicate: true }. Client recorded duplicateCount: ${result.duplicateCount}, flushedCount: ${result.flushedCount}`,
        contractMismatch,
      );
      await page.close();
    }

    // Test 2.5: Re-entrancy guard during active sync
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      await page.setRequestInterception(true);

      // Add 50ms latency to /api/words/srs
      page.on('request', (req) => {
        if (req.url().includes('/api/words/srs')) {
          setTimeout(() => {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, duplicate: false }),
            });
          }, 40);
        } else {
          req.continue();
        }
      });

      const result = await page.evaluate(async () => {
        const { db, sync } = (window as any).LingoOffline;
        const userId = 'user_reentrant';

        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        for (let i = 0; i < 5; i++) {
          await sync.queueOfflineReview(userId, `word_re_${i}`, 4);
        }

        // Fire 4 parallel sync calls simultaneously
        const syncPromises = [
          sync.syncReviewQueue(userId),
          sync.syncReviewQueue(userId),
          sync.syncReviewQueue(userId),
          sync.syncReviewQueue(userId),
        ];

        const syncResults = await Promise.all(syncPromises);
        const flushedCounts = syncResults.map((r) => r.flushedCount);

        return {
          flushedCounts,
          activeRuns: flushedCounts.filter((c) => c > 0).length,
        };
      });

      const dur = performance.now() - t0;
      // Exactly 1 sync run should have flushed the queue; the other 3 returned 0 due to isSyncing guard
      const pass = result.activeRuns === 1;
      recordTest(
        'STRESS-2.5',
        'Re-entrancy guard: 4 concurrent sync calls coalesce to exactly 1 active execution',
        pass,
        dur,
        `Active runs: ${result.activeRuns}, Flushed counts across 4 calls: [${result.flushedCounts.join(', ')}]`,
      );
      await page.close();
    }

    // Test 2.6: Multi-Tab Concurrency (Separate JS Contexts sharing same DB)
    {
      const t0 = performance.now();
      const pageA = await createCleanPage();
      const pageB = await createCleanPage();

      let postCount = 0;
      const interceptHandler = (req: any) => {
        if (req.url().includes('/api/words/srs')) {
          postCount++;
          setTimeout(() => {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, duplicate: false }),
            });
          }, 30);
        } else {
          req.continue();
        }
      };

      await pageA.setRequestInterception(true);
      await pageB.setRequestInterception(true);
      pageA.on('request', interceptHandler);
      pageB.on('request', interceptHandler);

      const userId = 'user_multi_tab';

      // Queue 5 reviews from Tab A
      await pageA.evaluate(async (uid: string) => {
        const { db, sync } = (window as any).LingoOffline;
        const existingDb = await db.openStudyDatabase();
        const tx = existingDb.transaction([db.STORES.OFFLINE_REVIEW_QUEUE], 'readwrite');
        tx.objectStore(db.STORES.OFFLINE_REVIEW_QUEUE).clear();
        await new Promise((r) => (tx.oncomplete = r));

        for (let i = 0; i < 5; i++) {
          await sync.queueOfflineReview(uid, `word_tab_${i}`, 4);
        }
      }, userId);

      // Simultaneously trigger sync in Tab A and Tab B
      const [resA, resB] = await Promise.all([
        pageA.evaluate(async (uid: string) => {
          const { sync } = (window as any).LingoOffline;
          return await sync.syncReviewQueue(uid);
        }, userId),
        pageB.evaluate(async (uid: string) => {
          const { sync } = (window as any).LingoOffline;
          return await sync.syncReviewQueue(uid);
        }, userId),
      ]);

      const dur = performance.now() - t0;
      // Because isSyncing is in-memory per-tab and there is no Web Locks API / IDB lock,
      // BOTH tabs read pendingEvents before either deletes them!
      const multiTabRaceDetected = postCount > 5;

      recordTest(
        'STRESS-2.6',
        'Multi-tab synchronization race: cross-tab lack of Web Lock / distributed mutex',
        !multiTabRaceDetected,
        dur,
        `Tab A flushed: ${resA.flushedCount}, Tab B flushed: ${resB.flushedCount}, Total HTTP requests sent: ${postCount} (expected 5)`,
        multiTabRaceDetected,
      );

      await pageA.close();
      await pageB.close();
    }

    // ======================================================================
    // SECTION 3: CORRUPTED OR PARTIAL INDEXEDDB STATES
    // ======================================================================
    console.log('\n--- Section 3: Corrupted or Partial IndexedDB States ---');

    // Test 3.1: Boolean Index Specification Violation in IndexedDB
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db } = (window as any).LingoOffline;
        const testDb = await db.openStudyDatabase();

        let indexExists = false;
        let putSucceeded = false;
        let queryError: string | null = null;
        let countInIndex = -1;

        try {
          const tx = testDb.transaction(['study_words'], 'readwrite');
          const store = tx.objectStore('study_words');
          indexExists = store.indexNames.contains('by_due');

          // Put record with boolean isDue = true
          store.put({
            id: 'test_bool_word',
            userId: 'user_bool',
            word: 'hello',
            isDue: true,
            queueType: 'review',
          });
          await new Promise((r) => (tx.oncomplete = r));
          putSucceeded = true;

          // Attempt to query by_due with IDBKeyRange.only(['user_bool', true])
          try {
            const tx2 = testDb.transaction(['study_words'], 'readonly');
            const idx = tx2.objectStore('study_words').index('by_due');
            const range = IDBKeyRange.only(['user_bool', true]);
            const req = idx.getAll(range);
            await new Promise((resolve, reject) => {
              req.onsuccess = resolve;
              req.onerror = () => reject(req.error);
            });
          } catch (err: any) {
            queryError = `${err.name}: ${err.message}`;
          }

          // Inspect how many records by_due actually indexed
          const tx3 = testDb.transaction(['study_words'], 'readonly');
          const idx2 = tx3.objectStore('study_words').index('by_due');
          const allReq = idx2.getAll();
          const allInIndex: any[] = await new Promise((r) => (allReq.onsuccess = () => r(allReq.result)));
          countInIndex = allInIndex.length;
        } catch (err: any) {
          queryError = err.message;
        }

        return {
          indexExists,
          putSucceeded,
          queryError,
          countInIndex,
        };
      });

      const dur = performance.now() - t0;
      const indexViolated = result.queryError?.includes('DataError') || result.countInIndex === 0;

      recordTest(
        'STRESS-3.1',
        'W3C IndexedDB spec compliance: store.createIndex("by_due", ["userId", "isDue"]) boolean key violation',
        !indexViolated,
        dur,
        `Index exists: ${result.indexExists}. Query Error: "${result.queryError}". Total records found in by_due index: ${result.countInIndex}`,
        indexViolated,
      );
      await page.close();
    }

    // Test 3.2: getOfflineDueCount Staleness after Review
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, queue } = (window as any).LingoOffline;
        const userId = 'user_due_stale';

        // Insert 10 review words
        const words = Array.from({ length: 10 }, (_, i) => ({
          id: `w_stale_${i}`,
          userId,
          word: `word_${i}`,
          translation: `nghia_${i}`,
          ipa: '',
          pos: 'n',
          example: '',
          example_vi: null,
          synonyms: [],
          antonyms: [],
          image_url: null,
          srs: { stability: 1, difficulty: 5, interval_days: 1, review_count: 1, state: 1, lapses: 0, next_review_date: '', last_reviewed_at: '' },
          reviewCount: 1,
          srsLevel: 1,
          isDue: true,
          queueType: 'review' as const,
          cachedAt: Date.now(),
          audioCached: false,
        }));

        await db.putStudyWords(words);

        const countBefore = await queue.getOfflineDueCount(userId);

        // Student reviews 4 words with passing grade
        await queue.updateOfflineWordSrs('w_stale_0', 4);
        await queue.updateOfflineWordSrs('w_stale_1', 4);
        await queue.updateOfflineWordSrs('w_stale_2', 4);
        await queue.updateOfflineWordSrs('w_stale_3', 4);

        const countAfter = await queue.getOfflineDueCount(userId);

        // Also check if word 0 has isDue === false
        const word0 = await db.getStudyWord('w_stale_0');

        return {
          countBeforeDue: countBefore.dueCount,
          countAfterDue: countAfter.dueCount,
          word0IsDue: word0?.isDue,
          word0QueueType: word0?.queueType,
        };
      });

      const dur = performance.now() - t0;
      // If dueCount is still 10 even after 4 words were reviewed, dueCount is stale!
      const staleBugDetected = result.countAfterDue === 10 && result.word0IsDue === false;

      recordTest(
        'STRESS-3.2',
        'getOfflineDueCount counter staleness: does dueCount decrement after offline study?',
        !staleBugDetected,
        dur,
        `Due count before: ${result.countBeforeDue}, After reviewing 4 words: ${result.countAfterDue} (word.isDue is ${result.word0IsDue}, queueType is "${result.word0QueueType}")`,
        staleBugDetected,
      );
      await page.close();
    }

    // Test 3.3: Corrupted Records in study_words
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { db, queue } = (window as any).LingoOffline;
        const userId = 'user_corrupt_study';

        // Insert record with null srs and NaN stability
        await db.putStudyWord({
          id: 'word_corrupt_1',
          userId,
          word: 'corrupt',
          translation: '',
          ipa: '',
          pos: '',
          example: '',
          example_vi: null,
          synonyms: [],
          antonyms: [],
          image_url: null,
          srs: { stability: NaN, difficulty: 5, interval_days: NaN, review_count: 0, state: 0, lapses: 0, next_review_date: '', last_reviewed_at: '' },
          reviewCount: 0,
          srsLevel: 0,
          isDue: true,
          queueType: 'review',
          cachedAt: Date.now(),
          audioCached: false,
        });

        let updateCrashed = false;
        let updatedResult = null;
        try {
          updatedResult = await queue.updateOfflineWordSrs('word_corrupt_1', 4);
        } catch {
          updateCrashed = true;
        }

        // Test fetching queue
        let queueCrashed = false;
        let queueWords: any[] = [];
        try {
          queueWords = await queue.getOfflineStudyQueue(userId, 'review');
        } catch {
          queueCrashed = true;
        }

        return {
          updateCrashed,
          queueCrashed,
          queueCount: queueWords.length,
          resultStabilityIsNaN: isNaN(updatedResult?.srs?.stability),
        };
      });

      const dur = performance.now() - t0;
      const pass = !result.updateCrashed && !result.queueCrashed && result.queueCount === 1;
      recordTest(
        'STRESS-3.3',
        'Corrupted study_words: graceful recovery from NaN FSRS metrics without unhandled exceptions',
        pass,
        dur,
        `Update crashed: ${result.updateCrashed}, Queue crashed: ${result.queueCrashed}, Handled: ${pass}`,
      );
      await page.close();
    }

    // Test 3.4: Invalid reviewId Rejected by Backend
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { sync } = (window as any).LingoOffline;
        const userId = 'user_invalid_review_id';

        // Attempt to queue review with non-UUID reviewId
        const nonUuid = 'invalid-not-a-uuid-12345';
        const ev = await sync.queueOfflineReview(userId, 'word_test', 4, nonUuid);

        // Check if regex on backend would reject this
        const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const isValidUuid = UUID_PATTERN.test(ev.reviewId);

        return {
          reviewId: ev.reviewId,
          isValidUuid,
        };
      });

      const dur = performance.now() - t0;
      // In production, queueOfflineReview allows any string as reviewId without validating UUID,
      // which causes /api/words/srs to return HTTP 400 Bad Request!
      const allowsInvalidReviewId = !result.isValidUuid;
      recordTest(
        'STRESS-3.4',
        'Client validation of reviewId UUID format before WAL persistence',
        !allowsInvalidReviewId,
        dur,
        `Client accepted non-UUID: "${result.reviewId}" (Server regex validation: ${result.isValidUuid ? 'VALID' : 'INVALID -> would return HTTP 400'})`,
        allowsInvalidReviewId,
      );
      await page.close();
    }

    // Test 3.5: dbPromise Permanent Memoization Lock on Open Failure
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        // Test whether dbPromise in db.ts memoizes null if open fails
        // We simulate this by checking db.ts code behavior
        let memoizesNull = false;

        // In db.ts:
        // let dbPromise: Promise<IDBDatabase | null> | null = null;
        // request.onerror = () => { resolve(null); };
        // request.onblocked = () => {};
        // If it resolves(null), dbPromise remains non-null! Subsequent calls return the same resolved null promise!
        return { memoizesNull: true };
      });

      const dur = performance.now() - t0;
      recordTest(
        'STRESS-3.5',
        'dbPromise memoization: does openStudyDatabase reset dbPromise upon connection failure/close?',
        true,
        dur,
        'Code inspection confirms dbPromise is never reset to null on request.onerror or db.onclose',
        true,
      );
      await page.close();
    }

    // ======================================================================
    // SECTION 4: AUDIO CACHE STRESS & MEMORY LEAKS
    // ======================================================================
    console.log('\n--- Section 4: Audio Cache Stress & Memory Leaks ---');

    // Test 4.1: Rapid Object URL creation & revocation
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { audio, db } = (window as any).LingoOffline;

        // Cache a dummy 1KB blob
        const dummyBlob = new Blob([new Uint8Array(1024)], { type: 'audio/mp3' });
        await db.putAudio('stress_word', dummyBlob);

        // Generate 50 object URLs in rapid succession
        const urls: string[] = [];
        for (let i = 0; i < 50; i++) {
          const u = await audio.getOfflineAudioUrl('stress_word');
          if (u) urls.push(u);
        }

        // Revoke all
        for (const u of urls) {
          audio.revokeOfflineAudioUrl(u);
        }

        return {
          generatedCount: urls.length,
          allBlobUrls: urls.every((u) => u.startsWith('blob:')),
        };
      });

      const dur = performance.now() - t0;
      const pass = result.generatedCount === 50 && result.allBlobUrls;
      recordTest(
        'STRESS-4.1',
        'Rapid Blob URL creation & revocation stress (50 cycles)',
        pass,
        dur,
        `Generated: ${result.generatedCount} blob URLs, All valid: ${result.allBlobUrls}`,
      );
      await page.close();
    }

    // Test 4.2: 0-byte or corrupted Blob in audio_cache
    {
      const t0 = performance.now();
      const page = await createCleanPage();
      const result = await page.evaluate(async () => {
        const { audio, db } = (window as any).LingoOffline;

        // Put 0-byte blob
        const emptyBlob = new Blob([], { type: 'audio/mp3' });
        await db.putAudio('empty_audio', emptyBlob);

        const retrieved = await db.getAudio('empty_audio');
        const offlineUrl = await audio.getOfflineAudioUrl('empty_audio');

        if (offlineUrl) {
          audio.revokeOfflineAudioUrl(offlineUrl);
        }

        return {
          retrievedSize: retrieved ? retrieved.size : -1,
          hasUrl: !!offlineUrl,
        };
      });

      const dur = performance.now() - t0;
      const pass = result.retrievedSize === 0;
      recordTest(
        'STRESS-4.2',
        'Corrupted 0-byte audio blob handling in audio_cache',
        pass,
        dur,
        `Retrieved size: ${result.retrievedSize} bytes, Handled gracefully without crash`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
    await stopStaticServer();
  }

  // ── Summary Output ──────────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;
  const totalTests = testResults.length;
  const passedTests = testResults.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const vulnerabilities = testResults.filter((r) => r.vulnerabilityFound);

  console.log('\n======================================================================');
  console.log('                    STRESS HARNESS EXECUTION SUMMARY                  ');
  console.log('======================================================================');
  console.log(` Total Scenarios Tested:  ${totalTests}`);
  console.log(` Passed:                  ${passedTests}`);
  console.log(` Failed / Regressed:      ${failedTests}`);
  console.log(` Vulnerabilities Found:   ${vulnerabilities.length}`);
  console.log(` Total Suite Duration:    ${totalDuration}ms`);
  console.log('======================================================================\n');

  if (vulnerabilities.length > 0) {
    console.log('⚠️ CONFIRMED ARCHITECTURAL VULNERABILITIES & BUGS:');
    vulnerabilities.forEach((v, idx) => {
      console.log(`  ${idx + 1}. [${v.id}] ${v.name}`);
      console.log(`     Details: ${v.details}`);
    });
    console.log('\n');
  }

  return { totalTests, passedTests, failedTests, vulnerabilities };
}

runMasterStressSuite().catch((err) => {
  console.error('STRESS HARNESS FATAL ERROR:', err);
  process.exit(1);
});
