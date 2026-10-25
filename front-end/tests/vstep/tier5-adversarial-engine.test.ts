/**
 * Tier 5: Adversarial Stress Test Suite for VSTEP Standardized Exam Engine
 * Challenger: Challenger M5.1 (critic, specialist)
 * Target Modules:
 *  - src/lib/vstep-scoring.ts (MOET 10.0 scale, CEFR barem, uniform 0.5 rounding vs Banker's rounding, edge scores, partial/empty submissions)
 *  - src/lib/vstep-history.ts (anti-duplication modes, batch recording, stats aggregation, storage corruption resilience)
 *  - src/lib/vstep-test-loader.ts (dynamic loader, EXAM_ROUTE_RULES, cache immutability, path traversal resistance under edge case inputs)
 *
 * Usage:
 *   npx tsx tests/vstep/tier5-adversarial-engine.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  MockLocalStorage,
} from './test-harness';

import {
  roundVstepScore,
  calculateReadingScore,
  calculateListeningScore,
  getCefrLevel,
  getCefrDescription,
  calculateVstepScore,
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

import {
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepExamForClient,
  stripSensitiveVstepData,
  resolveExamFilePath,
  getVstepCatalog,
  getVstepCatalogIndex,
  getVstepQuestionExplanation,
  loadVstepSkillPractice,
  clearVstepExamCache,
  EXAM_ROUTE_RULES,
  SENSITIVE_VSTEP_KEYS,
} from '../../src/lib/vstep-test-loader';

import { verifyVstepSessionToken } from '../../src/lib/vstep-anti-scraping';
import { VstepExam, VstepScoreResult, VstepQuestion } from '../../src/lib/vstep-types';

export async function runTier5AdversarialEngineTests(runner: TestRunner) {
  // ============================================================================
  // SUITE 1: VSTEP SCORING ENGINE ADVERSARIAL STRESS TESTING
  // ============================================================================
  await runner.describe('Tier 5 Suite 1: MOET 10.0 Scale, Interval Rounding vs Banker\'s Rounding, CEFR Transitions', async () => {
    // 1.1: Banker's Rounding vs MOET Fixed-Interval Rounding
    await runner.it('T5.1.1: Rejects Banker\'s Rounding (Round-Half-To-Even) and enforces MOET 0.5 uniform interval', () => {
      // In Banker's Rounding (round half to even):
      // 2.5 would round to 2 (even integer), 3.5 would round to 4 (even integer).
      // 6.5 would round to 6 (even integer), 7.5 would round to 8 (even integer).
      // Under MOET Regulations (Thông tư Bộ GD&ĐT), VSTEP uses uniform 0.5 step rounding:
      // Half scores (.5) must PRESERVE their .5 decimal component and NEVER round to integer!
      expect(roundVstepScore(2.5)).toBe(2.5);
      expect(roundVstepScore(3.5)).toBe(3.5);
      expect(roundVstepScore(4.5)).toBe(4.5);
      expect(roundVstepScore(5.5)).toBe(5.5);
      expect(roundVstepScore(6.5)).toBe(6.5);
      expect(roundVstepScore(7.5)).toBe(7.5);
      expect(roundVstepScore(8.5)).toBe(8.5);
      expect(roundVstepScore(9.5)).toBe(9.5);
    });

    // 1.2: Exact Boundary Transition Points [0, 0.25) -> .0; [0.25, 0.75) -> .5; [0.75, 1.0) -> +1.0
    await runner.it('T5.1.2: Precision boundary transitions across all fractional intervals (delta = 0.0001)', () => {
      // Test lower threshold .25 transition
      expect(roundVstepScore(0.2499)).toBe(0.0);
      expect(roundVstepScore(0.25)).toBe(0.5);
      expect(roundVstepScore(0.2501)).toBe(0.5);

      expect(roundVstepScore(3.2499)).toBe(3.0);
      expect(roundVstepScore(3.25)).toBe(3.5);
      expect(roundVstepScore(3.2501)).toBe(3.5);

      // Test middle threshold .75 transition
      expect(roundVstepScore(0.7499)).toBe(0.5);
      expect(roundVstepScore(0.75)).toBe(1.0);
      expect(roundVstepScore(0.7501)).toBe(1.0);

      expect(roundVstepScore(3.7499)).toBe(3.5);
      expect(roundVstepScore(3.75)).toBe(4.0);
      expect(roundVstepScore(3.7501)).toBe(4.0);

      // Higher band transitions
      expect(roundVstepScore(5.7499)).toBe(5.5);
      expect(roundVstepScore(5.75)).toBe(6.0);

      expect(roundVstepScore(8.2499)).toBe(8.0);
      expect(roundVstepScore(8.25)).toBe(8.5);

      expect(roundVstepScore(9.7499)).toBe(9.5);
      expect(roundVstepScore(9.75)).toBe(10.0);
    });

    // 1.3: CEFR Threshold Boundary Classifications
    await runner.it('T5.1.3: CEFR Classification exact boundary thresholds (0.0, 3.5, 4.0, 5.5, 6.0, 8.0, 8.5, 10.0)', () => {
      // Sub-B1 / A2 range: < 4.0
      expect(getCefrLevel(0.0)).toBe('A2');
      expect(getCefrLevel(1.5)).toBe('A2');
      expect(getCefrLevel(3.5)).toBe('A2');
      expect(getCefrLevel(3.99)).toBe('A2');

      // B1 range: 4.0 - 5.5
      expect(getCefrLevel(4.0)).toBe('B1');
      expect(getCefrLevel(4.5)).toBe('B1');
      expect(getCefrLevel(5.0)).toBe('B1');
      expect(getCefrLevel(5.5)).toBe('B1');
      expect(getCefrLevel(5.99)).toBe('B1');

      // B2 range: 6.0 - 8.0
      expect(getCefrLevel(6.0)).toBe('B2');
      expect(getCefrLevel(6.5)).toBe('B2');
      expect(getCefrLevel(7.0)).toBe('B2');
      expect(getCefrLevel(7.5)).toBe('B2');
      expect(getCefrLevel(8.0)).toBe('B2');
      expect(getCefrLevel(8.49)).toBe('B2');

      // C1 range: 8.5 - 10.0
      expect(getCefrLevel(8.5)).toBe('C1');
      expect(getCefrLevel(9.0)).toBe('C1');
      expect(getCefrLevel(9.5)).toBe('C1');
      expect(getCefrLevel(10.0)).toBe('C1');

      // Verify Vietnamese metadata descriptors
      const a2Desc = getCefrDescription('A2');
      expect(a2Desc.titleVi).toContain('Dưới B1');
      expect(a2Desc.badgeVi).toContain('< 4.0');

      const b1Desc = getCefrDescription('B1');
      expect(b1Desc.titleVi).toContain('B1');
      expect(b1Desc.badgeVi).toContain('4.0 - 5.5');

      const b2Desc = getCefrDescription('B2');
      expect(b2Desc.titleVi).toContain('B2');
      expect(b2Desc.badgeVi).toContain('6.0 - 8.0');

      const c1Desc = getCefrDescription('C1');
      expect(c1Desc.titleVi).toContain('C1');
      expect(c1Desc.badgeVi).toContain('8.5 - 10.0');
    });

    // 1.4: Extreme Clamping & Abnormal Numerical Inputs
    await runner.it('T5.1.4: Numerical extremes clamping (negatives, overflow, zero/negative total questions)', () => {
      // Direct score rounding clamping
      expect(roundVstepScore(-0.001)).toBe(0);
      expect(roundVstepScore(-100)).toBe(0);
      expect(roundVstepScore(10.001)).toBe(10);
      expect(roundVstepScore(999)).toBe(10);

      // Listening score clamping
      expect(calculateListeningScore(-5, 35)).toBe(0);
      expect(calculateListeningScore(100, 35)).toBe(10.0);
      expect(calculateListeningScore(10, 0)).toBe(0); // Zero total avoids NaN
      expect(calculateListeningScore(10, -35)).toBe(0); // Negative total avoids NaN

      // Reading score clamping
      expect(calculateReadingScore(-10, 40)).toBe(0);
      expect(calculateReadingScore(999, 40)).toBe(10.0);
      expect(calculateReadingScore(15, 0)).toBe(0); // Zero total avoids NaN
      expect(calculateReadingScore(15, -40)).toBe(0); // Negative total avoids NaN
    });

    // 1.5: Partial, Empty & All-Correct Submissions in Composite Scoring
    await runner.it('T5.1.5: Composite scoring handles empty, partial, and all-correct submissions gracefully', () => {
      // 1. Empty submission
      const emptyResult = calculateVstepScore({});
      expect(emptyResult.overallScore).toBe(0);
      expect(emptyResult.cefrLevel).toBe('A2');
      expect(emptyResult.listeningScore).toBeUndefined();
      expect(emptyResult.readingScore).toBeUndefined();
      expect(emptyResult.writingScore).toBeUndefined();
      expect(emptyResult.speakingScore).toBeUndefined();

      // 2. Reading-only partial submission (e.g. Practice Reading Set: 20/40)
      const readingOnly = calculateVstepScore({
        readingCorrect: 20,
        readingTotal: 40,
      });
      expect(readingOnly.readingScore).toBe(5.0);
      expect(readingOnly.overallScore).toBe(5.0);
      expect(readingOnly.cefrLevel).toBe('B1');
      expect(readingOnly.listeningScore).toBeUndefined();

      // 3. Listening-only partial submission (e.g. Practice Listening Set: 35/35)
      const listeningOnly = calculateVstepScore({
        listeningCorrect: 35,
        listeningTotal: 35,
      });
      expect(listeningOnly.listeningScore).toBe(10.0);
      expect(listeningOnly.overallScore).toBe(10.0);
      expect(listeningOnly.cefrLevel).toBe('C1');

      // 4. Productive skills only (Writing + Speaking mock exam)
      // Writing: 7.5, Speaking: 8.5 -> Average = 8.0 -> B2
      const productiveOnly = calculateVstepScore({
        writingScore: 7.5,
        speakingScore: 8.5,
      });
      expect(productiveOnly.overallScore).toBe(8.0);
      expect(productiveOnly.cefrLevel).toBe('B2');

      // 5. Three skills (Listening, Reading, Writing)
      // Listening: 28/35 = 8.0, Reading: 32/40 = 8.0, Writing: 8.5
      // Average = (8.0 + 8.0 + 8.5) / 3 = 8.1667 -> rounded to 8.0 -> B2
      const threeSkills = calculateVstepScore({
        listeningCorrect: 28,
        listeningTotal: 35,
        readingCorrect: 32,
        readingTotal: 40,
        writingScore: 8.5,
      });
      expect(threeSkills.overallScore).toBe(8.0);
      expect(threeSkills.cefrLevel).toBe('B2');

      // 6. All-correct submission across all 4 skills -> 10.0 C1
      const perfectResult = calculateVstepScore({
        listeningCorrect: 35,
        listeningTotal: 35,
        readingCorrect: 40,
        readingTotal: 40,
        writingScore: 10.0,
        speakingScore: 10.0,
      });
      expect(perfectResult.listeningScore).toBe(10.0);
      expect(perfectResult.readingScore).toBe(10.0);
      expect(perfectResult.writingScore).toBe(10.0);
      expect(perfectResult.speakingScore).toBe(10.0);
      expect(perfectResult.overallScore).toBe(10.0);
      expect(perfectResult.cefrLevel).toBe('C1');

      // 7. All-wrong submission across all 4 skills -> 0.0 A2
      const zeroResult = calculateVstepScore({
        listeningCorrect: 0,
        listeningTotal: 35,
        readingCorrect: 0,
        readingTotal: 40,
        writingScore: 0.0,
        speakingScore: 0.0,
      });
      expect(zeroResult.overallScore).toBe(0.0);
      expect(zeroResult.cefrLevel).toBe('A2');
    });
  });

  // ============================================================================
  // SUITE 2: VSTEP HISTORY TRACKING & ANTI-DUPLICATION STRESS TESTING
  // ============================================================================
  await runner.describe('Tier 5 Suite 2: Anti-Duplication Modes, Batch Recording, Stats & LocalStorage Resilience', async () => {
    let mockEnv: { localStorage: MockLocalStorage };

    runner.beforeEach(() => {
      mockEnv = setupMockBrowserEnvironment();
      mockEnv.localStorage.clear();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    // 2.1: Anti-duplication modes filtering logic
    await runner.it('T5.2.1: Anti-duplication modes (unseen, mistakes, all_random) behave strictly per specification', () => {
      // Seed 10 records: 6 correct, 4 incorrect
      const seedItems = [
        { questionId: 'q1', skill: 'reading' as const, part: 'p1', isCorrect: true, selectedOption: 0 },
        { questionId: 'q2', skill: 'reading' as const, part: 'p1', isCorrect: false, selectedOption: 1 },
        { questionId: 'q3', skill: 'reading' as const, part: 'p1', isCorrect: true, selectedOption: 2 },
        { questionId: 'q4', skill: 'reading' as const, part: 'p2', isCorrect: false, selectedOption: 3 },
        { questionId: 'q5', skill: 'reading' as const, part: 'p2', isCorrect: true, selectedOption: 0 },
        { questionId: 'q6', skill: 'listening' as const, part: 'l1', isCorrect: false, selectedOption: 1 },
        { questionId: 'q7', skill: 'listening' as const, part: 'l1', isCorrect: true, selectedOption: 2 },
        { questionId: 'q8', skill: 'listening' as const, part: 'l2', isCorrect: false, selectedOption: 3 },
        { questionId: 'q9', skill: 'listening' as const, part: 'l2', isCorrect: true, selectedOption: 0 },
        { questionId: 'q10', skill: 'listening' as const, part: 'l2', isCorrect: true, selectedOption: 1 },
      ];
      batchRecordVstepAnswers(seedItems);

      // Test 1: Unseen mode filter set
      const allAnswered = getAnsweredVstepQuestionIds();
      expect(allAnswered.size).toBe(10);

      const readingAnswered = getAnsweredVstepQuestionIds('reading');
      expect(readingAnswered.size).toBe(5);
      expect(readingAnswered.has('q1')).toBe(true);
      expect(readingAnswered.has('q6')).toBe(false);

      const readingP1Answered = getAnsweredVstepQuestionIds('reading', 'p1');
      expect(readingP1Answered.size).toBe(3);
      expect(readingP1Answered.has('q1')).toBe(true);
      expect(readingP1Answered.has('q4')).toBe(false);

      // Test 2: Mistakes mode filter set
      const allMistakes = getIncorrectVstepQuestionIds();
      expect(allMistakes.size).toBe(4);
      expect(allMistakes.has('q2')).toBe(true);
      expect(allMistakes.has('q4')).toBe(true);
      expect(allMistakes.has('q6')).toBe(true);
      expect(allMistakes.has('q8')).toBe(true);
      expect(allMistakes.has('q1')).toBe(false);

      const listeningMistakes = getIncorrectVstepQuestionIds('listening');
      expect(listeningMistakes.size).toBe(2);
      expect(listeningMistakes.has('q6')).toBe(true);
      expect(listeningMistakes.has('q8')).toBe(true);
      expect(listeningMistakes.has('q2')).toBe(false);

      // Test 3: Spaced Repetition remediation: candidate re-attempts mistakes and answers correctly
      batchRecordVstepAnswers([
        { questionId: 'q2', skill: 'reading', part: 'p1', isCorrect: true, selectedOption: 0 },
        { questionId: 'q6', skill: 'listening', part: 'l1', isCorrect: true, selectedOption: 0 },
      ]);
      const updatedMistakes = getIncorrectVstepQuestionIds();
      expect(updatedMistakes.size).toBe(2); // q2 and q6 are no longer mistakes!
      expect(updatedMistakes.has('q2')).toBe(false);
      expect(updatedMistakes.has('q6')).toBe(false);
      expect(updatedMistakes.has('q4')).toBe(true);
      expect(updatedMistakes.has('q8')).toBe(true);
    });

    // 2.2: Mass Batch Recording & Attempt Counter Integrity
    await runner.it('T5.2.2: Mass batch recording of 200 items increments attempt counters accurately', () => {
      // First pass: 200 items recorded
      const firstPass = Array.from({ length: 200 }, (_, i) => ({
        questionId: `batch_q_${i}`,
        skill: (i % 2 === 0 ? 'reading' : 'listening') as any,
        part: `part_${i % 4}`,
        isCorrect: i % 3 === 0,
        selectedOption: i % 4,
      }));
      batchRecordVstepAnswers(firstPass);

      const store1 = getVstepHistory();
      expect(Object.keys(store1).length).toBe(200);
      expect(store1['batch_q_0'].attemptCount).toBe(1);
      expect(store1['batch_q_199'].attemptCount).toBe(1);
      expect(store1['batch_q_0'].lastAnsweredAt).toBeTruthy();

      // Second pass: re-attempt 50 of those items
      const secondPass = Array.from({ length: 50 }, (_, i) => ({
        questionId: `batch_q_${i}`,
        skill: (i % 2 === 0 ? 'reading' : 'listening') as any,
        part: `part_${i % 4}`,
        isCorrect: true,
        selectedOption: 0,
      }));
      batchRecordVstepAnswers(secondPass);

      const store2 = getVstepHistory();
      expect(Object.keys(store2).length).toBe(200);
      expect(store2['batch_q_0'].attemptCount).toBe(2);
      expect(store2['batch_q_49'].attemptCount).toBe(2);
      expect(store2['batch_q_50'].attemptCount).toBe(1); // untouched
      expect(store2['batch_q_0'].isCorrect).toBe(true); // updated status
    });

    // 2.3: Stats Aggregation Boundaries & Invariants
    await runner.it('T5.2.3: Stats aggregation invariants (total=0, bank overflow, correct + mistake = answered)', () => {
      // Zero bank case: totalInBank = 0 with 0 answered
      const emptyStats = getVstepProgressStats('reading', 0);
      expect(emptyStats.answeredCount).toBe(0);
      expect(emptyStats.totalCount).toBe(0);
      expect(emptyStats.percentage).toBe(0);
      expect(Number.isNaN(emptyStats.percentage)).toBe(false);

      // Populate 30 reading answers: 20 correct, 10 mistakes
      const readingItems = Array.from({ length: 30 }, (_, i) => ({
        questionId: `stat_r_${i}`,
        skill: 'reading' as const,
        part: 'p1',
        isCorrect: i < 20,
        selectedOption: 0,
      }));
      batchRecordVstepAnswers(readingItems);

      // Normal case: bank has 100 questions, answered 30
      const normalStats = getVstepProgressStats('reading', 100);
      expect(normalStats.answeredCount).toBe(30);
      expect(normalStats.totalCount).toBe(100);
      expect(normalStats.correctCount).toBe(20);
      expect(normalStats.mistakeCount).toBe(10);
      expect(normalStats.correctCount + normalStats.mistakeCount).toBe(normalStats.answeredCount);
      expect(normalStats.percentage).toBe(30);

      // Bank overflow case: bank reported 20 questions, but candidate answered 30
      const overflowStats = getVstepProgressStats('reading', 20);
      expect(overflowStats.answeredCount).toBe(30);
      expect(overflowStats.totalCount).toBe(30); // clamped to Math.max(20, 30)
      expect(overflowStats.percentage).toBe(100); // capped at 100%
      expect(overflowStats.percentage <= 100).toBe(true);
    });

    // 2.4: LocalStorage Corruption Resilience & SSR Safety
    await runner.it('T5.2.4: Resilient against corrupt JSON, invalid types, QuotaExceeded, and SSR environment', () => {
      // Case 1: Corrupted JSON string
      mockEnv.localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, '{"corrupted_data_not_json: true');
      const safeStore1 = getVstepHistory();
      expect(safeStore1).toEqual({});

      // Case 2: Non-object JSON in localStorage (e.g. string, number, array)
      mockEnv.localStorage.setItem(VSTEP_HISTORY_STORAGE_KEY, '99999');
      // Should not throw unhandled exception
      expect(() => {
        recordVstepQuestionAnswer({
          questionId: 'new_q',
          skill: 'reading',
          part: 'p1',
          isCorrect: true,
        });
      }).not.toThrow();

      // Case 3: Simulated QuotaExceededError on localStorage.setItem
      mockEnv.localStorage.setItem = () => {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      };
      expect(() => {
        batchRecordVstepAnswers([
          { questionId: 'q_fail', skill: 'reading', part: 'p1', isCorrect: true },
        ]);
      }).not.toThrow();

      // Case 4: SSR Safety — when window is undefined
      teardownMockBrowserEnvironment();
      expect(typeof window).toBe('undefined');
      expect(getVstepHistory()).toEqual({});
      expect(getAnsweredVstepQuestionIds().size).toBe(0);
      expect(() => resetAllVstepProgress()).not.toThrow();
      expect(() => resetVstepSkillProgress('reading')).not.toThrow();
    });
  });

  // ============================================================================
  // SUITE 3: VSTEP TEST LOADER, ROUTE RULES & SECURITY ADVERSARIAL STRESS
  // ============================================================================
  await runner.describe('Tier 5 Suite 3: Dynamic Loader, Route Rules, Cache Immutability & Path Traversal Resistance', async () => {
    runner.beforeEach(() => {
      clearVstepExamCache();
    });

    // 3.1: Dynamic Loading of Multi-Source Authentic Exams & Client Sanitization
    await runner.it('T5.3.1: Loads authentic exams across all sources and validates client sanitization contract', () => {
      // 1. Owl Full Mock Exam
      const owlMock = loadRawVstepExam('vstep-mock-01');
      expect(owlMock).not.toBeNull();
      expect(owlMock?.id).toBe('vstep-mock-01');
      expect(owlMock?.sections.length).toBe(4);

      // Alias check: vstep-exam-01 resolves identical file
      const owlMockAlias = loadRawVstepExam('vstep-exam-01');
      expect(owlMockAlias).not.toBeNull();
      expect(owlMockAlias?.id).toBe(owlMock?.id);

      // 2. Owl Listening Practice Exam (M1)
      const owlListening01 = loadRawVstepExam('vstep-listening-01');
      expect(owlListening01).not.toBeNull();
      const owlListening56 = loadRawVstepExam('vstep-listening-56');
      expect(owlListening56).not.toBeNull();

      // 3. OnThi Practice Reading Exam (M2)
      const onthiReading01 = loadRawVstepExam('vstep-reading-onthi-01');
      expect(onthiReading01).not.toBeNull();

      // 4. Client Loader Contract: returns safeExam + valid sessionToken
      const clientPayload = loadVstepExamForClient('vstep-mock-01', '10.0.0.42');
      expect(clientPayload).not.toBeNull();
      expect(clientPayload?.sessionToken).toBeTruthy();
      expect(verifyVstepSessionToken(clientPayload!.sessionToken, '10.0.0.42', 'vstep-mock-01')).toBe(true);

      // Verify that safe exam has NO answers or explanations
      let leakedCount = 0;
      clientPayload?.exam.sections.forEach((s) => {
        s.tasks.forEach((t) => {
          if (t.tapescript) leakedCount++;
          t.questions?.forEach((q) => {
            if (typeof q.answer === 'number') leakedCount++;
            if (q.explanationVi) leakedCount++;
          });
        });
      });
      expect(leakedCount).toBe(0);
    });

    // 3.2: Cache Immutability & Deep-Clone Memory Isolation
    await runner.it('T5.3.2: Tampering with returned exam instance does NOT contaminate memory cache', () => {
      const exam1 = loadRawVstepExam('vstep-mock-01');
      expect(exam1).not.toBeNull();
      const originalAnswer = exam1!.sections[0].tasks[0].questions![0].answer;
      expect(typeof originalAnswer).toBe('number');

      // Malicious mutation of in-memory object
      exam1!.sections[0].tasks[0].questions![0].answer = 9999;
      exam1!.title = 'HACKED TITLE';

      // Second load must retrieve fresh, pristine deep-clone from memory cache
      const exam2 = loadRawVstepExam('vstep-mock-01');
      expect(exam2).not.toBeNull();
      expect(exam2!.sections[0].tasks[0].questions![0].answer).toBe(originalAnswer);
      expect(exam2!.sections[0].tasks[0].questions![0].answer).not.toBe(9999);
      expect(exam2!.title).not.toBe('HACKED TITLE');
    });

    // 3.3: EXAM_ROUTE_RULES Strict Range Clamping
    await runner.it('T5.3.3: EXAM_ROUTE_RULES enforces strict min/max boundaries across all 10 route tables', () => {
      // 1. Owl Mock (1..23)
      expect(resolveExamFilePath('vstep-mock-00')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-0')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-01')).not.toBeNull();
      expect(resolveExamFilePath('vstep-mock-23')).not.toBeNull();
      expect(resolveExamFilePath('vstep-mock-24')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-99')).toBeNull();

      // 2. Owl Listening (1..56)
      expect(resolveExamFilePath('vstep-listening-00')).toBeNull();
      expect(resolveExamFilePath('vstep-listening-01')).not.toBeNull();
      expect(resolveExamFilePath('vstep-listening-56')).not.toBeNull();
      expect(resolveExamFilePath('vstep-listening-57')).toBeNull();

      // 3. Owl Reading (1..20)
      expect(resolveExamFilePath('vstep-reading-00')).toBeNull();
      expect(resolveExamFilePath('vstep-reading-01')).not.toBeNull();
      expect(resolveExamFilePath('vstep-reading-20')).not.toBeNull();
      expect(resolveExamFilePath('vstep-reading-21')).toBeNull();

      // 4. OnThi Reading (1..100)
      expect(resolveExamFilePath('vstep-reading-onthi-00')).toBeNull();
      expect(resolveExamFilePath('vstep-reading-onthi-01')).not.toBeNull();
      expect(resolveExamFilePath('vstep-reading-onthi-101')).toBeNull();

      // 5. EnglishTestStore Listening (1..60)
      expect(resolveExamFilePath('vstep-listening-ets-00')).toBeNull();
      expect(resolveExamFilePath('vstep-listening-ets-61')).toBeNull();

      // 6. VNU Mock (1..10)
      expect(resolveExamFilePath('vstep-mock-vnu-00')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-vnu-11')).toBeNull();
    });

    // 3.4: Adversarial Path Traversal & Injection Attack Matrix
    await runner.it('T5.3.4: Adversarial Path Traversal & Injection attacks are completely rejected', () => {
      const maliciousPayloads = [
        // Directory traversal
        '../package.json',
        '..\\package.json',
        '../../../../etc/passwd',
        '..\\..\\..\\windows\\win.ini',
        'vstep-mock-01/../../../package.json',
        'vstep-mock-01\\..\\..\\package.json',
        'tests/../tests/vstep-exam-01.json',

        // URL encoded traversal & slashes
        '%2e%2e%2fpackage.json',
        '%252e%252e%252fpackage.json',
        '..%2fpackage.json',
        'vstep%2dmock%2d01',
        'vstep%00mock',

        // Null bytes & terminator injection
        'vstep-mock-01\0',
        'vstep-mock-01\0.json',
        'vstep-mock-01%00.json',

        // Prototype pollution tokens
        '__proto__',
        'constructor',
        'prototype',

        // Shell metacharacters & command injection
        'vstep-mock-01; cat /etc/passwd',
        'vstep-mock-01 | dir',
        'vstep-mock-01 & calc.exe',
        '${process.env.NODE_ENV}',
        '$(whoami)',
        '`whoami`',
        '<script>alert(1)</script>',

        // Query string & fragment injection
        'vstep-mock-01?dump=true',
        'vstep-mock-01#token',
        'vstep-mock-01&admin=1',

        // Whitespace and control characters (internal whitespace/control characters are strictly rejected)
        '   ',
        'vstep\nmock-01',
        'vstep\rmock-01',
        'vstep\tmock-01',
        'vstep mock 01',

        // Extreme length payloads (ReDoS / Buffer Overflow attempts)
        'a'.repeat(65), // max allowed is 64
        'a'.repeat(1000),
        'vstep-mock-' + '9'.repeat(100),
        'vstep-' + 'a'.repeat(50000),
      ];

      for (const payload of maliciousPayloads) {
        const resolved = resolveExamFilePath(payload);
        expect(resolved).toBeNull();

        const raw = loadRawVstepExam(payload);
        expect(raw).toBeNull();

        const safe = loadVstepExamSafe(payload);
        expect(safe).toBeNull();
      }

      // Verify that leading/trailing whitespace is safely trimmed without injecting newlines into path
      const trimmedResult = resolveExamFilePath('  vstep-mock-01\n');
      expect(trimmedResult).not.toBeNull();
      expect(trimmedResult?.endsWith('vstep-exam-01.json')).toBe(true);
      expect(trimmedResult?.includes('\n')).toBe(false);
    });

    // 3.5: Deep Recursive Zero-Bulk-Leak Sanitizer Verification
    await runner.it('T5.3.5: stripSensitiveVstepData recursively purges all 10 sensitive keys at all depths', () => {
      // Construct a deeply nested synthetic exam with sensitive tokens hidden across 6 levels
      const syntheticAdversarialExam: any = {
        id: 'synthetic-test',
        title: 'Deep Adversarial Synthetic Exam',
        duration: 60,
        answer: 0, // level 0 leak
        correctAnswer: 1, // level 0 leak
        explanationVi: 'leak-0',
        sections: [
          {
            type: 'listening',
            label: 'Listening',
            timeLimit: 40,
            tapescript: 'section-level tapescript leak', // level 1 leak
            solution: 'section-level solution leak',
            tasks: [
              {
                id: 'task-1',
                tapescript: 'task tapescript leak', // level 2 leak
                suggestion: 'task suggestion leak',
                passage: {
                  title: 'Passage',
                  text: 'Text',
                  analysis: 'passage analysis leak', // level 3 leak
                },
                questions: [
                  {
                    id: 'q-1',
                    type: 'mcq',
                    question: 'Adversarial Q1',
                    options: ['A', 'B', 'C', 'D'],
                    answer: 2, // level 4 leak
                    correctAnswer: 2,
                    correctOptionIndex: 2,
                    explanation: 'q explanation leak',
                    explanationVi: 'q explanationVi leak',
                    deepMetadata: {
                      level5: {
                        transcript: 'deep transcript leak', // level 5 leak
                        nestedAnswer: {
                          answer: 3, // level 6 leak
                          solution: 'deep solution leak',
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const sanitized = stripSensitiveVstepData(syntheticAdversarialExam as VstepExam);

      // Recursively inspect every key in the sanitized object
      const leakedKeysFound: string[] = [];
      const scanObject = (obj: any, pathStr = '') => {
        if (!obj || typeof obj !== 'object') return;
        for (const key of Object.keys(obj)) {
          if ((SENSITIVE_VSTEP_KEYS as readonly string[]).includes(key)) {
            leakedKeysFound.push(`${pathStr}.${key}`);
          }
          if (typeof obj[key] === 'object') {
            scanObject(obj[key], `${pathStr}.${key}`);
          }
        }
      };

      scanObject(sanitized, 'root');
      expect(leakedKeysFound.length).toBe(0);
    });

    // 3.6: Exhausted Question Bank Unseen Mode Graceful Degradation
    await runner.it('T5.3.6: Practice loader handles total question bank exhaustion without crashing', () => {
      // Gather all question IDs from base exam
      const baseExam = loadRawVstepExam('vstep-reading-01');
      expect(baseExam).not.toBeNull();
      const allQIds: string[] = [];
      baseExam?.sections.forEach((s) => {
        s.tasks.forEach((t) => {
          t.questions?.forEach((q) => allQIds.push(q.id));
        });
      });
      expect(allQIds.length).toBeGreaterThan(0);

      // Pass ALL question IDs as excludedIds (100% exhaustion)
      const exhaustedPractice = loadVstepSkillPractice('reading', 'unseen', allQIds);
      expect(exhaustedPractice).not.toBeNull();
      expect(exhaustedPractice?.id).toBe('vstep-practice-reading');
      expect(exhaustedPractice?.sections.length).toBeGreaterThan(0);
    });
  });
}

// Standalone execution entrypoint
if (require.main === module) {
  const runner = new TestRunner();
  console.log('================================================================================');
  console.log('  VSTEP STANDARDIZED EXAM ENGINE — TIER 5 ADVERSARIAL STRESS SUITE');
  console.log('  Challenger: Challenger M5.1 (Scoring, History, Test Loader, Path Traversal)');
  console.log('================================================================================\n');

  runTier5AdversarialEngineTests(runner)
    .then(() => {
      const stats = runner.getStats();
      console.log('\n================================================================================');
      console.log(`🏁 TIER 5 ADVERSARIAL ENGINE SUITE SUMMARY: ${stats.passed}/${stats.total} PASSED (${stats.failed} failed)`);
      console.log('================================================================================\n');
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error executing Tier 5 Adversarial tests:', err);
      process.exit(1);
    });
}
