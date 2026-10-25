/**
 * Sửa mojibake encoding TOÀN BỘ global_dictionary (deterministic, KHÔNG AI).
 * Nguyên nhân: UTF-8 bị decode nhầm CP437/CP850 lúc import → box-drawing (╦ê ╞░ ß╗ ├).
 * Đảo ngược: iconv.encode(s, 'cp437'|'cp850').toString('utf8') = chuỗi GỐC.
 *
 * Sửa MỌI string box-drawing trong data (cả definition LẪN ipa) — deep-walk.
 * Khác fix-mojibake.ts cũ: KHÔNG đòi ký tự tiếng Việt (IPA không có) → chấp nhận khi
 * kết quả hết box-drawing + không có � + không "dài bằng/ngắn hơn" rác.
 *
 * Mặc định DRY-RUN. Backup trước khi --apply.
 * Chạy (web-app/): npx tsx scripts/fix-encoding-all.ts [--apply]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { createClient } from '@supabase/supabase-js';

const DRY = !process.argv.includes('--apply');
const BOX = /[─-▟]/;            // U+2500–U+25DF box-drawing/blocks = chữ ký mis-decode
const REPLACEMENT = /�/;

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; }
  }
}

/** Đảo mojibake 1 string; null nếu không khôi phục sạch. */
function unmojibake(s: string): string | null {
  if (!BOX.test(s)) return null;
  for (const cp of ['cp437', 'cp850']) {
    try {
      const fixed = iconv.encode(s, cp).toString('utf8');
      // chấp nhận khi: hết box-drawing + không có replacement char + không rỗng
      if (fixed && !REPLACEMENT.test(fixed) && !BOX.test(fixed)) return fixed;
    } catch { /* thử cp kế */ }
  }
  return null;
}

function deepFix(v: unknown): { changed: boolean; value: unknown } {
  if (typeof v === 'string') { const f = unmojibake(v); return f !== null ? { changed: true, value: f } : { changed: false, value: v }; }
  if (Array.isArray(v)) { let ch = false; const a = v.map((x) => { const r = deepFix(x); ch = ch || r.changed; return r.value; }); return { changed: ch, value: a }; }
  if (v && typeof v === 'object') { let ch = false; const o: Record<string, unknown> = {}; for (const [k, val] of Object.entries(v)) { const r = deepFix(val); ch = ch || r.changed; o[k] = r.value; } return { changed: ch, value: o }; }
  return { changed: false, value: v };
}

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  console.log(`[fix-encoding-all] ${DRY ? 'DRY-RUN' : 'APPLY'} — quét toàn global_dictionary`);

  let from = 0; const size = 1000;
  const backup: { word: string; data: unknown }[] = [];
  let scanned = 0, fixed = 0, unrecoverable = 0;
  const samples: string[] = [];

  while (true) {
    const { data, error } = await sb.from('global_dictionary').select('id, word, data').range(from, from + size - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      scanned++;
      const raw = JSON.stringify(row.data ?? {});
      if (!BOX.test(raw)) continue;                  // không có box-drawing → bỏ qua
      const r = deepFix(row.data);
      if (!r.changed) { unrecoverable++; if (samples.length < 12) samples.push(`✗ KHÔNG SẠCH: ${row.word}`); continue; }
      if (samples.length < 12) {
        const a = (row.data as any)?.results?.[0]?.meanings?.[0]?.definition;
        const b = (r.value as any)?.results?.[0]?.meanings?.[0]?.definition;
        const ai = (row.data as any)?.pronunciations?.[0]?.ipa;
        const bi = (r.value as any)?.pronunciations?.[0]?.ipa;
        samples.push(`${row.word}: def "${a}"→"${b}" | ipa "${ai}"→"${bi}"`);
      }
      backup.push({ word: row.word, data: row.data });
      fixed++;
      if (!DRY) { const { error: uErr } = await sb.from('global_dictionary').update({ data: r.value }).eq('id', row.id); if (uErr) console.log(`  ✗ ${row.word}: ${uErr.message}`); }
    }
    if (data.length < size) break;
    from += size;
  }

  if (!DRY && backup.length) {
    const dir = path.join(process.cwd(), 'tmp'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const bp = path.join(dir, `encoding-backup-${Date.now()}.json`);
    writeFileSync(bp, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`💾 backup ${backup.length} rows → ${bp}`);
  }
  console.log(`\n[fix-encoding-all] scanned=${scanned} · khôi phục=${fixed} · không sạch=${unrecoverable}`);
  console.log('mẫu:\n  ' + samples.join('\n  '));
  if (DRY) console.log('\n→ chạy lại với --apply để ghi DB.');
}
main().catch((e) => { console.error(e); process.exit(1); });
