import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const slug = process.argv[2] || 'plural-nouns';
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data: topic, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,title,title_vi,level,order_index')
  .eq('slug', slug)
  .maybeSingle();
if (te) throw te;
if (!topic) {
  console.error('topic not found', slug);
  process.exit(1);
}
const { data: lesson, error: le } = await sb
  .from('grammar_lessons')
  .select('*')
  .eq('topic_id', topic.id)
  .maybeSingle();
if (le) throw le;
const out = { topic, lesson };
const file = `tmp/grammar-lesson-${slug}.json`;
fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8');
console.log('wrote', file);
console.log('theory_len', (lesson?.theory_vi || '').length);
console.log('examples', Array.isArray(lesson?.examples) ? lesson.examples.length : 0);
console.log('exercises', Array.isArray(lesson?.exercises) ? lesson.exercises.length : 0);
console.log('--- THEORY ---');
console.log(lesson?.theory_vi || '');
