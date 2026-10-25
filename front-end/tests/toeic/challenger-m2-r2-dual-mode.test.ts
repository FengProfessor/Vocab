/**
 * Challenger 1 — Milestone 2 Iteration 2 Adversarial Verification Suite
 *
 * Targeted Adversarial Verification of the Dual-Mode Cluster Resolver:
 * 1. Dual-mode invariant: Full 200Q test mode vs Part Practice mode (Part 3 & Part 4)
 * 2. Boundary resolution: Exact cluster boundaries, child question continuity, no overlaps/gaps
 * 3. Format classification: 'text_dialogue' vs 'scanned_image' across Study4, Estudyme, ETS 2024, ETS 2026
 * 4. API Route integration: /api/toeic/test with various parameters and zero bulk leaks validation
 * 5. Edge cases: Subsets, limits, invalid question numbers, polymorphic argument orders
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  loadAnyToeicTest,
  loadToeicPartPractice,
  getToeicClusterForQuestion,
  getToeicClientClusterForQuestion,
  clusterToeicQuestions,
  stripSensitiveClusterData,
} from '../../src/lib/toeic-test-loader';
import { GET as getToeicTestApi } from '../../src/app/api/toeic/test/route';
import type {
  ToeicUnifiedQuestion,
  ToeicClusterType,
} from '../../src/types/toeic';

/**
 * Deep recursive property validator to catch any sensitive leaks.
 */
function findLeakedKeys(
  obj: any,
  forbidden: string[] = ['correctAnswer', 'explanationVi', 'transcript'],
  currentPath: string = '$'
): { path: string; key: string }[] {
  const leaks: { path: string; key: string }[] = [];
  if (!obj || typeof obj !== 'object') return leaks;

  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      leaks.push(...findLeakedKeys(item, forbidden, `${currentPath}[${idx}]`));
    });
  } else {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (forbidden.includes(key) && val !== undefined && val !== null) {
        leaks.push({ path: `${currentPath}.${key}`, key });
      }
      if (typeof val === 'object' && val !== null) {
        leaks.push(...findLeakedKeys(val, forbidden, `${currentPath}.${key}`));
      }
    }
  }
  return leaks;
}

