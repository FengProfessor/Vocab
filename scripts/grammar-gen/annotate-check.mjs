/**
 * Bước 3: validate annotations sau khi Codex gán role.
 * Mỗi annotation phải: sentence.slice(start,end) === word · role thuộc whitelist · role != "".
 * Exit code != 0 nếu có lỗi → chặn import.
 *
 * Chạy (trong web-app/): node scripts/grammar-gen/annotate-check.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');

const ROLES = new Set([
  'noun', 'pronoun', 'verb', 'auxiliary', 'modal', 'adjective', 'adverb',
  'preposition', 'conjunction', 'determiner', 'article', 'interjection', 'other',
]);
const EDGE = /["“”‘’()\[\]{}.,!?;:…—–]/;

function tokenize(sentence) {
  const tokens = [];
  const re = /\S+/g;
  let match;
  while ((match = re.exec(sentence))) {
    let start = match.index;
    let end = start + match[0].length;
    while (start < end && EDGE.test(sentence[start])) start++;
    while (end > start && EDGE.test(sentence[end - 1])) end--;
    if (end > start) tokens.push({ word: sentence.slice(start, end), start, end });
  }
  return tokens;
}

const files = readdirSync(OUT).filter((f) => f.endsWith('.json')).sort();
let errors = 0;
let okEx = 0;
let okTok = 0;
const filesWithErr = new Set();

for (const f of files) {
  const json = JSON.parse(readFileSync(path.join(OUT, f), 'utf8'));
  const examples = json.sections?.examples;
  if (!Array.isArray(examples) || examples.length === 0) {
    console.log(`  ✗ ${f}: sections.examples thiếu/rỗng`);
    errors++; filesWithErr.add(f); continue;
  }
  for (const ex of examples) {
    if (typeof ex.en !== 'string' || !ex.en.trim()) {
      console.log(`  ✗ ${f}: ví dụ thiếu câu tiếng Anh`);
      errors++; filesWithErr.add(f); continue;
    }
    if (!Array.isArray(ex.annotations) || ex.annotations.length === 0) {
      console.log(`  ✗ ${f}: ví dụ thiếu annotations → "${ex.en}"`);
      errors++; filesWithErr.add(f); continue;
    }
    okEx++;
    const expected = tokenize(ex.en);
    const actual = ex.annotations.map(({ word, start, end }) => ({ word, start, end }));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      console.log(`  ✗ ${f}: annotation không phủ token 1:1 trong "${ex.en}"`);
      errors++; filesWithErr.add(f);
    }
    for (const a of ex.annotations) {
      okTok++;
      if (ex.en.slice(a.start, a.end) !== a.word) {
        console.log(`  ✗ ${f}: offset lệch — word="${a.word}" nhưng slice="${ex.en.slice(a.start, a.end)}" trong "${ex.en}"`);
        errors++; filesWithErr.add(f);
      }
      if (!a.role || !ROLES.has(a.role)) {
        console.log(`  ✗ ${f}: role không hợp lệ="${a.role}" cho word="${a.word}" trong "${ex.en}"`);
        errors++; filesWithErr.add(f);
      }
    }
  }
}

console.log(`\n[check] ${okEx} ví dụ · ${okTok} token kiểm tra. Lỗi: ${errors}.`);
if (errors > 0) {
  console.log(`File còn lỗi: ${[...filesWithErr].join(', ')}`);
  process.exit(1);
}
console.log('✓ Tất cả annotations hợp lệ.');
