/**
 * Khôi phục nghĩa tiếng Việt bị hỏng encoding (mojibake) trong global_dictionary.data.
 * Nguyên nhân: UTF-8 bị decode nhầm CP437/CP850 (DOS) lúc import → ký tự box-drawing (├ ╗ ║ ─).
 * Đảo ngược DETERMINISTIC: encode lại CP437 → decode UTF-8 = nghĩa GỐC. KHÔNG cần AI.
 *
 * An toàn: deep-walk data, CHỈ sửa string khớp mojibake + chỉ giữ kết quả hợp lệ (có ký tự VN, không �).
 * Mặc định dry-run; backup trước khi --apply.
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/fix-mojibake.ts [--apply]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { createClient } from '@supabase/supabase-js';

const DRY = !process.argv.includes('--apply');
const MOJIBAKE = /[─-╿]|ß[╗║╔╝┤┐]|├[│¼┤]/;
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const REPLACEMENT = /�/;
interface DictionaryData { results?: { meanings?: { definition?: string }[] }[] }

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; }
  }
}

/** Đảo mojibake 1 string; trả null nếu không khôi phục sạch. */
function unmojibake(s: string): string | null {
  if (!MOJIBAKE.test(s)) return null;
  for (const cp of ['cp437', 'cp850']) {
    try {
      const fixed = iconv.encode(s, cp).toString('utf8');
      if (!REPLACEMENT.test(fixed) && !MOJIBAKE.test(fixed) && VN_CHARS.test(fixed)) return fixed;
    } catch { /* thử cp kế */ }
  }
  return null;
}

/** Deep-walk: sửa mọi string mojibake. Trả {changed, value}. */
function deepFix(v: unknown): { changed: boolean; value: unknown } {
  if (typeof v === 'string') { const f = unmojibake(v); return f !== null ? { changed: true, value: f } : { changed: false, value: v }; }
  if (Array.isArray(v)) { let ch = false; const a = v.map((x) => { const r = deepFix(x); ch = ch || r.changed; return r.value; }); return { changed: ch, value: a }; }
  if (v && typeof v === 'object') { let ch = false; const o: Record<string, unknown> = {}; for (const [k, val] of Object.entries(v)) { const r = deepFix(val); ch = ch || r.changed; o[k] = r.value; } return { changed: ch, value: o }; }
  return { changed: false, value: v };
}

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const bad = JSON.parse(readFileSync(path.join(process.cwd(), 'tmp/quality-bad.json'), 'utf8')) as { word: string; reason: string }[];
  const words = bad.filter((b) => b.reason === 'mojibake').map((b) => b.word);
  console.log(`[fix-mojibake] ${words.length} từ mojibake. ${DRY ? 'DRY-RUN' : 'APPLY'}.`);

  const backup: { word: string; data: unknown }[] = [];
  let fixed = 0, unrecoverable = 0;
  const samples: string[] = [];
  const CH = 300;
  for (let i = 0; i < words.length; i += CH) {
    const slice = words.slice(i, i + CH);
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const r = deepFix(row.data);
      if (!r.changed) { unrecoverable++; continue; }
      const before = (row.data as DictionaryData | null)?.results?.[0]?.meanings?.[0]?.definition;
      const after = (r.value as DictionaryData | null)?.results?.[0]?.meanings?.[0]?.definition;
      if (samples.length < 8) samples.push(`${row.word}: "${before}" → "${after}"`);
      backup.push({ word: row.word, data: row.data });
      fixed++;
      if (!DRY) { const { error: uErr } = await sb.from('global_dictionary').update({ data: r.value }).eq('word', row.word); if (uErr) console.log(`  ✗ ${row.word}: ${uErr.message}`); }
    }
  }

  if (!DRY) {
    const dir = path.join(process.cwd(), 'tmp'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `mojibake-backup-${Date.now()}.json`), JSON.stringify(backup, null, 2), 'utf8');
  }
  console.log(`\n[fix-mojibake] khôi phục=${fixed} · không sạch (để Gemini)=${unrecoverable}`);
  console.log('mẫu:\n  ' + samples.join('\n  '));
}
main().catch((e) => { console.error(e); process.exit(1); });
