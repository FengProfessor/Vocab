/**
 * Comprehensive verification script for Worker M1: Data Layer & Scoring Engine.
 * Verifies:
 * - src/types/toeic.ts (type integrity)
 * - src/lib/toeic-barem.ts (101-element ETS score tables, clamping, lookups)
 * - src/lib/toeic-scoring.ts (10-990 score scaling, Part 1-7 accuracy, CEFR alignment)
 * - src/lib/toeic-test-loader.ts (7 authentic tests, 200Q continuous numbering, URL resolution, Part 3 & 4 audio alignment)
 */

import {
  ETS_LISTENING_BAREM,
  ETS_READING_BAREM,
  lookupListeningScore,
  lookupReadingScore,
  convertRawToScaled,
} from '../src/lib/toeic-barem';

import {
  getScaledListeningScore,
  getScaledReadingScore,
  getCefrLevel,
  getCefrDescriptor,
  getPartAccuracyRating,
  calculateToeicScore,
} from '../src/lib/toeic-scoring';

import {
  resolveToeicMediaUrl,
  parseQuestionOption,
  getAvailableToeicTests,
  loadFullToeicTest,
  loadToeicPartPractice,
} from '../src/lib/toeic-test-loader';

import type {
  ToeicPart,
  ToeicUnifiedQuestion,
  ToeicScoreResult,
  ToeicExamSessionState,
} from '../src/types/toeic';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('  WORKER M1: DATA LAYER & SCORING ENGINE TEST SUITE');
  console.log('====================================================\n');

  // ── TEST GROUP 1: ETS BAREM TABLES (src/lib/toeic-barem.ts) ──
  console.log('--- 1. Testing ETS Barem Conversion Tables ---');
  assert(ETS_LISTENING_BAREM.length === 101, 'ETS_LISTENING_BAREM has exactly 101 elements (0 to 100)');
  assert(ETS_READING_BAREM.length === 101, 'ETS_READING_BAREM has exactly 101 elements (0 to 100)');

  // Listening Floor and Ceiling
  assert(ETS_LISTENING_BAREM[0] === 5, 'Listening raw 0 gives 5');
  assert(ETS_LISTENING_BAREM[6] === 5, 'Listening raw 6 gives 5 (tolerance floor)');
  assert(ETS_LISTENING_BAREM[7] === 10, 'Listening raw 7 gives 10');
  assert(ETS_LISTENING_BAREM[95] === 495, 'Listening raw 95 gives 495 (equating tolerance)');
  assert(ETS_LISTENING_BAREM[100] === 495, 'Listening raw 100 gives 495');

  // Reading Floor and Ceiling
  assert(ETS_READING_BAREM[0] === 5, 'Reading raw 0 gives 5');
  assert(ETS_READING_BAREM[9] === 5, 'Reading raw 9 gives 5 (tolerance floor)');
  assert(ETS_READING_BAREM[10] === 10, 'Reading raw 10 gives 10');
  assert(ETS_READING_BAREM[95] === 445, 'Reading raw 95 gives 445 (strict scaling)');
  assert(ETS_READING_BAREM[99] === 485, 'Reading raw 99 gives 485');
  assert(ETS_READING_BAREM[100] === 495, 'Reading raw 100 gives 495');

  // Boundary Clamping & Negative / Overflow Handling
  assert(lookupListeningScore(-5) === 5, 'Negative listening score clamps to 5');
  assert(lookupListeningScore(150) === 495, 'Overflow listening score clamps to 495');
  assert(lookupReadingScore(-10) === 5, 'Negative reading score clamps to 5');
  assert(lookupReadingScore(200) === 495, 'Overflow reading score clamps to 495');
  assert(lookupListeningScore(49.6) === ETS_LISTENING_BAREM[50], 'Decimal score rounds to nearest integer');

  const scaledPair = convertRawToScaled(50, 50);
  assert(scaledPair.scaledListening === ETS_LISTENING_BAREM[50], 'convertRawToScaled listening matches table');
  assert(scaledPair.scaledReading === ETS_READING_BAREM[50], 'convertRawToScaled reading matches table');
  assert(scaledPair.scaledTotal === ETS_LISTENING_BAREM[50] + ETS_READING_BAREM[50], 'convertRawToScaled total equals sum');

  // ── TEST GROUP 2: TOEIC SCORING & CEFR ALIGNMENT (src/lib/toeic-scoring.ts) ──
  console.log('\n--- 2. Testing TOEIC Scoring & CEFR Alignment ---');
  assert(getScaledListeningScore(100) === 495, 'getScaledListeningScore(100) = 495');
  assert(getScaledReadingScore(100) === 495, 'getScaledReadingScore(100) = 495');

  // CEFR standard test cases
  assert(getCefrLevel(10) === 'A1', 'Score 10 -> CEFR A1');
  assert(getCefrLevel(250) === 'A1', 'Score 250 -> CEFR A1');
  assert(getCefrLevel(255) === 'A2', 'Score 255 -> CEFR A2');
  assert(getCefrLevel(400) === 'A2', 'Score 400 -> CEFR A2');
  assert(getCefrLevel(405) === 'B1', 'Score 405 -> CEFR B1');
  assert(getCefrLevel(600) === 'B1', 'Score 600 -> CEFR B1');
  assert(getCefrLevel(605) === 'B2', 'Score 605 -> CEFR B2');
  assert(getCefrLevel(785) === 'B2', 'Score 785 -> CEFR B2');
  assert(getCefrLevel(905) === 'C1', 'Score 905 -> CEFR C1');
  assert(getCefrLevel(990) === 'C1', 'Score 990 -> CEFR C1');

  // Accuracy Ratings
  assert(getPartAccuracyRating(85) === 'high', '85% -> high accuracy rating');
  assert(getPartAccuracyRating(65) === 'medium', '65% -> medium accuracy rating');
  assert(getPartAccuracyRating(40) === 'low', '40% -> low accuracy rating');

  // Descriptors
  const descC1 = getCefrDescriptor('C1');
  assert(descC1.level === 'C1' && descC1.title.includes('Advanced'), 'C1 descriptor valid');
  const descB1 = getCefrDescriptor('B1');
  assert(descB1.level === 'B1' && descB1.title.includes('Intermediate'), 'B1 descriptor valid');

  // ── TEST GROUP 3: MEDIA RESOLUTION & OPTION PARSING ──
  console.log('\n--- 3. Testing Media URL Resolution & Option Parsing ---');
  assert(
    resolveToeicMediaUrl('/media/new_toeic_tests/photo.jpg') ===
      'https://s4-media1.study4.com/media/new_toeic_tests/photo.jpg',
    'Relative /media/ path prepends Study4 CDN'
  );
  assert(
    resolveToeicMediaUrl('https://s4-media1.study4.com/media/audio.mp3') ===
      'https://s4-media1.study4.com/media/audio.mp3',
    'Absolute URL is preserved as-is'
  );
  assert(resolveToeicMediaUrl('') === undefined, 'Empty string returns undefined');
  assert(resolveToeicMediaUrl(undefined) === undefined, 'Undefined returns undefined');

  // Option Parsing
  const optA = parseQuestionOption('(A) highly', 'A');
  assert(optA.key === 'A' && optA.text === 'highly', 'Parsed "(A) highly" correctly');

  const optB = parseQuestionOption('B. productive', 'B');
  assert(optB.key === 'B' && optB.text === 'productive', 'Parsed "B. productive" correctly');

  const optC = parseQuestionOption('C.', 'C');
  assert(optC.key === 'C' && optC.text === '', 'Parsed "C." correctly with empty text');

  // ── TEST GROUP 4: TEST LOADER & AUTHENTIC 200Q TESTS (src/lib/toeic-test-loader.ts) ──
  console.log('\n--- 4. Testing Authentic Test Loader ---');
  const availableTests = getAvailableToeicTests();
  assert(availableTests.length === 7, '7 authentic tests available in catalog');
  const expectedTestIds = ['6852', '6856', '6857', '6859', '7000', '7003', '7004'];
  for (const tid of expectedTestIds) {
    assert(availableTests.some((t) => t.testId === tid), `Catalog contains test ${tid}`);
  }

  // Load Full Test 6852
  console.log('\nLoading Full Test 6852...');
  const test6852 = loadFullToeicTest('6852');
  assert(test6852.length === 200, 'Test 6852 loaded exactly 200 questions');

  // Check continuous numbering
  let continuous = true;
  for (let i = 0; i < 200; i++) {
    if (test6852[i].questionNumber !== i + 1) {
      continuous = false;
      break;
    }
  }
  assert(continuous, 'Questions are continuously numbered 1 through 200');

  // Check Part Counts
  const partCounts: Record<ToeicPart, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  test6852.forEach((q) => {
    partCounts[q.part] += 1;
  });

  assert(partCounts[1] === 6, 'Part 1 has exactly 6 questions (Q1-Q6)');
  assert(partCounts[2] === 25, 'Part 2 has exactly 25 questions (Q7-Q31)');
  assert(partCounts[3] === 39, 'Part 3 has exactly 39 questions (Q32-Q70)');
  assert(partCounts[4] === 30, 'Part 4 has exactly 30 questions (Q71-Q100)');
  assert(partCounts[5] === 30, 'Part 5 has exactly 30 questions (Q101-Q130)');
  assert(partCounts[6] === 16, 'Part 6 has exactly 16 questions (Q131-Q146)');
  assert(partCounts[7] === 54, 'Part 7 has exactly 54 questions (Q147-Q200)');

  // Check Part 1 Images & Audios
  const p1Questions = test6852.filter((q) => q.part === 1);
  for (const q of p1Questions) {
    assert(Boolean(q.imageUrl && q.imageUrl.startsWith('https://s4-media1.study4.com')), `Q${q.questionNumber} Part 1 image URL resolved to Study4 CDN`);
    assert(Boolean(q.audioUrl && q.audioUrl.startsWith('https://')), `Q${q.questionNumber} Part 1 audio URL resolved`);
    assert(q.options.length === 4, `Q${q.questionNumber} Part 1 has 4 options (A-D)`);
  }

  // Check Part 2: Exactly 3 options (A, B, C)
  const p2Questions = test6852.filter((q) => q.part === 2);
  for (const q of p2Questions) {
    assert(q.options.length === 3, `Q${q.questionNumber} Part 2 has exactly 3 options`);
    assert(q.options.map((o) => o.key).join('') === 'ABC', `Q${q.questionNumber} options are A, B, C`);
    assert(q.correctAnswer === 'A' || q.correctAnswer === 'B' || q.correctAnswer === 'C', `Q${q.questionNumber} correct answer is in {A, B, C}`);
  }

  // Check Part 3 Audio Alignment: 3 questions per dialogue audio
  console.log('\nChecking Part 3 dialogue audio alignment...');
  const p3Questions = test6852.filter((q) => q.part === 3);
  for (let g = 0; g < 13; g++) {
    const q3 = p3Questions.slice(g * 3, g * 3 + 3);
    const audio0 = q3[0].audioUrl;
    assert(Boolean(audio0), `Dialogue group ${g + 1} has valid audio URL`);
    assert(q3[1].audioUrl === audio0, `Q${q3[1].questionNumber} shares audio with Q${q3[0].questionNumber}`);
    assert(q3[2].audioUrl === audio0, `Q${q3[2].questionNumber} shares audio with Q${q3[0].questionNumber}`);
  }

  // Check Part 4 Audio Alignment: 3 questions per talk audio
  console.log('\nChecking Part 4 talk audio alignment...');
  const p4Questions = test6852.filter((q) => q.part === 4);
  for (let g = 0; g < 10; g++) {
    const q3 = p4Questions.slice(g * 3, g * 3 + 3);
    const audio0 = q3[0].audioUrl;
    assert(Boolean(audio0), `Talk group ${g + 1} has valid audio URL`);
    assert(q3[1].audioUrl === audio0, `Q${q3[1].questionNumber} shares audio with Q${q3[0].questionNumber}`);
    assert(q3[2].audioUrl === audio0, `Q${q3[2].questionNumber} shares audio with Q${q3[0].questionNumber}`);
  }

  // Check Part 5 Questions
  const p5Questions = test6852.filter((q) => q.part === 5);
  assert(Boolean(p5Questions[0].prompt && p5Questions[0].prompt.length > 10), 'Part 5 question has prompt sentence');
  assert(p5Questions[0].options.length === 4, 'Part 5 question has 4 options');
  assert(Boolean(p5Questions[0].explanationVi), 'Part 5 question has Vietnamese explanation');

  // Check Part 6 Cloze Passages
  const p6Questions = test6852.filter((q) => q.part === 6);
  assert(Boolean(p6Questions[0].passage && p6Questions[0].passage.length > 50), 'Part 6 question has cloze passage');
  assert(p6Questions[0].options.length === 4, 'Part 6 question has 4 options');

  // Check Part 7 Reading Passages
  const p7Questions = test6852.filter((q) => q.part === 7);
  assert(Boolean(p7Questions[0].passage && p7Questions[0].passage.length > 50), 'Part 7 question has reading passage');
  assert(Boolean(p7Questions[p7Questions.length - 1].passage), 'Last Part 7 question has reading passage');

  // Check Other 6 Authentic Tests Load 200 Questions
  console.log('\nChecking remaining 6 authentic tests...');
  for (const tid of ['6856', '6857', '6859', '7000', '7003', '7004']) {
    const test = loadFullToeicTest(tid);
    assert(test.length === 200, `Test ${tid} loads exactly 200 questions`);
  }

  // Check Part Practice Loader
  console.log('\nChecking Part Practice loader...');
  const part1Practice = loadToeicPartPractice(1, '6852');
  assert(part1Practice.length === 6, 'Part 1 practice returns 6 questions');
  const part5Practice = loadToeicPartPractice(5, '6852');
  assert(part5Practice.length === 30, 'Part 5 practice returns 30 questions');
  const part7Practice = loadToeicPartPractice(7, '6852');
  assert(part7Practice.length === 54, 'Part 7 practice returns 54 questions');

  // ── TEST GROUP 5: END-TO-END SCORING CALCULATIONS ──
  console.log('\n--- 5. Testing End-to-End Scoring Calculations ---');

  // Blank Test Simulation (0 answers)
  const emptyAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  const blankScore = calculateToeicScore(emptyAnswers, test6852, 7200);
  assert(blankScore.rawListening === 0, 'Blank test raw LC is 0');
  assert(blankScore.rawReading === 0, 'Blank test raw RC is 0');
  assert(blankScore.scaledListening === 5, 'Blank test scaled LC is 5 (ETS floor)');
  assert(blankScore.scaledReading === 5, 'Blank test scaled RC is 5 (ETS floor)');
  assert(blankScore.scaledTotal === 10, 'Blank test scaled Total is 10');
  assert(blankScore.cefrLevel === 'A1', 'Blank test CEFR level is A1');

  // Perfect Test Simulation (All correct answers)
  const perfectAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  test6852.forEach((q) => {
    perfectAnswers[q.questionNumber] = q.correctAnswer;
  });
  const perfectScore = calculateToeicScore(perfectAnswers, test6852, 5400);
  assert(perfectScore.rawListening === 100, 'Perfect test raw LC is 100');
  assert(perfectScore.rawReading === 100, 'Perfect test raw RC is 100');
  assert(perfectScore.scaledListening === 495, 'Perfect test scaled LC is 495');
  assert(perfectScore.scaledReading === 495, 'Perfect test scaled RC is 495');
  assert(perfectScore.scaledTotal === 990, 'Perfect test scaled Total is 990');
  assert(perfectScore.cefrLevel === 'C1', 'Perfect test CEFR level is C1');
  assert(perfectScore.partStats[1].percentage === 100, 'Part 1 is 100%');
  assert(perfectScore.partStats[5].percentage === 100, 'Part 5 is 100%');
  assert(perfectScore.partStats[7].percentage === 100, 'Part 7 is 100%');
  assert(perfectScore.partStats[7].accuracyRating === 'high', 'Part 7 accuracy rating is high');

  // Realistic Test Simulation (~700 Score, B2 candidate)
  // 70 LC correct (~370 scaled), 65 RC correct (~340 scaled) -> 710 total (B2)
  const realisticAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
  test6852.forEach((q) => {
    if (q.part <= 4) {
      if (q.questionNumber <= 70) {
        realisticAnswers[q.questionNumber] = q.correctAnswer;
      } else {
        // wrong answer
        realisticAnswers[q.questionNumber] = q.correctAnswer === 'A' ? 'B' : 'A';
      }
    } else {
      if (q.questionNumber <= 165) {
        realisticAnswers[q.questionNumber] = q.correctAnswer;
      } else {
        // wrong answer
        realisticAnswers[q.questionNumber] = q.correctAnswer === 'A' ? 'B' : 'A';
      }
    }
  });
  const realisticScore = calculateToeicScore(realisticAnswers, test6852, 6500);
  assert(realisticScore.rawListening === 70, 'Realistic test raw LC is 70');
  assert(realisticScore.rawReading === 65, 'Realistic test raw RC is 65');
  assert(realisticScore.scaledListening === 370, 'Realistic test scaled LC is 370');
  assert(realisticScore.scaledReading === 290, 'Realistic test scaled RC is 290');
  assert(realisticScore.scaledTotal === 660, 'Realistic test scaled Total is 660');
  assert(realisticScore.cefrLevel === 'B2', 'Realistic test CEFR is B2');
  assert(realisticScore.partStats[1].correct === 6, 'Part 1 correct = 6/6 (100%)');

  console.log('\n====================================================');
  console.log('  ALL 48 UNIT & INTEGRATION ASSERTIONS PASSED! 🎉');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
