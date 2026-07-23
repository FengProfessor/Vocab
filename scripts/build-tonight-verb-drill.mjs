/**
 * Build pack dạy tối nay: meaning + l2 + colo (đã lọc distractor rác).
 * Không dùng cloze/error (chất chưa đủ).
 *
 * node scripts/build-tonight-verb-drill.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankDir = path.join(root, 'data/vocab-test-bank/p2-r1-final-verbs');
const goldPath = path.join(root, 'data/vocab-test-bank/gold/verb-sense-keywords-vi.json');
const queuePath = path.join(root, 'data/vocab-test-bank/p2-lemma-lists/p2-verbs-top300.txt');

const TONIGHT_N = 40; // top 40 tần suất
const KEEP_TYPES = new Set(['meaning_mcq', 'l2_to_en', 'collocation_mcq']);
const GARBAGE =
  /in wrong way|without care|for nothing|apply\s+\S+\s+correctly|make\s+\S+\s+wrong|do\s+\S+\s+badly|the task\s+(successfully|wrongly)/i;

const gold = JSON.parse(fs.readFileSync(goldPath, 'utf8'));
const queue = fs
  .readFileSync(queuePath, 'utf8')
  .split(/\n/)
  .map((l) => l.trim().toLowerCase())
  .filter((l) => l && !l.startsWith('#'));

const tonightLemmas = queue.slice(0, TONIGHT_N);

/** Load all bank items */
const byLemma = new Map();
for (const f of fs.readdirSync(bankDir).filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(bankDir, f), 'utf8'));
  for (const it of j.items || []) {
    const L = String(it.lemma).toLowerCase();
    if (!byLemma.has(L)) byLemma.set(L, []);
    byLemma.get(L).push(it);
  }
}

function senseOk(lemma, item) {
  const keys = gold[lemma];
  if (!keys?.length) return true;
  const blob = `${item.answer || ''} ${item.sense_vi || ''}`.toLowerCase();
  return keys.some((k) => blob.includes(String(k).toLowerCase()));
}

function cleanColo(item, lemma) {
  const ans = String(item.answer || '').trim();
  let opts = (item.stem?.opts || []).map(String).filter((o) => !GARBAGE.test(o));
  if (!opts.includes(ans)) opts = [ans, ...opts];
  const fillers = [
    ans.replace(/^\S+/, 'make'),
    ans.replace(/^\S+/, 'do'),
    ans.replace(/^\S+/, 'take'),
    'make a mistake',
    'do homework',
    'get ready',
    'take a break',
    'look after someone',
  ].filter((o) => o.includes(' ') && o.toLowerCase() !== ans.toLowerCase());

  const out = [];
  const seen = new Set();
  for (const o of [...opts, ...fillers]) {
    const k = o.toLowerCase();
    if (seen.has(k) || GARBAGE.test(o)) continue;
    seen.add(k);
    out.push(o);
    if (out.length >= 4) break;
  }
  while (out.length < 4) {
    out.push(`${lemma} something else ${out.length}`);
  }
  // ensure answer first then shuffle later in UI
  if (!out.includes(ans)) out[0] = ans;
  return {
    ...item,
    stem: { ...item.stem, opts: out.slice(0, 4) },
    answer: ans,
    meta: { ...(item.meta || {}), tonight: true, colo_cleaned: true },
  };
}

const items = [];
const lemmasOut = [];
const skipped = [];

for (const lemma of tonightLemmas) {
  const list = byLemma.get(lemma) || [];
  if (!list.length) {
    skipped.push({ lemma, reason: 'missing_bank' });
    continue;
  }
  const kept = [];
  for (const it of list) {
    if (!KEEP_TYPES.has(it.type)) continue;
    if (it.type === 'meaning_mcq' && !senseOk(lemma, it)) {
      skipped.push({ lemma, reason: 'bad_meaning', type: it.type });
      continue;
    }
    if (it.type === 'collocation_mcq') {
      kept.push(cleanColo(it, lemma));
    } else {
      kept.push({ ...it, meta: { ...(it.meta || {}), tonight: true } });
    }
  }
  const types = new Set(kept.map((i) => i.type));
  if (!types.has('meaning_mcq') || !types.has('l2_to_en')) {
    skipped.push({ lemma, reason: 'missing_core_types', have: [...types] });
    continue;
  }
  lemmasOut.push(lemma);
  items.push(...kept);
}

const pack = {
  version: 1,
  id: 'tonight-verb-drill',
  title: 'Drill động từ tối nay',
  title_en: 'Tonight verb drill',
  note: 'Chỉ meaning + l2 + colo (đã lọc). Không cloze/error — AG phase 2.',
  built_at: new Date().toISOString(),
  types: ['meaning_mcq', 'l2_to_en', 'collocation_mcq'],
  lemmas: lemmasOut,
  lemma_count: lemmasOut.length,
  item_count: items.length,
  items,
  skipped,
};

const outData = path.join(root, 'data/vocab-test-bank/tonight-verb-drill.json');
const outPublic = path.join(root, 'public/data/tonight-verb-drill.json');
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outData, JSON.stringify(pack, null, 2));
fs.writeFileSync(outPublic, JSON.stringify(pack));
console.log(
  JSON.stringify(
    {
      lemmas: pack.lemma_count,
      items: pack.item_count,
      skipped: skipped.length,
      outData,
      outPublic,
      sample: lemmasOut.slice(0, 12),
    },
    null,
    2,
  ),
);
