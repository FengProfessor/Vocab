/**
 * Challenger 2 — Milestone 2 Iteration 2 Empirical Challenger Test Suite
 *
 * MISSION:
 * Adversarially challenge the E2E exam flow and scoring:
 * - Verify submit payload with cluster-aligned questions computes exact ETS barem score.
 * - Test Part 3 & Part 4 cluster practice submissions (Dual-mode renumbering).
 * - Stress-test intra-cluster partial answering and monotonicity across all 23 clusters.
 * - Verify reviewClusters watermarking, integrity, and active cyber defense on submit route.
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
} from '../../src/lib/toeic-barem';
import {
  loadAnyToeicTest,
  loadToeicPartPractice,
  loadToeicQuestionsByIds,
  getToeicClusterForQuestion,
  clusterToeicQuestions,
} from '../../src/lib/toeic-test-loader';
import { calculateToeicScore, getCefrLevel } from '../../src/lib/toeic-scoring';
import {
  clearBotFlag,
  extractInvisibleWatermark,
  ZW_SENTINEL,
} from '../../src/lib/toeic-anti-scraping';
import { POST as postToeicSubmitApi } from '../../src/app/api/toeic/submit/route';
import type {
  ToeicOptionKey,
  ToeicClientQuestionCluster,
} from '../../src/types/toeic';

function buildSubmitRequest(body: any, ip: string = '127.0.0.1'): NextRequest {
  return new NextRequest('http://localhost:3000/api/toeic/submit', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

export async function runSubmitBaremEmpiricalTests(runner: TestRunner) {
  const testId = '6852';
  const fullQuestions = loadAnyToeicTest(testId);
  const clusters = clusterToeicQuestions(fullQuestions);

  // ════════════════════════════════════════════════════════════════
  // SUITE 1: Full Exam Submission with Part 3 & Part 4 Cluster Alignment
  // ════════════════════════════════════════════════════════════════

  await runner.it('1.1: 0 questions answered in clusters yields exact baseline barem (L=5, R=5, Total=10, CEFR=A1)', async () => {
    clearBotFlag('127.0.0.1');
    const req = buildSubmitRequest({
      testId,
      examMode: 'real',
      answers: {},
      timeSpentSeconds: 3600,
    });
    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(0);
    expect(data.scoreResult.rawReading).toBe(0);
    expect(data.scoreResult.rawTotal).toBe(0);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[0]);
    expect(data.scoreResult.scaledReading).toBe(ETS_READING_BAREM[0]);
    expect(data.scoreResult.scaledTotal).toBe(10);
    expect(data.scoreResult.cefrLevel).toBe('A1');
  });

  await runner.it('1.2: Answering exactly all 39 Part 3 cluster questions correctly yields exact ETS barem for raw 39', async () => {
    clearBotFlag('127.0.0.1');
    const answers: Record<number, ToeicOptionKey> = {};
    for (const q of fullQuestions) {
      if (q.part === 3) {
        answers[q.questionNumber] = q.correctAnswer;
      }
    }
    expect(Object.keys(answers).length).toBe(39);

    const req = buildSubmitRequest({
      testId,
      examMode: 'real',
      answers,
      timeSpentSeconds: 2400,
    });
    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(39);
    expect(data.scoreResult.rawReading).toBe(0);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[39]);
    expect(data.scoreResult.scaledReading).toBe(ETS_READING_BAREM[0]);
    expect(data.scoreResult.scaledTotal).toBe(ETS_LISTENING_BAREM[39] + ETS_READING_BAREM[0]);
    expect(data.scoreResult.partStats[3].correct).toBe(39);
    expect(data.scoreResult.partStats[3].total).toBe(39);
    expect(data.scoreResult.partStats[3].percentage).toBe(100);
    expect(data.scoreResult.partStats[3].accuracyRating).toBe('high');
    expect(data.scoreResult.partStats[4].correct).toBe(0);
  });

  await runner.it('1.3: Answering exactly all 30 Part 4 cluster questions correctly yields exact ETS barem for raw 30', async () => {
    clearBotFlag('127.0.0.1');
    const answers: Record<number, ToeicOptionKey> = {};
    for (const q of fullQuestions) {
      if (q.part === 4) {
        answers[q.questionNumber] = q.correctAnswer;
      }
    }
    expect(Object.keys(answers).length).toBe(30);

    const req = buildSubmitRequest({
      testId,
      examMode: 'real',
      answers,
      timeSpentSeconds: 2000,
    });
    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(30);
    expect(data.scoreResult.rawReading).toBe(0);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[30]);
    expect(data.scoreResult.scaledReading).toBe(ETS_READING_BAREM[0]);
    expect(data.scoreResult.scaledTotal).toBe(ETS_LISTENING_BAREM[30] + ETS_READING_BAREM[0]);
    expect(data.scoreResult.partStats[4].correct).toBe(30);
    expect(data.scoreResult.partStats[4].total).toBe(30);
    expect(data.scoreResult.partStats[4].percentage).toBe(100);
    expect(data.scoreResult.partStats[4].accuracyRating).toBe('high');
    expect(data.scoreResult.partStats[3].correct).toBe(0);
  });

  await runner.it('1.4: Answering all 69 Part 3 & 4 cluster questions correctly yields exact ETS barem for raw 69', async () => {
    clearBotFlag('127.0.0.1');
    const answers: Record<number, ToeicOptionKey> = {};
    for (const q of fullQuestions) {
      if (q.part === 3 || q.part === 4) {
        answers[q.questionNumber] = q.correctAnswer;
      }
    }
    expect(Object.keys(answers).length).toBe(69);

    const req = buildSubmitRequest({
      testId,
      examMode: 'real',
      answers,
      timeSpentSeconds: 3000,
    });
    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(69);
    expect(data.scoreResult.rawReading).toBe(0);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[69]);
    expect(data.scoreResult.scaledReading).toBe(ETS_READING_BAREM[0]);
    expect(data.scoreResult.scaledTotal).toBe(ETS_LISTENING_BAREM[69] + ETS_READING_BAREM[0]);
    expect(data.scoreResult.partStats[3].percentage).toBe(100);
    expect(data.scoreResult.partStats[4].percentage).toBe(100);
  });

  await runner.it('1.5: Perfect 200Q exam yields exact ETS barem maximum (L=495, R=495, Total=990, CEFR=C1)', async () => {
    clearBotFlag('127.0.0.1');
    const answers: Record<number, ToeicOptionKey> = {};
    for (const q of fullQuestions) {
      answers[q.questionNumber] = q.correctAnswer;
    }
    expect(Object.keys(answers).length).toBe(200);

    const req = buildSubmitRequest({
      testId,
      examMode: 'real',
      answers,
      timeSpentSeconds: 5400,
    });
    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(100);
    expect(data.scoreResult.rawReading).toBe(100);
    expect(data.scoreResult.rawTotal).toBe(200);
    expect(data.scoreResult.scaledListening).toBe(495);
    expect(data.scoreResult.scaledReading).toBe(495);
    expect(data.scoreResult.scaledTotal).toBe(990);
    expect(data.scoreResult.cefrLevel).toBe('C1');
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 2: Monotonic Step-by-Step Cluster Progression
  // ════════════════════════════════════════════════════════════════

  await runner.it('2.1: Exactly 23 listening clusters exist (13 in Part 3, 10 in Part 4)', async () => {
    expect(clusters.length).toBe(23);
    const p3Clusters = clusters.filter((c) => (c.part as unknown as number) === 3 || (c.part as unknown as string) === 'part3');
    const p4Clusters = clusters.filter((c) => (c.part as unknown as number) === 4 || (c.part as unknown as string) === 'part4');
    expect(p3Clusters.length).toBe(13);
    expect(p4Clusters.length).toBe(10);
  });

  await runner.it('2.2: Answering clusters 1 through 23 incrementally guarantees strict raw increment and barem monotonicity', async () => {
    const runningAnswers: Record<number, ToeicOptionKey> = {};
    let previousRaw = 0;
    let previousScaled = ETS_LISTENING_BAREM[0];

    for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
      const cluster = clusters[cIdx];
      for (const q of cluster.questions) {
        runningAnswers[q.questionNumber] = q.correctAnswer;
      }

      const scoreResult = calculateToeicScore(runningAnswers, fullQuestions, 100);
      const expectedRaw = (cIdx + 1) * 3;
      expect(scoreResult.rawListening).toBe(expectedRaw);
      expect(scoreResult.rawListening).toBe(previousRaw + 3);

      const expectedScaled = ETS_LISTENING_BAREM[expectedRaw];
      expect(scoreResult.scaledListening).toBe(expectedScaled);
      // Monotonicity invariant: Scaled(k) >= Scaled(k-1)
      expect(scoreResult.scaledListening >= previousScaled).toBe(true);

      previousRaw = scoreResult.rawListening;
      previousScaled = scoreResult.scaledListening;
    }

    expect(previousRaw).toBe(69);
    expect(previousScaled).toBe(ETS_LISTENING_BAREM[69]);
  });

  await runner.it('2.3: Intra-cluster partial answering (0/3 -> 1/3 -> 2/3 -> 3/3) satisfies strict mathematical progression', async () => {
    const cluster = clusters[0]; // Q32, Q33, Q34
    expect(cluster.questions.length).toBe(3);
    const [q1, q2, q3] = cluster.questions;

    // 0/3
    const score0 = calculateToeicScore({}, fullQuestions, 10);
    expect(score0.rawListening).toBe(0);
    expect(score0.scaledListening).toBe(ETS_LISTENING_BAREM[0]);

    // 1/3 (q1 correct)
    const score1 = calculateToeicScore({ [q1.questionNumber]: q1.correctAnswer }, fullQuestions, 20);
    expect(score1.rawListening).toBe(1);
    expect(score1.scaledListening).toBe(ETS_LISTENING_BAREM[1]);
    expect(score1.scaledListening >= score0.scaledListening).toBe(true);

    // 2/3 (q1 correct, q2 correct, q3 incorrect)
    const wrongOpt = q3.correctAnswer === 'A' ? 'B' : 'A';
    const score2 = calculateToeicScore(
      {
        [q1.questionNumber]: q1.correctAnswer,
        [q2.questionNumber]: q2.correctAnswer,
        [q3.questionNumber]: wrongOpt as ToeicOptionKey,
      },
      fullQuestions,
      30
    );
    expect(score2.rawListening).toBe(2);
    expect(score2.scaledListening).toBe(ETS_LISTENING_BAREM[2]);
    expect(score2.scaledListening >= score1.scaledListening).toBe(true);

    // 3/3 (all correct)
    const score3 = calculateToeicScore(
      {
        [q1.questionNumber]: q1.correctAnswer,
        [q2.questionNumber]: q2.correctAnswer,
        [q3.questionNumber]: q3.correctAnswer,
      },
      fullQuestions,
      40
    );
    expect(score3.rawListening).toBe(3);
    expect(score3.scaledListening).toBe(ETS_LISTENING_BAREM[3]);
    expect(score3.scaledListening >= score2.scaledListening).toBe(true);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 3: Part Practice Submissions (Dual-Mode Renumbering Verification)
  // ════════════════════════════════════════════════════════════════

  await runner.it('3.1: Part 3 Practice submit computes exact score and returns all 13 reviewClusters', async () => {
    clearBotFlag('127.0.0.1');
    const p3Practice = loadToeicPartPractice(3, '6852', undefined, true);
    expect(p3Practice.length).toBe(39);
    expect(p3Practice[0].questionNumber).toBe(1);
    expect(p3Practice[38].questionNumber).toBe(39);

    // Answer first 20 questions correctly
    const answers: Record<number, ToeicOptionKey> = {};
    for (let i = 0; i < 20; i++) {
      answers[p3Practice[i].questionNumber] = p3Practice[i].correctAnswer;
    }

    const req = buildSubmitRequest({
      testId: '6852',
      part: 3,
      examMode: 'practice_part',
      answers,
      timeSpentSeconds: 900,
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(20);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[20]);
    expect(data.scoreResult.partStats[3].total).toBe(39);
    expect(data.scoreResult.partStats[3].correct).toBe(20);
    expect(data.scoreResult.partStats[3].percentage).toBe(Math.round((20 / 39) * 100));

    // Verify reviewClusters returned in submit payload
    expect(Array.isArray(data.reviewClusters)).toBe(true);
    expect(data.reviewClusters.length).toBe(13);
    expect(data.reviewClusters[0].startQuestionNumber).toBe(1);
    expect(data.reviewClusters[0].endQuestionNumber).toBe(3);
    expect(data.reviewClusters[12].startQuestionNumber).toBe(37);
    expect(data.reviewClusters[12].endQuestionNumber).toBe(39);

    // Verify sensitive keys ARE present in review mode (for student learning)
    const firstReviewQ = data.reviewClusters[0].questions[0];
    expect(typeof firstReviewQ.correctAnswer).toBe('string');
    expect(typeof firstReviewQ.explanationVi).toBe('string');
    // Verify watermark is embedded in review explanation
    expect(firstReviewQ.explanationVi.includes(ZW_SENTINEL)).toBe(true);
  });

  await runner.it('3.2: Part 4 Practice submit computes exact score and returns all 10 reviewClusters', async () => {
    clearBotFlag('127.0.0.1');
    const p4Practice = loadToeicPartPractice(4, '6852', undefined, true);
    expect(p4Practice.length).toBe(30);
    expect(p4Practice[0].questionNumber).toBe(1);
    expect(p4Practice[29].questionNumber).toBe(30);

    // Answer all 30 questions correctly
    const answers: Record<number, ToeicOptionKey> = {};
    for (let i = 0; i < 30; i++) {
      answers[p4Practice[i].questionNumber] = p4Practice[i].correctAnswer;
    }

    const req = buildSubmitRequest({
      testId: '6852',
      part: 4,
      examMode: 'practice_part',
      answers,
      timeSpentSeconds: 850,
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(30);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[30]);
    expect(data.scoreResult.partStats[4].total).toBe(30);
    expect(data.scoreResult.partStats[4].correct).toBe(30);
    expect(data.scoreResult.partStats[4].percentage).toBe(100);

    // Verify reviewClusters returned in submit payload
    expect(Array.isArray(data.reviewClusters)).toBe(true);
    expect(data.reviewClusters.length).toBe(10);
    expect(data.reviewClusters[0].startQuestionNumber).toBe(1);
    expect(data.reviewClusters[0].endQuestionNumber).toBe(3);
    expect(data.reviewClusters[9].startQuestionNumber).toBe(28);
    expect(data.reviewClusters[9].endQuestionNumber).toBe(30);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 4: QuestionIds Mode Submission (Anti-Duplication Alignment)
  // ════════════════════════════════════════════════════════════════

  await runner.it('4.1: Submitting specific questionIds maps answers 1..N and computes exact barem score', async () => {
    clearBotFlag('127.0.0.1');
    const p3Practice = loadToeicPartPractice(3, '6852', 6, true);
    expect(p3Practice.length).toBe(6);
    const questionIds = p3Practice.map((q) => q.id);

    // Client answers 4 of 6 correctly
    const answers: Record<number, ToeicOptionKey> = {
      1: p3Practice[0].correctAnswer,
      2: p3Practice[1].correctAnswer,
      3: p3Practice[2].correctAnswer,
      4: p3Practice[3].correctAnswer,
      5: (p3Practice[4].correctAnswer === 'A' ? 'B' : 'A') as ToeicOptionKey,
      6: (p3Practice[5].correctAnswer === 'C' ? 'D' : 'C') as ToeicOptionKey,
    };

    const req = buildSubmitRequest({
      testId: '6852',
      examMode: 'practice',
      questionIds,
      answers,
      timeSpentSeconds: 120,
    });

    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.scoreResult.rawListening).toBe(4);
    expect(data.scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[4]);
    expect(data.reviewQuestions.length).toBe(6);
    expect(data.reviewQuestions[0].questionNumber).toBe(1);
    expect(data.reviewQuestions[5].questionNumber).toBe(6);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 5: Adversarial Inputs & Active Cyber Defense
  // ════════════════════════════════════════════════════════════════

  await runner.it('5.1: Lowercase and padded whitespace answer keys are recognized accurately', async () => {
    const q32 = fullQuestions.find((q) => q.questionNumber === 32)!;
    const q33 = fullQuestions.find((q) => q.questionNumber === 33)!;

    const answers: Record<number, any> = {
      32: `  ${q32.correctAnswer.toLowerCase()}  \n`,
      33: `\t${q33.correctAnswer}\r`,
    };

    const scoreResult = calculateToeicScore(answers, fullQuestions, 60);
    expect(scoreResult.rawListening).toBe(2);
    expect(scoreResult.scaledListening).toBe(ETS_LISTENING_BAREM[2]);
  });

  await runner.it('5.2: Hidden honeypot fields trigger silent bot quarantine and return poisoned review data', async () => {
    const botIp = '198.51.100.99';
    clearBotFlag(botIp);

    const req = buildSubmitRequest(
      {
        testId: '6852',
        answers: { 32: 'A', 33: 'B' },
        _hp_trap: 'malicious_scraper_bot',
        timeSpentSeconds: 50,
      },
      botIp
    );

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200); // Silent 200 OK
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isPoisoned).toBe(true);
    // Review questions should be poisoned
    expect(Array.isArray(data.reviewQuestions)).toBe(true);
  });

  await runner.it('5.3: Out-of-bounds question numbers trigger silent bot quarantine', async () => {
    const botIp = '198.51.100.98';
    clearBotFlag(botIp);

    const req = buildSubmitRequest(
      {
        testId: '6852',
        answers: { 32: 'A', 999: 'D' }, // ghost key 999
        timeSpentSeconds: 50,
      },
      botIp
    );

    const res = await postToeicSubmitApi(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isPoisoned).toBe(true);
  });

  // ════════════════════════════════════════════════════════════════
  // SUITE 6: Monotonicity & Barem Exhaustive Mathematical Proof
  // ════════════════════════════════════════════════════════════════

  await runner.it('6.1: ETS Listening Barem is monotonically non-decreasing across all 101 points [0..100]', async () => {
    expect(ETS_LISTENING_BAREM.length).toBe(101);
    for (let i = 0; i < 100; i++) {
      const curr = ETS_LISTENING_BAREM[i];
      const next = ETS_LISTENING_BAREM[i + 1];
      expect(next >= curr).toBe(true);
    }
  });

  await runner.it('6.2: ETS Reading Barem is monotonically non-decreasing across all 101 points [0..100]', async () => {
    expect(ETS_READING_BAREM.length).toBe(101);
    for (let i = 0; i < 100; i++) {
      const curr = ETS_READING_BAREM[i];
      const next = ETS_READING_BAREM[i + 1];
      expect(next >= curr).toBe(true);
    }
  });

  await runner.it('6.3: Boundary lookups match ETS official limits exactly', async () => {
    expect(lookupListeningScore(0)).toBe(5);
    expect(lookupListeningScore(100)).toBe(495);
    expect(lookupReadingScore(0)).toBe(5);
    expect(lookupReadingScore(100)).toBe(495);
    expect(lookupListeningScore(-10)).toBe(5);
    expect(lookupListeningScore(200)).toBe(495);
    expect(lookupReadingScore(-10)).toBe(5);
    expect(lookupReadingScore(200)).toBe(495);
  });

  await runner.it('6.4: Official CEFR scale alignment is strictly preserved', async () => {
    expect(getCefrLevel(10)).toBe('A1');
    expect(getCefrLevel(254)).toBe('A1');
    expect(getCefrLevel(255)).toBe('A2');
    expect(getCefrLevel(404)).toBe('A2');
    expect(getCefrLevel(405)).toBe('B1');
    expect(getCefrLevel(604)).toBe('B1');
    expect(getCefrLevel(605)).toBe('B2');
    expect(getCefrLevel(904)).toBe('B2');
    expect(getCefrLevel(905)).toBe('C1');
    expect(getCefrLevel(990)).toBe('C1');
  });
}

async function main() {
  console.log('\n================================================================');
  console.log('  CHALLENGER 2: M2 ITERATION 2 SUBMIT & BAREM EMPIRICAL SUITE   ');
  console.log('================================================================\n');

  const runner = new TestRunner();
  await runSubmitBaremEmpiricalTests(runner);
  const stats = runner.getStats();

  console.log('\n' + '='.repeat(64));
  console.log(`CH2-M2 EMPIRICAL VERIFICATION SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
  console.log('='.repeat(64) + '\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
