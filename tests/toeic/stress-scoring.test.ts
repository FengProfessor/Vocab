/**
 * Adversarial Stress Test Suite for TOEIC Barem & Scoring Engine
 *
 * Targets:
 * - src/lib/toeic-barem.ts
 * - src/lib/toeic-scoring.ts
 *
 * Stress Test Dimensions:
 * 1. Boundary & Extreme Values: -10, 0, 1, 99, 100, 101, NaN, Infinity, -Infinity, floating points (95.5, 0.4, -0.5, etc.)
 * 2. Monotonicity: for all i from 0 to 99, score(i) <= score(i+1)
 * 3. Empty & Partial Scenarios: empty question set, empty answers map, partial answers (e.g. 5/200 answered)
 * 4. CEFR Boundary Mappings & Accuracy Ratings
 * 5. Answer Format Robustness: whitespace, lowercase, invalid options, ghost keys
 * 6. Authentic Test Suite Invariant Fuzzing: 100 Monte Carlo randomized answer passes
 */

import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '../../src/lib/toeic-barem';

import {
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  getCefrDescriptor,
  getPartAccuracyRating,
  calculateToeicScore,
} from '../../src/lib/toeic-scoring';

import {
  loadFullToeicTest,
  getAvailableToeicTests,
} from '../../src/lib/toeic-test-loader';

import type { ToeicPart, ToeicUnifiedQuestion } from '../../src/types/toeic';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    failures.push(message);
    console.error(`  [FAIL] ${message}`);
  }
}

