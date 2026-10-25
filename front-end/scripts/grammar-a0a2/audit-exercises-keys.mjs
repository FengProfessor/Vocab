/**
 * Audit exercises: answer ∈ opts, no empty q, accuracy spot-checks on wordbanks.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { banksForSlug } from './wordbanks-dense.mjs';

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
const { data: topics } = await sb.from('grammar_topics').select('id,slug,level');
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('topic_id,exercises,sections,examples,theory_vi');

const by = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));
const fails = [];
const warns = [];
let totalEx = 0;
const byLevel = { beginner: { ex: 0, n: 0 }, intermediate: { ex: 0, n: 0 }, advanced: { ex: 0, n: 0 } };

for (const t of topics || []) {
  const L = by[t.id];
  if (!L) {
    fails.push([t.slug, 'no lesson']);
    continue;
  }
  const ex = Array.isArray(L.exercises) ? L.exercises : [];
  totalEx += ex.length;
  const lv = t.level || 'beginner';
  if (byLevel[lv]) {
    byLevel[lv].ex += ex.length;
    byLevel[lv].n += 1;
  }
  if (ex.length === 0) fails.push([t.slug, '0 exercises']);
  if (ex.length > 0 && ex.length < 6) warns.push([t.slug, `only ${ex.length} exercises`]);
  if (!L.sections?.wordbanks?.length) fails.push([t.slug, 'no wordbanks in DB']);
  if (!Array.isArray(L.examples) || L.examples.length < 3)
    warns.push([t.slug, `examples ${L.examples?.length || 0}`]);
  if (!L.sections?.definition) warns.push([t.slug, 'no definition']);

  const qs = new Set();
  ex.forEach((e, i) => {
    const q = String(e.q || e.question || '').trim();
    const type = e.type || 'mcq';
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;
    const opts = e.opts || e.options || [];
    if (!q) fails.push([t.slug, `empty q #${i + 1}`]);
    const qk = q.toLowerCase();
    if (qs.has(qk)) warns.push([t.slug, `dup q: ${q.slice(0, 50)}`]);
    qs.add(qk);
    if (ans === undefined || ans === null || ans === '')
      fails.push([t.slug, `no answer #${i + 1} ${q.slice(0, 40)}`]);

    if (['mcq', 'error', 'multiple_choice', 'error_correction'].includes(type) && opts.length) {
      const a = Array.isArray(ans) ? ans[0] : ans;
      if (typeof a === 'boolean') return;
      const as = String(a).trim().toLowerCase();
      const hit = opts.some((o) => String(o).trim().toLowerCase() === as);
      if (!hit)
        fails.push([
          t.slug,
          `answer∉opts #${i + 1} ans=${JSON.stringify(a)} opts=${JSON.stringify(opts)} | ${q.slice(0, 50)}`,
        ]);
    }
    if ((type === 'fill' || type === 'fill_blank') && opts.length >= 2) {
      const a = String(Array.isArray(ans) ? ans[0] : ans)
        .trim()
        .toLowerCase();
      const hit = opts.some((o) => String(o).trim().toLowerCase() === a);
      if (!hit) fails.push([t.slug, `fill answer∉opts #${i + 1} ${a}`]);
    }
    if (type === 'tf') {
      const ok =
        ans === true ||
        ans === false ||
        ['true', 'false', 'đúng', 'sai', 'yes', 'no'].includes(String(ans).toLowerCase());
      if (!ok) fails.push([t.slug, `bad tf #${i + 1} ${ans}`]);
    }

    // answer should not be the erroneous form when q is Find the error and opts have correct
    // (soft) if q has "Find the error" and answer equals a clear wrong form without correction
  });
}

const accuracyFails = [];
const past = banksForSlug('past-simple')[0].rows;
const go = past.find((r) => r['V1 (nguyên mẫu)'] === 'go');
if (!go || go['V2 (quá khứ)'] !== 'went' || go['V3 (phân từ)'] !== 'gone')
  accuracyFails.push('go conjugation');
const be = past.find((r) => r['V1 (nguyên mẫu)'] === 'be');
if (!be || !String(be['V2 (quá khứ)']).includes('was')) accuracyFails.push('be conjugation');

const art = JSON.stringify(banksForSlug('articles'));
if (!/a university/i.test(art)) accuracyFails.push('missing a university');
if (!/an hour/i.test(art)) accuracyFails.push('missing an hour');

const obl = JSON.stringify(banksForSlug('modals-obligation'));
if (!/cấm/i.test(obl) || !/không cần|không bắt buộc/i.test(obl))
  accuracyFails.push('obligation distinction weak');

const pr = JSON.stringify(banksForSlug('personal-pronouns'));
if (!/between you and me/i.test(pr)) accuracyFails.push('missing between you and me');

const rs = JSON.stringify(banksForSlug('reported-speech'));
if (!/would/i.test(rs)) accuracyFails.push('reported speech missing would');

const t3 = JSON.stringify(banksForSlug('third-conditional'));
if (!/would have/i.test(t3)) accuracyFails.push('third conditional missing would have');

// UI critical: GoldenLesson fill with empty q badge
// Check exercises where type fill and answer is multi-word but opts empty - learner free type
let freeFill = 0;
for (const t of topics || []) {
  const L = by[t.id];
  for (const e of L?.exercises || []) {
    const type = e.type || '';
    const opts = e.opts || e.options || [];
    if ((type === 'fill' || type === 'fill_blank') && opts.length < 2) freeFill++;
  }
}

// Spot-check GOLD mcq keys manually for countable
const cu = by[topics.find((x) => x.slug === 'countable-uncountable').id];
const cuEx = cu.exercises || [];
for (const e of cuEx) {
  const ans = e.answer ?? e.correct_answer;
  const opts = e.opts || e.options || [];
  if (opts.length && !opts.map(String).includes(String(ans)) && !opts.some((o) => String(o) === String(ans))) {
    // already covered
  }
  // known good keys
  if (String(e.q).includes('information') && String(ans).includes('informations')) {
    accuracyFails.push('CU quiz marks informations as correct');
  }
}

const report = {
  totalEx,
  topics: topics.length,
  byLevel,
  fails: fails.length,
  warns: warns.length,
  accuracyFails,
  freeFill,
  failSample: fails.slice(0, 50),
  warnSample: warns.slice(0, 40),
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-ex-audit.json', JSON.stringify({ ...report, fails, warns }, null, 2));
console.log(JSON.stringify(report, null, 2));
if (fails.length || accuracyFails.length) process.exitCode = 1;
