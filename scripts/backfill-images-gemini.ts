/**
 * [BackfillImg] Quét global_dictionary các từ chưa có ảnh (none/placeholder/null)
 * → gọi resolveWordImage (4 tier: Pixabay/Pexels/DuckDuckGo/Wikipedia/Openverse → Gemini → Pollinations)
 * → update DB.
 *
 * Chạy: cd web-app && npx tsx scripts/backfill-images-gemini.ts [--limit N] [--throttle MS]
 *
 * Resume-able: chỉ lấy từ chưa có ảnh thực → chạy lại an toàn.
 * Throttle mặc định 7s/từ → an toàn cho Gemini free tier 10 RPM/key.
 * Multi-key rotation: GEMINI_API_KEY="key1,key2,key3" → throttle có thể giảm.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Dynamic imports SAU khi dotenv chạy — vì `@/lib/supabase` tạo client global lúc load module
type DictionaryData = import('../src/lib/supabase').DictionaryData;
let resolveWordImage: typeof import('../src/lib/image-pipeline').resolveWordImage;

const LOG = '[BackfillImg]';
const PAGE_SIZE = 200;

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string, d: string) => {
    const i = args.indexOf(k);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
  };
  return {
    limit: parseInt(get('--limit', '0'), 10),
    throttle: parseInt(get('--throttle', '7000'), 10),
    onlyNone: args.includes('--only-none'),
    dryRun: args.includes('--dry-run'),
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(`${LOG} thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY`);
    process.exit(1);
  }

  // Load module SAU khi env đã sẵn sàng
  ({ resolveWordImage } = await import('../src/lib/image-pipeline'));

  const { limit, throttle, onlyNone, dryRun } = parseArgs();
  console.log(`${LOG} cấu hình: limit=${limit || '∞'} throttle=${throttle}ms only-none=${onlyNone} dry-run=${dryRun}`);

  const keyCount = (process.env.GEMINI_API_KEY || '').split(',').filter(Boolean).length;
  console.log(`${LOG} Gemini keys phát hiện: ${keyCount}`);

  const supabase = createClient(url, key);

  // Đếm tổng số từ cần backfill
  let cntQuery = supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true });
  cntQuery = onlyNone
    ? cntQuery.or('image_url.is.null,image_source.eq.none')
    : cntQuery.or('image_url.is.null,image_source.eq.none,image_source.eq.placeholder');
  const { count: pending } = await cntQuery;
  console.log(`${LOG} từ cần backfill: ${pending ?? 0}`);

  if (!pending) {
    console.log(`${LOG} không còn gì để làm.`);
    return;
  }

  const target = limit > 0 ? Math.min(limit, pending) : pending;
  console.log(`${LOG} sẽ xử lý: ${target} từ`);

  const stats: Record<string, number> = {};
  let done = 0;
  let fail = 0;
  const t0 = Date.now();

  // Lặp: mỗi vòng query batch nhỏ (vì update làm danh sách thay đổi → range không ổn định)
  while (done + fail < target) {
    let q = supabase
      .from('global_dictionary')
      .select('word, data, image_source');
    q = onlyNone
      ? q.or('image_url.is.null,image_source.eq.none')
      : q.or('image_url.is.null,image_source.eq.none,image_source.eq.placeholder');
    q = q.limit(Math.min(PAGE_SIZE, target - done - fail));

    const { data: batch, error } = await q;
    if (error) {
      console.error(`${LOG} query lỗi:`, error.message);
      break;
    }
    if (!batch || batch.length === 0) {
      console.log(`${LOG} hết từ thiếu ảnh.`);
      break;
    }

    for (const row of batch) {
      if (done + fail >= target) break;
      const word = row.word as string;
      const wd = row.data as DictionaryData | null;
      const meanings = wd?.results?.[0]?.meanings || [];
      const definition = meanings[0]?.definition || '';
      const pos = meanings[0]?.pos || '';

      const idx = done + fail + 1;
      const t1 = Date.now();

      try {
        const { url: imgUrl, source, confidence, query } = await resolveWordImage({
          word,
          definition,
          pos,
          imageSearchQuery: wd?.image_search_query || '',
          meaningCount: meanings.length || 1,
        });

        if (!imgUrl) {
          fail++;
          stats['none'] = (stats['none'] || 0) + 1;
          console.log(`${LOG} [${idx}/${target}] MISS "${word}"`);
        } else {
          if (!dryRun) {
            const { error: upErr } = await supabase
              .from('global_dictionary')
              .update({
                image_url: imgUrl,
                image_source: source,
                image_confidence: confidence,
                image_query: query,
                image_verified_at: new Date().toISOString(),
              })
              .eq('word', word);
            if (upErr) {
              fail++;
              console.error(`${LOG} [${idx}/${target}] update FAIL "${word}":`, upErr.message);
              continue;
            }
          }
          done++;
          stats[source] = (stats[source] || 0) + 1;
          const dt = ((Date.now() - t1) / 1000).toFixed(1);
          const c = confidence != null ? ` v=${confidence}` : '';
          console.log(`${LOG} [${idx}/${target}] OK   "${word}" ← ${source}${c} (${dt}s)`);
        }
      } catch (e) {
        fail++;
        console.error(`${LOG} [${idx}/${target}] EXC "${word}":`, (e as Error).message);
      }

      // Throttle để tránh rate limit Gemini + nguồn ảnh
      const elapsed = Date.now() - t1;
      const wait = Math.max(0, throttle - elapsed);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  }

  const totalSec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n${LOG} ============== KẾT THÚC ==============`);
  console.log(`${LOG} Thành công: ${done} | Thất bại: ${fail} | Thời gian: ${totalSec}s`);
  console.log(`${LOG} Phân bố nguồn:`);
  for (const [s, c] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s.padEnd(15)} ${c}`);
  }
  console.log(`\n${LOG} Chạy audit để kiểm tra: npx tsx scripts/audit-images.ts\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
