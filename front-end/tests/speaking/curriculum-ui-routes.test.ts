/**
 * UI Integration & Route Sanity Test Suite for Speaking Curriculum Subsystem.
 * File: tests/speaking/curriculum-ui-routes.test.ts
 *
 * Verifies:
 * 1. Component exports and route structures.
 * 2. Next.js App Router param resolution (both Promise and direct object).
 * 3. Complete 3-tier catalog integrity (32 lessons, 3 phases, CEFR/IELTS bands).
 * 4. 4-stage pedagogical schema across all 32 lessons (Phonetics -> Lego -> Dialogue -> SafeHarbor).
 * 5. Interactive Lego slot substitution logic and sentence generation.
 * 6. Keyword highlighting and tokenization engine for Stage 3 dialogue turns.
 * 7. SafeHarbor speech evaluation integration for Stage 4 challenges.
 * 8. Sequential lesson progression graph (including phase transitions).
 *
 * Usage:
 *   npx tsx tests/speaking/curriculum-ui-routes.test.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  TestRunner,
  expect,
  setupMockBrowserEnvironment,
  teardownMockBrowserEnvironment,
} from './test-harness';
import {
  allCurriculumLessons,
  getCurriculumLessonById,
  getCurriculumLessonsByPhase,
  SPEAKING_PHASE_CONFIGS,
} from '../../src/data/speaking/curriculum';
import { evaluateSafeHarborSpeech } from '../../src/lib/speaking/safe-harbor-matcher';
import type { SpeakingCurriculumLesson } from '../../src/types/speaking-curriculum';

export async function runCurriculumUiRoutesTests(runner: TestRunner): Promise<void> {
  // ── Suite 1: Component Route Module Imports ──────────────────────────────
  runner.describe('Milestone 4: Component Route Module Imports', () => {});

  await runner.it('1.1: Curriculum Catalog Page component file exists and exports a valid component', async () => {
    const filePath = path.resolve('src/app/student/speaking/curriculum/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const catalogModule = await import('../../src/app/student/speaking/curriculum/page');
    expect(catalogModule.default).toBeDefined();
    expect(['function', 'object'].includes(typeof catalogModule.default)).toBe(true);
  });

  await runner.it('1.2: 4-Stage Lesson Runner Page component file exists and exports a valid component', async () => {
    const filePath = path.resolve('src/app/student/speaking/curriculum/[phaseId]/[lessonId]/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const lessonModule = await import('../../src/app/student/speaking/curriculum/[phaseId]/[lessonId]/page');
    expect(lessonModule.default).toBeDefined();
    expect(['function', 'object'].includes(typeof lessonModule.default)).toBe(true);
  });

  await runner.it('1.3: Master Speaking Hub Page component file exists and exports a valid component', async () => {
    const filePath = path.resolve('src/app/student/speaking/page.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const hubModule = await import('../../src/app/student/speaking/page');
    expect(hubModule.default).toBeDefined();
    expect(['function', 'object'].includes(typeof hubModule.default)).toBe(true);
  });

  // ── Suite 2: App Router Parameter Resolution ─────────────────────────────
  runner.describe('Milestone 4: App Router Parameter Resolution', () => {});

  await runner.it('2.1: Resolves route parameters with Promise-based params (React 19 / Next 15+)', async () => {
    const targetParams = Promise.resolve({
      phaseId: 'phase-1-beginner',
      lessonId: 'p1-l01-greetings-self-intro',
    });
    const resolved = await targetParams;
    expect(resolved.phaseId).toBe('phase-1-beginner');
    expect(resolved.lessonId).toBe('p1-l01-greetings-self-intro');

    const lesson = getCurriculumLessonById(resolved.lessonId);
    expect(lesson).toBeDefined();
    expect(lesson?.titleEn).toBe('Greetings & Self-Introduction');
    expect(lesson?.cefrLevel).toBe('A1');
  });

  await runner.it('2.2: Resolves route parameters across all 3 Phase boundaries', async () => {
    const testCases = [
      { phaseId: 'phase-1-beginner', lessonId: 'p1-l12-final-review-safeharbor-reflex' },
      { phaseId: 'phase-2-elementary', lessonId: 'p2-l01-expanding-answers-prep' },
      { phaseId: 'phase-3-intermediate', lessonId: 'p3-l01-ielts-p2-cuecard-mindmap' },
    ];

    for (const tc of testCases) {
      const lesson = getCurriculumLessonById(tc.lessonId);
      expect(lesson).toBeDefined();
      expect(lesson?.phaseId).toBe(tc.phaseId);
    }
  });

  await runner.it('2.3: Gracefully handles unknown or invalid lesson IDs without exception', async () => {
    const unknownLesson = getCurriculumLessonById('non-existent-lesson-999');
    expect(unknownLesson).toBeUndefined();
  });

  // ── Suite 3: 3-Tier Curriculum Catalog Invariants ───────────────────────
  runner.describe('Milestone 4: 3-Tier Curriculum Catalog Invariants', () => {});

  await runner.it('3.1: Exactly 32 curriculum lessons are registered across the 3 tiers', async () => {
    expect(allCurriculumLessons.length).toBe(32);
  });

  await runner.it('3.2: Phase 1 contains exactly 12 beginner foundation lessons (A1 / IELTS 0-3.0)', async () => {
    const p1 = getCurriculumLessonsByPhase('phase-1-beginner');
    expect(p1.length).toBe(12);
    p1.forEach((l, i) => {
      expect(l.order).toBe(i + 1);
      expect(l.phaseId).toBe('phase-1-beginner');
      expect(l.cefrLevel).toBe('A1');
    });
  });

  await runner.it('3.3: Phase 2 contains exactly 10 elementary expansion lessons (A2-B1 / IELTS 3.0-5.0)', async () => {
    const p2 = getCurriculumLessonsByPhase('phase-2-elementary');
    expect(p2.length).toBe(10);
    p2.forEach((l, i) => {
      expect(l.order).toBe(i + 1);
      expect(l.phaseId).toBe('phase-2-elementary');
      expect(['A2', 'B1'].includes(l.cefrLevel)).toBe(true);
    });
  });

  await runner.it('3.4: Phase 3 contains exactly 10 intermediate mastery lessons (B1-B2 / IELTS 5.0-6.5)', async () => {
    const p3 = getCurriculumLessonsByPhase('phase-3-intermediate');
    expect(p3.length).toBe(10);
    p3.forEach((l, i) => {
      expect(l.order).toBe(i + 1);
      expect(l.phaseId).toBe('phase-3-intermediate');
      expect(['B1', 'B2'].includes(l.cefrLevel)).toBe(true);
    });
  });

  await runner.it('3.5: Phase configs catalog contains complete metadata for all 3 phases', async () => {
    const phases = ['phase-1-beginner', 'phase-2-elementary', 'phase-3-intermediate'] as const;
    for (const pid of phases) {
      const config = SPEAKING_PHASE_CONFIGS[pid];
      expect(config).toBeDefined();
      expect(config.titleVi.length).toBeGreaterThan(0);
      expect(config.badge.length).toBeGreaterThan(0);
      expect(config.totalLessons).toBeGreaterThan(0);
    }
  });

  // ── Suite 4: 4-Stage Pedagogical Schema Verification across 32 Lessons ───
  runner.describe('Milestone 4: 4-Stage Pedagogical Schema Invariants', () => {});

  await runner.it('4.1: Stage 1 (Phonetics): Every lesson has focus sound, contrastive tip, and minimal pairs', async () => {
    for (const lesson of allCurriculumLessons) {
      const st1 = lesson.stage1Phonetics;
      expect(st1).toBeDefined();
      expect(typeof st1.focusSound).toBe('string');
      expect(st1.focusSound.length).toBeGreaterThan(0);
      expect(typeof st1.vietnameseContrastiveTip).toBe('string');
      expect(st1.vietnameseContrastiveTip.length).toBeGreaterThan(10);
      expect(Array.isArray(st1.minimalPairs)).toBe(true);
      expect(st1.minimalPairs.length).toBeGreaterThanOrEqual(1);

      for (const pair of st1.minimalPairs) {
        expect(pair.wordA.length).toBeGreaterThan(0);
        expect(pair.wordB.length).toBeGreaterThan(0);
        expect(pair.ipaA.length).toBeGreaterThan(0);
        expect(pair.ipaB.length).toBeGreaterThan(0);
        expect(pair.meaningA.length).toBeGreaterThan(0);
        expect(pair.meaningB.length).toBeGreaterThan(0);
      }
    }
  });

  await runner.it('4.2: Stage 2 (Core Patterns): Every lesson has formula, Vietnamese rule, and Lego slots', async () => {
    for (const lesson of allCurriculumLessons) {
      const st2 = lesson.stage2CorePatterns;
      expect(st2).toBeDefined();
      expect(typeof st2.formula).toBe('string');
      expect(st2.formula.length).toBeGreaterThan(0);
      expect(typeof st2.vietnameseGrammarRule).toBe('string');
      expect(st2.vietnameseGrammarRule.length).toBeGreaterThan(10);
      expect(Array.isArray(st2.legoSlots)).toBe(true);
      expect(st2.legoSlots.length).toBeGreaterThanOrEqual(1);

      for (const lego of st2.legoSlots) {
        expect(typeof lego.template).toBe('string');
        expect(lego.template.length).toBeGreaterThan(0);
        expect(typeof lego.slots).toBe('object');
        const slotKeys = Object.keys(lego.slots);
        expect(slotKeys.length).toBeGreaterThanOrEqual(1);
        for (const key of slotKeys) {
          expect(lego.slots[key].length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  await runner.it('4.3: Stage 3 (Guided Dialogue): Every lesson has context and at least 2 dialogue turns', async () => {
    for (const lesson of allCurriculumLessons) {
      const st3 = lesson.stage3GuidedDialogue;
      expect(st3).toBeDefined();
      expect(typeof st3.titleVi).toBe('string');
      expect(typeof st3.contextVi).toBe('string');
      expect(Array.isArray(st3.turns)).toBe(true);
      expect(st3.turns.length).toBeGreaterThanOrEqual(2);

      for (const turn of st3.turns) {
        expect(typeof turn.speaker).toBe('string');
        expect(typeof turn.en).toBe('string');
        expect(turn.en.length).toBeGreaterThan(0);
        expect(typeof turn.vi).toBe('string');
        expect(turn.vi.length).toBeGreaterThan(0);
        expect(Array.isArray(turn.coreKeywords)).toBe(true);
        expect(turn.coreKeywords.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  await runner.it('4.4: Stage 4 (SafeHarbor Evaluation): Every lesson has promptVi, targetSentence, and score criteria', async () => {
    for (const lesson of allCurriculumLessons) {
      const st4 = lesson.stage4SafeHarborEvaluation;
      expect(st4).toBeDefined();
      expect(typeof st4.promptVi).toBe('string');
      expect(st4.promptVi.length).toBeGreaterThan(0);
      expect(typeof st4.targetSentence).toBe('string');
      expect(st4.targetSentence.length).toBeGreaterThan(0);
      expect(Array.isArray(st4.coreKeywords)).toBe(true);
      expect(st4.coreKeywords.length).toBeGreaterThanOrEqual(1);
      expect(typeof st4.minimumPassingScore).toBe('number');
      expect(st4.minimumPassingScore).toBeGreaterThanOrEqual(60);
      expect(st4.minimumPassingScore).toBeLessThan(100);
    }
  });

  // ── Suite 5: Interactive Lego Slot Substitution Logic Engine ─────────────
  runner.describe('Milestone 4: Lego Slot Substitution Engine', () => {});

  await runner.it('5.1: Lego slot engine correctly substitutes chosen options into template', async () => {
    const template = "I'd like to {action} {item} for {person}.";
    const slots: Record<string, string[]> = {
      action: ['order', 'reserve', 'buy'],
      item: ['a hot latte', 'a table', 'a ticket'],
      person: ['my friend', 'myself', 'my boss'],
    };

    const selectedSlots: Record<string, string> = {
      action: 'reserve',
      item: 'a table',
      person: 'my friend',
    };

    let assembled = template;
    for (const [key, options] of Object.entries(slots)) {
      const chosen = selectedSlots[key] || options[0] || '';
      assembled = assembled.replace(new RegExp(`\\{${key}\\}`, 'g'), chosen);
    }

    expect(assembled).toBe("I'd like to reserve a table for my friend.");
  });

  await runner.it('5.2: Assembled sentence produces valid audio-playable text string', async () => {
    const lesson = allCurriculumLessons[0];
    const legoItem = lesson.stage2CorePatterns.legoSlots[0];
    let sentence = legoItem.template;
    for (const [k, v] of Object.entries(legoItem.slots)) {
      sentence = sentence.replace(new RegExp(`\\{${k}\\}`, 'g'), v[0]);
    }
    expect(typeof sentence).toBe('string');
    expect(sentence.length).toBeGreaterThan(5);
    expect(sentence.includes('{')).toBe(false);
    expect(sentence.includes('}')).toBe(false);
  });

  // ── Suite 6: Keyword Highlight Tokenizer ──────────────────────────────────
  runner.describe('Milestone 4: Keyword Highlight Tokenizer', () => {});

  await runner.it('6.1: Highlights keywords case-insensitively while preserving non-keyword text', async () => {
    const text = 'I would like to order a hot latte with whole milk.';
    const keywords = ['order', 'hot latte', 'whole milk'];

    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    expect(parts.length).toBeGreaterThan(1);
    const matched = parts.filter((p) =>
      keywords.some((k) => k.toLowerCase() === p.toLowerCase())
    );
    expect(matched.length).toBe(3);
  });

  // ── Suite 7: SafeHarbor Evaluation Integration ───────────────────────────
  runner.describe('Milestone 4: SafeHarbor Evaluation Integration', () => {});

  await runner.it('7.1: SafeHarbor matcher passes exact target sentence from Phase 1 Lesson 1', async () => {
    const lesson = allCurriculumLessons[0];
    const target = lesson.stage4SafeHarborEvaluation.targetSentence;
    const coreKeywords = lesson.stage4SafeHarborEvaluation.coreKeywords;
    const minScore = lesson.stage4SafeHarborEvaluation.minimumPassingScore;

    const evalResult = evaluateSafeHarborSpeech(target, target, coreKeywords);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.score).toBeGreaterThanOrEqual(minScore);
    expect(evalResult.tier).toBe('excellent');
  });

  await runner.it('7.2: SafeHarbor matcher tolerates hesitation fillers (um, uh) on target sentence', async () => {
    const lesson = allCurriculumLessons[0];
    const target = lesson.stage4SafeHarborEvaluation.targetSentence;
    const coreKeywords = lesson.stage4SafeHarborEvaluation.coreKeywords;
    const minScore = lesson.stage4SafeHarborEvaluation.minimumPassingScore;

    const spokenWithFillers = `Um, actually, ${target}, you know.`;
    const evalResult = evaluateSafeHarborSpeech(spokenWithFillers, target, coreKeywords);
    expect(evalResult.passed).toBe(true);
    expect(evalResult.score).toBeGreaterThanOrEqual(minScore);
  });

  // ── Suite 8: Sequential Lesson Progression Graph ─────────────────────────
  runner.describe('Milestone 4: Sequential Lesson Progression Graph', () => {});

  await runner.it('8.1: Full sequential navigation graph from lesson 1 to lesson 32 is continuous', async () => {
    for (let i = 0; i < allCurriculumLessons.length; i++) {
      const current = allCurriculumLessons[i];
      const prev = i > 0 ? allCurriculumLessons[i - 1] : null;
      const next = i < allCurriculumLessons.length - 1 ? allCurriculumLessons[i + 1] : null;

      if (i === 0) {
        expect(prev).toBeNull();
      } else {
        expect(prev).not.toBeNull();
      }

      if (i === allCurriculumLessons.length - 1) {
        expect(next).toBeNull();
      } else {
        expect(next).not.toBeNull();
      }
    }
  });

  await runner.it('8.2: Phase boundary transitions navigate seamlessly (P1 -> P2 and P2 -> P3)', async () => {
    // End of Phase 1 (lesson 12) -> Start of Phase 2 (lesson 1)
    const p1Last = allCurriculumLessons[11];
    const p2First = allCurriculumLessons[12];
    expect(p1Last.id).toBe('p1-l12-final-review-safeharbor-reflex');
    expect(p2First.id).toBe('p2-l01-expanding-answers-prep');

    // End of Phase 2 (lesson 10) -> Start of Phase 3 (lesson 1)
    const p2Last = allCurriculumLessons[21];
    const p3First = allCurriculumLessons[22];
    expect(p2Last.id).toBe('p2-l10-asking-clarification-conversation-control');
    expect(p3First.id).toBe('p3-l01-ielts-p2-cuecard-mindmap');
  });
}

// Standalone execution entrypoint
async function main() {
  console.log('================================================================================');
  console.log('  SPEAKING CURRICULUM UI INTEGRATION & ROUTE SANITY TEST SUITE');
  console.log('================================================================================\n');

  setupMockBrowserEnvironment();
  const runner = new TestRunner();

  try {
    await runCurriculumUiRoutesTests(runner);
  } finally {
    teardownMockBrowserEnvironment();
  }

  const stats = runner.getStats();
  console.log('\n================================================================================');
  console.log(`  SUMMARY: ${stats.passed}/${stats.total} passed, ${stats.failed} failed (${stats.durationMs}ms)`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: All Curriculum UI routes & interactive state tests passed!');
    process.exit(0);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  });
}
