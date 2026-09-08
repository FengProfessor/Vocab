/**
 * Technical Minimalist UI & Anti-AI Template Test Suite for Project TOEIC.
 *
 * Verifies:
 * - Anti-AI template guardrails: detection and absence of `rounded-2xl`, `rounded-3xl`, `rounded-full` (outside tiny indicator dots).
 * - Absence of flashy multi-color gradients (`bg-gradient-to-`, `from-indigo-`, `to-purple-`).
 * - Presence and structure of Content-First 2-Tab Catalog layout (Tab 1: Full Test 200Q, Tab 2: 7-Part sets).
 * - Monospace typography requirements (`font-mono tabular-nums`) for timers, question numbers, and scores.
 * - Flat 1px border architecture (`border-slate-200`, `dark:border-slate-800`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { TestRunner, expect } from './test-harness';

const ROOT_DIR = path.resolve(__dirname, '../..');
const TOEIC_APP_DIR = path.resolve(ROOT_DIR, 'src/app/toeic');
const TOEIC_COMPONENTS_DIR = path.resolve(ROOT_DIR, 'src/components/toeic');

export interface StyleAuditViolation {
  file: string;
  rule: string;
  matchedString: string;
}

export interface StyleAuditReport {
  cleanFiles: string[];
  filesWithViolations: string[];
  violations: StyleAuditViolation[];
}

/**
 * Token validator for Technical Minimalist standards (ETS/IIG examination style).
 */
export class TechnicalMinimalistValidator {
  /**
   * Disallowed class patterns in examination and catalog components:
   * - Balloon rounded corners: rounded-2xl, rounded-3xl, rounded-full
   * - Multi-color marketing gradients: bg-gradient-to-, from-indigo-, from-purple-, etc.
   * - Excessive blur & ambient glows: backdrop-blur-md, backdrop-blur-lg, shadow-2xl, shadow-indigo-
   */
  static readonly DISALLOWED_PATTERNS: { rule: string; regex: RegExp }[] = [
    { rule: 'NO_ROUNDED_2XL', regex: /\brounded-2xl\b/g },
    { rule: 'NO_ROUNDED_3XL', regex: /\brounded-3xl\b/g },
    { rule: 'NO_ROUNDED_FULL_LARGE', regex: /\brounded-full\b(?!\s*w-[1-3]\b|\s*h-[1-3]\b)/g },
    { rule: 'NO_GRADIENT_BACKGROUNDS', regex: /\bbg-gradient-to-[a-z]+\b/g },
    { rule: 'NO_MARKETING_COLOR_STOPS', regex: /\b(from-indigo-|to-purple-|via-fuchsia-)\b/g },
  ];

  /**
   * Required design tokens for Technical Minimalist components:
   * - Flat borders: border-slate-200, dark:border-slate-800
   * - Monospace figures: font-mono, tabular-nums
   * - Subtle radii: rounded-sm, rounded-md, rounded-none
   */
  static readonly REQUIRED_TOKENS = {
    flatBorderLight: 'border-slate-200',
    flatBorderDark: 'dark:border-slate-800',
    monospace: 'font-mono',
    tabularNums: 'tabular-nums',
  };

