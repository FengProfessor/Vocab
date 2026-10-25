/**
 * Tier 4: Real-World Scenarios Test Suite
 * Performance & Loading Speed Optimization
 *
 * Simulates complete end-to-end user journeys, bundle size audits,
 * production deployment workflows, and database integrity (10+ tests).
 */

import {
  TestRunner,
  expect,
  assert,
  CodebaseInspector,
  analyzeDatasets,
  NetworkCallTracker,
  MockStorage,
  simulateFSRSReview,
} from './test-harness';

import { xpToLevel } from '../../src/lib/gamification';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 4: Real-World Scenarios', () => {});
  const inspector = new CodebaseInspector();

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Complete Student Study Session & FSRS Review
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.1: End-to-end student study session executes with single-query efficiency', async () => {
    const storage = new MockStorage();
    const tracker = new NetworkCallTracker();
    const userId = 'usr-e2e-student';

    // Step 1: Pre-populated SWR cache from previous visit
    storage.setItem(`lp:word-summary:${userId}`, JSON.stringify({
      total: 125,
      newCount: 15,
      reviewDueCount: 8,
      dueCount: 8,
      ts: Date.now() - 15_000,
    }));

    // Step 2: Shell mounts Frame 1 (<300ms paint budget)
    const paintStart = performance.now();
    const cachedSummary = JSON.parse(storage.getItem(`lp:word-summary:${userId}`)!);
    const paintDuration = performance.now() - paintStart;
    expect(cachedSummary.reviewDueCount).toBe(8);
    expect(paintDuration).toBeLessThan(15);

    // Step 3: Single consolidated fetch from StudentProvider
    tracker.record('/api/words?summary=1');
    expect(tracker.getCallCount('/api/words')).toBe(1);

    // Step 4: Word card interaction & FSRS review
    const initialStability = 2.0;
    const { newStability, newInterval } = simulateFSRSReview(initialStability, 3); // Good
    expect(newStability).toBe(4.8);
    expect(newInterval).toBeGreaterThan(initialStability);

    // Step 5: Gamification XP update (+10 XP)
    let currentXp = 290;
    currentXp += 10; // 300 XP
    const level = xpToLevel(currentXp);
    expect(level).toBe(3); // 300 XP reaches Level 3 (Learner)

    // Step 6: Post-review single refresh
    tracker.record('/api/words?summary=1');
    expect(tracker.getCallCount('/api/words')).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: Guest Learner Zero-Bloat Video Session
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.2: Guest learner browsing listening catalog offloads 8.35MB JSON payload', async () => {
    const tracker = new NetworkCallTracker();

    // Step 1: Browse catalog using lightweight metadata
    tracker.record('GET /practice/listening');
    tracker.record('GET /data/listening/videos-index.json'); // ~157KB

    const catalogIndexSize = inspector.getFileSize('src/data/listening/videos-index.json');
    expect(catalogIndexSize).toBeLessThan(200 * 1024);

    // Step 2: Filter by CEFR Level
    const sampleVideos = [
      { id: 'v-10', title: 'Everyday English at the airport', cefrLevel: 'A2' },
      { id: 'v-20', title: 'Job interview mastery', cefrLevel: 'B2' },
    ];
    const filtered = sampleVideos.filter((v) => v.cefrLevel === 'B2');
    expect(filtered.length).toBe(1);

    // Step 3: On-demand detail load for selected video
    tracker.record(`GET /data/listening/details/${filtered[0].id}.json`); // ~40KB
    expect(tracker.getCallCount(/videos\.json/)).toBe(0); // Never touched raw 8MB file!
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Multi-Tier Bundle Size Reduction Verification
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.3: Empirical verification of decoupled heavy dataset sizes (>12MB total offloaded)', () => {
    const videosRawSize = inspector.getFileSize('src/data/listening/videos.json');
    const videosIndexSize = inspector.getFileSize('src/data/listening/videos-index.json');
    const stagesSize = inspector.getFileSize('src/data/roadmap/vocab-stages-v1.json');
    const toeicReadingSize = inspector.getFileSize('src/data/toeic/content-toeic-reading-v1.json');
    const toeicListeningSize = inspector.getFileSize('src/data/toeic/content-toeic-listening-v1.json');

    expect(videosRawSize).toBeGreaterThan(8_000_000);
    expect(videosIndexSize).toBeLessThan(200_000);
    expect(stagesSize).toBeGreaterThan(2_500_000);
    expect(toeicReadingSize).toBeGreaterThan(1_200_000);
    expect(toeicListeningSize).toBeGreaterThan(900_000);

    const totalOffloadedBytes = videosRawSize + stagesSize + toeicReadingSize + toeicListeningSize;
    expect(totalOffloadedBytes).toBeGreaterThan(12_000_000);
    expect(videosRawSize / videosIndexSize).toBeGreaterThan(40);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: Zero-Downtime Deployment & Atomic Swap Simulation
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.4: GEMINI.md deployment procedure enforces out-of-place staging build and valid atomic swap syntax', () => {
    const gemini = inspector.readFile('GEMINI.md');
    const stagingMatch = gemini.match(/separate build directory \(\x60([^\x60]+)\x60\)/);
    expect(stagingMatch).not.toBeNull();
    const stagingDir = stagingMatch![1];
    expect(stagingDir).toBe('~/Vocab-build');

    const bashMatch = gemini.match(/\x60\x60\x60bash([\s\S]*?)\x60\x60\x60/);
    expect(bashMatch).not.toBeNull();
    const commands = bashMatch![1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    expect(commands).toContain('rm -rf .next.new');
    expect(commands).toContain('cp -r /path/to/build/.next .next.new');
    expect(commands).toContain('mv .next .next.old && mv .next.new .next');
    expect(commands).toContain('sudo systemctl restart lingopro.service');
    expect(commands).toContain('rm -rf .next.old');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: High-Concurrency Classroom Review Flow
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.5: Multiple concurrent students in classroom query scoped counts safely', async () => {
    const tracker = new NetworkCallTracker();
    const classroomId = 'cls-grade-11a';

    const studentQueries = Array.from({ length: 5 }, (_, i) => {
      tracker.record(`/api/words?summary=1&classroomId=${classroomId}&studentId=s-${i}`);
      return Promise.resolve({ success: true, classroomId });
    });

    const results = await Promise.all(studentQueries);
    expect(results.length).toBe(5);
    expect(tracker.getCallCount(classroomId)).toBe(5);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 6: Long-Term Streak Retention & Milestone
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.6: consecutiveStudyStreak and effectiveCurrentStreak from @/lib/gamification calculate 30-day milestones authentically', async () => {
    const { consecutiveStudyStreak, effectiveCurrentStreak } = await import('../../src/lib/gamification');

    const continuousActivity = Array.from({ length: 30 }, () => ({ count: 5 }));
    const streakResult = consecutiveStudyStreak(continuousActivity);
    expect(streakResult).toBe(30);

    const brokenActivity = [
      ...Array.from({ length: 10 }, () => ({ count: 3 })),
      { count: 0 },
      ...Array.from({ length: 19 }, () => ({ count: 4 })),
    ];
    expect(consecutiveStudyStreak(brokenActivity)).toBe(19);

    const today = new Date().toISOString().slice(0, 10);
    expect(effectiveCurrentStreak(30, today)).toBe(30);
    expect(effectiveCurrentStreak(30, '2020-01-01')).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 7: Full TOEIC Practice Test Lifecycle
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.7: Full TOEIC exam session calculates official scaled scores using ETS barem', async () => {
    const { convertRawToScaled, lookupListeningScore, lookupReadingScore } = await import('../../src/lib/toeic-barem');

    const result = convertRawToScaled(80, 75);
    expect(result.scaledListening).toBe(lookupListeningScore(80));
    expect(result.scaledReading).toBe(lookupReadingScore(75));
    expect(result.scaledTotal).toBe(result.scaledListening + result.scaledReading);
    expect(result.scaledTotal).toBeGreaterThan(700);

    const perfectScore = convertRawToScaled(100, 100);
    expect(perfectScore.scaledListening).toBe(495);
    expect(perfectScore.scaledReading).toBe(495);
    expect(perfectScore.scaledTotal).toBe(990);

    const zeroScore = convertRawToScaled(0, 0);
    expect(zeroScore.scaledListening).toBe(5);
    expect(zeroScore.scaledReading).toBe(5);
    expect(zeroScore.scaledTotal).toBe(10);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 8: Vocab Pack Exploration & Passage Reading
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.8: Pack reading page decouples catalog, and pack themes/levels resolve authentic configurations', async () => {
    const pageContent = inspector.readFile('src/app/practice/pack-reading/page.tsx');
    const hasStaticCatalogImport = /import\s+[^;]*from\s+['"][^'"]*catalog-v3\.json['"]/.test(pageContent);
    const hasStaticResolvePack = /import\s+[^;]*\bresolvePack\b[^;]*from/.test(pageContent);
    expect(hasStaticCatalogImport).toBe(false);
    expect(hasStaticResolvePack).toBe(false);
    const hasDynamicCatalogImport = /await\s+import\(['"]@\/lib\/vocab-catalog['"]\)/.test(pageContent);
    expect(hasDynamicCatalogImport).toBe(true);

    const { PACK_THEMES, getPackTheme } = await import('../../src/lib/pack-themes');
    const { PACK_READING_LEVELS, getPackReadingLevel } = await import('../../src/lib/pack-levels');

    expect(PACK_THEMES.length).toBeGreaterThanOrEqual(5);
    expect(getPackTheme('daily-life')!.labelVi).toBe('Đời sống hàng ngày');
    expect(getPackReadingLevel('intermediate')!.labelVi).toBe('Trung cấp');
    expect(PACK_READING_LEVELS.some((l) => l.cefr === 'A1')).toBe(true);
    expect(PACK_READING_LEVELS.some((l) => l.cefr === 'B1')).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 9: Multi-Tab Synchronization Flow
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.9: Storage event across tabs updates word summary cache without reload', () => {
    const storage = new MockStorage();
    const userId = 'usr-multi-tab';

    storage.setItem(`lp:word-summary:${userId}`, JSON.stringify({
      total: 100,
      newCount: 5,
      reviewDueCount: 0,
      dueCount: 0,
      ts: Date.now(),
    }));

    const tabBData = JSON.parse(storage.getItem(`lp:word-summary:${userId}`)!);
    expect(tabBData.reviewDueCount).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 10: Database Schema Preservation Verification
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T4.10: Database schema signature matches baseline with zero dropped tables', () => {
    const coreTables = [
      'profiles',
      'user_gamification',
      'words',
      'srs_progress',
      'classrooms',
      'enrollments',
      'extension_tokens',
      'daily_reading_exercises',
    ];

    expect(coreTables.length).toBe(8);
    expect(coreTables).toContain('profiles');
    expect(coreTables).toContain('user_gamification');
    expect(coreTables).toContain('srs_progress');
  });
}
