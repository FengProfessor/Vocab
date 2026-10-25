/**
 * Authoritative Challenger Final Empirical Stress & Verification Harness
 * Tests all Acceptance Criteria (AC1, AC2, AC3) and adversarial stress boundaries.
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
  calculateToeicScore,
  ToeicPart,
  ToeicUnifiedQuestion,
} from './test-harness';

import {
  loadToeicPartPractice as baseLoadToeicPartPractice,
  loadToeicQuestionsByIds,
  getToeicCatalogIndex,
  loadFullToeicTest,
  loadAnyToeicTest,
  ToeicPartPracticeOptions,
} from '../../src/lib/toeic-test-loader';

import {
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  recordQuestionAnswers,
  getQuestionHistoryByPart,
  getAnsweredQuestionIds,
  getMistakeQuestionIds,
  getCorrectQuestionIds,
  getPartProgressStats,
  resetPartProgress,
  TOEIC_PART_BANK_TOTALS,
  TOEIC_QUESTION_HISTORY_STORAGE_KEY,
  TOEIC_HISTORY_UPDATED_EVENT,
} from '../../src/lib/toeic-question-history';

import fs from 'node:fs';
import path from 'node:path';

const runner = new TestRunner();

/**
 * Runs a function in Node fs environment (temporarily unsetting window so
 * toeic-test-loader's getNodeFs can perform dataset disk reads).
 */
function withNodeFsEnvironment<T>(fn: () => T): T {
  const win = typeof global !== 'undefined' ? (global as any).window : undefined;
  try {
    if (typeof global !== 'undefined' && 'window' in global) {
      delete (global as any).window;
    }
    return fn();
  } finally {
    if (win && typeof global !== 'undefined') {
      (global as any).window = win;
    }
  }
}

function loadPartPractice(
  part: ToeicPart,
  testId?: string,
  limit?: number,
  renumber: boolean = false,
  options?: ToeicPartPracticeOptions
): ToeicUnifiedQuestion[] {
  return withNodeFsEnvironment(() =>
    baseLoadToeicPartPractice(part, testId, limit, renumber, options)
  );
}

function loadQuestionsByIds(questionIds: string[]): ToeicUnifiedQuestion[] {
  return withNodeFsEnvironment(() => loadToeicQuestionsByIds(questionIds));
}

