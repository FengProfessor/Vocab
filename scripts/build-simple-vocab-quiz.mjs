/**
 * Bank quiz đơn giản: EN → chọn nghĩa VI (1 đúng + 3 nhiễu).
 * Nguồn: P0/P1 meaning + gold verbs + curriculum.
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
  // Prefer shorter clean glosses; keep first good source, upgrade if longer curriculum
  const prev = map.get(L);
  if (!prev) {
    map.set(L, { lemma: lemma.trim(), vi: v, source });
    return;
  }
  // prefer curriculum / gold over bank machine
  const rank = { curriculum: 3, gold: 2, bank: 1 };
  if ((rank[source] || 0) >= (rank[prev.source] || 0)) {
    map.set(L, { lemma: lemma.trim(), vi: v, source });
  }
}

// 1) Curriculum tay
const curPath = path.join(bankRoot, 'tonight-verb-curriculum.json');
if (fs.existsSync(curPath)) {
  const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));
  for (const L of cur.lemmas || []) {
    if (L.vi) add(L.lemma, L.vi, 'curriculum');
  }
}

// 2) Gold verb keywords → gloss ngắn
const goldPath = path.join(bankRoot, 'gold/verb-sense-keywords-vi.json');
if (fs.existsSync(goldPath)) {
  const gold = JSON.parse(fs.readFileSync(goldPath, 'utf8'));
  for (const [k, arr] of Object.entries(gold)) {
    if (k.startsWith('_') || !Array.isArray(arr) || !arr.length) continue;
    // "nhận; lấy; có được" style — max 3 keywords
    const vi = arr.slice(0, 3).join('; ');
    add(k, vi, 'gold');
  }
}

// 3) P0 + P1 meaning answers (nếu sạch)
for (const f of fs.readdirSync(bankRoot).filter((x) => /^p[01]-/.test(x) && x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(bankRoot, f), 'utf8'));
  for (const it of j.items || []) {
    if (it.type !== 'meaning_mcq') continue;
    const ans = it.answer || it.sense_vi;
    add(it.lemma, ans, 'bank');
  }
}

// 4) Phase2-upgraded file 01 may have better sense_vi
const finalDir = path.join(bankRoot, 'p2-r1-final-verbs');
if (fs.existsSync(finalDir)) {
  for (const f of fs.readdirSync(finalDir).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(fs.readFileSync(path.join(finalDir, f), 'utf8'));
    for (const it of j.items || []) {
      if (it.type !== 'meaning_mcq') continue;
      // only if gold-compatible short enough
      const ans = String(it.answer || '').trim();
      if (ans.length <= 40 && !BAD_VI.test(ans)) add(it.lemma, ans, 'bank');
    }
  }
}

const entries = [...map.values()].sort((a, b) =>
  a.lemma.localeCompare(b.lemma, 'en'),
);

// Build MCQ: 3 wrong from other entries' vi (unique)
function pickWrongs(selfVi, allVis, n = 3) {
  const pool = shuffle(allVis.filter((v) => v !== selfVi));
  const out = [];
  const seen = new Set([selfVi]);
  for (const v of pool) {
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= n) break;
  }
  // pad if needed
  const pad = ['khác nghĩa', 'không đúng', 'sai hoàn toàn', 'không dùng'];
  let i = 0;
  while (out.length < n) {
    const p = `${pad[i % pad.length]} ${i}`;
    if (!seen.has(p)) out.push(p);
    i += 1;
  }
  return out;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stable wrongs: seed by lemma hash so rebuilds don't thrash if we want
// For simplicity use shuffle with fixed seed per lemma
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lemmaSeed(lemma) {
  let h = 0;
  for (let i = 0; i < lemma.length; i++) h = (h * 31 + lemma.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

const allVis = entries.map((e) => e.vi);
const items = [];

for (const e of entries) {
  const others = allVis.filter((v) => v !== e.vi);
  const wrongs = seededShuffle(others, lemmaSeed(e.lemma)).slice(0, 3);
  while (wrongs.length < 3) wrongs.push(`(khác) ${wrongs.length}`);
  const opts = [e.vi, ...wrongs];
  items.push({
    lemma: e.lemma,
    type: 'meaning_mcq',
    stem: { q: e.lemma, opts },
    answer: e.vi,
    meta: { source: e.source },
  });
}

const pack = {
  version: 1,
  id: 'simple-vocab-quiz-all',
  title: 'Quiz từ vựng',
  note: 'EN → chọn nghĩa VI. 1 dạng duy nhất.',
  built_at: new Date().toISOString(),
  types: ['meaning_mcq'],
  lemma_count: entries.length,
  item_count: items.length,
  lemmas: entries.map((e) => e.lemma),
  items,
  // Phase 2 slot
  phase2: {
    status: 'pending',
    type: 'cloze',
    note: 'Sẽ thêm điền chỗ trống cho từng lemma',
  },
};

const outFull = path.join(bankRoot, 'simple-vocab-quiz-all.json');
const outPublic = path.join(root, 'public/data/simple-vocab-quiz-all.json');
const outTonight = path.join(root, 'public/data/tonight-verb-drill.json');
const outTonightData = path.join(bankRoot, 'tonight-verb-drill.json');

fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outFull, JSON.stringify(pack, null, 2));
fs.writeFileSync(outPublic, JSON.stringify(pack));

// Drill page uses tonight-verb-drill.json — point to full simple quiz
const drillPack = {
  ...pack,
  id: 'tonight-verb-drill',
  title: 'Quiz từ vựng',
  note: 'Từ tiếng Anh → chọn nghĩa tiếng Việt.',
};
fs.writeFileSync(outTonight, JSON.stringify(drillPack));
fs.writeFileSync(outTonightData, JSON.stringify(drillPack, null, 2));

// source breakdown
const bySrc = {};
for (const e of entries) bySrc[e.source] = (bySrc[e.source] || 0) + 1;

console.log(
  JSON.stringify(
    {
      lemmas: pack.lemma_count,
      items: pack.item_count,
      bySrc,
      sample: items.slice(0, 3).map((i) => ({ q: i.stem.q, a: i.answer, opts: i.stem.opts })),
    },
    null,
    2,
  ),
);
