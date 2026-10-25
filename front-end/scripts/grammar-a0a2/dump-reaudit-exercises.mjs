/**
 * Dump live exercises for EN teacher re-audit.
 * Usage: node scripts/grammar-a0a2/dump-reaudit-exercises.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

const DEEP = [
  'present-perfect',
  'passive-voice',
  'second-conditional',
  'mixed-conditionals',
  'modals-obligation',
  'present-simple',
  'inversion',
  'subjunctive',
  'relative-clauses',
  'modals-perfect',
  'wish-if-only',
];
const SPOT = [
  'countable-uncountable',
  'past-simple',
  'gerunds-infinitives',
  'reported-speech',
  'causative',
];
const ALL = [...DEEP, ...SPOT];

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,level,title,title_vi');
if (te) throw te;

const { data: lessons, error: le } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,title,exercises,sections,examples,theory_vi');
if (le) throw le;

const byTopic = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));
const out = {};
const summary = [];

for (const t of topics || []) {
  if (!ALL.includes(t.slug)) continue;
  const L = byTopic[t.id];
  if (!L) {
    summary.push({ slug: t.slug, status: 'NO_LESSON' });
    continue;
  }
  const exs = Array.isArray(L.exercises) ? L.exercises : [];
  const banks = L.sections?.wordbanks || [];
  const bankRows = banks.reduce((n, b) => n + (b.rows?.length || 0), 0);
  const examples = Array.isArray(L.examples) ? L.examples : [];
  out[t.slug] = {
    slug: t.slug,
    level: t.level,
    title: t.title,
    title_vi: t.title_vi,
    lesson_id: L.id,
    exercise_count: exs.length,
    wordbank_rows: bankRows,
    wordbank_tables: banks.length,
    examples_count: examples.length,
    exercises: exs.map((e, i) => ({
      i,
      type: e.type,
      q: e.q || e.question || '',
      opts: e.opts || e.options || null,
      answer: e.answer !== undefined ? e.answer : e.correct_answer,
      fb: e.fb || e.feedback || null,
      case_id: e.case_id || null,
    })),
  };
  summary.push({
    slug: t.slug,
    level: t.level,
    n: exs.length,
    banks: bankRows,
    examples: examples.length,
  });
}

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/reaudit-dump.json', JSON.stringify(out, null, 2), 'utf8');

// Also write human-readable per-slug text for teacher review
let text = '';
for (const slug of ALL) {
  const d = out[slug];
  if (!d) {
    text += `\n======== ${slug} — MISSING ========\n`;
    continue;
  }
  text += `\n======== ${slug} | ${d.level} | ex=${d.exercise_count} banks=${d.wordbank_rows} exs=${d.examples_count} ========\n`;
  for (const e of d.exercises) {
    const opts =
      e.opts == null
        ? ''
        : Array.isArray(e.opts)
          ? ` | opts=[${e.opts.join(' | ')}]`
          : ` | opts=${JSON.stringify(e.opts)}`;
    text += `[${e.i}] ${e.type}: ${e.q}\n    → ans=${JSON.stringify(e.answer)}${opts}\n`;
  }
}
fs.writeFileSync('tmp/reaudit-dump.txt', text, 'utf8');

console.log(JSON.stringify(summary, null, 2));
console.log('Wrote tmp/reaudit-dump.json + tmp/reaudit-dump.txt');
console.log('Deep missing:', DEEP.filter((s) => !out[s]));
console.log('Spot missing:', SPOT.filter((s) => !out[s]));
