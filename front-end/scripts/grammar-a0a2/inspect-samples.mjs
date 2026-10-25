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

async function check() {
  const { data: lessons } = await sb.from('grammar_lessons').select('exercises,topic:grammar_topics(slug,level)');
  for (const l of lessons || []) {
    if (['countable-uncountable', 'verb-to-be', 'present-perfect', 'inversion-emphasis'].includes(l.topic.slug)) {
      console.log(`\n=================== SLUG: ${l.topic.slug} (${l.topic.level}) ===================`);
      for (const e of l.exercises.slice(0, 5)) {
        console.log(`Q: ${e.q}`);
        console.log(`Type: ${e.type} | Answer: ${JSON.stringify(e.answer)}`);
        console.log(`FB: ${e.fb}\n---`);
      }
    }
  }
}
check();
