/**
 * VNU Test Bậc 3 Barem Scoring Engine Test Suite
 * File: tests/vnu-bac-3/scoring.test.mjs
 */

import assert from 'node:assert/strict';

// Direct production module import
import {
  roundToHalf,
  calculateVnuReadingScore,
  calculateVnuListeningScore,
  calculateVnuOverallScore,
  checkVnuPassCriteria,
  gradeVnuBac3Exam,
  normalizeAnswerKey,
} from '../../src/lib/vnu-bac-3/scoring.ts';

console.log('--- TEST SUITE 1: ROUNDING TO 0.5 EDGE CASES ---');
assert.equal(roundToHalf(0), 0.0, '0 should be 0.0');
assert.equal(roundToHalf(0.24), 0.0, '0.24 rounds to 0.0');
assert.equal(roundToHalf(0.25), 0.5, '0.25 rounds to 0.5');
assert.equal(roundToHalf(0.4), 0.5, '0.4 rounds to 0.5');
assert.equal(roundToHalf(0.74), 0.5, '0.74 rounds to 0.5');
assert.equal(roundToHalf(0.75), 1.0, '0.75 rounds to 1.0');
assert.equal(roundToHalf(0.8), 1.0, '0.8 rounds to 1.0');
assert.equal(roundToHalf(1.2), 1.0, '1.2 rounds to 1.0');
assert.equal(roundToHalf(1.6), 1.5, '1.6 rounds to 1.5');
assert.equal(roundToHalf(5.6), 5.5, '5.6 rounds to 5.5');
assert.equal(roundToHalf(6.4), 6.5, '6.4 rounds to 6.5');
console.log('✓ Rounding tests passed!');

console.log('--- TEST SUITE 2: READING BAREM TABLE (0..25) ---');
const expectedReading = [
  { raw: 0, score: 0.0 },
  { raw: 1, score: 0.5 }, // 0.4 -> 0.5
  { raw: 2, score: 1.0 }, // 0.8 -> 1.0
  { raw: 3, score: 1.0 }, // 1.2 -> 1.0
  { raw: 4, score: 1.5 }, // 1.6 -> 1.5 (LIỆT)
  { raw: 5, score: 2.0 }, // 2.0 -> 2.0 (THOÁT LIỆT)
  { raw: 6, score: 2.5 }, // 2.4 -> 2.5
  { raw: 7, score: 3.0 }, // 2.8 -> 3.0
  { raw: 8, score: 3.0 }, // 3.2 -> 3.0
  { raw: 9, score: 3.5 }, // 3.6 -> 3.5
  { raw: 10, score: 4.0 }, // 4.0 -> 4.0
  { raw: 11, score: 4.5 }, // 4.4 -> 4.5
  { raw: 12, score: 5.0 }, // 4.8 -> 5.0
  { raw: 13, score: 5.0 }, // 5.2 -> 5.0
  { raw: 14, score: 5.5 }, // 5.6 -> 5.5
  { raw: 15, score: 6.0 }, // 6.0 -> 6.0 (TARGET B1)
  { raw: 16, score: 6.5 }, // 6.4 -> 6.5
  { raw: 17, score: 7.0 }, // 6.8 -> 7.0
  { raw: 18, score: 7.0 }, // 7.2 -> 7.0
  { raw: 19, score: 7.5 }, // 7.6 -> 7.5
  { raw: 20, score: 8.0 }, // 8.0 -> 8.0
  { raw: 21, score: 8.5 }, // 8.4 -> 8.5
  { raw: 22, score: 9.0 }, // 8.8 -> 9.0
  { raw: 23, score: 9.0 }, // 9.2 -> 9.0
  { raw: 24, score: 9.5 }, // 9.6 -> 9.5
  { raw: 25, score: 10.0 }, // 10.0 -> 10.0
];

for (const item of expectedReading) {
  const actual = calculateVnuReadingScore(item.raw);
  assert.equal(actual, item.score, `Reading raw ${item.raw} expected ${item.score}, got ${actual}`);
}
console.log('✓ All 26 Reading barem scores verified!');

console.log('--- TEST SUITE 3: LISTENING BAREM TABLE (0..20) ---');
const expectedListening = [
  { raw: 0, score: 0.0 },
  { raw: 1, score: 0.5 },
  { raw: 2, score: 1.0 },
  { raw: 3, score: 1.5 }, // LIỆT
  { raw: 4, score: 2.0 }, // THOÁT LIỆT
  { raw: 5, score: 2.5 },
  { raw: 6, score: 3.0 },
  { raw: 7, score: 3.5 },
  { raw: 8, score: 4.0 },
  { raw: 9, score: 4.5 },
  { raw: 10, score: 5.0 },
  { raw: 11, score: 5.5 },
  { raw: 12, score: 6.0 }, // TARGET B1
  { raw: 13, score: 6.5 },
  { raw: 14, score: 7.0 },
  { raw: 15, score: 7.5 },
  { raw: 16, score: 8.0 },
  { raw: 17, score: 8.5 },
  { raw: 18, score: 9.0 },
  { raw: 19, score: 9.5 },
  { raw: 20, score: 10.0 },
];

