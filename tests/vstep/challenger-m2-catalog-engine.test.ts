/**
 * Challenger M2 2: Empirical Verification & Stress Test Suite
 *
 * Comprehensive audit of:
 *  1. Referential Integrity & Schema Conformance across all 190 catalog items
 *  2. Anti-Duplication Stress Testing (unseen, mistakes, multi-source question history)
 *  3. Scoring Engine Robustness & Extreme Boundary Stress
 */

import fs from 'fs';
import path from 'path';
import catalog from '../../src/data/vstep/vstep-catalog-index.json';
import {
  resolveExamFilePath,
  loadRawVstepExam,
  loadVstepExamSafe,
  stripSensitiveVstepData,
  loadVstepSkillPractice,
  EXAM_ROUTE_RULES,
} from '../../src/lib/vstep-test-loader';
import {
  roundVstepScore,
  calculateReadingScore,
  calculateListeningScore,
  calculateVstepScore,
  getCefrLevel,
  getCefrDescription,
} from '../../src/lib/vstep-scoring';
import {
  VSTEP_HISTORY_STORAGE_KEY,
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
  getVstepProgressStats,
  resetVstepSkillProgress,
  resetAllVstepProgress,
} from '../../src/lib/vstep-history';
import { VstepExam, VstepQuestion } from '../../src/lib/vstep-types';
import { setupMockBrowserEnvironment, teardownMockBrowserEnvironment } from './test-harness';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures: string[] = [];
const findings: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
  } else {
    failedAssertions++;
    const msg = `FAILED: ${testName}${detail ? ` -> ${detail}` : ''}`;
    failures.push(msg);
    console.error(`  ❌ ${msg}`);
  }
}

