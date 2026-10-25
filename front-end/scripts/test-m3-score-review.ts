/**
 * Test Suite for Milestone M3:
 * Comprehensive Score Report, Interactive Review Mode, and Exam Page Integration.
 *
 * Run via: npx tsx scripts/test-m3-score-review.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { loadFullToeicTest, loadToeicPartPractice } from '../src/lib/toeic-test-loader';
import { calculateToeicScore, getCefrDescriptor, getPartAccuracyRating } from '../src/lib/toeic-scoring';
import type { ToeicOptionKey, ToeicPart } from '../src/types/toeic';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✓ PASS: ${message}`);
}

async function runM3Tests() {
  console.log('================================================================================');
  console.log('  MILESTONE M3: SCORE REPORT & REVIEW MODE & EXAM INTEGRATION TESTS');
  console.log('================================================================================\n');

  const ROOT_DIR = path.resolve(__dirname, '..');
  const questions = loadFullToeicTest('6852');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ToeicScoreReportView Component File & Exports
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Test Section 1: File Existence & Interface Checks...');
  const scoreReportPath = path.resolve(ROOT_DIR, 'src/components/toeic/ToeicScoreReportView.tsx');
  assert(fs.existsSync(scoreReportPath), 'ToeicScoreReportView.tsx exists');

  const scoreReportSource = fs.readFileSync(scoreReportPath, 'utf-8');
  assert(scoreReportSource.includes('export function ToeicScoreReportView'), 'ToeicScoreReportView is exported');
  assert(scoreReportSource.includes('ToeicScoreReportViewProps'), 'ToeicScoreReportViewProps interface is defined');
  assert(scoreReportSource.includes('getCefrDescriptor'), 'ToeicScoreReportView integrates getCefrDescriptor');
  assert(scoreReportSource.includes('getPartAccuracyRating'), 'ToeicScoreReportView integrates getPartAccuracyRating');
  assert(scoreReportSource.includes('ToeicAudioPlayer'), 'ToeicScoreReportView integrates ToeicAudioPlayer');

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Exam Page Integration & Immersive Shell
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test Section 2: Exam Page Integration & Immersive Shell...');
  const examPagePath = path.resolve(ROOT_DIR, 'src/app/toeic/exam/[examId]/page.tsx');
  assert(fs.existsSync(examPagePath), 'Exam page.tsx exists');

  const examPageSource = fs.readFileSync(examPagePath, 'utf-8');
  assert(examPageSource.includes('StudentShell'), 'Exam page imports StudentShell');
  assert(examPageSource.includes('immersive={true}'), 'Exam page wraps test room in StudentShell immersive={true}');
  assert(examPageSource.includes('ToeicExamHeader'), 'Exam page integrates ToeicExamHeader');
  assert(examPageSource.includes('ToeicSplitPane'), 'Exam page integrates ToeicSplitPane');
  assert(examPageSource.includes('ToeicQuestionPalette'), 'Exam page integrates ToeicQuestionPalette');
  assert(examPageSource.includes('ExamPauseModal'), 'Exam page integrates ExamPauseModal');
  assert(examPageSource.includes('SubmitConfirmModal'), 'Exam page integrates SubmitConfirmModal');
  assert(examPageSource.includes('ToeicScoreReportView'), 'Exam page renders ToeicScoreReportView upon submission');
  assert(examPageSource.includes('useToeicExamSession'), 'Exam page integrates useToeicExamSession');

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Multi-Mode Support (Real Exam vs Practice Part)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test Section 3: Multi-Mode Support & Part Loading...');
  assert(examPageSource.includes("modeParam === 'practice'"), 'Exam page parses mode parameter');
  assert(examPageSource.includes('partParam'), 'Exam page parses part parameter for targeted practice');
  assert(examPageSource.includes('loadToeicPartPractice'), 'Exam page calls loadToeicPartPractice');
  assert(examPageSource.includes('loadFullToeicTest'), 'Exam page calls loadFullToeicTest');

  // Test part practice loader directly
  for (let p = 1; p <= 7; p++) {
    const partQs = loadToeicPartPractice(p as ToeicPart, '6852');
    assert(partQs.length > 0, `Part ${p} practice loads non-empty question list (count: ${partQs.length})`);
    assert(partQs.every((q) => q.part === p), `All questions in Part ${p} practice have part === ${p}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ETS 990 Score Presentation & CEFR Alignment Logic
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test Section 4: Score Calculation & CEFR Alignment...');
  // Scenario A: Candidate answers 90 listening + 85 reading correctly
  const answersA: Record<number, ToeicOptionKey> = {};
  for (let i = 1; i <= 90; i++) answersA[i] = questions[i - 1].correctAnswer;
  for (let i = 101; i <= 185; i++) answersA[i] = questions[i - 1].correctAnswer;

  const scoreA = calculateToeicScore(answersA, questions, 5400);
  assert(scoreA.rawListening === 90, `Raw listening count is 90 (got ${scoreA.rawListening})`);
  assert(scoreA.rawReading === 85, `Raw reading count is 85 (got ${scoreA.rawReading})`);
  assert(scoreA.rawTotal === 175, `Raw total count is 175 (got ${scoreA.rawTotal})`);
  assert(scoreA.scaledListening === 470, `Scaled listening matches ETS barem (470, got ${scoreA.scaledListening})`);
  assert(scoreA.scaledReading === 390, `Scaled reading matches ETS barem (390, got ${scoreA.scaledReading})`);
  assert(scoreA.scaledTotal === 860, `Scaled total is 860 (got ${scoreA.scaledTotal})`);
  assert(scoreA.cefrLevel === 'B2', `CEFR level is B2 (got ${scoreA.cefrLevel})`);

  const cefrB2 = getCefrDescriptor('B2');
  assert(cefrB2.title.includes('Vantage'), 'B2 title mentions Vantage');
  assert(cefrB2.descriptionVi.includes('Đạt chuẩn tuyển dụng'), 'B2 description provides Vietnamese workplace guidance');
  assert(cefrB2.targetFeedbackVi.length > 10, 'B2 feedback provides actionable Vietnamese study guidance');

  // Scenario B: Candidate achieves 990 max score
  const perfectAnswers: Record<number, ToeicOptionKey> = {};
  questions.forEach((q) => { perfectAnswers[q.questionNumber] = q.correctAnswer; });
  const scorePerfect = calculateToeicScore(perfectAnswers, questions, 6000);
  assert(scorePerfect.scaledTotal === 990, `Perfect answers yield 990 scaled total`);
  assert(scorePerfect.scaledListening === 495, `Perfect LC is 495`);
  assert(scorePerfect.scaledReading === 495, `Perfect RC is 495`);
  assert(scorePerfect.cefrLevel === 'C1', `990 score maps to CEFR C1`);

  // Scenario C: Zero score floor
  const scoreZero = calculateToeicScore({}, questions, 100);
  assert(scoreZero.scaledTotal === 10, `Zero answers yield ETS floor 10 (LC 5 + RC 5)`);
  assert(scoreZero.cefrLevel === 'A1', `Floor score maps to CEFR A1`);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Part-by-Part Accuracy Breakdown (Part 1 - Part 7)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test Section 5: Part-by-Part Accuracy Metrics...');
  for (let p = 1; p <= 7; p++) {
    const stat = scoreA.partStats[p as ToeicPart];
    assert(stat !== undefined, `Part ${p} stat exists`);
    assert(stat.total > 0, `Part ${p} total question count > 0 (got ${stat.total})`);
    assert(stat.correct >= 0, `Part ${p} correct count >= 0`);
    assert(stat.percentage >= 0 && stat.percentage <= 100, `Part ${p} percentage between 0-100`);
    const rating = getPartAccuracyRating(stat.percentage);
    assert(['high', 'medium', 'low'].includes(rating), `Part ${p} accuracy rating is high/med/low`);
  }

  // Check Part 1 in scoreA: Q1-6 are all answered correctly -> 100% (High)
  assert(scoreA.partStats[1].correct === 6, 'Part 1 has 6/6 correct');
  assert(scoreA.partStats[1].percentage === 100, 'Part 1 percentage is 100%');
  assert(scoreA.partStats[1].accuracyRating === 'high', 'Part 1 rating is high');

  // Check Part 7 in scoreA: Q101-185 answered -> Part 7 starts at 147. Q147-185 (39 correct) out of 54.
  // 39 / 54 = 72% -> Medium rating
  assert(scoreA.partStats[7].total === 54, 'Part 7 has 54 total questions');
  assert(scoreA.partStats[7].correct === 39, 'Part 7 has 39 correct');
  assert(scoreA.partStats[7].percentage === 72, 'Part 7 percentage is 72%');
  assert(scoreA.partStats[7].accuracyRating === 'medium', 'Part 7 rating is medium');

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Interactive Review Mode Logic
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n▶ Test Section 6: Interactive Review Mode Logic & Filtering...');
  // Check question filtering
  const userAnswers: Record<number, ToeicOptionKey> = {
    1: questions[0].correctAnswer, // Correct
    2: questions[1].correctAnswer === 'A' ? 'B' : 'A', // Wrong
    // 3 is unanswered
  };
  const flaggedSet = new Set<number>([2, 5, 142]);

  // Filter: Incorrect questions
  const incorrectList = questions.filter((q) => userAnswers[q.questionNumber] !== q.correctAnswer);
  assert(incorrectList.some((q) => q.questionNumber === 2), 'Q2 identified as incorrect');
  assert(incorrectList.some((q) => q.questionNumber === 3), 'Unanswered Q3 identified as incorrect');
  assert(!incorrectList.some((q) => q.questionNumber === 1), 'Q1 is NOT in incorrect list');

  // Filter: Correct questions
  const correctList = questions.filter((q) => userAnswers[q.questionNumber] === q.correctAnswer);
  assert(correctList.some((q) => q.questionNumber === 1), 'Q1 identified as correct');
  assert(!correctList.some((q) => q.questionNumber === 2), 'Q2 is NOT in correct list');

  // Filter: Flagged questions
  const flaggedList = questions.filter((q) => flaggedSet.has(q.questionNumber));
  assert(flaggedList.length === 3, `Flagged questions list has 3 items`);
  assert(flaggedList.map((q) => q.questionNumber).includes(142), 'Q142 is in flagged list');

  // Stimulus check: Listening questions have audioUrl and transcript available
  const p1Sample = questions.find((q) => q.part === 1);
  assert(Boolean(p1Sample?.imageUrl), 'Part 1 photograph question has imageUrl');
  assert(Boolean(p1Sample?.audioUrl), 'Part 1 photograph question has audioUrl');

  const p3Sample = questions.find((q) => q.part === 3);
  assert(Boolean(p3Sample?.audioUrl), 'Part 3 dialogue question has audioUrl');
  assert(Boolean(p3Sample?.explanationVi), 'Part 3 dialogue question has explanationVi');

  const p7Sample = questions.find((q) => q.part === 7);
  assert(Boolean(p7Sample?.passage), 'Part 7 reading question has passage');
  assert(Boolean(p7Sample?.explanationVi), 'Part 7 reading question has Vietnamese explanation');

  console.log('================================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} MILESTONE M3 ASSERTIONS PASSED!`);
  console.log('================================================================================\n');
}

runM3Tests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
