/**
 * [TestV2] Reset 20 từ test + chạy lại pipeline v2 (word-classifier + NSFW filter + sigma).
 * Chạy: cd web-app && npx tsx scripts/test-pipeline-v2.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WORDS = process.argv.includes('--problem-only')
  ? ['accept', 'account', 'actual', 'acquire']
  : [
      'a', 'abandon', 'about', 'above', 'abroad', 'absolutely', 'academic',
      'accept', 'accident', 'according to', 'account', 'accurate', 'acquire',
      'activity', 'actress', 'actual', 'actually', 'adapt', 'additional', 'administration',
    ];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  // Lazy import sau khi env sẵn sàng
  const { resolveWordImage } = await import('../src/lib/image-pipeline');
  type DictionaryData = import('../src/lib/supabase').DictionaryData;

  console.log(`[TestV2] reset ${WORDS.length} từ về source=none...`);
  await supabase
    .from('global_dictionary')
    .update({ image_url: null, image_source: 'none' })
    .in('word', WORDS);

  console.log(`[TestV2] đọc data...`);
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .in('word', WORDS);
  if (error) {
    console.error(error);
    process.exit(1);
  }

  const byWord = Object.fromEntries(data!.map((r) => [r.word, r]));
  const stats: Record<string, number> = {};
  const results: Array<{ word: string; source: string; url: string; pos: string; def: string }> = [];
  const t0 = Date.now();

  // Probe cột mới
  const { error: probeErr } = await supabase.from('global_dictionary').select('image_confidence').limit(1);
  const hasNewCols = !probeErr;

  for (let i = 0; i < WORDS.length; i++) {
    const word = WORDS[i];
    const row = byWord[word];
    if (!row) {
      console.log(`[TestV2] [${i + 1}/${WORDS.length}] không có "${word}" trong DB`);
      continue;
    }
    const wd = row.data as DictionaryData | null;
    const meanings = wd?.results?.[0]?.meanings || [];
    const definition = meanings[0]?.definition || '';
    const pos = meanings[0]?.pos || '';

    const t1 = Date.now();
    const { url: imgUrl, source, confidence, query } = await resolveWordImage({
      word,
      definition,
      pos,
      imageSearchQuery: wd?.image_search_query || '',
      meaningCount: meanings.length || 1,
    });

    const payload: Record<string, unknown> = {
      image_url: imgUrl || null,
      image_source: source,
    };
    if (hasNewCols) {
      payload.image_confidence = confidence;
      payload.image_query = query;
      payload.image_verified_at = new Date().toISOString();
    }
    await supabase.from('global_dictionary').update(payload).eq('word', word);

    stats[source] = (stats[source] || 0) + 1;
    results.push({ word, source, url: imgUrl, pos, def: definition });
    const dt = ((Date.now() - t1) / 1000).toFixed(1);
    const tag = source === 'skip-function' ? 'SKIP' : imgUrl ? 'OK  ' : 'MISS';
    console.log(`[TestV2] [${i + 1}/${WORDS.length}] ${tag} "${word}" ← ${source} (${dt}s)`);

    // Throttle nhẹ
    await new Promise((r) => setTimeout(r, 1500));
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n[TestV2] XONG (${totalSec}s) — phân bố nguồn:`);
  for (const [s, c] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(15)} ${c}`);
  }

  // Lưu manifest cho bước check visual
  const manifest = results.map((r, i) => ({ idx: i + 1, ...r }));
  const outDir = path.resolve(process.cwd(), 'tmp-check-imgs-v2');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[TestV2] manifest: ${path.join(outDir, 'manifest.json')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
