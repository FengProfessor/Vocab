/**
 * Bước 1 của pipeline tô màu ví dụ (annotation).
 * Tokenize DETERMINISTIC mọi câu trong `sections.examples[].en`:
 *   - tách theo whitespace, cắt dấu câu ở 2 đầu, GIỮ apostrophe/hyphen bên trong (don't, well-known)
 *   - tính start/end char-offset CHÍNH XÁC trên câu gốc
 *   - ghi `annotations: [{ word, start, end, role: "" }]` (role rỗng để Codex điền POS)
 *
 * Offset do script tính → Codex KHÔNG bao giờ phải tự tính (chỗ dễ sai nhất).
 * Idempotent: bỏ qua example đã có annotations với mọi role != "" (trừ --force).
 *
 * Chạy (trong web-app/):
 *   node scripts/grammar-gen/annotate-tokenize.mjs            # tokenize hết
 *   node scripts/grammar-gen/annotate-tokenize.mjs --force    # ghi đè cả role đã điền
 *   node scripts/grammar-gen/annotate-tokenize.mjs --only present-simple,past-simple
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx >= 0 ? new Set((args[onlyIdx + 1] || '').split(',').map((s) => s.trim()).filter(Boolean)) : null;

// Dấu câu cắt ở 2 đầu token. GIỮ ' và - (contraction, từ ghép). Giữ ° và chữ-số cho "100°C".
const EDGE = /["“”‘’()\[\]{}.,!?;:…—–]/;

/** Trả mảng token {word,start,end,role:""} với offset chuẩn trên câu gốc. */
function tokenize(sentence) {
  const out = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(sentence))) {
    let s = m.index;
    let e = s + m[0].length;
    while (s < e && EDGE.test(sentence[s])) s++;
    while (e > s && EDGE.test(sentence[e - 1])) e--;
    if (e > s) out.push({ word: sentence.slice(s, e), start: s, end: e, role: '' });
  }
  return out;
}

const files = readdirSync(OUT)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !ONLY || ONLY.has(f.replace(/\.json$/, '')))
  .sort();

let touched = 0;
let totalEx = 0;
let totalTok = 0;

for (const f of files) {
  const p = path.join(OUT, f);
  const json = JSON.parse(readFileSync(p, 'utf8'));
  const examples = json.sections?.examples;
  if (!Array.isArray(examples)) continue;

  let changed = false;
  for (const ex of examples) {
    if (typeof ex.en !== 'string' || !ex.en.trim()) continue;
    const hasFull = Array.isArray(ex.annotations) && ex.annotations.length > 0 && ex.annotations.every((a) => a.role);
    if (hasFull && !FORCE) {
      totalEx++;
      totalTok += ex.annotations.length;
      continue;
    }
    ex.annotations = tokenize(ex.en);
    changed = true;
    totalEx++;
    totalTok += ex.annotations.length;
  }

  if (changed) {
    writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
    touched++;
    console.log(`  ✓ ${f}`);
  }
}

console.log(`\n[tokenize] ${touched}/${files.length} file ghi mới · ${totalEx} ví dụ · ${totalTok} token cần gán role.`);
