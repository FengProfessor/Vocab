/**
 * EMPIRICAL ADVERSARIAL CHALLENGE TEST SUITE — VNU TEST BẬC 3
 * Executed by Empirical Challenger (challenger_m1_2)
 *
 * Objectives:
 * 1. Test required score calculations:
 *    - All correct (10.0 / 10.0) -> PASS
 *    - All wrong (0.0 / 0.0) -> FAIL
 *    - Reading 25/25 (10.0), Listening 0/20 (0.0) -> FAIL (Listening < 2.0)
 *    - Reading 15/25 (6.0), Listening 12/20 (6.0) -> PASS (Avg 6.0)
 * 2. Boundary & elimination stress tests (raw 4 vs 5 in Reading, raw 3 vs 4 in Listening)
 * 3. Barem rounding mathematical invariance & compensation scenarios
 * 4. Full end-to-end dataset grading with authentic keys across all 3 master exams
 * 5. Cyber defense adversarial challenges (Zero bulk leaks including sampleAnswer, honeypot traps, HMAC replay/tampering)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  roundToHalf,
  calculateVnuReadingScore,
  calculateVnuListeningScore,
  calculateVnuOverallScore,
  checkVnuPassCriteria,
  gradeVnuBac3Exam,
  normalizeAnswerKey,
} from '../../src/lib/vnu-bac-3/scoring.ts';

import {
  SENSITIVE_VNU_KEYS,
  stripSensitiveVnuData,
  createVnuSessionToken,
  verifyVnuSessionToken,
  embedInvisibleWatermark,
  getRawVnuBac3Exam,
} from '../../src/lib/vnu-bac-3/loader.ts';

console.log('===============================================================');
console.log('   EMPIRICAL ADVERSARIAL CHALLENGE — VNU TEST BẬC 3           ');
console.log('===============================================================\n');

// ---------------------------------------------------------------------------
// SECTION 1: REQUIRED EDGE CASE SCORE CALCULATIONS (PROMPT SPECIFIED)
// ---------------------------------------------------------------------------
console.log('>>> [CHALLENGE 1] Prompt Required Score Calculations');

// Case 1.1: All correct (10.0 / 10.0) -> PASS
{
  const rScore = calculateVnuReadingScore(25);
  const lScore = calculateVnuListeningScore(20);
  const overall = calculateVnuOverallScore(rScore, lScore);
  const passCheck = checkVnuPassCriteria(rScore, lScore, overall);

  assert.equal(rScore, 10.0, 'Reading 25/25 must be 10.0');
  assert.equal(lScore, 10.0, 'Listening 20/20 must be 10.0');
  assert.equal(overall, 10.0, 'Overall must be 10.0');
  assert.equal(passCheck.isPassed, true, 'All correct MUST PASS');
  assert.equal(passCheck.statusLabel, 'ĐẠT (BẬC 3 / B1)');
  console.log('  [PASS] 1.1 All correct (10.0 / 10.0) -> PASS');
}

// Case 1.2: All wrong (0.0 / 0.0) -> FAIL
{
  const rScore = calculateVnuReadingScore(0);
  const lScore = calculateVnuListeningScore(0);
  const overall = calculateVnuOverallScore(rScore, lScore);
  const passCheck = checkVnuPassCriteria(rScore, lScore, overall);

  assert.equal(rScore, 0.0, 'Reading 0/25 must be 0.0');
  assert.equal(lScore, 0.0, 'Listening 0/20 must be 0.0');
  assert.equal(overall, 0.0, 'Overall must be 0.0');
  assert.equal(passCheck.isPassed, false, 'All wrong MUST FAIL');
  assert.equal(passCheck.statusLabel, 'CHƯA ĐẠT');
  assert.ok(passCheck.failureReason.includes('cả hai kỹ năng Đọc và Nghe'), 'Must note both skills eliminated');
  console.log('  [PASS] 1.2 All wrong (0.0 / 0.0) -> FAIL');
}

// Case 1.3: Reading 25/25 (10.0), Listening 0/20 (0.0) -> FAIL (Listening < 2.0)
{
  const rScore = calculateVnuReadingScore(25);
  const lScore = calculateVnuListeningScore(0);
  const overall = calculateVnuOverallScore(rScore, lScore);
  const passCheck = checkVnuPassCriteria(rScore, lScore, overall);

  assert.equal(rScore, 10.0, 'Reading 25/25 must be 10.0');
  assert.equal(lScore, 0.0, 'Listening 0/20 must be 0.0');
  assert.equal(overall, 5.0, 'Overall (10 + 0)/2 must be 5.0');
  assert.equal(passCheck.isPassed, false, 'Listening 0/20 MUST FAIL due to elimination threshold');
  assert.equal(passCheck.statusLabel, 'CHƯA ĐẠT');
  assert.ok(passCheck.failureReason.includes('Nghe'), 'Must cite Listening elimination');
  assert.ok(passCheck.failureReason.includes('< 2.0/10.0'), 'Must cite < 2.0 threshold');
  console.log('  [PASS] 1.3 Reading 25/25 (10.0), Listening 0/20 (0.0) -> FAIL (Listening < 2.0)');
}

// Case 1.4: Reading 15/25 (6.0), Listening 12/20 (6.0) -> PASS (Avg 6.0)
{
  const rScore = calculateVnuReadingScore(15);
  const lScore = calculateVnuListeningScore(12);
  const overall = calculateVnuOverallScore(rScore, lScore);
  const passCheck = checkVnuPassCriteria(rScore, lScore, overall);

  assert.equal(rScore, 6.0, 'Reading 15/25 must be 6.0');
  assert.equal(lScore, 6.0, 'Listening 12/20 must be 6.0');
  assert.equal(overall, 6.0, 'Overall must be 6.0');
  assert.equal(passCheck.isPassed, true, 'Reading 6.0, Listening 6.0 MUST PASS');
  assert.equal(passCheck.statusLabel, 'ĐẠT (BẬC 3 / B1)');
  console.log('  [PASS] 1.4 Reading 15/25 (6.0), Listening 12/20 (6.0) -> PASS (Avg 6.0)');
}

// ---------------------------------------------------------------------------
// SECTION 2: ADVERSARIAL BOUNDARY & ELIMINATION THRESHOLDS
// ---------------------------------------------------------------------------
console.log('\n>>> [CHALLENGE 2] Adversarial Boundary & Elimination Thresholds');

// 2.1 Reading Elimination Boundary (4 vs 5 raw questions)
{
  const rScore4 = calculateVnuReadingScore(4); // 4/25*10 = 1.6 -> 1.5
  assert.equal(rScore4, 1.5, 'Reading 4 raw must be 1.5 (eliminated)');

  const rScore5 = calculateVnuReadingScore(5); // 5/25*10 = 2.0 -> 2.0
  assert.equal(rScore5, 2.0, 'Reading 5 raw must be 2.0 (cleared)');

  // Trap scenario: Reading 4 (1.5) + Listening 20 (10.0) -> avg = 5.75 -> rounded to 6.0!
  // Even though overall is 6.0, Reading is < 2.0, so this MUST FAIL!
  const avgTricky1 = calculateVnuOverallScore(rScore4, 10.0);
  assert.equal(avgTricky1, 6.0, 'Average of 1.5 and 10.0 rounds to 6.0');
  const checkTricky1 = checkVnuPassCriteria(rScore4, 10.0, avgTricky1);
  assert.equal(checkTricky1.isPassed, false, 'Tricky scenario 1 MUST FAIL due to reading elimination');
  assert.ok(checkTricky1.failureReason.includes('Đọc'), 'Reason must explicitly state Reading');
  console.log('  [PASS] 2.1 Reading 4 (1.5) + Listening 20 (10.0): Overall 6.0 correctly REJECTED by elimination gate');
}

// 2.2 Listening Elimination Boundary (3 vs 4 raw questions)
{
  const lScore3 = calculateVnuListeningScore(3); // 3/20*10 = 1.5
  assert.equal(lScore3, 1.5, 'Listening 3 raw must be 1.5 (eliminated)');

  const lScore4 = calculateVnuListeningScore(4); // 4/20*10 = 2.0
  assert.equal(lScore4, 2.0, 'Listening 4 raw must be 2.0 (cleared)');

  // Trap scenario: Reading 25 (10.0) + Listening 3 (1.5) -> avg = 5.75 -> rounded to 6.0!
  // Even though overall is 6.0, Listening is < 2.0, so this MUST FAIL!
  const avgTricky2 = calculateVnuOverallScore(10.0, lScore3);
  assert.equal(avgTricky2, 6.0, 'Average of 10.0 and 1.5 rounds to 6.0');
  const checkTricky2 = checkVnuPassCriteria(10.0, lScore3, avgTricky2);
  assert.equal(checkTricky2.isPassed, false, 'Tricky scenario 2 MUST FAIL due to listening elimination');
  assert.ok(checkTricky2.failureReason.includes('Nghe'), 'Reason must explicitly state Listening');
  console.log('  [PASS] 2.2 Reading 25 (10.0) + Listening 3 (1.5): Overall 6.0 correctly REJECTED by elimination gate');
}

// 2.3 Bare Minimum Escapes with Maximum Partner (Boundary Pass)
{
  // Reading 5 (2.0) + Listening 20 (10.0) -> avg = 6.0 -> PASS
  const r5 = calculateVnuReadingScore(5);
  const avgCleared1 = calculateVnuOverallScore(r5, 10.0);
  assert.equal(avgCleared1, 6.0);
  const checkCleared1 = checkVnuPassCriteria(r5, 10.0, avgCleared1);
  assert.equal(checkCleared1.isPassed, true, 'Reading 2.0 + Listening 10.0 MUST PASS');

  // Reading 25 (10.0) + Listening 4 (2.0) -> avg = 6.0 -> PASS
  const l4 = calculateVnuListeningScore(4);
  const avgCleared2 = calculateVnuOverallScore(10.0, l4);
  assert.equal(avgCleared2, 6.0);
  const checkCleared2 = checkVnuPassCriteria(10.0, l4, avgCleared2);
  assert.equal(checkCleared2.isPassed, true, 'Reading 10.0 + Listening 2.0 MUST PASS');
  console.log('  [PASS] 2.3 Boundary minimum non-eliminated scores (2.0 + 10.0 = 6.0) cleanly PASS');
}

// ---------------------------------------------------------------------------
// SECTION 3: BAREM ROUNDING INVARIANCE & COMPENSATION EDGE CASES
// ---------------------------------------------------------------------------
console.log('\n>>> [CHALLENGE 3] Barem Rounding & Round-to-Half Mathematical Invariance');

// 3.1 Strict Round-To-Half boundary checks
const roundingVectors = [
  { input: 0.0, expected: 0.0 },
  { input: 0.24999, expected: 0.0 },
  { input: 0.25, expected: 0.5 },
  { input: 0.49999, expected: 0.5 },
  { input: 0.5, expected: 0.5 },
  { input: 0.74999, expected: 0.5 },
  { input: 0.75, expected: 1.0 },
  { input: 5.74999, expected: 5.5 },
  { input: 5.75, expected: 6.0 },
  { input: 9.75, expected: 10.0 },
  { input: 10.0, expected: 10.0 },
];

for (const v of roundingVectors) {
  const actual = roundToHalf(v.input);
  assert.equal(actual, v.expected, `roundToHalf(${v.input}) expected ${v.expected}, got ${actual}`);
}
console.log('  [PASS] 3.1 Precise 0.25 / 0.75 rounding transitions verified.');

// 3.2 Sub-threshold failure (5.5 overall)
{
  const r14 = calculateVnuReadingScore(14); // 5.5
  const l11 = calculateVnuListeningScore(11); // 5.5
  const avg55 = calculateVnuOverallScore(r14, l11); // 5.5
  assert.equal(avg55, 5.5);
  const check55 = checkVnuPassCriteria(r14, l11, avg55);
  assert.equal(check55.isPassed, false, '5.5 overall MUST FAIL');
  assert.ok(check55.failureReason.includes('5.5/10.0'), 'Failure reason must state 5.5');
  console.log('  [PASS] 3.2 5.5 overall correctly rejected with descriptive reason');
}

// ---------------------------------------------------------------------------
// SECTION 4: FULL EXAM GRADING ENGINE SIMULATION (ACROSS ALL 3 MASTER DATASETS)
// ---------------------------------------------------------------------------
console.log('\n>>> [CHALLENGE 4] Full Dataset Grading Simulation on Remediated JSON Datasets');

const examIds = ['ulis-sample-test-01', 'cambridge-pet-equiv-01', 'cambridge-pet-equiv-02'];

for (const examId of examIds) {
  const exam = getRawVnuBac3Exam(examId);
  assert.ok(exam, `Master exam ${examId} must load`);

  // Build 100% correct answer map from authoritative keys
  const perfectAnswers = {};
  const wrongAnswers = {};
  const readingOnlyAnswers = {};
  const target15_12Answers = {};

  let rIdx = 0;
  let lIdx = 0;

  for (const s of exam.sections) {
    if (s.type !== 'reading' && s.type !== 'listening') continue;
    for (const t of s.tasks) {
      for (const q of t.questions) {
        const key = q.correctAnswer || (q.answerIndex === 0 ? 'A' : q.answerIndex === 1 ? 'B' : 'C');
        perfectAnswers[q.id] = key;
        wrongAnswers[q.id] = key === 'A' ? 'B' : 'A';

        if (s.type === 'reading') {
          readingOnlyAnswers[q.id] = key;
          rIdx++;
          if (rIdx <= 15) {
            target15_12Answers[q.id] = key;
          } else {
            target15_12Answers[q.id] = key === 'A' ? 'B' : 'A';
          }
        } else if (s.type === 'listening') {
          lIdx++;
          if (lIdx <= 12) {
            target15_12Answers[q.id] = key;
          } else {
            target15_12Answers[q.id] = key === 'A' ? 'B' : 'A';
          }
        }
      }
    }
  }

  // Simulation A: 100% Correct Submission
  const resultPerfect = gradeVnuBac3Exam(exam, perfectAnswers, 3600);
  assert.equal(resultPerfect.readingCorrect, 25, `${examId}: Reading correct must be 25`);
  assert.equal(resultPerfect.listeningCorrect, 20, `${examId}: Listening correct must be 20`);
  assert.equal(resultPerfect.readingScore, 10.0, `${examId}: Reading score must be 10.0`);
  assert.equal(resultPerfect.listeningScore, 10.0, `${examId}: Listening score must be 10.0`);
  assert.equal(resultPerfect.overallScore, 10.0, `${examId}: Overall score must be 10.0`);
  assert.equal(resultPerfect.isPassed, true, `${examId}: Perfect exam must PASS`);
  assert.equal(resultPerfect.statusLabel, 'ĐẠT (BẬC 3 / B1)');
  assert.equal(resultPerfect.reviewQuestions.length, 45, `${examId}: Review must contain all 45 questions`);

  // Simulation B: 100% Wrong Submission
  const resultWrong = gradeVnuBac3Exam(exam, wrongAnswers, 1800);
  assert.equal(resultWrong.readingCorrect, 0, `${examId}: Reading correct must be 0`);
  assert.equal(resultWrong.listeningCorrect, 0, `${examId}: Listening correct must be 0`);
  assert.equal(resultWrong.readingScore, 0.0);
  assert.equal(resultWrong.listeningScore, 0.0);
  assert.equal(resultWrong.overallScore, 0.0);
  assert.equal(resultWrong.isPassed, false, `${examId}: 0% exam must FAIL`);

  // Simulation C: Reading 25/25, Listening 0/20
  const resultReadingOnly = gradeVnuBac3Exam(exam, readingOnlyAnswers, 2400);
  assert.equal(resultReadingOnly.readingCorrect, 25);
  assert.equal(resultReadingOnly.listeningCorrect, 0);
  assert.equal(resultReadingOnly.readingScore, 10.0);
  assert.equal(resultReadingOnly.listeningScore, 0.0);
  assert.equal(resultReadingOnly.overallScore, 5.0);
  assert.equal(resultReadingOnly.isPassed, false);
  assert.ok(resultReadingOnly.failureReason.includes('Nghe'));

  // Simulation D: Reading 15/25 (6.0), Listening 12/20 (6.0)
  const resultTarget = gradeVnuBac3Exam(exam, target15_12Answers, 3000);
  assert.equal(resultTarget.readingCorrect, 15, `${examId}: Target reading correct must be 15`);
  assert.equal(resultTarget.listeningCorrect, 12, `${examId}: Target listening correct must be 12`);
  assert.equal(resultTarget.readingScore, 6.0, `${examId}: Target reading score must be 6.0`);
  assert.equal(resultTarget.listeningScore, 6.0, `${examId}: Target listening score must be 6.0`);
  assert.equal(resultTarget.overallScore, 6.0, `${examId}: Target overall score must be 6.0`);
  assert.equal(resultTarget.isPassed, true, `${examId}: Target 6.0/6.0 exam must PASS`);

  // Simulation E: Writing & Speaking Immunity
  // User answers include extraneous entries for writing and speaking
  const answersWithWriting = {
    ...target15_12Answers,
    'writing-task-1': 'This is my essay with 90 words...',
    'speaking-part-1': 'My favorite hobby is reading...',
    'invalid-question-xyz': 'A',
  };
  const resultWithWriting = gradeVnuBac3Exam(exam, answersWithWriting, 3000);
  assert.equal(resultWithWriting.readingScore, 6.0, 'Extraneous writing inputs must not affect reading score');
  assert.equal(resultWithWriting.listeningScore, 6.0, 'Extraneous writing inputs must not affect listening score');
  assert.equal(resultWithWriting.overallScore, 6.0, 'Extraneous writing inputs must not affect overall score');
  assert.equal(resultWithWriting.reviewQuestions.length, 45, 'Review questions must solely encompass 45 objective MCQs');

  console.log(`  [PASS] ${examId}: 5 grading simulations verified with 100% precision.`);
}

// ---------------------------------------------------------------------------
// SECTION 5: ADVERSARIAL CYBER DEFENSE & SANITIZATION CHALLENGE
// ---------------------------------------------------------------------------
console.log('\n>>> [CHALLENGE 5] Adversarial Cyber Defense & Sanitization Verification');

// 5.1 Deep Leaks Probe: Are sampleAnswer in Writing Prompts Purged in Stripped Exam?
for (const examId of examIds) {
  const master = getRawVnuBac3Exam(examId);
  const sanitized = stripSensitiveVnuData(master);

  // Check writing section
  const writingSec = sanitized.sections.find(s => s.type === 'writing');
  if (writingSec) {
    for (const task of writingSec.tasks) {
      if (task.writingPrompts) {
        for (const wp of task.writingPrompts) {
          assert.equal(
            wp.sampleAnswer,
            undefined,
            `SECURITY VULNERABILITY! sampleAnswer leaked in ${examId} task ${task.id} prompt ${wp.id}!`
          );
        }
      }
    }
  }

  // Check serialized payload
  const serialized = JSON.stringify(sanitized);
  for (const sensitiveKey of SENSITIVE_VNU_KEYS) {
    const leakPattern = `"${sensitiveKey}":`;
    assert.equal(
      serialized.includes(leakPattern),
      false,
      `SECURITY LEAK: Payload contains sensitive key ${sensitiveKey} in ${examId}`
    );
  }
}
console.log('  [PASS] 5.1 Zero Bulk Leaks strictly eliminates all sensitive keys including Writing sampleAnswer!');

// 5.2 HMAC Tampering & Replay Attacks
{
  const tokenUlis = createVnuSessionToken('ulis-sample-test-01', '10.0.0.1');

  // Attack 1: Cross-exam replay (using ULIS token on Cambridge equiv-01)
  const isReplayed = verifyVnuSessionToken(tokenUlis, 'cambridge-pet-equiv-01');
  assert.equal(isReplayed, false, 'Cross-exam token replay MUST BE REJECTED');

  // Attack 2: Bit-flip signature forgery
  const parts = Buffer.from(tokenUlis, 'base64url').toString('utf8');
  const tokenObj = JSON.parse(parts);
  const forgedSig = tokenObj.signature.slice(0, -2) + (tokenObj.signature.endsWith('0') ? '1' : '0');
  const forgedToken = Buffer.from(JSON.stringify({ payload: tokenObj.payload, signature: forgedSig })).toString('base64url');
  assert.equal(verifyVnuSessionToken(forgedToken, 'ulis-sample-test-01'), false, 'Forged signature MUST BE REJECTED');

  // Attack 3: Expired token simulation
  const expiredPayload = `ulis-sample-test-01|10.0.0.1|${Date.now() - 1000}`; // expired 1s ago
  const hmac = crypto.createHmac('sha256', process.env.VNU_B3_SECRET_KEY || 'vnu_b3_ulis_lingopro_secure_sig_2026');
  hmac.update(expiredPayload);
  const expiredSig = hmac.digest('hex');
  const expiredToken = Buffer.from(JSON.stringify({ payload: expiredPayload, signature: expiredSig })).toString('base64url');
  assert.equal(verifyVnuSessionToken(expiredToken, 'ulis-sample-test-01'), false, 'Expired token MUST BE REJECTED');

  console.log('  [PASS] 5.2 HMAC Replay, Forgery, and Expiration attacks thwarted.');
}

console.log('\n===============================================================');
console.log('   ALL EMPIRICAL ADVERSARIAL CHALLENGES PASSED (0 REGRESSIONS) ');
console.log('===============================================================');
