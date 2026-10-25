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
  .select('id,topic_id,exercises,sections,theory_vi');
if (le) throw le;

const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));

const caseInventory = [];

for (const lesson of lessons) {
  const topic = topicMap[lesson.topic_id];
  if (!topic) continue;

  const sections = lesson.sections || {};
  const exercises = Array.isArray(lesson.exercises) ? lesson.exercises : [];

  const cases = [];

  // 1. rules
  if (Array.isArray(sections.rules)) {
    sections.rules.forEach((r, idx) => {
      const id = r.case || `rule_${idx}`;
      cases.push({
        id,
        source: 'sections.rules',
        hint: `${r.rule || ''} (e.g. ${r.example || ''})`
      });
    });
  }

  // 2. mistakes
  if (Array.isArray(sections.mistakes)) {
    sections.mistakes.forEach((m, idx) => {
      const id = `mistake_${(m.wrong || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') || idx}`;
      cases.push({
        id,
        source: 'sections.mistakes',
        hint: `wrong: ${m.wrong || ''} -> right: ${m.right || ''}`
      });
    });
  }

  // 3. formula rows
  if (sections.formula && Array.isArray(sections.formula.rows)) {
    sections.formula.rows.forEach((row, idx) => {
      const keys = Object.keys(row);
      const caseVal = row.Case || row['Trường hợp'] || row['Loại'] || row['Dạng'] || `formula_${idx}`;
      const id = `form_${String(caseVal).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      cases.push({
        id,
        source: 'sections.formula.rows',
        hint: JSON.stringify(row)
      });
    });
  }

  // 4. usage
  if (Array.isArray(sections.usage)) {
    sections.usage.forEach((u, idx) => {
      const id = `usage_${(u.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') || idx}`;
      cases.push({
        id,
        source: 'sections.usage',
        hint: `${u.label || ''}: ${u.en || ''} (${u.vi || ''})`
      });
    });
  }

  // 5. signals
  if (Array.isArray(sections.signals)) {
    sections.signals.forEach((sig, idx) => {
      const id = `signal_${String(sig).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      cases.push({
        id,
        source: 'sections.signals',
        hint: sig
      });
    });
  }

  // 6. wordbanks
  if (Array.isArray(sections.wordbanks)) {
    sections.wordbanks.forEach((wb, idx) => {
      const id = `wb_${(wb.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') || idx}`;
      cases.push({
        id,
        source: 'sections.wordbanks',
        hint: `Wordbank: ${wb.title || ''} (${wb.rows?.length || 0} rows)`
      });
    });
  }

  // Existing case_ids from current exercises
  const existing_case_ids = Array.from(new Set(exercises.map(e => e.case_id).filter(Boolean)));

  // Deduplicate cases by id
  const uniqueCases = [];
  const seenIds = new Set();
  for (const c of cases) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      uniqueCases.push(c);
    }
  }

  // Identify gaps: defined cases that are not covered in existing_case_ids
  // Let's do a loose matching or check if existing_case_ids has it
  const gaps = uniqueCases.filter(c => {
    // Check if the id itself or a slugified version is in existing_case_ids
    return !existing_case_ids.some(exId => {
      if (!exId) return false;
      const exClean = String(exId).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const cClean = String(c.id).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      return exClean === cClean || exClean.includes(cClean) || cClean.includes(exClean);
    });
  }).map(c => c.id);

  caseInventory.push({
    slug: topic.slug,
    cases: uniqueCases,
    existing_case_ids,
    gaps
  });
}

// Sort by slug
caseInventory.sort((a, b) => a.slug.localeCompare(b.slug));

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-theory-cases.json', JSON.stringify(caseInventory, null, 2));

console.log(`Generated inventory for ${caseInventory.length} lessons.`);
console.log(`Total cases mapped: ${caseInventory.reduce((acc, curr) => acc + curr.cases.length, 0)}`);
console.log(`Total gaps identified: ${caseInventory.reduce((acc, curr) => acc + curr.gaps.length, 0)}`);
