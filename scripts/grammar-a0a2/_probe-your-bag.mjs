/**
 * Probe + fix "Is this your bag?" wrong TF key in possessives / adj-pronoun lessons.
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const APPLY = process.argv.includes('--apply');

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: sample, error: e0 } = await sb.from('grammar_lessons').select('*').limit(1);
  if (e0) {
    console.error(e0);
    process.exit(1);
  }
  console.log('cols:', Object.keys(sample[0] || {}));

  const { data: rows, error } = await sb
    .from('grammar_lessons')
    .select('id, topic_id, title, exercises, topics:topic_id(slug, title)');
  if (error) {
    // fallback without join
    console.warn('join failed, plain select', error.message);
    const r2 = await sb.from('grammar_lessons').select('id, topic_id, title, exercises');
    if (r2.error) {
      console.error(r2.error);
      process.exit(1);
    }
    await scan(r2.data, null);
    return;
  }
  await scan(rows, true);
}

async function scan(rows, hasJoin) {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // also load topics map
  let topicMap = {};
  const { data: topics } = await sb.from('grammar_topics').select('id, slug, title');
  if (topics) {
    for (const t of topics) topicMap[t.id] = t;
  }

  const targets = [];
  for (const row of rows || []) {
    const topic = topicMap[row.topic_id] || row.topics || {};
    const slug = topic.slug || '';
    const title = row.title || topic.title || '';
    const ex = Array.isArray(row.exercises) ? row.exercises : [];
    ex.forEach((e, i) => {
      const s = JSON.stringify(e);
      if (/Is this your bag|your bag\?/i.test(s) || /yours bag/i.test(s)) {
        targets.push({
          lessonId: row.id,
          topicId: row.topic_id,
          slug,
          title,
          idx: i,
          n: ex.length,
          type: e.type,
          q: e.q || e.question || e.stem || e.prompt,
          answer: e.answer,
          correct: e.correct,
          opts: e.opts || e.options,
          fb: (e.fb || e.feedback || '').slice(0, 120),
          raw: e,
        });
      }
    });
  }

  console.log(`\nFound ${targets.length} matching items:\n`);
  for (const t of targets) {
    console.log(
      JSON.stringify(
        {
          slug: t.slug,
          title: t.title,
          pos: `${t.idx + 1}/${t.n}`,
          type: t.type,
          q: t.q,
          answer: t.answer,
          correct: t.correct,
          opts: t.opts,
          fb: t.fb,
        },
        null,
        2
      )
    );
  }

  // Fix TF "Is this your bag" with answer false
  let fixedLessons = 0;
  for (const row of rows || []) {
    const topic = topicMap[row.topic_id] || {};
    const ex = Array.isArray(row.exercises) ? [...row.exercises] : [];
    let changed = false;
    for (let i = 0; i < ex.length; i++) {
      const e = ex[i];
      const q = String(e.q || e.question || e.stem || e.prompt || '');
      // TF: correct sentence marked false
      if (
        e.type === 'tf' &&
        /Is this your bag/i.test(q) &&
        !/yours bag|you bag/i.test(q) &&
        (e.answer === false || e.answer === 'false' || e.correct === false)
      ) {
        console.log(`\n[FIX TF] ${topic.slug} #${i + 1}: answer false → true`);
        ex[i] = {
          ...e,
          answer: true,
          fb:
            e.fb && !/sai|false|wrong|không đúng/i.test(String(e.fb))
              ? e.fb
              : 'Đúng. "your bag" = tính từ sở hữu your + danh từ bag. Câu hỏi Yes/No: Is this your bag?',
        };
        changed = true;
      }
      // error type inverted: stem is correct "Is this your bag?"
      if (
        (e.type === 'error' || e.type === 'find_error' || e.type === 'err') &&
        /Is this your bag/i.test(q) &&
        !/yours bag|you bag/i.test(q)
      ) {
        // if answer points away from the correct form, fix
        const ans = String(e.answer || e.correct || '');
        if (/yours bag|you bag/i.test(ans) || ans === q) {
          console.log(`\n[WARN error-item] ${topic.slug} #${i + 1} stem looks correct:`, q, 'ans:', ans);
        }
      }
    }
    if (changed) {
      fixedLessons++;
      if (APPLY) {
        const { error } = await sb
          .from('grammar_lessons')
          .update({ exercises: ex })
          .eq('id', row.id);
        if (error) console.error('update fail', row.id, error);
        else console.log(`[APPLIED] lesson ${row.id} (${topic.slug})`);
      } else {
        console.log(`[DRY] would update lesson ${row.id} (${topic.slug})`);
      }
    }
  }

  console.log(`\nDone. fixedLessons=${fixedLessons} apply=${APPLY}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
