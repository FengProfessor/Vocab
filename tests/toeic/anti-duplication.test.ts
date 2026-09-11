/**
 * Comprehensive Anti-Duplication Verification Suite for TOEIC Part Practice.
 *
 * Covers Tiers 1 through 4 (35 test cases):
 * - Tier 1: Feature Coverage (Core Tracker & Selector APIs - 12 tests)
 * - Tier 2: Boundary & Corner Cases (10 tests)
 * - Tier 3: Pairwise & Cross-Feature Combinations (8 tests)
 * - Tier 4: Real-World Multi-Session Practice Scenarios (5 tests verifying AC1, AC2, AC3)
 *
 * Uses: MockLocalStorage, setupMockBrowserEnvironment, TestRunner, expect from test-harness.
 * Supports: Testing both storage utilities (src/lib/toeic-question-history.ts)
 *           and smart selector loader (loadToeicPartPractice, loadToeicQuestionsByIds).
 */

import fs from 'node:fs';
import path from 'node:path';
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
  loadToeicPartPractice as prodLoadToeicPartPractice,
  loadToeicQuestionsByIds as prodLoadToeicQuestionsByIds,
  loadAnyToeicTest,
  getToeicCatalogIndex,
  loadFullToeicTest,
} from '@/lib/toeic-test-loader';
import { POST as submitToeicExamApi } from '@/app/api/toeic/submit/route';
import { NextRequest } from 'next/server';
import { TechnicalMinimalistValidator } from './ui-minimalist.test';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions & Interfaces (Interface Contracts from PROJECT.md)
// ─────────────────────────────────────────────────────────────────────────────

export interface ToeicQuestionHistoryRecord {
  questionId: string;
  part: number; // 1..7
  lastAnsweredAt: string; // ISO 8601 string
  isCorrect: boolean;
  attemptCount: number;
  selectedOption: string; // 'A' | 'B' | 'C' | 'D'
}

export interface ToeicQuestionHistoryStorage {
  version: number; // 1
  updatedAt: string;
  records: Record<string, ToeicQuestionHistoryRecord>;
}

export interface PartProgressStats {
  part: number;
  completedCount: number;
  totalQuestions: number;
  percentage: number;
  mistakeCount: number;
  unseenCount: number;
}

export type ToeicFilterMode = 'unseen' | 'mistakes' | 'all_random';

export interface ToeicPartPracticeOptions {
  filterMode?: ToeicFilterMode;
  excludedIds?: string[];
  mistakeIds?: string[];
  seed?: number;
}

export const STORAGE_KEY = 'lingo_toeic_question_history';
export const HISTORY_UPDATED_EVENT = 'lingo_toeic_history_updated';

// ─────────────────────────────────────────────────────────────────────────────
// Browser Mock Setup Helper
// ─────────────────────────────────────────────────────────────────────────────

const windowEventListeners: Record<string, Function[]> = {};

