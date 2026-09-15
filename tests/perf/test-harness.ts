/**
 * Performance & Regression Test Harness
 * Authoritative Test Runner, Assertion Matchers, Network Interceptor,
 * Mock Storage, Codebase AST / Static Inspector, and Bundle Metrics.
 */

import * as fs from 'fs';
import * as path from 'path';

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
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];

  describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    fn();
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
          `Expected deep equal ${negate ? 'not to match' : 'to match'}:\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = (actual as unknown as number) > expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be >' : 'to be >'} ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = (actual as unknown as number) >= expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      const pass = (actual as unknown as number) < expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be <' : 'to be <'} ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const pass = (actual as unknown as number) <= expected;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be <=' : 'to be <='} ${expected}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'to be falsy' : 'to be truthy'}`);
      }
    },
    toBeFalsy() {
      const pass = !actual;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'to be truthy' : 'to be falsy'}`);
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be null' : 'to be null'}`);
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${actual} ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toContain(expected: unknown) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(expected));
      } else if (Array.isArray(actual)) {
        pass = actual.includes(expected);
      }
      if (negate ? pass : !pass) {
        throw new Error(`Expected ${JSON.stringify(actual)} ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(expected)}`);
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex}`);
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

export function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mock Storage (SessionStorage / LocalStorage emulation)
// ──────────────────────────────────────────────────────────────────────────

export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Network Call Interceptor & Duplicate Detection
// ──────────────────────────────────────────────────────────────────────────

export interface RecordedNetworkCall {
  url: string;
  method: string;
  headers?: Record<string, string>;
  timestamp: number;
}

export class NetworkCallTracker {
  private calls: RecordedNetworkCall[] = [];

  record(url: string, method = 'GET', headers?: Record<string, string>) {
    this.calls.push({
      url,
      method,
      headers,
      timestamp: Date.now(),
    });
  }

  getCalls(): RecordedNetworkCall[] {
    return [...this.calls];
  }

  getCallCount(urlPattern: string | RegExp): number {
    return this.calls.filter((c) => {
      if (typeof urlPattern === 'string') {
        return c.url.includes(urlPattern);
      }
      return urlPattern.test(c.url);
    }).length;
  }

  getDuplicateCalls(): { url: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const call of this.calls) {
      const normalized = call.url.split('?')[0];
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    const duplicates: { url: string; count: number }[] = [];
    const entries = Array.from(counts.entries());
    for (const [url, count] of entries) {
      if (count > 1) {
        duplicates.push({ url, count });
      }
    }
    return duplicates;
  }

  reset() {
    this.calls = [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mock Supabase & Auth Environment
// ──────────────────────────────────────────────────────────────────────────

export interface MockUserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string | null;
  plan?: 'free' | 'pro' | 'cohort';
  created_at: string;
}

export interface MockGamificationStats {
  user_id: string;
  xp: number;
  streak: number;
  last_active: string;
  badges: string[];
}

export interface MockWordSummary {
  total: number;
  newCount: number;
  reviewDueCount: number;
  dueCount: number;
  classroomId?: string | null;
}

export function createMockSupabase(initialData?: {
  profile?: MockUserProfile;
  gamification?: MockGamificationStats;
  summary?: MockWordSummary;
}) {
  const tracker = new NetworkCallTracker();
  const defaultProfile: MockUserProfile = initialData?.profile ?? {
    id: 'usr-test-123',
    full_name: 'Nguyen Van A',
    email: 'test@lingopro.edu.vn',
    role: 'student',
    plan: 'free',
    created_at: '2026-01-01T00:00:00Z',
  };

  const defaultGamification: MockGamificationStats = initialData?.gamification ?? {
    user_id: defaultProfile.id,
    xp: 450,
    streak: 5,
    last_active: '2026-09-14T10:00:00Z',
    badges: ['streak-3', 'vocab-50'],
  };

  return {
    tracker,
    auth: {
      getSession: async () => {
        tracker.record('supabase.auth.getSession', 'RPC');
        return {
          data: {
            session: {
              access_token: 'mock-jwt-token-12345',
              user: {
                id: defaultProfile.id,
                email: defaultProfile.email,
              },
            },
          },
          error: null,
        };
      },
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },
    from: (table: string) => {
      return {
        select: (cols = '*') => {
          return {
            eq: (field: string, val: unknown) => {
              return {
                single: async () => {
                  tracker.record(`supabase.from('${table}').select('${cols}').eq('${field}', '${val}')`, 'SELECT');
                  if (table === 'profiles') {
                    return { data: defaultProfile, error: null };
                  }
                  if (table === 'user_gamification') {
                    return { data: defaultGamification, error: null };
                  }
                  return { data: null, error: null };
                },
              };
            },
            neq: (field: string, val: unknown) => {
              return {
                count: async () => ({ count: 0, error: null }),
              };
            },
          };
        },
      };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Codebase Static AST / Text Inspector
// ──────────────────────────────────────────────────────────────────────────

export class CodebaseInspector {
  private rootDir: string;

  constructor(rootDir = 'd:\\Vibe\\Vocab\\web-app') {
    this.rootDir = rootDir;
  }

  readFile(relativePath: string): string {
    const fullPath = path.resolve(this.rootDir, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  fileExists(relativePath: string): boolean {
    const fullPath = path.resolve(this.rootDir, relativePath);
    return fs.existsSync(fullPath);
  }

  getFileSize(relativePath: string): number {
    const fullPath = path.resolve(this.rootDir, relativePath);
    if (!fs.existsSync(fullPath)) return 0;
    return fs.statSync(fullPath).size;
  }

  hasPattern(relativePath: string, pattern: RegExp | string): boolean {
    const content = this.readFile(relativePath);
    if (typeof pattern === 'string') {
      return content.includes(pattern);
    }
    return pattern.test(content);
  }

  countOccurrences(relativePath: string, pattern: RegExp | string): number {
    const content = this.readFile(relativePath);
    if (typeof pattern === 'string') {
      return content.split(pattern).length - 1;
    }
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Bundle Analyzer & Savings Calculator
// ──────────────────────────────────────────────────────────────────────────

export interface DatasetMetric {
  path: string;
  rawSizeBytes: number;
  rawSizeFormatted: string;
  isOffloadedFromClient: boolean;
}

export function analyzeDatasets(rootDir = 'd:\\Vibe\\Vocab\\web-app'): {
  datasets: DatasetMetric[];
  totalRawBytes: number;
  totalRawMB: number;
} {
  const inspector = new CodebaseInspector(rootDir);
  const paths = [
    'src/data/listening/videos.json',
    'src/data/vocab/catalog-v3.json',
    'src/data/roadmap/vocab-stages-v1.json',
    'src/data/toeic/content-toeic-reading-v1.json',
    'src/data/toeic/content-toeic-listening-v1.json',
  ];

  let totalRawBytes = 0;
  const datasets: DatasetMetric[] = [];

  for (const p of paths) {
    const size = inspector.getFileSize(p);
    totalRawBytes += size;
    datasets.push({
      path: p,
      rawSizeBytes: size,
      rawSizeFormatted: (size / (1024 * 1024)).toFixed(2) + ' MB',
      isOffloadedFromClient: true,
    });
  }

  return {
    datasets,
    totalRawBytes,
    totalRawMB: Number((totalRawBytes / (1024 * 1024)).toFixed(2)),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// FSRS Algorithm Oracle for R4 Regression Testing
// ──────────────────────────────────────────────────────────────────────────

export function calculateFSRSInterval(stability: number, targetRetention = 0.9): number {
  const r = targetRetention;
  const interval = 9 * stability * (1 / r - 1);
  return Math.max(1, Math.round(interval));
}

export function simulateFSRSReview(currentStability: number, rating: 1 | 2 | 3 | 4): {
  newStability: number;
  newInterval: number;
} {
  let multiplier = 1.0;
  if (rating === 1) multiplier = 0.4;
  else if (rating === 2) multiplier = 1.2;
  else if (rating === 3) multiplier = 2.4;
  else if (rating === 4) multiplier = 3.8;

  const newStability = Math.max(0.4, Number((currentStability * multiplier).toFixed(2)));
  const newInterval = calculateFSRSInterval(newStability);

  return { newStability, newInterval };
}
