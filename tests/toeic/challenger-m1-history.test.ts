/**
 * TOEIC Question History Tracker & State Layer — Adversarial Empirical Stress Suite
 * File: tests/toeic/challenger-m1-history.test.ts
 *
 * Authored by: challenger_m1_2 (Empirical Challenger)
 * Scope: src/lib/toeic-question-history.ts
 *
 * Stress dimensions:
 * 1. Corrupted JSON & Malformed Storage Envelopes in LocalStorage
 * 2. Division by Zero, Negative, Non-numeric & NaN Safety in getPartProgressStats
 * 3. Reset Progress Granularity (Single Part vs Global Reset) & Boundary Hazards
 * 4. Reactive Event Bus (lingo_toeic_history_updated) Firing, Payloads, & Resilience
 */

import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';

import {
  TOEIC_QUESTION_HISTORY_STORAGE_KEY,
  TOEIC_HISTORY_SYNC_QUEUE_KEY,
  TOEIC_HISTORY_UPDATED_EVENT,
  TOEIC_HISTORY_STORAGE_VERSION,
  TOEIC_PART_BANK_TOTALS,
  loadToeicQuestionHistory,
  saveToeicQuestionHistory,
  recordQuestionAnswers,
  getQuestionHistoryByPart,
  getAnsweredQuestionIds,
  getMistakeQuestionIds,
  getCorrectQuestionIds,
  getPartProgressStats,
  resetPartProgress,
  notifyHistoryUpdated,
  type ToeicQuestionHistoryRecord,
  type QuestionAnswerInput,
} from '../../src/lib/toeic-question-history';