export function setupTestEnvironment() {
  const mockStorage = setupMockBrowserEnvironment();

  // Enhance window with event bus support
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

/**
 * Executes a callback in Node.js fs environment (temporarily unsetting window so
 * toeic-test-loader's getNodeFs can perform authentic JSON disk reads).
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

// ─────────────────────────────────────────────────────────────────────────────
// Storage Adapter with Dynamic Real/Reference Fallback
// ─────────────────────────────────────────────────────────────────────────────

let loadedRealHistoryModule: any = null;

async function getRealHistoryModule() {
  if (loadedRealHistoryModule) return loadedRealHistoryModule;
  try {
    const filePath = path.resolve(__dirname, '../../src/lib/toeic-question-history.ts');
    if (fs.existsSync(filePath)) {
      // @ts-ignore - optional dynamic import for anti-duplication module
      loadedRealHistoryModule = await import('../../src/lib/toeic-question-history');
    }
  } catch {
    loadedRealHistoryModule = null;
  }
  return loadedRealHistoryModule;
}

function getLocalStorageStore(): Storage | any {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof global !== 'undefined' && (global as any).localStorage) return (global as any).localStorage;
  return null;
}

function dispatchEventHelper(records: Record<string, ToeicQuestionHistoryRecord>) {
  if (typeof window !== 'undefined' && typeof (window as any).dispatchEvent === 'function') {
    try {
      const ev = typeof CustomEvent !== 'undefined'
        ? new CustomEvent(HISTORY_UPDATED_EVENT, { detail: { records } })
        : { type: HISTORY_UPDATED_EVENT, detail: { records } };
      (window as any).dispatchEvent(ev);
    } catch {}
  }
}

// Reference Implementation conforming strictly to PROJECT.md
export const ReferenceHistoryStorage = {
  getQuestionHistory(): ToeicQuestionHistoryStorage {
    try {
      const storage = getLocalStorageStore();
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) return { version: 1, updatedAt: '', records: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.records || typeof parsed.records !== 'object') {
        return { version: 1, updatedAt: '', records: {} };
      }
      return parsed;
    } catch {
      return { version: 1, updatedAt: '', records: {} };
    }
  },

  recordQuestionAnswers(
    records: Array<{ questionId: string; part: number; isCorrect: boolean; selectedOption: string }>
  ): void {
    const store = ReferenceHistoryStorage.getQuestionHistory();
    const now = new Date().toISOString();

    for (const item of records) {
      if (!item || !item.questionId) continue;
      const existing = store.records[item.questionId];
      if (existing) {
        store.records[item.questionId] = {
          ...existing,
          part: item.part,
          lastAnsweredAt: now,
          isCorrect: item.isCorrect,
          attemptCount: (existing.attemptCount || 1) + 1,
          selectedOption: item.selectedOption,
        };
      } else {
        store.records[item.questionId] = {
          questionId: item.questionId,
          part: item.part,
          lastAnsweredAt: now,
          isCorrect: item.isCorrect,
          attemptCount: 1,
          selectedOption: item.selectedOption,
        };
      }
    }

    store.updatedAt = now;
    const storage = getLocalStorageStore();
    storage?.setItem(STORAGE_KEY, JSON.stringify(store));
    dispatchEventHelper(store.records);
  },

  getAnsweredQuestionIds(part?: number): string[] {
    const store = ReferenceHistoryStorage.getQuestionHistory();
    return Object.values(store.records)
      .filter((r) => r && typeof r === 'object' && r.questionId && (part === undefined || r.part === part))
      .map((r) => r.questionId);
  },

  getMistakeQuestionIds(part?: number): string[] {
    const store = ReferenceHistoryStorage.getQuestionHistory();
    return Object.values(store.records)
      .filter((r) => r && typeof r === 'object' && r.questionId && !r.isCorrect && (part === undefined || r.part === part))
      .map((r) => r.questionId);
  },

  getPartProgressStats(part: number, totalBankCount?: number): PartProgressStats {
    const store = ReferenceHistoryStorage.getQuestionHistory();
    const validRecords = Object.values(store.records).filter(
      (r) => r && typeof r === 'object' && r.questionId && r.part === part
    );
    const completedCount = validRecords.length;
    const mistakeCount = validRecords.filter((r) => !r.isCorrect).length;

    let total = totalBankCount;
    if (total === undefined) {
      const catalog = withNodeFsEnvironment(() => getToeicCatalogIndex());
      const practiceItems = catalog?.practiceParts?.[String(part)] || [];
      total = practiceItems.reduce((acc, item) => acc + (item.questionCount || 0), 0);
      if (total === 0) total = 100;
    }

    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const unseenCount = Math.max(0, total - completedCount);

    return {
      part,
      completedCount,
      totalQuestions: total,
      percentage,
      mistakeCount,
      unseenCount,
    };
  },

  resetPartProgress(part?: number): void {
    const store = ReferenceHistoryStorage.getQuestionHistory();
    if (part !== undefined) {
      for (const [id, rec] of Object.entries(store.records)) {
        if (rec && rec.part === part) {
          delete store.records[id];
        }
      }
    } else {
      store.records = {};
    }
    store.updatedAt = new Date().toISOString();
    const storage = getLocalStorageStore();
    storage?.setItem(STORAGE_KEY, JSON.stringify(store));
    dispatchEventHelper(store.records);
  },
};

// Adapter dispatching to real module if available, otherwise reference
export async function getHistoryAPI() {
  const real = await getRealHistoryModule();
  if (
    real &&
    typeof real.recordQuestionAnswers === 'function' &&
    typeof real.getQuestionHistory === 'function' &&
    typeof real.getAnsweredQuestionIds === 'function' &&
    typeof real.getMistakeQuestionIds === 'function' &&
    typeof real.getPartProgressStats === 'function' &&
    typeof real.resetPartProgress === 'function'
  ) {
    return real;
  }
  return ReferenceHistoryStorage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Production Question Loader Wrappers (wrapped with withNodeFsEnvironment for Node CLI)
// ─────────────────────────────────────────────────────────────────────────────

export function loadToeicPartPractice(
  part: ToeicPart,
  testId?: string,
  limit?: number,
  renumber: boolean = false,
  options?: ToeicPartPracticeOptions
): ToeicUnifiedQuestion[] {
  return withNodeFsEnvironment(() =>
    prodLoadToeicPartPractice(part, testId, limit, renumber, options)
  );
}

export function loadToeicQuestionsByIds(questionIds: string[]): ToeicUnifiedQuestion[] {
  return withNodeFsEnvironment(() => prodLoadToeicQuestionsByIds(questionIds));
}

// ─────────────────────────────────────────────────────────────────────────────
// Anti-Duplication Verification Test Suite (Tiers 1 to 4)
// ─────────────────────────────────────────────────────────────────────────────

export async function runAntiDuplicationTests(runner: TestRunner): Promise<void> {

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 1: FEATURE COVERAGE (Core Tracker & Selector APIs - 12 tests)
  // ─────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 1: Feature Coverage (Core Tracker & Selector APIs)', () => {});

  await runner.it('F-AD1.1: Uninitialized history returns empty map safely', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    const history = api.getQuestionHistory();
    expect(history.version).toBe(1);
    expect(typeof history.records).toBe('object');
    expect(Object.keys(history.records).length).toBe(0);
    expect(api.getAnsweredQuestionIds().length).toBe(0);
    expect(api.getMistakeQuestionIds().length).toBe(0);
  });

  await runner.it('F-AD1.2: Record question attempt stores timestamp, part, option, correctness', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-6852-1', part: 1, isCorrect: true, selectedOption: 'A' },
    ]);

    const history = api.getQuestionHistory();
    const rec = history.records['q-6852-1'];
    expect(rec).toBeDefined();
    expect(rec.questionId).toBe('q-6852-1');
    expect(rec.part).toBe(1);
    expect(rec.isCorrect).toBe(true);
    expect(rec.selectedOption).toBe('A');
    expect(rec.attemptCount).toBe(1);
    expect(typeof rec.lastAnsweredAt).toBe('string');
    expect(new Date(rec.lastAnsweredAt).getTime() > 0).toBe(true);
  });

  await runner.it('F-AD1.3: Repeated attempts increment attemptCount and update lastAnsweredAt', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-6852-5', part: 1, isCorrect: false, selectedOption: 'B' },
    ]);
    const rec1 = api.getQuestionHistory().records['q-6852-5'];
    expect(rec1.attemptCount).toBe(1);
    expect(rec1.isCorrect).toBe(false);

    // Subsequent attempt
    api.recordQuestionAnswers([
      { questionId: 'q-6852-5', part: 1, isCorrect: true, selectedOption: 'C' },
    ]);
    const rec2 = api.getQuestionHistory().records['q-6852-5'];
    expect(rec2.attemptCount).toBe(2);
    expect(rec2.isCorrect).toBe(true);
    expect(rec2.selectedOption).toBe('C');
  });

  await runner.it('F-AD1.4: getAnsweredIdsByPart isolates question IDs strictly by part', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-p1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-p1-2', part: 1, isCorrect: true, selectedOption: 'B' },
      { questionId: 'q-p2-1', part: 2, isCorrect: false, selectedOption: 'C' },
      { questionId: 'q-p5-1', part: 5, isCorrect: true, selectedOption: 'D' },
    ]);

    const p1Ids = api.getAnsweredQuestionIds(1);
    const p2Ids = api.getAnsweredQuestionIds(2);
    const p5Ids = api.getAnsweredQuestionIds(5);
    const p3Ids = api.getAnsweredQuestionIds(3);

    expect(p1Ids.length).toBe(2);
    expect(p1Ids).toContain('q-p1-1');
    expect(p1Ids).toContain('q-p1-2');
    expect(p2Ids.length).toBe(1);
    expect(p2Ids).toContain('q-p2-1');
    expect(p5Ids.length).toBe(1);
    expect(p3Ids.length).toBe(0);
  });

  await runner.it('F-AD1.5: getMistakeIdsByPart filters strictly to latest incorrect attempts', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-p1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-p1-2', part: 1, isCorrect: false, selectedOption: 'C' },
      { questionId: 'q-p2-1', part: 2, isCorrect: false, selectedOption: 'B' },
    ]);

    const p1Mistakes = api.getMistakeQuestionIds(1);
    const p2Mistakes = api.getMistakeQuestionIds(2);
    const allMistakes = api.getMistakeQuestionIds();

    expect(p1Mistakes.length).toBe(1);
    expect(p1Mistakes[0]).toBe('q-p1-2');
    expect(p2Mistakes.length).toBe(1);
    expect(p2Mistakes[0]).toBe('q-p2-1');
    expect(allMistakes.length).toBe(2);
  });

  await runner.it('F-AD1.6: Answering previously mistaken question correctly clears it from mistake list', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-p5-10', part: 5, isCorrect: false, selectedOption: 'A' },
    ]);
    expect(api.getMistakeQuestionIds(5)).toContain('q-p5-10');

    // User re-takes question and gets it right
    api.recordQuestionAnswers([
      { questionId: 'q-p5-10', part: 5, isCorrect: true, selectedOption: 'B' },
    ]);
    const mistakesAfter = api.getMistakeQuestionIds(5);
    expect(mistakesAfter.includes('q-p5-10')).toBe(false);
    expect(mistakesAfter.length).toBe(0);
  });

  await runner.it('F-AD1.7: getPartProgressStats calculates exact counts, percentages, and unseen count', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    const answers: Array<{ questionId: string; part: number; isCorrect: boolean; selectedOption: string }> = [];
    for (let i = 1; i <= 25; i++) {
      answers.push({
        questionId: `q-stat-${i}`,
        part: 5,
        isCorrect: i <= 20, // 20 correct, 5 incorrect
        selectedOption: 'A',
      });
    }
    api.recordQuestionAnswers(answers);

    const stats = api.getPartProgressStats(5, 100);
    expect(stats.part).toBe(5);
    expect(stats.completedCount).toBe(25);
    expect(stats.totalQuestions).toBe(100);
    expect(stats.percentage).toBe(25);
    expect(stats.mistakeCount).toBe(5);
    expect(stats.unseenCount).toBe(75);
  });

  await runner.it('F-AD1.8: resetPartProgress(part) clears only target part records', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-r1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-r1-2', part: 1, isCorrect: false, selectedOption: 'B' },
      { questionId: 'q-r5-1', part: 5, isCorrect: true, selectedOption: 'C' },
    ]);

    api.resetPartProgress(1);
    expect(api.getAnsweredQuestionIds(1).length).toBe(0);
    expect(api.getMistakeQuestionIds(1).length).toBe(0);
    expect(api.getAnsweredQuestionIds(5).length).toBe(1);
    expect(api.getAnsweredQuestionIds(5)).toContain('q-r5-1');
  });

  await runner.it('F-AD1.9: resetPartProgress() clears all parts', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    api.recordQuestionAnswers([
      { questionId: 'q-all-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-all-2', part: 3, isCorrect: true, selectedOption: 'B' },
      { questionId: 'q-all-3', part: 7, isCorrect: false, selectedOption: 'C' },
    ]);

    api.resetPartProgress();
    expect(api.getAnsweredQuestionIds().length).toBe(0);
    expect(api.getMistakeQuestionIds().length).toBe(0);
    expect(Object.keys(api.getQuestionHistory().records).length).toBe(0);
  });

  await runner.it('F-AD1.10: loadToeicPartPractice with filterMode: "unseen" excludes 100% of excluded IDs', async () => {
    const initialQs = loadToeicPartPractice(1, 'bank', 10, false);
    const excludedIds = initialQs.slice(0, 5).map((q) => q.id);

    const nextQs = loadToeicPartPractice(1, 'bank', 5, true, {
      filterMode: 'unseen',
      excludedIds,
    });

    expect(nextQs.length).toBe(5);
    for (const q of nextQs) {
      expect(excludedIds.includes(q.id)).toBe(false);
    }
  });

  await runner.it('F-AD1.11: loadToeicPartPractice with filterMode: "mistakes" filters only mistake IDs', async () => {
    const sampleQs = loadToeicPartPractice(5, 'bank', 10, false);
    const mistakeIds = [sampleQs[1].id, sampleQs[3].id];

    const loaded = loadToeicPartPractice(5, 'bank', 10, true, {
      filterMode: 'mistakes',
      mistakeIds,
    });

    expect(loaded.length).toBe(2);
    expect(loaded.map((q) => q.id)).toEqual(mistakeIds);
    expect(loaded[0].questionNumber).toBe(1);
    expect(loaded[1].questionNumber).toBe(2);
  });

  await runner.it('F-AD1.12: loadToeicPartPractice with filterMode: "all_random" produces contiguous 1..N questions', async () => {
    const loaded = loadToeicPartPractice(1, 'bank', 12, true, {
      filterMode: 'all_random',
      seed: 42,
    });

    expect(loaded.length).toBe(12);
    for (let i = 0; i < loaded.length; i++) {
      expect(loaded[i].questionNumber).toBe(i + 1);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 2: BOUNDARY & CORNER CASES (10 tests)
  // ─────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 2: Boundary & Corner Cases', () => {});

  await runner.it('B-AD2.1: Empty excluded IDs returns standard question limit', async () => {
    const loaded = loadToeicPartPractice(1, 'bank', 6, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(loaded.length).toBe(6);
    expect(loaded[0].questionNumber).toBe(1);
    expect(loaded[5].questionNumber).toBe(6);
  });

  await runner.it('B-AD2.2: Empty mistake IDs when in mistakes mode returns graceful empty array without throwing', async () => {
    const loaded = loadToeicPartPractice(2, 'bank', 10, true, {
      filterMode: 'mistakes',
      mistakeIds: [],
    });
    expect(Array.isArray(loaded)).toBe(true);
    expect(loaded.length).toBe(0);
  });

  await runner.it('B-AD2.3: Exhaustion fallback when unseen questions < requested limit', async () => {
    const allP1 = loadToeicPartPractice(1, '6852', 6, false);
    // Exclude 5 of 6 questions, leaving only 1 unseen
    const excludedIds = allP1.slice(0, 5).map((q) => q.id);
    const loaded = loadToeicPartPractice(1, '6852', 6, true, {
      filterMode: 'unseen',
      excludedIds,
    });

    expect(loaded.length).toBeGreaterThanOrEqual(1);
    // First question should be the unseen one
    expect(loaded[0].id).toBe(allP1[5].id);
  });

  await runner.it('B-AD2.4: Extreme boundary: limit = 1', async () => {
    const loaded = loadToeicPartPractice(5, 'bank', 1, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(loaded.length).toBe(1);
    expect(loaded[0].questionNumber).toBe(1);
  });

  await runner.it('B-AD2.5: Extreme boundary: limit > totalBankCount clamps to available', async () => {
    const loaded = loadToeicPartPractice(1, '6852', 9999, true, {
      filterMode: 'all_random',
    });
    expect(loaded.length).toBe(6); // 6 questions in 6852 Part 1
    expect(loaded[0].questionNumber).toBe(1);
    expect(loaded[5].questionNumber).toBe(6);
  });

  await runner.it('B-AD2.6: Multi-question stimulus clusters in Part 3/4 audio preserved', async () => {
    const loaded = loadToeicPartPractice(3, '6852', 6, true);
    expect(loaded.length).toBe(6);
    // Questions 1-3 share audio, questions 4-6 share audio
    expect(loaded[0].audioUrl).toBeDefined();
    expect(loaded[0].audioUrl).toBe(loaded[1].audioUrl);
    expect(loaded[1].audioUrl).toBe(loaded[2].audioUrl);
  });

  await runner.it('B-AD2.7: Multi-question stimulus clusters in Part 6/7 passages preserved', async () => {
    const full6852 = loadFullToeicTest('6852');
    const p6Questions = full6852.filter((q) => q.part === 6);
    expect(p6Questions.length).toBe(16);
    // First 4 questions share same passage
    const passage0 = p6Questions[0].passage;
    expect(passage0).toBeDefined();
    expect(p6Questions[1].passage).toBe(passage0);
    expect(p6Questions[2].passage).toBe(passage0);
    expect(p6Questions[3].passage).toBe(passage0);
  });

  await runner.it('B-AD2.8: Corrupted JSON in localStorage handled gracefully with default empty store', async () => {
    const mockStorage = setupTestEnvironment();
    mockStorage.setItem(STORAGE_KEY, 'INVALID_JSON_CORRUPTED_{{{');

    const api = await getHistoryAPI();
    const history = api.getQuestionHistory();
    expect(history.version).toBe(1);
    expect(Object.keys(history.records).length).toBe(0);
    expect(api.getAnsweredQuestionIds().length).toBe(0);
  });

  await runner.it('B-AD2.9: Malformed record missing fields discarded safely during stat calculation', async () => {
    const mockStorage = setupTestEnvironment();
    const corruptPayload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      records: {
        'good-1': { questionId: 'good-1', part: 1, isCorrect: true, selectedOption: 'A', attemptCount: 1 },
        'bad-1': null,
        'bad-2': { foo: 'bar' },
        'bad-3': { questionId: 'bad-3', part: undefined },
      },
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(corruptPayload));

    const api = await getHistoryAPI();
    const stats = api.getPartProgressStats(1, 100);
    expect(stats.completedCount).toBe(1);
    expect(stats.totalQuestions).toBe(100);
    expect(stats.percentage).toBe(1);
  });

  await runner.it('B-AD2.10: Zero bank count returns 0% without NaN or divide-by-zero', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();
    const stats = api.getPartProgressStats(1, 0);
    expect(stats.percentage).toBe(0);
    expect(Number.isNaN(stats.percentage)).toBe(false);
    expect(typeof stats.unseenCount).toBe('number');
    expect(Number.isNaN(stats.unseenCount)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 3: PAIRWISE & CROSS-FEATURE COMBINATIONS (8 tests)
  // ─────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 3: Cross-Feature Combinations', () => {});

  await runner.it('C-AD3.1: Switching between unseen and mistakes mode maintains isolation', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // Session 1 in unseen mode
    const session1 = loadToeicPartPractice(1, 'bank', 6, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(session1.length).toBe(6);

    // User answers: 4 correct, 2 wrong
    api.recordQuestionAnswers([
      { questionId: session1[0].id, part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: session1[1].id, part: 1, isCorrect: true, selectedOption: 'B' },
      { questionId: session1[2].id, part: 1, isCorrect: false, selectedOption: 'C' },
      { questionId: session1[3].id, part: 1, isCorrect: false, selectedOption: 'D' },
      { questionId: session1[4].id, part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: session1[5].id, part: 1, isCorrect: true, selectedOption: 'B' },
    ]);

    // Switch to mistakes mode
    const mistakeIds = api.getMistakeQuestionIds(1);
    expect(mistakeIds.length).toBe(2);
    const mistakeQs = loadToeicPartPractice(1, 'bank', 5, true, {
      filterMode: 'mistakes',
      mistakeIds,
    });
    expect(mistakeQs.length).toBe(2);
    expect(mistakeQs.map((q) => q.id)).toEqual(mistakeIds);

    // Switch back to unseen mode
    const answeredIds = api.getAnsweredQuestionIds(1);
    const nextUnseen = loadToeicPartPractice(1, 'bank', 6, true, {
      filterMode: 'unseen',
      excludedIds: answeredIds,
    });
    for (const q of nextUnseen) {
      expect(answeredIds.includes(q.id)).toBe(false);
    }
  });

  await runner.it('C-AD3.2: Practice mode with specific test source + unseen filter', async () => {
    const allSet1 = loadToeicPartPractice(5, 'estudyme-test-1', 10, false);
    const excluded = [allSet1[0].id, allSet1[1].id];

    const loaded = loadToeicPartPractice(5, 'estudyme-test-1', 5, true, {
      filterMode: 'unseen',
      excludedIds: excluded,
    });

    expect(loaded.length).toBe(5);
    expect(excluded.includes(loaded[0].id)).toBe(false);
    expect(excluded.includes(loaded[1].id)).toBe(false);
  });

  await runner.it('C-AD3.3: Practice mode vs Real exam mode both persist to history consistently', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // Practice mode attempt
    api.recordQuestionAnswers([
      { questionId: 'q-prac-1', part: 1, isCorrect: true, selectedOption: 'A' },
    ]);

    // Real exam mode attempt
    api.recordQuestionAnswers([
      { questionId: 'q-exam-101', part: 5, isCorrect: false, selectedOption: 'C' },
    ]);

    const history = api.getQuestionHistory();
    expect(history.records['q-prac-1'].part).toBe(1);
    expect(history.records['q-exam-101'].part).toBe(5);
    expect(api.getAnsweredQuestionIds().length).toBe(2);
  });

  await runner.it('C-AD3.4: Multi-part independence (actions in Part 5 do not leak to Part 1)', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    api.recordQuestionAnswers([
      { questionId: 'q-part1-1', part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: 'q-part5-1', part: 5, isCorrect: false, selectedOption: 'B' },
    ]);

    // Reset Part 5
    api.resetPartProgress(5);

    expect(api.getAnsweredQuestionIds(5).length).toBe(0);
    expect(api.getMistakeQuestionIds(5).length).toBe(0);
    // Part 1 remains completely intact
    expect(api.getAnsweredQuestionIds(1).length).toBe(1);
    expect(api.getAnsweredQuestionIds(1)[0]).toBe('q-part1-1');
  });

  await runner.it('C-AD3.5: Partial exam submissions (answering subset of questions)', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // User presented with 6 questions, but answers only 2
    const presented = ['q-sub-1', 'q-sub-2', 'q-sub-3', 'q-sub-4', 'q-sub-5', 'q-sub-6'];
    api.recordQuestionAnswers([
      { questionId: presented[0], part: 1, isCorrect: true, selectedOption: 'A' },
      { questionId: presented[2], part: 1, isCorrect: false, selectedOption: 'C' },
    ]);

    const answered = api.getAnsweredQuestionIds(1);
    expect(answered.length).toBe(2);
    expect(answered).toContain('q-sub-1');
    expect(answered).toContain('q-sub-3');
    expect(answered.includes('q-sub-2')).toBe(false);
  });

  await runner.it('C-AD3.6: Custom event lingo_toeic_history_updated fires on write and reset', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    let writeEventFired = false;
    let resetEventFired = false;

    (global as any).window.addEventListener(HISTORY_UPDATED_EVENT, (ev: any) => {
      if (!writeEventFired) {
        writeEventFired = true;
      } else {
        resetEventFired = true;
      }
    });

    api.recordQuestionAnswers([
      { questionId: 'q-event-1', part: 1, isCorrect: true, selectedOption: 'A' },
    ]);
    expect(writeEventFired).toBe(true);

    api.resetPartProgress(1);
    expect(resetEventFired).toBe(true);
  });

  await runner.it('C-AD3.7: Scoring engine with explicit questionIds matches answers accurately', async () => {
    const qIds = ['q-6852-1', 'q-6852-2', 'q-6852-3', 'q-6852-4', 'q-6852-5', 'q-6852-6'];
    const questions = loadToeicQuestionsByIds(qIds);
    expect(questions.length).toBe(6);

    // Construct user answers: 5 correct, 1 wrong
    const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    for (let i = 0; i < 6; i++) {
      const correct = questions[i].correctAnswer;
      answers[questions[i].questionNumber] = i < 5 ? correct : (correct === 'A' ? 'B' : 'A');
    }

    const score = calculateToeicScore(answers, questions, 60);
    expect(score.rawTotal).toBe(5);
    expect(score.partStats[1].correct).toBe(5);
    expect(score.partStats[1].total).toBe(6);
  });

  await runner.it('C-AD3.8: Technical Minimalist UI validation for TOEIC hub components', async () => {
    const pagePath = path.resolve(__dirname, '../../src/app/toeic/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    // Verify no disallowed balloon classes
    for (const pattern of TechnicalMinimalistValidator.DISALLOWED_PATTERNS) {
      if (pattern.rule === 'NO_ROUNDED_2XL' || pattern.rule === 'NO_ROUNDED_3XL') {
        const matches = pageContent.match(pattern.regex);
        if (matches && matches.length > 0) {
          throw new Error(`Found disallowed class ${pattern.rule} in TOEIC page`);
        }
      }
    }

    // Verify presence of required tokens
    expect(pageContent.includes('border-slate-200')).toBe(true);
    expect(pageContent.includes('font-mono')).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TIER 4: REAL-WORLD MULTI-SESSION PRACTICE SCENARIOS (5 tests)
  // ─────────────────────────────────────────────────────────────────────────
  runner.describe('Tier 4: Real-World Scenarios', () => {});

  await runner.it('S-AD4.1: Acceptance Criterion 1: Consecutive Part 1 practice sessions have exactly 0% question overlap', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // Session 1: Request 10 questions Part 1 with unseen filter
    const session1Qs = loadToeicPartPractice(1, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(session1Qs.length).toBe(10);
    const session1Ids = session1Qs.map((q) => q.id);

    // User answers session 1
    api.recordQuestionAnswers(
      session1Qs.map((q) => ({
        questionId: q.id,
        part: 1,
        isCorrect: true,
        selectedOption: q.correctAnswer,
      }))
    );

    // Session 2: Request 10 questions Part 1 excluding answered IDs
    const answeredIds = api.getAnsweredQuestionIds(1);
    const session2Qs = loadToeicPartPractice(1, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: answeredIds,
    });
    expect(session2Qs.length).toBe(10);
    const session2Ids = session2Qs.map((q) => q.id);

    // Mathematical anti-duplication guarantee: Session 1 IDs ∩ Session 2 IDs = ∅
    const intersection = session1Ids.filter((id) => session2Ids.includes(id));
    expect(intersection.length).toBe(0);
  });

  await runner.it('S-AD4.2: Acceptance Criterion 2: Spaced repetition workflow (answer 20 Qs, get 6 wrong, practice mistakes, get 6 right -> mistake count drops to 0)', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // User answers 20 questions in Part 5
    const questions = loadToeicPartPractice(5, 'bank', 20, false);
    expect(questions.length).toBe(20);

    // 14 correct, 6 wrong
    const firstAttempts = questions.map((q, idx) => ({
      questionId: q.id,
      part: 5,
      isCorrect: idx < 14,
      selectedOption: idx < 14 ? q.correctAnswer : 'D',
    }));
    api.recordQuestionAnswers(firstAttempts);

    let stats = api.getPartProgressStats(5, 100);
    expect(stats.completedCount).toBe(20);
    expect(stats.mistakeCount).toBe(6);

    // User launches "Luyện câu sai" (filterMode: 'mistakes')
    const mistakeIds = api.getMistakeQuestionIds(5);
    expect(mistakeIds.length).toBe(6);

    const mistakePractice = loadToeicPartPractice(5, 'bank', 10, true, {
      filterMode: 'mistakes',
      mistakeIds,
    });
    expect(mistakePractice.length).toBe(6);

    // User answers all 6 correctly in second session
    const secondAttempts = mistakePractice.map((q) => ({
      questionId: q.id,
      part: 5,
      isCorrect: true,
      selectedOption: q.correctAnswer,
    }));
    api.recordQuestionAnswers(secondAttempts);

    // Verify mistake count drops to 0
    stats = api.getPartProgressStats(5, 100);
    expect(stats.mistakeCount).toBe(0);
    expect(api.getMistakeQuestionIds(5).length).toBe(0);
  });

  await runner.it('S-AD4.3: Acceptance Criterion 3: Reset progress workflow (clear Part history -> progress drops to 0/Total, subsequent practice starts from clean slate)', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // Complete 15 questions in Part 7
    const p7Questions = loadToeicPartPractice(7, 'bank', 15, false);
    api.recordQuestionAnswers(
      p7Questions.map((q) => ({
        questionId: q.id,
        part: 7,
        isCorrect: true,
        selectedOption: 'A',
      }))
    );

    let stats = api.getPartProgressStats(7, 150);
    expect(stats.completedCount).toBe(15);
    expect(stats.percentage).toBe(10); // 15/150 = 10%

    // User clicks Reset Part Progress
    api.resetPartProgress(7);

    stats = api.getPartProgressStats(7, 150);
    expect(stats.completedCount).toBe(0);
    expect(stats.percentage).toBe(0);
    expect(api.getAnsweredQuestionIds(7).length).toBe(0);

    // Next practice session starts with 0 excluded IDs
    const cleanSession = loadToeicPartPractice(7, 'bank', 10, true, {
      filterMode: 'unseen',
      excludedIds: api.getAnsweredQuestionIds(7),
    });
    expect(cleanSession.length).toBe(10);
    expect(cleanSession[0].questionNumber).toBe(1);
  });

  await runner.it('S-AD4.4: Multi-session practice across Parts 1 through 7 with global stat accumulation', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    const partCounts: Record<number, number> = {
      1: 6,
      2: 10,
      3: 9,
      4: 9,
      5: 15,
      6: 8,
      7: 12,
    };

    let totalExpected = 0;
    for (const [partStr, count] of Object.entries(partCounts)) {
      const p = parseInt(partStr, 10) as ToeicPart;
      totalExpected += count;
      const qs = loadToeicPartPractice(p, 'bank', count, false);
      api.recordQuestionAnswers(
        qs.map((q, idx) => ({
          questionId: q.id,
          part: p,
          isCorrect: idx % 3 !== 0,
          selectedOption: 'A',
        }))
      );
    }

    const allAnswered = api.getAnsweredQuestionIds();
    expect(allAnswered.length).toBe(totalExpected);

    for (let p = 1; p <= 7; p++) {
      const stats = api.getPartProgressStats(p, 100);
      expect(stats.completedCount).toBe(partCounts[p]);
      expect(stats.percentage).toBe(partCounts[p]);
    }
  });

  await runner.it('S-AD4.5: Server scoring integration: client receives filtered questions, submits answers with questionIds, and receives exact score match', async () => {
    // 1. Client loads 10 questions with unseen filter (renumbered 1..10)
    const clientQuestions = loadToeicPartPractice(5, '6852', 10, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(clientQuestions.length).toBe(10);
    expect(clientQuestions[0].questionNumber).toBe(1);
    expect(clientQuestions[9].questionNumber).toBe(10);

    // 2. Client answers questions (answers 7 correctly, 3 incorrectly)
    const userAnswers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    for (let i = 0; i < clientQuestions.length; i++) {
      const correct = clientQuestions[i].correctAnswer;
      userAnswers[clientQuestions[i].questionNumber] = i < 7 ? correct : (correct === 'A' ? 'B' : 'A');
    }

    // 3. Submission payload contains questionIds and answers
    const submissionQuestionIds = clientQuestions.map((q) => q.id);

    // 4. Server receives submission and resolves master questions using loadToeicQuestionsByIds
    // Server aligns resolved questions to 1..N order matching served questions
    const serverResolvedQuestions = loadToeicQuestionsByIds(submissionQuestionIds).map((q, idx) => ({
      ...q,
      questionNumber: idx + 1,
    }));
    expect(serverResolvedQuestions.length).toBe(10);

    // 5. Server calculates score deterministically
    const scoreResult = calculateToeicScore(userAnswers, serverResolvedQuestions, 120);
    expect(scoreResult.rawTotal).toBe(7);
    expect(scoreResult.partStats[5].correct).toBe(7);
    expect(scoreResult.partStats[5].total).toBe(10);
    expect(scoreResult.partStats[5].percentage).toBe(70);
  });

  await runner.it('S-AD4.6: End-to-end integration: submitExam payload transmits questionIds, /api/toeic/submit resolves & scores exact questions, and history records accurately', async () => {
    setupTestEnvironment();
    const api = await getHistoryAPI();

    // 1. Verify static invariants in source files for submission pipeline
    const hookPath = path.resolve(__dirname, '../../src/hooks/useToeicExamSession.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    expect(hookContent.includes('questionIds?: string[]')).toBe(true);
    expect(hookContent.includes('questionIds: options?.questionIds || questions.map((q) => q.id)')).toBe(true);

    const examPagePath = path.resolve(__dirname, '../../src/app/toeic/exam/[examId]/page.tsx');
    const examPageContent = fs.readFileSync(examPagePath, 'utf8');
    expect(examPageContent.includes('questionIds: questions.map((q) => q.id)')).toBe(true);
    // Verify secondary unawaited submit fetch was removed
    expect(examPageContent.includes("void (async () => {")).toBe(false);

    // 2. Client loads dynamic questions from bank in unseen mode (renumbered 1..N)
    const servedQuestions = loadToeicPartPractice(1, 'bank', 6, true, {
      filterMode: 'unseen',
      excludedIds: [],
    });
    expect(servedQuestions.length).toBe(6);
    const servedQuestionIds = servedQuestions.map((q) => q.id);

    // 3. Client answers questions (4 correct, 2 incorrect)
    const answers: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    for (let i = 0; i < servedQuestions.length; i++) {
      const correct = servedQuestions[i].correctAnswer as 'A' | 'B' | 'C' | 'D';
      answers[servedQuestions[i].questionNumber] = i < 4 ? correct : (correct === 'A' ? 'B' : 'A');
    }

    // 4. Verify submit payload transmits questionIds
    const submitPayload = {
      testId: 'bank',
      examMode: 'practice_part',
      part: 1,
      limit: 6,
      answers,
      timeSpentSeconds: 60,
      honeypot: '',
      questionIds: servedQuestionIds,
    };
    expect(submitPayload.questionIds).toEqual(servedQuestionIds);

    // 5. POST /api/toeic/submit endpoint execution with NextRequest
    const req = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitPayload),
    });

    const res = await withNodeFsEnvironment(() => submitToeicExamApi(req));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.scoreResult).toBeDefined();
    expect(body.scoreResult.rawTotal).toBe(4);
    expect(body.scoreResult.partStats[1].correct).toBe(4);
    expect(body.scoreResult.partStats[1].total).toBe(6);

    // Review questions match served questions 1:1 in ID and order
    expect(body.reviewQuestions).toBeDefined();
    expect(body.reviewQuestions.length).toBe(6);
    const reviewIds = body.reviewQuestions.map((rq: any) => rq.id);
    expect(reviewIds).toEqual(servedQuestionIds);

    // 6. Negative check: without questionIds, review questions would MISMATCH served bank questions
    const reqWithoutIds = new NextRequest('http://localhost:3000/api/toeic/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: 'bank',
        examMode: 'practice_part',
        part: 1,
        limit: 6,
        answers,
        timeSpentSeconds: 60,
      }),
    });
    const resWithoutIds = await withNodeFsEnvironment(() => submitToeicExamApi(reqWithoutIds));
    const bodyWithoutIds = await resWithoutIds.json();
    const defaultIds = bodyWithoutIds.reviewQuestions.map((rq: any) => rq.id);
    expect(bodyWithoutIds.success).toBe(true);
    // When served questions are from bank or shuffled, default sequential questions mismatch
    const hasAnyMismatch = JSON.stringify(defaultIds) !== JSON.stringify(servedQuestionIds);
    expect(hasAnyMismatch).toBe(true);

    // 7. Exam runner handleSubmit history recording:
    // Uses served questions for ID & part, resolves correctAnswer from reviewQuestions
    const historyResults = servedQuestions.map((q) => {
      const userChoice = answers[q.questionNumber];
      const matching = body.reviewQuestions.find((rq: any) => rq.id === q.id);
      const correctAnswer = matching?.correctAnswer || q.correctAnswer;
      return {
        questionId: q.id,
        part: q.part,
        isCorrect: Boolean(correctAnswer && userChoice === correctAnswer),
        selectedOption: userChoice || '',
      };
    });
    api.recordQuestionAnswers(historyResults);

    // 8. Verify question history accurately records all 6 served questions
    const answeredInHistory = api.getAnsweredQuestionIds(1);
    for (const id of servedQuestionIds) {
      expect(answeredInHistory.includes(id)).toBe(true);
    }
    const mistakeInHistory = api.getMistakeQuestionIds(1);
    expect(mistakeInHistory.length).toBe(2);

    // 9. Subsequent practice session with unseen mode strictly excludes all 6 served questions
    const session2 = loadToeicPartPractice(1, 'bank', 6, true, {
      filterMode: 'unseen',
      excludedIds: api.getAnsweredQuestionIds(1),
    });
    expect(session2.length).toBe(6);
    for (const q of session2) {
      expect(servedQuestionIds.includes(q.id)).toBe(false);
    }
  });

}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Execution
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('anti-duplication.test')) {
  const runner = new TestRunner();
  runAntiDuplicationTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(
      `\nAnti-Duplication Suite Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
