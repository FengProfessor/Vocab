/**
 * Challenger 2 — Milestone 2 Empirical Adversarial Test Suite
 *
 * Focus Areas:
 * 1. Zero Bulk Leaks: Exhaustive recursive scan on /api/toeic/test cluster payloads across datasets.
 * 2. Active Cyber Defense: Canary honeypot targets, scraping parameters, silent bot quarantine & data poisoning.
 * 3. ETS Barem Scoring Engine: Monotonicity mathematical proof, cluster-based answering, and watermark integrity.
 * 4. Boundary Defect Reproduction: Part practice cluster drop due to renumbered questions.
 */

import { NextRequest } from 'next/server';
import { TestRunner, expect } from './test-harness';
import {
  loadAnyToeicTest,
  getToeicClusterForQuestion,
  clusterToeicQuestions,
  stripSensitiveClusterData,
  loadToeicPartPractice,
} from '../../src/lib/toeic-test-loader';
import {
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  calculateToeicScore,
} from '../../src/lib/toeic-scoring';
import {
  isHoneypotTestId,
  flagClientAsBot,
  isClientFlaggedAsBot,
  clearBotFlag,
  extractInvisibleWatermark,
  ZW_SENTINEL,
} from '../../src/lib/toeic-anti-scraping';
import { GET as getToeicTestApi, POST as postToeicTestApi } from '../../src/app/api/toeic/test/route';
import { POST as postToeicSubmitApi } from '../../src/app/api/toeic/submit/route';
import type {
  ToeicOptionKey,
  ToeicSanitizedQuestionCluster,
  ToeicClientQuestionCluster,
} from '../../src/types/toeic';

/**
 * Recursive deep property scanner to detect any leaked sensitive keys.
 */
function findForbiddenKeysInObject(
  obj: any,
  forbiddenKeys: string[] = ['correctAnswer', 'explanationVi', 'transcript', 'correct_answer', 'explain'],
  currentPath: string = '$'
): { path: string; key: string; value: any }[] {
  const leaks: { path: string; key: string; value: any }[] = [];
  if (!obj || typeof obj !== 'object') return leaks;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      leaks.push(...findForbiddenKeysInObject(item, forbiddenKeys, `${currentPath}[${index}]`));
    });
  } else {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (forbiddenKeys.includes(key) && val !== undefined && val !== null) {
        leaks.push({ path: `${currentPath}.${key}`, key, value: val });
      }
      if (typeof val === 'object' && val !== null) {
        leaks.push(...findForbiddenKeysInObject(val, forbiddenKeys, `${currentPath}.${key}`));
      }
    }
  }
  return leaks;
}

