import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
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

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: topics } = await sb.from('grammar_topics').select('id,slug');
const map = Object.fromEntries(topics.map((t) => [t.id, t.slug]));
const { data: lessons } = await sb.from('grammar_lessons').select('id,topic_id,exercises');
const want = new Set([
  'countable-uncountable',
  'future-perfect',
  'possessives',
  'verb-to-be',
  'personal-pronouns',
]);
for (const L of lessons) {
  const slug = map[L.topic_id];
  if (!want.has(slug)) continue;
  console.log('\n====', slug, 'n=', (L.exercises || []).length);
  (L.exercises || []).forEach((e, i) => {
    const s = JSON.stringify(e);
    if (
      /furniture|your bag|Tom is happy|Sara and I|will have lived|mine pen|They not is|Tom are|I love Tom/i.test(
        s
      )
    ) {
      console.log(i + 1, e.type, e.q || e.question, '=>', e.answer);
    }
  });
}
