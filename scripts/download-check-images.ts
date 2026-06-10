/**
 * [DLCheck] Tải 20 ảnh đã backfill về local để Claude tự đánh giá visual.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WORDS = [
  'a', 'abandon', 'about', 'above', 'abroad', 'absolutely', 'academic',
  'accept', 'accident', 'according to', 'account', 'accurate', 'acquire',
  'activity', 'actress', 'actual', 'actually', 'adapt', 'additional', 'administration',
];

const OUT_DIR = path.resolve(process.cwd(), 'tmp-check-imgs');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const s = createClient(url, key);

  const { data } = await s
    .from('global_dictionary')
    .select('word, image_url, image_source, data')
    .in('word', WORDS);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest: Array<{ idx: number; word: string; file: string; source: string; pos: string; def: string }> = [];

  let idx = 0;
  for (const w of WORDS) {
    const row = data!.find((r) => r.word === w);
    if (!row || !row.image_url) {
      console.log(`SKIP ${w} (no row/url)`);
      continue;
    }
    idx++;
    const safe = w.replace(/[^a-z0-9]+/gi, '_');
    const file = `${String(idx).padStart(2, '0')}_${safe}.jpg`;
    const out = path.join(OUT_DIR, file);

    try {
      const res = await fetch(row.image_url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      const m0 = (row.data?.results?.[0]?.meanings?.[0] || {}) as { pos?: string; definition?: string };
      manifest.push({
        idx,
        word: w,
        file,
        source: row.image_source || '?',
        pos: m0.pos || '?',
        def: m0.definition || '',
      });
      console.log(`OK ${idx} ${w} → ${file} (${buf.byteLength}B)`);
    } catch (e) {
      console.error(`FAIL ${w}: ${(e as Error).message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDONE: ${manifest.length} ảnh → ${OUT_DIR}`);
}

main();
