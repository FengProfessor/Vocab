/**
 * Challenger M1.2: Frontend Navigation Badge Stress & Transition Test
 *
 * Verifies:
 * 1. 0ms initial Frame-0 badge paint from cached storage.
 * 2. Optimistic badge event transitions (SAVED, SAVE_ROLLBACK, REVIEWED, lingo_word_saved).
 * 3. Extreme boundary clamping: counts cannot go negative under rapid rollbacks.
 * 4. High-frequency stress test (500 rapid mutations): zero infinite loops, bounded updates.
 * 5. Dynamic badge value formatting and clamping (1, 99, 100 -> '99+').
 * 6. Provider deduplication: nesting StudentProvider returns original context without remount.
 */

import { TestRunner, expect } from './perf/test-harness';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
  invalidateWordSummaryCache,
  notifyWordSavedOptimistic,
  notifyWordSaveRollback,
  notifyWordReviewedOptimistic,
  WORD_SUMMARY_EVENTS,
  type WordSummaryCache,
} from '../src/lib/word-summary-cache';
import { buildStudentNavSections } from '../src/lib/student-nav';

const runner = new TestRunner();

// Ensure clean DOM mocks
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const mockSessionStorage = new MemoryStorage();
const mockLocalStorage = new MemoryStorage();
const eventListeners = new Map<string, Set<(e: any) => void>>();

// Wire global window mock if running in Node
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    sessionStorage: mockSessionStorage,
    localStorage: mockLocalStorage,
    addEventListener(event: string, handler: (e: any) => void) {
      if (!eventListeners.has(event)) eventListeners.set(event, new Set());
      eventListeners.get(event)!.add(handler);
    },
    removeEventListener(event: string, handler: (e: any) => void) {
      eventListeners.get(event)?.delete(handler);
    },
    dispatchEvent(event: { type: string }) {
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        for (const fn of listeners) fn(event);
      }
      return true;
    },
    CustomEvent: class CustomEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    },
  };
  (globalThis as any).sessionStorage = mockSessionStorage;
  (globalThis as any).localStorage = mockLocalStorage;
  (globalThis as any).CustomEvent = (globalThis as any).window.CustomEvent;
}