async function runStressTests() {
  console.log('================================================================');
  console.log('  ADVERSARIAL STRESS TEST: TOEIC BAREM & SCORING ENGINE');
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────
  // SUITE 1: ETS BAREM TABLES INVARIANTS & INTEGRITY
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite 1: ETS Barem Tables Invariants & Array Integrity ---');

  assert(ETS_LISTENING_BAREM.length === 101, 'ETS_LISTENING_BAREM has exactly 101 elements');
  assert(ETS_READING_BAREM.length === 101, 'ETS_READING_BAREM has exactly 101 elements');

  // Check every element is an integer, divisible by 5, between 5 and 495
  let allLcValid = true;
  for (let i = 0; i <= 100; i++) {
    const val = ETS_LISTENING_BAREM[i];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 5 || val > 495 || val % 5 !== 0) {
      allLcValid = false;
      break;
    }
  }
  assert(allLcValid, 'All 101 LC barem values are integers, multiples of 5, within [5, 495]');

  let allRcValid = true;
  for (let i = 0; i <= 100; i++) {
    const val = ETS_READING_BAREM[i];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 5 || val > 495 || val % 5 !== 0) {
      allRcValid = false;
      break;
    }
  }
  assert(allRcValid, 'All 101 RC barem values are integers, multiples of 5, within [5, 495]');

  // LC Floor and Equating Tolerance
  assert(ETS_LISTENING_BAREM[0] === 5, 'LC raw 0 = 5');
  assert(ETS_LISTENING_BAREM[6] === 5, 'LC raw 6 = 5 (ETS tolerance floor)');
  assert(ETS_LISTENING_BAREM[7] === 10, 'LC raw 7 = 10');
  assert(ETS_LISTENING_BAREM[95] === 495, 'LC raw 95 = 495 (ETS equating ceiling)');
  assert(ETS_LISTENING_BAREM[100] === 495, 'LC raw 100 = 495');

  // RC Floor and Ceiling
  assert(ETS_READING_BAREM[0] === 5, 'RC raw 0 = 5');
  assert(ETS_READING_BAREM[9] === 5, 'RC raw 9 = 5 (ETS tolerance floor)');
  assert(ETS_READING_BAREM[10] === 10, 'RC raw 10 = 10');
  assert(ETS_READING_BAREM[95] === 445, 'RC raw 95 = 445');
  assert(ETS_READING_BAREM[100] === 495, 'RC raw 100 = 495 (Strict RC max)');

  // ─────────────────────────────────────────────────────────────
  // SUITE 2: MONOTONICITY INVARIANTS (ZERO INVERSION RULE)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Suite 2: Monotonicity Invariants (Zero Inversion Rule) ---');

  let lcMonotonic = true;
  let lcInversionInfo = '';
  for (let i = 0; i < 100; i++) {
    if (ETS_LISTENING_BAREM[i] > ETS_LISTENING_BAREM[i + 1]) {
      lcMonotonic = false;
      lcInversionInfo = `Inversion at LC index ${i}: ${ETS_LISTENING_BAREM[i]} > ${ETS_LISTENING_BAREM[i + 1]}`;
      break;
    }
  }
  assert(lcMonotonic, `ETS Listening barem is monotonically non-decreasing for all i in [0, 99] ${lcInversionInfo}`);

  let rcMonotonic = true;
  let rcInversionInfo = '';
  for (let i = 0; i < 100; i++) {
    if (ETS_READING_BAREM[i] > ETS_READING_BAREM[i + 1]) {
      rcMonotonic = false;
      rcInversionInfo = `Inversion at RC index ${i}: ${ETS_READING_BAREM[i]} > ${ETS_READING_BAREM[i + 1]}`;
      break;
    }
  }
  assert(rcMonotonic, `ETS Reading barem is monotonically non-decreasing for all i in [0, 99] ${rcInversionInfo}`);

  // Continuous monotonicity for lookups across step = 0.5 from -10 to 110
  let lookupContinuousMonotonic = true;
  for (let x = -10; x <= 109.5; x += 0.5) {
    const nextX = x + 0.5;
    if (lookupListeningScore(x) > lookupListeningScore(nextX)) {
      lookupContinuousMonotonic = false;
      break;
    }
    if (lookupReadingScore(x) > lookupReadingScore(nextX)) {
      lookupContinuousMonotonic = false;
      break;
    }
  }
  assert(lookupContinuousMonotonic, 'lookupListeningScore and lookupReadingScore monotonic on [-10, 110] with step 0.5');

  // ─────────────────────────────────────────────────────────────
  // SUITE 3: BOUNDARY & EXTREME VALUES STRESS TEST
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Suite 3: Boundary & Extreme Values Stress Test ---');

  // Negatives
  assert(lookupListeningScore(-10) === 5, 'lookupListeningScore(-10) = 5');
  assert(lookupReadingScore(-10) === 5, 'lookupReadingScore(-10) = 5');
  assert(lookupListeningScore(-1) === 5, 'lookupListeningScore(-1) = 5');
  assert(lookupReadingScore(-1) === 5, 'lookupReadingScore(-1) = 5');
  assert(lookupListeningScore(-0.5) === 5, 'lookupListeningScore(-0.5) = 5');
  assert(lookupReadingScore(-0.5) === 5, 'lookupReadingScore(-0.5) = 5');
  assert(lookupListeningScore(-0.1) === 5, 'lookupListeningScore(-0.1) = 5');
  assert(lookupReadingScore(-0.1) === 5, 'lookupReadingScore(-0.1) = 5');

  // Zero boundaries
  assert(lookupListeningScore(0) === 5, 'lookupListeningScore(0) = 5');
  assert(lookupReadingScore(0) === 5, 'lookupReadingScore(0) = 5');
  assert(lookupListeningScore(-0) === 5, 'lookupListeningScore(-0) = 5');
  assert(lookupReadingScore(+0) === 5, 'lookupReadingScore(+0) = 5');

  // Low range (1, 6, 7, 9, 10)
  assert(lookupListeningScore(1) === 5, 'lookupListeningScore(1) = 5');
  assert(lookupReadingScore(1) === 5, 'lookupReadingScore(1) = 5');
  assert(lookupListeningScore(6) === 5, 'lookupListeningScore(6) = 5');
  assert(lookupListeningScore(7) === 10, 'lookupListeningScore(7) = 10');
  assert(lookupReadingScore(9) === 5, 'lookupReadingScore(9) = 5');
  assert(lookupReadingScore(10) === 10, 'lookupReadingScore(10) = 10');

  // High range & Upper boundaries (94, 95, 99, 100, 101)
  assert(lookupListeningScore(94) === 490, 'lookupListeningScore(94) = 490');
  assert(lookupListeningScore(95) === 495, 'lookupListeningScore(95) = 495');
  assert(lookupListeningScore(99) === 495, 'lookupListeningScore(99) = 495');
  assert(lookupListeningScore(100) === 495, 'lookupListeningScore(100) = 495');
  assert(lookupListeningScore(101) === 495, 'lookupListeningScore(101) = 495');

  assert(lookupReadingScore(94) === 435, 'lookupReadingScore(94) = 435');
  assert(lookupReadingScore(95) === 445, 'lookupReadingScore(95) = 445');
  assert(lookupReadingScore(99) === 485, 'lookupReadingScore(99) = 485');
  assert(lookupReadingScore(100) === 495, 'lookupReadingScore(100) = 495');
  assert(lookupReadingScore(101) === 495, 'lookupReadingScore(101) = 495');

  // Extreme numeric overflows
  assert(lookupListeningScore(999) === 495, 'lookupListeningScore(999) = 495');
  assert(lookupReadingScore(999) === 495, 'lookupReadingScore(999) = 495');
  assert(lookupListeningScore(Number.MAX_SAFE_INTEGER) === 495, 'lookupListeningScore(MAX_SAFE_INTEGER) = 495');
  assert(lookupReadingScore(Number.MAX_SAFE_INTEGER) === 495, 'lookupReadingScore(MAX_SAFE_INTEGER) = 495');
  assert(lookupListeningScore(Number.MIN_SAFE_INTEGER) === 5, 'lookupListeningScore(MIN_SAFE_INTEGER) = 5');
  assert(lookupReadingScore(Number.MIN_SAFE_INTEGER) === 5, 'lookupReadingScore(MIN_SAFE_INTEGER) = 5');

  // IEEE 754 Special Values: NaN, Infinity, -Infinity
  assert(lookupListeningScore(NaN) === 5, 'lookupListeningScore(NaN) = 5 (safe fallback)');
  assert(lookupReadingScore(NaN) === 5, 'lookupReadingScore(NaN) = 5 (safe fallback)');
  assert(lookupListeningScore(Infinity) === 495, 'lookupListeningScore(Infinity) = 495 (clamped ceiling)');
  assert(lookupReadingScore(Infinity) === 495, 'lookupReadingScore(Infinity) = 495 (clamped ceiling)');
  assert(lookupListeningScore(-Infinity) === 5, 'lookupListeningScore(-Infinity) = 5 (clamped floor)');
  assert(lookupReadingScore(-Infinity) === 5, 'lookupReadingScore(-Infinity) = 5 (clamped floor)');

  // Floating Points Rounding
  assert(lookupListeningScore(95.5) === 495, 'lookupListeningScore(95.5) -> rounds to 96 -> 495');
  assert(lookupReadingScore(95.5) === 455, 'lookupReadingScore(95.5) -> rounds to 96 -> 455');
  assert(lookupReadingScore(95.4) === 445, 'lookupReadingScore(95.4) -> rounds to 95 -> 445');
  assert(lookupListeningScore(0.4) === 5, 'lookupListeningScore(0.4) -> rounds to 0 -> 5');
  assert(lookupListeningScore(0.5) === 5, 'lookupListeningScore(0.5) -> rounds to 1 -> 5');
  assert(lookupListeningScore(6.4) === 5, 'lookupListeningScore(6.4) -> rounds to 6 -> 5');
  assert(lookupListeningScore(6.5) === 10, 'lookupListeningScore(6.5) -> rounds to 7 -> 10');
  assert(lookupReadingScore(9.4) === 5, 'lookupReadingScore(9.4) -> rounds to 9 -> 5');
  assert(lookupReadingScore(9.5) === 10, 'lookupReadingScore(9.5) -> rounds to 10 -> 10');
  assert(lookupReadingScore(99.5) === 495, 'lookupReadingScore(99.5) -> rounds to 100 -> 495');
  assert(lookupReadingScore(100.4) === 495, 'lookupReadingScore(100.4) -> rounds to 100 -> 495');

  // convertRawToScaled helper
  const convBound = convertRawToScaled(-10, 105);
  assert(convBound.scaledListening === 5, 'convertRawToScaled(-10, 105) scaledListening = 5');
  assert(convBound.scaledReading === 495, 'convertRawToScaled(-10, 105) scaledReading = 495');
  assert(convBound.scaledTotal === 500, 'convertRawToScaled(-10, 105) scaledTotal = 500');

  // getScaledListeningScore & getScaledReadingScore wrappers
  assert(getScaledListeningScore(-5) === 5, 'getScaledListeningScore(-5) = 5');
  assert(getScaledReadingScore(120) === 495, 'getScaledReadingScore(120) = 495');

  // Non-numeric inputs (runtime boundary defense)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert(lookupListeningScore(null as any) === 5, 'lookupListeningScore(null) returns 5');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert(lookupReadingScore(undefined as any) === 5, 'lookupReadingScore(undefined) returns 5');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert(lookupListeningScore('100' as any) === 5, 'lookupListeningScore("100") returns 5 (type guarded)');

  // ─────────────────────────────────────────────────────────────
  // SUITE 4: CEFR SCALE ALIGNMENT & DESCRIPTORS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Suite 4: CEFR Scale Alignment & Descriptors ---');

  // Exact boundary transitions:
  // 10 - 250: A1
  // 255 - 400: A2
  // 405 - 600: B1
  // 605 - 900: B2
  // 905 - 990: C1
  assert(getCefrLevel(0) === 'A1', 'Score 0 -> A1');
  assert(getCefrLevel(10) === 'A1', 'Score 10 -> A1');
  assert(getCefrLevel(250) === 'A1', 'Score 250 -> A1');
  assert(getCefrLevel(254) === 'A1', 'Score 254 -> A1 (gap guard)');
  assert(getCefrLevel(255) === 'A2', 'Score 255 -> A2 (boundary transition)');
  assert(getCefrLevel(400) === 'A2', 'Score 400 -> A2');
  assert(getCefrLevel(404) === 'A2', 'Score 404 -> A2 (gap guard)');
  assert(getCefrLevel(405) === 'B1', 'Score 405 -> B1 (boundary transition)');
  assert(getCefrLevel(600) === 'B1', 'Score 600 -> B1');
  assert(getCefrLevel(604) === 'B1', 'Score 604 -> B1 (gap guard)');
  assert(getCefrLevel(605) === 'B2', 'Score 605 -> B2 (boundary transition)');
  assert(getCefrLevel(785) === 'B2', 'Score 785 -> B2');
  assert(getCefrLevel(900) === 'B2', 'Score 900 -> B2');
  assert(getCefrLevel(904) === 'B2', 'Score 904 -> B2 (gap guard)');
  assert(getCefrLevel(905) === 'C1', 'Score 905 -> C1 (boundary transition)');
  assert(getCefrLevel(990) === 'C1', 'Score 990 -> C1');
  assert(getCefrLevel(1000) === 'C1', 'Score 1000 -> C1');

  // CEFR Descriptors Vietnamese validation
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
  for (const lvl of levels) {
    const desc = getCefrDescriptor(lvl);
    assert(
      Boolean(desc.level === lvl && desc.title && desc.descriptionVi && desc.targetFeedbackVi),
      `CEFR descriptor for ${lvl} contains title, descriptionVi, and targetFeedbackVi`
    );
  }

  // Accuracy Ratings
  assert(getPartAccuracyRating(-10) === 'low', '-10% -> low');
  assert(getPartAccuracyRating(0) === 'low', '0% -> low');
  assert(getPartAccuracyRating(49) === 'low', '49% -> low');
  assert(getPartAccuracyRating(50) === 'medium', '50% -> medium');
  assert(getPartAccuracyRating(79) === 'medium', '79% -> medium');
  assert(getPartAccuracyRating(80) === 'high', '80% -> high');
  assert(getPartAccuracyRating(100) === 'high', '100% -> high');
  assert(getPartAccuracyRating(150) === 'high', '150% -> high');

  // ─────────────────────────────────────────────────────────────
  // SUITE 5: EMPTY, PARTIAL & MALFORMED EXAM SCENARIOS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Suite 5: Empty, Partial & Malformed Exam Scenarios ---');

  // Scenario 5.1: Completely Empty Question Set
  const emptyQResult = calculateToeicScore({}, [], 120);
  assert(emptyQResult.rawListening === 0, 'Empty question set: rawListening = 0');
  assert(emptyQResult.rawReading === 0, 'Empty question set: rawReading = 0');
  assert(emptyQResult.rawTotal === 0, 'Empty question set: rawTotal = 0');
  assert(emptyQResult.scaledListening === 5, 'Empty question set: scaledListening = 5');
  assert(emptyQResult.scaledReading === 5, 'Empty question set: scaledReading = 5');
  assert(emptyQResult.scaledTotal === 10, 'Empty question set: scaledTotal = 10');
  assert(emptyQResult.cefrLevel === 'A1', 'Empty question set: cefrLevel = A1');
  assert(emptyQResult.timeSpentSeconds === 120, 'Empty question set: timeSpentSeconds preserved');

  let emptyQPartsValid = true;
  for (let p = 1; p <= 7; p++) {
    const s = emptyQResult.partStats[p as ToeicPart];
    if (!s || s.total !== 0 || s.correct !== 0 || s.percentage !== 0 || s.accuracyRating !== 'low') {
      emptyQPartsValid = false;
      break;
    }
  }
  assert(emptyQPartsValid, 'Empty question set: all 7 parts have total=0, correct=0, percentage=0, rating=low (No NaN)');

  // Load an authentic test (Test 6852) for scenarios 5.2 - 5.5
  const fullTest = loadFullToeicTest('6852');
  assert(fullTest.length === 200, 'Test 6852 loaded 200 questions for simulation');

  // Scenario 5.2: 200 Questions with completely Empty Answers Map
  const emptyAnsResult = calculateToeicScore({}, fullTest, 3600);
  assert(emptyAnsResult.rawListening === 0, '200Q empty answers: rawListening = 0');
  assert(emptyAnsResult.rawReading === 0, '200Q empty answers: rawReading = 0');
  assert(emptyAnsResult.scaledListening === 5, '200Q empty answers: scaledListening = 5');
  assert(emptyAnsResult.scaledReading === 5, '200Q empty answers: scaledReading = 5');
  assert(emptyAnsResult.scaledTotal === 10, '200Q empty answers: scaledTotal = 10');
  assert(emptyAnsResult.cefrLevel === 'A1', '200Q empty answers: cefrLevel = A1');
  assert(emptyAnsResult.partStats[1].total === 6, '200Q empty answers: Part 1 total = 6');
  assert(emptyAnsResult.partStats[1].correct === 0, '200Q empty answers: Part 1 correct = 0');
  assert(emptyAnsResult.partStats[1].percentage === 0, '200Q empty answers: Part 1 percentage = 0');
  assert(emptyAnsResult.partStats[7].total === 54, '200Q empty answers: Part 7 total = 54');

  // Scenario 5.3: Partial Answers (e.g. 5 out of 200 answered)
  // Answer first 5 questions of Part 1 correctly, leave 195 unanswered
  const partialAnswers5: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  for (let i = 1; i <= 5; i++) {
    partialAnswers5[i] = fullTest[i - 1].correctAnswer;
  }
  const partialResult5 = calculateToeicScore(partialAnswers5, fullTest, 300);
  assert(partialResult5.rawListening === 5, 'Partial 5Q: rawListening = 5');
  assert(partialResult5.rawReading === 0, 'Partial 5Q: rawReading = 0');
  assert(partialResult5.rawTotal === 5, 'Partial 5Q: rawTotal = 5');
  // Raw LC 5 is within floor (0-6 -> 5 scaled)
  assert(partialResult5.scaledListening === 5, 'Partial 5Q: scaledListening = 5');
  assert(partialResult5.scaledReading === 5, 'Partial 5Q: scaledReading = 5');
  assert(partialResult5.scaledTotal === 10, 'Partial 5Q: scaledTotal = 10');
  assert(partialResult5.cefrLevel === 'A1', 'Partial 5Q: cefrLevel = A1');
  // Part 1 accuracy: 5 out of 6 correct = 83.33% -> 83% -> 'high'
  assert(partialResult5.partStats[1].correct === 5, 'Partial 5Q: Part 1 correct = 5');
  assert(partialResult5.partStats[1].percentage === 83, 'Partial 5Q: Part 1 percentage = 83%');
  assert(partialResult5.partStats[1].accuracyRating === 'high', 'Partial 5Q: Part 1 accuracy rating = high');
  assert(partialResult5.partStats[2].percentage === 0, 'Partial 5Q: Part 2 percentage = 0%');

  // Scenario 5.4: Partial Answers with high score in Part 5
  // Answer all 30 questions of Part 5 correctly (Q101 - Q130)
  const part5Answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  const p5Questions = fullTest.filter((q) => q.part === 5);
  for (const q of p5Questions) {
    part5Answers[q.questionNumber] = q.correctAnswer;
  }
  const part5Result = calculateToeicScore(part5Answers, fullTest, 900);
  assert(part5Result.rawReading === 30, 'Part 5 only: rawReading = 30');
  assert(part5Result.rawListening === 0, 'Part 5 only: rawListening = 0');
  assert(part5Result.scaledReading === 110, 'Part 5 only: scaledReading = 110 (raw 30 in RC barem)');
  assert(part5Result.scaledListening === 5, 'Part 5 only: scaledListening = 5');
  assert(part5Result.scaledTotal === 115, 'Part 5 only: scaledTotal = 115');
  assert(part5Result.partStats[5].correct === 30, 'Part 5 only: correct = 30/30');
  assert(part5Result.partStats[5].percentage === 100, 'Part 5 only: percentage = 100%');
  assert(part5Result.partStats[5].accuracyRating === 'high', 'Part 5 only: accuracyRating = high');

  // Scenario 5.5: Adversarial Answer Formatting (Whitespace, Lowercase, Invalid Keys, Ghost Keys)
  const adversarialAnswers: Record<number, string> = {
    // Lowercase
    1: fullTest[0].correctAnswer.toLowerCase(),
    // Whitespace padding
    2: `  ${fullTest[1].correctAnswer} \t `,
    // Newlines
    3: `\n${fullTest[2].correctAnswer}\r\n`,
    // Invalid option letters
    4: 'E',
    5: 'Z',
    // Empty string
    6: '',
    // Whitespace only
    7: '   ',
    // Ghost keys not in test
    999: 'A',
    1000: 'B',
  };
  const advResult = calculateToeicScore(adversarialAnswers, fullTest, 500);
  assert(advResult.partStats[1].correct === 3, 'Adversarial answers: correctly recognized Q1 (lowercase), Q2 (padded), Q3 (newlines)');
  assert(advResult.partStats[1].percentage === 50, 'Adversarial answers: 3/6 = 50%');
  assert(advResult.partStats[1].accuracyRating === 'medium', 'Adversarial answers: 50% rating = medium');
  assert(advResult.rawTotal === 3, 'Adversarial answers: ghost keys 999, 1000 did not create phantom points');

  // Scenario 5.6: Single Part Practice (Subset of Questions)
  // When practicing Part 7 only (54 questions)
  const p7Questions = fullTest.filter((q) => q.part === 7);
  const p7Answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  p7Questions.forEach((q, idx) => {
    if (idx < 27) {
      p7Answers[q.questionNumber] = q.correctAnswer;
    }
  });
  const p7Result = calculateToeicScore(p7Answers, p7Questions, 1800);
  assert(p7Result.partStats[7].total === 54, 'Part 7 practice: total = 54');
  assert(p7Result.partStats[7].correct === 27, 'Part 7 practice: correct = 27');
  assert(p7Result.partStats[7].percentage === 50, 'Part 7 practice: percentage = 50%');
  assert(p7Result.partStats[7].accuracyRating === 'medium', 'Part 7 practice: rating = medium');
  assert(p7Result.partStats[1].total === 0, 'Part 7 practice: Part 1 total = 0');
  assert(p7Result.partStats[1].percentage === 0, 'Part 7 practice: Part 1 percentage = 0%');

  // ─────────────────────────────────────────────────────────────
  // SUITE 6: AUTHENTIC CATALOG VALIDATION & MONTE CARLO FUZZING
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Suite 6: Authentic Catalog & Monte Carlo Fuzzing ---');

  const catalog = getAvailableToeicTests();
  assert(catalog.length === 7, 'Catalog contains exactly 7 tests');

  for (const testMeta of catalog) {
    const test = loadFullToeicTest(testMeta.testId);
    assert(test.length === 200, `Test ${testMeta.testId} has 200 questions`);

    // Verify Perfect Score gives 990
    const perfectMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    test.forEach((q) => {
      perfectMap[q.questionNumber] = q.correctAnswer;
    });
    const perfScore = calculateToeicScore(perfectMap, test);
    assert(
      perfScore.rawListening === 100 &&
        perfScore.rawReading === 100 &&
        perfScore.scaledTotal === 990 &&
        perfScore.cefrLevel === 'C1',
      `Test ${testMeta.testId} perfect score = 990 (C1)`
    );

    // Verify Zero Score gives 10
    const zeroMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    test.forEach((q) => {
      // Pick deliberately wrong answer
      zeroMap[q.questionNumber] = q.correctAnswer === 'A' ? 'B' : 'A';
    });
    const zeroScore = calculateToeicScore(zeroMap, test);
    assert(
      zeroScore.rawListening === 0 &&
        zeroScore.rawReading === 0 &&
        zeroScore.scaledTotal === 10 &&
        zeroScore.cefrLevel === 'A1',
      `Test ${testMeta.testId} zero score = 10 (A1)`
    );
  }

  // Monte Carlo Fuzzing: 100 Random Exam Runs
  console.log('\nExecuting 100 Monte Carlo randomized exam simulations...');
  const optionsList: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  let fuzzPassed = true;
  let fuzzViolation = '';

  for (let run = 1; run <= 100; run++) {
    const randomAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    const answerProbability = Math.random(); // answer rate between 0% and 100%

    for (let q = 1; q <= 200; q++) {
      if (Math.random() < answerProbability) {
        const choice = optionsList[Math.floor(Math.random() * optionsList.length)];
        randomAnswers[q] = choice;
      }
    }

    const res = calculateToeicScore(randomAnswers, fullTest, Math.floor(Math.random() * 7200));

    // INVARIANTS:
    if (res.rawListening < 0 || res.rawListening > 100) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: rawListening out of range [0, 100]: ${res.rawListening}`;
      break;
    }
    if (res.rawReading < 0 || res.rawReading > 100) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: rawReading out of range [0, 100]: ${res.rawReading}`;
      break;
    }
    if (res.rawTotal !== res.rawListening + res.rawReading) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: rawTotal !== rawListening + rawReading`;
      break;
    }
    if (res.scaledListening < 5 || res.scaledListening > 495 || res.scaledListening % 5 !== 0) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: invalid scaledListening: ${res.scaledListening}`;
      break;
    }
    if (res.scaledReading < 5 || res.scaledReading > 495 || res.scaledReading % 5 !== 0) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: invalid scaledReading: ${res.scaledReading}`;
      break;
    }
    if (res.scaledTotal !== res.scaledListening + res.scaledReading) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: scaledTotal !== scaledListening + scaledReading`;
      break;
    }
    if (res.scaledTotal < 10 || res.scaledTotal > 990 || res.scaledTotal % 5 !== 0) {
      fuzzPassed = false;
      fuzzViolation = `Run ${run}: invalid scaledTotal: ${res.scaledTotal}`;
      break;
    }
    for (let p = 1; p <= 7; p++) {
      const st = res.partStats[p as ToeicPart];
      if (st.correct < 0 || st.correct > st.total) {
        fuzzPassed = false;
        fuzzViolation = `Run ${run}: part ${p} correct (${st.correct}) > total (${st.total})`;
        break;
      }
      if (st.percentage < 0 || st.percentage > 100) {
        fuzzPassed = false;
        fuzzViolation = `Run ${run}: part ${p} percentage (${st.percentage}) out of bounds`;
        break;
      }
    }
    if (!fuzzPassed) break;
  }

  assert(fuzzPassed, `100 Monte Carlo runs satisfied all TOEIC scoring mathematical invariants ${fuzzViolation}`);

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`STRESS TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('\nFailures recorded:');
    failures.forEach((f) => console.error(`- ${f}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ADVERSARIAL & EMPIRICAL STRESS TESTS PASSED WITH 0 DEFECTS!');
    process.exit(0);
  }
}

runStressTests().catch((err) => {
  console.error('Fatal error in stress test harness:', err);
  process.exit(1);
});
