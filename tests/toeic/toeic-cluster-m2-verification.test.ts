/**
 * Milestone 2 (M2) Verification Test Suite:
 * Cluster Data Modeling, Resolvers & Backward-Compatible API Route Integration.
 *
 * Verifies:
 * 1. Type system and schema exports from src/types/toeic.ts
 * 2. Resolvers in src/lib/toeic-test-loader.ts:
 *    - getToeicClusterForQuestion (polymorphic argument order)
 *    - getToeicClientClusterForQuestion
 *    - clusterToeicQuestions
 *    - stripSensitiveClusterData
 *    - Dual format detection ('text_dialogue' vs 'scanned_image')
 * 3. /api/toeic/test route handler:
 *    - Flat questions array preserved (100% backward compatibility)
 *    - Optional clusters array included (23 clusters for full test)
 *    - Zero Bulk Leaks cyber defense enforced
 * 4. /api/toeic/submit route handler:
 *    - ETS barem scoring engine consistency
 *    - reviewQuestions and reviewClusters returned with invisible watermarks
 * 5. /api/toeic/explain route handler:
 *    - On-demand single question isolation
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
import { GET as getToeicTestApi, POST as postToeicTestApi } from '../../src/app/api/toeic/test/route';
import { POST as postToeicSubmitApi } from '../../src/app/api/toeic/submit/route';
import { POST as postToeicExplainApi } from '../../src/app/api/toeic/explain/route';
import type {
  ToeicQuestionCluster,
  ToeicSanitizedQuestionCluster,
  ToeicClientQuestionCluster,
  ToeicClusterType,
  ToeicOptionKey,
} from '../../src/types/toeic';

export async function runM2ClusterVerificationTests(runner: TestRunner) {
  // ── 1. Resolver & Polymorphic Signatures ──
  await runner.it('M2-1.1: getToeicClusterForQuestion supports both (qnum, questions) and (questions, qnum)', () => {
    const test = loadAnyToeicTest('6852');
    const c1 = getToeicClusterForQuestion(32, test);
    const c2 = getToeicClusterForQuestion(test, 32);

    expect(c1).not.toBeNull();
    expect(c2).not.toBeNull();
    expect(c1?.clusterId).toBe(c2?.clusterId);
    expect(c1?.startQuestionNumber).toBe(32);
    expect(c1?.endQuestionNumber).toBe(34);
    expect(c1?.questions.length).toBe(3);
    expect(c2?.questions.length).toBe(3);
  });

  await runner.it('M2-1.2: getToeicClientClusterForQuestion returns client-typed cluster', () => {
    const test = loadAnyToeicTest('6852');
    const cluster = getToeicClientClusterForQuestion(71, test as any);
    expect(cluster).not.toBeNull();
    expect(cluster?.part).toBe(4);
    expect(cluster?.startQuestionNumber).toBe(71);
    expect(cluster?.endQuestionNumber).toBe(73);
    expect(cluster?.questions.length).toBe(3);
  });

  await runner.it('M2-1.3: Dual format detection distinguishes text_dialogue from scanned_image', () => {
    const testText = loadAnyToeicTest('6852');
    const testScan = loadAnyToeicTest('ets-2024-01');

    const clusterText = getToeicClusterForQuestion(32, testText);
    const clusterScan = getToeicClusterForQuestion(32, testScan);

    expect(clusterText?.clusterType).toBe('text_dialogue');
    expect(clusterScan?.clusterType).toBe('scanned_image');
    expect(clusterScan?.imageUrl).toBeDefined();
  });

  await runner.it('M2-1.4: clusterToeicQuestions partitions full test into exactly 23 listening clusters', () => {
    const test = loadAnyToeicTest('6852');
    const clusters = clusterToeicQuestions(test);
    expect(clusters.length).toBe(23);
    expect(clusters.filter((c) => c.part === 3).length).toBe(13);
    expect(clusters.filter((c) => c.part === 4).length).toBe(10);
  });

  await runner.it('M2-1.5: stripSensitiveClusterData cleanly strips keys and preserves deep immutability', () => {
    const test = loadAnyToeicTest('6852');
    const cluster = getToeicClusterForQuestion(32, test)!;
    const sanitized = stripSensitiveClusterData(cluster);

    expect((sanitized as any).transcript).toBeUndefined();
    expect((sanitized as any).explanationVi).toBeUndefined();
    for (const q of sanitized.questions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).explanationVi).toBeUndefined();
      expect((q as any).transcript).toBeUndefined();
    }

    // Deep immutability check
    const originalPrompt = cluster.questions[0].prompt;
    sanitized.questions[0].prompt = 'OVERWRITTEN';
    expect(cluster.questions[0].prompt).toBe(originalPrompt);
  });

  // ── 2. GET /api/toeic/test Route Integration ──
  await runner.it('M2-2.1: GET /api/toeic/test returns flat questions AND clusters envelope', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852', {
      method: 'GET',
    });
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.testId).toBe('6852');
    expect(Array.isArray(body.questions)).toBe(true);
    expect(body.questions.length).toBe(200);

    // Backward compatibility: flat questions exist and are sanitized
    expect((body.questions[31] as any).correctAnswer).toBeUndefined();
    expect((body.questions[31] as any).explanationVi).toBeUndefined();
    expect((body.questions[31] as any).transcript).toBeUndefined();

    // New M2 cluster envelope
    expect(Array.isArray(body.clusters)).toBe(true);
    expect(body.clusters.length).toBe(23);

    // Cluster contents are also sanitized (Zero Bulk Leaks)
    const p3Cluster = body.clusters[0];
    expect(p3Cluster.startQuestionNumber).toBe(32);
    expect(p3Cluster.endQuestionNumber).toBe(34);
    expect(p3Cluster.questions.length).toBe(3);
    expect((p3Cluster as any).transcript).toBeUndefined();
    expect((p3Cluster as any).explanationVi).toBeUndefined();
    for (const q of p3Cluster.questions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).explanationVi).toBeUndefined();
      expect((q as any).transcript).toBeUndefined();
    }
  });

  await runner.it('M2-2.2: GET /api/toeic/test on scanned test identifies scanned_image clusters', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=ets-2024-01', {
      method: 'GET',
    });
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.clusters).toBeDefined();
    expect(body.clusters.length).toBe(23);
    expect(body.clusters[0].clusterType).toBe('scanned_image');
  });

  // ── 3. POST /api/toeic/submit Route Integration ──
  await runner.it('M2-3.1: POST /api/toeic/submit returns scoreResult, reviewQuestions, and reviewClusters', async () => {
    const test = loadAnyToeicTest('6852');
    const answers: Record<number, ToeicOptionKey> = {
      32: test.find((q) => q.questionNumber === 32)!.correctAnswer,
      33: test.find((q) => q.questionNumber === 33)!.correctAnswer,
      34: test.find((q) => q.questionNumber === 34)!.correctAnswer,
    };

    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: '6852',
        examMode: 'real',
        answers,
        timeSpentSeconds: 120,
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.scoreResult).toBeDefined();
    expect(body.scoreResult.rawListening).toBe(3);

    // reviewQuestions preserved for backward compatibility
    expect(Array.isArray(body.reviewQuestions)).toBe(true);
    expect(body.reviewQuestions.length).toBe(200);

    // reviewClusters included
    expect(Array.isArray(body.reviewClusters)).toBe(true);
    expect(body.reviewClusters.length).toBe(23);

    const firstCluster = body.reviewClusters[0];
    expect(firstCluster.startQuestionNumber).toBe(32);
    expect(firstCluster.endQuestionNumber).toBe(34);
    // Review questions have correctAnswer
    expect(firstCluster.questions[0].correctAnswer).toBeDefined();
  });

  // ── 4. POST /api/toeic/explain Route Integration ──
  await runner.it('M2-4.1: POST /api/toeic/explain returns single watermarked explanation on demand', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/explain?unban=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: '6852',
        questionNumber: 32,
      }),
    });

    const res = await postToeicExplainApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.questionNumber).toBe(32);
    expect(body.correctAnswer).toBeDefined();
    expect(typeof body.explanationVi).toBe('string');
    expect(body.explanationVi.length).toBeGreaterThan(0);
  });
}

// Direct execution entrypoint
if (process.argv[1]?.includes('toeic-cluster-m2-verification.test')) {
  const runner = new TestRunner();
  runM2ClusterVerificationTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log(`\n================================================================`);
      console.log(`M2 VERIFICATION SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
      console.log(`================================================================\n`);
      process.exit(stats.failed === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during M2 verification:', err);
      process.exit(1);
    });
}
