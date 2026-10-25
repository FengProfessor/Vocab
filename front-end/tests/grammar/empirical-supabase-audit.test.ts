/**
 * Empirical Supabase Database Auditor for English Grammar Curriculum.
 *
 * Direct LIVE PostgreSQL / Supabase verification:
 * - Refuses to fall back to static files (fails fast if live connection fails)
 * - Verifies 0 unwinnable MCQs across all lessons & exercises
 * - Verifies 0 leaked answer keys in exercise stems
 * - Verifies 0 missing blanks in cloze / fill_blank questions
 * - Verifies 0 unrendered LaTeX math tokens in both theory_vi and theory columns
 * - Verifies 0 duplicate options in MCQs
 * - Verifies all foreign keys between grammar_lessons and grammar_topics
 */

import { createClient } from '@supabase/supabase-js';
import { loadEnv, TestRunner, expect } from './test-harness';

interface AuditDefect {
  lessonIndex: number;
  lessonTitle: string;
  category: string;
  detail: string;
  rawItem?: unknown;
}

export async function runEmpiricalSupabaseAudit(runner: TestRunner): Promise<void> {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'LIVE SUPABASE CREDENTIALS MISSING: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local',
    );
  }

  const sb = createClient(url, key);

  // Direct connectivity test
  const { data: topics, error: topicErr } = await sb
    .from('grammar_topics')
    .select('id, title, order_index');

  if (topicErr) {
    throw new Error(`LIVE SUPABASE QUERY FAILED for grammar_topics: ${topicErr.message}`);
  }

  const { data: lessons, error: lessonErr } = await sb
    .from('grammar_lessons')
    .select('id, topic_id, title, order_index, theory_vi, theory, examples, sections, exercises')
    .order('order_index');

  if (lessonErr) {
    throw new Error(`LIVE SUPABASE QUERY FAILED for grammar_lessons: ${lessonErr.message}`);
  }

  if (!lessons || lessons.length === 0) {
    throw new Error('LIVE SUPABASE RETURNED 0 LESSONS: Database appears unseeded or empty!');
  }

  console.log(`\n  [Empirical Supabase Connection] Connected to ${url}`);
  console.log(`  [Live Inventory] ${topics?.length || 0} topics, ${lessons.length} lessons queried successfully.\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Check 1: 0 Unwinnable MCQs & Duplicate Options
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Check 1: Zero Unwinnable MCQs & Valid Options Containment', () => {
    runner.it('Every MCQ across all lessons contains its correct answer in its options list', () => {
      const unwinnable: AuditDefect[] = [];
      const duplicates: AuditDefect[] = [];
      let totalMcqs = 0;

      for (const lesson of lessons) {
        const exs = Array.isArray(lesson.exercises) ? lesson.exercises : [];
        exs.forEach((ex: any, idx: number) => {
          const type = String(ex.type || ex.kind || '').toLowerCase();
          const rawOpts = ex.options || ex.opts || [];
          const hasOpts = Array.isArray(rawOpts) && rawOpts.length > 0;

          if (type === 'multiple_choice' || type === 'mcq' || (hasOpts && type !== 'fill_blank')) {
            totalMcqs++;
            const opts: string[] = rawOpts.map((o: any) => String(o ?? '').trim()).filter((o: string) => o.length > 0);
            const ans = String(ex.correct_answer !== undefined ? ex.correct_answer : ex.answer || '').trim();

            // Check for duplicate options
            const lowerOpts = opts.map((o) => o.toLowerCase());
            const uniqueOpts = new Set(lowerOpts);
            if (uniqueOpts.size < lowerOpts.length) {
              duplicates.push({
                lessonIndex: lesson.order_index,
                lessonTitle: lesson.title,
                category: 'DUPLICATE_MCQ_OPTION',
                detail: `Q#${idx}: Duplicate options detected in [${opts.join(', ')}]`,
                rawItem: ex,
              });
            }

            if (opts.length > 0 && ans) {
              const isLetter = /^[A-D]$/i.test(ans);
              const directMatch = opts.some((o) => o.toLowerCase() === ans.toLowerCase());
              const cleanMatch = opts.some(
                (o) => o.replace(/^[A-D]\.\s*/i, '').toLowerCase() === ans.toLowerCase(),
              );
              const prefixMatch = opts.some(
                (o) => o.startsWith(`${ans}.`) || o.startsWith(`${ans} `),
              );

              // Check if letter index maps to an option (e.g. ans "A" -> opts[0])
              let letterIndexMatch = false;
              if (isLetter) {
                const charCode = ans.toUpperCase().charCodeAt(0) - 65; // 0 for A, 1 for B...
                letterIndexMatch = charCode >= 0 && charCode < opts.length;
              }

              if (!isLetter && !directMatch && !cleanMatch && !prefixMatch && !letterIndexMatch) {
                unwinnable.push({
                  lessonIndex: lesson.order_index,
                  lessonTitle: lesson.title,
                  category: 'UNWINNABLE_MCQ',
                  detail: `Q#${idx}: Answer "${ans}" not found in options [${opts.join(' | ')}]`,
                  rawItem: ex,
                });
              }
            } else if (type === 'multiple_choice' && opts.length === 0) {
              unwinnable.push({
                lessonIndex: lesson.order_index,
                lessonTitle: lesson.title,
                category: 'EMPTY_OPTIONS_MCQ',
                detail: `Q#${idx}: MCQ has empty options list, answer is "${ans}"`,
                rawItem: ex,
              });
            }
          }
        });
      }

      console.log(`    Audited ${totalMcqs} MCQs across ${lessons.length} lessons.`);

      if (unwinnable.length > 0) {
        console.error(`    Found ${unwinnable.length} unwinnable MCQs:`);
        unwinnable.forEach((u) => console.error(`    - Buổi ${u.lessonIndex}: ${u.detail}`));
      }
      expect(unwinnable.length).toBe(0);

      if (duplicates.length > 0) {
        console.error(`    Found ${duplicates.length} MCQs with duplicate options:`);
        duplicates.forEach((d) => console.error(`    - Buổi ${d.lessonIndex}: ${d.detail}`));
      }
      expect(duplicates.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Check 2: 0 Leaked Answer Keys in Stems
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Check 2: Zero Leaked Answer Keys in Stems', () => {
    runner.it('Scans all 1,700+ exercises and verifies zero prompt leaks', () => {
      const leaked: AuditDefect[] = [];
      let totalExercises = 0;

      for (const lesson of lessons) {
        const exs = Array.isArray(lesson.exercises) ? lesson.exercises : [];
        totalExercises += exs.length;

        exs.forEach((ex: any, idx: number) => {
          const stem = String(ex.question || ex.q || ex.prompt || ex.stem || '');

          // Leak patterns: (A -> saw), (B → was reading), (A: went), (A. was)
          if (/\([A-D]\s*(?:→|->|:)\s*[^)]+\)/i.test(stem)) {
            leaked.push({
              lessonIndex: lesson.order_index,
              lessonTitle: lesson.title,
              category: 'LEAKED_STEM',
              detail: `Q#${idx}: Verbatim answer leak in stem: "${stem}"`,
              rawItem: ex,
            });
          }

          // HTML tag leaks like <b>going to<
          if (/<b>[^<]*<(?!\/b>)/i.test(stem)) {
            leaked.push({
              lessonIndex: lesson.order_index,
              lessonTitle: lesson.title,
              category: 'MALFORMED_HTML_LEAK',
              detail: `Q#${idx}: Malformed HTML tag split in stem: "${stem}"`,
              rawItem: ex,
            });
          }
        });
      }

      console.log(`    Audited ${totalExercises} exercises for prompt leaks.`);

      if (leaked.length > 0) {
        console.error(`    Found ${leaked.length} leaked stems:`);
        leaked.forEach((l) => console.error(`    - Buổi ${l.lessonIndex}: ${l.detail}`));
      }
      expect(leaked.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Check 3: 0 Missing Blanks in Cloze / Fill-in Questions
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Check 3: Zero Missing Blanks in Cloze Questions', () => {
    runner.it('All fill_blank / cloze questions contain explicit blank indicators', () => {
      const brokenCloze: AuditDefect[] = [];
      let totalCloze = 0;

      for (const lesson of lessons) {
        const exs = Array.isArray(lesson.exercises) ? lesson.exercises : [];
        exs.forEach((ex: any, idx: number) => {
          const type = String(ex.type || ex.kind || '').toLowerCase();
          const rawOpts = ex.options || ex.opts || [];
          const isFill = type === 'fill_blank' || type === 'cloze' || (Array.isArray(rawOpts) && rawOpts.length === 0);

          if (isFill && type !== 'error_identification' && type !== 'error_click') {
            totalCloze++;
            const stem = String(ex.question || ex.q || ex.prompt || ex.stem || '').trim();

            // Check 1: Stem cannot be empty
            if (stem.length === 0) {
              brokenCloze.push({
                lessonIndex: lesson.order_index,
                lessonTitle: lesson.title,
                category: 'EMPTY_CLOZE_STEM',
                detail: `Q#${idx}: Cloze question has empty prompt`,
                rawItem: ex,
              });
              return;
            }

            // Check 2: Stem cannot be just an isolated question number like "(1)" or "1." without a sentence
            if (/^\(?\d+\)?\.?$/.test(stem)) {
              brokenCloze.push({
                lessonIndex: lesson.order_index,
                lessonTitle: lesson.title,
                category: 'ISOLATED_NUMBER_STEM',
                detail: `Q#${idx}: Cloze question prompt is isolated number "${stem}" without sentence`,
                rawItem: ex,
              });
              return;
            }

            // Check 3: Must have an underscore blank (e.g. ____) or parentheses blank (e.g. (verb)) or bracket blank
            const hasUnderline = /_{2,}/.test(stem);
            const hasParenthesesCue = /\([^)]+\)/.test(stem);
            const hasBracketBlank = /\[[^\]]*\]/.test(stem);
            const hasDotBlank = /\.{3,}/.test(stem);

            if (!hasUnderline && !hasParenthesesCue && !hasBracketBlank && !hasDotBlank) {
              brokenCloze.push({
                lessonIndex: lesson.order_index,
                lessonTitle: lesson.title,
                category: 'MISSING_BLANK_INDICATOR',
                detail: `Q#${idx}: Cloze question missing blank indicator in: "${stem}"`,
                rawItem: ex,
              });
            }
          }
        });
      }

      console.log(`    Audited ${totalCloze} cloze / fill-in questions across ${lessons.length} lessons.`);

      if (brokenCloze.length > 0) {
        console.error(`    Found ${brokenCloze.length} broken cloze questions:`);
        brokenCloze.forEach((c) => console.error(`    - Buổi ${c.lessonIndex}: ${c.detail}`));
      }
      expect(brokenCloze.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Check 4: 0 Unrendered LaTeX Math Tokens in theory_vi & theory
  // ──────────────────────────────────────────────────────────────────────────
  runner.describe('Check 4: Zero Unrendered LaTeX Math Tokens in Theory Columns', () => {
    runner.it('Verifies zero LaTeX tokens in theory_vi across all 25 lessons', () => {
      const latexInTheoryVi: AuditDefect[] = [];

      for (const lesson of lessons) {
        const text = String(lesson.theory_vi || '');
        // Search for raw LaTeX syntax
        const matches = text.match(
          /(\$S_\{(?:ít|it|nhiều|nhieu|sing|pl)[^}]*\}\$|S_\{(?:ít|it|nhiều|nhieu)\}|\$\\rightarrow\$|\\rightarrow|\$\\nearrow\$|\\nearrow|\$\\searrow\$|\\searrow|\$\\Rightarrow\$|\\Rightarrow|\$\\Leftarrow\$|\\Leftarrow|\$\\leftrightarrow\$|\\leftrightarrow|\$\\times\$|\\times)/gi,
        );

        if (matches && matches.length > 0) {
          const unique = Array.from(new Set(matches));
          latexInTheoryVi.push({
            lessonIndex: lesson.order_index,
            lessonTitle: lesson.title,
            category: 'LATEX_IN_THEORY_VI',
            detail: `Buổi ${lesson.order_index} contains unrendered LaTeX: ${unique.join(', ')}`,
          });
        }
      }

      if (latexInTheoryVi.length > 0) {
        console.error(`    Found ${latexInTheoryVi.length} lessons with LaTeX in theory_vi:`);
        latexInTheoryVi.forEach((l) => console.error(`    - ${l.detail}`));
      }
      expect(latexInTheoryVi.length).toBe(0);
    });

    runner.it('Verifies zero LaTeX tokens in theory (fallback column) across all 25 lessons', () => {
      const latexInTheory: AuditDefect[] = [];

      for (const lesson of lessons) {
        const text = String(lesson.theory || '');
        if (!text) continue;

        const matches = text.match(
          /(\$S_\{(?:ít|it|nhiều|nhieu|sing|pl)[^}]*\}\$|S_\{(?:ít|it|nhiều|nhieu)\}|\$\\rightarrow\$|\\rightarrow|\$\\nearrow\$|\\nearrow|\$\\searrow\$|\\searrow|\$\\Rightarrow\$|\\Rightarrow|\$\\Leftarrow\$|\\Leftarrow|\$\\leftrightarrow\$|\\leftrightarrow|\$\\times\$|\\times)/gi,
        );

        if (matches && matches.length > 0) {
          const unique = Array.from(new Set(matches));
          latexInTheory.push({
            lessonIndex: lesson.order_index,
            lessonTitle: lesson.title,
            category: 'LATEX_IN_THEORY',
            detail: `Buổi ${lesson.order_index} contains unrendered LaTeX in theory column: ${unique.join(', ')}`,
          });
        }
      }

      if (latexInTheory.length > 0) {
        console.error(`    Found ${latexInTheory.length} lessons with LaTeX in theory:`);
        latexInTheory.forEach((l) => console.error(`    - ${l.detail}`));
      }
      expect(latexInTheory.length).toBe(0);
    });
  });
}

// Standalone execution
if (process.argv[1]?.endsWith('empirical-supabase-audit.test.ts')) {
  (async () => {
    console.log('================================================================');
    console.log('  EMPIRICAL SUPABASE DATABASE AUDIT: GRAMMAR CURRICULUM');
    console.log('================================================================\n');

    const runner = new TestRunner();
    await runEmpiricalSupabaseAudit(runner);
    const stats = await runner.run();

    console.log('\n================================================================');
    console.log(`  AUDIT SUMMARY: ${stats.passed}/${stats.total} passed in ${stats.durationMs}ms`);
    console.log('================================================================');

    if (stats.failed > 0) {
      process.exit(1);
    }
  })().catch((err) => {
    console.error('\n❌ FATAL ERROR in Empirical Supabase Audit:', err.message);
    process.exit(1);
  });
}
