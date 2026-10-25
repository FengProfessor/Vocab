/**
 * [CLIP-Verify] Verify ảnh hàng loạt bằng CLIP local (transformers.js).
 *
 * Speed: ~0.3-0.5s/từ CPU. Cost: $0. Quota: ∞.
 *
 * Score logic:
 *   target probability ≥ 0.45 → KEEP
 *   target probability ≥ 0.08 → LOW
 *   target probability < 0.08 → RESET
 *
 * Chạy: cd web-app && node scripts/clip-verify-batch.mjs [--limit N]
 */
import { pipeline } from '@huggingface/transformers';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const LOG = '[CLIP]';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k, d) => {
    const i = args.indexOf(k);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
  };
  return {
    limit: parseInt(get('--limit', '5000'), 10),
    dryRun: args.includes('--dry-run'),
  };
}

async function main() {
  const { limit, dryRun } = parseArgs();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(`${LOG} thiếu Supabase env`);
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(`${LOG} loading CLIP model...`);
  const t0 = Date.now();
  const classifier = await pipeline('zero-shot-image-classification', 'Xenova/clip-vit-base-patch32');
  console.log(`${LOG} model loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  // Đếm tổng số từ cần verify (vượt Supabase 1000 row limit bằng head:true)
  const { count: totalPending } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true })
    .is('image_confidence', null)
    .not('image_url', 'is', null)
    .not('image_source', 'in', '(skip-function,none,placeholder)');

  const target = Math.min(limit, totalPending || 0);
  console.log(`${LOG} tổng cần verify: ${totalPending} | sẽ xử lý: ${target} (auto-chunked theo Supabase 1000 limit)\n`);

  if (target === 0) {
    console.log(`${LOG} không còn gì để verify. ✅`);
    return;
  }

  const stats = { kept: 0, downgraded: 0, reset: 0, error: 0 };
  const tStart = Date.now();
  const CHUNK = 1000; // Supabase default range limit
  let processed = 0;

  // Loop auto-chunked: mỗi chunk query 1000 rows fresh (vì update sẽ thay đổi filter set)
  outer: while (processed < target) {
    const remaining = target - processed;
    const chunkSize = Math.min(CHUNK, remaining);

    const { data: rows, error } = await supabase
      .from('global_dictionary')
      .select('word, image_url, image_source, data')
      .is('image_confidence', null)
      .not('image_url', 'is', null)
      .not('image_source', 'in', '(skip-function,none,placeholder)')
      .order('word')
      .limit(chunkSize);

    if (error) {
      console.error(`${LOG} query:`, error.message);
      break;
    }
    if (!rows || rows.length === 0) {
      console.log(`${LOG} hết từ cần verify.`);
      break;
    }

  for (let i = 0; i < rows.length; i++) {
    if (processed >= target) break outer;
    const r = rows[i];
    const t1 = Date.now();

    try {
      const meaning = r.data?.results?.[0]?.meanings?.[0]?.definition || '';
      const targetLabel = meaning
        ? `a clear educational image illustrating "${r.word}", meaning: ${meaning.slice(0, 140)}`
        : `a clear educational image illustrating "${r.word}"`;

      // Siết nhãn đối chứng nhưng giữ ngưỡng reset rất thấp để tránh loại oan thành ngữ.
      const labels = [
        targetLabel,
        'an unrelated image that does not illustrate the requested vocabulary meaning',
        'a text-heavy dictionary card, screenshot, logo, watermark, or advertisement',
        'a blank, corrupt, low-quality, or unusable image',
      ];

      const result = await classifier(r.image_url, labels);
      const targetResult = result.find((x) => x.label === labels[0]);
      const prob = targetResult ? targetResult.score : 0;
      const score = Math.round(prob * 100);

      let action = '';
      const update = { image_confidence: score, image_verified_at: new Date().toISOString() };

      if (prob >= 0.45) {
        update.image_source = r.image_source.replace(/-low$/, '');
        stats.kept++;
        action = `KEEP ${score}`;
      } else if (prob >= 0.08) {
        if (!r.image_source.endsWith('-low')) update.image_source = `${r.image_source}-low`;
        stats.downgraded++;
        action = `LOW  ${score}`;
      } else {
        update.image_url = null;
        update.image_source = 'none';
        update.image_confidence = null;
        stats.reset++;
        action = `RESET ${score}`;
      }

      if (!dryRun) {
        const { error: upErr } = await supabase.from('global_dictionary').update(update).eq('word', r.word);
        if (upErr) {
          stats.error++;
          console.error(`${LOG} [${i + 1}/${rows.length}] DB FAIL "${r.word}":`, upErr.message);
          continue;
        }
      }

      processed++;
      const dt = ((Date.now() - t1) / 1000).toFixed(1);
      const topLabel = result[0].label.slice(0, 30);
      const topScore = (result[0].score * 100).toFixed(0);
      console.log(`${LOG} [${processed}/${target}] ${action} "${r.word}" (${dt}s) | top: "${topLabel}" (${topScore}%)`);
    } catch (e) {
      processed++;
      stats.error++;
      console.error(`${LOG} [${processed}/${target}] ERR "${r.word}":`, e.message);
    }
  }
  } // end outer while

  const totalSec = ((Date.now() - tStart) / 1000).toFixed(0);
  console.log(`\n${LOG} ============== KẾT THÚC ==============`);
  console.log(`${LOG} Thời gian: ${totalSec}s | Trung bình: ${(parseFloat(totalSec) / Math.max(processed, 1)).toFixed(2)}s/từ`);
  console.log(`${LOG} KEEP   (≥45%): ${stats.kept}`);
  console.log(`${LOG} LOW    (8-44%): ${stats.downgraded}`);
  console.log(`${LOG} RESET  (<8%):   ${stats.reset}`);
  console.log(`${LOG} ERROR: ${stats.error}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
