/**
 * [ResetLow] Reset các từ có image_confidence < 70 về image_url=null.
 * Mục đích: backfill round mới sẽ tìm ảnh thay thế.
 * Chạy: cd web-app && npx tsx scripts/reset-low-confidence.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  // Đếm trước
  const { count } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true })
    .not('image_confidence', 'is', null)
    .lt('image_confidence', 70)
    .not('image_url', 'is', null);

  console.log(`[Reset] sẽ reset ${count} từ có confidence < 70`);

  // Reset từng chunk 1000
  let totalReset = 0;
  while (true) {
    const { data: rows, error } = await supabase
      .from('global_dictionary')
      .select('word')
      .not('image_confidence', 'is', null)
      .lt('image_confidence', 70)
      .not('image_url', 'is', null)
      .limit(1000);

    if (error) {
      console.error(error);
      break;
    }
    if (!rows || rows.length === 0) break;

    const words = rows.map((r) => r.word);
    const { error: upErr } = await supabase
      .from('global_dictionary')
      .update({
        image_url: null,
        image_source: 'none',
        image_confidence: null,
      })
      .in('word', words);

    if (upErr) {
      console.error(upErr);
      break;
    }

    totalReset += words.length;
    console.log(`[Reset] chunk ${words.length} OK, cumulative ${totalReset}`);

    if (rows.length < 1000) break;
  }

  console.log(`\n[Reset] DONE: reset tổng ${totalReset} từ`);
}

main();
