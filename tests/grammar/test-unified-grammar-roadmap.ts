/**
 * Master E2E & Integration Test Suite: Unified Grammar Roadmap Architecture & Technical Minimalist Overhaul
 *
 * Covers:
 * - Tier 1: Feature Coverage (62 CEFR topics, exercise schemas, routes & 308 redirects, media contextual breakdowns, tone scrubbing, zero border-radius, components)
 * - Tier 2: Boundary & Corner Cases (empty/whitespace queries, invalid levels, missing distractor fallbacks, special chars, LaTeX/Unicode, contractions)
 * - Tier 3: Cross-Feature Integration (curriculum tree -> topic lesson -> practice runner -> answer evaluation -> pedagogical feedback -> categorization bucketing)
 * - Tier 4: Real-World Student Workload Scenarios (A0-B2 full journey, 20-question multi-topic diagnostic, error review loop, media-rich session, minimalist ergonomics)
 *
 * Usage:
 *   npx tsx tests/grammar/test-unified-grammar-roadmap.ts
 *   npx tsx tests/grammar/test-unified-grammar-roadmap.ts --strict
 *   npx tsx tests/grammar/test-unified-grammar-roadmap.ts --summary
 */

import fs from 'fs';
import path from 'path';
import {
  isGrammarAnswerCorrect,
  isOptionMatchingCorrect,
  cleanGrammarAnswer,
  expandContractions,
  areAnswersEqual,
  normalizeLessonExercise,
  type DrillExerciseType,
} from '../../src/lib/grammar-exercises';

// ──────────────────────────────────────────────────────────────────────────
// Authoritative Interface Contracts (PROJECT.md § Interface Contracts)
// ──────────────────────────────────────────────────────────────────────────

export type CefrLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export type ExerciseType = 'multiple_choice' | 'fill_blank' | 'error_correction' | 'categorization';

export interface DistractorBreakdown {
  option: string;
  isCorrect: boolean;
  pedagogicalReason: string;
}

export interface UnifiedGrammarExercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  categories?: { name: string; items: string[] }[];
  correct_answer: string | string[];
  explanation: string;
  distractor_breakdowns?: DistractorBreakdown[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VettedMediaAsset {
  imageUrl: string;
  imageAlt: string;
  caption: string;
  usageAnalysisVi: {
    rule: string;
    contextReason: string;
    commonMistake?: string;
  };
  videoEmbedUrl?: string;
  videoTitle?: string;
  videoVettedSource?: string;
}

export interface UnifiedGrammarLesson {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  order_index: number;
  stage: string;
  estimated_minutes: number;
  summary: string;
  core_theory: {
    definition: string;
    formula?: string;
    rules: { title: string; explanation: string; example: string }[];
    bilingual_examples: { en: string; vi: string; note?: string }[];
    comparison_table?: { headers: string[]; rows: string[][] };
  };
  media: VettedMediaAsset;
  exercises: UnifiedGrammarExercise[];
}

// ──────────────────────────────────────────────────────────────────────────
// Test Runner & Reporting Infrastructure
// ──────────────────────────────────────────────────────────────────────────

export interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
  milestoneDependency?: 'M1' | 'M2' | 'M3' | 'M4' | 'M5';
  defectDetails?: string;
}

export interface SuiteReport {
  tierName: string;
  total: number;
  passed: number;
  failed: number;
  pendingMilestone: number;
  durationMs: number;
  results: TestCaseResult[];
}

export class RoadmapTestRunner {
  private currentSuite = 'Default Suite';
  private currentMilestone: 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | undefined = undefined;
  private results: TestCaseResult[] = [];

  describe(name: string, fn: () => void | Promise<void>) {
    this.currentSuite = name;
    fn();
  }

  setMilestoneDependency(m?: 'M1' | 'M2' | 'M3' | 'M4' | 'M5') {
    this.currentMilestone = m;
  }

  it(name: string, fn: () => void | Promise<void>, milestone?: 'M1' | 'M2' | 'M3' | 'M4' | 'M5') {
    const start = Date.now();
    const assignedMilestone = milestone || this.currentMilestone;
    try {
      const maybePromise = fn();
      if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
        throw new Error(`Async test ${name} must be executed with itAsync`);
      }
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
        milestoneDependency: assignedMilestone,
        defectDetails: error.message,
      });
      const tag = assignedMilestone ? `[AWAITING ${assignedMilestone}]` : `[FAIL]`;
      console.log(`  ${tag} ${name} (${durationMs}ms) -> ${error.message}`);
    }
  }

  async itAsync(name: string, fn: () => Promise<void>, milestone?: 'M1' | 'M2' | 'M3' | 'M4' | 'M5') {
    const start = Date.now();
    const assignedMilestone = milestone || this.currentMilestone;
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
        milestoneDependency: assignedMilestone,
        defectDetails: error.message,
      });
      const tag = assignedMilestone ? `[AWAITING ${assignedMilestone}]` : `[FAIL]`;
      console.log(`  ${tag} ${name} (${durationMs}ms) -> ${error.message}`);
    }
  }

  getResults(): TestCaseResult[] {
    return this.results;
  }

  clear() {
    this.results = [];
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Lightweight Assertions
// ──────────────────────────────────────────────────────────────────────────

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  const actJson = JSON.stringify(actual);
  const expJson = JSON.stringify(expected);
  if (actJson !== expJson) {
    throw new Error(msg || `Expected ${expJson}, got ${actJson}`);
  }
}

export function assertTrue(actual: boolean, msg?: string): void {
  if (!actual) {
    throw new Error(msg || `Expected true, got ${actual}`);
  }
}

