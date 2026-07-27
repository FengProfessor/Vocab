import fs from 'fs';
import path from 'path';
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

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,level,order_index');
if (te) throw te;

const { data: lessons, error: le } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,exercises,sections');
if (le) throw le;

const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));

const results = [];
let totalExercises = 0;
let minExercises = 99999;
let maxExercises = 0;
let under36Count = 0;

const globalTypes = { mcq: 0, fill: 0, error: 0, tf: 0, other: 0 };

for (const lesson of lessons) {
  const topic = topicMap[lesson.topic_id];
  if (!topic) continue;

  const exercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];
  const n = exercises.length;
  totalExercises += n;
  if (n < minExercises) minExercises = n;
  if (n > maxExercises) maxExercises = n;
  if (n < 36) under36Count++;

  const counts = { mcq: 0, fill: 0, error: 0, tf: 0, other: 0 };
  const cases = new Set();

  for (const ex of exercises) {
    let type = ex.type;
    if (type === 'multiple_choice') type = 'mcq';
    if (type === 'fill_blank') type = 'fill';
    if (type === 'error_correction') type = 'error';

    if (counts[type] !== undefined) {
      counts[type]++;
      globalTypes[type]++;
    } else {
      counts.other++;
      globalTypes.other++;
    }

    if (ex.case_id) {
      cases.add(ex.case_id);
    }
  }

  results.push({
    slug: topic.slug,
    level: topic.level,
    order: topic.order_index,
    n,
    mcq: counts.mcq,
    fill: counts.fill,
    error: counts.error,
    tf: counts.tf,
    other: counts.other,
    cases_count: cases.size,
    cases: Array.from(cases)
  });
}

// Sort by level and order
results.sort((a, b) => {
  if (a.level !== b.level) {
    const lvls = { beginner: 1, intermediate: 2, advanced: 3 };
    return (lvls[a.level] || 9) - (lvls[b.level] || 9);
  }
  return (a.order || 0) - (b.order || 0);
});

const avgExercises = results.length ? (totalExercises / results.length).toFixed(2) : 0;

const summary = {
  total_lessons: results.length,
  avg: parseFloat(avgExercises),
  min: minExercises,
  max: maxExercises,
  under36: under36Count,
  type_totals: globalTypes,
  lessons: results
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-ex-baseline.json', JSON.stringify(summary, null, 2));

console.log('=== BASELINE SUMMARY ===');
console.log(`Total Lessons: ${summary.total_lessons}`);
console.log(`Average:       ${summary.avg}`);
console.log(`Min:           ${summary.min}`);
console.log(`Max:           ${summary.max}`);
console.log(`Under 36:      ${summary.under36}`);
console.log('Type Totals:', summary.type_totals);
console.log('\nTable:');
console.log('slug | level | n | mcq | fill | error | tf | cases');
console.log('--------------------------------------------------');
for (const r of results) {
  console.log(`${r.slug.padEnd(30)} | ${r.level.padEnd(12)} | ${String(r.n).padStart(3)} | ${String(r.mcq).padStart(3)} | ${String(r.fill).padStart(3)} | ${String(r.error).padStart(3)} | ${String(r.tf).padStart(3)} | ${r.cases_count}`);
}
