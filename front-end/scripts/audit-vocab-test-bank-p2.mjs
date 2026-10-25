/**
 * Independent P2 bank audit (counts, fake-error, collocation, scores).
 * node scripts/audit-vocab-test-bank-p2.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bank = path.join(root, 'data/vocab-test-bank');
const dirs = ['p2-verbs', 'p2-thpt-mw', 'p2-thpt-sg', 'p2-oxford'];
const REQ = ['meaning_mcq', 'l2_to_en', 'cloze', 'error', 'collocation_mcq'];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u201c\u201d\u2018\u2019"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const all = [];
const hashes = new Set();
const dupHash = [];
const byLemma = new Map();
const issues = [];

for (const d of dirs) {
  const dir = path.join(bank, d);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const it of j.items || []) {
      all.push({ ...it, _dir: d, _file: f });
      if (it.content_hash) {
        if (hashes.has(it.content_hash)) dupHash.push(it.content_hash);
        hashes.add(it.content_hash);
      }
      const L = String(it.lemma).toLowerCase();
      if (!byLemma.has(L)) byLemma.set(L, new Set());
      byLemma.get(L).add(it.type);

      if (it.type === 'match_pair') issues.push(`match_pair:${L}`);
      if (!it.stem?.opts?.includes(it.answer)) issues.push(`ans:${it.content_hash || L}`);
      if (it.stem?.opts?.length !== 4) issues.push(`opts:${it.content_hash || L}`);
      if (it.type === 'cloze' && !/___/.test(it.stem?.q || '')) {
        issues.push(`cloze_blank:${it.content_hash || L}`);
      }
      if (it.type === 'error') {
        const q = it.stem?.q || '';
        const m = q.match(/['\u2018\u2019"\u201c\u201d]([^'\u2018\u2019"\u201c\u201d]+)['\u2018\u2019"\u201c\u201d]/);
        if (m && norm(m[1]) === norm(it.answer)) {
          issues.push(`fake_error:${it.content_hash || L}`);
        }
      }
    }
  }
}

const scores = all.map((i) => i.meta?.quality_score).filter((n) => typeof n === 'number');
const min = scores.length ? Math.min(...scores) : null;
const max = scores.length ? Math.max(...scores) : null;
const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
const dist = {};
for (const s of scores) dist[String(s)] = (dist[String(s)] || 0) + 1;

let incomplete = 0;
for (const [, set] of byLemma) {
  if (set.size !== 5 || !REQ.every((t) => set.has(t))) incomplete += 1;
}

let colo = 0;
let coloMulti = 0;
for (const it of all.filter((i) => i.type === 'collocation_mcq')) {
  colo += 1;
  if ((it.stem?.opts || []).some((o) => /\s/.test(String(o)))) coloMulti += 1;
}

const byDir = {};
for (const it of all) {
  byDir[it._dir] = byDir[it._dir] || { items: 0, lemmas: new Set() };
  byDir[it._dir].items += 1;
  byDir[it._dir].lemmas.add(String(it.lemma).toLowerCase());
}
const byDirOut = {};
for (const [k, v] of Object.entries(byDir)) {
  byDirOut[k] = { items: v.items, lemmas: v.lemmas.size };
}

function sample(lemma, type) {
  const it = all.find((i) => i.lemma === lemma && i.type === type);
  if (!it) return null;
  return {
    q: it.stem.q,
    opts: it.stem.opts,
    a: it.answer,
    s: it.meta?.quality_score,
  };
}

// dual-answer heuristic for late-style: error opts with both "late for" and "late to"
let dualSuspect = 0;
const dualSamples = [];
for (const it of all.filter((i) => i.type === 'error')) {
  const opts = (it.stem?.opts || []).map((o) => String(o).toLowerCase());
  if (opts.some((o) => o.includes('late for')) && opts.some((o) => o.includes('late to'))) {
    dualSuspect += 1;
    if (dualSamples.length < 3) dualSamples.push(it.content_hash || it.lemma);
  }
}

const report = {
  items: all.length,
  lemmas: byLemma.size,
  files: dirs.reduce(
    (n, d) =>
      n +
      (fs.existsSync(path.join(bank, d))
        ? fs.readdirSync(path.join(bank, d)).filter((x) => x.endsWith('.json')).length
        : 0),
    0,
  ),
  scores: {
    n: scores.length,
    min,
    max,
    avg: avg != null ? Math.round(avg * 1000) / 1000 : null,
  },
  dist,
  dupHash: dupHash.length,
  incomplete,
  issueCount: issues.length,
  issuesSample: issues.slice(0, 25),
  colo: {
    total: colo,
    multi: coloMulti,
    ratio: colo ? Math.round((coloMulti / colo) * 1000) / 1000 : 0,
  },
  dualSuspect,
  dualSamples,
  byDir: byDirOut,
  samples: {
    do_error: sample('do', 'error'),
    register_for_colo: sample('register for', 'collocation_mcq'),
    academic_meaning: sample('academic', 'meaning_mcq'),
    depend_error: sample('depend', 'error'),
  },
};

console.log(JSON.stringify(report, null, 2));
const out = path.join(root, 'tmp/AUDIT-vocab-test-bank-p2.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.error('wrote', out);
process.exit(issues.length || incomplete || dupHash.length ? 1 : 0);
