import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Backfill audio (youdao TTS) cho mọi entry thiếu — URL deterministic từ word,
 * KHÔNG cần AI/quota/scrape.
 *   audio_uk = https://dict.youdao.com/dictvoice?audio=WORD&type=1
 *   audio_us = ...&type=2
 *
 * Chỉ THÊM khi thiếu, KHÔNG đè audio sẵn có. Chạy:
 *   cd web-app && npx tsx scripts/backfill-audio.ts [--dry]
 */

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DRY = process.argv.includes('--dry');

const audioUrl = (word: string, type: 1 | 2) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;

async function main() {
  console.log('🔍 Fetching all entries...');
  const rows: { id: string; word: string; data: any }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, data')
      .range(from, from + pageSize - 1);
    if (error) { console.error('❌ fetch:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    rows.push(...(data as typeof rows));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`   → ${rows.length} entries.`);

  let updated = 0;
  let batch: { id: string; data: any }[] = [];

  const flush = async () => {
    if (batch.length === 0 || DRY) { batch = []; return; }
    // update từng dòng (Supabase update không hỗ trợ bulk khác data) — gom Promise
    await Promise.all(
      batch.map((b) => supabase.from('global_dictionary').update({ data: b.data }).eq('id', b.id))
    );
    batch = [];
  };

  for (const r of rows) {
    const d = r.data || {};
    const prons = Array.isArray(d.pronunciations) ? d.pronunciations : [];
    const uk = audioUrl(r.word, 1);
    const us = audioUrl(r.word, 2);

    let changed = false;
    if (prons.length === 0) {
      d.pronunciations = [{ ipa: '', audio_uk: uk, audio_us: us }];
      changed = true;
    } else {
      const p0 = prons[0];
      if (!p0.audio_uk) { p0.audio_uk = uk; changed = true; }
      if (!p0.audio_us) { p0.audio_us = us; changed = true; }
    }

    if (changed) {
      updated++;
      batch.push({ id: r.id, data: d });
      if (batch.length >= 50) await flush();
    }
  }
  await flush();

  console.log(`\n🏁 ${DRY ? '[DRY] sẽ cập nhật' : 'Đã cập nhật'} ${updated} entries thiếu audio.`);
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