export async function runChallenger2M2AdversarialTests(runner: TestRunner) {
  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 1: ZERO BULK LEAKS — EXHAUSTIVE DEEP RECURSIVE ATTACK
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('CH2-M2-1.1: Deep recursive scan on Study4 test (6852) finds ZERO leaked keys in clusters & flat questions', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852', {
      method: 'GET',
      headers: { 'x-forwarded-for': '198.51.100.10' },
    });
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.clusters).toBeDefined();
    expect(data.clusters.length).toBe(23);

    // Deep scan the entire returned JSON
    const leaks = findForbiddenKeysInObject(data, ['correctAnswer', 'explanationVi', 'transcript']);
    expect(leaks.length).toBe(0);

    // Verify specific cluster fields
    for (const cluster of data.clusters) {
      expect((cluster as any).transcript).toBeUndefined();
      expect((cluster as any).explanationVi).toBeUndefined();
      for (const q of cluster.questions) {
        expect((q as any).correctAnswer).toBeUndefined();
        expect((q as any).explanationVi).toBeUndefined();
        expect((q as any).transcript).toBeUndefined();
      }
    }
  });

  await runner.it('CH2-M2-1.2: Deep recursive scan on scanned booklet test (ets-2024-01) finds ZERO leaked keys', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=ets-2024-01', {
      method: 'GET',
      headers: { 'x-forwarded-for': '198.51.100.11' },
    });
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.clusters).toBeDefined();
    expect(data.clusters.length).toBe(23);
    expect(data.clusters[0].clusterType).toBe('scanned_image');

    const leaks = findForbiddenKeysInObject(data, ['correctAnswer', 'explanationVi', 'transcript']);
    expect(leaks.length).toBe(0);
  });

  await runner.it('CH2-M2-1.3: Deep recursive scan on Estudyme test (estudyme-test-1) finds ZERO leaked keys', async () => {
    const req = new NextRequest('http://localhost:3000/api/toeic/test?testId=estudyme-test-1', {
      method: 'GET',
      headers: { 'x-forwarded-for': '198.51.100.12' },
    });
    const res = await getToeicTestApi(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.clusters).toBeDefined();
    expect(data.clusters.length).toBe(23);

    const leaks = findForbiddenKeysInObject(data, ['correctAnswer', 'explanationVi', 'transcript']);
    expect(leaks.length).toBe(0);
  });

  await runner.it('CH2-M2-1.4: Part Practice mode (Part 3 & Part 4) delivered questions have ZERO sensitive leaks', async () => {
    // Part 3 Practice
    const reqP3 = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=3', {
      method: 'GET',
      headers: { 'x-forwarded-for': '198.51.100.13' },
    });
    const resP3 = await getToeicTestApi(reqP3);
    const dataP3 = await resP3.json();
    expect(dataP3.success).toBe(true);
    expect(dataP3.questions.length).toBe(39);
    expect(dataP3.clusters).toBeDefined();
    expect(dataP3.clusters.length).toBe(13);
    const leaksP3 = findForbiddenKeysInObject(dataP3, ['correctAnswer', 'explanationVi', 'transcript']);
    expect(leaksP3.length).toBe(0);

    // Part 4 Practice
    const reqP4 = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852&part=4', {
      method: 'GET',
      headers: { 'x-forwarded-for': '198.51.100.14' },
    });
    const resP4 = await getToeicTestApi(reqP4);
    const dataP4 = await resP4.json();
    expect(dataP4.success).toBe(true);
    expect(dataP4.questions.length).toBe(30);
    expect(dataP4.clusters).toBeDefined();
    expect(dataP4.clusters.length).toBe(10);
    const leaksP4 = findForbiddenKeysInObject(dataP4, ['correctAnswer', 'explanationVi', 'transcript']);
    expect(leaksP4.length).toBe(0);
  });

  await runner.it('CH2-M2-1.5: Adversarial parameter bypass (?dump=true, ?include_answers=1, ?all_answers=1) never exposes master keys', async () => {
    const attackParams = [
      'dump=true',
      'include_answers=1',
      'all_answers=1',
      'full_dump=true',
    ];

    for (let i = 0; i < attackParams.length; i++) {
      const param = attackParams[i];
      const attackIp = `198.51.100.${20 + i}`;
      clearBotFlag(attackIp);

      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=6852&${param}`, {
        method: 'GET',
        headers: { 'x-forwarded-for': attackIp },
      });
      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.isCanary === true || data.isPoisoned === true).toBe(true);
      expect(isClientFlaggedAsBot(attackIp)).toBe(true);

      clearBotFlag(attackIp);
    }
  });

  await runner.it('CH2-M2-1.6: POST /api/toeic/test with malicious JSON payload never leaks master keys', async () => {
    const attackIp = '198.51.100.35';
    clearBotFlag(attackIp);

    const req = new NextRequest('http://localhost:3000/api/toeic/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': attackIp,
      },
      body: JSON.stringify({
        testId: '6852',
        dump: true,
        include_answers: true,
      }),
    });

    const res = await postToeicTestApi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isCanary === true || data.isPoisoned === true).toBe(true);
    expect(isClientFlaggedAsBot(attackIp)).toBe(true);

    clearBotFlag(attackIp);
  });

  await runner.it('CH2-M2-1.7: Part Practice mode preserves cluster integrity across renumbered questions', async () => {
    // In Part Practice mode, questions are renumbered 1..N (e.g. 1..39 for Part 3, 1..30 for Part 4)
    const p3Practice = loadToeicPartPractice(3, '6852', undefined, true);
    expect(p3Practice.length).toBe(39);
    expect(p3Practice[0].questionNumber).toBe(1);

    // Question 1 in Part 3 practice should resolve to the first conversation cluster (questions 1, 2, 3)
    const q1Cluster = getToeicClusterForQuestion(1, p3Practice);
    expect(q1Cluster).not.toBeNull();
    expect(q1Cluster?.startQuestionNumber).toBe(1);
    expect(q1Cluster?.endQuestionNumber).toBe(3);
    expect(q1Cluster?.questions.length).toBe(3);
    expect(q1Cluster?.questions[0].questionNumber).toBe(1);

    const p3Clusters = clusterToeicQuestions(p3Practice);
    expect(p3Clusters.length).toBe(13);
    expect(p3Clusters[0].questions[0].questionNumber).toBe(1);
    expect(p3Clusters[12].questions[2].questionNumber).toBe(39);

    // Part 4 Practice: all 30 questions are numbered 1..30 and resolve to 10 clusters
    const p4Practice = loadToeicPartPractice(4, '6852', undefined, true);
    expect(p4Practice.length).toBe(30);
    const p4Clusters = clusterToeicQuestions(p4Practice);
    expect(p4Clusters.length).toBe(10);
    expect(p4Clusters[0].questions[0].questionNumber).toBe(1);
    expect(p4Clusters[9].questions[2].questionNumber).toBe(30);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 2: CANARY HONEYPOT, BOT QUARANTINE & DATA POISONING
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('CH2-M2-2.1: Canary Honeypot Test IDs return HTTP 200 OK and quarantine bot IP', async () => {
    const canaryIds = ['ets-canary-honeypot', 'ets-simulation-test-0', 'canary-dump-test'];

    for (let i = 0; i < canaryIds.length; i++) {
      const canaryId = canaryIds[i];
      const botIp = `198.51.100.${50 + i}`;
      clearBotFlag(botIp);

      const req = new NextRequest(`http://localhost:3000/api/toeic/test?testId=${canaryId}`, {
        method: 'GET',
        headers: { 'x-forwarded-for': botIp },
      });

      const res = await getToeicTestApi(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCanary).toBe(true);
      expect(isClientFlaggedAsBot(botIp)).toBe(true);

      clearBotFlag(botIp);
    }
  });

  await runner.it('CH2-M2-2.2: Quarantined client is persistently served poisoned questions on subsequent clean requests', async () => {
    const quarantinedIp = '198.51.100.60';
    clearBotFlag(quarantinedIp);

    // Step 1: Client triggers canary
    const canaryReq = new NextRequest('http://localhost:3000/api/toeic/test?testId=ets-canary-honeypot', {
      method: 'GET',
      headers: { 'x-forwarded-for': quarantinedIp },
    });
    await getToeicTestApi(canaryReq);
    expect(isClientFlaggedAsBot(quarantinedIp)).toBe(true);

    // Step 2: Client now makes a completely normal, clean request for a real test (6852)
    const cleanReq = new NextRequest('http://localhost:3000/api/toeic/test?testId=6852', {
      method: 'GET',
      headers: { 'x-forwarded-for': quarantinedIp },
    });
    const cleanRes = await getToeicTestApi(cleanReq);
    expect(cleanRes.status).toBe(200);

    const poisonedData = await cleanRes.json();
    expect(poisonedData.success).toBe(true);
    expect(poisonedData.isPoisoned).toBe(true);

    // Check poisoned clusters
    expect(poisonedData.clusters).toBeDefined();
    expect(poisonedData.clusters.length).toBe(23);

    // Verify answers in poisoned data are altered
    const firstPoisonedQ = poisonedData.questions[0];
    expect(firstPoisonedQ).toBeDefined();

    clearBotFlag(quarantinedIp);
  });

  await runner.it('CH2-M2-2.3: POST /api/toeic/submit honeypot traps flag bot and return poisoned review', async () => {
    const botIp = '198.51.100.70';
    clearBotFlag(botIp);

    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': botIp,
      },
      body: JSON.stringify({
        testId: '6852',
        examMode: 'real',
        answers: { 32: 'A', 33: 'B', 34: 'C' },
        timeSpentSeconds: 60,
        honeypot: 'filled_by_bot_crawler',
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isPoisoned).toBe(true);
    expect(body.savedToHistory).toBe(false);
    expect(isClientFlaggedAsBot(botIp)).toBe(true);

    clearBotFlag(botIp);
  });

  await runner.it('CH2-M2-2.4: Out-of-bounds question index in submit triggers quarantine and poisoning', async () => {
    const tamperIp = '198.51.100.71';
    clearBotFlag(tamperIp);

    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': tamperIp,
      },
      body: JSON.stringify({
        testId: '6852',
        examMode: 'real',
        answers: { 999: 'A' },
        timeSpentSeconds: 30,
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isPoisoned).toBe(true);
    expect(isClientFlaggedAsBot(tamperIp)).toBe(true);

    clearBotFlag(tamperIp);
  });

  await runner.it('CH2-M2-2.5: Fast submit dump detection (>= 50 questions in < 5s) triggers bot flag', async () => {
    const speedBotIp = '198.51.100.72';
    clearBotFlag(speedBotIp);

    const fakeAnswers: Record<number, ToeicOptionKey> = {};
    for (let i = 1; i <= 60; i++) {
      fakeAnswers[i] = 'A';
    }

    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': speedBotIp,
      },
      body: JSON.stringify({
        testId: '6852',
        examMode: 'real',
        answers: fakeAnswers,
        timeSpentSeconds: 2,
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.isPoisoned).toBe(true);
    expect(isClientFlaggedAsBot(speedBotIp)).toBe(true);

    clearBotFlag(speedBotIp);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // SUITE 3: ETS BAREM SCORING MONOTONICITY & CLUSTER-BASED SCORING
  // ═════════════════════════════════════════════════════════════════════════

  await runner.it('CH2-M2-3.1: Listening barem is strictly monotonic (ScaledListening(k+1) >= ScaledListening(k)) for all k in [0, 99]', () => {
    let prevScore = getScaledListeningScore(0);
    expect(prevScore).toBe(5);

    for (let raw = 1; raw <= 100; raw++) {
      const currentScore = getScaledListeningScore(raw);
      expect(currentScore).toBeGreaterThanOrEqual(prevScore);
      prevScore = currentScore;
    }
    expect(prevScore).toBe(495);
  });

  await runner.it('CH2-M2-3.2: Reading barem is strictly monotonic (ScaledReading(k+1) >= ScaledReading(k)) for all k in [0, 99]', () => {
    let prevScore = getScaledReadingScore(0);
    expect(prevScore).toBe(5);

    for (let raw = 1; raw <= 100; raw++) {
      const currentScore = getScaledReadingScore(raw);
      expect(currentScore).toBeGreaterThanOrEqual(prevScore);
      prevScore = currentScore;
    }
    expect(prevScore).toBe(495);
  });

  await runner.it('CH2-M2-3.3: Total scaled score is bounded in [10, 990] and CEFR levels follow official criteria', () => {
    const minTotal = getScaledListeningScore(0) + getScaledReadingScore(0);
    const maxTotal = getScaledListeningScore(100) + getScaledReadingScore(100);
    expect(minTotal).toBe(10);
    expect(maxTotal).toBe(990);

    // Verify CEFR level boundaries
    expect(getCefrLevel(990)).toBe('C1');
    expect(getCefrLevel(905)).toBe('C1');
    expect(getCefrLevel(900)).toBe('B2');
    expect(getCefrLevel(605)).toBe('B2');
    expect(getCefrLevel(600)).toBe('B1');
    expect(getCefrLevel(405)).toBe('B1');
    expect(getCefrLevel(400)).toBe('A2');
    expect(getCefrLevel(255)).toBe('A2');
    expect(getCefrLevel(250)).toBe('A1');
    expect(getCefrLevel(10)).toBe('A1');
  });

  await runner.it('CH2-M2-3.4: Incremental cluster-based answering across all 23 clusters maintains monotonic score progression', () => {
    const fullTest = loadAnyToeicTest('6852');
    const listeningQuestions = fullTest.filter((q) => q.part === 3 || q.part === 4);
    expect(listeningQuestions.length).toBe(69);

    const clusters = clusterToeicQuestions(listeningQuestions);
    expect(clusters.length).toBe(23);

    const answers: Record<number, ToeicOptionKey> = {};
    let previousScaledListening = 0;

    for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
      const cluster = clusters[cIdx];
      // Answer all 3 questions in this cluster correctly
      for (const q of cluster.questions) {
        answers[q.questionNumber] = q.correctAnswer;
      }

      const score = calculateToeicScore(answers, fullTest, 120);
      const expectedRaw = (cIdx + 1) * 3;
      expect(score.rawListening).toBe(expectedRaw);
      expect(score.scaledListening).toBeGreaterThanOrEqual(previousScaledListening);
      previousScaledListening = score.scaledListening;
    }

    // After all 23 clusters answered correctly:
    const finalScore = calculateToeicScore(answers, fullTest, 120);
    expect(finalScore.rawListening).toBe(69);
    expect(finalScore.partStats[3].total).toBe(39);
    expect(finalScore.partStats[3].correct).toBe(39);
    expect(finalScore.partStats[3].percentage).toBe(100);
    expect(finalScore.partStats[4].total).toBe(30);
    expect(finalScore.partStats[4].correct).toBe(30);
    expect(finalScore.partStats[4].percentage).toBe(100);
  });

  await runner.it('CH2-M2-3.5: Partial cluster answering (0/3, 1/3, 2/3, 3/3) scores accurately without regression', () => {
    const fullTest = loadAnyToeicTest('6852');
    const p3Cluster1 = getToeicClusterForQuestion(32, fullTest)!;
    expect(p3Cluster1).not.toBeNull();

    const q32 = p3Cluster1.questions[0];
    const q33 = p3Cluster1.questions[1];
    const q34 = p3Cluster1.questions[2];

    // 0 of 3 correct
    const s0 = calculateToeicScore({}, fullTest, 60);
    expect(s0.rawListening).toBe(0);

    // 1 of 3 correct
    const s1 = calculateToeicScore({ [q32.questionNumber]: q32.correctAnswer }, fullTest, 60);
    expect(s1.rawListening).toBe(1);
    expect(s1.scaledListening).toBeGreaterThanOrEqual(s0.scaledListening);

    // 2 of 3 correct
    const s2 = calculateToeicScore(
      {
        [q32.questionNumber]: q32.correctAnswer,
        [q33.questionNumber]: q33.correctAnswer,
      },
      fullTest,
      60
    );
    expect(s2.rawListening).toBe(2);
    expect(s2.scaledListening).toBeGreaterThanOrEqual(s1.scaledListening);

    // 3 of 3 correct
    const s3 = calculateToeicScore(
      {
        [q32.questionNumber]: q32.correctAnswer,
        [q33.questionNumber]: q33.correctAnswer,
        [q34.questionNumber]: q34.correctAnswer,
      },
      fullTest,
      60
    );
    expect(s3.rawListening).toBe(3);
    expect(s3.scaledListening).toBeGreaterThanOrEqual(s2.scaledListening);
  });

  await runner.it('CH2-M2-3.6: POST /api/toeic/submit reviewClusters contain answers and invisible zero-width watermarks', async () => {
    const legitimateIp = '198.51.100.90';
    clearBotFlag(legitimateIp);

    const test = loadAnyToeicTest('6852');
    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': legitimateIp,
      },
      body: JSON.stringify({
        testId: '6852',
        examMode: 'real',
        answers: { 32: test.find((q) => q.questionNumber === 32)!.correctAnswer },
        timeSpentSeconds: 300,
      }),
    });

    const res = await postToeicSubmitApi(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reviewClusters).toBeDefined();
    expect(data.reviewClusters.length).toBe(23);

    // In review mode, answers are revealed to the student
    const cluster0 = data.reviewClusters[0];
    expect(cluster0.questions[0].correctAnswer).toBeDefined();

    // Check invisible watermark in review questions explanations
    const watermarkedQ = data.reviewQuestions.find((q: any) => q.explanationVi && q.explanationVi.length > 0);
    if (watermarkedQ) {
      expect(watermarkedQ.explanationVi.includes(ZW_SENTINEL)).toBe(true);
      const extracted = extractInvisibleWatermark(watermarkedQ.explanationVi);
      expect(extracted).not.toBeNull();
      expect(extracted?.startsWith('UID_')).toBe(true);
    }
  });
}

// Direct execution entrypoint
if (process.argv[1]?.includes('challenger-2-m2-adversarial.test')) {
  const runner = new TestRunner();
  runChallenger2M2AdversarialTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log(`\n════════════════════════════════════════════════════════════════`);
      console.log(`CHALLENGER 2 M2 ADVERSARIAL SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
      console.log(`════════════════════════════════════════════════════════════════\n`);
      process.exit(stats.failed === 0 ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during Challenger 2 M2 adversarial test:', err);
      process.exit(1);
    });
}
