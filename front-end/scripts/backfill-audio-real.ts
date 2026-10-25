import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Backfill audio GIỌNG THẬT cho global_dictionary — thay thế/bổ sung Youdao TTS máy.
 *
 * Tier:
 *   1. Free Dictionary API (api.dictionaryapi.dev) — mp3 người thật từ Wikimedia Commons (CC BY-SA).
 *   2. Google gstatic Oxford mp3 (kiểm tra HEAD 200) — bản ghi thật, hotlink không chính thức.
 *   3. Giữ nguyên audio Youdao hiện có làm fallback (KHÔNG xóa).
 *
 * Ghi vào data.audio_real = { url, source: 'wiktionary'|'gstatic', license? }.
 * CHỈ THÊM khi thiếu audio_real, KHÔNG đè. Idempotent.
 *
 * Chạy:
 *   cd web-app && npx tsx scripts/backfill-audio-real.ts --dry          # đo coverage, không ghi
 *   cd web-app && npx tsx scripts/backfill-audio-real.ts                # ghi thật
 *   cd web-app && npx tsx scripts/backfill-audio-real.ts --limit 200    # thử 200 entry đầu
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
const limitIdx = process.argv.indexOf('--limit');
const LIMIT = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;
const DELAY_MS = 350; // lịch sự với API free

type AudioReal = { url: string; source: 'wiktionary' | 'gstatic'; license?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tier 1: Free Dictionary API → mp3 Wikimedia Commons. */
async function fetchFreeDictAudio(word: string): Promise<AudioReal | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const entries = (await res.json()) as { phonetics?: { audio?: string; license?: { name?: string } }[] }[];
    for (const entry of entries) {
      for (const ph of entry.phonetics ?? []) {
        if (ph.audio) {
          // Ưu tiên giọng US, nhận bất kỳ nếu không có
          return { url: ph.audio, source: 'wiktionary', license: ph.license?.name ?? 'CC BY-SA 3.0' };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Tier 2: Google gstatic Oxford mp3 — HEAD check tồn tại. */
async function fetchGstaticAudio(word: string): Promise<AudioReal | null> {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return null;
  const url = `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${clean}--_us_1.mp3`;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return res.ok ? { url, source: 'gstatic' } : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`🔍 [AudioReal] Fetching entries... (dry=${DRY}, limit=${LIMIT === Infinity ? '∞' : LIMIT})`);
  const rows: { id: string; word: string; data: Record<string, unknown> }[] = [];
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

  const missing = rows.filter((r) => !(r.data as { audio_real?: unknown })?.audio_real);
  console.log(`   → ${rows.length} entries, ${missing.length} thiếu audio_real.`);

  let tier1 = 0;
  let tier2 = 0;
  let none = 0;
  let processed = 0;
  let batch: { id: string; data: Record<string, unknown> }[] = [];

  const flush = async () => {
    if (batch.length === 0 || DRY) { batch = []; return; }
    for (const item of batch) {
      const { error } = await supabase.from('global_dictionary').update({ data: item.data }).eq('id', item.id);
      if (error) console.error(`❌ update ${item.id}:`, error.message);
    }
    batch = [];
  };

  for (const row of missing) {
    if (processed >= LIMIT) break;
    processed++;

    // Chỉ từ đơn / cụm ngắn — API không có audio cho cụm dài
    const word = row.word.trim().toLowerCase();
    let audio: AudioReal | null = null;
    if (!word.includes(' ')) {
      audio = await fetchFreeDictAudio(word);
      if (audio) tier1++;
      else {
        audio = await fetchGstaticAudio(word);
        if (audio) tier2++;
      }
      await sleep(DELAY_MS);
    }
    if (!audio) { none++; continue; }

    batch.push({ id: row.id, data: { ...row.data, audio_real: audio } });
    if (batch.length >= 50) await flush();

    if (processed % 100 === 0) {
      console.log(`   ${processed}/${Math.min(missing.length, LIMIT)} — wiktionary=${tier1} gstatic=${tier2} none=${none}`);
    }
  }
  await flush();

  const covered = tier1 + tier2;
  const pct = processed > 0 ? Math.round((covered / processed) * 100) : 0;
  console.log(`✅ [AudioReal] done: ${processed} xử lý — giọng thật ${covered} (${pct}%) [wiktionary=${tier1}, gstatic=${tier2}], không có=${none}, dry=${DRY}`);
}

main();
