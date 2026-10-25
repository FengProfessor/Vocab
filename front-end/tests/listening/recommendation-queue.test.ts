/**
 * Unit & Integration Test Suite for Recommendation & Queue Engine.
 * Tests:
 * 1. Video Watch Progress & Completion State (>=90%, ENDED, attempts, sticky completion, SSR fallback)
 * 2. Smart Queue Reordering (Unwatched -> In-Progress -> Completed, stable tie-breaking, inProgressFirst option)
 * 3. Daily 3-Video Recommendation Engine (Mulberry32 PRNG determinism, topic diversity, level diversity, unwatched priority, 100% completion fallback, edge cases)
 * 4. Dual module re-exports (src/lib/listening-recommendation.ts & src/lib/listening-queue.ts)
 *
 * Usage:
 *   npx tsx tests/listening/recommendation-queue.test.ts
 */

import videosData from '../../src/data/listening/videos-index.json';
import type { ListeningVideoIndexItem } from '../../src/types/listening';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';
import {
  getVideoWatchProgress,
  saveVideoWatchProgress,
  getAllVideoWatchProgress,
  isVideoCompleted,
  getVideoWatchStatus,
  reorderShelfVideos,
  sortShelfVideos,
  getDailyRecommendedVideos,
  getDailyRecommendations,
  getDailySeed,
  hashDateString,
  createMulberry32,
  shuffleArray,
  COMPLETION_THRESHOLD_PERCENT,
  IN_PROGRESS_MIN_PERCENT,
  WATCH_STORAGE_PREFIX,
  ATTEMPT_STORAGE_PREFIX,
} from '../../src/lib/listening-recommendation';

import * as queueModule from '../../src/lib/listening-queue';

const allVideos = videosData as unknown as ListeningVideoIndexItem[];

