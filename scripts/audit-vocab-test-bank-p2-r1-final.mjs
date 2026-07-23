/**
 * Content audit p2-r1-final-verbs
 * node scripts/audit-vocab-test-bank-p2-r1-final.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'data/vocab-test-bank/p2-r1-final-verbs');

const all = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const it of j.items || []) all.push({ ...it, _file: f });
}

const issues = [];
const scores = [];
const byL = new Map();

const BAD = {
  meaning: /ý nghĩa của|sự từ chối|trạng thái thiếu|hành động ngược|thực hiện\s+[a-z]/i,
  colo: /apply\s+\S+\s+correctly|make\s+\S+\s+wrong|do\s+\S+\s+badly|the task\s+(successfully|wrongly|badly)/i,
  errorPrep: /without proper preparation|the work very quick/i,
  clozePlan: /it is necessary to ___ the plan/i,
  explainGeneric: /phù hợp nhất với ngữ cảnh|mang nghĩa chính xác là|dạng động từ nguyên mẫu chuẩn xác/i,
};

function frameKey(type, it) {
  const lemma = String(it.lemma).toLowerCase();
  let q = (it.stem?.q || '').toLowerCase();
  q = q.replace(new RegExp(lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'V');
  return q.replace(/\s+/g, ' ').trim().slice(0, 70);
}

const frames = { cloze: {}, error: {}, meaning: {}, l2: {}, colo: {} };
const coloAnswers = {};
const meaningAnswers = {};
const clozeOptsSets = {};

for (const it of all) {
  const L = String(it.lemma).toLowerCase();
  byL.set(L, (byL.get(L) || 0) + 1);
  if (typeof it.meta?.quality_score === 'number') scores.push(it.meta.quality_score);

  const opts = it.stem?.opts || [];
  const q = it.stem?.q || '';
  const ans = String(it.answer || '');
  const t = it.type;

  if (frames[t]) {
    const fk = frameKey(t, it);
    frames[t][fk] = (frames[t][fk] || 0) + 1;
  }

  if (t === 'meaning_mcq') {
    for (const o of opts) {
      if (BAD.meaning.test(String(o))) issues.push(`meaning_bad:${it.content_hash}:${o}`);
    }
    meaningAnswers[ans] = (meaningAnswers[ans] || 0) + 1;
    // weak: distractors too abstract same set
    if (opts.filter((o) => /tạo nên|thay đổi|hoàn thành|chuẩn bị|từ chối|giao tiếp/.test(String(o))).length >= 3) {
      issues.push(`meaning_generic_dist:${it.lemma}`);
    }
  }
  if (t === 'collocation_mcq') {
    for (const o of opts) {
      if (BAD.colo.test(String(o))) issues.push(`colo_bad:${it.content_hash}`);
    }
    if (!ans.includes(' ')) issues.push(`colo_single:${it.content_hash}`);
    coloAnswers[ans] = (coloAnswers[ans] || 0) + 1;
  }
  if (t === 'error') {
    if (BAD.errorPrep.test(q)) issues.push(`error_tpl:${it.content_hash}`);
    const wrongPast = ['finded', 'getted', 'goed', 'taked', 'maked', 'achieveed'];
    for (const w of wrongPast) {
      if (ans.toLowerCase().includes(w)) issues.push(`wrong_past_ans:${it.content_hash}:${w}`);
    }
  }
  if (t === 'cloze') {
    if (BAD.clozePlan.test(q)) issues.push(`cloze_tpl:${it.content_hash}`);
    // same distractor triple cancel postpone ignore?
    const okey = [...opts].filter((x) => x !== it.lemma).sort().join('|');
    clozeOptsSets[okey] = (clozeOptsSets[okey] || 0) + 1;
  }
  if (t === 'l2_to_en') {
    if (/^Nghĩa '|Tình huống cần '/.test(q) || /tương ứng với động từ|từ vựng tiếng Anh đúng là/.test(q)) {
      // count later
    }
  }
}

function top(obj, n = 8) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// sample mid/end lemmas
const lemmas = [...byL.keys()];
const pick = [
  lemmas[0],
  lemmas[5],
  lemmas[50],
  lemmas[100],
  lemmas[150],
  lemmas[200],
  lemmas[250],
  lemmas[lemmas.length - 1],
].filter(Boolean);

const samples = {};
for (const L of pick) {
  const items = all.filter((i) => String(i.lemma).toLowerCase() === L);
  samples[L] = Object.fromEntries(
    items.map((i) => [
      i.type,
      { q: i.stem.q, opts: i.stem.opts, a: i.answer, s: i.meta?.quality_score, exp: i.explain_vi },
    ]),
  );
}

// cloze distractor monopoly
const topClozeDist = top(clozeOptsSets, 5);

// l2 q templates
const l2qs = {};
for (const it of all.filter((i) => i.type === 'l2_to_en')) {
  const k = (it.stem.q || '')
    .replace(it.sense_vi || '', 'SENSE')
    .replace(it.lemma, 'V')
    .slice(0, 60);
  l2qs[k] = (l2qs[k] || 0) + 1;
}

const report = {
  files: fs.readdirSync(dir).filter((x) => x.endsWith('.json')).length,
  items: all.length,
  lemmas: byL.size,
  scores: {
    min: Math.min(...scores),
    max: Math.max(...scores),
    avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
  },
  issueCount: issues.length,
  issuesSample: issues.slice(0, 40),
  topClozeFrames: top(frames.cloze, 6),
  topErrorFrames: top(frames.error, 6),
  topColoAnswers: top(coloAnswers, 10),
  topMeaningAnswers: top(meaningAnswers, 8),
  topClozeDistractorSets: topClozeDist,
  topL2q: top(l2qs, 6),
  samples,
};

console.log(JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(root, 'tmp/AUDIT-vocab-test-bank-p2-r1-final.json'), JSON.stringify(report, null, 2));
process.exit(issues.length ? 1 : 0);
