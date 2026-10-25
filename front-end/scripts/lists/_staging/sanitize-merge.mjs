/**
 * Sanitize raw CLI/agent output → clean wordlist, dedup vs existing lists.
 * Usage: node sanitize-merge.mjs <raw-file> <out-file-in-lists>
 *   node sanitize-merge.mjs toeic-2026.raw.txt ../toeic-2026.txt
 * - Splits on comma/newline, trims, lowercases.
 * - Keeps only tokens matching /^[a-z][a-z '-]*$/ with 1-3 words (drops prose/markdown).
 * - Dedups within file AND drops tokens already present in ALL other lists/*.txt
 *   (so new files add net-new coverage). Writes comma-separated, ~12 words/line.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const LISTS_DIR = path.resolve(DIR, '..');

const MAX_WORDS = Number(process.argv[4]) || 3; // optional 3rd CLI arg
const TOKEN = new RegExp(`^[a-z][a-z'’-]*(?:[ ][a-z][a-z'’-]*){0,${MAX_WORDS - 1}}$`);

function parse(raw) {
  return raw
    .split(/\r?\n|,/)
    .map((w) => w.trim().toLowerCase().replace(/[.;:!?"]+$/g, '').replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
    .filter((w) => TOKEN.test(w) && w.length >= 2 && w.length <= 40);
}

function loadExisting(exclude) {
  const set = new Set();
  for (const f of readdirSync(LISTS_DIR)) {
    if (!f.endsWith('.txt') || f === exclude) continue;
    try {
      for (const w of parse(readFileSync(path.join(LISTS_DIR, f), 'utf-8'))) set.add(w);
    } catch {}
  }
  return set;
}

const [rawFile, outRel] = process.argv.slice(2);
if (!rawFile || !outRel) {
  console.error('Usage: node sanitize-merge.mjs <raw-file> <out-file-rel-to-lists>');
  process.exit(1);
}
const raw = readFileSync(path.resolve(DIR, rawFile), 'utf-8');
const outName = path.basename(outRel);
const existing = loadExisting(outName);

const seen = new Set();
const kept = [];
let dupGlobal = 0;
for (const w of parse(raw)) {
  if (seen.has(w)) continue;
  seen.add(w);
  if (existing.has(w)) { dupGlobal++; continue; }
  kept.push(w);
}

// chunk ~12 per line for readability
const lines = [];
for (let i = 0; i < kept.length; i += 12) lines.push(kept.slice(i, i + 12).join(', '));
const out = lines.join(',\n') + '\n';
writeFileSync(path.resolve(LISTS_DIR, outName), out, 'utf-8');
console.log(`[sanitize] ${rawFile} → lists/${outName}`);
console.log(`  parsed-unique: ${seen.size}, already-in-other-lists: ${dupGlobal}, NET-NEW written: ${kept.length}`);