export async function runChallengerM2R2DualModeTests(runner: TestRunner) {
  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 1: FULL TEST MODE CLUSTER RESOLUTION & BOUNDARIES
  // ═════════════════════════════════════════════════════════════════════════
  runner.describe('Section 1: Full Test Mode Cluster Resolution & Boundaries', () => {});

  await runner.it('ADV-1.1: Full test (Study4 6852) partitions into exactly 23 clusters (13 Part 3 + 10 Part 4)', () => {
    const fullTest = loadAnyToeicTest('6852');
    expect(fullTest.length).toBeGreaterThanOrEqual(100);

    const clusters = clusterToeicQuestions(fullTest);
    expect(clusters.length).toBe(23);

    const p3Clusters = clusters.filter((c) => c.part === 3);
    const p4Clusters = clusters.filter((c) => c.part === 4);
    expect(p3Clusters.length).toBe(13);
    expect(p4Clusters.length).toBe(10);

    // Part 3 boundaries: Q32..Q70
    expect(p3Clusters[0].startQuestionNumber).toBe(32);
    expect(p3Clusters[0].endQuestionNumber).toBe(34);
    expect(p3Clusters[12].startQuestionNumber).toBe(68);
    expect(p3Clusters[12].endQuestionNumber).toBe(70);

    // Part 4 boundaries: Q71..Q100
    expect(p4Clusters[0].startQuestionNumber).toBe(71);
    expect(p4Clusters[0].endQuestionNumber).toBe(73);
    expect(p4Clusters[9].startQuestionNumber).toBe(98);
    expect(p4Clusters[9].endQuestionNumber).toBe(100);

    // Check continuity across Part 3 and Part 4
    for (let i = 0; i < p3Clusters.length; i++) {
      const c = p3Clusters[i];
      expect(c.endQuestionNumber - c.startQuestionNumber).toBe(2);
      expect(c.questions.length).toBe(3);
      expect(c.questions.map((q) => q.questionNumber)).toEqual([
        c.startQuestionNumber,
        c.startQuestionNumber + 1,
        c.startQuestionNumber + 2,
      ]);
      if (i > 0) {
        expect(c.startQuestionNumber).toBe(p3Clusters[i - 1].endQuestionNumber + 1);
      }
    }

    for (let i = 0; i < p4Clusters.length; i++) {
      const c = p4Clusters[i];
      expect(c.endQuestionNumber - c.startQuestionNumber).toBe(2);
      expect(c.questions.length).toBe(3);
      expect(c.questions.map((q) => q.questionNumber)).toEqual([
        c.startQuestionNumber,
        c.startQuestionNumber + 1,
        c.startQuestionNumber + 2,
      ]);
      if (i > 0) {
        expect(c.startQuestionNumber).toBe(p4Clusters[i - 1].endQuestionNumber + 1);
      }
    }
  });

  await runner.it('ADV-1.2: Boundary lookups in full test: non-listening questions strictly return null', () => {
    const fullTest = loadAnyToeicTest('6852');

    // Part 1: Q1..Q6
    for (let q = 1; q <= 6; q++) {
      expect(getToeicClusterForQuestion(q, fullTest)).toBeNull();
    }
    // Part 2: Q7..Q31
    for (let q = 7; q <= 31; q++) {
      expect(getToeicClusterForQuestion(q, fullTest)).toBeNull();
    }
    // Part 5: Q101..Q105
    for (let q = 101; q <= 105; q++) {
      expect(getToeicClusterForQuestion(q, fullTest)).toBeNull();
    }
    // Negative, zero, float
    expect(getToeicClusterForQuestion(0, fullTest)).toBeNull();
    expect(getToeicClusterForQuestion(-5, fullTest)).toBeNull();
    expect(getToeicClusterForQuestion(32.5 as any, fullTest)).toBeNull();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 2: PART PRACTICE MODE DUAL-MODE RESOLUTION (PART 3 & PART 4)
  // ═════════════════════════════════════════════════════════════════════════
  runner.describe('Section 2: Part Practice Mode Dual-Mode Resolution', () => {});

  await runner.it('ADV-2.1: Part 3 Practice mode (renumbered 1..39) yields exactly 13 clusters starting at 1', () => {
    const p3Practice = loadToeicPartPractice(3, '6852', undefined, true);
    expect(p3Practice.length).toBe(39);
    expect(p3Practice[0].questionNumber).toBe(1);
    expect(p3Practice[38].questionNumber).toBe(39);

    const clusters = clusterToeicQuestions(p3Practice);
    expect(clusters.length).toBe(13);

    for (let i = 0; i < 13; i++) {
      const c = clusters[i];
      const expectedStart = 1 + i * 3;
      const expectedEnd = expectedStart + 2;

      expect(c.part).toBe(3);
      expect(c.startQuestionNumber).toBe(expectedStart);
      expect(c.endQuestionNumber).toBe(expectedEnd);
      expect(c.questions.length).toBe(3);
      expect(c.questions.map((q) => q.questionNumber)).toEqual([
        expectedStart,
        expectedStart + 1,
        expectedStart + 2,
      ]);
      expect(c.audioUrl.length).toBeGreaterThan(0);
    }

    // Direct lookup test for all questions 1..39
    for (let q = 1; q <= 39; q++) {
      const cluster = getToeicClusterForQuestion(q, p3Practice);
      expect(cluster).not.toBeNull();
      expect(cluster?.part).toBe(3);
      expect(cluster?.startQuestionNumber).toBeLessThanOrEqual(q);
      expect(cluster?.endQuestionNumber).toBeGreaterThanOrEqual(q);
      expect(cluster?.endQuestionNumber! - cluster?.startQuestionNumber!).toBe(2);
      expect(cluster?.questions.length).toBe(3);
    }
  });

  await runner.it('ADV-2.2: Part 4 Practice mode (renumbered 1..30) yields exactly 10 clusters starting at 1', () => {
    const p4Practice = loadToeicPartPractice(4, '6852', undefined, true);
    expect(p4Practice.length).toBe(30);
    expect(p4Practice[0].questionNumber).toBe(1);
    expect(p4Practice[29].questionNumber).toBe(30);

    const clusters = clusterToeicQuestions(p4Practice);
    expect(clusters.length).toBe(10);

    for (let i = 0; i < 10; i++) {
      const c = clusters[i];
      const expectedStart = 1 + i * 3;
      const expectedEnd = expectedStart + 2;

      expect(c.part).toBe(4);
      expect(c.startQuestionNumber).toBe(expectedStart);
      expect(c.endQuestionNumber).toBe(expectedEnd);
      expect(c.questions.length).toBe(3);
      expect(c.questions.map((q) => q.questionNumber)).toEqual([
        expectedStart,
        expectedStart + 1,
        expectedStart + 2,
      ]);
      expect(c.audioUrl.length).toBeGreaterThan(0);
    }

    // Direct lookup test for all questions 1..30
    for (let q = 1; q <= 30; q++) {
      const cluster = getToeicClusterForQuestion(q, p4Practice);
      expect(cluster).not.toBeNull();
      expect(cluster?.part).toBe(4);
      expect(cluster?.startQuestionNumber).toBeLessThanOrEqual(q);
      expect(cluster?.endQuestionNumber).toBeGreaterThanOrEqual(q);
      expect(cluster?.endQuestionNumber! - cluster?.startQuestionNumber!).toBe(2);
      expect(cluster?.questions.length).toBe(3);
    }
  });

  await runner.it('ADV-2.3: Part Practice mode WITHOUT renumbering (renumber=false) preserves absolute numbering', () => {
    // Part 3 without renumbering -> Q32..Q70
    const p3Abs = loadToeicPartPractice(3, '6852', undefined, false);
    expect(p3Abs.length).toBe(39);
    expect(p3Abs[0].questionNumber).toBe(32);
    expect(p3Abs[38].questionNumber).toBe(70);

    const p3Clusters = clusterToeicQuestions(p3Abs);
    expect(p3Clusters.length).toBe(13);
    expect(p3Clusters[0].startQuestionNumber).toBe(32);
    expect(p3Clusters[12].endQuestionNumber).toBe(70);

    // Part 4 without renumbering -> Q71..Q100
    const p4Abs = loadToeicPartPractice(4, '6852', undefined, false);
    expect(p4Abs.length).toBe(30);
    expect(p4Abs[0].questionNumber).toBe(71);
    expect(p4Abs[29].questionNumber).toBe(100);

    const p4Clusters = clusterToeicQuestions(p4Abs);
    expect(p4Clusters.length).toBe(10);
    expect(p4Clusters[0].startQuestionNumber).toBe(71);
    expect(p4Clusters[9].endQuestionNumber).toBe(100);
  });

  await runner.it('ADV-2.4: Part Practice with subset limit (limit=9, limit=12) clusters strictly in multiples of 3', () => {
    const p3Limit9 = loadToeicPartPractice(3, '6852', 9, true);
    expect(p3Limit9.length).toBe(9);
    const clusters9 = clusterToeicQuestions(p3Limit9);
    expect(clusters9.length).toBe(3);
    expect(clusters9[0].startQuestionNumber).toBe(1);
    expect(clusters9[2].endQuestionNumber).toBe(9);

    const p4Limit6 = loadToeicPartPractice(4, '6852', 6, true);
    expect(p4Limit6.length).toBe(6);
    const clusters6 = clusterToeicQuestions(p4Limit6);
    expect(clusters6.length).toBe(2);
    expect(clusters6[0].startQuestionNumber).toBe(1);
    expect(clusters6[1].endQuestionNumber).toBe(6);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 3: FORMAT CLASSIFICATION ('text_dialogue' vs 'scanned_image')
  // ═════════════════════════════════════════════════════════════════════════
  runner.describe('Section 3: Format Classification', () => {});

  await runner.it('ADV-3.1: Study4 tests (6852, 7005) are 100% classified as text_dialogue', () => {
    for (const testId of ['6852', '7005']) {
      const test = loadAnyToeicTest(testId);
      const clusters = clusterToeicQuestions(test);
      expect(clusters.length).toBe(23);

      for (const c of clusters) {
        expect(c.clusterType).toBe('text_dialogue');
        // Child questions must have non-empty prompt text
        for (const q of c.questions) {
          expect(q.prompt).toBeDefined();
          expect(q.prompt!.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  await runner.it('ADV-3.2: Estudyme tests (estudyme-test-1, estudyme-test-2) are text_dialogue and preserve chart graphics', () => {
    for (const testId of ['estudyme-test-1', 'estudyme-test-2']) {
      const test = loadAnyToeicTest(testId);
      const clusters = clusterToeicQuestions(test);
      expect(clusters.length).toBe(23);

      for (const c of clusters) {
        expect(c.clusterType).toBe('text_dialogue');
      }

      // Check for clusters with graphic charts
      const graphicClusters = clusters.filter((c) => c.imageUrl !== null && c.imageUrl !== undefined);
      expect(graphicClusters.length).toBeGreaterThan(0);
      for (const gc of graphicClusters) {
        // Graphic charts maintain 'text_dialogue' because questions have real text prompts
        expect(gc.clusterType).toBe('text_dialogue');
        expect(gc.imageUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  await runner.it('ADV-3.3: ETS 2024 tests (ets-2024-01, ets-2024-02) are 100% classified as scanned_image', () => {
    for (const testId of ['ets-2024-01', 'ets-2024-02']) {
      const test = loadAnyToeicTest(testId);
      const clusters = clusterToeicQuestions(test);
      expect(clusters.length).toBe(23);

      for (const c of clusters) {
        expect(c.clusterType).toBe('scanned_image');
        expect(c.imageUrl).toBeDefined();
        expect(c.imageUrl).not.toBeNull();
        expect(c.imageUrl!.length).toBeGreaterThan(0);
      }
    }
  });

  await runner.it('ADV-3.4: ETS 2026 tests (ets-2026-01, ets-2026-02) are 100% classified as scanned_image', () => {
    for (const testId of ['ets-2026-01', 'ets-2026-02']) {
      const test = loadAnyToeicTest(testId);
      const clusters = clusterToeicQuestions(test);
      expect(clusters.length).toBe(23);

      for (const c of clusters) {
        expect(c.clusterType).toBe('scanned_image');
        expect(c.imageUrl).toBeDefined();
        expect(c.imageUrl).not.toBeNull();
        expect(c.imageUrl!.length).toBeGreaterThan(0);
      }
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 4: API INTEGRATION & ZERO BULK LEAKS EXHAUSTIVE VERIFICATION
  // ═════════════════════════════════════════════════════════════════════════
  runner.describe('Section 4: API Integration & Zero Bulk Leaks', () => {});

  await runner.it('ADV-4.1: API GET /api/toeic/test for Full Test across all 4 providers delivers 23 clusters with zero leaks', async () => {
    const testCases = [
      { testId: '6852', expectedType: 'text_dialogue' },
      { testId: 'estudyme-test-1', expectedType: 'text_dialogue' },
      { testId: 'ets-2024-01', expectedType: 'scanned_image' },
      { testId: 'ets-2026-01', expectedType: 'scanned_image' },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=${tc.testId}`, {
        method: 'GET',
        headers: { 'x-forwarded-for': `198.51.100.${50 + i}` },
      });
      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.clusters).toBeDefined();
      expect(data.clusters.length).toBe(23);
      expect(data.clusters[0].clusterType).toBe(tc.expectedType);

      // Deep scan the entire response for forbidden keys
      const leaks = findLeakedKeys(data);
      expect(leaks.length).toBe(0);

      // Verify that clusters have stripped sensitive data
      for (const cluster of data.clusters) {
        expect((cluster as any).transcript).toBeUndefined();
        expect((cluster as any).explanationVi).toBeUndefined();
        for (const q of cluster.questions) {
          expect((q as any).correctAnswer).toBeUndefined();
          expect((q as any).explanationVi).toBeUndefined();
          expect((q as any).transcript).toBeUndefined();
        }
      }
    }
  });

  await runner.it('ADV-4.2: API GET /api/toeic/test for Part 3 Practice across all 4 providers delivers 13 clusters with zero leaks', async () => {
    const testCases = [
      { testId: '6852', expectedType: 'text_dialogue' },
      { testId: 'estudyme-test-1', expectedType: 'text_dialogue' },
      { testId: 'ets-2024-01', expectedType: 'scanned_image' },
      { testId: 'ets-2026-01', expectedType: 'scanned_image' },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=${tc.testId}&part=3`, {
        method: 'GET',
        headers: { 'x-forwarded-for': `198.51.100.${60 + i}` },
      });
      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBe(39);
      expect(data.clusters).toBeDefined();
      expect(data.clusters.length).toBe(13);
      expect(data.clusters[0].startQuestionNumber).toBe(1);
      expect(data.clusters[12].endQuestionNumber).toBe(39);
      expect(data.clusters[0].clusterType).toBe(tc.expectedType);

      const leaks = findLeakedKeys(data);
      expect(leaks.length).toBe(0);
    }
  });

  await runner.it('ADV-4.3: API GET /api/toeic/test for Part 4 Practice across all 4 providers delivers 10 clusters with zero leaks', async () => {
    const testCases = [
      { testId: '6852', expectedType: 'text_dialogue' },
      { testId: 'estudyme-test-1', expectedType: 'text_dialogue' },
      { testId: 'ets-2024-01', expectedType: 'scanned_image' },
      { testId: 'ets-2026-01', expectedType: 'scanned_image' },
    ];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=${tc.testId}&part=4`, {
        method: 'GET',
        headers: { 'x-forwarded-for': `198.51.100.${70 + i}` },
      });
      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.questions.length).toBe(30);
      expect(data.clusters).toBeDefined();
      expect(data.clusters.length).toBe(10);
      expect(data.clusters[0].startQuestionNumber).toBe(1);
      expect(data.clusters[9].endQuestionNumber).toBe(30);
      expect(data.clusters[0].clusterType).toBe(tc.expectedType);

      const leaks = findLeakedKeys(data);
      expect(leaks.length).toBe(0);
    }
  });

  await runner.it('ADV-4.4: Invalid part query parameters fall back safely to full test without crashing', async () => {
    const invalidParts = ['8', '0', '-1', 'abc', '999'];

    for (let i = 0; i < invalidParts.length; i++) {
      const p = invalidParts[i];
      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=6852&part=${p}`, {
        method: 'GET',
        headers: { 'x-forwarded-for': `198.51.100.${80 + i}` },
      });
      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      // When part is invalid (not 1..7), it serves the full test (200 questions, 23 clusters)
      expect(data.questions.length).toBe(200);
      expect(data.clusters.length).toBe(23);
    }
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SECTION 5: POLYMORPHIC RESOLVER CONTRACT & SIGNATURE EQUIVALENCE
  // ═════════════════════════════════════════════════════════════════════════
  runner.describe('Section 5: Polymorphic Resolver Contract & Signatures', () => {});

  await runner.it('ADV-5.1: getToeicClusterForQuestion is completely symmetric under argument transposition', () => {
    const fullTest = loadAnyToeicTest('6852');
    const p3Practice = loadToeicPartPractice(3, '6852', undefined, true);
    const p4Practice = loadToeicPartPractice(4, '6852', undefined, true);

    // Full test check
    for (let q = 32; q <= 100; q++) {
      const c1 = getToeicClusterForQuestion(q, fullTest);
      const c2 = getToeicClusterForQuestion(fullTest, q);
      expect(c1).toEqual(c2);
    }

    // Part 3 Practice check
    for (let q = 1; q <= 39; q++) {
      const c1 = getToeicClusterForQuestion(q, p3Practice);
      const c2 = getToeicClusterForQuestion(p3Practice, q);
      expect(c1).toEqual(c2);
    }

    // Part 4 Practice check
    for (let q = 1; q <= 30; q++) {
      const c1 = getToeicClusterForQuestion(q, p4Practice);
      const c2 = getToeicClusterForQuestion(p4Practice, q);
      expect(c1).toEqual(c2);
    }
  });

  await runner.it('ADV-5.2: getToeicClientClusterForQuestion returns clean client-compatible types', () => {
    const fullTest = loadAnyToeicTest('6852');
    const clientCluster = getToeicClientClusterForQuestion(32, fullTest as any);
    expect(clientCluster).not.toBeNull();
    expect(clientCluster?.clusterId).toMatch(/^cluster-6852-p3-q32-34$/);
    expect(clientCluster?.part).toBe(3);
    expect(clientCluster?.questions.length).toBe(3);
  });
}

// Direct execution entrypoint
if (process.argv[1]?.includes('challenger-m2-r2-dual-mode.test')) {
  const runner = new TestRunner();
  runChallengerM2R2DualModeTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log(`\n════════════════════════════════════════════════════════════════`);
      console.log(`CHALLENGER M2 R2 DUAL-MODE SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
      console.log(`════════════════════════════════════════════════════════════════\n`);
      process.exit(stats.failed === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during Challenger M2 R2 dual-mode test:', err);
      process.exit(1);
    });
}
