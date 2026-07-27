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

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: topics } = await sb
    .from('grammar_topics')
    .select('id, slug, title')
    .eq('slug', 'possessives')
    .maybeSingle();
  if (!topics) {
    console.error('no possessives topic');
    process.exit(1);
  }

  const { data: lesson, error } = await sb
    .from('grammar_lessons')
    .select('id, title, exercises')
    .eq('topic_id', topics.id)
    .maybeSingle();
  if (error || !lesson) {
    console.error(error || 'no lesson');
    process.exit(1);
  }

  const ex = lesson.exercises || [];
  console.log(`lesson=${lesson.id} title=${lesson.title} n=${ex.length}\n`);

  // dump 30-40 for context
  for (let i = 29; i < Math.min(40, ex.length); i++) {
    const e = ex[i];
    console.log(
      `#${i + 1}/${ex.length}`,
      JSON.stringify(
        {
          type: e.type,
          q: e.q || e.question || e.stem,
          answer: e.answer,
          correct: e.correct,
          opts: e.opts || e.options,
          fb: (e.fb || e.feedback || '').slice(0, 200),
        },
        null,
        2
      )
    );
  }

  // also full list of TF with suspicious answers
  console.log('\n--- ALL TF items ---');
  ex.forEach((e, i) => {
    if (e.type === 'tf') {
      console.log(
        `#${i + 1}`,
        'answer=' + e.answer,
        '|',
        (e.q || '').slice(0, 80)
      );
    }
  });

  console.log('\n--- ALL error items ---');
  ex.forEach((e, i) => {
    if (e.type === 'error' || e.type === 'find_error' || e.type === 'err') {
      console.log(
        `#${i + 1}`,
        'ans=' + e.answer,
        '|',
        (e.q || '').slice(0, 80),
        '| opts=',
        e.opts || e.options
      );
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