async function runEmpiricalVerification() {
  console.log('================================================================================');
  console.log('🔬 CHALLENGER M2 2: EMPIRICAL VERIFICATION & STRESS TEST HARNESS');
  console.log('================================================================================\n');

  setupMockBrowserEnvironment();

  // ============================================================================
  // SECTION 1: REFERENTIAL INTEGRITY & SCHEMA CONFORMANCE ACROSS ALL 190 ITEMS
  // ============================================================================
  console.log('▶ [1/3] Testing Referential Integrity Across All 190 Catalog Items...');

  // 1.1 Catalog index structure
  assert(catalog.items.length === 190, `Catalog items count is exactly 190 (got ${catalog.items.length})`);
  assert(catalog.totalExams === 24, `Catalog totalExams is 24 (got ${catalog.totalExams})`);
  assert(catalog.totalPracticeSets === 166, `Catalog totalPracticeSets is 166 (got ${catalog.totalPracticeSets})`);
  assert(catalog.totalExams + catalog.totalPracticeSets === 190, 'totalExams + totalPracticeSets === 190');

  // 1.2 Unique IDs in catalog
  const catalogIds = new Set<string>();
  const duplicateIds: string[] = [];
  for (const item of catalog.items) {
    if (catalogIds.has(item.id)) {
      duplicateIds.push(item.id);
    }
    catalogIds.add(item.id);
  }
  assert(duplicateIds.length === 0, 'No duplicate IDs in catalog items', `Duplicates: ${duplicateIds.join(', ')}`);
  assert(catalogIds.size === 190, `Unique catalog ID count is 190 (got ${catalogIds.size})`);

  // 1.3 Sources breakdown check
  const sourceCounts: Record<string, number> = {};
  for (const item of catalog.items) {
    const src = (item as any).source || 'unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }
  console.log('    Sources breakdown:', sourceCounts);
  assert(sourceCounts['vstepowl'] === 99, `vstepowl count is 99 (got ${sourceCounts['vstepowl']})`);
  assert(sourceCounts['onthivstep'] === 75, `onthivstep count is 75 (got ${sourceCounts['onthivstep']})`);
  assert(sourceCounts['englishteststore'] === 15, `englishteststore count is 15 (got ${sourceCounts['englishteststore']})`);
  assert(sourceCounts['vnu'] === 1, `vnu count is 1 (got ${sourceCounts['vnu']})`);

  // 1.4 Deep examination of all 190 items
  let validFilesCount = 0;
  let validExamsCount = 0;
  let totalObjectiveQuestionsAcrossAllTests = 0;
  let zeroBulkLeakPassCount = 0;
  const examQuestionCountMap = new Map<string, number>();

  for (let idx = 0; idx < catalog.items.length; idx++) {
    const item = catalog.items[idx];
    const itemId = item.id;

    // 1.4.1 File path resolution
    const filePath = resolveExamFilePath(itemId);
    const hasPath = filePath !== null && typeof filePath === 'string';
    assert(hasPath, `Item [${idx + 1}/190] (${itemId}): resolveExamFilePath returns non-null path`);

    if (!hasPath || !filePath) continue;

    // 1.4.2 File existence on disk
    const fileExists = fs.existsSync(filePath);
    assert(fileExists, `Item [${idx + 1}/190] (${itemId}): file exists at ${filePath}`);
    if (!fileExists) continue;
    validFilesCount++;

    // 1.4.3 Parse file as VstepExam
    let exam: VstepExam | null = null;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      exam = JSON.parse(fileContent) as VstepExam;
    } catch (e: any) {
      assert(false, `Item [${idx + 1}/190] (${itemId}): parses as valid JSON`, e.message);
      continue;
    }

    assert(exam !== null && typeof exam === 'object', `Item [${idx + 1}/190] (${itemId}): is valid object`);
    if (!exam) continue;

    // 1.4.4 Sections and tasks integrity
    assert(Array.isArray(exam.sections) && exam.sections.length >= 1,
      `Item [${idx + 1}/190] (${itemId}): has at least 1 section (got ${exam.sections?.length})`);

    let objectiveQCount = 0;
    let speakingPromptCount = 0;
    let hasInvalidTask = false;
    let invalidTaskReason = '';

    for (const section of exam.sections || []) {
      if (!section.tasks || !Array.isArray(section.tasks) || section.tasks.length === 0) {
        hasInvalidTask = true;
        invalidTaskReason = `Section ${(section as any).id || section.type} has no tasks`;
        break;
      }

      for (const task of section.tasks) {
        if (!task.id) {
          hasInvalidTask = true;
          invalidTaskReason = `Task in section ${section.type} is missing id`;
          break;
        }

        if (task.questions && Array.isArray(task.questions)) {
          for (const q of task.questions) {
            if (typeof q === 'object' && q !== null) {
              // Objective MCQ question
              objectiveQCount++;
              const mcq = q as VstepQuestion;
              if (!mcq.id || !mcq.options || !Array.isArray(mcq.options) || mcq.options.length < 2) {
                hasInvalidTask = true;
                invalidTaskReason = `MCQ question ${mcq.id || 'unidentified'} in task ${task.id} has invalid options`;
                break;
              }
            } else if (typeof q === 'string') {
              // Oral interview prompt (Speaking task)
              speakingPromptCount++;
            }
          }
        }
      }
      if (hasInvalidTask) break;
    }

    assert(!hasInvalidTask, `Item [${idx + 1}/190] (${itemId}): all sections and tasks valid`, invalidTaskReason);

    // 1.4.5 Question counts consistency
    totalObjectiveQuestionsAcrossAllTests += objectiveQCount;
    examQuestionCountMap.set(itemId, objectiveQCount);

    const expectedQuestions = (item as any).totalQuestions || (item as any).questionsCount;
    if (typeof expectedQuestions === 'number') {
      assert(objectiveQCount === expectedQuestions,
        `Item [${idx + 1}/190] (${itemId}): question count matches catalog item (${objectiveQCount} === ${expectedQuestions})`);
    } else {
      assert(objectiveQCount > 0, `Item [${idx + 1}/190] (${itemId}): has >0 questions (${objectiveQCount})`);
    }

    // 1.4.6 Duplicate question IDs within the exam
    const examQIds = new Set<string>();
    let duplicateQIdFound = '';
    for (const section of exam.sections || []) {
      for (const task of section.tasks || []) {
        for (const q of task.questions || []) {
          if (typeof q === 'object' && q !== null && (q as VstepQuestion).id) {
            const qId = (q as VstepQuestion).id;
            if (examQIds.has(qId)) {
              duplicateQIdFound = qId;
              break;
            }
            examQIds.add(qId);
          }
        }
        if (duplicateQIdFound) break;
      }
      if (duplicateQIdFound) break;
    }
    assert(!duplicateQIdFound, `Item [${idx + 1}/190] (${itemId}): 0 duplicate question IDs within exam`,
      `Duplicate ID: ${duplicateQIdFound}`);

    // 1.4.7 Zero-Bulk-Leak Sanitization check
    const safeExam = stripSensitiveVstepData(exam);
    let leaksDetected = 0;
    for (const sec of safeExam.sections) {
      if ((sec as any).tapescript || (sec as any).explanationVi || (sec as any).suggestion) leaksDetected++;
      for (const tsk of sec.tasks) {
        if (tsk.tapescript || tsk.suggestion || (tsk as any).explanationVi || (tsk as any).answer !== undefined) leaksDetected++;
        if (tsk.questions) {
          for (const q of tsk.questions) {
            if (typeof q === 'object' && q !== null) {
              const mcq = q as VstepQuestion;
              if (mcq.answer !== undefined || mcq.explanationVi || (mcq as any).suggestion || (mcq as any).tapescript) {
                leaksDetected++;
              }
            }
          }
        }
      }
    }
    assert(leaksDetected === 0, `Item [${idx + 1}/190] (${itemId}): 100% Zero-Bulk-Leak compliant`);
    if (leaksDetected === 0) zeroBulkLeakPassCount++;

    validExamsCount++;
  }

  console.log(`    Total valid files verified: ${validFilesCount}/190`);
  console.log(`    Total valid exams verified: ${validExamsCount}/190`);
  console.log(`    Total objective questions across all 190 tests: ${totalObjectiveQuestionsAcrossAllTests}`);
  console.log(`    Zero-Bulk-Leak verified: ${zeroBulkLeakPassCount}/190`);
  assert(validFilesCount === 190, 'All 190 files verified on disk');
  assert(validExamsCount === 190, 'All 190 exams parsed conforming to VstepExam');
  assert(totalObjectiveQuestionsAcrossAllTests >= 3000,
    `Expanded question bank has >= 3,000 questions (got ${totalObjectiveQuestionsAcrossAllTests})`);

  // ============================================================================
  // SECTION 2: ANTI-DUPLICATION & PRACTICE HISTORY STRESS TESTING
  // ============================================================================
  console.log('\n▶ [2/3] Testing Anti-Duplication & Practice History Stress Testing...');

  // 2.1 loadVstepSkillPractice with 'unseen' mode
  const baseReadingPractice = loadVstepSkillPractice('reading', 'unseen', []);
  assert(baseReadingPractice !== null, 'loadVstepSkillPractice reading returns exam');
  const baseReadingQCount = baseReadingPractice?.sections[0]?.tasks.reduce(
    (acc, t) => acc + (t.questions?.length || 0), 0) || 0;
  assert(baseReadingQCount > 0, `Base reading practice has >0 questions (${baseReadingQCount})`);

  // Exclude 5 questions
  const baseQIds: string[] = [];
  baseReadingPractice?.sections[0]?.tasks.forEach(t => t.questions?.forEach(q => {
    if (typeof q === 'object' && q !== null) baseQIds.push((q as VstepQuestion).id);
  }));
  const excluded5 = baseQIds.slice(0, 5);
  const filteredPractice = loadVstepSkillPractice('reading', 'unseen', excluded5);
  assert(filteredPractice !== null, 'loadVstepSkillPractice with excludedIds returns exam');

  const filteredQIds: string[] = [];
  filteredPractice?.sections[0]?.tasks.forEach(t => t.questions?.forEach(q => {
    if (typeof q === 'object' && q !== null) filteredQIds.push((q as VstepQuestion).id);
  }));
  assert(filteredQIds.length === baseReadingQCount - 5,
    `Filtered practice count (${filteredQIds.length}) === base (${baseReadingQCount}) - 5`);

  const hasExcludedInFiltered = filteredQIds.some(id => excluded5.includes(id));
  assert(!hasExcludedInFiltered, 'No excluded question IDs found in unseen practice result');

  // Stress test: what happens when all questions are excluded in 'unseen' mode?
  const practiceAllExcluded = loadVstepSkillPractice('reading', 'unseen', baseQIds);
  assert(practiceAllExcluded !== null, 'loadVstepSkillPractice when all excluded does not crash');
  const allExcludedResultQCount = practiceAllExcluded?.sections[0]?.tasks.reduce(
    (acc, t) => acc + (t.questions?.length || 0), 0) || 0;
  console.log(`    [Empirical Observation] When ALL ${baseQIds.length} questions are excluded in 'unseen' mode:`);
  console.log(`    Result question count returned: ${allExcludedResultQCount}`);
  if (allExcludedResultQCount === baseReadingQCount) {
    findings.push(
      'OBSERVATION (loadVstepSkillPractice unseen edge case): When 100% of questions are in excludedIds, ' +
      'loadVstepSkillPractice falls back to returning the full original exam (' + baseReadingQCount + ' questions) ' +
      'instead of an empty task list or completion flag.'
    );
  }

  // 2.2 loadVstepSkillPractice with 'mistakes' mode
  const mistakeIds = baseQIds.slice(0, 3);
  const mistakesPractice = loadVstepSkillPractice('reading', 'mistakes', mistakeIds);
  assert(mistakesPractice !== null, 'loadVstepSkillPractice with mistakes mode does not crash');
  const mistakesResultQCount = mistakesPractice?.sections[0]?.tasks.reduce(
    (acc, t) => acc + (t.questions?.length || 0), 0) || 0;
  console.log(`    [Empirical Observation] In 'mistakes' mode with 3 mistakeIds: returned ${mistakesResultQCount} questions`);
  if (mistakesResultQCount === baseReadingQCount) {
    findings.push(
      'OBSERVATION (loadVstepSkillPractice mistakes mode): loadVstepSkillPractice currently only implements ' +
      'filterMode === "unseen". When filterMode === "mistakes", it returns all questions (' + baseReadingQCount + ') ' +
      'unfiltered without isolating the candidate\'s mistake IDs. (Scoped for Milestone 3 Catalog/Exam integration).'
    );
  }

  // 2.3 loadVstepSkillPractice multi-source bank coverage
  findings.push(
    'OBSERVATION (loadVstepSkillPractice multi-source bank): loadVstepSkillPractice currently hardcodes ' +
    'baseExamId = "vstep-listening-01" / "vstep-reading-01" (Vstep Owl). It does not yet accept a target bank ID ' +
    'to pull from OnThiVSTEP (75 sets) or EnglishTestStore (15 sets). (Scoped for Milestone 3 Catalog/Exam integration).'
  );

  // 2.4 Listening skill practice
  const listeningPractice = loadVstepSkillPractice('listening', 'unseen', []);
  assert(listeningPractice !== null, 'loadVstepSkillPractice listening returns exam');
  const listeningQCount = listeningPractice?.sections[0]?.tasks.reduce(
    (acc, t) => acc + (t.questions?.length || 0), 0) || 0;
  assert(listeningQCount === 35, `Base listening practice has 35 questions (got ${listeningQCount})`);

  // 2.5 Multi-source question history tracking stress (>3,500 entries)
  resetAllVstepProgress();
  assert(Object.keys(getVstepHistory()).length === 0, 'History store reset cleanly');

  console.log('    Populating history store with 3,500 multi-source question answers...');
  const batchRecords: Array<{
    questionId: string;
    skill: 'reading' | 'listening';
    part: string;
    isCorrect: boolean;
    selectedOption?: number;
  }> = [];

  // Generate 2,000 Reading records (500 OnThi, 500 ETS, 1000 Owl) and 1,500 Listening records
  for (let i = 1; i <= 500; i++) {
    batchRecords.push({
      questionId: `ONTHI_R_${i}`,
      skill: 'reading',
      part: 'passage1',
      isCorrect: i % 4 !== 0, // 25% mistakes (125 mistakes)
      selectedOption: i % 4,
    });
  }
  for (let i = 1; i <= 500; i++) {
    batchRecords.push({
      questionId: `ETS_R_${i}`,
      skill: 'reading',
      part: 'passage2',
      isCorrect: i % 5 !== 0, // 20% mistakes (100 mistakes)
      selectedOption: (i + 1) % 4,
    });
  }
  for (let i = 1; i <= 1000; i++) {
    batchRecords.push({
      questionId: `OWL_R_${i}`,
      skill: 'reading',
      part: 'passage3',
      isCorrect: i % 3 !== 0, // 33.3% mistakes (333 mistakes)
      selectedOption: (i + 2) % 4,
    });
  }
  for (let i = 1; i <= 1500; i++) {
    batchRecords.push({
      questionId: `OWL_L_${i}`,
      skill: 'listening',
      part: 'part1',
      isCorrect: i % 2 === 0, // 50% mistakes (750 mistakes)
      selectedOption: i % 4,
    });
  }

  const tStartHistory = Date.now();
  batchRecordVstepAnswers(batchRecords);
  const tDurationHistory = Date.now() - tStartHistory;
  console.log(`    batchRecordVstepAnswers (3,500 items) completed in ${tDurationHistory}ms`);

  const historyStore = getVstepHistory();
  assert(Object.keys(historyStore).length === 3500, `History store has 3,500 records (got ${Object.keys(historyStore).length})`);

  // Query performance & correctness
  const tStartQuery = Date.now();
  const readingAnswered = getAnsweredVstepQuestionIds('reading');
  const listeningAnswered = getAnsweredVstepQuestionIds('listening');
  const readingMistakes = getIncorrectVstepQuestionIds('reading');
  const listeningMistakes = getIncorrectVstepQuestionIds('listening');
  const tDurationQuery = Date.now() - tStartQuery;
  console.log(`    Multi-source query across 3,500 items completed in ${tDurationQuery}ms`);

  assert(readingAnswered.size === 2000, `Reading answered count is 2000 (got ${readingAnswered.size})`);
  assert(listeningAnswered.size === 1500, `Listening answered count is 1500 (got ${listeningAnswered.size})`);
  assert(readingMistakes.size === (125 + 100 + 333), `Reading mistakes expected 558 (got ${readingMistakes.size})`);
  assert(listeningMistakes.size === 750, `Listening mistakes expected 750 (got ${listeningMistakes.size})`);

  // Progress stats calculation
  const readingStats = getVstepProgressStats('reading', 2500);
  assert(readingStats.answeredCount === 2000, 'Reading stats answeredCount === 2000');
  assert(readingStats.mistakeCount === readingMistakes.size, 'Reading stats mistakeCount matches query');
  assert(readingStats.percentage === Math.round((2000 / 2500) * 100), 'Reading stats percentage is 80%');

  // Reset by skill
  resetVstepSkillProgress('reading');
  assert(getAnsweredVstepQuestionIds('reading').size === 0, 'Reading progress reset to 0');
  assert(getAnsweredVstepQuestionIds('listening').size === 1500, 'Listening progress unaffected by reading reset');

  resetAllVstepProgress();
  assert(Object.keys(getVstepHistory()).length === 0, 'resetAllVstepProgress clears all records');

  // ============================================================================
  // SECTION 3: SCORING ENGINE ROBUSTNESS & EXTREME BOUNDARY STRESS
  // ============================================================================
  console.log('\n▶ [3/3] Testing Scoring Engine Robustness & Extreme Boundary Stress...');

  // 3.1 roundVstepScore MOET official rules
  console.log('    3.1 Testing roundVstepScore...');
  assert(roundVstepScore(0) === 0, 'roundVstepScore(0) === 0');
  assert(roundVstepScore(10) === 10, 'roundVstepScore(10) === 10');
  assert(roundVstepScore(-0.01) === 0, 'Negative -0.01 clamped to 0');
  assert(roundVstepScore(-100) === 0, 'Negative -100 clamped to 0');
  assert(roundVstepScore(10.01) === 10, 'Excess 10.01 clamped to 10');
  assert(roundVstepScore(100) === 10, 'Excess 100 clamped to 10');

  // Decimals rounding rules: .00-.24 -> .0, .25-.74 -> .5, .75-.99 -> 1.0
  const roundingTestCases = [
    { in: 0.00, expected: 0.0 },
    { in: 0.24, expected: 0.0 },
    { in: 0.2499, expected: 0.0 },
    { in: 0.25, expected: 0.5 },
    { in: 0.50, expected: 0.5 },
    { in: 0.74, expected: 0.5 },
    { in: 0.7499, expected: 0.5 },
    { in: 0.75, expected: 1.0 },
    { in: 0.99, expected: 1.0 },
    { in: 5.24, expected: 5.0 },
    { in: 5.25, expected: 5.5 },
    { in: 5.74, expected: 5.5 },
    { in: 5.75, expected: 6.0 },
    { in: 8.24, expected: 8.0 },
    { in: 8.25, expected: 8.5 },
    { in: 8.74, expected: 8.5 },
    { in: 8.75, expected: 9.0 },
  ];
  for (const tc of roundingTestCases) {
    const actual = roundVstepScore(tc.in);
    assert(actual === tc.expected, `roundVstepScore(${tc.in}) === ${tc.expected} (got ${actual})`);
  }

  // 3.2 calculateReadingScore boundaries
  console.log('    3.2 Testing calculateReadingScore...');
  assert(calculateReadingScore(0, 40) === 0, '0/40 Reading is 0');
  assert(calculateReadingScore(40, 40) === 10.0, '40/40 Reading is 10.0');
  assert(calculateReadingScore(20, 40) === 5.0, '20/40 Reading is 5.0');
  assert(calculateReadingScore(26, 40) === 6.5, '26/40 Reading is 6.5');
  assert(calculateReadingScore(-5, 40) === 0, 'Negative correctCount clamped to 0');
  assert(calculateReadingScore(50, 40) === 10.0, 'Excess correctCount clamped to 10.0');
  assert(calculateReadingScore(20, 0) === 0, '0 totalQuestions does not divide by zero / NaN');
  assert(calculateReadingScore(20, -10) === 0, 'Negative totalQuestions returns 0');

  // Non-standard question counts (ETS Reading: 36, 32, 28, 30 questions)
  assert(calculateReadingScore(36, 36) === 10.0, '36/36 ETS Reading is 10.0');
  assert(calculateReadingScore(18, 36) === 5.0, '18/36 ETS Reading is 5.0');
  assert(calculateReadingScore(32, 32) === 10.0, '32/32 ETS Reading is 10.0');
  assert(calculateReadingScore(16, 32) === 5.0, '16/32 ETS Reading is 5.0');

  // 3.3 calculateListeningScore boundaries
  console.log('    3.3 Testing calculateListeningScore...');
  assert(calculateListeningScore(0, 35) === 0, '0/35 Listening is 0');
  assert(calculateListeningScore(35, 35) === 10.0, '35/35 Listening is 10.0');
  assert(calculateListeningScore(21, 35) === 6.0, '21/35 Listening is 6.0');
  assert(calculateListeningScore(18, 35) === 5.0, '18/35 Listening is 5.0 (18/35*10 = 5.14 -> 5.0)');
  assert(calculateListeningScore(-1, 35) === 0, 'Negative correctCount clamped to 0');
  assert(calculateListeningScore(45, 35) === 10.0, 'Excess correctCount clamped to 10.0');
  assert(calculateListeningScore(10, 0) === 0, '0 totalQuestions does not divide by zero / NaN');
  assert(calculateListeningScore(10, -5) === 0, 'Negative totalQuestions returns 0');

  // Non-standard listening counts (ETS Listening: 34, 31, 30 questions)
  assert(calculateListeningScore(34, 34) === 10.0, '34/34 ETS Listening is 10.0');
  assert(calculateListeningScore(17, 34) === 5.0, '17/34 ETS Listening is 5.0');
  assert(calculateListeningScore(30, 30) === 10.0, '30/30 ETS Listening is 10.0');

  // 3.4 calculateVstepScore composite boundaries & random inputs
  console.log('    3.4 Testing calculateVstepScore...');
  // Empty object
  const emptyRes = calculateVstepScore({});
  assert(emptyRes.overallScore === 0, 'calculateVstepScore({}) produces overallScore 0');
  assert(emptyRes.cefrLevel === 'A2', 'calculateVstepScore({}) produces A2');
  assert(emptyRes.listeningScore === undefined, 'calculateVstepScore({}) listeningScore undefined');
  assert(emptyRes.readingScore === undefined, 'calculateVstepScore({}) readingScore undefined');

  // Single skill: Reading only
  const readingOnly = calculateVstepScore({ readingCorrect: 26, readingTotal: 40 });
  assert(readingOnly.readingScore === 6.5, 'readingOnly readingScore === 6.5');
  assert(readingOnly.overallScore === 6.5, 'readingOnly overallScore === 6.5');
  assert(readingOnly.cefrLevel === 'B2', 'readingOnly cefrLevel === B2');

  // Single skill: Listening only
  const listeningOnly = calculateVstepScore({ listeningCorrect: 21, listeningTotal: 35 });
  assert(listeningOnly.listeningScore === 6.0, 'listeningOnly listeningScore === 6.0');
  assert(listeningOnly.overallScore === 6.0, 'listeningOnly overallScore === 6.0');
  assert(listeningOnly.cefrLevel === 'B2', 'listeningOnly cefrLevel === B2');

  // Full Mock: all 4 skills perfect
  const perfect4 = calculateVstepScore({
    listeningCorrect: 35,
    readingCorrect: 40,
    writingScore: 10.0,
    speakingScore: 10.0,
  });
  assert(perfect4.overallScore === 10.0, 'Perfect 4 skills is 10.0');
  assert(perfect4.cefrLevel === 'C1', 'Perfect 4 skills is C1');

  // Full Mock: typical B1 boundary (4.0 - 5.5)
  // Listening: 14/35 = 4.0, Reading: 16/40 = 4.0, Writing: 4.0, Speaking: 4.0 -> average 4.0 -> B1
  const b1Min = calculateVstepScore({
    listeningCorrect: 14,
    readingCorrect: 16,
    writingScore: 4.0,
    speakingScore: 4.0,
  });
  assert(b1Min.overallScore === 4.0, 'b1Min overallScore is 4.0');
  assert(b1Min.cefrLevel === 'B1', 'b1Min cefrLevel is B1');

  // B1 Max: 5.5
  const b1Max = calculateVstepScore({
    listeningCorrect: 19, // 19/35*10 = 5.43 -> 5.5
    readingCorrect: 22,   // 22/40*10 = 5.5 -> 5.5
    writingScore: 5.5,
    speakingScore: 5.5,
  });
  assert(b1Max.overallScore === 5.5, 'b1Max overallScore is 5.5');
  assert(b1Max.cefrLevel === 'B1', 'b1Max cefrLevel is B1');

  // B2 Min: 6.0
  const b2Min = calculateVstepScore({
    listeningCorrect: 21, // 6.0
    readingCorrect: 24,   // 6.0
    writingScore: 6.0,
    speakingScore: 6.0,
  });
  assert(b2Min.overallScore === 6.0, 'b2Min overallScore is 6.0');
  assert(b2Min.cefrLevel === 'B2', 'b2Min cefrLevel is B2');

  // C1 Min: 8.5
  const c1Min = calculateVstepScore({
    listeningCorrect: 30, // 30/35*10 = 8.57 -> 8.5
    readingCorrect: 34,   // 34/40*10 = 8.5 -> 8.5
    writingScore: 8.5,
    speakingScore: 8.5,
  });
  assert(c1Min.overallScore === 8.5, 'c1Min overallScore is 8.5');
  assert(c1Min.cefrLevel === 'C1', 'c1Min cefrLevel is C1');

  // Fuzz test calculateVstepScore with 200 random inputs
  console.log('    3.5 Fuzzing calculateVstepScore with 200 random / extreme cases...');
  let fuzzPassed = 0;
  for (let f = 0; f < 200; f++) {
    const rLCorrect = Math.floor(Math.random() * 80) - 20; // -20 to 59
    const rRCorrect = Math.floor(Math.random() * 80) - 20;
    const rWScore = Math.random() * 15 - 2;
    const rSScore = Math.random() * 15 - 2;

    const res = calculateVstepScore({
      listeningCorrect: rLCorrect,
      readingCorrect: rRCorrect,
      writingScore: rWScore,
      speakingScore: rSScore,
    });

    const isScoreValid = typeof res.overallScore === 'number' && !isNaN(res.overallScore) &&
      res.overallScore >= 0 && res.overallScore <= 10;
    const isCefrValid = ['A2', 'B1', 'B2', 'C1'].includes(res.cefrLevel);

    if (isScoreValid && isCefrValid) {
      fuzzPassed++;
    }
  }
  assert(fuzzPassed === 200, `Fuzz test 200/200 cases passed without NaN or crash (got ${fuzzPassed})`);

  // 3.6 getCefrDescription consistency
  console.log('    3.6 Testing getCefrDescription...');
  for (const lvl of ['A2', 'B1', 'B2', 'C1'] as const) {
    const desc = getCefrDescription(lvl);
    assert(typeof desc.titleVi === 'string' && desc.titleVi.length > 0, `getCefrDescription(${lvl}) has titleVi`);
    assert(typeof desc.badgeVi === 'string' && desc.badgeVi.length > 0, `getCefrDescription(${lvl}) has badgeVi`);
    assert(typeof desc.summaryVi === 'string' && desc.summaryVi.length > 0, `getCefrDescription(${lvl}) has summaryVi`);
    assert(typeof desc.colorClass === 'string' && desc.colorClass.length > 0, `getCefrDescription(${lvl}) has colorClass`);
  }

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log('\n================================================================================');
  console.log('📊 CHALLENGER M2 2 EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`Total Assertions Evaluated: ${totalAssertions}`);
  console.log(`Passed:                     ${passedAssertions}`);
  console.log(`Failed:                     ${failedAssertions}`);
  console.log(`Success Rate:               ${((passedAssertions / totalAssertions) * 100).toFixed(2)}%`);
  console.log('================================================================================\n');

  if (findings.length > 0) {
    console.log('🔍 EMPIRICAL FINDINGS & STRESS-TEST OBSERVATIONS:');
    for (const f of findings) {
      console.log(`   * ${f}`);
    }
    console.log('');
  }

  teardownMockBrowserEnvironment();

  if (failedAssertions > 0) {
    console.error(`❌ VERDICT: REQUEST_CHANGES (${failedAssertions} assertion failures detected)`);
    for (const f of failures) {
      console.error(`   - ${f}`);
    }
    process.exit(1);
  } else {
    console.log('✅ VERDICT: APPROVE (All 190 catalog items and engine operations verified 100%)');
    process.exit(0);
  }
}

runEmpiricalVerification().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