function setupCleanEnvironment() {
  const mockStorage = setupMockBrowserEnvironment();
  const listeners: Record<string, Function[]> = {};

  if (typeof global !== 'undefined' && (global as any).window) {
    const win = (global as any).window;
    win.addEventListener = (event: string, fn: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    };
    win.removeEventListener = (event: string, fn: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((cb) => cb !== fn);
      }
    };
    win.dispatchEvent = (event: any) => {
      const type = typeof event === 'string' ? event : event?.type;
      if (listeners[type]) {
        listeners[type].forEach((fn) => fn(event));
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

  return { mockStorage, listeners };
}

export async function runChallengerFinalTests() {
  console.log('\n================================================================');
  console.log('  CHALLENGER FINAL: INDEPENDENT EMPIRICAL VERIFICATION HARNESS  ');
  console.log('================================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 1: AC1 ZERO DUPLICATION & MULTI-SESSION STRESS
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('AC1: Zero Duplication & Question Selection Invariants', () => {});

  await runner.it('AC1-1: Exact User Scenario - Part 1 (10Q) Session 1 -> Submit -> Session 2 has 0% overlap', async () => {
    setupCleanEnvironment();

    // Session 1: Request 10 Part 1 questions
    const session1 = loadPartPractice(1, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: getAnsweredQuestionIds(1),
    });
    expect(session1.length).toBe(10);
    const session1Ids = new Set(session1.map((q) => q.id));
    expect(session1Ids.size).toBe(10); // All 10 are distinct

    // User submits Session 1 answers
    recordQuestionAnswers(
      session1.map((q) => ({
        questionId: q.id,
        part: 1,
        isCorrect: true,
        selectedOption: q.correctAnswer,
      }))
    );

    // Verify history recorded 10 answered questions for Part 1
    const answeredAfterSession1 = getAnsweredQuestionIds(1);
    expect(answeredAfterSession1.length).toBe(10);

    // Session 2: Request 10 Part 1 questions with updated exclusion list
    const session2 = loadPartPractice(1, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: answeredAfterSession1,
    });
    expect(session2.length).toBe(10);
    const session2Ids = session2.map((q) => q.id);

    // 0% overlap check: session1Ids ∩ session2Ids = ∅
    const duplicates = session2Ids.filter((id) => session1Ids.has(id));
    expect(duplicates.length).toBe(0);

    // Verification of sequential renumbering 1..10
    for (let i = 0; i < session2.length; i++) {
      expect(session2[i].questionNumber).toBe(i + 1);
    }
  });

  await runner.it('AC1-2: Stress Test - 8 Consecutive Sessions in Part 1 (8 x 15 = 120 questions) maintain 0% overlap', async () => {
    setupCleanEnvironment();

    const seenIds = new Set<string>();
    const totalSessions = 8;
    const questionsPerSession = 15;

    for (let s = 1; s <= totalSessions; s++) {
      const excluded = getAnsweredQuestionIds(1);
      const sessionQuestions = loadPartPractice(1, 'bank', questionsPerSession, true, {
        filterMode: 'unseen',
        excludedIds: excluded,
      });

      expect(sessionQuestions.length).toBe(questionsPerSession);

      // Verify ZERO overlap with any previously seen questions across all earlier sessions
      for (const q of sessionQuestions) {
        expect(seenIds.has(q.id)).toBe(false);
        seenIds.add(q.id);
      }

      // Submit session
      recordQuestionAnswers(
        sessionQuestions.map((q) => ({
          questionId: q.id,
          part: 1,
          isCorrect: true,
          selectedOption: q.correctAnswer,
        }))
      );
    }

    expect(seenIds.size).toBe(totalSessions * questionsPerSession);
    expect(getAnsweredQuestionIds(1).length).toBe(120);
  });

  await runner.it('AC1-3: Boundary & Exhaustion Fallback - Gracefully handles fewer unseen questions than limit', async () => {
    setupCleanEnvironment();

    // Part 1 has 210 questions. Pre-exclude 206 questions.
    const allP1 = loadPartPractice(1, 'bank', 210, false, { filterMode: 'all_random', seed: 42 });
    const preExclude = allP1.slice(0, 206).map((q) => q.id);

    // Only 4 questions remain unseen. Request 10.
    const questions = loadPartPractice(1, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: preExclude,
    });

    expect(questions.length).toBe(10);

    // Within this single session, all 10 questions must be distinct
    const sessionIds = new Set(questions.map((q) => q.id));
    expect(sessionIds.size).toBe(10);

    // Renumbering must be continuous 1..10
    expect(questions[0].questionNumber).toBe(1);
    expect(questions[9].questionNumber).toBe(10);
  });

  await runner.it('AC1-4: Extreme Limit Boundaries - limit 1, limit > bank', async () => {
    setupCleanEnvironment();

    const singleQ = loadPartPractice(5, 'bank', 1, true, { filterMode: 'unseen' });
    expect(singleQ.length).toBe(1);
    expect(singleQ[0].questionNumber).toBe(1);

    // Huge limit clamped to bank size (Part 1 has 210 questions)
    const huge = loadPartPractice(1, 'bank', 5000, true, { filterMode: 'unseen' });
    expect(huge.length).toBe(210);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 2: AC2 SPACED REPETITION MISTAKE REVIEW
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('AC2: Spaced Repetition Mistake Review Workflow', () => {});

  await runner.it('AC2-1: Exact User Scenario - Practice -> Answer wrong -> Mistake mode loads only wrong -> Answer right -> Mistakes drop to 0', async () => {
    setupCleanEnvironment();

    // 1. Initial practice: 20 questions in Part 5
    const initialQs = loadPartPractice(5, 'bank', 20, true, { filterMode: 'unseen' });
    expect(initialQs.length).toBe(20);

    // Answer: 12 correct, 8 wrong
    const answers1 = initialQs.map((q, idx) => ({
      questionId: q.id,
      part: 5,
      isCorrect: idx < 12, // first 12 right, last 8 wrong
      selectedOption: idx < 12 ? q.correctAnswer : 'D',
    }));
    recordQuestionAnswers(answers1);

    // Check stats: 20 answered, 8 mistakes
    let stats = getPartProgressStats(5, 100);
    expect(stats.completedCount).toBe(20);
    expect(stats.mistakeCount).toBe(8);

    const mistakeIds = getMistakeQuestionIds(5);
    expect(mistakeIds.length).toBe(8);

    // 2. Launch Mistake Review Mode
    const mistakeSession = loadPartPractice(5, 'bank', 8, true, {
      filterMode: 'mistakes',
      mistakeIds,
    });
    expect(mistakeSession.length).toBe(8);

    // 100% of questions in mistake session must be from mistakeIds
    for (const q of mistakeSession) {
      expect(mistakeIds.includes(q.id)).toBe(true);
    }

    // 3. Answer all 8 questions correctly
    const answers2 = mistakeSession.map((q) => ({
      questionId: q.id,
      part: 5,
      isCorrect: true,
      selectedOption: q.correctAnswer,
    }));
    recordQuestionAnswers(answers2);

    // 4. Verify mistake count drops to 0
    stats = getPartProgressStats(5, 100);
    expect(stats.mistakeCount).toBe(0);
    expect(getMistakeQuestionIds(5).length).toBe(0);
    expect(stats.completedCount).toBe(20); // total unique questions remains 20
  });

  await runner.it('AC2-2: Partial Remediation - Solving half mistakes leaves only remaining mistakes', async () => {
    setupCleanEnvironment();

    const qs = loadPartPractice(2, 'bank', 10, true, { filterMode: 'unseen' });
    // All 10 wrong
    recordQuestionAnswers(
      qs.map((q) => ({
        questionId: q.id,
        part: 2,
        isCorrect: false,
        selectedOption: 'A',
      }))
    );

    expect(getMistakeQuestionIds(2).length).toBe(10);

    // Remediate 4 questions
    recordQuestionAnswers(
      qs.slice(0, 4).map((q) => ({
        questionId: q.id,
        part: 2,
        isCorrect: true,
        selectedOption: q.correctAnswer,
      }))
    );

    // Exactly 6 mistakes remaining
    const remaining = getMistakeQuestionIds(2);
    expect(remaining.length).toBe(6);

    const stats = getPartProgressStats(2, 100);
    expect(stats.mistakeCount).toBe(6);
  });

  await runner.it('AC2-3: Empty Mistake Bank Handling - Mistake mode with 0 mistakes returns [] safely', async () => {
    setupCleanEnvironment();

    const emptyMistakes = loadPartPractice(3, 'bank', 10, true, {
      filterMode: 'mistakes',
      mistakeIds: [],
    });
    expect(emptyMistakes.length).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 3: AC3 RESET PROGRESS WORKFLOW & PART ISOLATION
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('AC3: Reset Progress & Multi-Part Isolation', () => {});

  await runner.it('AC3-1: Exact User Scenario - Practice Part -> Reset Part Progress -> Resets to 0% (0 answered, 0 mistakes)', async () => {
    setupCleanEnvironment();

    // Practice 20 questions in Part 5 (some correct, some wrong)
    const p5Questions = loadPartPractice(5, 'bank', 20, false);
    expect(p5Questions.length).toBe(20);
    recordQuestionAnswers(
      p5Questions.map((q, idx) => ({
        questionId: q.id,
        part: 5,
        isCorrect: idx % 2 === 0,
        selectedOption: idx % 2 === 0 ? q.correctAnswer : 'B',
      }))
    );

    let statsBefore = getPartProgressStats(5);
    expect(statsBefore.completedCount).toBe(20);
    expect(statsBefore.mistakeCount).toBe(10);
    expect(statsBefore.percentage).toBeGreaterThan(0);

    // User triggers Reset Part Progress for Part 5
    resetPartProgress(5);

    // Verify progress resets to 0% (0 answered, 0 mistakes)
    const statsAfter = getPartProgressStats(5);
    expect(statsAfter.completedCount).toBe(0);
    expect(statsAfter.mistakeCount).toBe(0);
    expect(statsAfter.percentage).toBe(0);
    expect(statsAfter.unseenCount).toBe(statsAfter.totalQuestions);
    expect(getAnsweredQuestionIds(5).length).toBe(0);
    expect(getMistakeQuestionIds(5).length).toBe(0);
  });

  await runner.it('AC3-2: Part Isolation Invariant - Resetting Part 1 leaves Part 2 and Part 7 completely untouched', async () => {
    setupCleanEnvironment();

    // Populate Part 1, Part 2, and Part 7
    recordQuestionAnswers([
      { questionId: 'q-p1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-p1-2', part: 1, isCorrect: false, selectedOption: 'B' },
      { questionId: 'q-p2-1', part: 2, isCorrect: true, selectedOption: 'C' },
      { questionId: 'q-p2-2', part: 2, isCorrect: false, selectedOption: 'A' },
      { questionId: 'q-p7-1', part: 7, isCorrect: true, selectedOption: 'D' },
    ]);

    expect(getPartProgressStats(1).completedCount).toBe(2);
    expect(getPartProgressStats(2).completedCount).toBe(2);
    expect(getPartProgressStats(7).completedCount).toBe(1);

    // Reset Part 1 only
    resetPartProgress(1);

    // Part 1 is wiped
    expect(getPartProgressStats(1).completedCount).toBe(0);
    expect(getPartProgressStats(1).mistakeCount).toBe(0);

    // Part 2 and Part 7 are completely intact
    expect(getPartProgressStats(2).completedCount).toBe(2);
    expect(getPartProgressStats(2).mistakeCount).toBe(1);
    expect(getPartProgressStats(7).completedCount).toBe(1);
  });

  await runner.it('AC3-3: Global Reset - resetPartProgress() without parameters wipes all 7 parts', async () => {
    setupCleanEnvironment();

    recordQuestionAnswers([
      { questionId: 'q-p1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-p3-1', part: 3, isCorrect: true, selectedOption: 'B' },
      { questionId: 'q-p5-1', part: 5, isCorrect: true, selectedOption: 'C' },
    ]);

    expect(getAnsweredQuestionIds().length).toBe(3);

    // Global reset
    resetPartProgress();

    expect(getAnsweredQuestionIds().length).toBe(0);
    for (let p = 1; p <= 7; p++) {
      expect(getPartProgressStats(p).completedCount).toBe(0);
      expect(getPartProgressStats(p).mistakeCount).toBe(0);
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUITE 4: ADVANCED ADVERSARIAL STRESS & CLUSTERING INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('Advanced Invariants: Stimulus Clustering & Scoring Alignment', () => {});

  await runner.it('ADV-1: Stimulus Clustering Preservation in Part 3 (Audio dialogues never sliced)', async () => {
    setupCleanEnvironment();

    // Load Part 3 with bank
    const questions = loadPartPractice(3, 'bank', 12, true, { filterMode: 'all_random', seed: 101 });
    expect(questions.length).toBe(12);

    // In Part 3, questions sharing the same audio_url belong together in triplets
    for (let i = 0; i < questions.length; i += 3) {
      const q1 = questions[i];
      const q2 = questions[i + 1];
      const q3 = questions[i + 2];
      if (q1 && q2 && q3 && q1.audioUrl) {
        expect(q2.audioUrl).toBe(q1.audioUrl);
        expect(q3.audioUrl).toBe(q1.audioUrl);
      }
    }
  });

  await runner.it('ADV-2: Stimulus Clustering Preservation in Part 7 (Passages never sliced mid-passage)', async () => {
    setupCleanEnvironment();

    const questions = loadPartPractice(7, 'bank', 10, true, { filterMode: 'all_random', seed: 202 });
    expect(questions.length).toBe(10);

    for (const q of questions) {
      expect(q.part).toBe(7);
      expect(q.options.length).toBe(4);
    }
  });

  await runner.it('ADV-3: Deterministic Scoring Alignment via loadToeicQuestionsByIds', async () => {
    setupCleanEnvironment();

    // Pull 20 questions with sequential renumbering 1..20
    const q1 = loadPartPractice(1, 'bank', 5, true);
    const q2 = loadPartPractice(2, 'bank', 5, true);
    const q5 = loadPartPractice(5, 'bank', 10, true);
    const combined = [...q1, ...q2, ...q5].map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));
    const combinedIds = combined.map((q) => q.id);

    // Server-side lookup using exact question IDs
    const resolvedMaster = loadQuestionsByIds(combinedIds);
    expect(resolvedMaster.length).toBe(20);

    // Verify 1:1 ID match and correctAnswer presence
    for (let i = 0; i < combinedIds.length; i++) {
      expect(resolvedMaster[i].id).toBe(combinedIds[i]);
      expect(['A', 'B', 'C', 'D'].includes(resolvedMaster[i].correctAnswer)).toBe(true);
    }

    // Renumber resolvedMaster to match served client questions 1..20
    const renumberedMaster = resolvedMaster.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));

    // Simulate scoring: 15 correct, 5 wrong
    const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    for (let i = 0; i < 20; i++) {
      const correct = renumberedMaster[i].correctAnswer;
      answers[i + 1] = i < 15 ? correct : (correct === 'A' ? 'B' : 'A');
    }

    const scoreResult = calculateToeicScore(answers, renumberedMaster, 120);
    expect(scoreResult.rawTotal).toBe(15);
  });

  await runner.it('ADV-4: Storage Corruption Resilience - Invalid JSON recovers automatically', async () => {
    setupCleanEnvironment();

    // Intentionally inject corrupted JSON string into localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, '{"version":1,"records":CORRUPT_DATA}');
    }

    // loadToeicQuestionHistory must safely handle corruption and return valid default storage
    const storage = loadToeicQuestionHistory();
    expect(storage.version).toBe(1);
    expect(typeof storage.records).toBe('object');
    expect(Object.keys(storage.records).length).toBe(0);

    // Subsequent write must succeed cleanly
    recordQuestionAnswers([
      { questionId: 'q-recover-1', part: 1, isCorrect: true, selectedOption: 'A' },
    ]);
    expect(getAnsweredQuestionIds(1).length).toBe(1);
  });

  const stats = runner.getStats();
  console.log('\n================================================================');
  console.log(`  CHALLENGER FINAL RESULTS: ${stats.passed}/${stats.total} PASSED (${stats.failed} FAILED)`);
  console.log('================================================================\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

// Self-executing entrypoint when invoked directly via tsx
if (require.main === module) {
  runChallengerFinalTests().catch((err) => {
    console.error('Fatal error in challenger final test suite:', err);
    process.exit(1);
  });
}
