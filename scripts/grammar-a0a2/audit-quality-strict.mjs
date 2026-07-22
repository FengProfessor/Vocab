/**
 * Strict quality audit: wordbanks accuracy traps + exercises + sections completeness.
 * Exit 1 if any FAIL.
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { banksForSlug, bankStats } from './wordbanks-dense.mjs';

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

const fails = [];
const warns = [];
const pass = [];

function fail(slug, msg) {
  fails.push({ slug, msg, sev: 'FAIL' });
}
function warn(slug, msg) {
  warns.push({ slug, msg, sev: 'WARN' });
}

// ── known incorrect grammar traps in content (EN) ───────────────────────────
const BAD_PATTERNS = [
  // wrong "correct" answers / teaching
  { re: /\bI am agree\b/i, why: 'sai: am agree' },
  { re: /\bmore better\b/i, why: 'double comparative' },
  { re: /\bmost tallest\b/i, why: 'double superlative' },
  { re: /\bdid went\b/i, why: 'did + V2' },
  { re: /\bcan to\b/i, why: 'can to' },
  { re: /\bmust to\b/i, why: 'must to' },
  { re: /\bshould to\b/i, why: 'should to' },
  { re: /\binformations\b/i, why: 'informations as taught correct?' },
  { re: /\bhomeworks\b/i, why: 'homeworks as taught correct?' },
  { re: /\bfurnitures\b/i, why: 'furnitures' },
  { re: /\badvices\b/i, why: 'advices' },
  // typos we introduced
  { re: /\bVí sao\b/, why: 'typo column Ví sao → Vì sao' },
  { re: /\bGhi_chú\b/, why: 'underscore header left' },
];

// Patterns that are OK only in "Sai" columns
function scanText(slug, text, ctx) {
  if (!text || typeof text !== 'string') return;
  // if context is wrong/sai column, skip some patterns that appear as examples of errors
  const isErrorCol = /sai|wrong|incorrect/i.test(ctx);
  for (const { re, why } of BAD_PATTERNS) {
    if (isErrorCol && /informations|homeworks|furnitures|advices|am agree|did went|can to|must to|should to|more better/i.test(why))
      continue;
    if (re.test(text)) {
      // allow in Sai hay gặp / Sai columns
      if (/sai|wrong/i.test(ctx)) continue;
      fail(slug, `${why} @ ${ctx}: ${text.slice(0, 120)}`);
    }
  }
}

function auditBanks(slug, banks) {
  if (!banks?.length) {
    fail(slug, 'no wordbanks');
    return;
  }
  let rows = 0;
  for (const b of banks) {
    if (!b.title) fail(slug, 'bank missing title');
    if (!b.rows?.length) fail(slug, `empty bank: ${b.title}`);
    const keys0 = b.rows?.[0] ? Object.keys(b.rows[0]) : [];
    for (const k of keys0) {
      if (/^(Rule|Case|Form|Subject|Example|Note|With|Structure)$/.test(k)) {
        fail(slug, `EN header leftover: ${k} in ${b.title}`);
      }
    }
    for (const r of b.rows || []) {
      rows++;
      for (const [k, v] of Object.entries(r)) {
        if (v == null || String(v).trim() === '') {
          warn(slug, `empty cell ${k} in ${b.title}`);
        }
        scanText(slug, String(v), `${b.title}.${k}`);
      }
      // "Đúng" column should not equal "Sai" 
      if (r.Sai && r.Đúng && r.Sai === r.Đúng) {
        fail(slug, `Sai === Đúng: ${r.Sai}`);
      }
    }
  }
  if (rows < 5) warn(slug, `thin wordbank only ${rows} rows`);
  pass.push({ slug, banks: banks.length, rows });
}

function auditExercises(slug, exercises) {
  const ex = Array.isArray(exercises) ? exercises : [];
  if (ex.length < 8) warn(slug, `few exercises: ${ex.length}`);
  if (ex.length === 0) fail(slug, 'no exercises');

  const seen = new Set();
  let i = 0;
  for (const e of ex) {
    i++;
    const q = String(e.q || e.question || '').trim();
    const ans = e.answer !== undefined ? e.answer : e.correct_answer;
    const opts = e.opts || e.options;
    const type = e.type || 'mcq';

    if (!q) fail(slug, `ex#${i} empty question`);
    if (seen.has(q.toLowerCase())) warn(slug, `duplicate q: ${q.slice(0, 60)}`);
    seen.add(q.toLowerCase());

    if (ans === undefined || ans === null || ans === '') {
      fail(slug, `ex#${i} missing answer: ${q.slice(0, 80)}`);
      continue;
    }

    // pollution VN-only stems
    if (/câu sau đúng|chọn câu đúng|ngữ pháp không/i.test(q) && !/[A-Za-z]{4}/.test(q)) {
      fail(slug, `ex#${i} polluted VN stem: ${q}`);
    }

    if (['mcq', 'fill', 'error', 'multiple_choice', 'fill_blank', 'error_correction'].includes(type)) {
      if (!Array.isArray(opts) || opts.length < 2) {
        // fill might only need answer string
        if (type === 'fill' || type === 'fill_blank') {
          // ok if answer present
        } else {
          fail(slug, `ex#${i} needs opts: ${q.slice(0, 60)}`);
        }
      } else {
        const ansStr = Array.isArray(ans) ? ans[0] : String(ans);
        // answer should be in opts for mcq/error (flexible match)
        if (['mcq', 'error', 'multiple_choice', 'error_correction'].includes(type)) {
          const hit = opts.some(
            (o) =>
              String(o).trim().toLowerCase() === ansStr.trim().toLowerCase() ||
              String(o).includes(ansStr) ||
              ansStr.includes(String(o))
          );
          if (!hit && type !== 'fill') {
            // boolean tf skip
            if (typeof ans !== 'boolean') {
              fail(
                slug,
                `ex#${i} answer not in opts: ans="${ansStr}" opts=${JSON.stringify(opts)} | ${q.slice(0, 50)}`
              );
            }
          }
        }
      }
    }

    if (type === 'tf' && typeof ans !== 'boolean' && ans !== true && ans !== false && ans !== 'true' && ans !== 'false') {
      fail(slug, `ex#${i} tf non-boolean answer: ${ans}`);
    }

    // fb empty warn
    if (!e.fb && !e.explanation) warn(slug, `ex#${i} no feedback: ${q.slice(0, 50)}`);

    scanText(slug, q, `ex.q`);
    if (typeof ans === 'string') scanText(slug, ans, `ex.answer`);
  }
}

function auditSections(slug, sections) {
  if (!sections || typeof sections !== 'object') {
    fail(slug, 'no sections');
    return;
  }
  if (!sections.definition || String(sections.definition).length < 40) {
    warn(slug, 'thin/missing definition');
  }
  if (!sections.wordbanks?.length) fail(slug, 'sections.wordbanks missing in DB');
  if (!sections.mistakes?.length) warn(slug, 'no mistakes section');
  if (!sections.usage?.length && !sections.rules?.length && !sections.formula?.rows?.length) {
    warn(slug, 'no usage/rules/formula');
  }
}

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics } = await sb.from('grammar_topics').select('id,slug,level,title_vi,title');
const { data: lessons } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,title,sections,exercises,examples,theory_vi');

const byTopic = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));
const stats = bankStats();

for (const t of topics || []) {
  const codeBanks = banksForSlug(t.slug);
  const lesson = byTopic[t.id];
  if (!lesson) {
    fail(t.slug, 'no lesson row');
    continue;
  }
  // code banks
  if (codeBanks) auditBanks(t.slug, codeBanks);
  else fail(t.slug, 'no code wordbanks');

  // DB match
  const dbRows = (lesson.sections?.wordbanks || []).reduce((n, b) => n + (b.rows?.length || 0), 0);
  const codeRows = (codeBanks || []).reduce((n, b) => n + (b.rows?.length || 0), 0);
  if (dbRows !== codeRows) fail(t.slug, `DB rows ${dbRows} != code ${codeRows}`);

  auditSections(t.slug, lesson.sections);
  auditExercises(t.slug, lesson.exercises);

  const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
  if (examples.length < 4) warn(t.slug, `few examples: ${examples.length}`);
  for (const ex of examples) {
    if (!ex.en) fail(t.slug, 'example missing en');
    scanText(t.slug, ex.en, 'example.en');
  }
}

// critical content spot-checks (hand assertions)
const spot = [
  {
    slug: 'countable-uncountable',
    test: () => {
      const banks = banksForSlug('countable-uncountable');
      const flat = banks.flatMap((b) => b.rows);
      const hw = flat.find((r) => r.Từ === 'homework');
      if (!hw) return 'missing homework row';
      if (!/U|không|homework/i.test(JSON.stringify(hw))) return 'homework not marked U properly';
      return null;
    },
  },
  {
    slug: 'past-simple',
    test: () => {
      const banks = banksForSlug('past-simple');
      const r = banks[0].rows.find((x) => x['V1 (nguyên mẫu)'] === 'go');
      if (!r) return 'missing go';
      if (r['V2 (quá khứ)'] !== 'went') return `go V2 wrong: ${r['V2 (quá khứ)']}`;
      return null;
    },
  },
  {
    slug: 'modals-obligation',
    test: () => {
      const banks = banksForSlug('modals-obligation');
      const text = JSON.stringify(banks);
      if (!/mustn't|don'?t have to/i.test(text)) return 'missing mustn\'t vs don\'t have to';
      return null;
    },
  },
  {
    slug: 'articles',
    test: () => {
      const banks = banksForSlug('articles');
      const text = JSON.stringify(banks);
      if (!/university/i.test(text) || !/hour/i.test(text)) return 'missing a university / an hour cases';
      return null;
    },
  },
  {
    slug: 'conditionals-0-1',
    test: () => {
      const banks = banksForSlug('conditionals-0-1');
      const text = JSON.stringify(banks);
      if (/If it will rain/i.test(text) && !/Sai/i.test(text)) return 'teaches If it will rain as correct?';
      return null;
    },
  },
];

for (const s of spot) {
  try {
    const err = s.test();
    if (err) fail(s.slug, `spot: ${err}`);
    else pass.push({ slug: s.slug, spot: 'ok' });
  } catch (e) {
    fail(s.slug, `spot threw: ${e.message}`);
  }
}

const report = {
  at: new Date().toISOString(),
  topics: topics?.length || 0,
  failCount: fails.length,
  warnCount: warns.length,
  fails,
  warns: warns.slice(0, 80),
  warnTruncated: warns.length > 80,
  samplePass: pass.slice(0, 10),
  statsTopics: Object.keys(stats).length,
  totalRows: Object.values(stats).reduce((n, s) => n + s.rows, 0),
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-strict-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ failCount: fails.length, warnCount: warns.length, topics: topics?.length }, null, 2));
console.log('\n=== FAILS ===');
for (const f of fails.slice(0, 60)) console.log(`FAIL [${f.slug}] ${f.msg}`);
if (fails.length > 60) console.log(`... +${fails.length - 60} more fails`);
console.log('\n=== WARNS (first 40) ===');
for (const w of warns.slice(0, 40)) console.log(`WARN [${w.slug}] ${w.msg}`);
if (warns.length > 40) console.log(`... +${warns.length - 40} more warns`);

process.exitCode = fails.length ? 1 : 0;
