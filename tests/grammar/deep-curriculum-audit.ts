import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './test-harness';

interface Defect {
  lessonIndex: number;
  lessonTitle: string;
  qIndex: number;
  type: string;
  issue: string;
  ans: string;
  opts: string[];
  stem: string;
}

async function deepAudit() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, order_index, title, theory_vi, theory, exercises')
    .order('order_index');

  if (error || !lessons) {
    console.error('Failed to fetch lessons:', error);
    process.exit(1);
  }

  const defects: Defect[] = [];

  for (const lesson of lessons) {
    const exs = Array.isArray(lesson.exercises) ? lesson.exercises : [];

    exs.forEach((ex: any, idx: number) => {
      const type = String(ex.type || ex.kind || '').toLowerCase();
      const rawOpts = ex.options || ex.opts || [];
      const opts: string[] = Array.isArray(rawOpts)
        ? rawOpts.map((o: any) => String(o ?? '').trim()).filter((o: string) => o.length > 0)
        : [];
      const ans = String(ex.correct_answer !== undefined ? ex.correct_answer : ex.answer || '').trim();
      const stem = String(ex.question || ex.q || ex.prompt || ex.stem || '').trim();

      // Issue 1: fill_blank question with single letter answer (A, B, C, D) without options
      if (opts.length === 0 && /^[A-D]$/i.test(ans)) {
        defects.push({
          lessonIndex: lesson.order_index,
          lessonTitle: lesson.title,
          qIndex: idx,
          type,
          issue: `Fill-in question has single-letter MCQ answer key "${ans}" but NO options! Learner cannot know what letter to type.`,
          ans,
          opts,
          stem,
        });
      }

      // Issue 2: fill_blank question with arrow correction answer (e.g. "B → is")
      if (opts.length === 0 && /[A-D]\s*(?:→|->)\s*/i.test(ans)) {
        defects.push({
          lessonIndex: lesson.order_index,
          lessonTitle: lesson.title,
          qIndex: idx,
          type,
          issue: `Fill-in question has error-identification answer key "${ans}" with arrow notation! Unwinnable in fill-in mode.`,
          ans,
          opts,
          stem,
        });
      }

      // Issue 3: fill_blank question with cryptic single letter answer like "S" or "P" (Singular/Plural)
      if (opts.length === 0 && /^[SP]$/i.test(ans) && stem.includes('( )')) {
        defects.push({
          lessonIndex: lesson.order_index,
          lessonTitle: lesson.title,
          qIndex: idx,
          type,
          issue: `Fill-in question expects cryptic "${ans}" (Singular/Plural) with no explanation/options.`,
          ans,
          opts,
          stem,
        });
      }

      // Issue 4: MCQ where answer is not among options
      if (opts.length > 0 && ans) {
        const isLetter = /^[A-D]$/i.test(ans);
        let letterMatch = false;
        if (isLetter) {
          const charCode = ans.toUpperCase().charCodeAt(0) - 65;
          letterMatch = charCode >= 0 && charCode < opts.length;
        }
        const directMatch = opts.some((o) => o.toLowerCase() === ans.toLowerCase());
        const cleanMatch = opts.some(
          (o) => o.replace(/^[A-D]\.\s*/i, '').toLowerCase() === ans.toLowerCase(),
        );
        const prefixMatch = opts.some(
          (o) => o.startsWith(`${ans}.`) || o.startsWith(`${ans} `),
        );

        if (!isLetter && !directMatch && !cleanMatch && !prefixMatch && !letterMatch) {
          defects.push({
            lessonIndex: lesson.order_index,
            lessonTitle: lesson.title,
            qIndex: idx,
            type,
            issue: `MCQ answer "${ans}" does not match any option in [${opts.join(' | ')}].`,
            ans,
            opts,
            stem,
          });
        }
      }

      // Issue 5: Prompt has leaked answers
      if (/\([A-D]\s*(?:→|->)\s*[^)]+\)/i.test(stem)) {
        defects.push({
          lessonIndex: lesson.order_index,
          lessonTitle: lesson.title,
          qIndex: idx,
          type,
          issue: `Prompt contains leaked answer key: "${stem}".`,
          ans,
          opts,
          stem,
        });
      }

      // Issue 6: Cloze missing blank or isolated number
      if (opts.length === 0 && type !== 'error_click' && type !== 'error_identification') {
        if (/^\(?\d+\)?\.?$/.test(stem)) {
          defects.push({
            lessonIndex: lesson.order_index,
            lessonTitle: lesson.title,
            qIndex: idx,
            type,
            issue: `Cloze prompt is isolated number "${stem}" without sentence context.`,
            ans,
            opts,
            stem,
          });
        }
      }
    });
  }

  console.log(`\n================================================================`);
  console.log(`  DEEP CURRICULUM AUDIT RESULTS: ${defects.length} CRITICAL DEFECTS FOUND`);
  console.log(`================================================================\n`);

  for (const d of defects) {
    console.log(`❌ Buổi ${d.lessonIndex} (${d.lessonTitle}) [Q#${d.qIndex}]:`);
    console.log(`   Issue: ${d.issue}`);
    console.log(`   Stem:  ${d.stem.slice(0, 80)}`);
    console.log(`   Ans:   ${d.ans}`);
    console.log(`   Opts:  [${d.opts.join(', ')}]`);
    console.log('');
  }

  return defects;
}

deepAudit().catch(console.error);
