/**
 * E2E & Integration Test Harness for Foundational Speaking System for False Beginners.
 * Provides zero-external-dependency test runner, assertions, mock browser environment,
 * Levenshtein DP engine, SafeHarbor reference evaluator, media collision coordinator,
 * reflex latency tracker, and canonical oracle datasets for Chặng 0, 1, 2, and 3.
 */

import fs from 'node:fs';
import path from 'node:path';

// ──────────────────────────────────────────────────────────────────────────
// 1. Test Runner & Assertion Interfaces
// ──────────────────────────────────────────────────────────────────────────

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
  private suiteStartTime = Date.now();

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
    const durationMs = Date.now() - this.suiteStartTime;

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
// 2. Assertion Matchers
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
        (actual as () => void)();
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

// ──────────────────────────────────────────────────────────────────────────
// 3. Mock Browser Environment
// ──────────────────────────────────────────────────────────────────────────

export class MockSpeechRecognition {
  static activeInstances: MockSpeechRecognition[] = [];

  continuous = true;
  interimResults = true;
  lang = 'en-US';
  maxAlternatives = 1;

  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  state: 'inactive' | 'starting' | 'listening' = 'inactive';
  aborted = false;

  constructor() {
    MockSpeechRecognition.activeInstances.push(this);
  }

  start() {
    this.state = 'starting';
    this.aborted = false;
    setTimeout(() => {
      if (!this.aborted && this.state === 'starting') {
        this.state = 'listening';
        this.onstart?.();
      }
    }, 1);
  }

  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      this.onend?.();
    }, 1);
  }

  abort() {
    this.aborted = true;
    this.state = 'inactive';
    setTimeout(() => {
      this.onend?.();
    }, 1);
  }

  emitResult(transcript: string, isFinal: boolean, confidence = 0.95) {
    if (this.onresult) {
      const event = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript, confidence }], {
            isFinal,
            length: 1,
          }),
        ],
      };
      this.onresult(event);
    }
  }

  emitNativeError(error: string, message?: string) {
    if (this.onerror) {
      this.onerror({ error, message });
    }
    setTimeout(() => {
      this.onend?.();
    }, 1);
  }
}

export class MockMediaStreamTrack {
  kind = 'audio';
  enabled = true;
  readyState: 'live' | 'ended' = 'live';
  id = `mock-track-${Math.random().toString(36).substring(2, 9)}`;

  stop() {
    this.readyState = 'ended';
  }
}

export class MockMediaStream {
  private tracks: MockMediaStreamTrack[];

  constructor(tracks?: MockMediaStreamTrack[]) {
    this.tracks = tracks || [new MockMediaStreamTrack()];
  }

  getAudioTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter((t) => t.kind === 'audio');
  }

  getTracks(): MockMediaStreamTrack[] {
    return this.tracks;
  }
}

export class MockMediaRecorder {
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  stream: MockMediaStream;
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  static supportedMimes = new Set([
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/wav',
  ]);

  static isTypeSupported(mime: string): boolean {
    return MockMediaRecorder.supportedMimes.has(mime) || mime.startsWith('audio/');
  }

  constructor(stream: MockMediaStream, options?: { mimeType?: string }) {
    this.stream = stream;
    this.mimeType = options?.mimeType || 'audio/webm';
  }

  start(timeslice?: number) {
    this.state = 'recording';
    if (timeslice) {
      setTimeout(() => {
        if (this.state === 'recording' && this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['mock-audio'], { type: this.mimeType }) });
        }
      }, timeslice);
    }
  }

  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      this.onstop?.();
    }, 1);
  }
}

let originalWindow: unknown;
let originalNavigator: unknown;
let originalMediaRecorder: unknown;
let originalMediaStream: unknown;
let originalSpeechRecognition: unknown;
let originalWebkitSpeechRecognition: unknown;

