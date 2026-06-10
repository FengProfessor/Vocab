/**
 * [Reset+Backfill] Reset DB cho từ DEAD (recheck result), rồi gọi backfill quét lại.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const s = createClient(url, key);

  const resultFile = path.resolve(process.cwd(), 'tmp-recheck-dead-result.json');
  if (!fs.existsSync(resultFile)) {
    console.error('Không tìm thấy tmp-recheck-dead-result.json. Chạy recheck-dead-links.ts trước.');
    process.exit(1);
  }
  const r = JSON.parse(fs.readFileSync(resultFile, 'utf-8'));
  const deadWords: string[] = r.dead || [];
  console.log(`Reset ${deadWords.length} từ DEAD về source=none...`);

  // Batch update theo chunks 100
  let updated = 0;
  for (let i = 0; i < deadWords.length; i += 100) {
    const chunk = deadWords.slice(i, i + 100);
    const { error, count } = await s
      .from('global_dictionary')
      .update({ image_url: null, image_source: 'none', image_confidence: null }, { count: 'exact' })
      .in('word', chunk);
    if (error) {
      console.error(`Lỗi chunk ${i}:`, error.message);
    } else {
      updated += count || 0;
      console.log(`  chunk ${i / 100 + 1}: ${count} từ reset`);
    }
  }
  console.log(`\nTổng reset: ${updated}/${deadWords.length}`);
  console.log(`\nChạy tiếp: npx tsx scripts/backfill-images-gemini.ts --throttle 2500`);
}

main().catch(console.error);
