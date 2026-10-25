/**
 * TOEIC Question History Tracker & State Layer Unit Test Suite
 * File: tests/toeic/toeic-question-history.test.ts
 *
 * Verifies:
 * - SSR safety and window/localStorage absence guarding
 * - LocalStorage schema versioning, JSON corruption resilience, and migrations
 * - Batch recording, attemptCount incrementation, and option normalization
 * - Spaced-repetition mistake transitions and Part query isolation
 * - Part progress stats calculations, clamp bounds, and bank total fallbacks
 * - Single-part and global progress resets
 * - Reactive CustomEvent dispatching and detail payloads
 * - Offline sync queue mechanics and guest mode safety
 */

import {
  TestRunner,
  expect,
  MockLocalStorage,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import {
  TOEIC_QUESTION_HISTORY_STORAGE_KEY,
  TOEIC_HISTORY_SYNC_QUEUE_KEY,
  TOEIC_HISTORY_UPDATED_EVENT,
  TOEIC_HISTORY_STORAGE_VERSION,
  TOEIC_HISTORY_VERSION,
  TOEIC_PART_BANK_TOTALS,
  TOEIC_TOTAL_BANK_QUESTIONS,
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  getStoredQuestionHistory,
  saveStoredQuestionHistory,
  getQuestionHistory,
  recordQuestionAnswers,
  getQuestionHistoryByPart,
  getAnsweredQuestionIds,
  getMistakeQuestionIds,
  getCorrectQuestionIds,
  getPartProgressStats,
  resetPartProgress,
  notifyHistoryUpdated,
  syncQuestionHistoryToSupabase,
  reconcileQuestionHistoryOnLogin,
  deleteRemotePartProgress,
  flushOfflineSyncQueue,
  dequeueFailedSync,
  type ToeicQuestionHistoryRecord,
  type ToeicQuestionHistoryStorage,
  type PartProgressStats,
  type QuestionAnswerInput,
  type ToeicHistoryUpdatedEventDetail,
} from '../../src/lib/toeic-question-history';

export async function runToeicQuestionHistoryTests(runner: TestRunner): Promise<void> {
  runner.describe('TOEIC Question History Tracker & State Layer (Milestone 1)', () => {});

  // ── 1. Initialization & Defaults ───────────────────────────────────────────
  await runner.it('QHIST-1: Uninitialized storage returns versioned empty envelope with valid defaults', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const storage = loadToeicQuestionHistory();
      expect(storage.version).toBe(TOEIC_HISTORY_STORAGE_VERSION);
      expect(typeof storage.updatedAt).toBe('string');
      expect(typeof storage.records).toBe('object');
      expect(Object.keys(storage.records).length).toBe(0);

      expect(getAnsweredQuestionIds().length).toBe(0);
      expect(getMistakeQuestionIds().length).toBe(0);
      expect(getCorrectQuestionIds().length).toBe(0);
      expect(getQuestionHistoryByPart(1).length).toBe(0);

      const stats = getPartProgressStats(1);
      expect(stats.part).toBe(1);
      expect(stats.completedCount).toBe(0);
      expect(stats.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]);
      expect(stats.percentage).toBe(0);
      expect(stats.mistakeCount).toBe(0);
      expect(stats.unseenCount).toBe(TOEIC_PART_BANK_TOTALS[1]);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 2. SSR Guarding & Fallback Safety ───────────────────────────────────────
  await runner.it('QHIST-2: SSR environment where window and localStorage are undefined does not crash', () => {
    // Teardown mock environment so global.window and global.localStorage are undefined
    teardownMockBrowserEnvironment();

    const origWindow = (global as any).window;
    const origLocalStorage = (global as any).localStorage;
    delete (global as any).window;
    delete (global as any).localStorage;

    try {
      const storage = loadToeicQuestionHistory();
      expect(storage.version).toBe(1);
      expect(Object.keys(storage.records).length).toBe(0);

      // Mutators should safely no-op without throwing
      saveToeicQuestionHistory(storage);
      recordQuestionAnswers([
        { questionId: 'ssr-q1', part: 1, isCorrect: true, selectedOption: 'A' },
      ]);
      resetPartProgress(1);
      notifyHistoryUpdated({ questionIds: ['ssr-q1'], source: 'local_record' });

      // Queries should return safe empty arrays / defaults
      expect(getAnsweredQuestionIds(1).length).toBe(0);
      expect(getMistakeQuestionIds(1).length).toBe(0);
      expect(getQuestionHistoryByPart(1).length).toBe(0);
      const stats = getPartProgressStats(1);
      expect(stats.percentage).toBe(0);
    } finally {
      (global as any).window = origWindow;
      (global as any).localStorage = origLocalStorage;
    }
  });

  // ── 3. LocalStorage Schema Resilience & Migrations ──────────────────────────
  await runner.it('QHIST-3: Corrupted JSON in localStorage is caught and safely resets to default envelope', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, '{malformed_json_syntax: true');
      const storage = loadToeicQuestionHistory();
      expect(storage.version).toBe(1);
      expect(Object.keys(storage.records).length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('QHIST-4: Unversioned legacy flat record map is migrated into versioned storage envelope', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const legacyFlatMap = {
        'q-legacy-1': {
          questionId: 'q-legacy-1',
          part: 5,
          lastAnsweredAt: '2026-09-01T10:00:00.000Z',
          isCorrect: true,
          attemptCount: 1,
          selectedOption: 'A',
        },
      };
      mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, JSON.stringify(legacyFlatMap));

      const storage = loadToeicQuestionHistory();
      expect(storage.version).toBe(1);
      expect(storage.records['q-legacy-1']).toBeDefined();
      expect(storage.records['q-legacy-1'].part).toBe(5);
      expect(storage.records['q-legacy-1'].isCorrect).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 4. Core Question Recording & Sanitization ──────────────────────────────
  await runner.it('QHIST-5: recordQuestionAnswers writes records, normalizes selectedOption, and clamps part', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-p1-1', part: 1, isCorrect: true, selectedOption: 'a' },
        { questionId: 'q-p2-5', part: 2, isCorrect: false, selectedOption: ' c ' },
        { questionId: '   ', part: 1, isCorrect: true, selectedOption: 'B' }, // whitespace ID -> skipped
        { questionId: 'q-clamp-9', part: 99, isCorrect: true, selectedOption: 'D' }, // part 99 -> clamped to 7
      ]);

      const storage = loadToeicQuestionHistory();
      expect(Object.keys(storage.records).length).toBe(3);

      const r1 = storage.records['q-p1-1'];
      expect(r1.questionId).toBe('q-p1-1');
      expect(r1.part).toBe(1);
      expect(r1.isCorrect).toBe(true);
      expect(r1.selectedOption).toBe('A'); // normalized uppercase
      expect(r1.attemptCount).toBe(1);

      const r2 = storage.records['q-p2-5'];
      expect(r2.isCorrect).toBe(false);
      expect(r2.selectedOption).toBe('C'); // trimmed uppercase

      const rClamp = storage.records['q-clamp-9'];
      expect(rClamp.part).toBe(7); // clamped between 1 and 7
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 5. Cumulative Attempts & Timestamp Progression ──────────────────────────
  await runner.it('QHIST-6: Repeated attempts increment attemptCount and update latest timestamp and answer', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const qId = 'q-attempt-1';

      // Attempt 1: wrong
      recordQuestionAnswers([
        { questionId: qId, part: 5, isCorrect: false, selectedOption: 'A', answeredAt: '2026-09-11T10:00:00.000Z' },
      ]);
      let rec = loadToeicQuestionHistory().records[qId];
      expect(rec.attemptCount).toBe(1);
      expect(rec.isCorrect).toBe(false);
      expect(rec.selectedOption).toBe('A');
      expect(rec.lastAnsweredAt).toBe('2026-09-11T10:00:00.000Z');

      // Attempt 2: correct
      recordQuestionAnswers([
        { questionId: qId, part: 5, isCorrect: true, selectedOption: 'B', answeredAt: '2026-09-11T11:00:00.000Z' },
      ]);
      rec = loadToeicQuestionHistory().records[qId];
      expect(rec.attemptCount).toBe(2);
      expect(rec.isCorrect).toBe(true);
      expect(rec.selectedOption).toBe('B');
      expect(rec.lastAnsweredAt).toBe('2026-09-11T11:00:00.000Z');

      // Attempt 3: wrong again
      recordQuestionAnswers([
        { questionId: qId, part: 5, isCorrect: false, selectedOption: 'C', answeredAt: '2026-09-11T12:00:00.000Z' },
      ]);
      rec = loadToeicQuestionHistory().records[qId];
      expect(rec.attemptCount).toBe(3);
      expect(rec.isCorrect).toBe(false);
      expect(rec.selectedOption).toBe('C');
      expect(rec.lastAnsweredAt).toBe('2026-09-11T12:00:00.000Z');
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 6. Mistake State Transitions & Spaced Repetition ────────────────────────
  await runner.it('QHIST-7: Mistake state transitions dynamically between incorrect and correct attempts', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const q1 = 'q-sr-1';
      const q2 = 'q-sr-2';

      // Both answered wrong initially
      recordQuestionAnswers([
        { questionId: q1, part: 3, isCorrect: false, selectedOption: 'A' },
        { questionId: q2, part: 3, isCorrect: false, selectedOption: 'B' },
      ]);
      let mistakes = getMistakeQuestionIds(3);
      expect(mistakes.length).toBe(2);
      expect(mistakes).toContain(q1);
      expect(mistakes).toContain(q2);
      expect(getCorrectQuestionIds(3).length).toBe(0);

      // q1 answered correctly on retry
      recordQuestionAnswers([
        { questionId: q1, part: 3, isCorrect: true, selectedOption: 'C' },
      ]);
      mistakes = getMistakeQuestionIds(3);
      expect(mistakes.length).toBe(1);
      expect(mistakes).toContain(q2);
      expect(mistakes.includes(q1)).toBe(false);

      const corrects = getCorrectQuestionIds(3);
      expect(corrects.length).toBe(1);
      expect(corrects).toContain(q1);

      // q2 answered correctly on retry
      recordQuestionAnswers([
        { questionId: q2, part: 3, isCorrect: true, selectedOption: 'D' },
      ]);
      expect(getMistakeQuestionIds(3).length).toBe(0);
      expect(getCorrectQuestionIds(3).length).toBe(2);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 7. Query Part Isolation ────────────────────────────────────────────────
  await runner.it('QHIST-8: getQuestionHistoryByPart and ID queries strictly isolate by part', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-iso-p1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-iso-p2', part: 2, isCorrect: false, selectedOption: 'B' },
        { questionId: 'q-iso-p5', part: 5, isCorrect: true, selectedOption: 'C' },
        { questionId: 'q-iso-p7', part: 7, isCorrect: false, selectedOption: 'D' },
      ]);

      // Part 1
      const p1History = getQuestionHistoryByPart(1);
      expect(p1History.length).toBe(1);
      expect(p1History[0].questionId).toBe('q-iso-p1');
      expect(getAnsweredQuestionIds(1)).toEqual(['q-iso-p1']);
      expect(getMistakeQuestionIds(1).length).toBe(0);
      expect(getCorrectQuestionIds(1)).toEqual(['q-iso-p1']);

      // Part 2
      expect(getQuestionHistoryByPart(2).length).toBe(1);
      expect(getAnsweredQuestionIds(2)).toEqual(['q-iso-p2']);
      expect(getMistakeQuestionIds(2)).toEqual(['q-iso-p2']);

      // Part 3 (empty)
      expect(getQuestionHistoryByPart(3).length).toBe(0);
      expect(getAnsweredQuestionIds(3).length).toBe(0);
      expect(getMistakeQuestionIds(3).length).toBe(0);

      // Global (all parts)
      const allAnswered = getAnsweredQuestionIds();
      expect(allAnswered.length).toBe(4);
      const allMistakes = getMistakeQuestionIds();
      expect(allMistakes.length).toBe(2);
      expect(allMistakes).toContain('q-iso-p2');
      expect(allMistakes).toContain('q-iso-p7');

      // Invalid part bounds return empty array
      expect(getQuestionHistoryByPart(0).length).toBe(0);
      expect(getQuestionHistoryByPart(8).length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 8. Part Progress Statistics Calculations ───────────────────────────────
  await runner.it('QHIST-9: getPartProgressStats computes exact counts, percentage, accuracy, and aliases', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const answers: QuestionAnswerInput[] = [];
      // Part 5: 30 questions answered (24 correct, 6 wrong)
      for (let i = 1; i <= 30; i++) {
        answers.push({
          questionId: 'q-stat-p5-' + i,
          part: 5,
          isCorrect: i <= 24,
          selectedOption: i <= 24 ? 'A' : 'B',
        });
      }
      recordQuestionAnswers(answers);

      // Test with custom bank count: 120
      const stats = getPartProgressStats(5, 120);
      expect(stats.part).toBe(5);
      expect(stats.completedCount).toBe(30);
      expect(stats.totalQuestions).toBe(120);
      expect(stats.percentage).toBe(25); // 30 / 120 * 100 = 25%
      expect(stats.mistakeCount).toBe(6);
      expect(stats.unseenCount).toBe(90); // 120 - 30 = 90
      expect(stats.accuracyPercentage).toBe(80); // 24 / 30 * 100 = 80%

      // Test aliases
      expect(stats.totalAnswered).toBe(30);
      expect(stats.totalMistakes).toBe(6);
      expect(stats.totalCorrect).toBe(24);
      expect(stats.totalInBank).toBe(120);
      expect(stats.completionPercentage).toBe(25);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 9. Bank Total Defaults & Boundaries in Stats ───────────────────────────
  await runner.it('QHIST-10: getPartProgressStats gracefully defaults bank total and clamps boundaries', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // 1. Omitted totalInBank defaults to TOEIC_PART_BANK_TOTALS
      const p1Stats = getPartProgressStats(1);
      expect(p1Stats.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]); // 210
      expect(p1Stats.unseenCount).toBe(210);

      const p7Stats = getPartProgressStats(7);
      expect(p7Stats.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[7]); // 2427

      // Verify all 7 parts bank totals match catalog
      expect(TOEIC_PART_BANK_TOTALS[1]).toBe(210);
      expect(TOEIC_PART_BANK_TOTALS[2]).toBe(1543);
      expect(TOEIC_PART_BANK_TOTALS[3]).toBe(858);
      expect(TOEIC_PART_BANK_TOTALS[4]).toBe(1407);
      expect(TOEIC_PART_BANK_TOTALS[5]).toBe(720);
      expect(TOEIC_PART_BANK_TOTALS[6]).toBe(384);
      expect(TOEIC_PART_BANK_TOTALS[7]).toBe(2427);
      expect(TOEIC_TOTAL_BANK_QUESTIONS).toBe(7549);

      // 2. Zero or negative bank total produces 0% without NaN
      const zeroStats = getPartProgressStats(1, 0);
      expect(zeroStats.percentage).toBe(210 > 0 ? 0 : 0); // 0 totalInBank passed falls back to 210
      expect(Number.isNaN(zeroStats.percentage)).toBe(false);

      // 3. Overflow: user answered more than bank count clamps percentage to 100, unseen to 0
      recordQuestionAnswers([
        { questionId: 'q-over-1', part: 6, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-over-2', part: 6, isCorrect: true, selectedOption: 'B' },
        { questionId: 'q-over-3', part: 6, isCorrect: true, selectedOption: 'C' },
      ]);
      const overflowStats = getPartProgressStats(6, 2); // 3 completed, bank = 2
      expect(overflowStats.percentage).toBe(100);
      expect(overflowStats.unseenCount).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 10. Single Part Reset ──────────────────────────────────────────────────
  await runner.it('QHIST-11: resetPartProgress(part) purges only the target part and preserves other parts', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-rst-p1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-rst-p5-1', part: 5, isCorrect: true, selectedOption: 'B' },
        { questionId: 'q-rst-p5-2', part: 5, isCorrect: false, selectedOption: 'C' },
        { questionId: 'q-rst-p7', part: 7, isCorrect: true, selectedOption: 'D' },
      ]);

      expect(getAnsweredQuestionIds(5).length).toBe(2);
      expect(getMistakeQuestionIds(5).length).toBe(1);

      // Reset Part 5
      resetPartProgress(5);

      // Part 5 is completely cleared
      expect(getAnsweredQuestionIds(5).length).toBe(0);
      expect(getMistakeQuestionIds(5).length).toBe(0);
      expect(getQuestionHistoryByPart(5).length).toBe(0);
      const p5Stats = getPartProgressStats(5);
      expect(p5Stats.completedCount).toBe(0);
      expect(p5Stats.percentage).toBe(0);

      // Other parts intact
      expect(getAnsweredQuestionIds(1)).toEqual(['q-rst-p1']);
      expect(getAnsweredQuestionIds(7)).toEqual(['q-rst-p7']);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 11. Global Progress Reset ──────────────────────────────────────────────
  await runner.it('QHIST-12: resetPartProgress() without arguments clears all records across all parts', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-g-1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-g-3', part: 3, isCorrect: false, selectedOption: 'B' },
        { questionId: 'q-g-6', part: 6, isCorrect: true, selectedOption: 'C' },
      ]);

      expect(getAnsweredQuestionIds().length).toBe(3);

      // Global reset
      resetPartProgress();

      expect(getAnsweredQuestionIds().length).toBe(0);
      expect(getMistakeQuestionIds().length).toBe(0);
      const storage = loadToeicQuestionHistory();
      expect(Object.keys(storage.records).length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 12. Reactive CustomEvent Dispatching ───────────────────────────────────
  await runner.it('QHIST-13: recordQuestionAnswers and resetPartProgress dispatch lingo_toeic_history_updated event', () => {
    setupMockBrowserEnvironment();
    try {
      const listeners: Record<string, Function[]> = {};
      const win = (global as any).window;
      win.addEventListener = (type: string, cb: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(cb);
      };
      win.removeEventListener = (type: string, cb: Function) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((fn) => fn !== cb);
        }
      };
      win.dispatchEvent = (event: any) => {
        const type = event?.type;
        if (listeners[type]) {
          listeners[type].forEach((fn) => fn(event));
        }
        return true;
      };
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

      const dispatchedEvents: any[] = [];
      const handler = (e: any) => {
        dispatchedEvents.push(e.detail);
      };

      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);

      // 1. Single part write event
      recordQuestionAnswers([
        { questionId: 'q-ev-1', part: 2, isCorrect: true, selectedOption: 'A' },
      ]);
      expect(dispatchedEvents.length).toBe(1);
      expect(dispatchedEvents[0].source).toBe('local_record');
      expect(dispatchedEvents[0].part).toBe(2);
      expect(dispatchedEvents[0].questionIds).toContain('q-ev-1');

      // 2. Multi part write event (part is undefined, affectedParts has all parts)
      recordQuestionAnswers([
        { questionId: 'q-ev-2', part: 1, isCorrect: true, selectedOption: 'B' },
        { questionId: 'q-ev-3', part: 4, isCorrect: false, selectedOption: 'C' },
      ]);
      expect(dispatchedEvents.length).toBe(2);
      expect(dispatchedEvents[1].source).toBe('local_record');
      expect(dispatchedEvents[1].part).toBeUndefined();
      expect(dispatchedEvents[1].affectedParts).toEqual([1, 4]);

      // 3. Reset event
      resetPartProgress(2);
      expect(dispatchedEvents.length).toBe(3);
      expect(dispatchedEvents[2].source).toBe('reset');
      expect(dispatchedEvents[2].part).toBe(2);

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 13. Deterministic Sorting in getQuestionHistoryByPart ───────────────────
  await runner.it('QHIST-14: getQuestionHistoryByPart sorts records descending by lastAnsweredAt', () => {
    setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-time-1', part: 4, isCorrect: true, selectedOption: 'A', answeredAt: '2026-09-11T08:00:00.000Z' },
        { questionId: 'q-time-3', part: 4, isCorrect: true, selectedOption: 'B', answeredAt: '2026-09-11T10:00:00.000Z' },
        { questionId: 'q-time-2', part: 4, isCorrect: false, selectedOption: 'C', answeredAt: '2026-09-11T09:00:00.000Z' },
      ]);

      const history = getQuestionHistoryByPart(4);
      expect(history.length).toBe(3);
      expect(history[0].questionId).toBe('q-time-3'); // 10:00
      expect(history[1].questionId).toBe('q-time-2'); // 09:00
      expect(history[2].questionId).toBe('q-time-1'); // 08:00
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 14. Offline Sync Queue Mechanics ───────────────────────────────────────
  await runner.it('QHIST-15: Offline sync queue enqueues and dequeues failed items safely', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // Empty queue returns empty array
      expect(dequeueFailedSync().length).toBe(0);

      // Simulate item stored in queue
      const queuedItems: QuestionAnswerInput[] = [
        { questionId: 'q-queue-1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-queue-2', part: 5, isCorrect: false, selectedOption: 'B' },
      ];
      mockStorage.setItem(TOEIC_HISTORY_SYNC_QUEUE_KEY, JSON.stringify(queuedItems));

      const retrieved = dequeueFailedSync();
      expect(retrieved.length).toBe(2);
      expect(retrieved[0].questionId).toBe('q-queue-1');
      expect(retrieved[1].questionId).toBe('q-queue-2');

      // Queue is cleared after dequeue
      expect(mockStorage.getItem(TOEIC_HISTORY_SYNC_QUEUE_KEY)).toBeNull();
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 15. Cloud Sync Helpers (Guest & Offline Resilience) ─────────────────────
  await runner.it('QHIST-16: Cloud sync helpers handle unauthenticated guest mode without throwing errors', async () => {
    setupMockBrowserEnvironment();
    try {
      // When user is not logged in (default mock), all sync helpers resolve gracefully
      await syncQuestionHistoryToSupabase([
        { questionId: 'q-cloud-1', part: 1, isCorrect: true, selectedOption: 'A' },
      ]);

      await reconcileQuestionHistoryOnLogin();
      await deleteRemotePartProgress(1);
      await flushOfflineSyncQueue();

      // No crash, operation passed cleanly
      expect(true).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 16. LocalStorage Quota Exceeded Resilience ──────────────────────────────
  await runner.it('QHIST-17: saveToeicQuestionHistory catches QuotaExceededError without crashing caller', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      // Mock setItem to simulate Safari Private Mode / QuotaExceededError
      mockStorage.setItem = () => {
        throw new Error('QuotaExceededError: The quota has been exceeded');
      };

      const storage = loadToeicQuestionHistory();
      storage.records['q-fail'] = {
        questionId: 'q-fail',
        part: 1,
        lastAnsweredAt: new Date().toISOString(),
        isCorrect: true,
        attemptCount: 1,
        selectedOption: 'A',
      };

      // Must not throw
      saveToeicQuestionHistory(storage);
      expect(true).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ── 17. Compatibility Aliases Validation ───────────────────────────────────
  await runner.it('QHIST-18: Aliases getStoredQuestionHistory, saveStoredQuestionHistory, and getQuestionHistory are functional', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      expect(getStoredQuestionHistory).toBe(loadToeicQuestionHistory);
      expect(saveStoredQuestionHistory).toBe(saveToeicQuestionHistory);
      expect(getQuestionHistory).toBe(loadToeicQuestionHistory);

      const store = getQuestionHistory();
      expect(store.version).toBe(1);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });
}

// Standalone execution runner
if (process.argv[1]?.includes('toeic-question-history.test')) {
  const runner = new TestRunner();
  runToeicQuestionHistoryTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(
      `\nTOEIC Question History Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