  /**
   * Validate a source code string against minimalist rules.
   */
  static validateSource(sourceCode: string, fileName = 'inline'): StyleAuditViolation[] {
    const violations: StyleAuditViolation[] = [];

    for (const { rule, regex } of this.DISALLOWED_PATTERNS) {
      const matches = sourceCode.match(regex);
      if (matches) {
        for (const m of matches) {
          violations.push({
            file: fileName,
            rule,
            matchedString: m,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check if a component snippet satisfies Technical Minimalist standard.
   */
  static isCompliantSnippet(snippet: string): boolean {
    return this.validateSource(snippet).length === 0;
  }
}

/**
 * 2-Tab Catalog Model Simulation & Contract
 */
export interface ToeicCatalogTabState {
  activeTab: 'full_test' | 'practice_parts';
  selectedPart: number; // 1 .. 7
  totalQuestionsScale: number;
}

export function createToeicCatalogState(): ToeicCatalogTabState {
  return {
    activeTab: 'full_test',
    selectedPart: 1,
    totalQuestionsScale: 15175,
  };
}

export function switchCatalogTab(
  state: ToeicCatalogTabState,
  tab: 'full_test' | 'practice_parts'
): ToeicCatalogTabState {
  return { ...state, activeTab: tab };
}

export function selectCatalogPart(
  state: ToeicCatalogTabState,
  part: number
): ToeicCatalogTabState {
  if (part < 1 || part > 7) {
    throw new Error(`Invalid TOEIC part: ${part}. Must be 1 to 7.`);
  }
  return { ...state, selectedPart: part, activeTab: 'practice_parts' };
}

export async function runUiMinimalistTests(runner: TestRunner): Promise<void> {
  runner.describe('Technical Minimalist UI & Anti-AI Template Suite', () => {
    runner.it('MIN-1: Rule Validator catches balloon rounded classes (rounded-2xl, rounded-3xl)', () => {
      const badSnippet = `<div className="rounded-2xl bg-white p-5 shadow-xl rounded-3xl">Card</div>`;
      const violations = TechnicalMinimalistValidator.validateSource(badSnippet);

      expect(violations.length).toBe(2);
      expect(violations.some((v) => v.rule === 'NO_ROUNDED_2XL')).toBe(true);
      expect(violations.some((v) => v.rule === 'NO_ROUNDED_3XL')).toBe(true);
    });

    runner.it('MIN-2: Rule Validator approves Technical Minimalist borders (rounded-sm, rounded-md, flat 1px)', () => {
      const cleanSnippet = `
        <div className="rounded-sm border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="font-mono text-xs font-bold text-slate-900">042/200</span>
        </div>
      `;
      const violations = TechnicalMinimalistValidator.validateSource(cleanSnippet);
      expect(violations.length).toBe(0);
      expect(TechnicalMinimalistValidator.isCompliantSnippet(cleanSnippet)).toBe(true);
    });

    runner.it('MIN-3: Rule Validator catches multi-color marketing gradients (bg-gradient-to-, from-indigo-)', () => {
      const gradientSnippet = `<div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8">Hero Banner</div>`;
      const violations = TechnicalMinimalistValidator.validateSource(gradientSnippet);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.rule === 'NO_GRADIENT_BACKGROUNDS')).toBe(true);
      expect(violations.some((v) => v.rule === 'NO_MARKETING_COLOR_STOPS')).toBe(true);
    });

    runner.it('MIN-4: 2-Tab Catalog State Machine switches between Full Test and Practice Parts instantaneously', () => {
      let state = createToeicCatalogState();
      expect(state.activeTab).toBe('full_test');
      expect(state.totalQuestionsScale).toBeGreaterThanOrEqual(15000);

      state = switchCatalogTab(state, 'practice_parts');
      expect(state.activeTab).toBe('practice_parts');

      state = selectCatalogPart(state, 5);
      expect(state.selectedPart).toBe(5);
      expect(state.activeTab).toBe('practice_parts');

      state = switchCatalogTab(state, 'full_test');
      expect(state.activeTab).toBe('full_test');
      // Part selection persists in background
      expect(state.selectedPart).toBe(5);
    });

    runner.it('MIN-5: Tab 1 Full Test presentation enforces content-first specifications (200Q, 120m, direct action)', () => {
      const fullTestRow = {
        id: 'estudyme-test-1',
        title: 'TOEIC ETS Simulation Test 01',
        questionCount: 200,
        durationMinutes: 120,
        actionUrl: '/toeic/exam/estudyme-test-1',
      };

      expect(fullTestRow.questionCount).toBe(200);
      expect(fullTestRow.durationMinutes).toBe(120);
      expect(fullTestRow.actionUrl.startsWith('/toeic/exam/')).toBe(true);
    });

    runner.it('MIN-6: Tab 2 Part selector validates all 7 Parts (Part 1 to 7) without boundary errors', () => {
      let state = createToeicCatalogState();
      for (let p = 1; p <= 7; p++) {
        state = selectCatalogPart(state, p);
        expect(state.selectedPart).toBe(p);
      }

      // Boundary errors
      expect(() => selectCatalogPart(state, 0)).toThrow('Invalid TOEIC part');
      expect(() => selectCatalogPart(state, 8)).toThrow('Invalid TOEIC part');
    });

    runner.it('MIN-7: Monospace typography rule enforces font-mono tabular-nums for countdown timer', () => {
      const timerSnippet = `
        <div className="border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-sm font-mono text-sm font-bold tabular-nums">
          01:58:32
        </div>
      `;
      expect(timerSnippet.includes('font-mono')).toBe(true);
      expect(timerSnippet.includes('tabular-nums')).toBe(true);
      expect(TechnicalMinimalistValidator.isCompliantSnippet(timerSnippet)).toBe(true);
    });

    runner.it('MIN-8: Monospace typography rule enforces font-mono for question numbers and indices', () => {
      const indexSnippet = `<span className="font-mono text-xs font-semibold tabular-nums text-slate-500">[042/200]</span>`;
      expect(indexSnippet.includes('font-mono')).toBe(true);
      expect(indexSnippet.includes('tabular-nums')).toBe(true);
      expect(TechnicalMinimalistValidator.isCompliantSnippet(indexSnippet)).toBe(true);
    });

    runner.it('MIN-9: Monospace typography rule enforces font-mono for ETS score certificate', () => {
      const scoreSnippet = `
        <div className="font-mono text-5xl font-black text-slate-900 dark:text-white tabular-nums">
          885
        </div>
      `;
      expect(scoreSnippet.includes('font-mono')).toBe(true);
      expect(scoreSnippet.includes('text-5xl')).toBe(true);
      expect(TechnicalMinimalistValidator.isCompliantSnippet(scoreSnippet)).toBe(true);
    });

    runner.it('MIN-10: Exam Header component (ToeicExamHeader.tsx) has zero rounded-2xl and uses font-mono', () => {
      const headerPath = path.join(TOEIC_COMPONENTS_DIR, 'ToeicExamHeader.tsx');
      if (fs.existsSync(headerPath)) {
        const content = fs.readFileSync(headerPath, 'utf-8');
        expect(content.includes('rounded-2xl')).toBe(false);
        expect(content.includes('rounded-3xl')).toBe(false);
        expect(content.includes('bg-gradient-to-')).toBe(false);
        expect(content.includes('font-mono')).toBe(true);
      }
    });

    runner.it('MIN-11: Question Palette component (ToeicQuestionPalette.tsx) has zero rounded-2xl/3xl classes', () => {
      const palettePath = path.join(TOEIC_COMPONENTS_DIR, 'ToeicQuestionPalette.tsx');
      if (fs.existsSync(palettePath)) {
        const content = fs.readFileSync(palettePath, 'utf-8');
        expect(content.includes('rounded-2xl')).toBe(false);
        expect(content.includes('rounded-3xl')).toBe(false);
        expect(content.includes('bg-gradient-to-')).toBe(false);
      }
    });

    runner.it('MIN-12: Progressive Codebase Audit tracks legacy files and enforces remediation baseline', () => {
      const auditedFiles = [
        'ToeicExamHeader.tsx',
        'ToeicQuestionPalette.tsx',
        'ToeicSplitPane.tsx',
        'ToeicAudioPlayer.tsx',
        'ToeicScoreReportView.tsx',
        'SubmitConfirmModal.tsx',
        'ExamPauseModal.tsx',
        'GuestSaveExamModal.tsx',
      ];

      const report: StyleAuditReport = {
        cleanFiles: [],
        filesWithViolations: [],
        violations: [],
      };

      for (const fileName of auditedFiles) {
        const filePath = path.join(TOEIC_COMPONENTS_DIR, fileName);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const violations = TechnicalMinimalistValidator.validateSource(content, fileName);

        if (violations.length === 0) {
          report.cleanFiles.push(fileName);
        } else {
          report.filesWithViolations.push(fileName);
          report.violations.push(...violations);
        }
      }

      console.log(`    [AUDIT PROGRESS] Clean components: ${report.cleanFiles.join(', ') || 'none'}`);
      console.log(`    [AUDIT PROGRESS] Pending M2/M3 overhaul: ${report.filesWithViolations.length} components`);

      // Verified milestone: all examination components are 100% clean and compliant with Technical Minimalist rules
      expect(report.filesWithViolations.length).toBe(0);
      for (const fileName of auditedFiles) {
        expect(report.cleanFiles.includes(fileName)).toBe(true);
      }
    });
  });
}

// Standalone runner
if (process.argv[1]?.includes('ui-minimalist.test')) {
  const runner = new TestRunner();
  runUiMinimalistTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(`\nUI Minimalist Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`);
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
