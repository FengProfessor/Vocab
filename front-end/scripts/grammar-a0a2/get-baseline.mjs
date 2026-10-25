import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  extractTheoryCases,
  buildTheoryStemBanlist,
  overlapsBanlist,
  coverageReport,
  stemFromItem
} from './practice-coverage-engine.mjs';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: topics, error: te } = await sb
    .from('grammar_topics')
    .select('id, slug, level, title_vi');
  if (te) throw te;

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, topic_id, sections, examples, exercises');

  if (error) {
    console.error('Error fetching lessons:', error);
    process.exit(1);
  }

  const topicById = Object.fromEntries(topics.map((t) => [t.id, t]));

  const list = [];
  let totalExercises = 0;
  let totalOverlap = 0;
  let under36Count = 0;
  let totalCovPct = 0;
  let totalIntraDup = 0;

  for (const l of lessons) {
    const topic = topicById[l.topic_id];
    const slug = topic?.slug || `topic_${l.topic_id}`;
    const exercises = Array.isArray(l.exercises) ? l.exercises : [];
    const examples = Array.isArray(l.examples) ? l.examples : [];
    const sections = l.sections || {};

    const cases = extractTheoryCases(sections, examples);
    const banlist = buildTheoryStemBanlist(sections, examples);

    let overlap = 0;
    const stems = new Set();
    let intraDup = 0;

    for (const ex of exercises) {
      if (overlapsBanlist(ex, banlist)) {
        overlap++;
      }
      const st = stemFromItem(ex);
      if (st) {
        if (stems.has(st)) intraDup++;
        else stems.add(st);
      }
    }

    const cov = coverageReport(cases, exercises);
    if (exercises.length < 36) under36Count++;

    totalExercises += exercises.length;
    totalOverlap += overlap;
    totalCovPct += cov.pct;
    totalIntraDup += intraDup;

    list.push({
      slug,
      n: exercises.length,
      examples_n: examples.length,
      theory_cases_n: cases.length,
      theory_overlap: overlap,
      intra_dup: intraDup,
      coverage_pct: cov.pct,
      missing_cases: cov.missing
    });
  }

  const baseline = {
    timestamp: new Date().toISOString(),
    total_lessons: lessons.length,
    avg_n: +(totalExercises / lessons.length).toFixed(2),
    under36_count: under36Count,
    total_theory_overlap: totalOverlap,
    total_intra_dup: totalIntraDup,
    avg_coverage_pct: +(totalCovPct / lessons.length).toFixed(1),
    lessons: list
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/ag-practice-baseline.json', JSON.stringify(baseline, null, 2));
  console.log('Baseline saved to tmp/ag-practice-baseline.json');
  console.log({
    lessons: baseline.total_lessons,
    avg_n: baseline.avg_n,
    under36: baseline.under36_count,
    total_theory_overlap: baseline.total_theory_overlap,
    total_intra_dup: baseline.total_intra_dup,
    avg_coverage_pct: baseline.avg_coverage_pct
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
