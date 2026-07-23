/**
 * GLOBAL bank verify — catches what per-file verify cannot:
 * 1) Wrong Vietnamese meaning vs gold keywords
 * 2) Frame / distractor monopoly across whole directory
 * 3) Recycled gloss pool used as false "answers"
 *
 * Usage:
 *   node scripts/verify-vocab-test-bank-global.mjs data/vocab-test-bank/p2-r1-final-verbs
 *   node scripts/verify-vocab-test-bank-global.mjs data/vocab-test-bank/p2-r1-final-verbs --fix-file
 *
 * Exit 1 if any hard fail.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = path.resolve(process.argv[2] || '');
const alsoPerFile = process.argv.includes('--fix-file');

if (!targetDir || !fs.existsSync(targetDir)) {
  console.error('Usage: node scripts/verify-vocab-test-bank-global.mjs <bank-dir> [--per-file]');
  process.exit(1);
}

const goldPath = path.join(root, 'data/vocab-test-bank/gold/verb-sense-keywords-vi.json');
const goldRaw = JSON.parse(fs.readFileSync(goldPath, 'utf8'));
const gold = {};
for (const [k, v] of Object.entries(goldRaw)) {
  if (k.startsWith('_')) continue;
  gold[k.toLowerCase()] = Array.isArray(v) ? v : [v];
}

const files = fs
  .readdirSync(targetDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => path.join(targetDir, f));

if (!files.length) {
  console.error('No JSON in', targetDir);
  process.exit(1);
}

/** @type {any[]} */
const all = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const it of j.items || []) {
    all.push({ ...it, _file: path.basename(f) });
  }
}

let ok = true;
const fails = [];
function fail(msg) {
  ok = false;
  fails.push(msg);
  console.error('FAIL:', msg);
}

// ---------- 0) optional per-file strict verify ----------
if (alsoPerFile) {
  const verifyScript = path.join(root, 'scripts/verify-vocab-test-bank.mjs');
  for (const f of files) {
    const r = spawnSync(process.execPath, [verifyScript, f], { encoding: 'utf8' });
    if (r.status !== 0) {
      fail(`per-file verify failed: ${path.basename(f)}`);
      if (r.stderr) console.error(r.stderr.slice(0, 500));
      if (r.stdout) console.error(r.stdout.slice(-400));
    }
  }
}

// ---------- 1) counts ----------
const lemmas = new Set(all.map((i) => String(i.lemma).toLowerCase()));
const byType = {};
for (const it of all) {
  byType[it.type] = (byType[it.type] || 0) + 1;
}

// ---------- 2) MEANING correctness vs gold ----------
const meaningItems = all.filter((i) => i.type === 'meaning_mcq');
let meaningChecked = 0;
let meaningWrong = 0;
const wrongSamples = [];

for (const it of meaningItems) {
  const L = String(it.lemma).toLowerCase();
  const keys = gold[L];
  if (!keys?.length) continue; // no gold → skip hard (still diversity checks)
  meaningChecked += 1;
  const blob = `${it.answer || ''} ${it.sense_vi || ''}`.toLowerCase();
  const hit = keys.some((k) => blob.includes(String(k).toLowerCase()));
  if (!hit) {
    meaningWrong += 1;
    if (wrongSamples.length < 25) {
      wrongSamples.push({
        lemma: L,
        answer: it.answer,
        sense_vi: it.sense_vi,
        expect: keys,
        file: it._file,
      });
    }
    fail(`wrong_meaning ${L}: answer="${it.answer}" expect~${keys.join('|')} (${it._file})`);
  }
}

