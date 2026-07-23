/**
 * Bank quiz đơn giản: CHỈ lemma + nghĩa đúng.
 * 3 đáp án nhiễu + thứ tự ABCD random lúc runtime (UI), không gen sẵn opts.
 *
 * node scripts/build-simple-vocab-quiz.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankRoot = path.join(root, 'data/vocab-test-bank');

const BAD_VI =
  /ý nghĩa của|sự từ chối|trạng thái thiếu|hành động ngược|thực hiện\s+[a-z]|bày tỏ hành động/i;

/** @type {Map<string, { lemma: string, vi: string, source: string }>} */
const map = new Map();

function add(lemma, vi, source) {
  const L = lemma.trim().toLowerCase();
  const v = String(vi || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!L || !v || v.length < 2) return;
  if (BAD_VI.test(v)) return;
  const prev = map.get(L);
  const rank = { curriculum: 3, gold: 2, bank: 1 };
  if (!prev || (rank[source] || 0) >= (rank[prev.source] || 0)) {
    map.set(L, { lemma: lemma.trim(), vi: v, source });
  }
}

const curPath = path.join(bankRoot, 'tonight-verb-curriculum.json');
if (fs.existsSync(curPath)) {
  const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));
  for (const L of cur.lemmas || []) {
    if (L.vi) add(L.lemma, L.vi, 'curriculum');
  }
}

const goldPath = path.join(bankRoot, 'gold/verb-sense-keywords-vi.json');
if (fs.existsSync(goldPath)) {
  const gold = JSON.parse(fs.readFileSync(goldPath, 'utf8'));
  for (const [k, arr] of Object.entries(gold)) {
    if (k.startsWith('_') || !Array.isArray(arr) || !arr.length) continue;
    add(k, arr.slice(0, 3).join('; '), 'gold');
  }
}

for (const f of fs.readdirSync(bankRoot).filter((x) => /^p[01]-/.test(x) && x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(bankRoot, f), 'utf8'));
  for (const it of j.items || []) {
    if (it.type !== 'meaning_mcq') continue;
    add(it.lemma, it.answer || it.sense_vi, 'bank');
  }
}

const finalDir = path.join(bankRoot, 'p2-r1-final-verbs');
if (fs.existsSync(finalDir)) {
  for (const f of fs.readdirSync(finalDir).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(finalDir, f), 'utf8'));
    for (const it of j.items || []) {
      if (it.type !== 'meaning_mcq') continue;
      const ans = String(it.answer || '').trim();
      if (ans.length <= 40 && !BAD_VI.test(ans)) add(it.lemma, ans, 'bank');
    }
  }
}

const entries = [...map.values()].sort((a, b) => a.lemma.localeCompare(b.lemma, 'en'));

/** Chỉ lemma + vi — KHÔNG opts */
const words = entries.map((e) => ({
  lemma: e.lemma,
  vi: e.vi,
  source: e.source,
}));

const pack = {
  version: 2,
  id: 'simple-vocab-quiz-all',
  title: 'Quiz từ vựng',
  note: 'EN → nghĩa VI. Đáp án nhiễu + thứ tự ABCD random lúc làm bài.',
  built_at: new Date().toISOString(),
  /** Runtime: pick 3 random vi từ words khác, shuffle */
  randomize_options: true,
  lemma_count: words.length,
  words,
  lemmas: words.map((w) => w.lemma),
  phase2: {
    status: 'pending',
    type: 'cloze',
    note: 'Phase 2: cloze cho từng lemma',
  },
};

const outFull = path.join(bankRoot, 'simple-vocab-quiz-all.json');
const outPublic = path.join(root, 'public/data/simple-vocab-quiz-all.json');
const outTonight = path.join(root, 'public/data/tonight-verb-drill.json');
const outTonightData = path.join(bankRoot, 'tonight-verb-drill.json');

fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outFull, JSON.stringify(pack, null, 2));
fs.writeFileSync(outPublic, JSON.stringify(pack));
// alias cho page cũ
fs.writeFileSync(outTonight, JSON.stringify(pack));
fs.writeFileSync(outTonightData, JSON.stringify(pack, null, 2));

const bySrc = {};
for (const e of entries) bySrc[e.source] = (bySrc[e.source] || 0) + 1;
console.log(
  JSON.stringify(
    { lemmas: words.length, bySrc, sample: words.slice(0, 5), randomize_options: true },
    null,
    2,
  ),
);