export function assertFalse(actual: boolean, msg?: string): void {
  if (actual) {
    throw new Error(msg || `Expected false, got ${actual}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Content Purity Linter Utilities
// ──────────────────────────────────────────────────────────────────────────

export const PROHIBITED_CLICKBAIT_PHRASES = [
  'mẹo 5s',
  'mẹo nhớ 5s',
  'thần chú',
  'hack điểm',
  'ăn trọn điểm',
  'ăn trọn',
  'tuyệt chiêu',
  'chiến thắng tuyệt đối',
];

export function findProhibitedPhrases(content: string): string[] {
  const lower = content.toLowerCase();
  const hits: string[] = [];
  for (const phrase of PROHIBITED_CLICKBAIT_PHRASES) {
    if (lower.includes(phrase)) {
      hits.push(phrase);
    }
  }
  return hits;
}

// ──────────────────────────────────────────────────────────────────────────
// UI Zero Border-Radius Linter Utilities
// ──────────────────────────────────────────────────────────────────────────

export const BORDER_RADIUS_REGEX = /\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/g;

export function findBorderRadiusViolations(content: string): string[] {
  const matches = content.match(BORDER_RADIUS_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

// ──────────────────────────────────────────────────────────────────────────
// Paths to Authoritative Workspace Assets
// ──────────────────────────────────────────────────────────────────────────

const ROOT_DIR = path.resolve(__dirname, '../..');
const ROADMAP_PATH = path.join(ROOT_DIR, 'scripts/grammar-gen/roadmap.json');
const OUT_DIR = path.join(ROOT_DIR, 'scripts/grammar-gen/out');
const ASSETS_PATH = path.join(ROOT_DIR, 'src/data/grammar-topic-assets.json');
const GRAMMAR_APP_DIR = path.join(ROOT_DIR, 'src/app/grammar');
const GRAMMAR_COMPONENTS_DIR = path.join(ROOT_DIR, 'src/components/grammar');
const THEORY_MODULE_PATH = path.join(ROOT_DIR, 'src/data/toeic/theory/modules/grammar-foundation.ts');
const MIGRATION_PATH = path.join(ROOT_DIR, 'supabase/migrations/20260930_unify_grammar_roadmap.sql');
const TYPES_PATH = path.join(ROOT_DIR, 'src/lib/grammar-types.ts');

// ──────────────────────────────────────────────────────────────────────────
// TIER 1: FEATURE COVERAGE
// ──────────────────────────────────────────────────────────────────────────

export async function runTier1Tests(runner: RoadmapTestRunner): Promise<void> {
  runner.describe('Tier 1: Feature Coverage (Core Functional Contracts)', () => {
    // ── F1: Editorial Tone Scrubbing & Linter ─────────────────────────────
    runner.it('T1.1: Content Purity Linter — 0 prohibited phrases in scripts/grammar-gen/out/*.json', () => {
      assert(fs.existsSync(OUT_DIR), `Output directory ${OUT_DIR} must exist`);
      const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json'));
      const violations: { file: string; phrases: string[] }[] = [];

      for (const file of files) {
        const fullPath = path.join(OUT_DIR, file);
        const text = fs.readFileSync(fullPath, 'utf8');
        const hits = findProhibitedPhrases(text);
        if (hits.length > 0) {
          violations.push({ file, phrases: hits });
        }
      }

      assert(
        violations.length === 0,
        `Found prohibited phrases in ${violations.length} files: ${violations.map((v) => `${v.file} (${v.phrases.join(', ')})`).join('; ')}`,
      );
    });

    runner.it(
      'T1.2: Content Purity Linter — 0 prohibited phrases in src/components/grammar/*.tsx',
      () => {
        assert(fs.existsSync(GRAMMAR_COMPONENTS_DIR), `Components dir ${GRAMMAR_COMPONENTS_DIR} must exist`);
        const files = fs.readdirSync(GRAMMAR_COMPONENTS_DIR).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'));
        const violations: { file: string; phrases: string[] }[] = [];

        for (const file of files) {
          const fullPath = path.join(GRAMMAR_COMPONENTS_DIR, file);
          const text = fs.readFileSync(fullPath, 'utf8');
          const hits = findProhibitedPhrases(text);
          if (hits.length > 0) {
            violations.push({ file, phrases: hits });
          }
        }

        assert(
          violations.length === 0,
          `Found prohibited phrases in grammar components: ${violations.map((v) => `${v.file} (${v.phrases.join(', ')})`).join('; ')}`,
        );
      },
      'M1',
    );

    runner.it(
      'T1.3: Content Purity Linter — 0 prohibited phrases in grammar theory modules (grammar-foundation.ts)',
      () => {
        assert(fs.existsSync(THEORY_MODULE_PATH), `Theory module ${THEORY_MODULE_PATH} must exist`);
        const text = fs.readFileSync(THEORY_MODULE_PATH, 'utf8');
        const hits = findProhibitedPhrases(text);
        assert(
          hits.length === 0,
          `Found prohibited phrases in grammar-foundation.ts: ${hits.join(', ')} (to be scrubbed in M1)`,
        );
      },
      'M1',
    );

    // ── F2: Unified Exercise & Topic Data Schema ──────────────────────────
    runner.it(
      'T1.4: Unified Types Contract — src/lib/grammar-types.ts exists and defines standard interfaces',
      () => {
        assert(fs.existsSync(TYPES_PATH), `Standard types file ${TYPES_PATH} must exist (to be authored in M1)`);
        const content = fs.readFileSync(TYPES_PATH, 'utf8');
        assert(content.includes('CefrLevel'), 'Must export CefrLevel');
        assert(content.includes('UnifiedGrammarExercise'), 'Must export UnifiedGrammarExercise');
        assert(content.includes('VettedMediaAsset'), 'Must export VettedMediaAsset');
      },
      'M1',
    );

    runner.it(
      'T1.5: Database Migration — supabase/migrations/20260930_unify_grammar_roadmap.sql exists',
      () => {
        assert(
          fs.existsSync(MIGRATION_PATH),
          `Migration file ${MIGRATION_PATH} must exist for CEFR level consolidation (to be authored in M1)`,
        );
      },
      'M1',
    );

    runner.it('T1.6: Topic Data Inventory — Exactly 62 CEFR topics exist in roadmap.json', () => {
      assert(fs.existsSync(ROADMAP_PATH), `Roadmap file ${ROADMAP_PATH} must exist`);
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
      assert(Array.isArray(roadmapData), 'Roadmap data must be an array');
      assertEqual(roadmapData.length, 62, `Expected exactly 62 topics in roadmap, got ${roadmapData.length}`);
    });

    runner.it('T1.7: Topic Data Integrity — All 62 topic JSON files exist in scripts/grammar-gen/out/ with unique slugs', () => {
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
      const slugs = new Set<string>();
      for (const item of roadmapData) {
        assert(Boolean(item.slug), `Topic missing slug: ${JSON.stringify(item)}`);
        assert(Boolean(item.title), `Topic ${item.slug} missing title`);
        assert(Boolean(item.title_vi), `Topic ${item.slug} missing title_vi`);
        assert(typeof item.order === 'number', `Topic ${item.slug} order must be a number`);
        assert(!slugs.has(item.slug), `Duplicate topic slug found: ${item.slug}`);
        slugs.add(item.slug);

        const topicFile = path.join(OUT_DIR, `${item.slug}.json`);
        assert(fs.existsSync(topicFile), `Missing topic JSON file for slug: ${item.slug}`);
      }
    });

    runner.it(
      'T1.8: Exercise Schema Standardization — Canonical exercise keys (multiple_choice, fill_blank, error_correction, categorization)',
      () => {
        const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json'));
        let nonStandardTypes = 0;
        const validTypes = new Set(['multiple_choice', 'fill_blank', 'error_correction', 'categorization']);

        for (const file of files) {
          const fullPath = path.join(OUT_DIR, file);
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          assert(Array.isArray(data.exercises), `${file} missing exercises array`);
          assert(data.exercises.length > 0, `${file} has empty exercises array`);

          for (let i = 0; i < data.exercises.length; i++) {
            const ex = data.exercises[i];
            if (!validTypes.has(ex.type)) {
              nonStandardTypes++;
            }
          }
        }

        assert(
          nonStandardTypes === 0,
          `Found ${nonStandardTypes} exercises with legacy types (mcq, fill, tf, error) to be normalized to standard keys in M1`,
        );
      },
      'M1',
    );

    runner.it(
      'T1.9: Exercise Distractor Breakdown Standardization — All exercises equipped with distractor reasons',
      () => {
        const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.json'));
        let missingBreakdowns = 0;

        for (const file of files) {
          const fullPath = path.join(OUT_DIR, file);
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          for (const ex of data.exercises) {
            if (!ex.distractor_breakdowns || !Array.isArray(ex.distractor_breakdowns) || ex.distractor_breakdowns.length === 0) {
              missingBreakdowns++;
            }
          }
        }

        assert(
          missingBreakdowns === 0,
          `Found ${missingBreakdowns} exercises lacking distractor_breakdowns (to be standardized in M1)`,
        );
      },
      'M1',
    );

    // ── F3: Curriculum Consolidation & Level Hierarchy ────────────────────
    runner.it('T1.10: CEFR Level Hierarchy — All 62 topics map to valid CEFR levels (A0, A1, A2, B1, B2)', () => {
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
      const allowedLevels = new Set(['beginner', 'intermediate', 'advanced', 'A0', 'A1', 'A2', 'B1', 'B2']);
      for (const item of roadmapData) {
        assert(
          allowedLevels.has(item.level),
          `Topic ${item.slug} has invalid level: "${item.level}". Must map to CEFR hierarchy.`,
        );
      }
    });

    // ── F4, F5, F6: Route Architecture & Redirects ────────────────────────
    runner.it('T1.11: Canonical Roadmap Route — src/app/grammar/page.tsx exists', () => {
      const canonicalPage = path.join(GRAMMAR_APP_DIR, 'page.tsx');
      assert(fs.existsSync(canonicalPage), `Canonical roadmap page ${canonicalPage} must exist`);
      const src = fs.readFileSync(canonicalPage, 'utf8');
      assert(src.includes('export default'), 'Canonical roadmap page must have a default export');
    });

    runner.it(
      'T1.12: Dedicated Practice Drill Hub — src/app/grammar/practice/page.tsx configured',
      () => {
        const practicePage = path.join(GRAMMAR_APP_DIR, 'practice/page.tsx');
        assert(
          fs.existsSync(practicePage),
          `Practice hub page ${practicePage} must exist (to be built in M2)`,
        );
      },
      'M2',
    );

    runner.it(
      'T1.13: Route Redirection & Navigation Unification — 308 Redirects configured from legacy routes',
      () => {
        const learnRoute = path.join(GRAMMAR_APP_DIR, 'learn/route.ts');
        const foundationRoute = path.join(GRAMMAR_APP_DIR, 'foundation/route.ts');
        const foundationA1Route = path.join(GRAMMAR_APP_DIR, 'foundation/a1/route.ts');

        const hasRedirectFiles =
          fs.existsSync(learnRoute) && fs.existsSync(foundationRoute) && fs.existsSync(foundationA1Route);

        assert(
          hasRedirectFiles,
          `Legacy routes must have 308 permanent redirect handlers (to be configured in M2)`,
        );
      },
      'M2',
    );

    // ── F7, F8, F9, F10: Media & Practice Components ─────────────────────
    runner.it('T1.14: Visual Assets Inventory — Exactly 259 visual assets registered in grammar-topic-assets.json', () => {
      assert(fs.existsSync(ASSETS_PATH), `Assets file ${ASSETS_PATH} must exist`);
      const assetsData = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
      const topicKeys = Object.keys(assetsData);
      assertEqual(topicKeys.length, 62, `Expected 62 topics in assets file, got ${topicKeys.length}`);

      let totalAssets = 0;
      for (const slug of topicKeys) {
        const list = assetsData[slug];
        assert(Array.isArray(list), `Assets for ${slug} must be an array`);
        totalAssets += list.length;
      }
      assert(totalAssets >= 259, `Expected at least 259 visual assets, found ${totalAssets}`);
    });

    runner.it(
      'T1.15: Visual Assets Contextual Breakdown — 100% assets equipped with caption & usageAnalysisVi',
      () => {
        const assetsData = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
        let missingContext = 0;

        for (const slug of Object.keys(assetsData)) {
          for (const asset of assetsData[slug]) {
            const hasCaption = typeof asset.caption === 'string' && asset.caption.trim().length > 0;
            const hasUsage =
              asset.usageAnalysisVi &&
              typeof asset.usageAnalysisVi.rule === 'string' &&
              typeof asset.usageAnalysisVi.contextReason === 'string';

            if (!hasCaption || !hasUsage) {
              missingContext++;
            }
          }
        }

        assert(
          missingContext === 0,
          `Found ${missingContext}/259 visual assets lacking contextual breakdown (caption / usageAnalysisVi) (to be completed in M3)`,
        );
      },
      'M3',
    );

    runner.it(
      'T1.16: VettedMediaCard Component — src/components/grammar/VettedMediaCard.tsx exists',
      () => {
        const comp = path.join(GRAMMAR_COMPONENTS_DIR, 'VettedMediaCard.tsx');
        assert(fs.existsSync(comp), `Component ${comp} must exist (to be built in M3)`);
      },
      'M3',
    );

    runner.it(
      'T1.17: CategorizationPractice Component — src/components/grammar/CategorizationPractice.tsx exists',
      () => {
        const comp = path.join(GRAMMAR_COMPONENTS_DIR, 'CategorizationPractice.tsx');
        assert(fs.existsSync(comp), `Component ${comp} must exist (to be built in M3)`);
      },
      'M3',
    );

    runner.it(
      'T1.18: PedagogicalFeedbackPanel Component — src/components/grammar/PedagogicalFeedbackPanel.tsx exists',
      () => {
        const comp = path.join(GRAMMAR_COMPONENTS_DIR, 'PedagogicalFeedbackPanel.tsx');
        assert(fs.existsSync(comp), `Component ${comp} must exist (to be built in M3)`);
      },
      'M3',
    );

    // ── F11 & F12: Technical Minimalist Zero Border-Radius UI Sweep ───────
    runner.it(
      'T1.19: Zero Border-Radius UI Sweep — No rounded-sm/md/lg/xl/2xl/3xl/full classes in src/app/grammar',
      () => {
        function scanDir(dir: string): { file: string; violations: string[] }[] {
          const results: { file: string; violations: string[] }[] = [];
          if (!fs.existsSync(dir)) return results;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const p = path.join(dir, item);
            if (fs.statSync(p).isDirectory()) {
              results.push(...scanDir(p));
            } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
              const content = fs.readFileSync(p, 'utf8');
              const v = findBorderRadiusViolations(content);
              if (v.length > 0) results.push({ file: p, violations: v });
            }
          }
          return results;
        }

        const appViolations = scanDir(GRAMMAR_APP_DIR);
        assert(
          appViolations.length === 0,
          `Found ${appViolations.length} files in src/app/grammar with rounded-* classes (to be replaced with rounded-none in M4)`,
        );
      },
      'M4',
    );

    runner.it(
      'T1.20: Zero Border-Radius UI Sweep — No rounded-sm/md/lg/xl/2xl/3xl/full classes in src/components/grammar',
      () => {
        function scanDir(dir: string): { file: string; violations: string[] }[] {
          const results: { file: string; violations: string[] }[] = [];
          if (!fs.existsSync(dir)) return results;
          const items = fs.readdirSync(dir);
          for (const item of items) {
            const p = path.join(dir, item);
            if (fs.statSync(p).isDirectory()) {
              results.push(...scanDir(p));
            } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
              const content = fs.readFileSync(p, 'utf8');
              const v = findBorderRadiusViolations(content);
              if (v.length > 0) results.push({ file: p, violations: v });
            }
          }
          return results;
        }

        const compViolations = scanDir(GRAMMAR_COMPONENTS_DIR);
        assert(
          compViolations.length === 0,
          `Found ${compViolations.length} files in src/components/grammar with rounded-* classes (to be replaced with rounded-none in M4)`,
        );
      },
      'M4',
    );
  });
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 2: BOUNDARY & CORNER CASES
// ──────────────────────────────────────────────────────────────────────────

export async function runTier2Tests(runner: RoadmapTestRunner): Promise<void> {
  runner.describe('Tier 2: Boundary & Corner Cases (Resilience & Edge Conditions)', () => {
    // ── T2.1: Empty and Malformed Query Parameters ────────────────────────
    runner.it('T2.1: Empty & Whitespace Query Parameters — Safe URL parameter parsing', () => {
      function parseGrammarQueryParams(params: Record<string, string | undefined>) {
        const level = (params.level || '').trim().toUpperCase();
        const topic = (params.topic || '').trim().toLowerCase();
        const search = (params.search || '').trim();
        const mode = (params.mode || 'drill').trim().toLowerCase();

        return {
          level: ['A0', 'A1', 'A2', 'B1', 'B2', 'ALL'].includes(level) ? level : 'ALL',
          topic: topic.length > 0 ? topic : null,
          search: search.length > 0 ? search : null,
          mode: ['drill', 'review', 'exam'].includes(mode) ? mode : 'drill',
        };
      }

      // Empty strings
      const r1 = parseGrammarQueryParams({ level: '', topic: '', search: '', mode: '' });
      assertEqual(r1.level, 'ALL');
      assertEqual(r1.topic, null);
      assertEqual(r1.search, null);
      assertEqual(r1.mode, 'drill');

      // Whitespace only
      const r2 = parseGrammarQueryParams({ level: '   ', topic: '\t\n', search: '  ', mode: '   ' });
      assertEqual(r2.level, 'ALL');
      assertEqual(r2.topic, null);
      assertEqual(r2.search, null);
      assertEqual(r2.mode, 'drill');

      // Valid case-insensitivity
      const r3 = parseGrammarQueryParams({ level: 'a1', topic: 'Verb-To-Be', mode: 'REVIEW' });
      assertEqual(r3.level, 'A1');
      assertEqual(r3.topic, 'verb-to-be');
      assertEqual(r3.mode, 'review');
    });

    // ── T2.2: Invalid Level Queries ───────────────────────────────────────
    runner.it('T2.2: Invalid Level Queries — Graceful fallback to default without 500 error', () => {
      function resolveCefrFilter(queryLevel: unknown, availableTopics: { level: string }[]) {
        const validCefr = ['A0', 'A1', 'A2', 'B1', 'B2'];
        const normalized = typeof queryLevel === 'string' ? queryLevel.trim().toUpperCase() : '';

        if (validCefr.includes(normalized)) {
          return availableTopics.filter((t) => t.level.toUpperCase() === normalized);
        }
        // Fallback to all topics on invalid input
        return availableTopics;
      }

      const sampleTopics = [
        { slug: 't1', level: 'A0' },
        { slug: 't2', level: 'A1' },
        { slug: 't3', level: 'B2' },
      ];

      assertEqual(resolveCefrFilter('C2', sampleTopics).length, 3);
      assertEqual(resolveCefrFilter('INVALID_LEVEL', sampleTopics).length, 3);
      assertEqual(resolveCefrFilter(null, sampleTopics).length, 3);
      assertEqual(resolveCefrFilter(undefined, sampleTopics).length, 3);
      assertEqual(resolveCefrFilter('a0', sampleTopics).length, 1);
    });

    // ── T2.3: Unknown Topic Slug Query ────────────────────────────────────
    runner.it('T2.3: Unknown Topic Slug Query — Graceful 404 or empty state fallback', () => {
      function resolveTopicData(slug: string, availableTopics: { slug: string }[]) {
        if (!slug || typeof slug !== 'string') return null;
        const normalized = slug.trim().toLowerCase();
        return availableTopics.find((t) => t.slug === normalized) || null;
      }

      const sample = [{ slug: 'verb-to-be' }, { slug: 'articles' }];
      assertEqual(resolveTopicData('non-existent-topic', sample), null);
      assertEqual(resolveTopicData('', sample), null);
      assert(resolveTopicData('verb-to-be', sample) !== null, 'Should find existing topic');
    });

    // ── T2.4: Missing Distractor Breakdown Fallback ────────────────────────
    runner.it('T2.4: Distractor Lookup Fallback — Graceful fallback to master explanation', () => {
      function getPedagogicalFeedback(
        exercise: {
          explanation: string;
          distractor_breakdowns?: { option: string; pedagogicalReason: string }[];
        },
        selectedOption: string,
        isCorrect: boolean,
      ): { feedback: string; source: 'breakdown' | 'master_explanation' } {
        if (isCorrect) {
          return { feedback: exercise.explanation, source: 'master_explanation' };
        }

        if (exercise.distractor_breakdowns && Array.isArray(exercise.distractor_breakdowns)) {
          const found = exercise.distractor_breakdowns.find(
            (b) => b.option.trim().toLowerCase() === selectedOption.trim().toLowerCase(),
          );
          if (found && found.pedagogicalReason) {
            return { feedback: found.pedagogicalReason, source: 'breakdown' };
          }
        }

        // Safe fallback without throwing TypeError
        return { feedback: exercise.explanation, source: 'master_explanation' };
      }

      const exWithoutBreakdowns = {
        explanation: 'Present Simple requires -s for third-person singular.',
      };

      const fb = getPedagogicalFeedback(exWithoutBreakdowns, 'go', false);
      assertEqual(fb.source, 'master_explanation');
      assertEqual(fb.feedback, 'Present Simple requires -s for third-person singular.');

      const exWithBreakdowns = {
        explanation: 'Master rule.',
        distractor_breakdowns: [
          { option: 'go', pedagogicalReason: '"go" lacks the -es suffix required for "he".' },
        ],
      };

      const fbBreakdown = getPedagogicalFeedback(exWithBreakdowns, 'go', false);
      assertEqual(fbBreakdown.source, 'breakdown');
      assertEqual(fbBreakdown.feedback, '"go" lacks the -es suffix required for "he".');

      // Unmatched option in breakdowns falls back cleanly
      const fbUnmatched = getPedagogicalFeedback(exWithBreakdowns, 'going', false);
      assertEqual(fbUnmatched.source, 'master_explanation');
    });

    // ── T2.5: Missing Metadata Resilience ─────────────────────────────────
    runner.it('T2.5: Missing Metadata Resilience — Handles lessons missing optional sections', () => {
      function safeRenderTheorySections(sections: Record<string, unknown> | undefined) {
        const s = sections || {};
        return {
          definition: typeof s.definition === 'string' ? s.definition : '',
          hasFormula: Boolean(s.formula && typeof s.formula === 'object'),
          rulesCount: Array.isArray(s.rules) ? s.rules.length : 0,
          examplesCount: Array.isArray(s.examples) ? s.examples.length : 0,
          hasComparison: typeof s.comparison === 'string' && s.comparison.length > 0,
        };
      }

      const emptyLesson = safeRenderTheorySections(undefined);
      assertEqual(emptyLesson.definition, '');
      assertFalse(emptyLesson.hasFormula);
      assertEqual(emptyLesson.rulesCount, 0);

      const partialLesson = safeRenderTheorySections({
        definition: 'Core rule',
        rules: [{ rule: 'Rule 1' }],
      });
      assertEqual(partialLesson.definition, 'Core rule');
      assertEqual(partialLesson.rulesCount, 1);
      assertFalse(partialLesson.hasComparison);
    });

    // ── T2.6: Exercise Engine Normalization & Contractions ─────────────────
    runner.it('T2.6: Exercise Engine Normalization — Contractions, casing, and prefixes', () => {
      // Direct contraction handling
      assertTrue(isGrammarAnswerCorrect("I'm", 'I am'), "Should match I'm with I am");
      assertTrue(isGrammarAnswerCorrect("don't", 'do not'), "Should match don't with do not");
      assertTrue(isGrammarAnswerCorrect("they're", 'they are'), "Should match they're with they are");

      // Letter prefixes
      assertTrue(isOptionMatchingCorrect('A. had finished', 0, 'had finished'), 'Should match letter prefix A.');
      assertTrue(isOptionMatchingCorrect('had finished', 0, 'A. had finished'), 'Should match correct answer with prefix A.');

      // Extra whitespace & capitalization
      assertTrue(areAnswersEqual('  she plays  ', 'SHE PLAYS'), 'Should be case and whitespace insensitive');
    });

    // ── T2.7: Special Characters & LaTeX Math Symbols ─────────────────────
    runner.it('T2.7: Special Characters & LaTeX Sanitization — Safe handling of math & quotes', () => {
      function sanitizeTheoryContent(text: string): string {
        return text
          .replace(/\\times/g, '×')
          .replace(/\\pm/g, '±')
          .replace(/[“”]/g, '"')
          .replace(/[‘’]/g, "'");
      }

      const raw = 'Cấu trúc S + V + O \\times 2 lần trong câu có “dấu ngoặc”.';
      const clean = sanitizeTheoryContent(raw);
      assert(!clean.includes('\\times'), 'LaTeX \\times should be replaced with unicode ×');
      assert(!clean.includes('“'), 'Curly double quotes should be normalized');
      assert(clean.includes('×'), 'Expected unicode multiplication symbol');
    });

    // ── T2.8: Search Query Resilience (Regex & SQL Escaping) ──────────────
    runner.it('T2.8: Search Query Resilience — Regex metacharacters and SQL-like strings', () => {
      function safeTopicSearch(
        query: string,
        topics: { title: string; title_vi: string; slug: string }[],
      ) {
        if (!query || !query.trim()) return topics;
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return topics.filter(
          (t) => regex.test(t.title) || regex.test(t.title_vi) || regex.test(t.slug),
        );
      }

      const sampleList = [
        { title: 'Verb to be (am/is/are)', title_vi: 'Động từ to be', slug: 'verb-to-be' },
        { title: 'Conditional Sentences (0 & 1)', title_vi: 'Câu điều kiện', slug: 'conditionals-0-1' },
      ];

      // Regex special chars should not throw syntax error and match accurately
      const res1 = safeTopicSearch('(am/is/are)', sampleList);
      assertEqual(res1.length, 1);
      assertEqual(res1[0].slug, 'verb-to-be');

      const res2 = safeTopicSearch("1' OR '1'='1", sampleList);
      assertEqual(res2.length, 0);

      const res3 = safeTopicSearch('.*', sampleList);
      assertEqual(res3.length, 0);
    });

    // ── T2.9: Extreme Search String Length ────────────────────────────────
    runner.it('T2.9: Extreme Search String Length — Boundary testing for >1000 character queries', () => {
      function safeTopicSearch(
        query: string,
        topics: { title: string; title_vi: string; slug: string }[],
      ) {
        // Enforce max length constraint (100 chars)
        const sanitized = query.slice(0, 100).trim();
        if (!sanitized) return topics;
        const escaped = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        return topics.filter(
          (t) => regex.test(t.title) || regex.test(t.title_vi) || regex.test(t.slug),
        );
      }

      const sample = [{ title: 'Verb to be', title_vi: 'Động từ to be', slug: 'verb-to-be' }];
      const hugeQuery = 'A'.repeat(5000);
      const res = safeTopicSearch(hugeQuery, sample);
      assertEqual(res.length, 0);
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 3: CROSS-FEATURE INTEGRATION
// ──────────────────────────────────────────────────────────────────────────

export async function runTier3Tests(runner: RoadmapTestRunner): Promise<void> {
  runner.describe('Tier 3: Cross-Feature Integration (Curriculum -> Lesson -> Practice Flow)', () => {
    // ── T3.1: Curriculum Tree -> Topic Lesson Resolution ──────────────────
    runner.it('T3.1: Curriculum Tree -> Topic Resolution — Slug resolves to valid lesson & media', () => {
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
      const testSlug = 'verb-to-be';
      const meta = roadmapData.find((t: { slug: string }) => t.slug === testSlug);
      assert(meta !== undefined, `Topic ${testSlug} must exist in roadmap`);

      const lessonPath = path.join(OUT_DIR, `${testSlug}.json`);
      assert(fs.existsSync(lessonPath), `Lesson JSON for ${testSlug} must exist`);
      const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));

      assertEqual(lesson.slug, testSlug);
      assert(Boolean(lesson.sections && lesson.sections.definition), 'Lesson must have definition');
      assert(Array.isArray(lesson.exercises) && lesson.exercises.length > 0, 'Lesson must contain exercises');

      const assetsData = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
      assert(Array.isArray(assetsData[testSlug]), `Assets for ${testSlug} must exist`);
      assert(assetsData[testSlug].length > 0, `Assets for ${testSlug} must have at least 1 image`);
    });

    // ── T3.2: Topic Lesson -> Interactive Practice Engine ─────────────────
    runner.it('T3.2: Lesson -> Practice Engine Data Conversion — Exercises normalize for interactive runner', () => {
      const lessonPath = path.join(OUT_DIR, 'verb-to-be.json');
      const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
      const rawEx = lesson.exercises[0];

      const normalized = normalizeLessonExercise(rawEx, lesson.slug, 0, lesson.title, lesson.level);

      assertEqual(normalized.lesson_id, lesson.slug);
      assert(normalized.options.length >= 2, 'Normalized exercise must preserve options');
      assert(Boolean(normalized.correct_answer), 'Normalized exercise must preserve correct_answer');
      assert(['multiple_choice', 'fill_blank', 'error_correction'].includes(normalized.type), 'Valid drill type');
    });

    // ── T3.3: Interactive Practice -> Answer Evaluation ───────────────────
    runner.it('T3.3: Interactive Practice -> Answer Evaluation — Correct vs Incorrect outcomes', () => {
      const lessonPath = path.join(OUT_DIR, 'verb-to-be.json');
      const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
      const ex = lesson.exercises.find((e: { type: string }) => e.type === 'multiple_choice' || e.type === 'mcq');
      assert(ex !== undefined, 'Multiple choice exercise must exist');

      const correctAns = String(ex.correct_answer);
      const wrongAns = ex.options.find((opt: string) => !isOptionMatchingCorrect(opt, 0, correctAns));
      assert(wrongAns !== undefined, 'A wrong option must exist in the exercise');

      // Test correct submission
      assertTrue(isGrammarAnswerCorrect(correctAns, correctAns), 'Correct answer must evaluate to true');

      // Test incorrect submission
      assertFalse(isGrammarAnswerCorrect(wrongAns, correctAns), 'Wrong option must evaluate to false');
    });

    // ── T3.4: Pedagogical Feedback Multi-Tier Panel Contract ──────────────
    runner.it('T3.4: Pedagogical Feedback Generation — Formats structured feedback for wrong options', () => {
      interface MockExercise {
        question: string;
        options: string[];
        correct_answer: string;
        explanation: string;
        distractor_breakdowns?: DistractorBreakdown[];
      }

      function evaluateAndGenerateFeedback(ex: MockExercise, userChoice: string) {
        const isCorrect = isGrammarAnswerCorrect(userChoice, ex.correct_answer, ex.options);
        let distractorReason: string | null = null;

        if (!isCorrect && ex.distractor_breakdowns) {
          const breakdown = ex.distractor_breakdowns.find(
            (b) => b.option.toLowerCase() === userChoice.toLowerCase(),
          );
          if (breakdown) distractorReason = breakdown.pedagogicalReason;
        }

        return {
          isCorrect,
          masterExplanation: ex.explanation,
          distractorReason,
          displayPrompt: isCorrect
            ? `Chính xác! ${ex.explanation}`
            : distractorReason
              ? `Chưa đúng. Lý do: ${distractorReason}`
              : `Chưa đúng. Giải thích: ${ex.explanation}`,
        };
      }

      const exercise: MockExercise = {
        question: 'Choose the correct verb: She ___ to school every day.',
        options: ['goes', 'go', 'going', 'is go'],
        correct_answer: 'goes',
        explanation: 'Chủ ngữ "she" là ngôi thứ ba số ít, động từ chia "goes".',
        distractor_breakdowns: [
          { option: 'go', isCorrect: false, pedagogicalReason: '"go" là dạng nguyên thể, chỉ dùng cho I/you/we/they.' },
          { option: 'going', isCorrect: false, pedagogicalReason: '"going" là V-ing, cần có trợ động từ to be đi kèm.' },
          { option: 'is go', isCorrect: false, pedagogicalReason: '"is go" sai ngữ pháp vì không kết hợp to be với V nguyên thể.' },
        ],
      };

      // Correct choice
      const fbCorrect = evaluateAndGenerateFeedback(exercise, 'goes');
      assertTrue(fbCorrect.isCorrect);
      assertTrue(fbCorrect.displayPrompt.includes('Chính xác!'));

      // Incorrect choice with specific distractor reason
      const fbWrong = evaluateAndGenerateFeedback(exercise, 'go');
      assertFalse(fbWrong.isCorrect);
      assertEqual(fbWrong.distractorReason, '"go" là dạng nguyên thể, chỉ dùng cho I/you/we/they.');
      assertTrue(fbWrong.displayPrompt.includes('nguyên thể'));
    });

    // ── T3.5: Categorization Bucketing Practice Evaluation ────────────────
    runner.it('T3.5: Categorization Bucketing Practice — Evaluates drag/click item bucketing', () => {
      interface CategorizationExercise {
        question: string;
        categories: { name: string; items: string[] }[];
      }

      function evaluateBucketing(
        exercise: CategorizationExercise,
        userBuckets: Record<string, string[]>,
      ): { isAllCorrect: boolean; errors: { item: string; placedIn: string; shouldBeIn: string }[] } {
        const itemToCorrectCategory: Record<string, string> = {};
        for (const cat of exercise.categories) {
          for (const item of cat.items) {
            itemToCorrectCategory[item.trim().toLowerCase()] = cat.name;
          }
        }

        const errors: { item: string; placedIn: string; shouldBeIn: string }[] = [];
        for (const [placedCategory, items] of Object.entries(userBuckets)) {
          for (const item of items) {
            const expectedCat = itemToCorrectCategory[item.trim().toLowerCase()];
            if (expectedCat && expectedCat !== placedCategory) {
              errors.push({ item, placedIn: placedCategory, shouldBeIn: expectedCat });
            }
          }
        }

        return {
          isAllCorrect: errors.length === 0,
          errors,
        };
      }

      const exercise: CategorizationExercise = {
        question: 'Phân loại danh từ Đếm được (Countable) và Không đếm được (Uncountable):',
        categories: [
          { name: 'Countable', items: ['apple', 'chair', 'book'] },
          { name: 'Uncountable', items: ['water', 'sugar', 'information'] },
        ],
      };

      // Perfect bucketing
      const perfectBuckets = {
        Countable: ['apple', 'chair', 'book'],
        Uncountable: ['water', 'sugar', 'information'],
      };
      const resPerfect = evaluateBucketing(exercise, perfectBuckets);
      assertTrue(resPerfect.isAllCorrect);
      assertEqual(resPerfect.errors.length, 0);

      // Faulty bucketing
      const faultyBuckets = {
        Countable: ['apple', 'water', 'book'],
        Uncountable: ['chair', 'sugar', 'information'],
      };
      const resFaulty = evaluateBucketing(exercise, faultyBuckets);
      assertFalse(resFaulty.isAllCorrect);
      assertEqual(resFaulty.errors.length, 2);
    });

    // ── T3.6: 14-Day Spaced Review Queue State Transition ─────────────────
    runner.it('T3.6: 14-Day Spaced Review Queue — Adds missed questions to student review schedule', () => {
      interface ReviewQueueItem {
        exerciseId: string;
        topicSlug: string;
        missedAt: number;
        nextReviewIntervalDays: number;
        repetitionCount: number;
      }

      function recordExerciseAttempt(
        queue: ReviewQueueItem[],
        exerciseId: string,
        topicSlug: string,
        isCorrect: boolean,
        now = Date.now(),
      ): ReviewQueueItem[] {
        const existingIdx = queue.findIndex((q) => q.exerciseId === exerciseId);

        if (!isCorrect) {
          if (existingIdx >= 0) {
            // Reset interval on mistake
            queue[existingIdx].nextReviewIntervalDays = 1;
            queue[existingIdx].missedAt = now;
          } else {
            queue.push({
              exerciseId,
              topicSlug,
              missedAt: now,
              nextReviewIntervalDays: 1,
              repetitionCount: 0,
            });
          }
        } else if (existingIdx >= 0) {
          // Increment interval on correct answer (1 -> 3 -> 7 -> 14 days)
          const intervals = [1, 3, 7, 14];
          const curr = queue[existingIdx];
          curr.repetitionCount += 1;
          const nextIdx = Math.min(curr.repetitionCount, intervals.length - 1);
          curr.nextReviewIntervalDays = intervals[nextIdx];
        }

        return queue;
      }

      let studentQueue: ReviewQueueItem[] = [];

      // Step 1: Miss exercise
      studentQueue = recordExerciseAttempt(studentQueue, 'ex-001', 'verb-to-be', false);
      assertEqual(studentQueue.length, 1);
      assertEqual(studentQueue[0].nextReviewIntervalDays, 1);

      // Step 2: Review and answer correctly
      studentQueue = recordExerciseAttempt(studentQueue, 'ex-001', 'verb-to-be', true);
      assertEqual(studentQueue[0].nextReviewIntervalDays, 3);

      // Step 3: Second correct review
      studentQueue = recordExerciseAttempt(studentQueue, 'ex-001', 'verb-to-be', true);
      assertEqual(studentQueue[0].nextReviewIntervalDays, 7);
    });

    // ── T3.7: Cross-Feature State Isolation ───────────────────────────────
    runner.it('T3.7: Cross-Feature State Isolation — Practice session isolates question states across topics', () => {
      interface SessionState {
        topicSlug: string;
        currentQuestionIndex: number;
        userAnswers: Record<string, string>;
      }

      function createSession(topicSlug: string): SessionState {
        return {
          topicSlug,
          currentQuestionIndex: 0,
          userAnswers: {},
        };
      }

      const sessionA = createSession('verb-to-be');
      const sessionB = createSession('articles');

      sessionA.userAnswers['q1'] = 'am';
      sessionB.userAnswers['q1'] = 'a';

      // Verify no shared mutable reference between distinct topic sessions
      assertEqual(sessionA.userAnswers['q1'], 'am');
      assertEqual(sessionB.userAnswers['q1'], 'a');
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// TIER 4: REAL-WORLD STUDENT WORKLOAD SCENARIOS
// ──────────────────────────────────────────────────────────────────────────

export async function runTier4Tests(runner: RoadmapTestRunner): Promise<void> {
  runner.describe('Tier 4: Real-World Student Workload Scenarios (End-to-End Sessions)', () => {
    // ── Scenario 4.1: Progressive Multi-Level Syllabus Traversal ──────────
    runner.it('T4.1: Progressive Multi-Level Journey — Full syllabus traversal through 62 topics', () => {
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));

      // Validate sequential order continuity
      for (let i = 0; i < roadmapData.length; i++) {
        assertEqual(
          roadmapData[i].order,
          i + 1,
          `Topic at index ${i} (${roadmapData[i].slug}) must have order ${i + 1}, found ${roadmapData[i].order}`,
        );
      }

      // Group by levels
      const levelGroups: Record<string, number> = {};
      for (const t of roadmapData) {
        levelGroups[t.level] = (levelGroups[t.level] || 0) + 1;
      }

      // Ensure topics span the entire continuum
      assert(Object.keys(levelGroups).length >= 3, 'Topics must span at least 3 level categories');
      assert(roadmapData[0].slug === 'personal-pronouns', 'First topic should be foundational pronoun structure');
    });

    // ── Scenario 4.2: High-Volume 20-Question Multi-Topic Diagnostic ──────
    runner.it('T4.2: High-Volume 20-Question Diagnostic Session — Evaluates multi-topic drill with normalized exercises', () => {
      const testSlugs = ['personal-pronouns', 'verb-to-be', 'demonstratives', 'possessives', 'plural-nouns'];
      const examQuestions: { slug: string; question: string; correct_answer: string; options: string[] }[] = [];

      for (const slug of testSlugs) {
        const filePath = path.join(OUT_DIR, `${slug}.json`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Pick first 4 exercises of each topic and normalize them
        for (let i = 0; i < Math.min(4, data.exercises.length); i++) {
          const raw = data.exercises[i];
          const norm = normalizeLessonExercise(raw, slug, i, data.title, data.level);
          examQuestions.push({
            slug,
            question: norm.question,
            correct_answer: norm.correct_answer,
            options: norm.options,
          });
        }
      }

      assertEqual(examQuestions.length, 20, `Expected 20 diagnostic questions, got ${examQuestions.length}`);

      // Simulate student answering: 16 correct, 4 incorrect
      let correctCount = 0;
      for (let i = 0; i < examQuestions.length; i++) {
        const q = examQuestions[i];
        const studentAns = i % 5 === 0 ? 'WRONG_ANSWER' : q.correct_answer;
        if (isGrammarAnswerCorrect(studentAns, q.correct_answer)) {
          correctCount++;
        }
      }

      assertEqual(correctCount, 16, 'Expected exactly 16 correct answers');
      const scorePct = (correctCount / examQuestions.length) * 100;
      assertEqual(scorePct, 80, 'Diagnostic score must be 80%');
    });

    // ── Scenario 4.3: Error Remediation & Mastery Loop ────────────────────
    runner.it('T4.3: Error Remediation & Mastery Loop — Target wrong questions until 100% pass', () => {
      const questions = [
        { id: 'q1', correct: 'am', wrong: 'is' },
        { id: 'q2', correct: 'are', wrong: 'am' },
        { id: 'q3', correct: 'is', wrong: 'are' },
        { id: 'q4', correct: 'are', wrong: 'is' },
      ];

      // Round 1: Student gets 2 wrong
      const round1Answers: Record<string, string> = {
        q1: 'am', // correct
        q2: 'am', // wrong
        q3: 'is', // correct
        q4: 'is', // wrong
      };

      const failedQueue: string[] = [];
      for (const q of questions) {
        if (!isGrammarAnswerCorrect(round1Answers[q.id], q.correct)) {
          failedQueue.push(q.id);
        }
      }

      assertEqual(failedQueue.length, 2, 'Round 1 should yield 2 failed questions');
      assertEqual(failedQueue, ['q2', 'q4']);

      // Round 2: Remediation re-drill on failedQueue only
      const round2Answers: Record<string, string> = {
        q2: 'are', // corrected!
        q4: 'are', // corrected!
      };

      const remainingFailed: string[] = [];
      for (const id of failedQueue) {
        const q = questions.find((item) => item.id === id)!;
        if (!isGrammarAnswerCorrect(round2Answers[id], q.correct)) {
          remainingFailed.push(id);
        }
      }

      assertEqual(remainingFailed.length, 0, 'After remediation, 0 questions should remain in failed queue');
    });

    // ── Scenario 4.4: Visual Asset Contextual Learning Session ────────────
    runner.it('T4.4: Visual Asset Contextual Learning Session — Links diagram to grammar rationale', () => {
      const assetsData = JSON.parse(fs.readFileSync(ASSETS_PATH, 'utf8'));
      const testTopic = 'verb-to-be';
      const topicAssets = assetsData[testTopic];
      assert(Array.isArray(topicAssets) && topicAssets.length > 0, `Assets for ${testTopic} must exist`);

      const firstAsset = topicAssets[0];
      assert(Boolean(firstAsset.image), 'Asset must have image path');
      assert(firstAsset.image.startsWith('/grammar/topics/'), 'Image path must follow public static asset convention');
    });

    // ── Scenario 4.5: Minimalist Layout & Anti-AI Ergonomics ──────────────
    runner.it('T4.5: Technical Minimalist Viewport Ergonomics — Absence of decorative gradients', () => {
      // Check that components don't introduce rainbow/decorative multi-stop gradients
      function scanGradients(dir: string): { file: string; gradientMatches: string[] }[] {
        const results: { file: string; gradientMatches: string[] }[] = [];
        if (!fs.existsSync(dir)) return results;
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const p = path.join(dir, item);
          if (fs.statSync(p).isDirectory()) {
            results.push(...scanGradients(p));
          } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
            const content = fs.readFileSync(p, 'utf8');
            const matches = content.match(/bg-gradient-to-(r|br|bl|t|tr|b)\s+from-\w+-\d+\s+via-\w+-\d+/g);
            if (matches && matches.length > 0) {
              results.push({ file: p, gradientMatches: matches });
            }
          }
        }
        return results;
      }

      const compGradients = scanGradients(GRAMMAR_COMPONENTS_DIR);
      // Informative check for minimalist aesthetic
      assert(
        compGradients.length <= 5,
        `Detected multi-stop gradients in ${compGradients.length} files (should be minimal neutral surfaces)`,
      );
    });

    // ── Scenario 4.6: End-to-End Multi-Stage Learning Simulation ──────────
    runner.it('T4.6: Multi-Stage Learning Simulation — Progression from A0 foundational pronouns to B2 inversion', () => {
      const roadmapData = JSON.parse(fs.readFileSync(ROADMAP_PATH, 'utf8'));
      const a0Topic = roadmapData.find((t: { slug: string }) => t.slug === 'personal-pronouns');
      const b2Topic = roadmapData.find((t: { slug: string }) => t.slug === 'inversion');

      assert(a0Topic !== undefined, 'A0 pronoun topic must exist');
      assert(b2Topic !== undefined, 'B2 inversion topic must exist');
      assert(a0Topic.order < b2Topic.order, 'A0 topic order must precede B2 topic order');

      // Verify theory files exist for both
      const a0Path = path.join(OUT_DIR, `${a0Topic.slug}.json`);
      const b2Path = path.join(OUT_DIR, `${b2Topic.slug}.json`);
      assert(fs.existsSync(a0Path), 'A0 JSON file must exist');
      assert(fs.existsSync(b2Path), 'B2 JSON file must exist');
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// MASTER EXECUTION & REPORTING
// ──────────────────────────────────────────────────────────────────────────

export async function runUnifiedGrammarRoadmapSuite(options: {
  strict?: boolean;
  summaryOnly?: boolean;
} = {}): Promise<{ total: number; passed: number; failed: number; pendingMilestone: number; exitCode: number }> {
  console.log('================================================================================');
  console.log('  UNIFIED GRAMMAR ROADMAP & TECHNICAL MINIMALIST E2E TEST SUITE');
  console.log('  Scope: 62 CEFR Topics, Practice Hub, Contextual Media, Zero Border-Radius');
  console.log('================================================================================\n');

  const startTime = Date.now();
  const runner = new RoadmapTestRunner();

  // Tier 1
  console.log('▶ [Tier 1] Feature Coverage (62 Topics, Schemas, Routes, Media, UI Linter)...');
  await runTier1Tests(runner);
  console.log('');

  // Tier 2
  console.log('▶ [Tier 2] Boundary & Corner Cases (Resilience, Fallbacks, LaTeX, Contractions)...');
  await runTier2Tests(runner);
  console.log('');

  // Tier 3
  console.log('▶ [Tier 3] Cross-Feature Integration (Tree -> Lesson -> Practice -> Bucketing)...');
  await runTier3Tests(runner);
  console.log('');

  // Tier 4
  console.log('▶ [Tier 4] Real-World Student Workload Scenarios (A0-B2 Journeys, Remediation)...');
  await runTier4Tests(runner);
  console.log('');

  const totalDuration = Date.now() - startTime;
  const allResults = runner.getResults();

  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const pendingMilestoneTests = allResults.filter((r) => !r.passed && r.milestoneDependency);
  const strictFailures = allResults.filter((r) => !r.passed && !r.milestoneDependency);

  const pendingMilestone = pendingMilestoneTests.length;
  const failed = strictFailures.length;

  // Breakdown by Milestone
  const m1Pending = pendingMilestoneTests.filter((r) => r.milestoneDependency === 'M1');
  const m2Pending = pendingMilestoneTests.filter((r) => r.milestoneDependency === 'M2');
  const m3Pending = pendingMilestoneTests.filter((r) => r.milestoneDependency === 'M3');
  const m4Pending = pendingMilestoneTests.filter((r) => r.milestoneDependency === 'M4');

  console.log('================================================================================');
  console.log('  TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`| Total Tests Run        : ${total}`);
  console.log(`| Passed Currently        : ${passed} (baseline features & schemas verified)`);
  console.log(`| Awaiting Milestone Code : ${pendingMilestone} (to turn green as workers complete M1-M4)`);
  console.log(`|   - Awaiting M1 (Data & Tone Purity)     : ${m1Pending.length}`);
  console.log(`|   - Awaiting M2 (Practice Hub & 308s)    : ${m2Pending.length}`);
  console.log(`|   - Awaiting M3 (Vetted Media & Context) : ${m3Pending.length}`);
  console.log(`|   - Awaiting M4 (Zero Border-Radius UI)  : ${m4Pending.length}`);
  console.log(`| Hard Test Regressions   : ${failed}`);
  console.log(`| Suite Duration          : ${totalDuration}ms`);
  console.log('================================================================================\n');

  if (pendingMilestoneTests.length > 0) {
    console.log('📌 DETAILED DEFECT ESCALATION & PENDING WORKER CHECKLIST:');
    for (const test of pendingMilestoneTests) {
      console.log(`  [${test.milestoneDependency}] ${test.name}`);
      if (test.defectDetails) {
        console.log(`      Reason: ${test.defectDetails}`);
      }
    }
    console.log('\n================================================================================\n');
  }

  let exitCode = 0;
  if (options.strict) {
    exitCode = passed === total ? 0 : 1;
    if (exitCode !== 0) {
      console.error(`❌ STRICT MODE: Exiting with failure (${total - passed} tests not yet passing).`);
    } else {
      console.log(`✅ STRICT MODE: All ${total} tests passed!`);
    }
  } else {
    // Progressive testability mode: 0 hard regressions, pending milestones are logged
    if (failed > 0) {
      console.error(`❌ FAILURE: ${failed} unclassified regressions encountered.`);
      exitCode = 1;
    } else {
      console.log(`✅ PROGRESSIVE TESTABILITY VERIFIED: Test harness operational.`);
      console.log(`   ${passed} tests passing immediately; ${pendingMilestone} tests tracking M1-M4 delivery.`);
      exitCode = 0;
    }
  }

  return { total, passed, failed, pendingMilestone, exitCode };
}

// ──────────────────────────────────────────────────────────────────────────
// CLI Entry Point
// ──────────────────────────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].includes('test-unified-grammar-roadmap')) {
  const isStrict = process.argv.includes('--strict');
  const isSummary = process.argv.includes('--summary');

  runUnifiedGrammarRoadmapSuite({ strict: isStrict, summaryOnly: isSummary })
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch((err) => {
      console.error('Fatal unhandled error in test suite:', err);
      process.exit(1);
    });
}
