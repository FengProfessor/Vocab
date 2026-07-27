/**
 * Export P2 lemma queues for vocab test bank (exclude P0/P1 lemmas).
 * node scripts/export-p2-lemma-queues.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'data/vocab-test-bank/p2-lemma-lists');
fs.mkdirSync(outDir, { recursive: true });

function bankLemmas() {
  const set = new Set();
  const dir = path.join(root, 'data/vocab-test-bank');
  for (const f of fs.readdirSync(dir).filter((x) => /^p[01]-/.test(x))) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const it of j.items || []) set.add(String(it.lemma).toLowerCase());
  }
  return set;
}

function splitCommaList(raw) {
  return [
    ...new Set(
      raw
        .replace(/\r/g, '')
        .split(/,|\n/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function loadLines(p) {
  return fs
    .readFileSync(p, 'utf8')
    .split(/\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith('#'));
}

const existing = bankLemmas();
const verbsAll = loadLines(path.join(root, 'scripts/lists/common-verbs-freq.txt')).slice(0, 300);
const verbsNew = verbsAll.filter((v) => !existing.has(v));

const thpt26 = splitCommaList(
  fs.readFileSync(path.join(root, 'scripts/lists/thpt-2026-reform.txt'), 'utf8'),
);
const thptCore = splitCommaList(
  fs.readFileSync(path.join(root, 'scripts/lists/thpt-quoc-gia-core.txt'), 'utf8'),
);
const thpt = [...new Set([...thpt26, ...thptCore])].filter((w) => !existing.has(w));
const verbSet = new Set(verbsNew);
const thptMulti = thpt.filter((w) => w.includes(' '));
const thptSingle = thpt.filter((w) => !w.includes(' ') && !verbSet.has(w));

const oxList = loadLines(path.join(root, 'scripts/lists/oxford-3000.txt'));
const oxSet = new Set(oxList);
const themesRaw = fs.readFileSync(path.join(root, 'scripts/catalog-v3/oxford-themes.ts'), 'utf8');
const seeds = [...themesRaw.matchAll(/'([a-z][a-z' -]*)'/gi)].map((m) =>
  m[1].toLowerCase().replace(/'/g, ''),
);
// crude: only tokens that look like words in seeds arrays — filter to ox membership
const func = new Set(
  'before after about above again against among around because between during without within under until while where which whose whom there their these those being having doing going a an the and or but if of to in on at as by for from with'.split(
    ' ',
  ),
);
const seen = new Set();
const oxPart = [];
for (const w of seeds) {
  if (!/^[a-z][a-z-]*$/.test(w)) continue;
  if (seen.has(w) || existing.has(w) || verbSet.has(w) || thpt.includes(w) || func.has(w))
    continue;
  if (!oxSet.has(w) || w.length < 3) continue;
  seen.add(w);
  oxPart.push(w);
  if (oxPart.length >= 300) break;
}
if (oxPart.length < 300) {
  for (const w of oxList) {
    if (seen.has(w) || existing.has(w) || verbSet.has(w) || thpt.includes(w) || func.has(w))
      continue;
    if (w.length < 4) continue;
    seen.add(w);
    oxPart.push(w);
    if (oxPart.length >= 300) break;
  }
}

fs.writeFileSync(path.join(outDir, 'p2-verbs-top300.txt'), `${verbsNew.join('\n')}\n`);
fs.writeFileSync(path.join(outDir, 'p2-thpt-multiword.txt'), `${thptMulti.join('\n')}\n`);
fs.writeFileSync(path.join(outDir, 'p2-thpt-single.txt'), `${thptSingle.join('\n')}\n`);
fs.writeFileSync(path.join(outDir, 'p2-oxford-part300.txt'), `${oxPart.join('\n')}\n`);

const meta = {
  version: 2,
  existing_p0p1: existing.size,
  order: [
    'p2-verbs-top300.txt',
    'p2-thpt-multiword.txt',
    'p2-thpt-single.txt',
    'p2-oxford-part300.txt',
  ],
  counts: {
    verbs_new: verbsNew.length,
    thpt_multi: thptMulti.length,
    thpt_single: thptSingle.length,
    oxford_part: oxPart.length,
    total_lemmas: verbsNew.length + thptMulti.length + thptSingle.length + oxPart.length,
    approx_items:
      (verbsNew.length + thptMulti.length + thptSingle.length + oxPart.length) * 5,
  },
  samples: {
    verbs: verbsNew.slice(0, 8),
    thpt_multi: thptMulti.slice(0, 8),
    thpt_single: thptSingle.slice(0, 8),
    oxford: oxPart.slice(0, 8),
  },
};
fs.writeFileSync(path.join(outDir, 'p2-queues-meta.json'), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));
