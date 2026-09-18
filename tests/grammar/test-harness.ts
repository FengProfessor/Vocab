/**
 * E2E & Integration Test Harness for English Grammar Learning Experience.
 * Self-contained, zero-external-dependency test runner, matchers, Supabase connector,
 * and parsing utilities for grammar tables, formulas, and exercises.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

interface QueuedTest {
  suite: string;
  name: string;
  fn: () => Promise<void> | void;
}

export class TestRunner {
  private currentSuite = 'Default Suite';
  private results: TestResult[] = [];
  private beforeHooks: (() => Promise<void> | void)[] = [];
  private afterHooks: (() => Promise<void> | void)[] = [];
  private tests: QueuedTest[] = [];

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

  it(name: string, fn: () => Promise<void> | void) {
    this.tests.push({
      suite: this.currentSuite,
      name,
      fn,
    });
  }

  async run(): Promise<SuiteStats> {
    for (const test of this.tests) {
      for (const hook of this.beforeHooks) {
        await hook();
      }

      const start = Date.now();
      try {
        await test.fn();
        const durationMs = Date.now() - start;
        this.results.push({
          suite: test.suite,
          name: test.name,
          passed: true,
          durationMs,
        });
        console.log(`  [PASS] ${test.name} (${durationMs}ms)`);
      } catch (err: unknown) {
        const durationMs = Date.now() - start;
        const error = err instanceof Error ? err : new Error(String(err));
        this.results.push({
          suite: test.suite,
          name: test.name,
          passed: false,
          durationMs,
          error,
        });
        console.error(`  [FAIL] ${test.name} (${durationMs}ms) -> ${error.message}`);
      } finally {
        for (const hook of this.afterHooks) {
          await hook();
        }
      }
    }

    return this.getStats();
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
    this.tests = [];
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
    toThrow(expectedMessage?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow requires actual to be a function');
      }
      let threw = false;
      let errorThrown: any = null;
      try {
        actual();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      if (negate ? threw : !threw) {
        throw new Error(
          `Expected function ${negate ? 'not to throw' : 'to throw'}, but it ${threw ? 'threw ' + errorThrown : 'did not throw'}`,
        );
      }
      if (!negate && expectedMessage && errorThrown) {
        const msg = errorThrown instanceof Error ? errorThrown.message : String(errorThrown);
        if (typeof expectedMessage === 'string' && !msg.includes(expectedMessage)) {
          throw new Error(
            `Expected error message "${msg}" to contain "${expectedMessage}"`,
          );
        } else if (expectedMessage instanceof RegExp && !expectedMessage.test(msg)) {
          throw new Error(
            `Expected error message "${msg}" to match ${expectedMessage.toString()}`,
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
// Supabase & Environment Utilities
// ──────────────────────────────────────────────────────────────────────────

export function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

export function getSupabaseClient(): SupabaseClient | null {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface CurriculumLessonData {
  id: string;
  topic_id: string;
  title: string;
  order_index: number;
  theory_vi: string | null;
  examples: unknown[];
  sections: Record<string, unknown> | unknown[];
  exercises: unknown[];
}

export async function fetchCurriculumLessons(): Promise<CurriculumLessonData[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('grammar_lessons')
        .select('id, topic_id, title, order_index, theory_vi, examples, sections, exercises')
        .order('order_index');

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as CurriculumLessonData[];
      }
    } catch {
      // Fallback to local dump
    }
  }

  // Fallback 1: tmp/grammar-audit-dump.json
  const dumpPath = path.resolve(process.cwd(), 'tmp/grammar-audit-dump.json');
  if (fs.existsSync(dumpPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
      const lessons: CurriculumLessonData[] = [];
      for (const topic of raw.topics || []) {
        for (const l of topic.lessons || []) {
          lessons.push({
            id: l.id,
            topic_id: l.topic_id,
            title: l.title,
            order_index: l.order_index,
            theory_vi: l.theory_preview || '',
            examples: l.examples_sample || [],
            sections: l.sections_titles || {},
            exercises: new Array(l.exercises_count || 0).fill({}),
          });
        }
      }
      if (lessons.length > 0) return lessons;
    } catch {
      // Fallback to empty
    }
  }

  return [];
}

// ──────────────────────────────────────────────────────────────────────────
// Table Parser Verification Helpers
// ──────────────────────────────────────────────────────────────────────────

export interface ParsedTable {
  headers: string[];
  alignments: ('left' | 'center' | 'right' | 'default')[];
  rows: string[][];
}

export function parseMarkdownTable(markdown: string): ParsedTable | null {
  if (!markdown) return null;
  const lines = markdown
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const tableLines = lines.filter((l) => l.startsWith('|') || (l.includes('|') && l.endsWith('|')));
  if (tableLines.length < 2) return null;

  // Header line
  const headerLine = tableLines[0];
  const headers = splitTableRow(headerLine);
  if (headers.length === 0) return null;

  // Divider line
  const dividerLine = tableLines[1];
  const dividerCells = splitTableRow(dividerLine);
  const isDivider =
    dividerCells.length >= headers.length &&
    dividerCells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c.trim()));

  if (!isDivider) return null;

  const alignments: ('left' | 'center' | 'right' | 'default')[] = dividerCells.map((c) => {
    const trimmed = c.trim();
    const leftColon = trimmed.startsWith(':');
    const rightColon = trimmed.endsWith(':');
    if (leftColon && rightColon) return 'center';
    if (rightColon) return 'right';
    if (leftColon) return 'left';
    return 'default';
  });

  const rows: string[][] = [];
  for (let i = 2; i < tableLines.length; i++) {
    const rowCells = splitTableRow(tableLines[i]);
    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  }

  return { headers, alignments, rows };
}

export function splitTableRow(rowStr: string): string[] {
  let s = rowStr.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);

  // Split by unescaped pipe, protecting pipes inside {...}, (...), and `...`
  const cells: string[] = [];
  let current = '';
  let escaped = false;
  let inBrace = 0;
  let inParen = 0;
  let inBacktick = false;

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '`') {
      inBacktick = !inBacktick;
      current += char;
    } else if (!inBacktick && char === '{') {
      inBrace++;
      current += char;
    } else if (!inBacktick && char === '}' && inBrace > 0) {
      inBrace--;
      current += char;
    } else if (!inBacktick && char === '(') {
      inParen++;
      current += char;
    } else if (!inBacktick && char === ')' && inParen > 0) {
      inParen--;
      current += char;
    } else if (!inBacktick && inBrace === 0 && inParen === 0 && char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

// ──────────────────────────────────────────────────────────────────────────
// Formula Tokenizer Helper
// ──────────────────────────────────────────────────────────────────────────

export interface ParsedFormulaItem {
  isStack: boolean;
  tokens: string[];
  cleanLabels: string[];
  badgeStyles: string[];
}

export interface ParsedFormula {
  rawFormula: string;
  items: ParsedFormulaItem[];
}

export function cleanFormulaToken(raw: string): string {
  if (!raw) return '';
  const s = raw.trim().replace(/^\{|\}$/g, '').trim();

  const keyMap: Record<string, string> = {
    'S:S': 'S (Chủ ngữ)',
    'V:V': 'V (Động từ)',
    'O:O': 'O (Tân ngữ)',
    'V:be': 'be (am/is/are)',
    'D:bổ ngữ': 'Bổ ngữ',
    'S': 'S (Chủ ngữ)',
    'V': 'V (Động từ)',
    'O': 'O (Tân ngữ)',
    'be': 'be (am/is/are)',
  };

  if (keyMap[s]) return keyMap[s];

  if (s.includes(':')) {
    const parts = s.split(':');
    const k = parts[0].trim();
    const v = parts.slice(1).join(':').trim();
    if (k === 'S') return `S (${v || 'Chủ ngữ'})`;
    if (k === 'V') return `V (${v || 'Động từ'})`;
    if (k === 'O') return `O (${v || 'Tân ngữ'})`;
    if (k === 'D') return v || 'Bổ ngữ';
    return `${k} (${v})`;
  }

  return s;
}

export function getTokenBadgeStyle(cleanText: string): 'sky' | 'indigo' | 'emerald' | 'muted' {
  if (cleanText.startsWith('S')) return 'sky';
  if (cleanText.startsWith('V') || cleanText.startsWith('be')) return 'indigo';
  if (cleanText.startsWith('O') || cleanText.includes('Bổ ngữ')) return 'emerald';
  return 'muted';
}

export function tokenizeFormula(code: string): ParsedFormula[] {
  if (!code) return [];
  const formulas = code
    .split(/\n|·/)
    .map((f) => f.trim())
    .filter(Boolean);

  return formulas.map((formula) => {
    const parts = formula
      .split('+')
      .map((p) => p.trim())
      .filter(Boolean);

    const items: ParsedFormulaItem[] = parts.map((part) => {
      const isStack = part.includes('|');
      const rawOptions = isStack
        ? part.replace(/^\{|\}$|\(|\)/g, '').split('|').map((o) => o.trim())
        : [part];

      const cleanLabels = rawOptions.map(cleanFormulaToken);
      const badgeStyles = cleanLabels.map(getTokenBadgeStyle);

      return {
        isStack,
        tokens: rawOptions,
        cleanLabels,
        badgeStyles,
      };
    });

    return { rawFormula: formula, items };
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Layout & Static Code Constraint Checker
// ──────────────────────────────────────────────────────────────────────────

export function checkLayoutConstraints(sourceCode: string): {
  hardcodedPixelWidths: string[];
  hasHorizontalScrollSafety: boolean;
  hasFluidWidth: boolean;
  hasResponsiveBreakpointGrids: boolean;
} {
  // Flag fixed pixel widths like w-[1200px], w-[800px], min-w-[900px]
  const hardcodedMatch = sourceCode.match(/(?:min-w|max-w|w)-\[(\d+)px\]/g) || [];
  const largeFixed = hardcodedMatch.filter((m) => {
    const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
    return num >= 480; // Flags wide fixed widths that break mobile viewports (<480px)
  });

  const hasHorizontalScrollSafety =
    sourceCode.includes('overflow-x-auto') || sourceCode.includes('overflow-auto');
  const hasFluidWidth =
    sourceCode.includes('w-full') || sourceCode.includes('max-w-');
  const hasResponsiveBreakpointGrids =
    /grid-cols-\d+\s+md:grid-cols-\d+|flex-col\s+lg:flex-row|sm:|md:|lg:|xl:/.test(
      sourceCode,
    );

  return {
    hardcodedPixelWidths: largeFixed,
    hasHorizontalScrollSafety,
    hasFluidWidth,
    hasResponsiveBreakpointGrids,
  };
}