export function setupMockBrowserEnvironment(): void {
  originalWindow = (global as any).window;
  originalNavigator = (global as any).navigator;
  originalMediaRecorder = (global as any).MediaRecorder;
  originalMediaStream = (global as any).MediaStream;
  originalSpeechRecognition = (global as any).SpeechRecognition;
  originalWebkitSpeechRecognition = (global as any).webkitSpeechRecognition;

  (global as any).SpeechRecognition = MockSpeechRecognition;
  (global as any).webkitSpeechRecognition = MockSpeechRecognition;
  (global as any).MediaStream = MockMediaStream;
  (global as any).MediaRecorder = MockMediaRecorder;

  const mockWindow: any = {
    location: {
      origin: 'http://localhost:3000',
      pathname: '/student/speaking/foundation',
    },
    AudioContext: class MockAudioContext {
      state = 'running';
      close() {
        this.state = 'closed';
        return Promise.resolve();
      }
    },
    speechSynthesis: {
      speaking: false,
      paused: false,
      speak: (utterance: any) => {
        utterance.onstart?.();
        setTimeout(() => utterance.onend?.(), 10);
      },
      cancel: () => {},
    },
    SpeechRecognition: MockSpeechRecognition,
    webkitSpeechRecognition: MockSpeechRecognition,
    MediaStream: MockMediaStream,
    MediaRecorder: MockMediaRecorder,
  };

  const mockNavigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MockBrowser/1.0',
    mediaDevices: {
      getUserMedia: async () => {
        return new MockMediaStream();
      },
    },
  };

  mockWindow.navigator = mockNavigator;
  (global as any).window = mockWindow;

  try {
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      configurable: true,
      writable: true,
    });
  } catch {
    (global as any).navigator = mockNavigator;
  }
}

