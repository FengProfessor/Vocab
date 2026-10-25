import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './test-harness';

async function catalogAllDefects() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: lessons } = await sb
    .from('grammar_lessons')
    .select('id, order_index, title, exercises')
    .order('order_index');

  const catalog: any[] = [];

  lessons?.forEach((l) => {
    (l.exercises || []).forEach((ex: any, idx: number) => {
      const type = String(ex.type || ex.kind || '');
      const opts = ex.options || ex.opts || [];
      const ans = String(ex.correct_answer || ex.answer || '').trim();
      const stem = String(ex.question || ex.prompt || ex.stem || '').trim();

      // Check 1: single letter or arrow answer with no options
      if (opts.length === 0) {
        if (/^[A-D]$/i.test(ans)) {
          catalog.push({
            buoi: l.order_index,
            title: l.title,
            idx,
            category: 'UNWINNABLE_MCQ_AS_FILL_BLANK',
            ans,
            stem,
            detail: 'Fill-in question has single-letter answer but 0 options',
          });
        } else if (/[A-D]\s*(?:→|->)\s*/i.test(ans)) {
          catalog.push({
            buoi: l.order_index,
            title: l.title,
            idx,
            category: 'UNWINNABLE_ERROR_ID_AS_FILL_BLANK',
            ans,
            stem,
            detail: 'Fill-in question has arrow correction key (e.g. B → for) in text input',
          });
        } else if (/^(?:S|P|D|TD)$/i.test(ans) && (stem.includes('( )') || stem.includes('____'))) {
          catalog.push({
            buoi: l.order_index,
            title: l.title,
            idx,
            category: 'CRYPTIC_ABBREVIATION_FILL_BLANK',
            ans,
            stem,
            detail: 'Fill-in question expects cryptic abbreviation (S/P/D/TD) with 0 options',
          });
        }
      }

      // Check 2: Leaked keys in prompt
      if (/\([A-D]\s*(?:→|->)\s*[^)]+\)/i.test(stem)) {
        catalog.push({
          buoi: l.order_index,
          title: l.title,
          idx,
          category: 'LEAKED_ANSWER_IN_STEM',
          ans,
          stem,
          detail: 'Question prompt leaks correct answer key',
        });
      }

      // Check 3: Broken cloze (isolated number)
      if (opts.length === 0 && /^\(?\d+\)?\.?$/.test(stem)) {
        catalog.push({
          buoi: l.order_index,
          title: l.title,
          idx,
          category: 'ISOLATED_NUMBER_CLOZE',
          ans,
          stem,
          detail: 'Cloze stem is isolated number without text',
        });
      }
    });
  });

  console.log(`TOTAL DEFECTS CATALOGED: ${catalog.length}`);
  console.table(
    catalog.map((c) => ({
      Buoi: c.buoi,
      QIdx: c.idx,
      Category: c.category,
      Answer: c.ans,
      StemSnippet: c.stem.slice(0, 40),
    })),
  );
}

catalogAllDefects().catch(console.error);
