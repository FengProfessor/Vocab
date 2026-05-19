/**
 * Audit ảnh của global_dictionary.
 * Chạy: cd web-app && npx tsx scripts/audit-images.ts
 *
 * Báo cáo: phân bố theo nguồn ảnh, số từ thiếu ảnh, số từ điểm AI Vision thấp.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function audit() {
  if (!supabaseUrl || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { count: total } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true });

  console.log('\n=== AUDIT ẢNH global_dictionary ===');
  console.log(`Tổng số từ: ${total ?? 0}\n`);

  const pageSize = 1000;
  let from = 0;
  const bySource: Record<string, number> = {};
  let noImage = 0;
  let unverified = 0;
  let lowConf = 0;
  let goodConf = 0;
  const lowSamples: string[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, image_confidence')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Lỗi truy vấn:', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    for (const r of data) {
      const src = r.image_source || 'none';
      bySource[src] = (bySource[src] || 0) + 1;

      if (!r.image_url || src === 'none') {
        noImage++;
      } else if (r.image_confidence == null) {
        unverified++;
      } else if (r.image_confidence < 70) {
        lowConf++;
        if (lowSamples.length < 30) lowSamples.push(`${r.word} (${r.image_confidence})`);
      } else {
        goodConf++;
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log('-- Phân bố theo nguồn ảnh --');
  for (const [s, c] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(22)} ${c}`);
  }

  console.log('\n-- Chất lượng --');
  console.log(`  Không có ảnh:           ${noImage}`);
  console.log(`  Chưa chấm AI Vision:    ${unverified}`);
  console.log(`  Điểm Vision THẤP (<70): ${lowConf}`);
  console.log(`  Điểm Vision tốt (>=70): ${goodConf}`);

  if (lowSamples.length) {
    console.log('\n-- Mẫu từ điểm thấp (nên chạy verify-image lại) --');
    lowSamples.forEach((s) => console.log(`  ${s}`));
  }
  console.log('');
}

audit().catch((e) => {
  console.error(e);
  process.exit(1);
});
