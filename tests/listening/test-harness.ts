/**
 * E2E & Integration Test Harness for Listening Immersion Hub.
 * Self-contained, zero-external-dependency test runner, browser environment emulator,
 * and YouTube / LocalStorage test fixtures.
 */

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
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to equal' : 'to equal'} ${JSON.stringify(expected)}`,
        );
      }
    },
    toContain(item: unknown) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(String(item));
      } else if (Array.isArray(actual)) {
        pass = actual.includes(item);
      }
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to contain' : 'to contain'} ${JSON.stringify(item)}`,
        );
      }
    },
    toMatch(regex: RegExp) {
      const pass = typeof actual === 'string' && regex.test(actual);
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected "${actual}" ${negate ? 'not to match' : 'to match'} ${regex.toString()}`,
        );
      }
    },
    toBeGreaterThan(expected: number) {
      const pass = typeof actual === 'number' && actual > expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be greater than' : 'to be greater than'} ${expected}`,
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be >=' : 'to be >='} ${expected}`,
        );
      }
    },
    toBeLessThan(expected: number) {
      const pass = typeof actual === 'number' && actual < expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be less than' : 'to be less than'} ${expected}`,
        );
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const pass = typeof actual === 'number' && actual <= expected;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${actual} ${negate ? 'not to be <=' : 'to be <='} ${expected}`,
        );
      }
    },
    toBeNull() {
      const pass = actual === null;
      if (negate ? pass : !pass) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} ${negate ? 'not to be null' : 'to be null'}`,
        );
      }
    },
    toBeDefined() {
      const pass = actual !== undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'to be undefined' : 'to be defined'}`);
      }
    },
    toBeUndefined() {
      const pass = actual === undefined;
      if (negate ? pass : !pass) {
        throw new Error(`Expected value ${negate ? 'not to be undefined' : 'to be undefined'}`);
      }
    },
    toBeTruthy() {
      const pass = Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected truthy value, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      const pass = !Boolean(actual);
      if (negate ? pass : !pass) {
        throw new Error(`Expected falsy value, got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(expected?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('Expected a function to test toThrow');
      }
      let threw = false;
      let errorMsg = '';
      try {
        (actual as Function)();
      } catch (e) {
        threw = true;
        errorMsg = e instanceof Error ? e.message : String(e);
      }
      if (negate ? threw : !threw) {
        throw new Error(
          negate
            ? 'Expected function not to throw, but it threw an error'
            : 'Expected function to throw an error, but it did not throw',
        );
      }
      if (!negate && expected) {
        if (typeof expected === 'string') {
          if (!errorMsg.includes(expected)) {
            throw new Error(
              `Expected error message to include "${expected}", but got: "${errorMsg}"`,
            );
          }
        } else if (!expected.test(errorMsg)) {
          throw new Error(
            `Expected error message to match ${expected}, but got: "${errorMsg}"`,
          );
        }
      }
    },
  });

  return {
    ...matchers(false),
    not: matchers(true),
  };
}

export async function assertRejects(
  fn: () => Promise<unknown> | unknown,
  expectedPattern?: RegExp | string,
): Promise<void> {
  let threw = false;
  let thrownError: unknown = null;
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }

  if (!threw) {
    throw new Error('Expected function to throw an error, but it succeeded.');
  }

  if (expectedPattern && thrownError) {
    const msg = thrownError instanceof Error ? thrownError.message : String(thrownError);
    if (typeof expectedPattern === 'string') {
      if (!msg.includes(expectedPattern)) {
        throw new Error(
          `Expected error message to include "${expectedPattern}", but got: "${msg}"`,
        );
      }
    } else if (!expectedPattern.test(msg)) {
      throw new Error(
        `Expected error message to match ${expectedPattern}, but got: "${msg}"`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Browser & LocalStorage Environment Emulation
// ──────────────────────────────────────────────────────────────────────────

export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

let originalWindow: unknown;
let originalLocalStorage: unknown;

export function setupMockBrowserEnvironment(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();

  originalWindow = (global as any).window;
  originalLocalStorage = (global as any).localStorage;

  (global as any).localStorage = mockStorage;
  (global as any).window = {
    localStorage: mockStorage,
    location: {
      origin: 'http://localhost:3000',
    },
  };

  return mockStorage;
}

export function teardownMockBrowserEnvironment(): void {
  if (originalWindow !== undefined) {
    (global as any).window = originalWindow;
  } else {
    delete (global as any).window;
  }

  if (originalLocalStorage !== undefined) {
    (global as any).localStorage = originalLocalStorage;
  } else {
    delete (global as any).localStorage;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// YouTube Player Instance Simulator
// ──────────────────────────────────────────────────────────────────────────

export class MockYouTubePlayer {
  private currentTime = 0;
  private playerState = -1; // -1: UNSTARTED, 1: PLAYING, 2: PAUSED, 0: ENDED
  private playbackRate = 1.0;
  private duration = 374;
  private availablePlaybackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  public onStateChangeCallback?: (state: number) => void;

  constructor(duration = 374) {
    this.duration = duration;
  }

  playVideo(): void {
    this.playerState = 1; // PLAYING
    this.onStateChangeCallback?.(1);
  }

  pauseVideo(): void {
    this.playerState = 2; // PAUSED
    this.onStateChangeCallback?.(2);
  }

  stopVideo(): void {
    this.playerState = 0; // ENDED
    this.currentTime = 0;
    this.onStateChangeCallback?.(0);
  }

  seekTo(seconds: number, allowSeekAhead = true): void {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  setCurrentTimeForTesting(seconds: number): void {
    this.currentTime = seconds;
  }

  getDuration(): number {
    return this.duration;
  }

  getPlayerState(): number {
    return this.playerState;
  }

  setPlaybackRate(suggestedRate: number): void {
    this.playbackRate = suggestedRate;
  }

  getPlaybackRate(): number {
    return this.playbackRate;
  }

  getAvailablePlaybackRates(): number[] {
    return this.availablePlaybackRates;
  }

  destroy(): void {
    this.playerState = -1;
  }
}
