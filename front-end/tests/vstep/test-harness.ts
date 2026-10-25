/**
 * VSTEP Test Harness & Verification Utilities
 * Zero-dependency Test Runner, Assertion Matchers, Mock Browser Environment,
 * and Authoritative MOET Scoring Oracle.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

export interface SuiteStats {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export class TestRunner {
  private currentSuite = 'VSTEP Test Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];

  async describe(name: string, fn: () => Promise<void> | void): Promise<void> {
    this.currentSuite = name;
    await fn();
  }

  beforeEach(fn: () => Promise<void> | void) {
    this.beforeHooks.push(fn);
  }

  afterEach(fn: () => Promise<void> | void) {
    this.afterHooks.push(fn);
  }

  async it(name: string, fn: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    for (const hook of this.beforeHooks) {
      await hook();
    }

    try {
      await fn();
      const durationMs = Date.now() - start;
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        durationMs,
      });
      console.log(`  [PASS] ${name} (${durationMs}ms)`);
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const error = err instanceof Error ? err : new Error(String(err));
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        durationMs,
        error,
      });
      console.error(`  [FAIL] ${name} (${durationMs}ms) -> ${error.message}`);
    } finally {
      for (const hook of this.afterHooks) {
        await hook();
      }
    }
  }

  getStats(): SuiteStats {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;
    const durationMs = this.results.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      suiteName: this.currentSuite,
      total,
      passed,
      failed,
      durationMs,
      results: this.results,
    };
  }

  clear() {
    this.results = [];
    this.beforeHooks = [];
    this.afterHooks = [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Expect & Assertion Matchers
// ──────────────────────────────────────────────────────────────────────────

export function expect<T>(actual: T) {
  const matchers = (negate: boolean) => ({
    toBe(expected: unknown) {
      const pass = actual === expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be' : 'to be'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toEqual(expected: unknown) {
      const pass = JSON.stringify(actual) === JSON.stringify(expected);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected deep equal: actual ${JSON.stringify(actual)} ${negate ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to be truthy' : 'to be truthy'}`);
      }
    },
    toBeFalsy() {
      const pass = !actual;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to be falsy' : 'to be falsy'}`);
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to be defined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to be null' : 'to be null'}`);
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = typeof actual === 'number' && actual > expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be >' : 'to be >'} ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      const pass = typeof actual === 'number' && actual < expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be <' : 'to be <'} ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual <= expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be <=' : 'to be <='} ${expected}`);
      }
    },
    toBeCloseTo(expected: number, delta = 0.001) {
      const pass = typeof actual === 'number' && Math.abs(actual - expected) <= delta;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be within' : 'to be within'} ${delta} of ${expected}`);
      }
    },
    toContain(expected: unknown) {
      let pass = false;
      if (typeof actual === 'string' && typeof expected === 'string') {
        pass = actual.includes(expected);
      } else if (Array.isArray(actual)) {
        pass = actual.includes(expected);
      } else if (actual instanceof Set) {
        pass = actual.has(expected);
      }
      if (negate ? pass : !pass) {
        throw new Error(`Expected collection ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(expected)}`);
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex}`);
      }
    },
    toThrow(expectedSubstring?: string) {
      if (typeof actual !== 'function') {
        throw new Error(`Expected a function to test exception throwing, received ${typeof actual}`);
      }
      let threw = false;
      let errorMsg = '';
      try {
        (actual as () => unknown)();
      } catch (e: unknown) {
        threw = true;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
      if (negate ? threw : !threw) {
        throw new Error(`Expected function ${negate ? 'not to throw' : 'to throw'}, but it did${threw ? '' : ' not'}`);
      }
      if (threw && expectedSubstring && !errorMsg.includes(expectedSubstring)) {
        throw new Error(`Expected thrown message to contain "${expectedSubstring}", received "${errorMsg}"`);
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Browser Mocking & Mock LocalStorage
// ──────────────────────────────────────────────────────────────────────────

export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }
}

let originalLocalStorage: any = undefined;
let originalWindow: any = undefined;

export function setupMockBrowserEnvironment(): { localStorage: MockLocalStorage } {
  const mockStorage = new MockLocalStorage();

  if (typeof global !== 'undefined') {
    originalLocalStorage = (global as any).localStorage;
    originalWindow = (global as any).window;

    (global as any).localStorage = mockStorage;
    (global as any).window = {
      localStorage: mockStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };
  }

  return { localStorage: mockStorage };
}

export function teardownMockBrowserEnvironment(): void {
  if (typeof global !== 'undefined') {
    (global as any).localStorage = originalLocalStorage;
    (global as any).window = originalWindow;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Authoritative MOET Oracle Calculations
// ──────────────────────────────────────────────────────────────────────────

export function oracleMoetRound(score: number): number {
  if (score <= 0) return 0;
  if (score >= 10) return 10;
  const integerPart = Math.floor(score);
  const decimalPart = score - integerPart;
  if (decimalPart < 0.25) {
    return integerPart;
  } else if (decimalPart < 0.75) {
    return integerPart + 0.5;
  } else {
    return integerPart + 1.0;
  }
}

export function oracleCefrLevel(overallScore: number): 'A2' | 'B1' | 'B2' | 'C1' {
  if (overallScore >= 8.5) return 'C1';
  if (overallScore >= 6.0) return 'B2';
  if (overallScore >= 4.0) return 'B1';
  return 'A2';
}

export function oracleListeningScore(correctCount: number, total = 35): number {
  if (total <= 0) return 0;
  const clamped = Math.max(0, Math.min(correctCount, total));
  return oracleMoetRound((clamped / total) * 10);
}

export function oracleReadingScore(correctCount: number, total = 40): number {
  if (total <= 0) return 0;
  const clamped = Math.max(0, Math.min(correctCount, total));
  return oracleMoetRound((clamped / total) * 10);
}

export function oracleCompositeScore(scores: number[]): { overallScore: number; cefrLevel: 'A2' | 'B1' | 'B2' | 'C1' } {
  if (scores.length === 0) {
    return { overallScore: 0, cefrLevel: 'A2' };
  }
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const overallScore = oracleMoetRound(avg);
  return {
    overallScore,
    cefrLevel: oracleCefrLevel(overallScore),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Project Paths
// ──────────────────────────────────────────────────────────────────────────

export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const VSTEP_DATA_DIR = path.resolve(PROJECT_ROOT, 'src/data/vstep');
export const VSTEP_CATALOG_INDEX_PATH = path.resolve(VSTEP_DATA_DIR, 'vstep-catalog-index.json');
export const VSTEP_TESTS_DIR = path.resolve(VSTEP_DATA_DIR, 'tests');
export const VSTEP_PRACTICE_DIR = path.resolve(VSTEP_DATA_DIR, 'practice');
export const VSTEP_EXPLORER_MOCK_MANIFEST = path.resolve(PROJECT_ROOT, '.agents/explorer_survey_1/exam-mock-manifest.json');
export const VSTEP_EXPLORER_LISTENING_MANIFEST = path.resolve(PROJECT_ROOT, '.agents/explorer_survey_1/exam-listening-manifest.json');
