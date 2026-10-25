/**
 * Chạy normalizeLessonExercise trên mọi exercise DB — bắt answer∉opts sau normalize.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { normalizeLessonExercise } from '../../src/lib/grammar-exercises.ts';

function loadEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
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
const { data: topics } = await sb.from('grammar_topics').select('id,slug,level,title');
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,exercises,title');

const byTopic = Object.fromEntries((topics || []).map((t) => [t.id, t]));
const fails = [];
let total = 0;
let emptyQ = 0;
let noOpts = 0;
let ansMiss = 0;

for (const L of lessons || []) {
  const t = byTopic[L.topic_id];
  const slug = t?.slug || '?';
  const exs = Array.isArray(L.exercises) ? L.exercises : [];
  for (let i = 0; i < exs.length; i++) {
    total++;
    const n = normalizeLessonExercise(exs[i], L.id, i, t?.title || 'Grammar', t?.level || 'beginner');
    if (!n.question) {
      emptyQ++;
      fails.push({ slug, i, why: 'empty question after normalize', raw: exs[i] });
    }
    if (!n.options?.length) {
      noOpts++;
      fails.push({
        slug,
        i,
        why: 'no options after normalize',
        type: n.type,
        q: n.question.slice(0, 60),
      });
    }
    if (!n.correct_answer) {
      ansMiss++;
      fails.push({ slug, i, why: 'empty correct_answer', q: n.question.slice(0, 60) });
    } else if (n.options.length && !n.options.includes(n.correct_answer)) {
      // soft already applied in normalize
      const soft = n.options.find(
        (o) => o.trim().toLowerCase() === n.correct_answer.trim().toLowerCase(),
      );
      if (!soft) {
        fails.push({
          slug,
          i,
          why: 'answer∉opts after normalize',
          ans: n.correct_answer,
          opts: n.options,
          q: n.question.slice(0, 70),
        });
      }
    }
  }
}

const report = {
  total,
  emptyQ,
  noOpts,
  ansMiss,
  failCount: fails.length,
  fails: fails.slice(0, 60),
};
fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-normalize-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = fails.length ? 1 : 0;