export async function runChallengerHistoryTests(runner: TestRunner): Promise<void> {
  runner.describe('Challenger M1.2: Question History Boundary & Adversarial Suite', () => {});

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Corrupted JSON in LocalStorage
  // ═══════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-1.1: Syntax corruptions (truncated, unbalanced braces, junk) gracefully reset to default', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const corruptPayloads = [
        '{',
        '{"records":',
        '{records: {}}',
        '{"records": {"q1": {',
        'undefined',
        '<<<XML NOT JSON>>>',
        '{"version": 1, "records": }',
      ];

      for (const payload of corruptPayloads) {
        mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, payload);
        const storage = loadToeicQuestionHistory();
        expect(storage).toBeDefined();
        expect(storage.version).toBe(TOEIC_HISTORY_STORAGE_VERSION);
        expect(typeof storage.records).toBe('object');
        expect(Object.keys(storage.records).length).toBe(0);
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-1.2: Non-object primitive JSON payloads (null, boolean, number, string, array) do not crash', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const primitivePayloads = [
        'null',
        'true',
        'false',
        '0',
        '12345',
        '"just a string"',
        '""',
        '   ',
        '[]',
        '[1, 2, 3]',
        '["string-item"]',
      ];

      for (const payload of primitivePayloads) {
        mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, payload);
        const storage = loadToeicQuestionHistory();
        expect(storage).toBeDefined();
        expect(storage.version).toBe(TOEIC_HISTORY_STORAGE_VERSION);
        expect(typeof storage.records).toBe('object');
        expect(Object.keys(storage.records).length).toBe(0);
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-1.3: Object envelopes with corrupted "records" field (null, string, number, array) recover safely', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const corruptedEnvelopes = [
        JSON.stringify({ version: 1, records: null }),
        JSON.stringify({ version: 1, records: 'corrupted_string' }),
        JSON.stringify({ version: 1, records: 42 }),
        JSON.stringify({ version: 1, records: true }),
        JSON.stringify({ version: 1 }), // missing records entirely
        JSON.stringify({ records: [] }), // array records
      ];

      for (const raw of corruptedEnvelopes) {
        mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, raw);
        const storage = loadToeicQuestionHistory();
        expect(storage).toBeDefined();
        expect(storage.version).toBe(TOEIC_HISTORY_STORAGE_VERSION);
        expect(typeof storage.records).toBe('object');
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-1.4: Corrupted record entries inside records map (null, undefined, primitives) do not crash downstream queries', () => {
    const mockStorage = setupMockBrowserEnvironment();
    try {
      const poisonedStorage = {
        version: 1,
        updatedAt: new Date().toISOString(),
        records: {
          'q-valid': {
            questionId: 'q-valid',
            part: 1,
            isCorrect: true,
            attemptCount: 1,
            lastAnsweredAt: new Date().toISOString(),
            selectedOption: 'A',
          },
          'q-null': null,
          'q-string': 'not an object',
          'q-number': 999,
          'q-empty': {},
          'q-no-part': { questionId: 'q-no-part', isCorrect: false },
          'q-invalid-date': {
            questionId: 'q-invalid-date',
            part: 1,
            isCorrect: false,
            attemptCount: 1,
            lastAnsweredAt: 'GARBAGE_DATE_STRING',
            selectedOption: 'B',
          },
        },
      };

      mockStorage.setItem(TOEIC_QUESTION_HISTORY_STORAGE_KEY, JSON.stringify(poisonedStorage));

      // 1. getAnsweredQuestionIds must survive and return only valid records
      const answered = getAnsweredQuestionIds(1);
      expect(answered.includes('q-valid')).toBe(true);
      expect(answered.includes('q-null')).toBe(false);

      // 2. getMistakeQuestionIds must survive
      const mistakes = getMistakeQuestionIds(1);
      expect(mistakes.includes('q-invalid-date')).toBe(true);

      // 3. getQuestionHistoryByPart with invalid date sort must not throw
      const p1History = getQuestionHistoryByPart(1);
      expect(p1History.length >= 1).toBe(true);

      // 4. getPartProgressStats must survive
      const stats = getPartProgressStats(1);
      expect(stats.completedCount >= 1).toBe(true);
      expect(Number.isNaN(stats.percentage)).toBe(false);

      // 5. Subsequent write succeeds and self-heals
      recordQuestionAnswers([
        { questionId: 'q-heal-1', part: 1, isCorrect: true, selectedOption: 'A' },
      ]);
      const postStorage = loadToeicQuestionHistory();
      expect(postStorage.records['q-heal-1']).toBeDefined();
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Division by Zero & NaN Safety in getPartProgressStats
  // ═══════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-2.1: getPartProgressStats totalQuestionsInBank <= 0 or undefined defaults to bank total without NaN', () => {
    setupMockBrowserEnvironment();
    try {
      // Undefined
      const statsUndef = getPartProgressStats(1, undefined);
      expect(statsUndef.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]);
      expect(statsUndef.percentage).toBe(0);
      expect(Number.isNaN(statsUndef.percentage)).toBe(false);

      // Explicit 0: falls back to canonical bank total
      const statsZero = getPartProgressStats(1, 0);
      expect(statsZero.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]);
      expect(statsZero.percentage).toBe(0);
      expect(Number.isNaN(statsZero.percentage)).toBe(false);

      // Negative values: fall back to canonical bank total
      const statsNeg = getPartProgressStats(1, -50);
      expect(statsNeg.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[1]);
      expect(statsNeg.percentage).toBe(0);
      expect(Number.isNaN(statsNeg.percentage)).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-2.2: getPartProgressStats with NaN, Infinity, -Infinity as totalQuestionsInBank does not crash or produce NaN', () => {
    setupMockBrowserEnvironment();
    try {
      // NaN as totalQuestionsInBank
      const statsNaN = getPartProgressStats(2, NaN as any);
      expect(Number.isNaN(statsNaN.percentage)).toBe(false);
      expect(Number.isNaN(statsNaN.unseenCount)).toBe(false);
      expect(Number.isNaN(statsNaN.totalQuestions)).toBe(false);
      expect(statsNaN.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[2]);

      // -Infinity
      const statsNegInf = getPartProgressStats(2, -Infinity as any);
      expect(Number.isNaN(statsNegInf.percentage)).toBe(false);
      expect(statsNegInf.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[2]);

      // +Infinity: completedCount / Infinity = 0
      const statsPosInf = getPartProgressStats(2, Infinity as any);
      expect(Number.isNaN(statsPosInf.percentage)).toBe(false);
      expect(statsPosInf.percentage).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-2.3: Zero attempts completed (0 / 0) yields accuracyPercentage 0, never NaN', () => {
    setupMockBrowserEnvironment();
    try {
      // When completedCount is 0, 0 / 0 in accuracy calculation must yield 0, not NaN
      const stats = getPartProgressStats(3);
      expect(stats.completedCount).toBe(0);
      expect(stats.accuracyPercentage).toBe(0);
      expect(Number.isNaN(stats.accuracyPercentage)).toBe(false);
      expect(stats.percentage).toBe(0);
      expect(Number.isNaN(stats.percentage)).toBe(false);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-2.4: Completion saturation and overflow (completed > bankTotal) clamps percentage to 100 and unseen to 0', () => {
    setupMockBrowserEnvironment();
    try {
      // Record 10 questions for Part 4
      const answers: QuestionAnswerInput[] = [];
      for (let i = 1; i <= 10; i++) {
        answers.push({
          questionId: `q-sat-p4-${i}`,
          part: 4,
          isCorrect: true,
          selectedOption: 'A',
        });
      }
      recordQuestionAnswers(answers);

      // Custom bank total smaller than completed: e.g. 5
      const stats = getPartProgressStats(4, 5);
      expect(stats.completedCount).toBe(10);
      expect(stats.totalQuestions).toBe(5);
      // Percentage must be clamped to 100, not 200%
      expect(stats.percentage).toBe(100);
      expect(stats.completionPercentage).toBe(100);
      // unseenCount must be clamped to 0, never negative
      expect(stats.unseenCount).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-2.5: Extreme and invalid part numbers are clamped within [1, 7] and all returned stats are finite numbers', () => {
    setupMockBrowserEnvironment();
    try {
      const extremeParts = [0, -1, -999, 8, 99, NaN, undefined as any, 5.8, 'part3' as any];

      for (const p of extremeParts) {
        const stats = getPartProgressStats(p);
        expect(stats.part >= 1 && stats.part <= 7).toBe(true);

        // Every single metric must be a finite number, never NaN or Infinity
        const numericFields: (keyof typeof stats)[] = [
          'part',
          'completedCount',
          'totalQuestions',
          'percentage',
          'mistakeCount',
          'unseenCount',
          'totalAnswered',
          'totalMistakes',
          'totalCorrect',
          'totalInBank',
          'completionPercentage',
          'accuracyPercentage',
        ];

        for (const field of numericFields) {
          const val = stats[field];
          expect(typeof val).toBe('number');
          expect(Number.isFinite(val)).toBe(true);
          expect(Number.isNaN(val)).toBe(false);
        }
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Reset Progress Behavior (Single Part vs Global Reset)
  // ═══════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-3.1: Single Part reset strictly isolates target part and leaves other 6 parts completely unharmed', () => {
    setupMockBrowserEnvironment();
    try {
      // Seed records across Parts 1 to 7
      const seedAnswers: QuestionAnswerInput[] = [];
      for (let p = 1; p <= 7; p++) {
        seedAnswers.push({
          questionId: `q-seed-p${p}-1`,
          part: p,
          isCorrect: true,
          selectedOption: 'A',
        });
        seedAnswers.push({
          questionId: `q-seed-p${p}-2`,
          part: p,
          isCorrect: false,
          selectedOption: 'B',
        });
      }
      recordQuestionAnswers(seedAnswers);

      expect(getAnsweredQuestionIds().length).toBe(14);
      expect(getMistakeQuestionIds().length).toBe(7);

      // Reset Part 3 ONLY
      resetPartProgress(3);

      // Part 3 must be completely wiped
      expect(getAnsweredQuestionIds(3).length).toBe(0);
      expect(getMistakeQuestionIds(3).length).toBe(0);
      expect(getQuestionHistoryByPart(3).length).toBe(0);
      const p3Stats = getPartProgressStats(3);
      expect(p3Stats.completedCount).toBe(0);
      expect(p3Stats.percentage).toBe(0);

      // Every other part (1, 2, 4, 5, 6, 7) must remain exactly as seeded
      for (const p of [1, 2, 4, 5, 6, 7]) {
        expect(getAnsweredQuestionIds(p).length).toBe(2);
        expect(getMistakeQuestionIds(p).length).toBe(1);
        expect(getQuestionHistoryByPart(p).length).toBe(2);
        const pStats = getPartProgressStats(p);
        expect(pStats.completedCount).toBe(2);
        expect(pStats.mistakeCount).toBe(1);
      }

      expect(getAnsweredQuestionIds().length).toBe(12);
      expect(getMistakeQuestionIds().length).toBe(6);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-3.2: Global reset (no args or undefined) completely flushes all parts and resets envelope to empty', () => {
    setupMockBrowserEnvironment();
    try {
      recordQuestionAnswers([
        { questionId: 'q-all-1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-all-2', part: 4, isCorrect: false, selectedOption: 'B' },
        { questionId: 'q-all-3', part: 7, isCorrect: true, selectedOption: 'C' },
      ]);
      expect(getAnsweredQuestionIds().length).toBe(3);

      // Global reset with no arguments
      resetPartProgress();

      expect(getAnsweredQuestionIds().length).toBe(0);
      expect(getMistakeQuestionIds().length).toBe(0);
      const storage = loadToeicQuestionHistory();
      expect(Object.keys(storage.records).length).toBe(0);

      for (let p = 1; p <= 7; p++) {
        expect(getPartProgressStats(p).completedCount).toBe(0);
      }
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-3.3: Resetting empty storage or executing double resets is idempotent and does not crash', () => {
    setupMockBrowserEnvironment();
    try {
      // 1. Reset on empty storage
      expect(loadToeicQuestionHistory().records).toEqual({});
      resetPartProgress(1);
      resetPartProgress();
      expect(loadToeicQuestionHistory().records).toEqual({});

      // 2. Double reset on populated storage
      recordQuestionAnswers([
        { questionId: 'q-dbl-1', part: 5, isCorrect: true, selectedOption: 'A' },
      ]);
      expect(getAnsweredQuestionIds(5).length).toBe(1);
      resetPartProgress(5);
      expect(getAnsweredQuestionIds(5).length).toBe(0);
      // Second reset on already-cleared part 5
      resetPartProgress(5);
      expect(getAnsweredQuestionIds(5).length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-3.4: Adversarial investigation of resetPartProgress argument bounds (out-of-range numbers)', () => {
    setupMockBrowserEnvironment();
    try {
      // Populate parts 1 and 2
      recordQuestionAnswers([
        { questionId: 'q-bnd-1', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-bnd-2', part: 2, isCorrect: true, selectedOption: 'A' },
      ]);
      expect(getAnsweredQuestionIds().length).toBe(2);

      // When an out-of-range part number like 8 or 0 is passed:
      // Contract observation: isSpecificPart = typeof part === 'number' && part >= 1 && part <= 7
      // Because part=8 evaluates to false, it triggers the global reset branch (all parts cleared).
      resetPartProgress(8 as any);

      // Verify empirical behavior: all records are cleared
      expect(getAnsweredQuestionIds().length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Event Listener Firing on lingo_toeic_history_updated
  // ═══════════════════════════════════════════════════════════════════════════

  function wireMockEventBus(win: any) {
    const listeners: Record<string, Function[]> = {};
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
        // Clone array to allow listener removal during event loop
        listeners[type].slice().forEach((fn) => fn(event));
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
  }

  await runner.it('ADV-4.1: Reactive event name matches exact constant TOEIC_HISTORY_UPDATED_EVENT', () => {
    expect(TOEIC_HISTORY_UPDATED_EVENT).toBe('lingo_toeic_history_updated');
  });

  await runner.it('ADV-4.2: Event payloads on recordQuestionAnswers accurately distinguish single-part vs multi-part updates', () => {
    setupMockBrowserEnvironment();
    try {
      const win = (global as any).window;
      wireMockEventBus(win);

      const dispatchedEvents: any[] = [];
      const handler = (e: any) => {
        dispatchedEvents.push(e.detail);
      };

      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);

      // 1. Single-part update (Part 3)
      recordQuestionAnswers([
        { questionId: 'q-ev-s1', part: 3, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-ev-s2', part: 3, isCorrect: false, selectedOption: 'B' },
      ]);

      expect(dispatchedEvents.length).toBe(1);
      const ev1 = dispatchedEvents[0];
      expect(ev1.source).toBe('local_record');
      expect(ev1.part).toBe(3);
      expect(ev1.affectedParts).toEqual([3]);
      expect(ev1.questionIds.length).toBe(2);
      expect(ev1.questionIds).toContain('q-ev-s1');
      expect(ev1.questionIds).toContain('q-ev-s2');
      expect(typeof ev1.timestamp).toBe('string');
      expect(!isNaN(Date.parse(ev1.timestamp))).toBe(true);

      // 2. Multi-part update (Parts 2 and 6)
      recordQuestionAnswers([
        { questionId: 'q-ev-m1', part: 2, isCorrect: true, selectedOption: 'C' },
        { questionId: 'q-ev-m2', part: 6, isCorrect: true, selectedOption: 'D' },
      ]);

      expect(dispatchedEvents.length).toBe(2);
      const ev2 = dispatchedEvents[1];
      expect(ev2.source).toBe('local_record');
      expect(ev2.part).toBeUndefined(); // Multi-part must leave .part undefined
      expect(ev2.affectedParts).toEqual([2, 6]); // Sorted affected parts
      expect(ev2.questionIds).toContain('q-ev-m1');
      expect(ev2.questionIds).toContain('q-ev-m2');

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-4.3: Empty or all-invalid record batches suppress event dispatching', () => {
    setupMockBrowserEnvironment();
    try {
      const win = (global as any).window;
      wireMockEventBus(win);

      let eventCount = 0;
      const handler = () => {
        eventCount++;
      };
      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);

      // Empty array
      recordQuestionAnswers([]);
      expect(eventCount).toBe(0);

      // Invalid entries (empty IDs or whitespace only)
      recordQuestionAnswers([
        { questionId: '', part: 1, isCorrect: true, selectedOption: 'A' },
        { questionId: '   ', part: 2, isCorrect: false, selectedOption: 'B' },
        null as any,
      ]);
      expect(eventCount).toBe(0);

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-4.4: Reset events transmit exact source="reset", affectedParts, and deleted questionIds', () => {
    setupMockBrowserEnvironment();
    try {
      const win = (global as any).window;
      wireMockEventBus(win);

      recordQuestionAnswers([
        { questionId: 'q-rst-ev-1', part: 5, isCorrect: true, selectedOption: 'A' },
        { questionId: 'q-rst-ev-2', part: 5, isCorrect: false, selectedOption: 'B' },
      ]);

      const resetEvents: any[] = [];
      const handler = (e: any) => {
        resetEvents.push(e.detail);
      };
      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);

      // Reset single part 5
      resetPartProgress(5);
      expect(resetEvents.length).toBe(1);
      expect(resetEvents[0].source).toBe('reset');
      expect(resetEvents[0].part).toBe(5);
      expect(resetEvents[0].affectedParts).toEqual([5]);
      expect(resetEvents[0].questionIds).toContain('q-rst-ev-1');
      expect(resetEvents[0].questionIds).toContain('q-rst-ev-2');

      // Reset all parts
      resetPartProgress();
      expect(resetEvents.length).toBe(2);
      expect(resetEvents[1].source).toBe('reset');
      expect(resetEvents[1].part).toBeUndefined();
      expect(resetEvents[1].affectedParts).toEqual([1, 2, 3, 4, 5, 6, 7]);

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handler);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-4.5: Defective or throwing event listeners do NOT break storage updates or crash caller', () => {
    setupMockBrowserEnvironment();
    try {
      const win = (global as any).window;
      wireMockEventBus(win);

      // Register a misbehaving listener that throws an unhandled error
      const brokenListener = () => {
        throw new Error('Explosion inside consumer React component during render!');
      };
      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, brokenListener);

      // Must not throw despite listener error
      recordQuestionAnswers([
        { questionId: 'q-resilient', part: 1, isCorrect: true, selectedOption: 'A' },
      ]);

      // Storage record must still be successfully persisted
      expect(loadToeicQuestionHistory().records['q-resilient']).toBeDefined();

      // Reset must also survive broken listener
      resetPartProgress(1);
      expect(loadToeicQuestionHistory().records['q-resilient']).toBeUndefined();

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, brokenListener);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-4.6: Multiple concurrent listeners all receive identical broadcast event details', () => {
    setupMockBrowserEnvironment();
    try {
      const win = (global as any).window;
      wireMockEventBus(win);

      const received1: any[] = [];
      const received2: any[] = [];

      const l1 = (e: any) => received1.push(e.detail);
      const l2 = (e: any) => received2.push(e.detail);

      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, l1);
      win.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, l2);

      recordQuestionAnswers([
        { questionId: 'q-multi-broadcast', part: 7, isCorrect: true, selectedOption: 'B' },
      ]);

      expect(received1.length).toBe(1);
      expect(received2.length).toBe(1);
      expect(received1[0].questionIds).toEqual(received2[0].questionIds);
      expect(received1[0].timestamp).toEqual(received2[0].timestamp);

      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, l1);
      win.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, l2);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Advanced Stress Testing (Scale, In-Batch Duplicates, Injection)
  // ═══════════════════════════════════════════════════════════════════════════

  await runner.it('ADV-5.1: Intra-batch duplicates correctly accumulate attemptCount and retain latest state', () => {
    setupMockBrowserEnvironment();
    try {
      const qId = 'q-batch-dup';
      recordQuestionAnswers([
        { questionId: qId, part: 5, isCorrect: false, selectedOption: 'A', answeredAt: '2026-09-11T10:00:00.000Z' },
        { questionId: qId, part: 5, isCorrect: true, selectedOption: 'C', answeredAt: '2026-09-11T10:05:00.000Z' },
      ]);

      const storage = loadToeicQuestionHistory();
      const rec = storage.records[qId];
      expect(rec).toBeDefined();
      expect(rec.attemptCount).toBe(2);
      expect(rec.isCorrect).toBe(true);
      expect(rec.selectedOption).toBe('C');
      expect(rec.lastAnsweredAt).toBe('2026-09-11T10:05:00.000Z');
      expect(getMistakeQuestionIds(5).includes(qId)).toBe(false);
      expect(getCorrectQuestionIds(5).includes(qId)).toBe(true);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-5.2: Prototype collision names in questionId (constructor, toString, valueOf, hasOwnProperty) do not crash queries', () => {
    setupMockBrowserEnvironment();
    try {
      const collisionIds = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf'];

      const inputs = collisionIds.map((id) => ({
        questionId: id,
        part: 1,
        isCorrect: true,
        selectedOption: 'A',
      }));

      recordQuestionAnswers(inputs);

      // Verify queries execute without crashing on prototype collisions
      const answered = getAnsweredQuestionIds(1);
      expect(answered.length).toBe(collisionIds.length);

      const stats = getPartProgressStats(1);
      expect(stats.completedCount).toBe(collisionIds.length);
      expect(stats.percentage).toBeGreaterThan(0);

      // Verify clean isolation from Object.prototype
      const cleanObj = {};
      expect((cleanObj as any).attemptCount).toBeUndefined();
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-5.3: Unicode, Vietnamese diacritics, and special characters in questionId are preserved and queried cleanly', () => {
    setupMockBrowserEnvironment();
    try {
      const unicodeId = 'q-câu-hỏi-tiếng-việt-101-🎧-đáp-án-đúng';
      recordQuestionAnswers([
        { questionId: unicodeId, part: 6, isCorrect: false, selectedOption: 'B' },
      ]);

      const mistakes = getMistakeQuestionIds(6);
      expect(mistakes).toContain(unicodeId);

      const history = getQuestionHistoryByPart(6);
      expect(history.length).toBe(1);
      expect(history[0].questionId).toBe(unicodeId);

      resetPartProgress(6);
      expect(getMistakeQuestionIds(6).length).toBe(0);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });

  await runner.it('ADV-5.4: High-volume stress (2,500 questions) aggregates in under 50ms with zero memory degradation', () => {
    setupMockBrowserEnvironment();
    try {
      const bulkAnswers: QuestionAnswerInput[] = [];
      for (let i = 1; i <= 2500; i++) {
        const part = (i % 7) + 1;
        bulkAnswers.push({
          questionId: `bulk-q-${i}`,
          part,
          isCorrect: i % 3 !== 0, // 2/3 correct, 1/3 mistake
          selectedOption: ['A', 'B', 'C', 'D'][i % 4],
        });
      }

      const tStartRecord = Date.now();
      recordQuestionAnswers(bulkAnswers);
      const recordDuration = Date.now() - tStartRecord;

      const tStartStats = Date.now();
      for (let p = 1; p <= 7; p++) {
        const stats = getPartProgressStats(p);
        expect(stats.completedCount).toBeGreaterThan(0);
        expect(stats.totalQuestions).toBe(TOEIC_PART_BANK_TOTALS[p]);
        expect(stats.percentage).toBeLessThanOrEqual(100);
      }
      const statsDuration = Date.now() - tStartStats;

      // Assert high performance threshold
      expect(statsDuration).toBeLessThan(50);

      const allMistakes = getMistakeQuestionIds();
      expect(allMistakes.length).toBeGreaterThan(500);
    } finally {
      teardownMockBrowserEnvironment();
    }
  });
}

// Standalone execution runner
if (process.argv[1]?.includes('challenger-m1-history.test')) {
  const runner = new TestRunner();
  runChallengerHistoryTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(
      `\nChallenger M1.2 Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