export async function runRecommendationQueueTests(runnerInstance?: TestRunner) {
  const runner = runnerInstance || new TestRunner();

  // ══════════════════════════════════════════════════════════════════════════
  // Section 1: Video Watch Progress & Completion Criteria
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('M1.1: Video Watch Progress & Completion Criteria', () => {});

  await runner.it('W1.1: Video watch percent >= 90 is automatically marked completed', () => {
    setupMockBrowserEnvironment();
    try {
      const res90 = saveVideoWatchProgress({
        videoId: 'v-test-1',
        currentTime: 90,
        duration: 100,
      });
      expect(res90.percent).toBe(90);
      expect(res90.completed).toBe(true);
      expect(res90.completedAt).toBeDefined();

      const retrieved = getVideoWatchProgress('v-test-1');
      expect(retrieved?.completed).toBe(true);
      expect(getVideoWatchStatus('v-test-1')).toBe('completed');
      expect(isVideoCompleted('v-test-1')).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.2: Video watch percent 89 is classified as in_progress and not completed', () => {
    setupMockBrowserEnvironment();
    try {
      const res89 = saveVideoWatchProgress({
        videoId: 'v-test-2',
        currentTime: 89,
        duration: 100,
      });
      expect(res89.percent).toBe(89);
      expect(res89.completed).toBe(false);
      expect(res89.completedAt).toBeUndefined();

      expect(getVideoWatchStatus('v-test-2')).toBe('in_progress');
      expect(isVideoCompleted('v-test-2')).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.3: Video watch percent < 5 is classified as unwatched', () => {
    setupMockBrowserEnvironment();
    try {
      saveVideoWatchProgress({
        videoId: 'v-test-3',
        currentTime: 4,
        duration: 100,
      });
      expect(getVideoWatchStatus('v-test-3')).toBe('unwatched');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.4: YouTube player ENDED state (0) forces completion even if percent is below 90', () => {
    setupMockBrowserEnvironment();
    try {
      const resEnded = saveVideoWatchProgress({
        videoId: 'v-test-ended',
        currentTime: 75,
        duration: 100,
        playerState: 0, // YouTube ENDED
      });
      expect(resEnded.completed).toBe(true);
      expect(resEnded.completedAt).toBeDefined();

      const retrieved = getVideoWatchProgress('v-test-ended');
      expect(retrieved?.completed).toBe(true);
      expect(getVideoWatchStatus('v-test-ended')).toBe('completed');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.5: Sticky Completion Invariant: rewinding to 0:00 does not unmark completed', () => {
    setupMockBrowserEnvironment();
    try {
      // First, complete the video
      const firstSave = saveVideoWatchProgress({
        videoId: 'v-test-sticky',
        currentTime: 95,
        duration: 100,
      });
      expect(firstSave.completed).toBe(true);
      const originalCompletedAt = firstSave.completedAt;

      // Now rewind to 0:00 (0% progress)
      const rewindSave = saveVideoWatchProgress({
        videoId: 'v-test-sticky',
        currentTime: 0,
        duration: 100,
      });
      expect(rewindSave.percent).toBe(0);
      expect(rewindSave.completed).toBe(true); // Must remain sticky true!
      expect(rewindSave.completedAt).toBe(originalCompletedAt);

      // Verify status check in watchMap and storage
      expect(getVideoWatchStatus('v-test-sticky')).toBe('completed');
      expect(isVideoCompleted('v-test-sticky')).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.6: Backward compatibility with historical completed attempt in localStorage', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // Store historical attempt with isCompleted = true
      mockStorage.setItem(
        `${ATTEMPT_STORAGE_PREFIX}v-attempt-done`,
        JSON.stringify({
          videoId: 'v-attempt-done',
          isCompleted: true,
          clozeScore: 4,
          clozeTotal: 4,
          quizScore: 3,
          quizTotal: 3,
          percentScore: 100,
          completedAt: '2026-09-01T10:00:00.000Z',
        })
      );

      const progress = getVideoWatchProgress('v-attempt-done');
      expect(progress?.completed).toBe(true);
      expect(getVideoWatchStatus('v-attempt-done')).toBe('completed');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.7: Safe localStorage access with SSR fallback when window is undefined', () => {
    // Teardown any mock window/localStorage to simulate Node/SSR
    teardownMockBrowserEnvironment();

    expect(getVideoWatchProgress('v-ssr')).toBeNull();
    expect(getAllVideoWatchProgress()).toEqual({});

    const saved = saveVideoWatchProgress({
      videoId: 'v-ssr',
      currentTime: 95,
      duration: 100,
    });
    expect(saved.videoId).toBe('v-ssr');
    expect(saved.percent).toBe(95);
    expect(saved.completed).toBe(true);
  });

  await runner.it('W1.8: Dispatches lingo_listening_watch_updated custom DOM event on progress save', () => {
    setupMockBrowserEnvironment();
    try {
      const listeners: Record<string, Function[]> = {};
      (window as any).addEventListener = (type: string, fn: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      };
      (window as any).dispatchEvent = (event: any) => {
        const fns = listeners[event.type] || [];
        fns.forEach((fn) => fn(event));
        return true;
      };

      let eventDetail: any = null;
      (window as any).addEventListener('lingo_listening_watch_updated', (e: any) => {
        eventDetail = e.detail;
      });

      saveVideoWatchProgress({
        videoId: 'v-event-test',
        currentTime: 50,
        duration: 100,
      });

      expect(eventDetail).toBeDefined();
      expect(eventDetail.videoId).toBe('v-event-test');
      expect(eventDetail.percent).toBe(50);
      expect(eventDetail.completed).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.9: Corrupted JSON in localStorage returns null gracefully without throwing', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      mockStorage.setItem(`${WATCH_STORAGE_PREFIX}corrupt`, '<<<NOT_JSON>>>');
      expect(getVideoWatchProgress('corrupt')).toBeNull();
      expect(getVideoWatchStatus('corrupt')).toBe('unwatched');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('W1.10: Legacy numeric string watch item parses correctly', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      mockStorage.setItem(`${WATCH_STORAGE_PREFIX}legacy-num`, '75');
      const progress = getVideoWatchProgress('legacy-num');
      expect(progress?.percent).toBe(75);
      expect(progress?.completed).toBe(false);

      mockStorage.setItem(`${WATCH_STORAGE_PREFIX}legacy-done`, '95');
      const doneProgress = getVideoWatchProgress('legacy-done');
      expect(doneProgress?.percent).toBe(95);
      expect(doneProgress?.completed).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 2: Smart Queue Reordering
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('M1.2: Smart Queue Reordering Algorithm', () => {});

  const sampleShelf = allVideos.filter((v) => v.topic === 'travel').slice(0, 8);

  await runner.it('Q2.1: Completed video is pushed to the tail of the shelf', () => {
    const watchMap = {
      [sampleShelf[0].id]: { percent: 95, completed: true },
    };
    const reordered = reorderShelfVideos(sampleShelf, watchMap);
    expect(reordered[reordered.length - 1].id).toBe(sampleShelf[0].id);
    expect(reordered[0].id).toBe(sampleShelf[1].id);
  });

  await runner.it('Q2.2: Strict 3-tier partitioning: Unwatched first -> In-Progress -> Completed', () => {
    const watchMap = {
      [sampleShelf[0].id]: { percent: 95, completed: true }, // tier 2
      [sampleShelf[1].id]: { percent: 45 },                  // tier 1
      [sampleShelf[2].id]: { percent: 0 },                   // tier 0
      [sampleShelf[3].id]: { percent: 80 },                  // tier 1
      [sampleShelf[4].id]: { percent: 100, completed: true },// tier 2
      [sampleShelf[5].id]: { percent: 0 },                   // tier 0
    };

    const reordered = reorderShelfVideos(sampleShelf.slice(0, 6), watchMap);
    const statuses = reordered.map((v) => getVideoWatchStatus(v.id, watchMap));

    // Expected sequence: unwatched -> in_progress -> completed
    let phase: 'unwatched' | 'in_progress' | 'completed' = 'unwatched';
    for (const st of statuses) {
      if (phase === 'unwatched') {
        if (st === 'in_progress') phase = 'in_progress';
        else if (st === 'completed') phase = 'completed';
      } else if (phase === 'in_progress') {
        if (st === 'unwatched') throw new Error('Unwatched card appeared after in_progress card');
        if (st === 'completed') phase = 'completed';
      } else if (phase === 'completed') {
        if (st !== 'completed') throw new Error('Non-completed card appeared after completed card');
      }
    }
  });

  await runner.it('Q2.3: InProgressFirst mode orders: In-Progress -> Unwatched -> Completed', () => {
    const watchMap = {
      [sampleShelf[0].id]: { percent: 95, completed: true }, // completed
      [sampleShelf[1].id]: { percent: 45 },                  // in_progress
      [sampleShelf[2].id]: { percent: 0 },                   // unwatched
    };

    const reordered = reorderShelfVideos(sampleShelf.slice(0, 3), watchMap, {
      inProgressFirst: true,
    });

    expect(reordered[0].id).toBe(sampleShelf[1].id); // in_progress first
    expect(reordered[1].id).toBe(sampleShelf[2].id); // unwatched second
    expect(reordered[2].id).toBe(sampleShelf[0].id); // completed last
  });

  await runner.it('Q2.4: Stable tie-breaking: Preserves original catalog relative order within same tier', () => {
    const watchMap = {
      [sampleShelf[1].id]: { percent: 92, completed: true },
      [sampleShelf[4].id]: { percent: 98, completed: true },
    };

    const reordered = reorderShelfVideos(sampleShelf, watchMap);

    // Unwatched items must maintain exact relative catalog order
    const unwatchedIds = reordered
      .filter((v) => getVideoWatchStatus(v.id, watchMap) === 'unwatched')
      .map((v) => v.id);

    const expectedUnwatchedIds = [
      sampleShelf[0].id,
      sampleShelf[2].id,
      sampleShelf[3].id,
      sampleShelf[5].id,
      sampleShelf[6].id,
      sampleShelf[7].id,
    ];
    expect(unwatchedIds).toEqual(expectedUnwatchedIds);

    // Completed items must also maintain their relative order at the tail
    const completedIds = reordered
      .filter((v) => getVideoWatchStatus(v.id, watchMap) === 'completed')
      .map((v) => v.id);
    expect(completedIds).toEqual([sampleShelf[1].id, sampleShelf[4].id]);
  });

  await runner.it('Q2.5: 100% unwatched shelf preserves exact original array order', () => {
    const reordered = reorderShelfVideos(sampleShelf, {});
    expect(reordered.map((v) => v.id)).toEqual(sampleShelf.map((v) => v.id));
  });

  await runner.it('Q2.6: 100% completed shelf preserves exact original array order', () => {
    const allCompletedWatch: Record<string, any> = {};
    sampleShelf.forEach((v) => {
      allCompletedWatch[v.id] = { percent: 100, completed: true };
    });
    const reordered = reorderShelfVideos(sampleShelf, allCompletedWatch);
    expect(reordered.map((v) => v.id)).toEqual(sampleShelf.map((v) => v.id));
  });

  await runner.it('Q2.7: Pure function: Does not mutate input array', () => {
    const copyOriginal = [...sampleShelf];
    const watchMap = {
      [sampleShelf[0].id]: { percent: 100, completed: true },
    };
    reorderShelfVideos(sampleShelf, watchMap);
    expect(sampleShelf.map((v) => v.id)).toEqual(copyOriginal.map((v) => v.id));
  });

  await runner.it('Q2.8: Handles empty array, 1-item array, and undefined safely', () => {
    expect(reorderShelfVideos([], {})).toEqual([]);
    expect(reorderShelfVideos([sampleShelf[0]], {})).toEqual([sampleShelf[0]]);
    expect(reorderShelfVideos(undefined as any, {})).toEqual([]);
  });

  await runner.it('Q2.9: sortShelfVideos backward compatibility helper', () => {
    const completedSet = new Set([sampleShelf[0].id]);
    const progressMap = { [sampleShelf[1].id]: 40 };
    const reordered = sortShelfVideos(sampleShelf.slice(0, 4), completedSet, progressMap);

    // in-progress should be first, completed should be last
    expect(reordered[0].id).toBe(sampleShelf[1].id);
    expect(reordered[reordered.length - 1].id).toBe(sampleShelf[0].id);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 3: Daily 3-Video Recommendation Engine
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('M1.3: Daily 3-Video Recommendation Engine', () => {});

  await runner.it('R3.1: Returns exactly 3 videos for full catalogue', () => {
    const recs = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    expect(recs.length).toBe(3);
  });

  await runner.it('R3.2: Deterministic output for same date and completed state', () => {
    const recsA = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    const recsB = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    expect(recsA.map((v) => v.id)).toEqual(recsB.map((v) => v.id));
  });

  await runner.it('R3.3: Different dates produce distinct daily sets', () => {
    const recsDay1 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    const recsDay2 = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-09' });
    const set1 = new Set(recsDay1.map((v) => v.id));
    const allSame = recsDay2.every((v) => set1.has(v.id));
    expect(allSame).toBe(false);
  });

  await runner.it('R3.4: Topic diversity: Selects 3 videos across 3 distinct topics', () => {
    const recs = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    const canonicalTopics = new Set(
      recs.map((v) => (v.topic === 'social_stories' ? 'culture' : v.topic))
    );
    expect(canonicalTopics.size).toBe(3);
  });

  await runner.it('R3.5: CEFR Level diversity: Selects across diverse levels (>=2 distinct levels)', () => {
    const recs = getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    const levels = new Set(recs.map((v) => v.cefrLevel));
    expect(levels.size).toBeGreaterThanOrEqual(2);
  });

  await runner.it('R3.6: Prioritizes unwatched videos over completed', () => {
    // Mark 190 videos as completed
    const completedSet = new Set(allVideos.slice(0, 190).map((v) => v.id));
    const remainingUnwatched = allVideos.slice(190).map((v) => v.id);

    const recs = getDailyRecommendedVideos(allVideos, {
      dateStr: '2026-09-08',
      completedIds: completedSet,
    });

    expect(recs.length).toBe(3);
    const hasUnwatched = recs.some((v) => remainingUnwatched.includes(v.id));
    expect(hasUnwatched).toBe(true);
  });

  await runner.it('R3.7: 100% completed catalogue fallback: Returns 3 unique videos without crash', () => {
    const allCompleted = new Set(allVideos.map((v) => v.id));
    const recs = getDailyRecommendedVideos(allVideos, {
      dateStr: '2026-09-08',
      completedIds: allCompleted,
    });
    expect(recs.length).toBe(3);
    const ids = new Set(recs.map((v) => v.id));
    expect(ids.size).toBe(3); // All 3 must be unique
  });

  await runner.it('R3.8: Accepts watchMap directly in RecommendationOptions', () => {
    const watchMap: Record<string, any> = {};
    allVideos.slice(0, 195).forEach((v) => {
      watchMap[v.id] = { percent: 100, completed: true };
    });

    const recs = getDailyRecommendedVideos(allVideos, {
      dateStr: '2026-09-08',
      watchMap,
    });

    expect(recs.length).toBe(3);
    // Should prioritize the remaining 5 unwatched
    const unwatchedIds = allVideos.slice(195).map((v) => v.id);
    const unwatchedCount = recs.filter((v) => unwatchedIds.includes(v.id)).length;
    expect(unwatchedCount).toBeGreaterThanOrEqual(1);
  });

  await runner.it('R3.9: Edge case: Catalogue with <= 3 videos returns all without duplication', () => {
    const miniCatalog = allVideos.slice(0, 2);
    const recs = getDailyRecommendedVideos(miniCatalog, { dateStr: '2026-09-08' });
    expect(recs.length).toBe(2);
    expect(recs.map((v) => v.id)).toEqual(miniCatalog.map((v) => v.id));
  });

  await runner.it('R3.10: Edge case: Empty catalogue returns empty array', () => {
    const recs = getDailyRecommendedVideos([], { dateStr: '2026-09-08' });
    expect(recs.length).toBe(0);
  });

  await runner.it('R3.11: PRNG Mulberry32 and hashDateString unit verification', () => {
    const seed1 = getDailySeed('2026-09-08');
    const seed2 = getDailySeed('2026-09-08');
    expect(seed1).toBe(seed2);

    const seed3 = getDailySeed('2026-09-09');
    expect(seed1).not.toBe(seed3);

    const rngA = createMulberry32(seed1);
    const rngB = createMulberry32(seed1);
    const valsA = [rngA(), rngA(), rngA()];
    const valsB = [rngB(), rngB(), rngB()];
    expect(valsA).toEqual(valsB);

    // Verify all generated numbers are in [0, 1)
    valsA.forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });

    // Verify shuffleArray preserves elements and length
    const sample = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(sample, rngA);
    expect(shuffled.length).toBe(5);
    expect(new Set(shuffled)).toEqual(new Set(sample));
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Section 4: Re-export & Interoperability Verification
  // ══════════════════════════════════════════════════════════════════════════
  runner.describe('M1.4: Dual Module Re-export Interoperability', () => {});

  await runner.it('M1.4: src/lib/listening-queue re-exports all recommendation and queue functions', () => {
    expect(typeof queueModule.reorderShelfVideos).toBe('function');
    expect(typeof queueModule.getDailyRecommendedVideos).toBe('function');
    expect(typeof queueModule.getDailyRecommendations).toBe('function');
    expect(typeof queueModule.getVideoWatchProgress).toBe('function');
    expect(typeof queueModule.saveVideoWatchProgress).toBe('function');
    expect(typeof queueModule.getVideoWatchStatus).toBe('function');
    expect(typeof queueModule.isVideoCompleted).toBe('function');
    expect(typeof queueModule.getDailySeed).toBe('function');
    expect(queueModule.COMPLETION_THRESHOLD_PERCENT).toBe(90);
    expect(queueModule.IN_PROGRESS_MIN_PERCENT).toBe(5);

    // Call through queueModule
    const recs = queueModule.getDailyRecommendedVideos(allVideos, { dateStr: '2026-09-08' });
    expect(recs.length).toBe(3);
  });

  const stats = runner.getStats();
  console.log(`\n================================================================================`);
  console.log(`  RECOMMENDATION & QUEUE ENGINE TEST SUMMARY`);
  console.log(`================================================================================`);
  console.log(`  Total Tests: ${stats.total}`);
  console.log(`  Passed:      ${stats.passed}`);
  console.log(`  Failed:      ${stats.failed}`);
  console.log(`  Duration:    ${stats.durationMs}ms`);
  console.log(`================================================================================\n`);

  return stats;
}

if (require.main === module || process.argv[1]?.includes('recommendation-queue.test')) {
  runRecommendationQueueTests().then((stats) => {
    if (stats.failed > 0) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
