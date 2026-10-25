/**
 * Content audit for p2-r1-verbs (post strict regen).
 * node scripts/audit-vocab-test-bank-p2-r1.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'data/vocab-test-bank/p2-r1-verbs');

const BAD = {
  meaningOpt:
    /ý nghĩa của|sự từ chối đối với|trạng thái thiếu|hành động ngược lại với/i,
  colo:
    /\bapply\s+\S+\s+correctly\b|\bmake\s+\S+\s+wrong\b|\bdo\s+\S+\s+badly\b|\btake\s+\S+\s+off\b/i,
  errorPrep: /try to\s+.+\s+without proper preparation/i,
  errorFail: /fail to\s+.+\s+on time/i,
};

const all = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const it of j.items || []) all.push({ ...it, _file: f });
}

const issues = [];
const scores = [];
const byL = new Map();

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\u201c\u201d\u2018\u2019"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const it of all) {
  const L = String(it.lemma).toLowerCase();
  if (!byL.has(L)) byL.set(L, new Set());
  byL.get(L).add(it.type);
  if (typeof it.meta?.quality_score === 'number') scores.push(it.meta.quality_score);

  const opts = it.stem?.opts || [];
  const q = it.stem?.q || '';
  const joined = opts.join(' | ');

  if (it.type === 'meaning_mcq') {
    for (const o of opts) {
      if (BAD.meaningOpt.test(String(o))) issues.push(`meaning_tpl:${it.content_hash}:${o}`);
    }
    if (/^ý nghĩa của/i.test(String(it.answer || ''))) {
      issues.push(`meaning_ans_meta:${it.content_hash}`);
    }
  }
  if (it.type === 'collocation_mcq') {
    for (const o of opts) {
      if (BAD.colo.test(String(o))) issues.push(`colo_tpl:${it.content_hash}:${o}`);
    }
    if (!String(it.answer || '').includes(' ')) {
      issues.push(`colo_single:${it.content_hash}`);
    }
    // weak: all opts start with same first word only mechanical
  }
  if (it.type === 'error') {
    if (BAD.errorPrep.test(q) || BAD.errorFail.test(q)) {
      issues.push(`error_tpl:${it.content_hash}`);
    }
    const m = q.match(/['\u2018\u2019"\u201c\u201d]([^'\u2018\u2019"\u201c\u201d]+)['\u2018\u2019"\u201c\u201d]/);
    if (m && norm(m[1]) === norm(it.answer)) {
      issues.push(`fake_error:${it.content_hash}`);
    }
  }
}

// frame diversity for cloze/error
const clozeFrames = {};
const errorFrames = {};
for (const it of all) {
  if (it.type === 'cloze') {
    const frame = (it.stem.q || '').replace(it.lemma, 'LEMMA').slice(0, 40);
    clozeFrames[frame] = (clozeFrames[frame] || 0) + 1;
  }
  if (it.type === 'error') {
    const frame = (it.stem.q || '')
      .replace(new RegExp(it.lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'LEMMA')
      .slice(0, 50);
    errorFrames[frame] = (errorFrames[frame] || 0) + 1;
  }
}
const topCloze = Object.entries(clozeFrames)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
const topError = Object.entries(errorFrames)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

// sample random-ish lemmas
const sampleLemmas = ['do', 'get', 'think', 'look', 'use', 'find', 'cancel', 'depend', 'achieve', 'consider'];
const samples = {};
for (const L of sampleLemmas) {
  const items = all.filter((i) => i.lemma === L);
  if (!items.length) continue;
  samples[L] = items.map((i) => ({
    type: i.type,
    q: i.stem.q,
    opts: i.stem.opts,
    a: i.answer,
    s: i.meta?.quality_score,
  }));
}

const dist = {};
for (const s of scores) dist[String(s)] = (dist[String(s)] || 0) + 1;

const report = {
  items: all.length,
  lemmas: byL.size,
  files: fs.readdirSync(dir).filter((x) => x.endsWith('.json')).length,
  scores: {
    n: scores.length,
    min: Math.min(...scores),
    max: Math.max(...scores),
    avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
  },
  dist,
  issueCount: issues.length,
  issuesSample: issues.slice(0, 30),
  topClozeFrames: topCloze,
  topErrorFrames: topError,
  samples,
};

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(
  path.join(root, 'tmp/AUDIT-vocab-test-bank-p2-r1.json'),
  JSON.stringify(report, null, 2),
);
process.exit(issues.length ? 1 : 0);
