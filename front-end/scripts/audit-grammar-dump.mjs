/**
 * Dump grammar_topics + grammar_lessons for curriculum audit.
 * Usage: node scripts/audit-grammar-dump.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const p = path.resolve('.env.local');
  const raw = fs.readFileSync(p, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,title,title_vi,level,order_index,parent_id')
  .order('order_index');
if (te) throw te;

const { data: lessons, error: le } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,title,order_index,theory_vi,examples,sections,exercises')
  .order('order_index');
if (le) throw le;

const summary = (lessons || []).map((l) => {
  const theory = (l.theory_vi || '').trim();
  const ex = Array.isArray(l.examples) ? l.examples : [];
  const secsObj =
    l.sections && typeof l.sections === 'object' && !Array.isArray(l.sections)
      ? l.sections
      : null;
  const secs = Array.isArray(l.sections) ? l.sections : [];
  const sectionKeys = secsObj ? Object.keys(secsObj) : [];
  const exercises = Array.isArray(l.exercises) ? l.exercises : [];
  const types = {};
  for (const e of exercises) {
    const t = e?.type || e?.kind || 'unknown';
    types[t] = (types[t] || 0) + 1;
  }
  // quality flags
  const flags = [];
  if (theory.length < 80) flags.push('theory_thin');
  if (ex.length === 0) flags.push('no_examples');
  if (ex.length > 0 && ex.length < 3) flags.push('few_examples');
  if (!secsObj || sectionKeys.length === 0) flags.push('no_sections');
  if (exercises.length === 0) flags.push('no_quiz');
  if (exercises.length > 0 && exercises.length < 5) flags.push('quiz_thin');
  if (exercises.length > 40) flags.push('quiz_bloat');
  // detect generic / thin theory
  if (/đang cập nhật|TODO|lorem|coming soon/i.test(theory)) flags.push('placeholder');
  if (theory.length > 0 && theory.split(/\n/).filter(Boolean).length < 3) flags.push('theory_few_lines');

  return {
    id: l.id,
    topic_id: l.topic_id,
    title: l.title,
    order_index: l.order_index,
    theory_len: theory.length,
    theory_preview: theory.slice(0, 220).replace(/\n/g, ' | '),
    examples_count: ex.length,
    examples_sample: ex.slice(0, 3),
    sections_count: sectionKeys.length || secs.length,
    sections_titles: sectionKeys.length
      ? sectionKeys
      : secs.map((s) => s?.title || s?.heading || s?.type || '?').slice(0, 12),
    exercises_count: exercises.length,
    exercise_types: types,
    flags,
  };
});

const byTopic = {};
for (const t of topics || []) {
  byTopic[t.id] = { ...t, lessons: [] };
}
for (const s of summary) {
  if (!byTopic[s.topic_id]) {
    byTopic[s.topic_id] = {
      id: s.topic_id,
      title: 'UNKNOWN',
      title_vi: 'UNKNOWN',
      slug: 'unknown',
      level: '?',
      order_index: 9999,
      lessons: [],
    };
  }
  byTopic[s.topic_id].lessons.push(s);
}

const orderedTopics = Object.values(byTopic).sort(
  (a, b) => (a.order_index || 0) - (b.order_index || 0)
);

// title duplicate detection
const titleMap = new Map();
for (const s of summary) {
  const key = (s.title || '').toLowerCase().trim();
  if (!key) continue;
  if (!titleMap.has(key)) titleMap.set(key, []);
  titleMap.get(key).push(s);
}
const dupTitles = [...titleMap.entries()]
  .filter(([, arr]) => arr.length > 1)
  .map(([title, arr]) => ({ title, count: arr.length, ids: arr.map((x) => x.id) }));

const flagStats = {};
for (const s of summary) {
  for (const f of s.flags) flagStats[f] = (flagStats[f] || 0) + 1;
}

const out = {
  dumped_at: new Date().toISOString(),
  topicCount: (topics || []).length,
  lessonCount: summary.length,
  flagStats,
  dupTitles,
  topics: orderedTopics,
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-audit-dump.json', JSON.stringify(out, null, 2), 'utf8');

let md = `# Grammar curriculum dump\n\n`;
md += `- Topics: **${out.topicCount}** · Lessons: **${out.lessonCount}**\n`;
md += `- Flags: ${JSON.stringify(flagStats)}\n`;
md += `- Duplicate titles: **${dupTitles.length}**\n\n`;

if (dupTitles.length) {
  md += `## Duplicate titles\n\n`;
  for (const d of dupTitles.slice(0, 40)) {
    md += `- **${d.title}** ×${d.count}\n`;
  }
  md += `\n`;
}

for (const t of orderedTopics) {
  md += `## [${t.order_index ?? '?'}] ${t.level || '?'} · \`${t.slug || ''}\` · ${t.title_vi || t.title}\n\n`;
  const ls = (t.lessons || []).sort((a, b) => a.order_index - b.order_index);
  if (!ls.length) {
    md += `_No lessons_\n\n`;
    continue;
  }
  for (const l of ls) {
    const flag = l.flags.length ? ` ⚠️ ${l.flags.join(', ')}` : '';
    md += `### L${l.order_index} — ${l.title}${flag}\n`;
    md += `- theory: ${l.theory_len} chars · examples: ${l.examples_count} · sections: ${l.sections_count} · quiz: ${l.exercises_count} ${JSON.stringify(l.exercise_types)}\n`;
    if (l.sections_titles?.length) md += `- sections: ${l.sections_titles.join(' · ')}\n`;
    md += `- preview: ${l.theory_preview || '_(empty)_'}\n\n`;
  }
}

fs.writeFileSync('tmp/grammar-audit-summary.md', md, 'utf8');
console.log(`[audit] topics=${out.topicCount} lessons=${out.lessonCount}`);
console.log(`[audit] flags`, flagStats);
console.log(`[audit] dups`, dupTitles.length);
console.log(md.slice(0, 8000));
