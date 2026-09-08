/**
 * TOEIC Real Exam Simulation Test Harness
 * Authoritative Test Runner, Assertion Matchers, ETS Barem Oracle,
 * Data Loader & Normalizer, and Exam Session Simulator.
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
  let errorMsg = '';
  try {
    await fn();
  } catch (e) {
    threw = true;
    errorMsg = e instanceof Error ? e.message : String(e);
  }

  if (!threw) {
    throw new Error('Expected async function to throw an error, but it resolved.');
  }

  if (expectedPattern) {
    if (typeof expectedPattern === 'string') {
      if (!errorMsg.includes(expectedPattern)) {
        throw new Error(
          `Expected rejection error to include "${expectedPattern}", got "${errorMsg}"`,
        );
      }
    } else if (!expectedPattern.test(errorMsg)) {
      throw new Error(
        `Expected rejection error to match pattern ${expectedPattern}, got "${errorMsg}"`,
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Mock Browser Environment & LocalStorage
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
    return keys[index] || null;
  }
}

let originalLocalStorage: any = undefined;
let originalWindow: any = undefined;

export function setupMockBrowserEnvironment(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();

  if (typeof global !== 'undefined') {
    originalLocalStorage = (global as any).localStorage;
    originalWindow = (global as any).window;

    (global as any).localStorage = mockStorage;
    (global as any).window = {
      localStorage: mockStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  return mockStorage;
}

export function teardownMockBrowserEnvironment(): void {
  if (typeof global !== 'undefined') {
    (global as any).localStorage = originalLocalStorage;
    (global as any).window = originalWindow;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Official ETS 10–990 Barem Tables (Canonical Oracle)
// ──────────────────────────────────────────────────────────────────────────

export const ETS_LISTENING_BAREM: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70,
  75, 80, 85, 90, 95, 100, 110, 115, 120, 125, 130, 135, 140, 145, 150, 160,
  165, 170, 175, 180, 185, 190, 195, 200, 210, 215, 220, 230, 240, 245, 250,
  255, 260, 270, 275, 280, 290, 295, 300, 310, 315, 320, 325, 330, 335, 340,
  345, 350, 360, 365, 370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420,
  425, 430, 435, 440, 445, 450, 455, 460, 465, 470, 475, 480, 485, 490, 495,
  495, 495, 495, 495, 495,
] as const;

export const ETS_READING_BAREM: readonly number[] = [
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135,
  140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 210, 215,
  220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290,
  295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355, 360, 365,
  370, 375, 380, 385, 390, 395, 400, 405, 410, 415, 420, 425, 430, 435, 445,
  455, 465, 475, 485, 495,
] as const;

export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ToeicSection = 'listening' | 'reading';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface ToeicUnifiedQuestion {
  id: string;
  testId: string;
  questionNumber: number; // 1 to 200
  part: ToeicPart;
  section: ToeicSection;
  prompt?: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  audioUrl?: string;
  imageUrl?: string;
  passage?: string;
  explanationVi?: string;
  transcript?: string;
}

export interface ToeicScoreResult {
  rawListening: number;
  rawReading: number;
  rawTotal: number;
  scaledListening: number; // 5 - 495
  scaledReading: number; // 5 - 495
  scaledTotal: number; // 10 - 990
  cefrLevel: CefrLevel;
  partStats: Record<ToeicPart, { total: number; correct: number; percentage: number }> & {
    [key: number]: { total: number; correct: number; percentage: number };
  };
  timeSpentSeconds: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Scoring & Conversion Functions
// ──────────────────────────────────────────────────────────────────────────

export function getScaledListeningScore(raw: number): number {
  const clampLC = Math.max(0, Math.min(100, Math.round(raw)));
  return ETS_LISTENING_BAREM[clampLC];
}

export function getScaledReadingScore(raw: number): number {
  const clampRC = Math.max(0, Math.min(100, Math.round(raw)));
  return ETS_READING_BAREM[clampRC];
}

export function getCefrLevel(totalScaled: number): CefrLevel {
  if (totalScaled >= 905) return 'C1';
  if (totalScaled >= 785) return 'B2';
  if (totalScaled >= 605) return 'B2';
  if (totalScaled >= 405) return 'B1';
  if (totalScaled >= 255) return 'A2';
  return 'A1';
}

export function calculateToeicScore(
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>,
  questions: ToeicUnifiedQuestion[],
  timeSpentSeconds: number = 0,
): ToeicScoreResult {
  let rawListening = 0;
  let rawReading = 0;

  const partStats: Record<ToeicPart, { total: number; correct: number; percentage: number }> = {
    1: { total: 0, correct: 0, percentage: 0 },
    2: { total: 0, correct: 0, percentage: 0 },
    3: { total: 0, correct: 0, percentage: 0 },
    4: { total: 0, correct: 0, percentage: 0 },
    5: { total: 0, correct: 0, percentage: 0 },
    6: { total: 0, correct: 0, percentage: 0 },
    7: { total: 0, correct: 0, percentage: 0 },
  };

  for (const q of questions) {
    const part = q.part;
    partStats[part].total += 1;

    const userAnswer = answers[q.questionNumber];
    const isCorrect = userAnswer === q.correctAnswer;

    if (isCorrect) {
      partStats[part].correct += 1;
      if (q.section === 'listening') {
        rawListening += 1;
      } else {
        rawReading += 1;
      }
    }
  }

  for (let p = 1; p <= 7; p++) {
    const part = p as ToeicPart;
    const stat = partStats[part];
    stat.percentage = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
  }

  const scaledListening = getScaledListeningScore(rawListening);
  const scaledReading = getScaledReadingScore(rawReading);
  const scaledTotal = scaledListening + scaledReading;
  const cefrLevel = getCefrLevel(scaledTotal);

  return {
    rawListening,
    rawReading,
    rawTotal: rawListening + rawReading,
    scaledListening,
    scaledReading,
    scaledTotal,
    cefrLevel,
    partStats,
    timeSpentSeconds,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Media Resolution & Audio Grouping Formulas
// ──────────────────────────────────────────────────────────────────────────

export function resolveToeicMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('//')) {
    return `https:${path}`;
  }
  if (path.startsWith('/media/')) {
    return `https://s4-media1.study4.com${path}`;
  }
  return path;
}

export function computeAudioGroupIndex(part: 3 | 4, qnum: number): number {
  if (part === 3) {
    return Math.floor((qnum - 32) / 3);
  }
  if (part === 4) {
    return Math.floor((qnum - 71) / 3);
  }
  throw new Error(`Part ${part} does not use 3-question audio clustering`);
}

// ──────────────────────────────────────────────────────────────────────────
// Authentic Test Loader & Normalizer
// ──────────────────────────────────────────────────────────────────────────

const ROOT_DIR = path.resolve(__dirname, '../..');
export const LISTENING_DATA_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-listening-v1.json');
export const READING_DATA_PATH = path.resolve(ROOT_DIR, 'src/data/toeic/content-toeic-reading-v1.json');
export const CRAWLER_TESTS_DIR = path.resolve(ROOT_DIR, 'crawlers/toeic/toeic_data');

export interface RawCrawlerTest {
  test_id: string;
  title: string;
  parts: Record<string, {
    questions?: any[];
    groups?: any[];
    audios?: string[];
  }>;
}

export function loadAuthenticCrawlerTest(testId: string): RawCrawlerTest {
  const filePath = path.resolve(CRAWLER_TESTS_DIR, `study4_test_${testId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Test file study4_test_${testId}.json not found at ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function assembleUnified200QTest(testId: string): ToeicUnifiedQuestion[] {
  const raw = loadAuthenticCrawlerTest(testId);
  const questions: ToeicUnifiedQuestion[] = [];

  const getPart = (num: number) => raw.parts[`part_${num}`] || raw.parts[`part${num}`] || { questions: [], groups: [] };

  const p1 = getPart(1);
  const p2 = getPart(2);
  const p3 = getPart(3);
  const p4 = getPart(4);
  const p5 = getPart(5);
  const p6 = getPart(6);
  const p7 = getPart(7);

  // Map passages from groups for Part 6 and 7
  const passageMap = new Map<string, string>();
  for (const part of [p6, p7]) {
    if (part.groups) {
      for (const g of part.groups) {
        if (g.passage && g.questions) {
          for (const subQ of g.questions) {
            passageMap.set(String(subQ.qnum), g.passage);
          }
        }
      }
    }
  }

  // Part 1: Q1 - Q6 (6 questions, 4 options, photographs)
  if (p1 && p1.questions) {
    p1.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 1);
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 1,
        section: 'listening',
        prompt: q.prompt || q.text || 'Look at the photograph and choose the best statement.',
        options: (q.options || ['A.', 'B.', 'C.', 'D.']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        audioUrl: resolveToeicMediaUrl(q.audio_url || q.audio),
        imageUrl: resolveToeicMediaUrl(q.image_url || q.image),
        explanationVi: q.explanation_vi || q.explain,
      });
    });
  }

  // Part 2: Q7 - Q31 (25 questions, exactly 3 options A/B/C)
  if (p2 && p2.questions) {
    p2.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 7);
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 2,
        section: 'listening',
        prompt: q.prompt || q.text || 'Mark your answer on your answer sheet.',
        options: (q.options || ['A.', 'B.', 'C.']).slice(0, 3).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C'][optIdx] || 'A') as 'A' | 'B' | 'C',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        audioUrl: resolveToeicMediaUrl(q.audio_url || q.audio),
        explanationVi: q.explanation_vi || q.explain,
      });
    });
  }

  // Explanation enrichment from content-toeic-reading-v1.json
  const explainMap = new Map<number, string>();
  try {
    if (fs.existsSync(READING_DATA_PATH)) {
      const readingData = JSON.parse(fs.readFileSync(READING_DATA_PATH, 'utf-8'));
      if (readingData.part5) {
        readingData.part5.forEach((item: any, idx: number) => {
          if (item.explain) explainMap.set(idx + 101, item.explain);
        });
      }
      if (readingData.part6) {
        let qIdx = 131;
        for (const item of readingData.part6) {
          if (item.blanks) {
            for (const b of item.blanks) {
              if (b.explain && qIdx <= 146) {
                explainMap.set(qIdx, b.explain);
                qIdx++;
              }
            }
          }
        }
      }
      if (readingData.part7_single) {
        let qIdx = 147;
        for (const item of readingData.part7_single) {
          if (item.questions) {
            for (const subQ of item.questions) {
              if (subQ.explain && qIdx <= 200) {
                explainMap.set(qIdx, subQ.explain);
                qIdx++;
              }
            }
          }
        }
      }
    }
  } catch {}

  // Part 3: Q32 - Q70 (39 questions = 13 clusters of 3 questions)
  const p3Audios: string[] = [];
  if (p3?.questions) {
    for (const q of p3.questions) {
      if (q.audio_url && !p3Audios.includes(q.audio_url)) {
        p3Audios.push(q.audio_url);
      }
    }
  }
  if (p3 && p3.questions) {
    p3.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 32);
      const groupIdx = Math.floor(idx / 3);
      const audioUrl = p3Audios[groupIdx] || q.audio_url || q.audio;
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 3,
        section: 'listening',
        prompt: q.prompt || q.text || q.question || '',
        options: (q.options || ['(A)', '(B)', '(C)', '(D)']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        audioUrl: resolveToeicMediaUrl(audioUrl),
        imageUrl: resolveToeicMediaUrl(q.graphic_url || q.image_url),
        explanationVi: q.explanation_vi || q.explain,
        transcript: q.transcript,
      });
    });
  }

  // Part 4: Q71 - Q100 (30 questions = 10 clusters of 3 questions)
  const p4Audios: string[] = [];
  if (p4?.questions) {
    for (const q of p4.questions) {
      if (q.audio_url && !p4Audios.includes(q.audio_url)) {
        p4Audios.push(q.audio_url);
      }
    }
  }
  if (p4 && p4.questions) {
    p4.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 71);
      const groupIdx = Math.floor(idx / 3);
      const audioUrl = p4Audios[groupIdx] || q.audio_url || q.audio;
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 4,
        section: 'listening',
        prompt: q.prompt || q.text || q.question || '',
        options: (q.options || ['(A)', '(B)', '(C)', '(D)']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        audioUrl: resolveToeicMediaUrl(audioUrl),
        imageUrl: resolveToeicMediaUrl(q.graphic_url || q.image_url),
        explanationVi: q.explanation_vi || q.explain,
        transcript: q.transcript,
      });
    });
  }

  // Part 5: Q101 - Q130 (30 incomplete sentences)
  if (p5 && p5.questions) {
    p5.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 101);
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 5,
        section: 'reading',
        prompt: q.sentence || q.prompt || q.text || q.question,
        options: (q.options || ['(A)', '(B)', '(C)', '(D)']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        explanationVi: q.explanation_vi || q.explain || explainMap.get(qnum),
      });
    });
  }

  // Part 6: Q131 - Q146 (16 text completion questions = 4 passages x 4 questions)
  if (p6 && p6.questions) {
    p6.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 131);
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 6,
        section: 'reading',
        prompt: q.prompt || q.text || `Blank (${qnum})`,
        passage: q.passage || passageMap.get(String(qnum)),
        options: (q.options || ['(A)', '(B)', '(C)', '(D)']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        explanationVi: q.explanation_vi || q.explain || explainMap.get(qnum),
      });
    });
  }

  // Part 7: Q147 - Q200 (54 reading comprehension questions)
  if (p7 && p7.questions) {
    p7.questions.forEach((q: any, idx: number) => {
      const qnum = parseInt(q.qnum, 10) || (idx + 147);
      questions.push({
        id: `q-${testId}-${qnum}`,
        testId,
        questionNumber: qnum,
        part: 7,
        section: 'reading',
        prompt: q.prompt || q.text || q.question,
        passage: q.passage || (Array.isArray(q.passages) ? q.passages.join('\n\n') : passageMap.get(String(qnum))),
        options: (q.options || ['(A)', '(B)', '(C)', '(D)']).map((optText: string, optIdx: number) => ({
          key: (['A', 'B', 'C', 'D'][optIdx] || 'A') as 'A' | 'B' | 'C' | 'D',
          text: optText,
        })),
        correctAnswer: (q.correct_answer || q.answer || 'A').toUpperCase() as any,
        explanationVi: q.explanation_vi || q.explain || explainMap.get(qnum),
      });
    });
  }

  // Sort questions by questionNumber ascending to ensure exact 1 to 200 sequence
  questions.sort((a, b) => a.questionNumber - b.questionNumber);
  return questions;
}

// ──────────────────────────────────────────────────────────────────────────
// Exam Session State Machine Simulation
// ──────────────────────────────────────────────────────────────────────────

export type PaletteQuestionState = 'unanswered' | 'answered' | 'current' | 'flagged';

export interface ExamSessionConfig {
  examId: string;
  mode: 'real_exam' | 'practice_part';
  totalQuestions: number;
  timeLimitSeconds: number; // e.g., 7200 for 120 mins
  practicePart?: ToeicPart;
}

export interface ExamSessionState {
  examId: string;
  mode: 'real_exam' | 'practice_part';
  totalQuestions: number;
  timeRemainingSeconds: number;
  currentQuestionNumber: number; // 1 to totalQuestions
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  flaggedQuestions: Set<number>;
  isPaused: boolean;
  isSubmitted: boolean;
  scoreResult?: ToeicScoreResult;
}

export function createExamSession(config: ExamSessionConfig): ExamSessionState {
  return {
    examId: config.examId,
    mode: config.mode,
    totalQuestions: config.totalQuestions,
    timeRemainingSeconds: config.timeLimitSeconds,
    currentQuestionNumber: 1,
    answers: {},
    flaggedQuestions: new Set<number>(),
    isPaused: false,
    isSubmitted: false,
  };
}

export function selectOption(
  session: ExamSessionState,
  qnum: number,
  option: 'A' | 'B' | 'C' | 'D',
): ExamSessionState {
  if (session.isSubmitted || session.isPaused) return session;
  if (qnum < 1 || qnum > 200) return session;

  return {
    ...session,
    answers: {
      ...session.answers,
      [qnum]: option,
    },
  };
}

export function toggleFlag(session: ExamSessionState, qnum: number): ExamSessionState {
  if (session.isSubmitted) return session;
  if (qnum < 1 || qnum > 200) return session;

  const nextFlags = new Set(session.flaggedQuestions);
  if (nextFlags.has(qnum)) {
    nextFlags.delete(qnum);
  } else {
    nextFlags.add(qnum);
  }

  return {
    ...session,
    flaggedQuestions: nextFlags,
  };
}

export function jumpToQuestion(session: ExamSessionState, qnum: number): ExamSessionState {
  if (qnum < 1 || qnum > 200) return session;
  return {
    ...session,
    currentQuestionNumber: qnum,
  };
}

export function tickTimer(session: ExamSessionState, elapsedSeconds: number = 1): ExamSessionState {
  if (session.isPaused || session.isSubmitted) return session;
  const nextTime = Math.max(0, session.timeRemainingSeconds - elapsedSeconds);
  const autoSubmit = nextTime === 0;

  return {
    ...session,
    timeRemainingSeconds: nextTime,
    isSubmitted: autoSubmit ? true : session.isSubmitted,
  };
}

export function pauseSession(session: ExamSessionState): ExamSessionState {
  if (session.isSubmitted) return session;
  return { ...session, isPaused: true };
}

export function resumeSession(session: ExamSessionState): ExamSessionState {
  if (session.isSubmitted) return session;
  return { ...session, isPaused: false };
}

export function submitSession(
  session: ExamSessionState,
  questions: ToeicUnifiedQuestion[],
): ExamSessionState {
  if (session.isSubmitted && session.scoreResult) return session;
  const timeSpent = session.totalQuestions === 200 ? 7200 - session.timeRemainingSeconds : 0;
  const scoreResult = calculateToeicScore(session.answers, questions, Math.max(0, timeSpent));

  return {
    ...session,
    isSubmitted: true,
    isPaused: false,
    scoreResult,
  };
}

export function getPaletteState(
  session: ExamSessionState,
  qnum: number,
): PaletteQuestionState {
  if (qnum === session.currentQuestionNumber) {
    return 'current';
  }
  if (session.flaggedQuestions.has(qnum)) {
    return 'flagged';
  }
  if (session.answers[qnum]) {
    return 'answered';
  }
  return 'unanswered';
}

export function serializeSession(session: ExamSessionState): string {
  return JSON.stringify({
    ...session,
    flaggedQuestions: Array.from(session.flaggedQuestions),
  });
}

export function deserializeSession(serialized: string): ExamSessionState {
  const parsed = JSON.parse(serialized);
  return {
    ...parsed,
    flaggedQuestions: new Set<number>(parsed.flaggedQuestions || []),
  };
}
