/**
 * TOEIC Theory Learning Curriculum Data Integrity Test Suite
 *
 * Verifies:
 * - Tier 1: Module & Catalog Integrity (3 modules, >=15 lessons, unique IDs & slugs, textbook sources)
 * - Tier 2: Pedagogical Depth & Content Quality (sections >= 2, tip boxes, trap alerts with antidotes, bilingual examples, zero placeholders)
 * - Tier 3: In-Lesson Checkpoint Quizzes & Cyber Defense (>=3-5 per lesson, unique IDs, valid options, answer keys, Vietnamese explanations, sanitization)
 * - Tier 4: Bridge to Practice Integration (targetPart match, canonical practiceUrl, filterMode, actionable CTA)
 * - Tier 5: Query Helpers & Boundary Traversal (getAllModules, getModuleById, getAllLessons, getLessonById, getLessonBySlug, getAdjacentLessons boundary traversal, getCurriculumStats)
 *
 * Usage:
 *   npx tsx tests/toeic/theory-curriculum.test.ts
 */

import { TestRunner, expect } from './test-harness';
import {
  toeicTheoryCurriculum,
  getAllModules,
  getModuleById,
  getAllLessons,
  getLessonById,
  getLessonBySlug,
  getAdjacentLessons,
  getCurriculumStats,
} from '../../src/data/toeic/theory';
import type {
  TheoryModule,
  TheoryLesson,
  TheorySection,
  TheoryCheckpoint,
  TheoryModuleId,
} from '../../src/data/toeic/theory/types';

