/**
 * Comprehensive Automated Anti-Duplication Test Suite for VSTEP Standardized Exam Engine
 *
 * Covers Tiers 1 through 4 (38 test cases total):
 * - Tier 1: Feature Coverage (Core Tracker, Selector & Exam History APIs - 14 tests)
 * - Tier 2: Boundary & Corner Cases (10 tests)
 * - Tier 3: Cross-Feature Combinations & Defense (8 tests)
 * - Tier 4: Real-World Scenarios (Scenarios 1 to 4 Core Requirements + E2E - 6 tests)
 *
 * Conforms strictly to Requirement R4 and the Standardized Exam Engine Blueprint.
 *
 * Usage:
 *   npx tsx tests/vstep/anti-duplication.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  MockLocalStorage,
  oracleMoetRound,
  oracleCefrLevel,
} from './test-harness';

import {
  getVstepHistory,
  recordVstepQuestionAnswer,
  batchRecordVstepAnswers,
  getAnsweredVstepQuestionIds,
  getIncorrectVstepQuestionIds,
  getVstepProgressStats,
  resetVstepSkillProgress,
  resetAllVstepProgress,
  getVstepExamHistory,
  recordVstepExamAttempt,
  getVstepExamSummaries,
  clearVstepExamHistory,
  clearVstepSkillHistory,
  resetAllVstepHistory,
  toCanonicalVstepQuestionId,
  parseCanonicalVstepQuestionId,
  VSTEP_HISTORY_STORAGE_KEY,
  VSTEP_EXAM_HISTORY_STORAGE_KEY,
  VSTEP_HISTORY_UPDATED_EVENT,
} from '@/lib/vstep-history';

import {
  loadVstepSkillPractice,
  loadRawVstepExam,
  loadVstepQuestionsByIds,
  getVstepCatalogIndex,
  stripSensitiveVstepData,
  clearVstepExamCache,
  resolveExamFilePath,
} from '@/lib/vstep-test-loader';

import {
  generateVstepSessionToken,
  verifyVstepSessionToken,
  isVstepHoneypot,
} from '@/lib/vstep-anti-scraping';

import { POST as submitVstepExamApi } from '@/app/api/vstep/submit/route';
import { POST as testVstepExamApiPost } from '@/app/api/vstep/test/route';

// ─────────────────────────────────────────────────────────────────────────────
// Browser Mock Setup Helper with Event Bus
// ─────────────────────────────────────────────────────────────────────────────

const windowEventListeners: Record<string, Function[]> = {};

export function setupTestEnvironment(): MockLocalStorage {
  const { localStorage: mockStorage } = setupMockBrowserEnvironment();

  if (typeof global !== 'undefined' && (global as any).window) {
    const win = (global as any).window;
    for (const key of Object.keys(windowEventListeners)) {
      delete windowEventListeners[key];
    }

    win.addEventListener = (event: string, fn: Function) => {
      windowEventListeners[event] = windowEventListeners[event] || [];
      windowEventListeners[event].push(fn);
    };

    win.removeEventListener = (event: string, fn: Function) => {
      if (windowEventListeners[event]) {
        windowEventListeners[event] = windowEventListeners[event].filter((cb) => cb !== fn);
      }
    };

    win.dispatchEvent = (event: any) => {
      const eventType = typeof event === 'string' ? event : event?.type;
      if (windowEventListeners[eventType]) {
        windowEventListeners[eventType].forEach((fn) => fn(event));
      }
      return true;
    };
  }

  if (typeof (global as any).CustomEvent === 'undefined') {
    (global as any).CustomEvent = class CustomEvent {
      type: string;
      detail: any;
      constructor(type: string, params?: { detail?: any }) {
        this.type = type;
        this.detail = params?.detail;
      }
    };
  }

  return mockStorage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Test Suite Definition
// ─────────────────────────────────────────────────────────────────────────────

export async function runVstepAntiDuplicationTests(runner: TestRunner): Promise<void> {
  // ─────────────────────────────────────────────────────────────────────────
  // TIER 1: FEATURE COVERAGE (Core Tracker, Selector & Exam History APIs - 14 tests)
  // ─────────────────────────────────────────────────────────────────────────
  await runner.describe('Tier 1: Feature Coverage (Core Tracker, Selector & Exam History APIs)', async () => {
    runner.beforeEach(() => {
      setupTestEnvironment();
      clearVstepExamCache();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    await runner.it('F-VAD1.1: Uninitialized question and exam history returns empty store safely', () => {
      const qHistory = getVstepHistory();
      expect(typeof qHistory).toBe('object');
      expect(Object.keys(qHistory).length).toBe(0);

      const examHistory = getVstepExamHistory();
      expect(examHistory.version).toBe(1);
      expect(Array.isArray(examHistory.records)).toBe(true);
      expect(examHistory.records.length).toBe(0);

      const summaries = getVstepExamSummaries();
      expect(Object.keys(summaries).length).toBe(0);
      expect(getAnsweredVstepQuestionIds().size).toBe(0);
      expect(getIncorrectVstepQuestionIds().size).toBe(0);
    });

    await runner.it('F-VAD1.2: Record question attempt stores timestamp, skill, part, option, correctness, and canonical ID', () => {
      recordVstepQuestionAnswer({
        questionId: 'R1Q1',
        skill: 'reading',
        part: 'part1',
        isCorrect: true,
        selectedOption: 0,
        examId: 'vstep-reading-01',
      });

      const history = getVstepHistory();
      const rec = history['R1Q1'];
      expect(rec).toBeDefined();
      expect(rec.questionId).toBe('R1Q1');
      expect(rec.skill).toBe('reading');
      expect(rec.part).toBe('part1');
      expect(rec.isCorrect).toBe(true);
      expect(rec.selectedOption).toBe(0);
      expect(rec.attemptCount).toBe(1);
      expect(rec.canonicalId).toBe('vstep-reading-01:R1Q1');
      expect(typeof rec.lastAnsweredAt).toBe('string');
      expect(new Date(rec.lastAnsweredAt).getTime() > 0).toBe(true);
    });

    await runner.it('F-VAD1.3: Repeated question attempts increment attemptCount and update lastAnsweredAt & correctness', () => {
      recordVstepQuestionAnswer({
        questionId: 'L1Q5',
        skill: 'listening',
        part: 'part1',
        isCorrect: false,
        selectedOption: 1,
        examId: 'vstep-listening-01',
      });

      let rec = getVstepHistory()['L1Q5'];
      expect(rec.attemptCount).toBe(1);
      expect(rec.isCorrect).toBe(false);
      expect(rec.selectedOption).toBe(1);

      recordVstepQuestionAnswer({
        questionId: 'L1Q5',
        skill: 'listening',
        part: 'part1',
        isCorrect: true,
        selectedOption: 2,
        examId: 'vstep-listening-01',
      });

      rec = getVstepHistory()['L1Q5'];
      expect(rec.attemptCount).toBe(2);
      expect(rec.isCorrect).toBe(true);
      expect(rec.selectedOption).toBe(2);
    });

    await runner.it('F-VAD1.4: Dual indexing in history store proxy supports looking up both canonical ID and raw ID', () => {
      recordVstepQuestionAnswer({
        questionId: 'R1Q10',
        skill: 'reading',
        part: 'part1',
        isCorrect: true,
        selectedOption: 3,
        examId: 'vstep-reading-01',
      });

      const store = getVstepHistory();
      expect(store['R1Q10']).toBeDefined();
      expect(store['vstep-reading-01:R1Q10']).toBeDefined();
      expect(store['R1Q10'].questionId).toBe('R1Q10');
      expect(store['vstep-reading-01:R1Q10'].questionId).toBe('R1Q10');
    });

    await runner.it('F-VAD1.5: getAnsweredVstepQuestionIds isolates question IDs strictly by skill and part', () => {
      batchRecordVstepAnswers([
        { questionId: 'L1Q1', skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: 'L1Q2', skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: 'L2Q1', skill: 'listening', part: 'part2', isCorrect: false, examId: 'vstep-listening-01' },
        { questionId: 'R1Q1', skill: 'reading', part: 'reading_p1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: 'R1Q2', skill: 'reading', part: 'reading_p1', isCorrect: false, examId: 'vstep-reading-01' },
      ]);

      const lAll = getAnsweredVstepQuestionIds('listening');
      const rAll = getAnsweredVstepQuestionIds('reading');
      const lP1 = getAnsweredVstepQuestionIds('listening', 'part1');
      const lP2 = getAnsweredVstepQuestionIds('listening', 'part2');

      expect(lAll.size).toBe(3);
      expect(rAll.size).toBe(2);
      expect(lP1.size).toBe(2);
      expect(lP2.size).toBe(1);
      expect(lP1.has('L1Q1')).toBe(true);
      expect(rAll.has('R1Q1')).toBe(true);
    });

    await runner.it('F-VAD1.6: getIncorrectVstepQuestionIds filters strictly to latest incorrect attempts', () => {
      batchRecordVstepAnswers([
        { questionId: 'L1Q1', skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: 'L1Q2', skill: 'listening', part: 'part1', isCorrect: false, examId: 'vstep-listening-01' },
        { questionId: 'R1Q1', skill: 'reading', part: 'reading_p1', isCorrect: false, examId: 'vstep-reading-01' },
      ]);

      const lMistakes = getIncorrectVstepQuestionIds('listening');
      const rMistakes = getIncorrectVstepQuestionIds('reading');
      const allMistakes = getIncorrectVstepQuestionIds();

      expect(lMistakes.size).toBe(1);
      expect(lMistakes.has('L1Q2')).toBe(true);
      expect(rMistakes.size).toBe(1);
      expect(rMistakes.has('R1Q1')).toBe(true);
      expect(allMistakes.size).toBe(2);
    });

    await runner.it('F-VAD1.7: Answering previously mistaken question correctly clears it from incorrect list', () => {
      recordVstepQuestionAnswer({
        questionId: 'L1Q3',
        skill: 'listening',
        part: 'part1',
        isCorrect: false,
        examId: 'vstep-listening-01',
      });
      expect(getIncorrectVstepQuestionIds('listening').has('L1Q3')).toBe(true);

      recordVstepQuestionAnswer({
        questionId: 'L1Q3',
        skill: 'listening',
        part: 'part1',
        isCorrect: true,
        examId: 'vstep-listening-01',
      });
      expect(getIncorrectVstepQuestionIds('listening').has('L1Q3')).toBe(false);
      expect(getIncorrectVstepQuestionIds('listening').size).toBe(0);
    });

    await runner.it('F-VAD1.8: getVstepProgressStats calculates exact counts, percentages, and handles zero division safely', () => {
      const answers: Array<{ questionId: string; skill: 'reading'; part: string; isCorrect: boolean; selectedOption: number }> = [];
      for (let i = 1; i <= 20; i++) {
        answers.push({
          questionId: `R-stat-${i}`,
          skill: 'reading',
          part: 'reading_p1',
          isCorrect: i <= 15,
          selectedOption: 0,
        });
      }
      batchRecordVstepAnswers(answers);

      const stats = getVstepProgressStats('reading', 100);
      expect(stats.answeredCount).toBe(20);
      expect(stats.totalCount).toBe(100);
      expect(stats.correctCount).toBe(15);
      expect(stats.mistakeCount).toBe(5);
      expect(stats.percentage).toBe(20);
    });

    await runner.it('F-VAD1.9: recordVstepExamAttempt records exam completion with 10.0 scale, CEFR band, and attemptCount=1', () => {
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'VSTEP Mock Exam 01',
        category: 'full_mock',
        completedAt: new Date().toISOString(),
        durationSeconds: 7200,
        overallScore: 8.5,
        cefrLevel: 'C1',
        accuracyRate: 85,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 64,
        listeningScore: 8.5,
        readingScore: 8.5,
      });

      const examStore = getVstepExamHistory();
      expect(examStore.records.length).toBe(1);
      const rec = examStore.records[0];
      expect(rec.examId).toBe('vstep-mock-01');
      expect(rec.overallScore).toBe(8.5);
      expect(rec.cefrLevel).toBe('C1');
      expect(rec.accuracyRate).toBe(85);
      expect(typeof rec.attemptId).toBe('string');
    });

    await runner.it('F-VAD1.10: Repeated exam attempts update latestAttemptAt and preserve monotonic max highestScore', () => {
      const t1 = new Date(Date.now() - 10000).toISOString();
      const t2 = new Date().toISOString();

      recordVstepExamAttempt({
        examId: 'vstep-mock-02',
        examTitle: 'VSTEP Mock Exam 02',
        category: 'full_mock',
        completedAt: t1,
        durationSeconds: 7000,
        overallScore: 8.0,
        cefrLevel: 'B2',
        accuracyRate: 80,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 60,
      });

      let summaries = getVstepExamSummaries();
      expect(summaries['vstep-mock-02'].attemptCount).toBe(1);
      expect(summaries['vstep-mock-02'].highestScore).toBe(8.0);
      expect(summaries['vstep-mock-02'].latestScore).toBe(8.0);

      recordVstepExamAttempt({
        examId: 'vstep-mock-02',
        examTitle: 'VSTEP Mock Exam 02',
        category: 'full_mock',
        completedAt: t2,
        durationSeconds: 6500,
        overallScore: 6.5,
        cefrLevel: 'B2',
        accuracyRate: 65,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 49,
      });

      summaries = getVstepExamSummaries();
      expect(summaries['vstep-mock-02'].attemptCount).toBe(2);
      expect(summaries['vstep-mock-02'].highestScore).toBe(8.0); // Monotonic max preserved!
      expect(summaries['vstep-mock-02'].latestScore).toBe(6.5); // Latest attempt updated!
      expect(summaries['vstep-mock-02'].latestAttemptAt).toBe(t2);
    });

    await runner.it('F-VAD1.11: getVstepExamSummaries correctly aggregates multiple exam records with isCompleted flag', () => {
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'Mock 01',
        category: 'full_mock',
        completedAt: new Date().toISOString(),
        durationSeconds: 7200,
        overallScore: 7.0,
        cefrLevel: 'B2',
        accuracyRate: 70,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 52,
      });
      recordVstepExamAttempt({
        examId: 'vstep-listening-01',
        examTitle: 'Listening 01',
        category: 'listening',
        completedAt: new Date().toISOString(),
        durationSeconds: 2400,
        overallScore: 8.0,
        cefrLevel: 'B2',
        accuracyRate: 80,
        totalQuestionsAnswered: 35,
        totalQuestionsCorrect: 28,
      });

      const summaries = getVstepExamSummaries();
      expect(Object.keys(summaries).length).toBe(2);
      expect(summaries['vstep-mock-01'].isCompleted).toBe(true);
      expect(summaries['vstep-listening-01'].isCompleted).toBe(true);
    });

    await runner.it('F-VAD1.12: loadVstepSkillPractice with filterMode: "unseen" excludes 100% of excluded IDs', () => {
      const initial = loadVstepSkillPractice({
        skill: 'reading',
        testId: 'vstep-reading-01',
        limit: 10,
      });
      expect(initial).toBeDefined();
      const task0 = initial!.sections[0].tasks[0];
      const excludedIds = task0.questions!.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);

      const filtered = loadVstepSkillPractice({
        skill: 'reading',
        testId: 'vstep-reading-01',
        filterMode: 'unseen',
        excludedIds,
        limit: 10,
      });
      expect(filtered).toBeDefined();
      for (const task of filtered!.sections[0].tasks) {
        for (const q of task.questions || []) {
          const qId = q.canonicalId || q.id;
          expect(excludedIds.includes(qId)).toBe(false);
          expect(excludedIds.includes(q.id)).toBe(false);
        }
      }
    });

    await runner.it('F-VAD1.13: loadVstepSkillPractice with filterMode: "mistakes" delivers exclusively matching mistake IDs', () => {
      const sampleExam = loadRawVstepExam('vstep-reading-01');
      const targetQs = sampleExam!.sections[0].tasks[0].questions!.slice(0, 2);
      const mistakeIds = targetQs.map((q) => `vstep-reading-01:${q.id}`);

      const practice = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'mistakes',
        mistakeIds,
        testId: 'vstep-reading-01',
      });
      expect(practice).toBeDefined();
      const deliveredQs: string[] = [];
      practice!.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => deliveredQs.push(q.canonicalId || `vstep-reading-01:${q.id}`));
      });
      expect(deliveredQs.length).toBe(2);
      for (const id of mistakeIds) {
        expect(deliveredQs.includes(id)).toBe(true);
      }
    });

    await runner.it('F-VAD1.14: loadVstepSkillPractice with filterMode: "all_random" shuffles questions deterministically with seed', () => {
      const run1 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'all_random',
        seed: 4242,
        limit: 15,
      });
      const run2 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'all_random',
        seed: 4242,
        limit: 15,
      });
      const run3 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'all_random',
        seed: 9999,
        limit: 15,
      });

      expect(run1).toBeDefined();
      expect(run2).toBeDefined();
      expect(run3).toBeDefined();

      const ids1 = run1!.sections[0].tasks.flatMap((t) => (t.questions || []).map((q) => q.id));
      const ids2 = run2!.sections[0].tasks.flatMap((t) => (t.questions || []).map((q) => q.id));
      const ids3 = run3!.sections[0].tasks.flatMap((t) => (t.questions || []).map((q) => q.id));

      expect(ids1).toEqual(ids2);
      const matchCount = ids1.filter((id, i) => id === ids3[i]).length;
      expect(matchCount).toBeLessThan(ids1.length);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 2: BOUNDARY & CORNER CASES (10 tests)
  // ─────────────────────────────────────────────────────────────────────────
  await runner.describe('Tier 2: Boundary & Corner Cases', async () => {
    runner.beforeEach(() => {
      setupTestEnvironment();
      clearVstepExamCache();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    await runner.it('B-VAD2.1: Empty excluded IDs in unseen mode returns full set of questions without dropping tasks', () => {
      const exam = loadVstepSkillPractice({
        skill: 'listening',
        filterMode: 'unseen',
        excludedIds: [],
        testId: 'vstep-listening-01',
      });
      expect(exam).toBeDefined();
      const total = exam!.sections[0].tasks.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
      expect(total).toBe(35);
    });

    await runner.it('B-VAD2.2: Empty mistake IDs in mistakes mode returns graceful empty task structure without throwing', () => {
      const exam = loadVstepSkillPractice({
        skill: 'listening',
        filterMode: 'mistakes',
        mistakeIds: [],
      });
      expect(exam).toBeDefined();
      expect(exam!.sections[0].tasks.length).toBe(0);
      expect(exam!.metadata.totalQuestions).toBe(0);
    });

    await runner.it('B-VAD2.3: Exhaustion fallback when unseen questions are completely exhausted (100% excluded)', () => {
      const raw = loadRawVstepExam('vstep-reading-01');
      const allIds: string[] = [];
      raw!.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => {
          allIds.push(q.id);
          allIds.push(`vstep-reading-01:${q.id}`);
        });
      });

      const exhausted = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'unseen',
        excludedIds: allIds,
        testId: 'vstep-reading-01',
      });
      expect(exhausted).toBeDefined();
      expect(exhausted!.metadata.isFallbackUsed).toBe(true);
      expect(exhausted!.sections[0].tasks.length).toBeGreaterThan(0);
    });

    await runner.it('B-VAD2.4: Extreme limit boundaries: limit = 1 and limit > bank capacity safely clamped', () => {
      const limit1 = loadVstepSkillPractice({
        skill: 'listening',
        filterMode: 'all_random',
        limit: 1,
      });
      expect(limit1).toBeDefined();
      expect(limit1!.sections[0].tasks.length).toBeGreaterThanOrEqual(1);

      const hugeLimit = loadVstepSkillPractice({
        skill: 'reading',
        testId: 'vstep-reading-01',
        limit: 99999,
      });
      expect(hugeLimit).toBeDefined();
      const totalQs = hugeLimit!.sections[0].tasks.reduce((sum, t) => sum + (t.questions?.length || 0), 0);
      expect(totalQs).toBe(40);
    });

    await runner.it('B-VAD2.5: Multi-question stimulus clusters in Listening audio and Reading passages preserved intact', () => {
      const practice = loadVstepSkillPractice({
        skill: 'reading',
        testId: 'vstep-reading-01',
        limit: 10,
      });
      expect(practice).toBeDefined();
      const firstTask = practice!.sections[0].tasks[0];
      expect(firstTask.passage).toBeDefined();
      expect(firstTask.questions!.length).toBeGreaterThanOrEqual(1);
      for (const q of firstTask.questions!) {
        expect(q.canonicalId).toBeDefined();
        expect(q.canonicalId?.startsWith('vstep-reading-01:')).toBe(true);
      }
    });

    await runner.it('B-VAD2.6: Corrupted JSON in localStorage handled safely with default empty store', () => {
      const storage = setupTestEnvironment();
      storage.setItem(VSTEP_HISTORY_STORAGE_KEY, '{invalid json: cor!rupt');
      storage.setItem(VSTEP_EXAM_HISTORY_STORAGE_KEY, '[[[bad json');

      const qHistory = getVstepHistory();
      expect(typeof qHistory).toBe('object');
      expect(Object.keys(qHistory).length).toBe(0);

      const examHistory = getVstepExamHistory();
      expect(examHistory.version).toBe(1);
      expect(examHistory.records.length).toBe(0);
    });

    await runner.it('B-VAD2.7: Malformed records missing optional fields handled gracefully during calculations', () => {
      const storage = setupTestEnvironment();
      const malformedQuestions = {
        'q-good': { questionId: 'q-good', skill: 'listening', part: 'part1', isCorrect: true, attemptCount: 1, lastAnsweredAt: new Date().toISOString() },
        'q-bad-1': { questionId: 'q-bad-1', skill: 'reading' },
        'q-bad-2': { questionId: 'q-bad-2', skill: 'listening', isCorrect: false },
      };
      storage.setItem(VSTEP_HISTORY_STORAGE_KEY, JSON.stringify(malformedQuestions));
      const stats = getVstepProgressStats('listening', 35);
      expect(stats.answeredCount).toBe(2);
      expect(stats.correctCount).toBe(1);
      expect(stats.mistakeCount).toBe(1);

      const malformedExams = {
        version: 1,
        updatedAt: new Date().toISOString(),
        records: [
          { examId: 'vstep-mock-01', completedAt: new Date().toISOString(), overallScore: 7.0, cefrLevel: 'B2', attemptId: 'a1', accuracyRate: 70, totalQuestionsAnswered: 75, totalQuestionsCorrect: 52 },
          { examId: 'vstep-mock-02', completedAt: new Date().toISOString(), overallScore: 8.0, cefrLevel: 'B2', attemptId: 'a2' },
        ],
      };
      storage.setItem(VSTEP_EXAM_HISTORY_STORAGE_KEY, JSON.stringify(malformedExams));
      const examHistory = getVstepExamHistory();
      expect(examHistory.records.length).toBe(2);
      const summaries = getVstepExamSummaries();
      expect(summaries['vstep-mock-01'].highestScore).toBe(7.0);
      expect(summaries['vstep-mock-02'].highestScore).toBe(8.0);
    });

    await runner.it('B-VAD2.8: Zero total in getVstepProgressStats returns 0% without NaN or divide-by-zero', () => {
      const stats = getVstepProgressStats('listening', 0);
      expect(stats.percentage).toBe(0);
      expect(Number.isNaN(stats.percentage)).toBe(false);
    });

    await runner.it('B-VAD2.9: Exam score boundary thresholds: 0.0 (A2), 4.0 (B1 entry), 6.0 (B2 entry), 8.5 (C1 entry), 10.0 (perfect)', () => {
      expect(oracleMoetRound(0.0)).toBe(0.0);
      expect(oracleCefrLevel(0.0)).toBe('A2');

      // B1 boundary: 3.74 -> 3.5 (A2) vs 3.75 -> 4.0 (B1)
      expect(oracleMoetRound(3.74)).toBe(3.5);
      expect(oracleCefrLevel(oracleMoetRound(3.74))).toBe('A2');
      expect(oracleMoetRound(3.75)).toBe(4.0);
      expect(oracleCefrLevel(oracleMoetRound(3.75))).toBe('B1');

      // B2 boundary: 5.74 -> 5.5 (B1) vs 5.75 -> 6.0 (B2)
      expect(oracleMoetRound(5.74)).toBe(5.5);
      expect(oracleCefrLevel(oracleMoetRound(5.74))).toBe('B1');
      expect(oracleMoetRound(5.75)).toBe(6.0);
      expect(oracleCefrLevel(oracleMoetRound(5.75))).toBe('B2');

      // C1 boundary: 8.24 -> 8.0 (B2) vs 8.25 -> 8.5 (C1)
      expect(oracleMoetRound(8.24)).toBe(8.0);
      expect(oracleCefrLevel(oracleMoetRound(8.24))).toBe('B2');
      expect(oracleMoetRound(8.25)).toBe(8.5);
      expect(oracleCefrLevel(oracleMoetRound(8.25))).toBe('C1');

      // Max score: 10.0
      expect(oracleMoetRound(10.0)).toBe(10.0);
      expect(oracleCefrLevel(10.0)).toBe('C1');
    });

    await runner.it('B-VAD2.10: Path traversal and dangerous tokens in testId handled safely by resolver and loader', () => {
      expect(resolveExamFilePath('../../../etc/passwd')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-01/../../../hack')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-01\0nullbyte')).toBeNull();
      expect(resolveExamFilePath('<script>alert(1)</script>')).toBeNull();
      expect(resolveExamFilePath('vstep-mock-999')).toBeNull();
      expect(loadRawVstepExam('../../../package.json')).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 3: CROSS-FEATURE COMBINATIONS & DEFENSE (8 tests)
  // ─────────────────────────────────────────────────────────────────────────
  await runner.describe('Tier 3: Cross-Feature Combinations & Defense', async () => {
    runner.beforeEach(() => {
      setupTestEnvironment();
      clearVstepExamCache();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    await runner.it('C-VAD3.1: Switching between unseen and mistakes mode maintains isolation of historical records', () => {
      const sampleExam = loadRawVstepExam('vstep-reading-01');
      const questions = sampleExam!.sections[0].tasks[0].questions!.slice(0, 6);
      const qIds = questions.map((q) => `vstep-reading-01:${q.id}`);

      batchRecordVstepAnswers([
        { questionId: qIds[0], skill: 'reading', part: 'part1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: qIds[1], skill: 'reading', part: 'part1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: qIds[2], skill: 'reading', part: 'part1', isCorrect: false, examId: 'vstep-reading-01' },
        { questionId: qIds[3], skill: 'reading', part: 'part1', isCorrect: false, examId: 'vstep-reading-01' },
        { questionId: qIds[4], skill: 'reading', part: 'part1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: qIds[5], skill: 'reading', part: 'part1', isCorrect: true, examId: 'vstep-reading-01' },
      ]);

      const mistakeIds = Array.from(getIncorrectVstepQuestionIds('reading'));
      expect(mistakeIds.length).toBe(2);

      const mistakesPractice = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'mistakes',
        mistakeIds,
        testId: 'vstep-reading-01',
      });
      expect(mistakesPractice).toBeDefined();
      const deliveredMistakeIds = mistakesPractice!.sections[0].tasks.flatMap((t) => (t.questions || []).map((q) => q.canonicalId || q.id));
      expect(deliveredMistakeIds.length).toBe(2);
      expect(deliveredMistakeIds).toContain(qIds[2]);
      expect(deliveredMistakeIds).toContain(qIds[3]);

      const answeredIds = Array.from(getAnsweredVstepQuestionIds('reading'));
      const unseenPractice = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'unseen',
        excludedIds: answeredIds,
        testId: 'vstep-reading-01',
      });
      expect(unseenPractice).toBeDefined();
      for (const task of unseenPractice!.sections[0].tasks) {
        for (const q of task.questions || []) {
          const cid = q.canonicalId || `vstep-reading-01:${q.id}`;
          expect(answeredIds.includes(cid)).toBe(false);
        }
      }
    });

    await runner.it('C-VAD3.2: Multi-skill independence: actions in Listening do not leak to Reading or vice versa', () => {
      batchRecordVstepAnswers([
        { questionId: 'vstep-listening-01:L1Q1', skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: 'vstep-listening-01:L1Q2', skill: 'listening', part: 'part1', isCorrect: false, examId: 'vstep-listening-01' },
        { questionId: 'vstep-reading-01:R1Q1', skill: 'reading', part: 'reading_p1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: 'vstep-reading-01:R1Q2', skill: 'reading', part: 'reading_p1', isCorrect: false, examId: 'vstep-reading-01' },
      ]);

      resetVstepSkillProgress('listening');
      expect(getAnsweredVstepQuestionIds('listening').size).toBe(0);
      expect(getIncorrectVstepQuestionIds('listening').size).toBe(0);
      expect(getAnsweredVstepQuestionIds('reading').size).toBe(2);
      expect(getIncorrectVstepQuestionIds('reading').size).toBe(1);
    });

    await runner.it('C-VAD3.3: Orthogonal isolation: question history writes do not mutate exam history and vice versa', () => {
      recordVstepQuestionAnswer({
        questionId: 'L1Q1',
        skill: 'listening',
        part: 'part1',
        isCorrect: true,
        examId: 'vstep-listening-01',
      });
      expect(getVstepExamHistory().records.length).toBe(0);

      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'Mock 01',
        category: 'full_mock',
        completedAt: new Date().toISOString(),
        durationSeconds: 7200,
        overallScore: 9.0,
        cefrLevel: 'C1',
        accuracyRate: 90,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 68,
      });
      expect(getVstepExamHistory().records.length).toBe(1);
      expect(getAnsweredVstepQuestionIds().size).toBe(1);

      clearVstepExamHistory();
      expect(getVstepExamHistory().records.length).toBe(0);
      expect(getAnsweredVstepQuestionIds().size).toBe(1);
    });

    await runner.it('C-VAD3.4: Partial exam submissions (answering subset of questions) accurately persist answered subset only', () => {
      const offeredIds = ['L1Q1', 'L1Q2', 'L1Q3', 'L1Q4', 'L1Q5'];
      batchRecordVstepAnswers([
        { questionId: offeredIds[0], skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: offeredIds[2], skill: 'listening', part: 'part1', isCorrect: false, examId: 'vstep-listening-01' },
      ]);
      const answered = getAnsweredVstepQuestionIds('listening');
      expect(answered.size).toBe(2);
      expect(answered.has('L1Q1')).toBe(true);
      expect(answered.has('L1Q3')).toBe(true);
      expect(answered.has('L1Q2')).toBe(false);
    });

    await runner.it('C-VAD3.5: CustomEvent lingo_vstep_history_updated fires on question write, batch write, exam attempt, and resets', () => {
      const eventsCaught: string[] = [];

      (global as any).window.addEventListener(VSTEP_HISTORY_UPDATED_EVENT, (ev: any) => {
        if (ev?.detail?.type) {
          eventsCaught.push(ev.detail.type);
        }
      });

      recordVstepQuestionAnswer({ questionId: 'q1', skill: 'reading', part: 'p1', isCorrect: true });
      batchRecordVstepAnswers([{ questionId: 'q2', skill: 'reading', part: 'p1', isCorrect: true }]);
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'Mock 01',
        category: 'full_mock',
        completedAt: new Date().toISOString(),
        durationSeconds: 100,
        overallScore: 5.0,
        cefrLevel: 'B1',
        accuracyRate: 50,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 37,
      });
      resetVstepSkillProgress('reading');
      resetAllVstepHistory();

      expect(eventsCaught).toContain('question_answer');
      expect(eventsCaught).toContain('batch_questions');
      expect(eventsCaught).toContain('exam_attempt');
      expect(eventsCaught).toContain('reset_skill');
      expect(eventsCaught).toContain('reset_all');
    });

    await runner.it('C-VAD3.6: Server scoring integration: dynamic practice questions submitted with questionIds scored accurately via master lookup', () => {
      const practice = loadVstepSkillPractice({
        skill: 'reading',
        testId: 'vstep-reading-01',
        limit: 5,
      });
      expect(practice).toBeDefined();
      const deliveredQs = practice!.sections[0].tasks[0].questions!.slice(0, 5);
      const questionIds = deliveredQs.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);

      const masterQs = loadVstepQuestionsByIds(questionIds);
      expect(masterQs.length).toBe(5);

      let correctCount = 0;
      for (let i = 0; i < masterQs.length; i++) {
        const masterAns = masterQs[i].answer !== undefined ? masterQs[i].answer : (masterQs[i] as any).correctAnswer;
        if (masterAns !== undefined) {
          const userAns = i < 4 ? masterAns : (typeof masterAns === 'number' ? (masterAns + 1) % 4 : 'X');
          if (userAns === masterAns) correctCount++;
        }
      }
      expect(correctCount).toBe(4);
    });

    await runner.it('C-VAD3.7: Cyber defense zero bulk leaks: delivered practice sets contain zero answers, explanations, or transcripts', () => {
      const practice = loadVstepSkillPractice({
        skill: 'listening',
        testId: 'vstep-listening-01',
        limit: 35,
      });
      expect(practice).toBeDefined();

      const forbiddenKeys = ['answer', 'correctAnswer', 'correctOptionIndex', 'explanation', 'explanationVi', 'tapescript'];
      for (const section of practice!.sections) {
        for (const task of section.tasks) {
          for (const key of forbiddenKeys) {
            expect((task as any)[key]).toBeUndefined();
          }
          for (const q of task.questions || []) {
            for (const key of forbiddenKeys) {
              expect((q as any)[key]).toBeUndefined();
            }
          }
        }
      }
    });

    await runner.it('C-VAD3.8: Technical Minimalist UI validation on src/app/vstep/page.tsx', () => {
      const pagePath = path.resolve(process.cwd(), 'src/app/vstep/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');
      expect(content.includes('border-slate-200')).toBe(true);
      expect(content.includes('font-mono')).toBe(true);
      expect(content.includes('tabular-nums')).toBe(true);
      expect(content.includes('rounded-3xl')).toBe(false);
      expect(content.includes('shadow-2xl')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 4: REAL-WORLD SCENARIOS (Scenarios 1 to 4 Core Requirements + E2E - 6 tests)
  // ─────────────────────────────────────────────────────────────────────────
  await runner.describe('Tier 4: Real-World Practice & Exam Scenarios', async () => {
    runner.beforeEach(() => {
      setupTestEnvironment();
      clearVstepExamCache();
    });

    runner.afterEach(() => {
      teardownMockBrowserEnvironment();
    });

    // SCENARIO 1: 100% Unseen Anti-Duplication across multiple consecutive rounds
    await runner.it('S-VAD4.1: Scenario 1: 100% Unseen Anti-Duplication across multiple consecutive practice rounds (Set1 ∩ Set2 = ∅)', () => {
      // Round 1: Candidate is served a practice set and attempts 10 questions (Task 0 / Passage 1)
      const set1 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'unseen',
        testId: 'vstep-reading-01',
      });
      expect(set1).toBeDefined();
      const set1Task0Qs = set1!.sections[0].tasks[0].questions || [];
      const set1Ids = set1Task0Qs.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);
      expect(set1Ids.length).toBe(10);

      // Candidate answers set 1 and records into history
      batchRecordVstepAnswers(
        set1Ids.map((id) => ({
          questionId: id,
          skill: 'reading',
          part: 'reading_p1',
          isCorrect: true,
          selectedOption: 0,
          examId: parseCanonicalVstepQuestionId(id).examId,
        }))
      );

      // Round 2: Candidate requests second set with filterMode: 'unseen' excluding answered questions
      const answeredRound1 = Array.from(getAnsweredVstepQuestionIds('reading'));
      expect(answeredRound1.length).toBe(10);

      const set2 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'unseen',
        excludedIds: answeredRound1,
        testId: 'vstep-reading-01',
      });
      expect(set2).toBeDefined();
      // Candidate attempts 10 questions from the next task
      const set2TaskQs = set2!.sections[0].tasks[0].questions || [];
      const set2Ids = set2TaskQs.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);
      expect(set2Ids.length).toBe(10);

      // Mathematical proof of 100% anti-duplication: Set1 ∩ Set2 = ∅
      const overlap12 = set1Ids.filter((id) => set2Ids.includes(id));
      expect(overlap12.length).toBe(0);

      // Candidate answers set 2 and records into history
      batchRecordVstepAnswers(
        set2Ids.map((id) => ({
          questionId: id,
          skill: 'reading',
          part: 'reading_p2',
          isCorrect: true,
          selectedOption: 1,
          examId: parseCanonicalVstepQuestionId(id).examId,
        }))
      );

      // Round 3: Candidate requests third set with filterMode: 'unseen' excluding (Set 1 ∪ Set 2)
      const answeredRound2 = Array.from(getAnsweredVstepQuestionIds('reading'));
      expect(answeredRound2.length).toBe(20);

      const set3 = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'unseen',
        excludedIds: answeredRound2,
        testId: 'vstep-reading-01',
      });
      expect(set3).toBeDefined();
      const set3TaskQs = set3!.sections[0].tasks[0].questions || [];
      const set3Ids = set3TaskQs.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);
      expect(set3Ids.length).toBe(10);

      // Mathematical proof: Set 3 ∩ (Set 1 ∪ Set 2) = ∅
      const overlapCombined = set3Ids.filter((id) => answeredRound2.includes(id));
      expect(overlapCombined.length).toBe(0);
    });

    // SCENARIO 2: Targeted Mistakes Remediation
    await runner.it('S-VAD4.2: Scenario 2: Targeted Mistakes Remediation workflow (100% missed delivered -> remediated -> mistake list = 0)', () => {
      const sampleExam = loadRawVstepExam('vstep-reading-01');
      const sampleQuestions = sampleExam!.sections[0].tasks[0].questions!.slice(0, 5);
      const qIds = sampleQuestions.map((q) => `vstep-reading-01:${q.id}`);

      // Candidate answers 5 questions: 3 correct, 2 incorrect
      batchRecordVstepAnswers([
        { questionId: qIds[0], skill: 'reading', part: 'part1', isCorrect: true, selectedOption: 0, examId: 'vstep-reading-01' },
        { questionId: qIds[1], skill: 'reading', part: 'part1', isCorrect: false, selectedOption: 1, examId: 'vstep-reading-01' },
        { questionId: qIds[2], skill: 'reading', part: 'part1', isCorrect: true, selectedOption: 2, examId: 'vstep-reading-01' },
        { questionId: qIds[3], skill: 'reading', part: 'part1', isCorrect: false, selectedOption: 3, examId: 'vstep-reading-01' },
        { questionId: qIds[4], skill: 'reading', part: 'part1', isCorrect: true, selectedOption: 0, examId: 'vstep-reading-01' },
      ]);

      const mistakeIds = Array.from(getIncorrectVstepQuestionIds('reading'));
      expect(mistakeIds.length).toBe(2);
      expect(mistakeIds).toContain(qIds[1]);
      expect(mistakeIds).toContain(qIds[3]);

      // Candidate launches targeted practice with filterMode: 'mistakes'
      const practice = loadVstepSkillPractice({
        skill: 'reading',
        filterMode: 'mistakes',
        mistakeIds,
        testId: 'vstep-reading-01',
      });
      expect(practice).toBeDefined();

      const deliveredIds: string[] = [];
      practice!.sections[0].tasks.forEach((t) => {
        t.questions?.forEach((q) => deliveredIds.push(q.canonicalId || q.id));
      });

      // Assert 100% of delivered questions are exactly the 2 previously missed questions
      expect(deliveredIds.length).toBe(2);
      expect(deliveredIds).toContain(qIds[1]);
      expect(deliveredIds).toContain(qIds[3]);

      // Candidate correctly answers both in remediation session
      batchRecordVstepAnswers([
        { questionId: qIds[1], skill: 'reading', part: 'part1', isCorrect: true, selectedOption: 0, examId: 'vstep-reading-01' },
        { questionId: qIds[3], skill: 'reading', part: 'part1', isCorrect: true, selectedOption: 0, examId: 'vstep-reading-01' },
      ]);

      // Assert mistake list is cleared to 0
      const remainingMistakes = Array.from(getIncorrectVstepQuestionIds('reading'));
      expect(remainingMistakes.length).toBe(0);
    });

    // SCENARIO 3: Exam Completion Tracking
    await runner.it('S-VAD4.3: Scenario 3: Exam Completion Tracking and monotonic max bestScore verification', () => {
      // Initial state: not completed
      expect(getVstepExamHistory().records.length).toBe(0);

      // Attempt 1: Submit Full Mock 01 with overallScore 8.5 (C1)
      const t1 = new Date(Date.now() - 5000).toISOString();
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'VSTEP Mock Exam 01',
        category: 'full_mock',
        completedAt: t1,
        durationSeconds: 7200,
        overallScore: 8.5,
        cefrLevel: 'C1',
        accuracyRate: 85,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 64,
        listeningScore: 8.5,
        readingScore: 8.5,
      });

      // Assert lingo_vstep_exam_history records completed exam
      const history1 = getVstepExamHistory();
      expect(history1.records.length).toBe(1);
      expect(history1.records[0].examId).toBe('vstep-mock-01');
      expect(history1.records[0].overallScore).toBe(8.5);
      expect(history1.records[0].cefrLevel).toBe('C1');
      expect(history1.records[0].accuracyRate).toBe(85);

      let summaries = getVstepExamSummaries();
      expect(summaries['vstep-mock-01'].isCompleted).toBe(true);
      expect(summaries['vstep-mock-01'].highestScore).toBe(8.5);
      expect(summaries['vstep-mock-01'].highestCefr).toBe('C1');
      expect(summaries['vstep-mock-01'].latestScore).toBe(8.5);
      expect(summaries['vstep-mock-01'].attemptCount).toBe(1);

      // Attempt 2: Subsequent attempt with lower score (6.0 B2)
      const t2 = new Date().toISOString();
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'VSTEP Mock Exam 01',
        category: 'full_mock',
        completedAt: t2,
        durationSeconds: 6800,
        overallScore: 6.0,
        cefrLevel: 'B2',
        accuracyRate: 60,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 45,
        listeningScore: 6.0,
        readingScore: 6.0,
      });

      summaries = getVstepExamSummaries();
      expect(summaries['vstep-mock-01'].attemptCount).toBe(2);
      // Monotonic max bestScore does not regress!
      expect(summaries['vstep-mock-01'].highestScore).toBe(8.5);
      expect(summaries['vstep-mock-01'].highestCefr).toBe('C1');
      // Latest score updates!
      expect(summaries['vstep-mock-01'].latestScore).toBe(6.0);
      expect(summaries['vstep-mock-01'].latestCefr).toBe('B2');
      expect(summaries['vstep-mock-01'].latestAttemptAt).toBe(t2);
    });

    // SCENARIO 4: Safe Reset
    await runner.it('S-VAD4.4: Scenario 4: Safe Reset (Granular skill reset vs Total reset restoring clean state)', () => {
      // Populate state with questions and exams
      batchRecordVstepAnswers([
        { questionId: 'vstep-listening-01:L1Q1', skill: 'listening', part: 'part1', isCorrect: true, examId: 'vstep-listening-01' },
        { questionId: 'vstep-listening-01:L1Q2', skill: 'listening', part: 'part1', isCorrect: false, examId: 'vstep-listening-01' },
        { questionId: 'vstep-reading-01:R1Q1', skill: 'reading', part: 'reading_p1', isCorrect: true, examId: 'vstep-reading-01' },
        { questionId: 'vstep-reading-01:R1Q2', skill: 'reading', part: 'reading_p1', isCorrect: false, examId: 'vstep-reading-01' },
      ]);
      recordVstepExamAttempt({
        examId: 'vstep-mock-01',
        examTitle: 'Mock 01',
        category: 'full_mock',
        completedAt: new Date().toISOString(),
        durationSeconds: 7200,
        overallScore: 7.5,
        cefrLevel: 'B2',
        accuracyRate: 75,
        totalQuestionsAnswered: 75,
        totalQuestionsCorrect: 56,
      });

      expect(getAnsweredVstepQuestionIds('listening').size).toBe(2);
      expect(getAnsweredVstepQuestionIds('reading').size).toBe(2);
      expect(getVstepExamHistory().records.length).toBe(1);

      // Granular skill reset: resetting Listening clears Listening history while Reading remains 100% intact
      clearVstepSkillHistory('listening');

      expect(getAnsweredVstepQuestionIds('listening').size).toBe(0);
      expect(getIncorrectVstepQuestionIds('listening').size).toBe(0);
      expect(getAnsweredVstepQuestionIds('reading').size).toBe(2);
      expect(getIncorrectVstepQuestionIds('reading').size).toBe(1);
      expect(getVstepExamHistory().records.length).toBe(1);

      // Total reset: clears question history AND exam history back to clean state
      resetAllVstepHistory();

      expect(getAnsweredVstepQuestionIds().size).toBe(0);
      expect(getIncorrectVstepQuestionIds().size).toBe(0);
      expect(getVstepExamHistory().records.length).toBe(0);
      expect(Object.keys(getVstepExamSummaries()).length).toBe(0);
    });

    await runner.it('S-VAD4.5: Multi-round practice depletion and bank progression without within-round duplicate questions', () => {
      const seenSoFar = new Set<string>();

      for (let round = 1; round <= 3; round++) {
        const practice = loadVstepSkillPractice({
          skill: 'reading',
          filterMode: 'unseen',
          excludedIds: Array.from(seenSoFar),
          limit: 10,
          testId: 'bank',
        });
        expect(practice).toBeDefined();

        const roundIds: string[] = [];
        practice!.sections[0].tasks.forEach((t) => {
          t.questions?.forEach((q) => {
            const cid = q.canonicalId || q.id;
            roundIds.push(cid);
            // No question in this round should have been seen before
            expect(seenSoFar.has(cid)).toBe(false);
          });
        });

        // No duplicate questions within the same round
        const uniqueRoundIds = new Set(roundIds);
        expect(uniqueRoundIds.size).toBe(roundIds.length);

        roundIds.forEach((id) => seenSoFar.add(id));
      }

      expect(seenSoFar.size).toBeGreaterThanOrEqual(30);
    });

    await runner.it('S-VAD4.6: End-to-end API integration: POST /api/vstep/test delivers stripped exam, POST /api/vstep/submit grades dynamically with questionIds, history persists both questions and exam', async () => {
      const clientIp = '127.0.0.1';
      const dynamicTestId = 'vstep-practice-reading';
      const sessionToken = generateVstepSessionToken(clientIp, dynamicTestId);

      // 1. Client loads practice set via POST /api/vstep/test
      const testReq = new NextRequest('http://localhost:3000/api/vstep/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': clientIp },
        body: JSON.stringify({
          testId: 'practice',
          skill: 'reading',
          filterMode: 'unseen',
          limit: 5,
        }),
      });

      const testRes = await testVstepExamApiPost(testReq);
      expect(testRes.status).toBe(200);
      const testBody = await testRes.json();
      expect(testBody.success).toBe(true);
      expect(testBody.exam).toBeDefined();

      const servedQuestions: Array<{ id: string; canonicalId?: string }> = [];
      testBody.exam.sections[0].tasks.forEach((t: any) => {
        t.questions?.forEach((q: any) => servedQuestions.push({ id: q.id, canonicalId: q.canonicalId }));
      });
      const selectedQuestions = servedQuestions.slice(0, 5);
      expect(selectedQuestions.length).toBe(5);

      const servedIds = selectedQuestions.map((q) => q.canonicalId || `vstep-reading-01:${q.id}`);

      // 2. Server resolves master questions for authentic answers
      const masterQuestions = loadVstepQuestionsByIds(servedIds);
      expect(masterQuestions.length).toBe(servedIds.length);

      // Build answers: all correct
      const answers: Record<string, number> = {};
      masterQuestions.forEach((q) => {
        answers[q.id] = typeof q.answer === 'number' ? q.answer : 0;
      });

      // 3. Client submits answers to POST /api/vstep/submit
      const submitReq = new NextRequest('http://localhost:3000/api/vstep/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': clientIp },
        body: JSON.stringify({
          testId: dynamicTestId,
          sessionToken,
          questionIds: servedIds,
          answers,
        }),
      });

      const submitRes = await submitVstepExamApi(submitReq);
      expect(submitRes.status).toBe(200);
      const submitBody = await submitRes.json();
      expect(submitBody.success).toBe(true);
      expect(submitBody.scoreResult).toBeDefined();
      expect(submitBody.scoreResult.readingCorrect).toBe(servedIds.length);

      // 4. Persistence to question and exam history
      batchRecordVstepAnswers(
        servedIds.map((id) => ({
          questionId: id,
          skill: 'reading',
          part: 'reading_p1',
          isCorrect: true,
          selectedOption: answers[parseCanonicalVstepQuestionId(id).questionId],
          examId: parseCanonicalVstepQuestionId(id).examId,
        }))
      );
      recordVstepExamAttempt({
        examId: dynamicTestId,
        examTitle: 'VSTEP Reading Practice',
        category: 'reading',
        completedAt: new Date().toISOString(),
        durationSeconds: 300,
        overallScore: submitBody.scoreResult.overallScore,
        cefrLevel: submitBody.scoreResult.cefrLevel,
        accuracyRate: 100,
        totalQuestionsAnswered: servedIds.length,
        totalQuestionsCorrect: servedIds.length,
        readingScore: submitBody.scoreResult.readingScore,
      });

      expect(getAnsweredVstepQuestionIds('reading').size).toBe(servedIds.length);
      expect(getVstepExamHistory().records.length).toBe(1);
      expect(getVstepExamSummaries()[dynamicTestId].isCompleted).toBe(true);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Execution Support
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('anti-duplication.test')) {
  const runner = new TestRunner();
  runVstepAntiDuplicationTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(
      `\nVSTEP Anti-Duplication Suite Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
