/**
 * Strict final verification for grammar theory/practice quality.
 * Metrics match Grok audit (not the lenient AG v1).
 *
 *   node scripts/grammar-a0a2/verify-final.mjs
 *   node scripts/grammar-a0a2/verify-final.mjs --json
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { extractTheoryCases, coverageReport } from './practice-coverage-engine.mjs';

const AS_JSON = process.argv.includes('--json');

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

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Full-question key for intra-dup (do NOT strip shared prefixes → false dups). */
function fullKey(q) {
  return norm(q);
}

/** Stem used only for theory-clone checks on error items. */
function errStemOf(q) {
  return norm(String(q || '').replace(/^(find the error|sửa)\s*:\s*/i, '').replace(/^"+|"+$/g, ''));
}

function wordCount(s) {
  return norm(s).split(/\s+/).filter(Boolean).length;
}

function theoryPhrases(examples, sections) {
  const out = [];
  for (const e of examples || []) {
    if (e?.en) out.push(norm(e.en));
  }
  for (const m of sections?.mistakes || []) {
    const w = norm(String(m.wrong || '').replace(/\([^)]*\)/g, ' '));
    const r = norm(m.right || '');
    if (wordCount(w) >= 3) out.push(w);
    if (wordCount(r) >= 3) out.push(r);
  }
  for (const u of sections?.usage || []) {
    for (const p of String(u.en || '').split(/·/)) {
      const n = norm(p);
      if (wordCount(n) >= 3) out.push(n);
    }
  }
  return [...new Set(out.filter((t) => wordCount(t) >= 3))];
}

/** Strict: full phrase clone (3+ words) between practice stem and theory */
function isStrictClone(stem, theoryList) {
  if (wordCount(stem) < 3) return false;
  for (const t of theoryList) {
    if (wordCount(t) < 3) continue;
    if (stem === t) return true;
    if (stem.includes(t) && t.length >= 12) return true;
    if (t.includes(stem) && wordCount(stem) >= 4) return true;
  }
  return false;
}

function getOpts(e) {
  const o = e?.opts ?? e?.options;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()) : [];
}
function getAns(e) {
  return e?.answer !== undefined ? e.answer : e?.correct_answer;
}
function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  return t;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('exercises,examples,sections,topic:grammar_topics(slug,level)');
  if (error) throw error;

  let totalEx = 0;
  let totalCov = 0;
  let strictOverlap = 0;
  let intraDup = 0;
  let under36 = 0;
  let under10Examples = 0;
  let ansBad = 0;
  let hardJunk = 0;
  const overlapSamples = [];
  const details = [];

  for (const L of lessons || []) {
    const slug = L.topic?.slug || '?';
    const examples = Array.isArray(L.examples) ? L.examples : [];
    const exercises = Array.isArray(L.exercises) ? L.exercises : [];
    const sections = L.sections && typeof L.sections === 'object' ? L.sections : {};

    totalEx += exercises.length;
    if (exercises.length < 36) under36++;
    if (examples.length < 10) under10Examples++;

    const theory = theoryPhrases(examples, sections);
    const seen = new Set();
    let lessonOv = 0;
    let lessonDup = 0;
    let lessonJunk = 0;
    let lessonAns = 0;

    for (const e of exercises) {
      const q = String(e?.q || e?.question || '');
      const fk = fullKey(q);
      const type = getType(e);
      const opts = getOpts(e);
      const ans = getAns(e);

      // Intra-dup on full question text
      if (fk && seen.has(fk)) {
        lessonDup++;
        intraDup++;
      } else if (fk) seen.add(fk);

      // Theory clone: compare error stem or full q (3+ words)
      const cloneStem = /find the error|sửa/i.test(q) ? errStemOf(q) : fk;
      if (isStrictClone(cloneStem, theory)) {
        lessonOv++;
        strictOverlap++;
        if (overlapSamples.length < 12) {
          overlapSamples.push({ slug, q: q.slice(0, 90), stem: cloneStem.slice(0, 60) });
        }
      }

      if (/which example fits/i.test(q) || opts.some((o) => /another incorrect|^another$/i.test(o))) {
        lessonJunk++;
        hardJunk++;
      }
      if (type === 'tf') {
        if (ans !== true && ans !== false && !/^(true|false)$/i.test(String(ans))) {
          lessonAns++;
          ansBad++;
        }
      } else if (opts.length && !opts.includes(String(ans ?? '').trim())) {
        lessonAns++;
        ansBad++;
      }
    }

    const cases = extractTheoryCases(sections, examples);
    const cov = coverageReport(cases, exercises);
    totalCov += cov.pct;

    details.push({
      slug,
      examples: examples.length,
      exercises: exercises.length,
      covPct: cov.pct,
      strictOverlap: lessonOv,
      intraDup: lessonDup,
      junk: lessonJunk,
      ansBad: lessonAns,
    });
  }

  const n = lessons.length || 1;
  const avgEx = totalEx / n;
  const avgCov = totalCov / n;

  const pass =
    under36 === 0 &&
    under10Examples === 0 &&
    strictOverlap < 30 &&
    intraDup === 0 &&
    avgCov >= 90 &&
    hardJunk === 0 &&
    ansBad === 0;

  const summary = {
    lessons: n,
    avgExercises: +avgEx.toFixed(2),
    under36,
    examplesMin10Ok: under10Examples === 0,
    under10Examples,
    avgCoveragePct: +avgCov.toFixed(1),
    strictTheoryOverlap: strictOverlap,
    intraDup,
    hardJunk,
    ansBad,
    pass,
    thresholds: {
      under36: 0,
      under10Examples: 0,
      strictOverlap: '<30',
      intraDup: 0,
      avgCoveragePct: '>=90',
      hardJunk: 0,
      ansBad: 0,
    },
    overlapSamples,
    worstOverlap: details
      .filter((d) => d.strictOverlap > 0)
      .sort((a, b) => b.strictOverlap - a.strictOverlap)
      .slice(0, 10),
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/verify-final-report.json', JSON.stringify(summary, null, 2));

  if (AS_JSON) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('================ STRICT FINAL VERIFICATION ================');
    console.log(`Lessons: ${n}`);
    console.log(`Avg exercises: ${avgEx.toFixed(2)}  under36: ${under36} (must 0)`);
    console.log(`Examples <10: ${under10Examples} (must 0)`);
    console.log(`Avg coverage: ${avgCov.toFixed(1)}% (must >=90)`);
    console.log(`Strict theory↔practice overlap: ${strictOverlap} (must <30)`);
    console.log(`Intra-bank stem dups: ${intraDup} (must 0)`);
    console.log(`Hard junk / ansBad: ${hardJunk} / ${ansBad} (must 0/0)`);
    console.log('===========================================================');
    if (overlapSamples.length) {
      console.log('Overlap samples:');
      for (const s of overlapSamples.slice(0, 6)) console.log(`  [${s.slug}] ${s.q}`);
    }
    console.log(pass ? 'STATUS: PASS' : 'STATUS: FAIL');
    console.log('report: tmp/verify-final-report.json');
  }

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
