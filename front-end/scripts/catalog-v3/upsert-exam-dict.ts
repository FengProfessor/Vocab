/**
 * Đưa nghĩa/ví dụ từ exam-vocab.json vào global_dictionary để import phục vụ được.
 * - Từ CHƯA có trong dict → insert {word, data:{results:[{meanings:[{definition, example}]}]}}.
 * - Từ ĐÃ có nghĩa hợp lệ → GIỮ nguyên (không clobber). Từ đã có nhưng nghĩa rỗng → cập nhật.
 * Mặc định dry-run; --apply ghi prod (backup từ bị sửa).
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/upsert-exam-dict.ts [--apply]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DRY = !process.argv.includes('--apply');
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; } }
}

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const exam = JSON.parse(readFileSync(path.join(process.cwd(), 'src/data/vocab/exam-vocab.json'), 'utf8')) as Record<string, Record<string, { word: string; vi: string; example: string }[]>>;

  const flat = new Map<string, { vi: string; example: string }>();
  for (const examKey of Object.keys(exam)) for (const topic of Object.keys(exam[examKey])) for (const it of exam[examKey][topic]) if (!flat.has(it.word)) flat.set(it.word, { vi: it.vi, example: it.example });
  const words = [...flat.keys()];
  console.log(`[upsert-exam] ${words.length} từ. ${DRY ? 'DRY-RUN' : 'APPLY'}.`);

  // Lấy hiện trạng
  const existing = new Map<string, any>();
  const CH = 400;
  for (let i = 0; i < words.length; i += CH) {
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', words.slice(i, i + CH));
    if (error) throw new Error(error.message);
    for (const r of data ?? []) existing.set(r.word.toLowerCase(), r);
  }

  const inserts: any[] = [];
  const updates: { word: string; data: any }[] = [];
  const backup: any[] = [];
  let keep = 0;
  for (const w of words) {
    const { vi, example } = flat.get(w)!;
    const row = existing.get(w);
    const mk = () => ({ word: w, results: [{ meanings: [{ pos: '', definition: vi, example: example || '' }] }] });
    if (!row) { inserts.push({ word: w, data: mk(), image_source: 'none' }); continue; }
    const def = row.data?.results?.[0]?.meanings?.[0]?.definition?.trim();
    if (def && !def.includes('⏳')) { keep++; continue; } // đã có nghĩa tốt → giữ
    const d = row.data ?? {}; d.results = d.results ?? [{}]; d.results[0] = d.results[0] ?? {}; d.results[0].meanings = [{ ...(d.results[0].meanings?.[0] ?? {}), definition: vi, example: example || d.results[0].meanings?.[0]?.example || '' }];
    backup.push({ word: w, data: row.data }); updates.push({ word: w, data: d });
  }

  console.log(`  insert mới=${inserts.length} · update(nghĩa rỗng)=${updates.length} · giữ nguyên=${keep}`);
  if (DRY) { console.log('  (dry-run, không ghi)'); return; }

  for (let i = 0; i < inserts.length; i += 200) {
    const { error } = await sb.from('global_dictionary').upsert(inserts.slice(i, i + 200), { onConflict: 'word', ignoreDuplicates: true });
    if (error) console.log('  ✗ insert batch: ' + error.message);
  }
  for (const u of updates) { const { error } = await sb.from('global_dictionary').update({ data: u.data }).eq('word', u.word); if (error) console.log(`  ✗ ${u.word}: ${error.message}`); }
  if (backup.length) { const dir = path.join(process.cwd(), 'tmp'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, `exam-dict-backup-${Date.now()}.json`), JSON.stringify(backup, null, 2), 'utf8'); }
  console.log(`[upsert-exam] xong: insert ${inserts.length}, update ${updates.length}.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
