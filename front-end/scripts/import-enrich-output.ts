/**
 * BƯỚC 3/3 — Nạp kết quả Gemini (các file *.out.json) về global_dictionary.
 *
 * KHÔNG gọi AI. Map theo "word" (global_dictionary.word là UNIQUE).
 * GHI duy nhất cột `data` (nghĩa/IPA/synonym/image_search_query). Ảnh (image_*) GIỮ NGUYÊN
 * → backfill ảnh bằng script ảnh có sẵn sau.
 *
 * Lớp chắn: (1) quality-gate validateNew — output kém thì GIỮ data cũ; (2) backup data cũ trước khi ghi.
 *
 * Chạy (trong web-app):
 *   npx tsx scripts/import-enrich-output.ts                 # XEM TRƯỚC, KHÔNG ghi DB
 *   npx tsx scripts/import-enrich-output.ts --commit        # GHI DB (tự backup)
 *   npx tsx scripts/import-enrich-output.ts --file=../../tmp/enrich-batches/new-001.out.json --commit
 */
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// --- Load .env.local ---
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('❌ Thiếu Supabase env trong .env.local'); process.exit(1); }
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const getArg = (n: string) => { const p = process.argv.find(a => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : undefined; };
const hasFlag = (n: string) => process.argv.includes(`--${n}`);
const COMMIT = hasFlag('commit');
const ONE_FILE = getArg('file');
const BATCH_DIR = path.resolve(__dirname, '../../tmp/enrich-batches');

const VIET_RE = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

interface Parsed { word?: string; english?: string; vietnamese?: string; ipa?: string; pos?: string; example?: string; synonyms?: string[]; antonyms?: string[]; image_search_query?: string | string[]; }

/** Cổng chất lượng (đồng bộ reenrich-phrases.ts): trả lý do nếu KHÔNG đủ tốt để ghi (null = OK) */
function validateNew(p: Parsed): string | null {
  if (!p || typeof p !== 'object') return 'parse rỗng';
  const def = (p.vietnamese || '').trim();
  if (!def) return 'nghĩa rỗng';
  if (/click|enrich|⏳/i.test(def)) return 'nghĩa là marker';
  if (!VIET_RE.test(def)) return 'nghĩa không có ký tự tiếng Việt';
  const ipa = (p.ipa || '').trim();
  if (/n\/a|cannot|provide|\bAI\b|unknown|error|sorry/i.test(ipa)) return 'IPA rác';
  if (!(p.example || '').trim()) return 'thiếu ví dụ';
  return null;
}

/** Đọc 1 file output, trả mảng item. Chịu được ```json, text rác, NHIỀU array, cụt cuối file. */
function parseOutFile(fp: string): Parsed[] {
  let raw = fs.readFileSync(fp, 'utf8').trim();
  raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 1. Thử parse nguyên file (đường sạch)
  try {
    const val = JSON.parse(raw);
    if (Array.isArray(val)) return val as Parsed[];
    if (val && typeof val === 'object') {
      const arr = Object.values(val as Record<string, unknown>).find(Array.isArray);
      if (arr) return arr as Parsed[];
    }
  } catch { /* rơi xuống bóc từng object */ }

  // 2. Bóc TỪNG object phẳng {..}. Schema item không có object lồng (synonyms là array)
  //    nên {[^{}]*} khớp gọn mỗi item — qua được file 2 array / có rác / cụt giữa chừng.
  const objs = raw.match(/\{[^{}]*\}/g) || [];
  const out: Parsed[] = [];
  for (const o of objs) {
    try { const p = JSON.parse(o) as Parsed; if (p && p.word) out.push(p); } catch { /* bỏ object hỏng */ }
  }
  if (out.length === 0) console.warn(`   ⚠️ ${path.basename(fp)}: không bóc được item nào — bỏ qua.`);
  else console.log(`   ↻ ${path.basename(fp)}: bóc cứu ${out.length} item (file không phải 1 array chuẩn).`);
  return out;
}

async function main() {
  // 1. Gom output items
  const files = ONE_FILE
    ? [path.resolve(__dirname, ONE_FILE)]
    : (fs.existsSync(BATCH_DIR) ? fs.readdirSync(BATCH_DIR).filter(f => f.endsWith('.out.json')).map(f => path.join(BATCH_DIR, f)) : []);

  if (files.length === 0) { console.error(`❌ Không có file *.out.json trong ${BATCH_DIR}. Chạy export + feed Gemini trước.`); process.exit(1); }
  console.log(`📥 Đọc ${files.length} file output...`);

  const byWord = new Map<string, Parsed>();
  let dupes = 0;
  for (const fp of files) {
    for (const it of parseOutFile(fp)) {
      const w = (it.word || '').trim().toLowerCase();
      if (!w) continue;
      if (byWord.has(w)) dupes++;
      byWord.set(w, it); // cái sau ghi đè
    }
  }
  console.log(`   → ${byWord.size} từ duy nhất${dupes ? ` (${dupes} trùng đã gộp)` : ''}.`);
  if (byWord.size === 0) return;

  // 2. Query DB lấy id + data cũ theo word (lô .in)
  const words = [...byWord.keys()];
  const dbByWord = new Map<string, { id: string; word: string; data: any }>();
  for (let i = 0; i < words.length; i += 200) {
    const lot = words.slice(i, i + 200); // lô nhỏ: nhiều cụm có dấu cách → URL .in dài dễ fetch-fail
    let data: { id: string; word: string; data: any }[] | null = null;
    let lastErr = '';
    for (let attempt = 0; attempt < 4 && data === null; attempt++) {
      const res = await supabase.from('global_dictionary').select('id, word, data').in('word', lot);
      if (!res.error) { data = (res.data || []) as typeof data; break; }
      lastErr = res.error.message;
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
    if (data === null) { console.error(`❌ Query lỗi sau 4 lần (lô ${i}-${i + lot.length}):`, lastErr); process.exit(1); }
    for (const r of data) dbByWord.set(r.word.trim().toLowerCase(), r);
  }

  console.log(COMMIT ? '⚠️  CHẾ ĐỘ COMMIT — sẽ GHI ĐÈ cột data.\n' : '👁️  XEM TRƯỚC — KHÔNG ghi DB. Thêm --commit để ghi thật.\n');

  // 3. Backup TRƯỚC khi ghi
  const toWrite: Array<{ id: string; word: string; oldData: any; enriched: any }> = [];
  let skipped = 0, notFound = 0;

  for (const [w, p] of byWord) {
    const row = dbByWord.get(w);
    if (!row) { notFound++; continue; }

    const reason = validateNew(p);
    const oldDef = (row.data?.results?.[0]?.meanings?.[0]?.definition || '').trim();
    const oldIpa = (row.data?.pronunciations?.[0]?.ipa || '').trim();

    console.log(`• "${p.word}" (${p.pos || '?'})${reason ? `  ⚠️ BỎ QUA (${reason}) — giữ data cũ` : ''}`);
    console.log(`   IPA  : ${oldIpa || '∅'} → ${p.ipa || '∅'}`);
    console.log(`   Nghĩa: ${oldDef || '∅'} → ${p.vietnamese || '∅'}`);

    if (reason) { skipped++; continue; }

    const bareIpa = (p.ipa || '').trim().replace(/^\/+|\/+$/g, '').trim();
    const cleanIpa = bareIpa ? `/${bareIpa}/` : '';
    const enriched = {
      word: row.word, // dùng từ gốc trong DB — p.english không đáng tin (model hay trả định nghĩa)
      pronunciations: cleanIpa ? [{ ipa: cleanIpa }] : [],
      results: [{ meanings: [{ pos: p.pos || '', definition: (p.vietnamese || '').trim(), example: p.example || '', collocations: [] }] }],
      synonyms: Array.isArray(p.synonyms) ? p.synonyms : [],
      antonyms: Array.isArray(p.antonyms) ? p.antonyms : [],
      image_search_query: Array.isArray(p.image_search_query) ? (p.image_search_query[0] || '') : (p.image_search_query || ''), // model đôi khi trả array → lấy query đầu
    };
    toWrite.push({ id: row.id, word: row.word, oldData: row.data, enriched });
  }

  console.log(`\n📊 Sẽ ghi ${toWrite.length} · bỏ qua ${skipped} (kém) · không thấy trong DB ${notFound}.`);

  if (!COMMIT) { console.log('→ Ưng thì chạy lại với --commit'); return; }
  if (toWrite.length === 0) { console.log('Không có gì để ghi.'); return; }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BATCH_DIR, `_backup-${ts}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(toWrite.map(t => ({ id: t.id, word: t.word, data: t.oldData })), null, 2), 'utf8');
  console.log(`💾 Backup ${toWrite.length} bản ghi cũ → ${backupPath}`);

  let ok = 0, fail = 0;
  for (const t of toWrite) {
    const { error } = await supabase.from('global_dictionary').update({ data: t.enriched }).eq('id', t.id);
    if (error) { fail++; console.error(`   ✗ "${t.word}": ${error.message}`); }
    else ok++;
  }
  console.log(`\n🏁 Ghi xong: ${ok} OK, ${fail} lỗi. Backup tại ${backupPath}.`);
  console.log(`→ Chạy audit kiểm tra: npx tsx scripts/audit-vocab-quality.ts`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