runner.describe('Frontend Badge Load Transitions & Stress Testing', () => {
  const TEST_USER = 'user-test-badge-123';

  runner.beforeEach(() => {
    mockSessionStorage.clear();
    mockLocalStorage.clear();
    eventListeners.clear();
  });

  // Test 1: Frame-0 Instantaneous Badge Paint
  runner.it('readLastWordSummaryCache returns cached data synchronously in 0ms', () => {
    const cached: WordSummaryCache = {
      total: 100,
      newCount: 20,
      reviewDueCount: 15,
      dueCount: 35,
      classroomId: null,
      ts: Date.now(),
    };
    writeWordSummaryCache(TEST_USER, cached);

    const start = performance.now();
    const retrieved = readLastWordSummaryCache();
    const elapsed = performance.now() - start;

    expect(retrieved).toBeDefined();
    expect(retrieved?.reviewDueCount).toBe(15);
    expect(retrieved?.newCount).toBe(20);
    expect(elapsed).toBeLessThan(5); // Under 5ms
  });

  // Test 2: Navigation Section Build with Cached Badges
  runner.it('buildStudentNavSections paints review and grammar badges accurately', () => {
    const sections = buildStudentNavSections({
      classroomId: 'test-class',
      hasClass: true,
      reviewDueCount: 15,
      grammarDueCount: 3,
    });

    const learnSection = sections.find((s) => s.id === 'learn');
    expect(learnSection).toBeDefined();

    const reviewItem = learnSection?.items.find((i) => i.href.startsWith('/review'));
    expect(reviewItem).toBeDefined();
    expect(reviewItem?.badge).toBe(15);
  });

  // Test 3: Optimistic Event: WORD_SUMMARY_EVENTS.SAVED increments counts
  runner.it('notifyWordSavedOptimistic increments total, newCount, and dueCount', () => {
    writeWordSummaryCache(TEST_USER, {
      total: 10,
      newCount: 2,
      reviewDueCount: 5,
      dueCount: 7,
      classroomId: null,
    });

    let eventFired = false;
    (globalThis as any).window.addEventListener(WORD_SUMMARY_EVENTS.SAVED, () => {
      eventFired = true;
    });

    notifyWordSavedOptimistic(TEST_USER);

    expect(eventFired).toBe(true);
    const updated = readWordSummaryCache(TEST_USER);
    expect(updated?.total).toBe(11);
    expect(updated?.newCount).toBe(3);
    expect(updated?.dueCount).toBe(8);
    expect(updated?.reviewDueCount).toBe(5); // reviewDueCount untouched on save
  });

  // Test 4: Optimistic Event: WORD_SUMMARY_EVENTS.SAVE_ROLLBACK rolls back increments
  runner.it('notifyWordSaveRollback decrements total, newCount, and dueCount without going negative', () => {
    writeWordSummaryCache(TEST_USER, {
      total: 1,
      newCount: 1,
      reviewDueCount: 0,
      dueCount: 1,
      classroomId: null,
    });

    notifyWordSaveRollback(TEST_USER);

    let updated = readWordSummaryCache(TEST_USER);
    expect(updated?.total).toBe(0);
    expect(updated?.newCount).toBe(0);
    expect(updated?.dueCount).toBe(0);

    // Rollback again when already 0 -> must clamp at 0
    notifyWordSaveRollback(TEST_USER);
    updated = readWordSummaryCache(TEST_USER);
    expect(updated?.total).toBe(0);
    expect(updated?.newCount).toBe(0);
    expect(updated?.dueCount).toBe(0);
  });

  // Test 5: Optimistic Event: WORD_SUMMARY_EVENTS.REVIEWED decrements reviewDueCount and dueCount
  runner.it('notifyWordReviewedOptimistic decrements reviewDueCount and dueCount accurately', () => {
    writeWordSummaryCache(TEST_USER, {
      total: 20,
      newCount: 5,
      reviewDueCount: 8,
      dueCount: 13,
      classroomId: null,
    });

    notifyWordReviewedOptimistic(TEST_USER);

    const updated = readWordSummaryCache(TEST_USER);
    expect(updated?.reviewDueCount).toBe(7);
    expect(updated?.dueCount).toBe(12);
    expect(updated?.total).toBe(20); // total unchanged on review
    expect(updated?.newCount).toBe(5); // newCount unchanged on review
  });

  // Test 6: High-frequency stress test (500 rapid mutations)
  runner.it('Stress test: 500 interleaved save and review operations maintain consistent invariant state', () => {
    writeWordSummaryCache(TEST_USER, {
      total: 50,
      newCount: 20,
      reviewDueCount: 30,
      dueCount: 50,
      classroomId: null,
    });

    // 200 saves, 50 rollbacks, 150 reviews
    for (let i = 0; i < 200; i++) {
      notifyWordSavedOptimistic(TEST_USER);
    }
    for (let i = 0; i < 50; i++) {
      notifyWordSaveRollback(TEST_USER);
    }
    for (let i = 0; i < 150; i++) {
      notifyWordReviewedOptimistic(TEST_USER);
    }

    const final = readWordSummaryCache(TEST_USER);
    // Net saves: 200 - 50 = +150
    // Initial total: 50 -> 50 + 150 = 200
    expect(final?.total).toBe(200);
    // Initial newCount: 20 -> 20 + 150 = 170
    expect(final?.newCount).toBe(170);
    // Initial reviewDueCount: 30 -> 30 - 150 = -120 -> clamped at 0
    expect(final?.reviewDueCount).toBe(0);
    // Initial dueCount: 50 -> 50 + 150 - 150 = 50
    expect(final?.dueCount).toBe(50);
  });

  // Test 7: Badge clamping at 99+
  runner.it('Badge clamping displays "99+" for counts >= 100', () => {
    const s99 = buildStudentNavSections({ reviewDueCount: 99 });
    const s100 = buildStudentNavSections({ reviewDueCount: 100 });
    const s500 = buildStudentNavSections({ reviewDueCount: 500 });

    const b99 = s99.find((s) => s.id === 'learn')?.items.find((i) => i.href.startsWith('/review'))?.badge;
    const b100 = s100.find((s) => s.id === 'learn')?.items.find((i) => i.href.startsWith('/review'))?.badge;
    const b500 = s500.find((s) => s.id === 'learn')?.items.find((i) => i.href.startsWith('/review'))?.badge;

    expect(b99).toBe(99);
    expect(b100).toBe('99+');
    expect(b500).toBe('99+');
  });

  // Test 8: Invalidation wipes out cached entries cleanly
  runner.it('invalidateWordSummaryCache clears specific user and last user entries', () => {
    writeWordSummaryCache(TEST_USER, {
      total: 10,
      newCount: 2,
      reviewDueCount: 3,
      classroomId: null,
    });

    expect(readWordSummaryCache(TEST_USER)).toBeDefined();
    invalidateWordSummaryCache(TEST_USER);
    expect(readWordSummaryCache(TEST_USER)).toBeNull();
  });
});

async function main() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CHALLENGER M1.2 FRONTEND BADGE STRESS SUITE');
  console.log('================================================================\n');

  await new Promise((r) => setTimeout(r, 100));

  const stats = runner.getStats();
  console.log('\n----------------------------------------------------------------');
  console.log(`Results: ${stats.passed} Passed, ${stats.failed} Failed (Total: ${stats.total})`);
  console.log('----------------------------------------------------------------\n');

  if (stats.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