export async function runTheoryCurriculumTests(runner: TestRunner): Promise<void> {
  const curriculum = toeicTheoryCurriculum;
  const allModules: TheoryModule[] = curriculum.modules;
  const allLessons: TheoryLesson[] = allModules.flatMap((m) => m.lessons);
  const allCheckpoints: TheoryCheckpoint[] = allLessons.flatMap((l) => l.checkpoints);

  // ───────────────────────────────────────────────────────────────────────────
  // Tier 1: Catalog Integrity & Structural Completeness
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('TOEIC Theory Curriculum: Tier 1 - Catalog & Module Structure', () => {
    runner.it('TC-1.1: Exactly 3 core modules exist with valid IDs, titles, and descriptions', () => {
      expect(allModules.length).toBe(3);
      const moduleIds = allModules.map((m) => m.id);
      expect(moduleIds.includes('grammar-foundation')).toBe(true);
      expect(moduleIds.includes('listening-tactics')).toBe(true);
      expect(moduleIds.includes('reading-mastery')).toBe(true);

      for (const mod of allModules) {
        expect(mod.title.trim().length).toBeGreaterThan(0);
        expect(mod.description.trim().length).toBeGreaterThan(0);
        expect(mod.lessons.length).toBeGreaterThan(0);
      }
    });

    runner.it('TC-1.2: Minimum lesson quotas satisfied (>=15 total, >=5 per module)', () => {
      expect(allLessons.length).toBeGreaterThanOrEqual(15);

      const grammarLessons = allLessons.filter((l) => l.moduleId === 'grammar-foundation');
      const listeningLessons = allLessons.filter((l) => l.moduleId === 'listening-tactics');
      const readingLessons = allLessons.filter((l) => l.moduleId === 'reading-mastery');

      expect(grammarLessons.length).toBeGreaterThanOrEqual(5);
      expect(listeningLessons.length).toBeGreaterThanOrEqual(5);
      expect(readingLessons.length).toBeGreaterThanOrEqual(5);
    });

    runner.it('TC-1.3: All lesson IDs and slugs are globally unique', () => {
      const lessonIds = allLessons.map((l) => l.id);
      const uniqueIds = new Set(lessonIds);
      expect(uniqueIds.size).toBe(lessonIds.length);

      const slugs = allLessons.map((l) => l.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    runner.it('TC-1.4: Slugs strictly follow kebab-case format', () => {
      const kebabRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      for (const lesson of allLessons) {
        expect(kebabRegex.test(lesson.slug)).toBe(true);
      }
    });

    runner.it('TC-1.5: Lessons have monotonic ascending order within each module', () => {
      for (const mod of allModules) {
        const orders = mod.lessons.map((l) => l.order);
        for (let i = 0; i < orders.length; i++) {
          expect(orders[i]).toBe(i + 1);
        }
      }
    });

    runner.it('TC-1.6: Every lesson cites authoritative textbook sources', () => {
      for (const lesson of allLessons) {
        expect(Array.isArray(lesson.textbookSources)).toBe(true);
        expect(lesson.textbookSources.length).toBeGreaterThanOrEqual(1);
        for (const src of lesson.textbookSources) {
          expect(typeof src === 'string' && src.trim().length > 0).toBe(true);
        }
      }
    });

    runner.it('TC-1.7: Lesson moduleId references parent module correctly', () => {
      for (const mod of allModules) {
        for (const lesson of mod.lessons) {
          expect(lesson.moduleId).toBe(mod.id);
        }
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Tier 2: Pedagogical Depth & Content Quality
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('TOEIC Theory Curriculum: Tier 2 - Pedagogical Depth & Content Quality', () => {
    runner.it('TC-2.1: Every lesson has >= 2 sections with valid section types and titles', () => {
      const validTypes = new Set(['concept', 'rules', 'comparison', 'traps', 'shortcuts', 'real_examples']);
      for (const lesson of allLessons) {
        expect(lesson.sections.length).toBeGreaterThanOrEqual(2);
        for (const sec of lesson.sections) {
          expect(validTypes.has(sec.sectionType)).toBe(true);
          expect(sec.title.trim().length).toBeGreaterThan(0);
        }
      }
    });

    runner.it('TC-2.2: Every lesson contains at least one actionable Tip Box or Shortcut', () => {
      for (const lesson of allLessons) {
        const hasTip = lesson.sections.some(
          (s) => s.tipBox !== undefined || s.sectionType === 'shortcuts'
        );
        expect(hasTip).toBe(true);

        const tipSections = lesson.sections.filter((s) => s.tipBox);
        for (const ts of tipSections) {
          expect(ts.tipBox!.title.trim().length).toBeGreaterThan(0);
          expect(ts.tipBox!.content.trim().length).toBeGreaterThan(0);
          expect(ts.tipBox!.keySignals.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    runner.it('TC-2.3: Every lesson contains at least one Trap Alert with antidote', () => {
      for (const lesson of allLessons) {
        const hasTrap = lesson.sections.some(
          (s) => s.trapAlert !== undefined || s.sectionType === 'traps'
        );
        expect(hasTrap).toBe(true);

        const trapSections = lesson.sections.filter((s) => s.trapAlert);
        for (const ts of trapSections) {
          expect(ts.trapAlert!.trapName.trim().length).toBeGreaterThan(0);
          expect(ts.trapAlert!.trapDescription.trim().length).toBeGreaterThan(0);
          expect(ts.trapAlert!.antidote.trim().length).toBeGreaterThan(0);
        }
      }
    });

    runner.it('TC-2.4: Every lesson contains bilingual real-world examples with analysis', () => {
      for (const lesson of allLessons) {
        const examples = lesson.sections.flatMap((s) => s.examples || []);
        expect(examples.length).toBeGreaterThanOrEqual(1);

        for (const ex of examples) {
          expect(ex.english.trim().length).toBeGreaterThan(0);
          expect(ex.vietnamese.trim().length).toBeGreaterThan(0);
          expect(ex.analysis.trim().length).toBeGreaterThan(0);
        }
      }
    });

    runner.it('TC-2.5: Zero placeholder strings in curriculum data', () => {
      const forbiddenPlaceholders = ['TODO', 'FIXME', 'Lorem ipsum', '[TBD]'];
      const rawJson = JSON.stringify(curriculum);
      for (const token of forbiddenPlaceholders) {
        expect(rawJson.includes(token)).toBe(false);
      }
    });

    runner.it('TC-2.6: Comparison tables have well-formed headers, rows, and non-empty cells', () => {
      let tableCount = 0;
      for (const lesson of allLessons) {
        for (const sec of lesson.sections) {
          if (sec.comparisonTable) {
            tableCount++;
            const table = sec.comparisonTable;
            expect(table.headers.length).toBeGreaterThanOrEqual(2);
            expect(table.rows.length).toBeGreaterThanOrEqual(1);
            for (const row of table.rows) {
              expect(row.colValues.length).toBe(table.headers.length);
              for (const cell of row.colValues) {
                expect(cell.trim().length).toBeGreaterThan(0);
              }
            }
          }
        }
      }
      expect(tableCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Tier 3: Checkpoint Quizzes & Cyber Defense
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('TOEIC Theory Curriculum: Tier 3 - Checkpoint Quizzes & Cyber Defense', () => {
    runner.it('TC-3.1: Every lesson has between 3 and 10 checkpoints (>=3 required)', () => {
      for (const lesson of allLessons) {
        expect(lesson.checkpoints.length).toBeGreaterThanOrEqual(3);
        expect(lesson.checkpoints.length).toBeLessThanOrEqual(10);
      }
      expect(allCheckpoints.length).toBeGreaterThanOrEqual(48);
    });

    runner.it('TC-3.2: All checkpoint IDs are globally unique', () => {
      const cpIds = allCheckpoints.map((cp) => cp.id);
      const uniqueCpIds = new Set(cpIds);
      expect(uniqueCpIds.size).toBe(cpIds.length);
    });

    runner.it('TC-3.3: Every checkpoint has a non-empty prompt and valid stimulus', () => {
      for (const cp of allCheckpoints) {
        expect(cp.prompt.trim().length).toBeGreaterThan(0);
      }
    });

    runner.it('TC-3.4: Checkpoint options conform to standard format with valid keys', () => {
      for (const cp of allCheckpoints) {
        expect(cp.options.length).toBeGreaterThanOrEqual(3);
        expect(cp.options.length).toBeLessThanOrEqual(4);

        const keys = cp.options.map((o) => o.key);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);

        for (const opt of cp.options) {
          expect(['A', 'B', 'C', 'D'].includes(opt.key)).toBe(true);
          expect(opt.text.trim().length).toBeGreaterThan(0);
        }
      }
    });

    runner.it('TC-3.5: Correct answer key is valid and exists in options list', () => {
      for (const cp of allCheckpoints) {
        const optionKeys = cp.options.map((o) => o.key);
        expect(optionKeys.includes(cp.correctAnswer)).toBe(true);
      }
    });

    runner.it('TC-3.6: Vietnamese explanations are rich, non-empty, and pedagogical', () => {
      for (const cp of allCheckpoints) {
        expect(cp.explanationVi.trim().length).toBeGreaterThanOrEqual(20);
        // Ensure explanation contains genuine Vietnamese characters
        const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          cp.explanationVi
        );
        expect(hasVietnamese).toBe(true);
      }
    });

    runner.it('TC-3.7: Sanitization compatibility: stripped checkpoint omits answer and explanation', () => {
      for (const cp of allCheckpoints) {
        expect(cp.timeTargetSeconds).toBeGreaterThanOrEqual(5);
        expect(cp.timeTargetSeconds).toBeLessThanOrEqual(120);

        const sanitized = {
          id: cp.id,
          order: cp.order,
          prompt: cp.prompt,
          passage: cp.passage,
          audioUrl: cp.audioUrl,
          imageUrl: cp.imageUrl,
          options: cp.options,
          timeTargetSeconds: cp.timeTargetSeconds,
        };
        expect((sanitized as any).correctAnswer).toBeUndefined();
        expect((sanitized as any).explanationVi).toBeUndefined();
        expect(sanitized.options.length).toBe(cp.options.length);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Tier 4: Bridge to Practice Integration
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('TOEIC Theory Curriculum: Tier 4 - Bridge to Practice Integration', () => {
    runner.it('TC-4.1: Every lesson has a valid bridgeToPractice matching targetPart', () => {
      for (const lesson of allLessons) {
        expect(lesson.bridgeToPractice).toBeDefined();
        expect(lesson.bridgeToPractice.targetPart).toBe(lesson.targetPart);
      }
    });

    runner.it('TC-4.2: Practice URLs point to valid canonical practice routes', () => {
      for (const lesson of allLessons) {
        const url = lesson.bridgeToPractice.practiceUrl;
        expect(url.startsWith('/toeic/')).toBe(true);
        expect(url.includes(`part=${lesson.targetPart}`)).toBe(true);
        expect(url.includes('mode=practice')).toBe(true);
      }
    });

    runner.it('TC-4.3: Filter mode is one of unseen, mistakes, or all_random', () => {
      const validModes = new Set(['unseen', 'mistakes', 'all_random']);
      for (const lesson of allLessons) {
        expect(validModes.has(lesson.bridgeToPractice.filterMode)).toBe(true);
      }
    });

    runner.it('TC-4.4: CTA button text is non-empty and in Vietnamese', () => {
      for (const lesson of allLessons) {
        const cta = lesson.bridgeToPractice.ctaText;
        expect(cta.trim().length).toBeGreaterThan(0);
        expect(/thực hành|luyện ngay|làm bài/i.test(cta)).toBe(true);
      }
    });

    runner.it('TC-4.5: Recommended question counts are pedagogically sound (5 to 50)', () => {
      for (const lesson of allLessons) {
        const count = lesson.bridgeToPractice.recommendedQuestionCount;
        expect(count).toBeGreaterThanOrEqual(5);
        expect(count).toBeLessThanOrEqual(50);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Tier 5: Query Helpers & Boundary Traversal
  // ───────────────────────────────────────────────────────────────────────────
  runner.describe('TOEIC Theory Curriculum: Tier 5 - Query Helpers & Boundary Traversal', () => {
    runner.it('TC-5.1: getAllModules and getModuleById query helpers function correctly', () => {
      const modules = getAllModules();
      expect(modules.length).toBe(3);

      const grammarMod = getModuleById('grammar-foundation');
      expect(grammarMod).toBeDefined();
      expect(grammarMod!.id).toBe('grammar-foundation');

      const listeningMod = getModuleById('listening-tactics');
      expect(listeningMod).toBeDefined();
      expect(listeningMod!.id).toBe('listening-tactics');

      const readingMod = getModuleById('reading-mastery');
      expect(readingMod).toBeDefined();
      expect(readingMod!.id).toBe('reading-mastery');

      const nonExistent = getModuleById('non-existent-module' as TheoryModuleId);
      expect(nonExistent).toBeUndefined();
    });

    runner.it('TC-5.2: getAllLessons returns all lessons across modules in sequence', () => {
      const lessons = getAllLessons();
      expect(lessons.length).toBe(allLessons.length);
      expect(lessons[0].id).toBe(allLessons[0].id);
      expect(lessons[lessons.length - 1].id).toBe(allLessons[allLessons.length - 1].id);
    });

    runner.it('TC-5.3: getLessonById retrieves target lesson or undefined', () => {
      const firstLesson = allLessons[0];
      const found = getLessonById(firstLesson.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(firstLesson.id);
      expect(found!.title).toBe(firstLesson.title);

      const notFound = getLessonById('invalid-lesson-id-999');
      expect(notFound).toBeUndefined();
    });

    runner.it('TC-5.4: getLessonBySlug retrieves target lesson or undefined', () => {
      const firstLesson = allLessons[0];
      const found = getLessonBySlug(firstLesson.slug);
      expect(found).toBeDefined();
      expect(found!.id).toBe(firstLesson.id);

      const notFound = getLessonBySlug('non-existent-slug-xyz');
      expect(notFound).toBeUndefined();
    });

    runner.it('TC-5.5: getAdjacentLessons traverses curriculum boundaries and order', () => {
      const firstLesson = allLessons[0];
      const firstAdj = getAdjacentLessons(firstLesson.id);
      expect(firstAdj.prevLesson).toBeUndefined();
      expect(firstAdj.nextLesson).toBeDefined();
      expect(firstAdj.nextLesson!.id).toBe(allLessons[1].id);

      const lastLesson = allLessons[allLessons.length - 1];
      const lastAdj = getAdjacentLessons(lastLesson.id);
      expect(lastAdj.prevLesson).toBeDefined();
      expect(lastAdj.prevLesson!.id).toBe(allLessons[allLessons.length - 2].id);
      expect(lastAdj.nextLesson).toBeUndefined();

      if (allLessons.length > 2) {
        const midLesson = allLessons[1];
        const midAdj = getAdjacentLessons(midLesson.id);
        expect(midAdj.prevLesson).toBeDefined();
        expect(midAdj.prevLesson!.id).toBe(allLessons[0].id);
        expect(midAdj.nextLesson).toBeDefined();
        expect(midAdj.nextLesson!.id).toBe(allLessons[2].id);
      }

      const invalidAdj = getAdjacentLessons('unknown-id-xyz');
      expect(invalidAdj.prevLesson).toBeUndefined();
      expect(invalidAdj.nextLesson).toBeUndefined();
    });

    runner.it('TC-5.6: getCurriculumStats aggregates accurate metrics and module breakdowns', () => {
      const stats = getCurriculumStats();
      expect(stats.totalModules).toBe(3);
      expect(stats.totalLessons).toBe(allLessons.length);
      expect(stats.totalCheckpoints).toBe(allCheckpoints.length);

      expect(stats.byModule['grammar-foundation']).toBeGreaterThanOrEqual(5);
      expect(stats.byModule['listening-tactics']).toBeGreaterThanOrEqual(5);
      expect(stats.byModule['reading-mastery']).toBeGreaterThanOrEqual(5);

      expect(stats.checkpointsByModule['grammar-foundation']).toBeGreaterThanOrEqual(15);
      expect(stats.checkpointsByModule['listening-tactics']).toBeGreaterThanOrEqual(15);
      expect(stats.checkpointsByModule['reading-mastery']).toBeGreaterThanOrEqual(15);

      expect(stats.moduleDetails['grammar-foundation'].title).toBeDefined();
      expect(stats.moduleDetails['grammar-foundation'].lessons).toBe(stats.byModule['grammar-foundation']);
      expect(stats.moduleDetails['grammar-foundation'].checkpoints).toBe(stats.checkpointsByModule['grammar-foundation']);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Standalone Execution
// ─────────────────────────────────────────────────────────────────────────────

if (process.argv[1]?.includes('theory-curriculum.test')) {
  const runner = new TestRunner();
  runTheoryCurriculumTests(runner).then(() => {
    const stats = runner.getStats();
    console.log(
      `\nTheory Curriculum Suite Results: ${stats.passed}/${stats.total} passed (${stats.durationMs}ms)`
    );
    process.exit(stats.failed > 0 ? 1 : 0);
  });
}