for (const item of expectedListening) {
  const actual = calculateVnuListeningScore(item.raw);
  assert.equal(actual, item.score, `Listening raw ${item.raw} expected ${item.score}, got ${actual}`);
}
console.log('✓ All 21 Listening barem scores verified!');

console.log('--- TEST SUITE 4: PASS / FAIL & ELIMINATION THRESHOLDS ---');

// Case 1: Đạt B1 chuẩn (R 15 = 6.0, L 12 = 6.0 -> ĐTB 6.0)
{
  const r = calculateVnuReadingScore(15); // 6.0
  const l = calculateVnuListeningScore(12); // 6.0
  const avg = calculateVnuOverallScore(r, l); // 6.0
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, true, 'Case 1 should pass');
  assert.equal(check.statusLabel, 'ĐẠT (BẬC 3 / B1)');
}

// Case 2: Điểm cao bù điểm thấp (R 18 = 7.0, L 10 = 5.0 -> ĐTB 6.0)
{
  const r = calculateVnuReadingScore(18); // 7.0
  const l = calculateVnuListeningScore(10); // 5.0
  const avg = calculateVnuOverallScore(r, l); // 6.0
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, true, 'Case 2 should pass');
}

// Case 3: Điểm trung bình dưới 6.0 (R 14 = 5.5, L 11 = 5.5 -> ĐTB 5.5) -> FAIL
{
  const r = calculateVnuReadingScore(14); // 5.5
  const l = calculateVnuListeningScore(11); // 5.5
  const avg = calculateVnuOverallScore(r, l); // 5.5
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, false, 'Case 3 should fail due to avg < 6.0');
}

// Case 4: ĐIỂM LIỆT READING (R 4 = 1.5, L 20 = 10.0 -> ĐTB 6.0) -> FAIL DO LIỆT
{
  const r = calculateVnuReadingScore(4); // 1.5 (< 2.0 LIỆT)
  const l = calculateVnuListeningScore(20); // 10.0
  const avg = calculateVnuOverallScore(r, l); // 6.0
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, false, 'Case 4 must fail due to reading elimination threshold');
  assert.match(check.failureReason, /Đọc/, 'Failure reason must mention Reading');
}

// Case 5: ĐIỂM LIỆT LISTENING (R 25 = 10.0, L 3 = 1.5 -> ĐTB 6.0) -> FAIL DO LIỆT
{
  const r = calculateVnuReadingScore(25); // 10.0
  const l = calculateVnuListeningScore(3); // 1.5 (< 2.0 LIỆT)
  const avg = calculateVnuOverallScore(r, l); // 6.0
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, false, 'Case 5 must fail due to listening elimination threshold');
  assert.match(check.failureReason, /Nghe/, 'Failure reason must mention Listening');
}

// Case 6: CẢ HAI LIỆT (R 2 = 1.0, L 2 = 1.0 -> ĐTB 1.0) -> FAIL
{
  const r = calculateVnuReadingScore(2);
  const l = calculateVnuListeningScore(2);
  const avg = calculateVnuOverallScore(r, l);
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, false);
}

// Case 7: MAX SCORE (R 25 = 10.0, L 20 = 10.0 -> ĐTB 10.0) -> PASS
{
  const r = calculateVnuReadingScore(25);
  const l = calculateVnuListeningScore(20);
  const avg = calculateVnuOverallScore(r, l);
  const check = checkVnuPassCriteria(r, l, avg);
  assert.equal(check.isPassed, true);
  assert.equal(avg, 10.0);
}

console.log('✓ All 7 Pass/Fail and elimination criteria tests passed!');

console.log('--- TEST SUITE 5: NORMALIZE ANSWER KEY ---');
assert.equal(normalizeAnswerKey('True'), 'A');
assert.equal(normalizeAnswerKey('False'), 'B');
assert.equal(normalizeAnswerKey('a'), 'A');
assert.equal(normalizeAnswerKey('B'), 'B');
assert.equal(normalizeAnswerKey('c'), 'C');
assert.equal(normalizeAnswerKey(0), 'A');
assert.equal(normalizeAnswerKey(1), 'B');
assert.equal(normalizeAnswerKey(2), 'C');
console.log('✓ normalizeAnswerKey tests passed!');

console.log('ALL SCORING TESTS PASSED SUCCESSFULLY! (0 ERRORS)');
