/**
 * Adversarial Empirical Stress Test Suite for Milestone 2:
 * Cluster Data Modeling, Resolvers & Dual Format Integration.
 *
 * Implements rigorous stress-testing per Challenger 1 mandate:
 * 1. Full Exhaustive Coverage of Part 3 (Q32..Q70) and Part 4 (Q71..Q100)
 * 2. Boundary Question Numbers (Q31, Q32, Q70, Q71, Q100, Q101, extremes, fuzzing)
 * 3. Partitioning Integrity with clusterToeicQuestions (23 clusters, disjoint set)
 * 4. Dual Format Classification ('text_dialogue' vs 'scanned_image', graphic charts)
 * 5. Active Cyber Defense, Zero Bulk Leaks & Deep Immutability
 *
 * Execution:
 *   npx tsx tests/toeic/challenger-m2-stress.test.ts
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  loadAnyToeicTest,
  getToeicClusterForQuestion,
  getToeicClientClusterForQuestion,
  clusterToeicQuestions,
  stripSensitiveClusterData,
} from '../../src/lib/toeic-test-loader';
import { GET as getToeicTestApi } from '../../src/app/api/toeic/test/route';
import { POST as postToeicSubmitApi } from '../../src/app/api/toeic/submit/route';
import {
  extractInvisibleWatermark,
} from '../../src/lib/toeic-anti-scraping';
import type {
  ToeicUnifiedQuestion,
  ToeicQuestionCluster,
  ToeicClusterType,
} from '../../src/types/toeic';

export async function runChallengerM2StressTests(runner: TestRunner) {
  // =========================================================================
  // SUITE 1: Exhaustive Question-by-Question Coverage (Q32..Q100)
  // =========================================================================
  runner.describe('Suite 1: Exhaustive Question Coverage (Q32..Q100)', () => {});

  await runner.it('C1-1.1: Every question in Part 3 (Q32..Q70, 39 questions) resolves to valid 3-question cluster', () => {
    const test = loadAnyToeicTest('6852');
    expect(test.length).toBeGreaterThanOrEqual(100);

    for (let qnum = 32; qnum <= 70; qnum++) {
      const clusterByNum = getToeicClusterForQuestion(qnum, test);
      const clusterByArr = getToeicClusterForQuestion(test, qnum);

      expect(clusterByNum).not.toBeNull();
      expect(clusterByArr).not.toBeNull();

      // Exact match between polymorphic signatures
      expect(clusterByNum?.clusterId).toBe(clusterByArr?.clusterId);
      expect(clusterByNum?.part).toBe(3);
      expect(clusterByNum?.startQuestionNumber).toBeLessThanOrEqual(qnum);
      expect(clusterByNum?.endQuestionNumber).toBeGreaterThanOrEqual(qnum);
      expect(clusterByNum!.endQuestionNumber - clusterByNum!.startQuestionNumber).toBe(2);
      expect(clusterByNum?.questions.length).toBe(3);

      // Check child question sequence
      const childNums = clusterByNum!.questions.map((q) => q.questionNumber);
      const expectedStart = clusterByNum!.startQuestionNumber;
      expect(childNums).toEqual([expectedStart, expectedStart + 1, expectedStart + 2]);

      // Audio URL must be present
      expect(clusterByNum?.audioUrl.length).toBeGreaterThan(0);
    }
  });

  await runner.it('C1-1.2: Every question in Part 4 (Q71..Q100, 30 questions) resolves to valid 3-question cluster', () => {
    const test = loadAnyToeicTest('6852');

    for (let qnum = 71; qnum <= 100; qnum++) {
      const clusterByNum = getToeicClusterForQuestion(qnum, test);
      const clusterByArr = getToeicClusterForQuestion(test, qnum);

      expect(clusterByNum).not.toBeNull();
      expect(clusterByArr).not.toBeNull();

      expect(clusterByNum?.clusterId).toBe(clusterByArr?.clusterId);
      expect(clusterByNum?.part).toBe(4);
      expect(clusterByNum?.startQuestionNumber).toBeLessThanOrEqual(qnum);
      expect(clusterByNum?.endQuestionNumber).toBeGreaterThanOrEqual(qnum);
      expect(clusterByNum!.endQuestionNumber - clusterByNum!.startQuestionNumber).toBe(2);
      expect(clusterByNum?.questions.length).toBe(3);

      const childNums = clusterByNum!.questions.map((q) => q.questionNumber);
      const expectedStart = clusterByNum!.startQuestionNumber;
      expect(childNums).toEqual([expectedStart, expectedStart + 1, expectedStart + 2]);

      expect(clusterByNum?.audioUrl.length).toBeGreaterThan(0);
    }
  });

  await runner.it('C1-1.3: Sibling questions in the same cluster yield 100% identical cluster descriptors', () => {
    const test = loadAnyToeicTest('6852');

    // Check all 13 Part 3 clusters
    for (let i = 0; i < 13; i++) {
      const q1 = 32 + i * 3;
      const q2 = q1 + 1;
      const q3 = q1 + 2;

      const c1 = getToeicClusterForQuestion(q1, test)!;
      const c2 = getToeicClusterForQuestion(q2, test)!;
      const c3 = getToeicClusterForQuestion(q3, test)!;

      expect(c1.clusterId).toBe(c2.clusterId);
      expect(c2.clusterId).toBe(c3.clusterId);
      expect(c1.audioUrl).toBe(c2.audioUrl);
      expect(c2.audioUrl).toBe(c3.audioUrl);
      expect(c1.questions.map((q) => q.id)).toEqual(c2.questions.map((q) => q.id));
      expect(c2.questions.map((q) => q.id)).toEqual(c3.questions.map((q) => q.id));
    }

    // Check all 10 Part 4 clusters
    for (let i = 0; i < 10; i++) {
      const q1 = 71 + i * 3;
      const q2 = q1 + 1;
      const q3 = q1 + 2;

      const c1 = getToeicClusterForQuestion(q1, test)!;
      const c2 = getToeicClusterForQuestion(q2, test)!;
      const c3 = getToeicClusterForQuestion(q3, test)!;

      expect(c1.clusterId).toBe(c2.clusterId);
      expect(c2.clusterId).toBe(c3.clusterId);
      expect(c1.audioUrl).toBe(c2.audioUrl);
      expect(c2.audioUrl).toBe(c3.audioUrl);
    }
  });

  await runner.it('C1-1.4: Cross-test source validation: all 69 questions valid across all 4 provider sources', () => {
    const sourcesToTest = ['6852', 'estudyme-test-1', 'ets-2024-01', 'ets-2026-01'];

    for (const testId of sourcesToTest) {
      const test = loadAnyToeicTest(testId);
      expect(test.length).toBeGreaterThanOrEqual(100);

      for (let qnum = 32; qnum <= 100; qnum++) {
        const cluster = getToeicClusterForQuestion(qnum, test);
        expect(cluster).not.toBeNull();
        expect(cluster?.questions.length).toBe(3);
        expect(cluster?.audioUrl.length).toBeGreaterThan(0);
        expect(cluster?.startQuestionNumber).toBeLessThanOrEqual(qnum);
        expect(cluster?.endQuestionNumber).toBeGreaterThanOrEqual(qnum);
      }
    }
  });

  // =========================================================================
  // SUITE 2: Boundary Stress & Adversarial Edge Cases
  // =========================================================================
  runner.describe('Suite 2: Boundary & Edge Case Stress Testing', () => {});

  await runner.it('C1-2.1: Precise boundary check: Q31 returns null, Q32 returns valid cluster', () => {
    const test = loadAnyToeicTest('6852');

    // Q31 is Part 2 (single question, not in a cluster)
    const c31_a = getToeicClusterForQuestion(31, test);
    const c31_b = getToeicClusterForQuestion(test, 31);
    expect(c31_a).toBeNull();
    expect(c31_b).toBeNull();

    // Q32 is Part 3 first question
    const c32 = getToeicClusterForQuestion(32, test);
    expect(c32).not.toBeNull();
    expect(c32?.part).toBe(3);
    expect(c32?.startQuestionNumber).toBe(32);
    expect(c32?.endQuestionNumber).toBe(34);
  });

  await runner.it('C1-2.2: Precise boundary check: Q70 (Part 3 end) and Q71 (Part 4 start)', () => {
    const test = loadAnyToeicTest('6852');

    // Q70 is the last question of Part 3
    const c70 = getToeicClusterForQuestion(70, test);
    expect(c70).not.toBeNull();
    expect(c70?.part).toBe(3);
    expect(c70?.startQuestionNumber).toBe(68);
    expect(c70?.endQuestionNumber).toBe(70);

    // Q71 is the first question of Part 4
    const c71 = getToeicClusterForQuestion(71, test);
    expect(c71).not.toBeNull();
    expect(c71?.part).toBe(4);
    expect(c71?.startQuestionNumber).toBe(71);
    expect(c71?.endQuestionNumber).toBe(73);
  });

  await runner.it('C1-2.3: Precise boundary check: Q100 (Part 4 end) and Q101 (Part 5 start)', () => {
    const test = loadAnyToeicTest('6852');

    // Q100 is the last question of Part 4
    const c100 = getToeicClusterForQuestion(100, test);
    expect(c100).not.toBeNull();
    expect(c100?.part).toBe(4);
    expect(c100?.startQuestionNumber).toBe(98);
    expect(c100?.endQuestionNumber).toBe(100);

    // Q101 is Part 5 reading (never in a listening cluster)
    const c101_a = getToeicClusterForQuestion(101, test);
    const c101_b = getToeicClusterForQuestion(test, 101);
    expect(c101_a).toBeNull();
    expect(c101_b).toBeNull();
  });

  await runner.it('C1-2.4: Out-of-bounds question numbers strictly return null', () => {
    const test = loadAnyToeicTest('6852');
    const outOfBounds = [-999, -1, 0, 1, 6, 7, 30, 102, 146, 147, 200, 201, 999];

    for (const qnum of outOfBounds) {
      const c1 = getToeicClusterForQuestion(qnum, test);
      const c2 = getToeicClusterForQuestion(test, qnum);
      expect(c1).toBeNull();
      expect(c2).toBeNull();
    }
  });

  await runner.it('C1-2.5: Fuzzing non-numeric & extreme types never throws and gracefully returns null', () => {
    const test = loadAnyToeicTest('6852');
    const fuzzInputs = [
      NaN,
      Infinity,
      -Infinity,
      undefined as any,
      null as any,
      '32' as any,
      'invalid' as any,
      {} as any,
      [] as any,
      true as any,
      false as any,
    ];

    for (const badInput of fuzzInputs) {
      let resultA: any;
      let resultB: any;
      try {
        resultA = getToeicClusterForQuestion(badInput, test);
      } catch (e) {
        throw new Error(`getToeicClusterForQuestion threw on input: ${badInput}`);
      }
      try {
        resultB = getToeicClusterForQuestion(test, badInput);
      } catch (e) {
        throw new Error(`getToeicClusterForQuestion threw on inverted input: ${badInput}`);
      }
      expect(resultA).toBeNull();
      expect(resultB).toBeNull();
    }
  });

  await runner.it('C1-2.6: Float boundary numbers behave safely without exception', () => {
    const test = loadAnyToeicTest('6852');
    // 31.9 < 32 -> returns null
    expect(getToeicClusterForQuestion(31.9, test)).toBeNull();
    // 100.1 > 100 -> returns null
    expect(getToeicClusterForQuestion(100.1, test)).toBeNull();
  });

  await runner.it('C1-2.7: Incomplete/empty question arrays return null safely', () => {
    expect(getToeicClusterForQuestion(32, [])).toBeNull();
    expect(getToeicClusterForQuestion([], 32)).toBeNull();
    expect(getToeicClusterForQuestion(32, null as any)).toBeNull();
    expect(getToeicClusterForQuestion(undefined as any, 32)).toBeNull();
  });

  // =========================================================================
  // SUITE 3: clusterToeicQuestions Partitioning Integrity
  // =========================================================================
  runner.describe('Suite 3: clusterToeicQuestions Partitioning & Disjoint Math', () => {});

  await runner.it('C1-3.1: Exactly 23 clusters: 13 Part 3 and 10 Part 4 clusters', () => {
    const test = loadAnyToeicTest('6852');
    const clusters = clusterToeicQuestions(test);

    expect(clusters.length).toBe(23);
    const p3 = clusters.filter((c) => c.part === 3);
    const p4 = clusters.filter((c) => c.part === 4);
    expect(p3.length).toBe(13);
    expect(p4.length).toBe(10);
  });

  await runner.it('C1-3.2: Disjoint union & full coverage of all 69 listening questions', () => {
    const test = loadAnyToeicTest('6852');
    const clusters = clusterToeicQuestions(test);

    const allClusterQuestionNums: number[] = [];
    for (const cluster of clusters) {
      expect(cluster.questions.length).toBe(3);
      for (const q of cluster.questions) {
        allClusterQuestionNums.push(q.questionNumber);
      }
    }

    // 23 clusters * 3 questions = 69 total questions
    expect(allClusterQuestionNums.length).toBe(69);

    // Verify no duplicates
    const uniqueNums = new Set(allClusterQuestionNums);
    expect(uniqueNums.size).toBe(69);

    // Verify exact set equals [32..100]
    for (let n = 32; n <= 100; n++) {
      expect(uniqueNums.has(n)).toBe(true);
    }
  });

  await runner.it('C1-3.3: Cluster start and end numbers form a strict arithmetic progression', () => {
    const test = loadAnyToeicTest('6852');
    const clusters = clusterToeicQuestions(test);

    // Part 3: starts at 32, step +3
    for (let i = 0; i < 13; i++) {
      const expectedStart = 32 + i * 3;
      const expectedEnd = expectedStart + 2;
      expect(clusters[i].startQuestionNumber).toBe(expectedStart);
      expect(clusters[i].endQuestionNumber).toBe(expectedEnd);
    }

    // Part 4: starts at 71, step +3
    for (let i = 0; i < 10; i++) {
      const cluster = clusters[13 + i];
      const expectedStart = 71 + i * 3;
      const expectedEnd = expectedStart + 2;
      expect(cluster.startQuestionNumber).toBe(expectedStart);
      expect(cluster.endQuestionNumber).toBe(expectedEnd);
    }
  });

  await runner.it('C1-3.4: Filtered subset inputs partition accurately without errors', () => {
    const test = loadAnyToeicTest('6852');

    // Only Part 3 questions passed
    const p3Only = test.filter((q) => q.part === 3);
    const p3Clusters = clusterToeicQuestions(p3Only);
    expect(p3Clusters.length).toBe(13);

    // Only Part 4 questions passed
    const p4Only = test.filter((q) => q.part === 4);
    const p4Clusters = clusterToeicQuestions(p4Only);
    expect(p4Clusters.length).toBe(10);

    // Non-cluster questions passed (Part 1 and 2 only)
    const p1p2 = test.filter((q) => q.part === 1 || q.part === 2);
    const p1p2Clusters = clusterToeicQuestions(p1p2);
    expect(p1p2Clusters.length).toBe(0);

    // Reading questions only (Parts 5, 6, 7)
    const readingOnly = test.filter((q) => q.part >= 5);
    const readingClusters = clusterToeicQuestions(readingOnly);
    expect(readingClusters.length).toBe(0);

    // Empty questions array
    expect(clusterToeicQuestions([]).length).toBe(0);
    expect(clusterToeicQuestions(null as any).length).toBe(0);
  });

  await runner.it('C1-3.5: Unordered/shuffled inputs are strictly sorted in ascending order', () => {
    const test = loadAnyToeicTest('6852');
    // Create a reversed copy of the questions
    const reversed = [...test].reverse();

    const cluster = getToeicClusterForQuestion(32, reversed)!;
    expect(cluster).not.toBeNull();
    const qnums = cluster.questions.map((q) => q.questionNumber);
    expect(qnums).toEqual([32, 33, 34]);

    const allClusters = clusterToeicQuestions(reversed);
    expect(allClusters.length).toBe(23);
    for (const c of allClusters) {
      const nums = c.questions.map((q) => q.questionNumber);
      expect(nums[0]).toBeLessThan(nums[1]);
      expect(nums[1]).toBeLessThan(nums[2]);
    }
  });

  // =========================================================================
  // SUITE 4: Dual Format Classification Stress
  // =========================================================================
  runner.describe('Suite 4: Dual Format Classification Stress', () => {});

  await runner.it('C1-4.1: ETS 2024: all 23 clusters classified as scanned_image with image crop URLs', () => {
    const test = loadAnyToeicTest('ets-2024-01');
    const clusters = clusterToeicQuestions(test);
    expect(clusters.length).toBe(23);

    for (const cluster of clusters) {
      expect(cluster.clusterType).toBe('scanned_image');
      expect(cluster.imageUrl).toBeTruthy();
      expect(typeof cluster.imageUrl).toBe('string');
      // Child question prompts must be empty or blank
      for (const q of cluster.questions) {
        const prompt = q.prompt ? q.prompt.trim() : '';
        expect(prompt).toBe('');
      }
    }
  });

  await runner.it('C1-4.2: ETS 2026: all 23 clusters classified as scanned_image with image crop URLs', () => {
    const test = loadAnyToeicTest('ets-2026-01');
    const clusters = clusterToeicQuestions(test);
    expect(clusters.length).toBe(23);

    for (const cluster of clusters) {
      expect(cluster.clusterType).toBe('scanned_image');
      expect(cluster.imageUrl).toBeTruthy();
      for (const q of cluster.questions) {
        const prompt = q.prompt ? q.prompt.trim() : '';
        expect(prompt).toBe('');
      }
    }
  });

  await runner.it('C1-4.3: Study4 (6852): all 23 clusters classified as text_dialogue', () => {
    const test = loadAnyToeicTest('6852');
    const clusters = clusterToeicQuestions(test);
    expect(clusters.length).toBe(23);

    for (const cluster of clusters) {
      expect(cluster.clusterType).toBe('text_dialogue');
      // Questions have actual text prompt
      for (const q of cluster.questions) {
        expect(q.prompt).toBeTruthy();
        expect(q.prompt!.length).toBeGreaterThan(0);
      }
    }
  });

  await runner.it('C1-4.4: Estudyme: classified as text_dialogue and preserves chart graphic imageUrl', () => {
    const test = loadAnyToeicTest('estudyme-test-1');
    const clusters = clusterToeicQuestions(test);
    expect(clusters.length).toBe(23);

    // All Estudyme clusters have text prompts -> text_dialogue
    for (const cluster of clusters) {
      expect(cluster.clusterType).toBe('text_dialogue');
    }

    // Check graphic clusters: must preserve imageUrl while staying text_dialogue
    const graphicClusters = clusters.filter((c) => c.imageUrl);
    expect(graphicClusters.length).toBeGreaterThan(0);
    for (const gc of graphicClusters) {
      expect(gc.clusterType).toBe('text_dialogue');
      expect(gc.imageUrl).toBeTruthy();
    }
  });

  await runner.it('C1-4.5: Synthetic edge cases: empty prompts without image vs mixed prompts', () => {
    // Case A: Empty prompts but NO image -> must be text_dialogue (no scanned booklet image)
    const mockEmptyNoImg: ToeicUnifiedQuestion[] = [
      {
        id: 'mock-32',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 32,
        part: 3,
        prompt: '',
        options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
        correctAnswer: 'A',
        audioUrl: 'https://example.com/audio.mp3',
      },
      {
        id: 'mock-33',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 33,
        part: 3,
        prompt: '   ',
        options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
        correctAnswer: 'B',
        audioUrl: 'https://example.com/audio.mp3',
      },
      {
        id: 'mock-34',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 34,
        part: 3,
        prompt: '',
        options: [{ key: 'A', text: 'Opt A' }, { key: 'B', text: 'Opt B' }],
        correctAnswer: 'C',
        audioUrl: 'https://example.com/audio.mp3',
      },
    ];
    const clusterA = getToeicClusterForQuestion(32, mockEmptyNoImg)!;
    expect(clusterA.clusterType).toBe('text_dialogue');

    // Case B: 1 question has prompt, image exists -> must be text_dialogue (graphic item)
    const mockGraphicItem: ToeicUnifiedQuestion[] = [
      {
        id: 'mock-35',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 35,
        part: 3,
        prompt: 'What does the man want to do?',
        options: [],
        correctAnswer: 'A',
        audioUrl: 'https://example.com/audio.mp3',
      },
      {
        id: 'mock-36',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 36,
        part: 3,
        prompt: 'Look at the graphic. Where will the speakers meet?',
        imageUrl: 'https://example.com/chart.png',
        options: [],
        correctAnswer: 'B',
        audioUrl: 'https://example.com/audio.mp3',
      },
      {
        id: 'mock-37',
        testId: 'mock-test',
        section: 'listening',
        questionNumber: 37,
        part: 3,
        prompt: 'What will happen next?',
        options: [],
        correctAnswer: 'C',
        audioUrl: 'https://example.com/audio.mp3',
      },
    ];
    const clusterB = getToeicClusterForQuestion(35, mockGraphicItem)!;
    expect(clusterB.clusterType).toBe('text_dialogue');
    expect(clusterB.imageUrl).toBe('https://example.com/chart.png');
  });

  // =========================================================================
  // SUITE 5: Active Cyber Defense, Zero Bulk Leaks & Immutability
  // =========================================================================
  runner.describe('Suite 5: Cyber Defense, Zero Bulk Leaks & Immutability', () => {});

  await runner.it('C1-5.1: stripSensitiveClusterData cleans all sensitive keys from root and children', () => {
    const test = loadAnyToeicTest('6852');
    const cluster = getToeicClusterForQuestion(32, test)!;
    expect(cluster).not.toBeNull();

    // Ensure raw cluster has data to test stripping
    (cluster as any).transcript = 'Sensitive raw dialogue transcript';
    (cluster as any).explanationVi = 'Sensitive Vietnamese explanation';

    const sanitized = stripSensitiveClusterData(cluster);

    // Root level checks
    expect((sanitized as any).transcript).toBeUndefined();
    expect((sanitized as any).explanationVi).toBeUndefined();
    expect((sanitized as any).correctAnswer).toBeUndefined();

    // Child questions checks
    for (const q of sanitized.questions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).explanationVi).toBeUndefined();
      expect((q as any).transcript).toBeUndefined();
    }
  });

  await runner.it('C1-5.2: Deep immutability: mutating sanitized cluster does not affect source', () => {
    const test = loadAnyToeicTest('6852');
    const cluster = getToeicClusterForQuestion(32, test)!;
    const originalTranscript = cluster.transcript;
    const originalFirstQPrompt = cluster.questions[0].prompt;

    const sanitized = stripSensitiveClusterData(cluster);

    // Attempt mutating sanitized
    (sanitized as any).injectedField = 'ATTACK';
    sanitized.questions[0].prompt = 'MALICIOUS_PROMPT_OVERWRITE';

    // Original cluster must remain pristine
    expect((cluster as any).injectedField).toBeUndefined();
    expect(cluster.questions[0].prompt).toBe(originalFirstQPrompt);
    expect(cluster.transcript).toBe(originalTranscript);
  });

  await runner.it('C1-5.3: GET /api/toeic/test zero-leak verification on serialized JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852');
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.clusters)).toBe(true);
    expect(json.clusters.length).toBe(23);

    const rawJsonString = JSON.stringify(json);

    // Thorough search for leaks
    expect(rawJsonString.includes('"correctAnswer"')).toBe(false);
    expect(rawJsonString.includes('"explanationVi"')).toBe(false);
    expect(rawJsonString.includes('"transcript"')).toBe(false);
  });

  await runner.it('C1-5.4: POST /api/toeic/submit returns watermarked reviewClusters with zero-width characters', async () => {
    const answers: Record<number, string> = { 32: 'A', 33: 'B', 34: 'C' };
    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: '6852',
        answers,
        timeSpentSeconds: 120,
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.reviewClusters)).toBe(true);
    expect(json.reviewClusters.length).toBe(23);

    // Verify that watermarking is present in review data
    const cluster32 = json.reviewClusters.find((c: any) => c.startQuestionNumber === 32);
    expect(cluster32).toBeDefined();
    const q32 = cluster32.questions.find((q: any) => q.questionNumber === 32);
    expect(q32).toBeDefined();

    if (q32.explanationVi) {
      const watermark = extractInvisibleWatermark(q32.explanationVi);
      expect(watermark).not.toBeNull();
      expect(watermark).toContain('UID_guest_');
    }
  });
}

// Standalone runner execution
if (process.env.TSX_TEST || require.main === module) {
  const runner = new TestRunner();
  runChallengerM2StressTests(runner).then(() => {
    const stats = runner.getStats();
    console.log('\n================================================================');
    console.log(`CHALLENGER M2 STRESS TEST SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
    console.log('================================================================');
    if (stats.failed > 0) {
      process.exit(1);
    }
  });
}