export function teardownMockBrowserEnvironment(): void {
  if (originalWindow !== undefined) {
    (global as any).window = originalWindow;
  } else {
    delete (global as any).window;
  }
  if (originalNavigator !== undefined) {
    try {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
    } catch {
      (global as any).navigator = originalNavigator;
    }
  } else {
    try {
      delete (global as any).navigator;
    } catch {
      // Ignore if non-configurable
    }
  }
  if (originalMediaRecorder !== undefined) {
    (global as any).MediaRecorder = originalMediaRecorder;
  } else {
    delete (global as any).MediaRecorder;
  }
  if (originalMediaStream !== undefined) {
    (global as any).MediaStream = originalMediaStream;
  } else {
    delete (global as any).MediaStream;
  }
  if (originalSpeechRecognition !== undefined) {
    (global as any).SpeechRecognition = originalSpeechRecognition;
  } else {
    delete (global as any).SpeechRecognition;
  }
  if (originalWebkitSpeechRecognition !== undefined) {
    (global as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  } else {
    delete (global as any).webkitSpeechRecognition;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 4. Domain Types (PROJECT.md Interface Contracts)
// ──────────────────────────────────────────────────────────────────────────

export type {
  SpeakingStageId,
  Stage0PhoneticLesson,
  SurvivalFrame,
  LegoSlotLesson,
  ThreeBeatExpansionItem,
  MicroDialogue,
  SafeHarborResult,
  SpeakingStats,
} from '@/types/speaking-foundation';

// ──────────────────────────────────────────────────────────────────────────
// 5. Canonical Levenshtein & SafeHarbor Evaluation Engine
// ──────────────────────────────────────────────────────────────────────────

export {
  evaluateSafeHarborSpeech,
  evaluateSafeHarborSpeechDetailed,
  normalizeSpeech,
  extractContentKeywords,
  FORGIVEN_FUNCTION_WORDS,
  levenshtein,
} from '@/lib/speaking/safe-harbor-matcher';

// ──────────────────────────────────────────────────────────────────────────
// 6. Media Collision Coordinator Simulator
// ──────────────────────────────────────────────────────────────────────────

export class MediaCollisionCoordinator {
  private isVideoPlaying = false;
  private isAudioPlaying = false;
  private onVideoPauseCallback?: () => void;
  private onAudioStopCallback?: () => void;

  setVideoPauseCallback(cb: () => void) {
    this.onVideoPauseCallback = cb;
  }

  setAudioStopCallback(cb: () => void) {
    this.onAudioStopCallback = cb;
  }

  playVideo(): void {
    if (this.isAudioPlaying) {
      this.stopWordAudio();
    }
    this.isVideoPlaying = true;
  }

  pauseIpaVideo(): void {
    this.isVideoPlaying = false;
    this.onVideoPauseCallback?.();
  }

  pauseVideo(): void {
    this.pauseIpaVideo();
  }

  playWordAudio(): void {
    if (this.isVideoPlaying) {
      this.pauseIpaVideo();
    }
    this.isAudioPlaying = true;
  }

  stopWordAudio(): void {
    this.isAudioPlaying = false;
    this.onAudioStopCallback?.();
  }

  getState(): { isVideoPlaying: boolean; isAudioPlaying: boolean } {
    return {
      isVideoPlaying: this.isVideoPlaying,
      isAudioPlaying: this.isAudioPlaying,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 7. Dual-Speed Audio Controller Simulator
// ──────────────────────────────────────────────────────────────────────────

export class AudioSpeedController {
  private currentRate = 1.0;
  private pitchPreserved = true;

  setRate(rate: number): number {
    // Clamping to [0.5, 2.0]
    const clamped = Math.min(2.0, Math.max(0.5, rate));
    this.currentRate = clamped;
    return clamped;
  }

  getRate(): number {
    return this.currentRate;
  }

  isPitchPreserved(): boolean {
    return this.pitchPreserved;
  }

  setPitchPreserved(val: boolean) {
    this.pitchPreserved = val;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 8. Reflex Latency Tracker Simulator (Chặng 2)
// ──────────────────────────────────────────────────────────────────────────

export class ReflexLatencyTracker {
  private startTime: number | null = null;
  private targetMs = 1000;

  startTimer(): void {
    this.startTime = Date.now();
  }

  recordResponse(nowMs?: number): { latencyMs: number; badge: 'Fluent' | 'Good' | 'Pace Alert'; isFluent: boolean } {
    if (!this.startTime) {
      throw new Error('Reflex timer was not started');
    }
    const end = nowMs ?? Date.now();
    const latencyMs = Math.max(0, end - this.startTime);
    this.startTime = null;

    let badge: 'Fluent' | 'Good' | 'Pace Alert';
    if (latencyMs <= this.targetMs) {
      badge = 'Fluent';
    } else if (latencyMs <= 2000) {
      badge = 'Good';
    } else {
      badge = 'Pace Alert';
    }

    return {
      latencyMs,
      badge,
      isFluent: latencyMs <= this.targetMs,
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 9. Canonical Datasets (Re-exported directly from Production Sources)
// ──────────────────────────────────────────────────────────────────────────

import {
  STAGE_0_PHONETIC_LESSONS,
  STAGE_1_SURVIVAL_FRAMES,
  STAGE_2_LEGO_LESSONS,
  STAGE_3_EXPANSIONS,
  STAGE_3_MICRO_DIALOGUES,
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
  getMicroDialogues,
  getSpeakingStats,
} from '@/data/speaking/foundation';

export const CANONICAL_STAGE0_LESSONS = STAGE_0_PHONETIC_LESSONS;
export const CANONICAL_STAGE1_FRAMES = STAGE_1_SURVIVAL_FRAMES;
export const CANONICAL_STAGE2_LESSONS = STAGE_2_LEGO_LESSONS;
export const CANONICAL_STAGE3_EXPANSIONS = STAGE_3_EXPANSIONS;
export const CANONICAL_STAGE3_DIALOGUES = STAGE_3_MICRO_DIALOGUES;

export {
  getStage0Lessons,
  getSurvivalFrames,
  getLegoSlotLessons,
  getThreeBeatExpansions,
  getMicroDialogues,
  getSpeakingStats,
  STAGE_0_PHONETIC_LESSONS,
  STAGE_1_SURVIVAL_FRAMES,
  STAGE_2_LEGO_LESSONS,
  STAGE_3_EXPANSIONS,
  STAGE_3_MICRO_DIALOGUES,
};
