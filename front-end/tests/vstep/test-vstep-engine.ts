/**
 * Automated Verification Suite for VSTEP Standardized Exam Engine
 * Tests scoring, cyber defense, zero bulk leaks, watermarking, and anti-duplication.
 */

import {
  calculateReadingScore,
  calculateListeningScore,
  roundVstepScore,
  getCefrLevel,
  calculateVstepScore,
} from '../../src/lib/vstep-scoring';
import {
  loadVstepExamSafe,
  loadRawVstepExam,
  getVstepCatalog,
  loadVstepSkillPractice,
} from '../../src/lib/vstep-test-loader';
import {
  embedInvisibleWatermark,
  extractInvisibleWatermark,
  generateVstepSessionToken,
  verifyVstepSessionToken,
  isVstepHoneypot,
  poisonVstepQuestion,
} from '../../src/lib/vstep-anti-scraping';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING VSTEP STANDARDIZED EXAM ENGINE TEST SUITE');
  console.log('======================================================\n');

  // ── TEST 1: VSTEP Scoring & MOET Rounding Rules ──
  console.log('--- 1. Testing VSTEP Scoring & MOET Rounding Rules ---');
  assert(roundVstepScore(6.2) === 6.0, '6.2 rounds to 6.0');
  assert(roundVstepScore(6.25) === 6.5, '6.25 rounds to 6.5');
  assert(roundVstepScore(6.74) === 6.5, '6.74 rounds to 6.5');
  assert(roundVstepScore(6.75) === 7.0, '6.75 rounds to 7.0');
  assert(roundVstepScore(8.4) === 8.5, '8.4 rounds to 8.5');

  assert(calculateListeningScore(35, 35) === 10.0, '35/35 Listening is 10.0');
  assert(calculateListeningScore(21, 35) === 6.0, '21/35 Listening is 6.0');
  assert(calculateReadingScore(40, 40) === 10.0, '40/40 Reading is 10.0');
  assert(calculateReadingScore(26, 40) === 6.5, '26/40 Reading is 6.5');

  assert(getCefrLevel(4.0) === 'B1', '4.0 is B1');
  assert(getCefrLevel(5.5) === 'B1', '5.5 is B1');
  assert(getCefrLevel(6.0) === 'B2', '6.0 is B2');
  assert(getCefrLevel(8.0) === 'B2', '8.0 is B2');
  assert(getCefrLevel(8.5) === 'C1', '8.5 is C1');
  assert(getCefrLevel(3.5) === 'A2', '3.5 is A2 (Dưới B1)');

  const composite = calculateVstepScore({
    listeningCorrect: 21, // 6.0
    readingCorrect: 26,   // 6.5
    writingScore: 6.5,
    speakingScore: 6.0,
  });
  // Average = (6.0 + 6.5 + 6.5 + 6.0) / 4 = 6.25 -> rounded to 6.5
  assert(composite.overallScore === 6.5, 'Composite (6.0, 6.5, 6.5, 6.0) rounds to 6.5');
  assert(composite.cefrLevel === 'B2', 'Composite 6.5 is CEFR B2');

  // ── TEST 2: Active Cyber Defense & Zero Bulk Leaks ──
  console.log('\n--- 2. Testing Cyber Defense & Zero Bulk Leaks ---');
  const safeExam = loadVstepExamSafe('vstep-mock-01');
  assert(safeExam !== null, 'loadVstepExamSafe loads exam-01');

  let hasLeakedAnswers = false;
  let hasLeakedExplanations = false;
  let hasLeakedTapescripts = false;

  safeExam?.sections.forEach((sec) => {
    sec.tasks.forEach((tsk) => {
      if (tsk.tapescript) hasLeakedTapescripts = true;
      if (tsk.questions) {
        tsk.questions.forEach((q) => {
          if (typeof q.answer === 'number') hasLeakedAnswers = true;
          if (q.explanationVi) hasLeakedExplanations = true;
        });
      }
    });
  });

  assert(!hasLeakedAnswers, 'Public safe exam contains ZERO answers (Zero Bulk Leak)');
  assert(!hasLeakedExplanations, 'Public safe exam contains ZERO explanations');
  assert(!hasLeakedTapescripts, 'Public safe exam contains ZERO tapescripts');

  // Honeypot Canary
  assert(isVstepHoneypot('vstep-canary-honeypot'), 'Catches vstep-canary-honeypot');
  assert(isVstepHoneypot('vstep-dump-all'), 'Catches vstep-dump-all');
  assert(!isVstepHoneypot('vstep-mock-01'), 'Does not falsely flag vstep-mock-01');

  // Session Token
  const token = generateVstepSessionToken('127.0.0.1', 'vstep-mock-01');
  assert(verifyVstepSessionToken(token, '127.0.0.1', 'vstep-mock-01'), 'HMAC session token validates with correct IP & testId');
  assert(!verifyVstepSessionToken(token, '192.168.1.1', 'vstep-mock-01'), 'HMAC session token rejects invalid IP');
  assert(!verifyVstepSessionToken(token, '127.0.0.1', 'vstep-mock-02'), 'HMAC session token rejects wrong testId');

  // Invisible Watermarking
  const originalVi = 'Đáp án A chính xác vì bài nghe đã đề cập rõ ràng.';
  const payload = 'IP:192.168.1.100|UID:user123';
  const watermarked = embedInvisibleWatermark(originalVi, payload);
  assert(watermarked !== originalVi, 'Watermark modified text representation');
  const extracted = extractInvisibleWatermark(watermarked);
  assert(extracted === payload, 'Extracted invisible watermark matches original payload 100%');

  // Data Poisoning
  const dummyQ = {
    id: 'Q1',
    type: 'mcq' as const,
    question: 'Sample question',
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    explanationVi: 'Lời giải thật',
  };
  const poisoned = poisonVstepQuestion(dummyQ);
  assert(poisoned.answer !== dummyQ.answer, 'Poisoned question answer is shifted');
  assert(poisoned.explanationVi !== dummyQ.explanationVi, 'Poisoned question explanation is swapped');

  // ── TEST 3: Catalog & Data Integrity ──
  console.log('\n--- 3. Testing Catalog & Data Integrity ---');
  const catalog = getVstepCatalog();
  assert(catalog.items.length >= 4, `Catalog has ${catalog.items.length} items (>= 4)`);
  assert(catalog.items.some((i) => i.id === 'vstep-mock-01'), 'Catalog has vstep-mock-01');
  assert(catalog.items.some((i) => i.id === 'vstep-listening-01'), 'Catalog has vstep-listening-01');

  const rawExam01 = loadRawVstepExam('vstep-mock-01');
  assert(rawExam01?.sections.length === 4, 'vstep-mock-01 has all 4 skills (Listening, Reading, Writing, Speaking)');

  // ── TEST 4: Anti-Duplication Filtering ──
  console.log('\n--- 4. Testing Anti-Duplication Filtering ---');
  const readingPractice = loadVstepSkillPractice('reading', 'unseen', ['R1Q1', 'R1Q2', 'R1Q3']);
  const firstPassageQuestions = readingPractice?.sections[0]?.tasks[0]?.questions || [];
  const containsExcluded = firstPassageQuestions.some((q) => ['R1Q1', 'R1Q2', 'R1Q3'].includes(q.id));
  assert(!containsExcluded, 'Unseen filter mode successfully excluded previously answered question IDs');

  console.log('\n======================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
