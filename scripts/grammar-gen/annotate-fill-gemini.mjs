/**
 * Bước 2: gán POS `role` cho token skeleton (annotate-tokenize.mjs) bằng Gemini.
 * GIỮ NGUYÊN word/start/end của helper — Gemini chỉ trả role theo đúng thứ tự token.
 * Cùng tiêu chí POS với /api/grammar/annotate (prod) → chất lượng đồng nhất app.
 *
 * GỘP nhiều ví dụ (xuyên file) trong 1 call để né rate-limit free tier (20 req/phút, 1 key).
 * 429 → retry backoff. Idempotent: bỏ qua ví dụ đã đủ role (trừ --force).
 *
 * Chạy (trong web-app/):
 *   node scripts/grammar-gen/annotate-fill-gemini.mjs
 *   node scripts/grammar-gen/annotate-fill-gemini.mjs --force
 *   node scripts/grammar-gen/annotate-fill-gemini.mjs --batch 50   # ví dụ/call
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const batchIdx = args.indexOf('--batch');
const BATCH = batchIdx >= 0 ? Number(args[batchIdx + 1]) || 50 : 50;

const ROLES = new Set([
  'noun', 'pronoun', 'verb', 'auxiliary', 'modal', 'adjective', 'adverb',
  'preposition', 'conjunction', 'determiner', 'article', 'interjection', 'other',
]);

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

let KEYS = [];
function pickKey(i) { return KEYS[i % KEYS.length]; }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROMPT_HEAD = `You are an English linguist. For each item you are given its EXACT tokens (already split, in order). Return the PART OF SPEECH of each token — NOT its syntactic function.

Allowed roles (use ONLY these): noun, pronoun, verb, auxiliary, modal, adjective, adverb, preposition, conjunction, determiner, article, interjection, other.
Guidance:
- main verbs run/eat/teaches => verb; be/have/do as helpers (is, are, has, did, don't, doesn't) => auxiliary; can/will/must/should/could => modal.
- a/an/the => article; this/that/my/some/many => determiner; he/she/they/who/which => pronoun.
- in/on/at/to/by/with => preposition; and/but/or/because => conjunction; quickly/very/often/not => adverb.
- phrasal-verb particle (look UP) => adverb. Possessive "father's" => noun. Numbers/symbols (100°C, 7) => other.
Return ONLY valid JSON: {"roles":{"<id>":["role1","role2",...]}}. Each roles array MUST have exactly one role per token, same order, for EVERY id given. No prose.

Items:
`;

async function callGemini(items, attempt = 0) {
  const key = pickKey(attempt);
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite', generationConfig: { responseMimeType: 'application/json' } });
  const input = JSON.stringify(items.map((it) => ({ id: it.id, sentence: it.sentence, tokens: it.tokens })));
  try {
    const res = await model.generateContent(
      { contents: [{ role: 'user', parts: [{ text: PROMPT_HEAD + input }] }] },
      { signal: AbortSignal.timeout(45000) },
    );
    const raw = res.response.text();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { const m = raw.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; }
    return parsed?.roles || {};
  } catch (e) {
    const msg = String(e?.message || e);
    if (/429|quota|rate/i.test(msg) && attempt < 6) {
      const wait = 5000 * (attempt + 1);
      console.log(`    ⏳ 429 — chờ ${wait / 1000}s rồi retry (lần ${attempt + 1})`);
      await sleep(wait);
      return callGemini(items, attempt + 1);
    }
    throw e;
  }
}

async function main() {
  loadEnv();
  let raw = process.env.GEMINI_API_KEY || '';
  KEYS = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (KEYS.length === 0) throw new Error('Thiếu GEMINI_API_KEY trong .env.local');
  console.log(`[fill] ${KEYS.length} key · batch ${BATCH} ví dụ/call`);

  const files = readdirSync(OUT).filter((f) => f.endsWith('.json')).sort();

  // Gom mọi ví dụ pending xuyên file
  const fileJson = {};
  const pending = [];
  for (const f of files) {
    const json = JSON.parse(readFileSync(path.join(OUT, f), 'utf8'));
    fileJson[f] = json;
    const examples = json.sections?.examples;
    if (!Array.isArray(examples)) continue;
    examples.forEach((ex, i) => {
      if (typeof ex.en !== 'string' || !ex.en.trim()) return;
      if (!Array.isArray(ex.annotations) || ex.annotations.length === 0) return;
      if (ex.annotations.every((a) => a.role) && !FORCE) return;
      pending.push({ id: `${f}#${i}`, file: f, sentence: ex.en, tokens: ex.annotations.map((a) => a.word), ref: ex });
    });
  }
  console.log(`[fill] ${pending.length} ví dụ cần gán role.`);
  if (pending.length === 0) return;

  const dirty = new Set();
  let totFilled = 0, totMism = 0;
  for (let start = 0; start < pending.length; start += BATCH) {
    const group = pending.slice(start, start + BATCH);
    const gi = Math.floor(start / BATCH) + 1;
    const gTotal = Math.ceil(pending.length / BATCH);
    process.stdout.write(`  [call ${gi}/${gTotal}] ${group.length} ví dụ... `);
    let roleMap;
    try { roleMap = await callGemini(group); }
    catch (e) { console.log(`✗ ${String(e.message).slice(0, 120)}`); continue; }

    let filled = 0, mism = 0;
    for (const p of group) {
      const arr = roleMap[p.id];
      p.ref.annotations.forEach((a, idx) => {
        let role = Array.isArray(arr) ? arr[idx] : null;
        if (!role || !ROLES.has(role)) { role = 'other'; mism++; }
        a.role = role; filled++;
      });
      dirty.add(p.file);
    }
    totFilled += filled; totMism += mism;
    console.log(`✓ ${filled} role${mism ? ` (⚠${mism} fallback)` : ''}`);
    await sleep(3500); // < 20 req/phút
  }

  for (const f of dirty) writeFileSync(path.join(OUT, f), JSON.stringify(fileJson[f], null, 2) + '\n', 'utf8');
  console.log(`\n[fill] ${dirty.size} file ghi · ${totFilled} role · ${totMism} fallback 'other'. Chạy annotate-check.mjs.`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