// ---------- 3) GLOBAL frame monopoly (cloze / error) ----------
function normFrame(it) {
  const lemma = String(it.lemma).toLowerCase();
  return String(it.stem?.q || '')
    .toLowerCase()
    .replace(new RegExp(lemma.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'V')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkFrameCap(type, maxShare, maxAbs) {
  const items = all.filter((i) => i.type === type);
  const n = items.length;
  if (n < 30) return;
  const counts = {};
  for (const it of items) {
    const f = normFrame(it).slice(0, 80);
    counts[f] = (counts[f] || 0) + 1;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topFrame, topN] = ranked[0] || ['', 0];
  const share = topN / n;
  if (share > maxShare || topN > maxAbs) {
    fail(
      `global_${type}_frame monopoly: ${topN}/${n} (${(share * 100).toFixed(1)}%) frame="${topFrame.slice(0, 60)}…"`,
    );
  }
  // also: too few unique frames
  if (ranked.length < Math.min(20, Math.floor(n / 8))) {
    fail(`global_${type}_frame diversity too low: only ${ranked.length} unique frames for ${n} items`);
  }
}

checkFrameCap('cloze', 0.08, 12); // no frame >8% or >12 times whole bank
checkFrameCap('error', 0.08, 12);

// ---------- 4) GLOBAL cloze distractor set monopoly ----------
const clozeDist = {};
for (const it of all.filter((i) => i.type === 'cloze')) {
  const opts = [...(it.stem?.opts || [])]
    .map(String)
    .filter((o) => o.toLowerCase() !== String(it.lemma).toLowerCase())
    .sort()
    .join('|');
  clozeDist[opts] = (clozeDist[opts] || 0) + 1;
}
const clozeN = all.filter((i) => i.type === 'cloze').length;
const topDist = Object.entries(clozeDist).sort((a, b) => b[1] - a[1])[0];
if (topDist && clozeN >= 30 && topDist[1] / clozeN > 0.12) {
  fail(
    `global_cloze_distractors monopoly: ${topDist[1]}/${clozeN} use [${topDist[0]}]`,
  );
}

// ---------- 5) GLOBAL collocation answer / pattern spam ----------
const coloAns = {};
const coloPat = {};
for (const it of all.filter((i) => i.type === 'collocation_mcq')) {
  const a = String(it.answer || '').toLowerCase();
  coloAns[a] = (coloAns[a] || 0) + 1;
  // pattern: "VERB something carefully"
  const pat = a
    .replace(String(it.lemma).toLowerCase(), 'V')
    .replace(/\s+/g, ' ');
  coloPat[pat] = (coloPat[pat] || 0) + 1;
}
const coloN = all.filter((i) => i.type === 'collocation_mcq').length;
const topColoPat = Object.entries(coloPat).sort((a, b) => b[1] - a[1])[0];
if (topColoPat && coloN >= 30 && topColoPat[1] / coloN > 0.12) {
  fail(
    `global_collocation_pattern monopoly: ${topColoPat[1]}/${coloN} pattern="${topColoPat[0]}"`,
  );
}
// soft garbage patterns absolute
for (const [pat, n] of Object.entries(coloPat)) {
  if (
    n >= 5 &&
    (/v something carefully/.test(pat) ||
      /v in wrong way/.test(pat) ||
      /v without care/.test(pat) ||
      /v for nothing/.test(pat))
  ) {
    fail(`garbage collocation pattern x${n}: ${pat}`);
  }
}

// ---------- 6) GLOBAL l2 question template spam ----------
const l2q = {};
for (const it of all.filter((i) => i.type === 'l2_to_en')) {
  const q = String(it.stem?.q || '')
    .replace(String(it.sense_vi || ''), 'SENSE')
    .replace(String(it.lemma || ''), 'V')
    .toLowerCase()
    .slice(0, 70);
  l2q[q] = (l2q[q] || 0) + 1;
}
const l2N = all.filter((i) => i.type === 'l2_to_en').length;
const topL2 = Object.entries(l2q).sort((a, b) => b[1] - a[1])[0];
if (topL2 && l2N >= 30 && topL2[1] / l2N > 0.2) {
  fail(`global_l2_q monopoly: ${topL2[1]}/${l2N} q~"${topL2[0]}"`);
}

// ---------- 7) meaning gloss pool: same answer string on many different lemmas ----------
const meaningAnsByText = {};
for (const it of meaningItems) {
  const a = String(it.answer || '').toLowerCase().trim();
  if (!meaningAnsByText[a]) meaningAnsByText[a] = new Set();
  meaningAnsByText[a].add(String(it.lemma).toLowerCase());
}
for (const [ans, set] of Object.entries(meaningAnsByText)) {
  if (set.size >= 8) {
    fail(
      `meaning_answer reused as canonical for ${set.size} lemmas: "${ans}" → [${[...set].slice(0, 8).join(', ')}…]`,
    );
  }
}

// ---------- report ----------
const summary = {
  dir: targetDir,
  files: files.length,
  items: all.length,
  lemmas: lemmas.size,
  meaning: {
    goldChecked: meaningChecked,
    wrong: meaningWrong,
    wrongSamples: wrongSamples.slice(0, 12),
  },
  byType,
  FAIL_COUNT: fails.length,
  VERIFY_GLOBAL_OK: ok,
};

console.log(JSON.stringify(summary, null, 2));
fs.writeFileSync(
  path.join(root, 'tmp/AUDIT-global-last.json'),
  JSON.stringify({ summary, fails }, null, 2),
);

if (!ok) {
  console.error(`\nVERIFY_GLOBAL_OK=false fails=${fails.length}`);
  process.exit(1);
}
console.log('\nVERIFY_GLOBAL_OK=true');
