/**
 * [DLCheckV2] Tải ảnh sau test v2 về local cho Claude đánh giá visual.
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

const OUT_DIR = path.resolve(process.cwd(), 'tmp-check-imgs-v2');
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'image/*',
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

  const manifest: Array<{ idx: number; word: string; file: string | null; source: string; pos: string; def: string }> = [];

  let idx = 0;
  for (const w of WORDS) {
    idx++;
    const row = data!.find((r) => r.word === w);
    const safe = w.replace(/[^a-z0-9]+/gi, '_');
    const m0 = (row?.data?.results?.[0]?.meanings?.[0] || {}) as { pos?: string; definition?: string };
    const base = {
      idx,
      word: w,
      source: row?.image_source || 'none',
      pos: m0.pos || '?',
      def: m0.definition || '',
    };

    if (!row || !row.image_url) {
      manifest.push({ ...base, file: null });
      console.log(`${String(idx).padStart(2, '0')} SKIP ${w} (${row?.image_source || '?'})`);
      continue;
    }

    const file = `${String(idx).padStart(2, '0')}_${safe}.jpg`;
    const out = path.join(OUT_DIR, file);
    try {
      const res = await fetch(row.image_url, { headers: HEADERS, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(out, buf);
      manifest.push({ ...base, file });
      console.log(`${String(idx).padStart(2, '0')} OK   ${w} → ${file} (${buf.byteLength}B)`);
    } catch (e) {
      manifest.push({ ...base, file: null });
      console.error(`${String(idx).padStart(2, '0')} FAIL ${w}: ${(e as Error).message}`);
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDONE → ${OUT_DIR}`);
}

main();
