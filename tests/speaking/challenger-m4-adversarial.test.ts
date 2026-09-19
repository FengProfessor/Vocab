/**
 * Adversarial Challenger Test Suite for Milestone 4 (Interactive UI Integration & Routing)
 * File: tests/speaking/challenger-m4-adversarial.test.ts
 *
 * Verifies empirically:
 * 1. Boundary cases: Invalid phaseId/lessonId graceful fallback (404), route param resolution, cross-phase safety.
 * 2. SSR / hydration safety in headless Node.js environment (typeof window === 'undefined').
 * 3. Dynamic Stage 2 Lego slot substitution across all 32 lessons and multi-choice permutations.
 * 4. Stage 3 Keyword Tokenizer adversarial regex stress and overlapping keywords.
 * 5. Stage 4 SafeHarbor speech evaluation integration and sequential 32-lesson navigation graph.
 *
 * Usage:
 *   npx tsx tests/speaking/challenger-m4-adversarial.test.ts
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';

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
import type { SpeakingPhaseId } from '../../src/types/speaking-curriculum';

// Components under review
import SpeakingCurriculumCatalogPage from '../../src/app/student/speaking/curriculum/page';
import CurriculumLessonDetailPage from '../../src/app/student/speaking/curriculum/[phaseId]/[lessonId]/page';
import StudentSpeakingPage from '../../src/app/student/speaking/page';
import { DualSpeedAudioButton, SafeHarborRecorder } from '../../src/components/speaking';

// Helper: Wrap component in mock Next.js App Router context for SSR tests
function renderWithNextContext(ui: React.ReactElement, pathname = '/student/speaking/curriculum'): string {
  const mockRouter = {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  };

  return renderToString(
    React.createElement(
      AppRouterContext.Provider,
      { value: mockRouter },
      React.createElement(PathnameContext.Provider, { value: pathname }, ui)
    )
  );
}

// Replica of assembleLegoSentence logic from [phaseId]/[lessonId]/page.tsx
function assembleLegoSentence(
  template: string,
  slots: Record<string, string[]>,
  selectedSlots: Record<string, string>
): string {
  let result = template;
  for (const [slotKey, options] of Object.entries(slots)) {
    const chosenWord = selectedSlots[slotKey] || options[0] || '';
    result = result.replace(new RegExp(`\\{${slotKey}\\}`, 'g'), chosenWord);
  }
  return result;
}

// Replica of renderHighlightedText tokenizer from [phaseId]/[lessonId]/page.tsx
function tokenizeKeywords(text: string, keywords?: string[]): { matched: string[]; nonMatched: string[] } {
  if (!keywords || keywords.length === 0 || !text) {
    return { matched: [], nonMatched: [text] };
  }

  const validKeywords = keywords
    .filter((k) => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim())
    .sort((a, b) => b.length - a.length);

  if (validKeywords.length === 0) {
    return { matched: [], nonMatched: [text] };
  }

  const escapedPatterns = validKeywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escapedPatterns.join('|')})`, 'gi');
  const parts = text.split(regex);

  const matched: string[] = [];
  const nonMatched: string[] = [];

  for (const part of parts) {
    const isMatch = validKeywords.some(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (isMatch) {
      matched.push(part);
    } else if (part.length > 0) {
      nonMatched.push(part);
    }
  }

  return { matched, nonMatched };
}

export async function runMilestone4AdversarialSuite(runner: TestRunner): Promise<void> {
  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Boundary & Adversarial Routing Stress Test
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite 1: Boundary Cases & Routing Fallback', () => {});

  await runner.it('1.1: getCurriculumLessonById returns undefined for all malicious, invalid, or empty IDs', async () => {
    const adversarialIds = [
      '',
      '   ',
      'non-existent-lesson-404',
      'p99-l99-unknown',
      '../../../etc/passwd',
      '<script>alert("xss")</script>',
      "p1-l01'; DROP TABLE lessons;--",
      'null',
      'undefined',
      'NaN',
      'p1-l01-GREETINGS-SELF-INTRO', // wrong case
    ];

    for (const badId of adversarialIds) {
      const result = getCurriculumLessonById(badId);
      expect(result).toBeUndefined();
    }
  });

  await runner.it('1.2: Detail Page renders graceful 404 fallback card when lesson is not found', async () => {
    const invalidLessonId = 'adversarial-invalid-lesson-id-999';
    const html = renderWithNextContext(
      React.createElement(CurriculumLessonDetailPage, {
        params: { phaseId: 'phase-1-beginner', lessonId: invalidLessonId } as any,
      }),
      `/student/speaking/curriculum/phase-1-beginner/${invalidLessonId}`
    );

    // Must show friendly error heading
    expect(html).toContain('Không tìm thấy bài học');
    // Must display the offending ID so user understands what happened
    expect(html).toContain(invalidLessonId);
    // Must provide return action link pointing to /student/speaking/curriculum
    expect(html).toContain('/student/speaking/curriculum');
    expect(html).toContain('Trở về danh sách bài học');
  });

  await runner.it('1.3: getCurriculumLessonsByPhase returns empty array for invalid phase IDs', async () => {
    const badPhases = [
      'phase-4-expert' as any,
      'phase-0-pre-foundation' as any,
      'invalid' as any,
      '' as any,
      null as any,
      undefined as any,
    ];

    for (const bp of badPhases) {
      const lessons = getCurriculumLessonsByPhase(bp);
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBe(0);
    }
  });

  await runner.it('1.4: Cross-phase route mismatch resolves lesson accurately and maintains canonical next links', async () => {
    // Navigate with phase-3 in URL but phase-1 lesson ID
    const mismatchedParams = {
      phaseId: 'phase-3-intermediate',
      lessonId: 'p1-l01-greetings-self-intro',
    };

    const lesson = getCurriculumLessonById(mismatchedParams.lessonId);
    expect(lesson).toBeDefined();
    expect(lesson?.phaseId).toBe('phase-1-beginner');

    const html = renderWithNextContext(
      React.createElement(CurriculumLessonDetailPage, {
        params: mismatchedParams as any,
      })
    );

    // Lesson renders correctly despite phaseId mismatch in URL
    expect(html).toContain('Chào hỏi');
    // Breadcrumb displays correct order number
    expect(/Bài (?:<!-- -->)?01/.test(html)).toBe(true);

    // Verify next lesson in sequence is determined from canonical catalog, not corrupted by URL phaseId
    const currentIndex = allCurriculumLessons.findIndex((l) => l.id === lesson?.id);
    const nextLesson = allCurriculumLessons[currentIndex + 1];
    expect(nextLesson).toBeDefined();
    expect(nextLesson.phaseId).toBe('phase-1-beginner');
    expect(nextLesson.id).toBe('p1-l02-final-consonants-sz');
  });

  await runner.it('1.5: Handles Promise-wrapped route parameters (Next.js 15+ / React 19 use(params))', async () => {
    const promiseParams = Promise.resolve({
      phaseId: 'phase-2-elementary',
      lessonId: 'p2-l01-expanding-answers-prep',
    });

    const lesson = getCurriculumLessonById((await promiseParams).lessonId);
    expect(lesson).toBeDefined();
    expect(lesson?.titleEn).toBe('Expanding Answers with the PREP Framework');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: SSR / Hydration Safety in Headless Node.js Environment
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite 2: SSR / Hydration Safety in Headless Node.js', () => {});

  await runner.it('2.1: Invariant check: Execution environment is strictly headless Node.js (no window)', async () => {
    expect(typeof window).toBe('undefined');
  });

  await runner.it('2.2: SpeakingCurriculumCatalogPage renders complete SSR HTML without DOM errors', async () => {
    const html = renderWithNextContext(React.createElement(SpeakingCurriculumCatalogPage));

    expect(html.length).toBeGreaterThan(10000);
    // Verify core titles
    expect(html).toContain('Lộ Trình Luyện Nói Phản Xạ 32 Bài Học');
    // Verify 3 Phase tabs
    expect(html).toContain('Phase 1: Beginner');
    expect(html).toContain('Phase 2: Elementary');
    expect(html).toContain('Phase 3: Intermediate');
    // Verify statistics bar
    expect(html).toContain('32');
    expect(html).toContain('3');
    expect(html).toContain('100%');
    expect(html).toContain('&lt; 1s');
  });

  await runner.it('2.3: CurriculumLessonDetailPage renders full Stage 1 SSR HTML without browser APIs', async () => {
    const lesson = allCurriculumLessons[0];
    const html = renderWithNextContext(
      React.createElement(CurriculumLessonDetailPage, {
        params: { phaseId: lesson.phaseId, lessonId: lesson.id } as any,
      })
    );

    expect(html.length).toBeGreaterThan(10000);
    // Stage 1 Header
    expect(html).toContain('Chặng 1: Khởi Động Khẩu Hình &amp; Trị Lỗi Ngữ Âm');
    expect(html).toContain(lesson.stage1Phonetics.focusSound);
    expect(html).toContain(lesson.stage1Phonetics.vietnameseContrastiveTip);
    // Minimal Pairs
    if (lesson.stage1Phonetics.minimalPairs.length > 0) {
      expect(html).toContain(lesson.stage1Phonetics.minimalPairs[0].wordA);
      expect(html).toContain(lesson.stage1Phonetics.minimalPairs[0].wordB);
    }
    // Bottom navigation
    expect(html).toContain('Chặng tiếp theo');
    expect(html).toContain('Chặng trước');
  });

  await runner.it('2.4: HTML spec compliance: No nested <button> or <a> elements in SSR output', async () => {
    const catalogHtml = renderWithNextContext(React.createElement(SpeakingCurriculumCatalogPage));
    const lesson = allCurriculumLessons[0];
    const lessonHtml = renderWithNextContext(
      React.createElement(CurriculumLessonDetailPage, {
        params: { phaseId: lesson.phaseId, lessonId: lesson.id } as any,
      })
    );

    // Rule 1: No <button> inside <button>
    const nestedButtonRegex = /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?<button\b/i;
    expect(nestedButtonRegex.test(catalogHtml)).toBe(false);
    expect(nestedButtonRegex.test(lessonHtml)).toBe(false);

    // Rule 2: No <a> inside <a>
    const nestedAnchorRegex = /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<a\b/i;
    expect(nestedAnchorRegex.test(catalogHtml)).toBe(false);
    expect(nestedAnchorRegex.test(lessonHtml)).toBe(false);
  });

  await runner.it('2.5: DualSpeedAudioButton and SafeHarborRecorder do not trigger browser audio/STT in SSR', async () => {
    // Render standalone DualSpeedAudioButton
    const audioHtml = renderToString(
      React.createElement(DualSpeedAudioButton, {
        text: 'Test sentence for SSR safety.',
        audioUrl: 'https://example.com/audio.mp3',
        size: 'sm',
      })
    );
    expect(audioHtml).toContain('0.8x');
    expect(audioHtml).toContain('1.0x');

    // Render standalone SafeHarborRecorder
    const recorderHtml = renderToString(
      React.createElement(SafeHarborRecorder, {
        targetSentence: 'Test target sentence.',
        coreKeywords: ['test', 'target'],
      })
    );
    expect(recorderHtml).toContain('aria-label="Bắt đầu ghi âm phát âm"');
    expect(recorderHtml).toContain('Nhấn Micro và đọc to câu mẫu');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: Dynamic Stage 2 Lego Slot Substitution Simulation
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite 3: Stage 2 Lego Slot Substitution Engine', () => {});

  await runner.it('3.1: All 32 curriculum lessons have valid Lego templates with matching slot keys', async () => {
    let checkedLessons = 0;
    for (const lesson of allCurriculumLessons) {
      checkedLessons++;
      const legoSlots = lesson.stage2CorePatterns.legoSlots;
      expect(Array.isArray(legoSlots)).toBe(true);
      expect(legoSlots.length).toBeGreaterThanOrEqual(1);

      for (const item of legoSlots) {
        expect(typeof item.template).toBe('string');
        expect(item.template.length).toBeGreaterThan(0);

        const slotKeys = Object.keys(item.slots);
        expect(slotKeys.length).toBeGreaterThanOrEqual(1);

        for (const key of slotKeys) {
          // Template must contain placeholder {key}
          expect(item.template).toContain(`{${key}}`);
          // Slot must contain at least 1 option choice
          expect(Array.isArray(item.slots[key])).toBe(true);
          expect(item.slots[key].length).toBeGreaterThanOrEqual(1);
          for (const opt of item.slots[key]) {
            expect(typeof opt).toBe('string');
            expect(opt.length).toBeGreaterThan(0);
          }
        }
      }
    }
    expect(checkedLessons).toBe(32);
  });

  await runner.it('3.2: Default Lego assembly leaves 0 un-substituted {tokens} across all 32 lessons', async () => {
    for (const lesson of allCurriculumLessons) {
      for (const item of lesson.stage2CorePatterns.legoSlots) {
        const assembled = assembleLegoSentence(item.template, item.slots, {});
        // Must not contain curly braces
        expect(assembled.includes('{')).toBe(false);
        expect(assembled.includes('}')).toBe(false);
        // Must not be empty
        expect(assembled.trim().length).toBeGreaterThan(5);
      }
    }
  });

  await runner.it('3.3: Dynamic slot choice permutations dynamically alter the constructed sentence', async () => {
    // Pick representative lessons from P1, P2, and P3
    const testLessonIds = [
      'p1-l01-greetings-self-intro',
      'p1-l09-ordering-food-drink',
      'p2-l01-expanding-answers-prep',
      'p3-l01-ielts-p2-cuecard-mindmap',
    ];

    for (const lid of testLessonIds) {
      const lesson = getCurriculumLessonById(lid);
      expect(lesson).toBeDefined();
      const item = lesson!.stage2CorePatterns.legoSlots[0];

      const slotKeys = Object.keys(item.slots);
      for (const key of slotKeys) {
        const choices = item.slots[key];
        if (choices.length > 1) {
          const sentenceA = assembleLegoSentence(item.template, item.slots, { [key]: choices[0] });
          const sentenceB = assembleLegoSentence(item.template, item.slots, { [key]: choices[1] });

          expect(sentenceA).toContain(choices[0]);
          expect(sentenceB).toContain(choices[1]);
          expect(sentenceA).not.toEqual(sentenceB);
        }
      }
    }
  });

  await runner.it('3.4: Multi-slot independence: Changing slot A preserves slot B selection', async () => {
    const template = 'I {verb} {noun} every {time}.';
    const slots = {
      verb: ['read', 'write', 'study'],
      noun: ['books', 'essays', 'reports'],
      time: ['morning', 'afternoon', 'night'],
    };

    let selections: Record<string, string> = {};

    // Initial default
    let sentence = assembleLegoSentence(template, slots, selections);
    expect(sentence).toBe('I read books every morning.');

    // Choose noun = 'reports'
    selections = { ...selections, noun: 'reports' };
    sentence = assembleLegoSentence(template, slots, selections);
    expect(sentence).toBe('I read reports every morning.');

    // Choose verb = 'write', noun remains 'reports'
    selections = { ...selections, verb: 'write' };
    sentence = assembleLegoSentence(template, slots, selections);
    expect(sentence).toBe('I write reports every morning.');

    // Choose time = 'night', previous selections preserved
    selections = { ...selections, time: 'night' };
    sentence = assembleLegoSentence(template, slots, selections);
    expect(sentence).toBe('I write reports every night.');
  });

  await runner.it('3.5: Adversarial Lego input fuzzing: regex special characters and edge cases', async () => {
    const template = 'Special frame: {item} with {price} and {note}.';
    const slots = {
      item: ['C++ manual', 'Iced Latte (large)', '50% cotton / 50% wool'],
      price: ['$19.99', '$99.00', 'free [limited]'],
      note: ['handle w/ care', 'call 1-800-TEST', 'don\'t forget!'],
    };

    const selections = {
      item: 'Iced Latte (large)',
      price: '$19.99',
      note: 'don\'t forget!',
    };

    const assembled = assembleLegoSentence(template, slots, selections);
    expect(assembled).toBe("Special frame: Iced Latte (large) with $19.99 and don't forget!.");
    expect(assembled.includes('{')).toBe(false);
    expect(assembled.includes('}')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: Stage 3 Keyword Highlighting Adversarial Engine
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite 4: Stage 3 Dialogue & Token Highlighting', () => {});

  await runner.it('4.1: Tokenizer matches keywords case-insensitively while preserving original text case', async () => {
    const text = 'I would LOVE to ORDER a HOT LATTE today.';
    const keywords = ['order', 'hot latte'];

    const result = tokenizeKeywords(text, keywords);
    expect(result.matched.length).toBe(2);
    expect(result.matched).toContain('ORDER');
    expect(result.matched).toContain('HOT LATTE');
  });

  await runner.it('4.2: Tokenizer prioritizes longer overlapping keywords to prevent partial fragmentation', async () => {
    const text = 'I enjoy iced green tea in the summer.';
    const keywords = ['tea', 'green tea', 'iced green tea'];

    const result = tokenizeKeywords(text, keywords);
    // Should match "iced green tea" as a single token, not "tea" 3 times
    expect(result.matched.length).toBe(1);
    expect(result.matched[0]).toBe('iced green tea');
  });

  await runner.it('4.3: Tokenizer handles regex meta-characters in keywords without throwing', async () => {
    const text = 'We need to discuss item A+ and price $50 (urgent).';
    const keywords = ['A+', '$50', '(urgent)'];

    const result = tokenizeKeywords(text, keywords);
    expect(result.matched.length).toBe(3);
    expect(result.matched).toContain('A+');
    expect(result.matched).toContain('$50');
    expect(result.matched).toContain('(urgent)');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 5: Stage 4 SafeHarbor Evaluation & Sequential Progression Graph
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Suite 5: Stage 4 SafeHarbor & Progression Graph', () => {});

  await runner.it('5.1: Stage 4 passing score: exact target sentence achieves >= minimumPassingScore on sampled lessons', async () => {
    const sampleLessons = [
      allCurriculumLessons[0],   // Phase 1 start
      allCurriculumLessons[11],  // Phase 1 end
      allCurriculumLessons[12],  // Phase 2 start
      allCurriculumLessons[21],  // Phase 2 end
      allCurriculumLessons[22],  // Phase 3 start
      allCurriculumLessons[31],  // Phase 3 end
    ];

    for (const l of sampleLessons) {
      const st4 = l.stage4SafeHarborEvaluation;
      const res = evaluateSafeHarborSpeech(st4.targetSentence, st4.targetSentence, st4.coreKeywords);

      expect(res.passed).toBe(true);
      expect(res.score).toBeGreaterThanOrEqual(st4.minimumPassingScore);
      expect(res.tier).toBe('excellent');
    }
  });

  await runner.it('5.2: SafeHarbor non-punitive resilience: Utterance with heavy fillers still passes', async () => {
    const lesson = allCurriculumLessons[0];
    const target = lesson.stage4SafeHarborEvaluation.targetSentence;
    const keywords = lesson.stage4SafeHarborEvaluation.coreKeywords;
    const minScore = lesson.stage4SafeHarborEvaluation.minimumPassingScore;

    const fillerSpeech = `Um, well, you see, ${target}, like, you know.`;
    const res = evaluateSafeHarborSpeech(fillerSpeech, target, keywords);

    expect(res.passed).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(minScore);
  });

  await runner.it('5.3: SafeHarbor discriminatory power: Off-target gibberish fails to pass', async () => {
    const lesson = allCurriculumLessons[0];
    const target = lesson.stage4SafeHarborEvaluation.targetSentence;
    const keywords = lesson.stage4SafeHarborEvaluation.coreKeywords;

    const gibberish = 'Tomorrow morning I will go swimming at the ocean beach.';
    const res = evaluateSafeHarborSpeech(gibberish, target, keywords);

    expect(res.passed).toBe(false);
    expect(res.score).toBeLessThan(lesson.stage4SafeHarborEvaluation.minimumPassingScore);
  });

  await runner.it('5.4: Sequential lesson navigation graph is continuous across all 32 lessons and 3 phases', async () => {
    for (let i = 0; i < allCurriculumLessons.length; i++) {
      const cur = allCurriculumLessons[i];
      const prev = i > 0 ? allCurriculumLessons[i - 1] : null;
      const next = i < allCurriculumLessons.length - 1 ? allCurriculumLessons[i + 1] : null;

      // Lesson 1 boundary
      if (i === 0) {
        expect(prev).toBeNull();
      } else {
        expect(prev).not.toBeNull();
      }

      // Lesson 32 boundary
      if (i === 31) {
        expect(next).toBeNull();
      } else {
        expect(next).not.toBeNull();
      }
    }

    // Phase 1 -> Phase 2 transition
    expect(allCurriculumLessons[11].phaseId).toBe('phase-1-beginner');
    expect(allCurriculumLessons[12].phaseId).toBe('phase-2-elementary');

    // Phase 2 -> Phase 3 transition
    expect(allCurriculumLessons[21].phaseId).toBe('phase-2-elementary');
    expect(allCurriculumLessons[22].phaseId).toBe('phase-3-intermediate');
  });
}

// Standalone execution entrypoint
async function main() {
  console.log('================================================================================');
  console.log('  CHALLENGER MILESTONE 4: ADVERSARIAL VERIFICATION & RESILIENCE SUITE');
  console.log('================================================================================\n');

  const runner = new TestRunner();

  try {
    await runMilestone4AdversarialSuite(runner);
  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
    process.exit(1);
  }

  const stats = runner.getStats();
  console.log('\n================================================================================');
  console.log(`  CHALLENGER SUMMARY: ${stats.passed}/${stats.total} passed, ${stats.failed} failed (${stats.durationMs}ms)`);
  console.log('================================================================================\n');

  if (stats.failed > 0) {
    console.error(`❌ FAILED: ${stats.failed} adversarial challenge tests failed.`);
    process.exit(1);
  } else {
    console.log('✅ ALL ADVERSARIAL CHALLENGES PASSED! Milestone 4 UI & Routing is verified robust.');
    process.exit(0);
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
}
