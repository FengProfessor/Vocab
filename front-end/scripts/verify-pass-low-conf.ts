/**
 * [VerifyPass] Chạy lại Vision verify cho ảnh confidence=null.
 *
 * Mục đích: sau backfill, nhiều ảnh được lưu với confidence=null vì Gemini hết quota.
 * Script này lấy quota reset hằng ngày → verify tiếp.
 *
 * Logic:
 *   - score ≥ 70  → update image_confidence (giữ ảnh)
 *   - 15-69        → mark `<source>-low` + update conf (cần thay sau)
 *   - score ≤ 15  → RESET image_url=null, image_source='none' → backfill lần sau pick up lại
 *
 * Quota safety: 6 keys × ~20 RPD = ~120 calls/day. Default limit 100, throttle 6s.
 * Chạy: cd web-app && npx tsx scripts/verify-pass-low-conf.ts [--limit N] [--throttle MS]
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const LOG = '[VerifyPass]';

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (k: string, d: string) => {
    const i = args.indexOf(k);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : d;
  };
  return {
    limit: parseInt(get('--limit', '100'), 10),
    throttle: parseInt(get('--throttle', '6000'), 10),
    workers: parseInt(get('--workers', '1'), 10),
    dryRun: args.includes('--dry-run'),
  };
}

interface Row {
  word: string;
  image_url: string;
  image_source: string;
  data: { results?: Array<{ meanings?: Array<{ pos?: string; definition?: string }> }> } | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(`${LOG} thiếu env Supabase`);
    process.exit(1);
  }

  const { limit, throttle, workers, dryRun } = parseArgs();
  console.log(`${LOG} limit=${limit} throttle=${throttle}ms workers=${workers} dry-run=${dryRun}`);

  const keyCount = (process.env.GEMINI_API_KEY || '').split(',').filter(Boolean).length;
  console.log(`${LOG} Gemini keys: ${keyCount} (quota dự kiến ~${keyCount * 20}/ngày)`);

  // Multi-provider orchestrator: rotate Groq + HF + CF tự động khi 1 cái cạn
  const hasMulti = !!(process.env.HF_TOKEN || process.env.CLOUDFLARE_ACCOUNT_ID);
  const useGroq = !!process.env.GROQ_API_KEY;
  let provider: string;
  let verifyImageMeaning: (url: string, ctx: { word: string; pos?: string; definition?: string }) => Promise<{ score: number; reason: string; provider?: string }>;
  if (hasMulti) {
    const { verifyImageMulti } = await import('../src/lib/vision-providers/orchestrator');
    verifyImageMeaning = verifyImageMulti;
    provider = 'multi-provider (Groq + HF + CF)';
  } else if (useGroq) {
    verifyImageMeaning = (await import('../src/lib/groq-vision')).verifyImageMeaningGroq;
    provider = 'Groq LLaMA-4 Scout';
  } else {
    verifyImageMeaning = (await import('../src/lib/image-pipeline')).verifyImageMeaning;
    provider = 'Gemini (legacy)';
  }
  console.log(`${LOG} Vision provider: ${provider}`);

  const supabase = createClient(url, key);

  // Lấy ảnh confidence=null, có URL, KHÔNG phải skip-function/none
  const { count: pending } = await supabase
    .from('global_dictionary')
    .select('*', { count: 'exact', head: true })
    .is('image_confidence', null)
    .not('image_url', 'is', null)
    .not('image_source', 'in', '(skip-function,none,placeholder)');

  console.log(`${LOG} từ cần verify: ${pending ?? 0}`);
  if (!pending) {
    console.log(`${LOG} không còn gì để làm. ✅`);
    return;
  }

  const target = Math.min(limit, pending);
  console.log(`${LOG} sẽ xử lý: ${target} từ\n`);

  const { data: rows, error } = await supabase
    .from('global_dictionary')
    .select('word, image_url, image_source, data')
    .is('image_confidence', null)
    .not('image_url', 'is', null)
    .not('image_source', 'in', '(skip-function,none,placeholder)')
    .order('word')
    .limit(target);

  if (error) {
    console.error(`${LOG} query lỗi:`, error.message);
    return;
  }

  const stats = { kept: 0, downgraded: 0, reset: 0, error: 0 };
  const t0 = Date.now();

  // Worker pool: chia rows[] thành 1 queue chung, N worker tiêu thụ song song
  const queue: Row[] = [...(rows as Row[])];
  let processed = 0;

  async function processOne(r: Row, idx: number) {
    const m0 = r.data?.results?.[0]?.meanings?.[0] || {};
    const definition = m0.definition || '';
    const pos = m0.pos || '';

    const t1 = Date.now();
    const { score, reason } = await verifyImageMeaning(r.image_url, {
      word: r.word,
      pos,
      definition,
    });
    const dt = ((Date.now() - t1) / 1000).toFixed(1);

    if (score === -1) {
      stats.error++;
      console.log(`${LOG} [${idx}/${target}] ERR  "${r.word}" (${reason}) — ${dt}s`);
      const wait = Math.max(0, throttle - (Date.now() - t1));
      if (wait > 0) await new Promise((res) => setTimeout(res, wait));
      return;
    }

    let action = '';
    const update: Record<string, unknown> = { image_confidence: score };

    if (score >= 70) {
      update.image_source = r.image_source.replace(/-low$/, '');
      stats.kept++;
      action = `KEEP ${score}`;
    } else if (score > 15) {
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

    update.image_verified_at = new Date().toISOString();

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from('global_dictionary')
        .update(update)
        .eq('word', r.word);
      if (upErr) {
        stats.error++;
        console.error(`${LOG} [${idx}/${target}] DB FAIL "${r.word}":`, upErr.message);
        return;
      }
    }

    const provider = (reason as string).match(/^(groq|hf|cf):/i)?.[1] || '';
    const provStr = provider ? `[${provider}] ` : '';
    console.log(`${LOG} [${idx}/${target}] ${provStr}${action} "${r.word}" (${dt}s) ${reason ? '| ' + reason.slice(0, 60) : ''}`);

    const wait = Math.max(0, throttle - (Date.now() - t1));
    if (wait > 0) await new Promise((res) => setTimeout(res, wait));
  }

  async function worker(_id: number) {
    while (queue.length > 0) {
      const r = queue.shift();
      if (!r) break;
      const idx = ++processed;
      try {
        await processOne(r, idx);
      } catch (e) {
        stats.error++;
        console.error(`${LOG} [${idx}/${target}] EXC "${r.word}":`, (e as Error).message);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, workers) }, (_, i) => worker(i + 1)));

  const totalSec = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n${LOG} ============== KẾT THÚC ==============`);
  console.log(`${LOG} Thời gian: ${totalSec}s`);
  console.log(`${LOG} KEEP   (score≥70):  ${stats.kept}`);
  console.log(`${LOG} LOW    (15-69):     ${stats.downgraded}`);
  console.log(`${LOG} RESET  (score≤15):  ${stats.reset}  ← sẽ được backfill lại lần sau`);
  console.log(`${LOG} ERROR  (Vision/DB): ${stats.error}`);
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
