/**
 * Orchestrator cào từ vựng → global_dictionary.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=oxford-3000 [--limit=N] [--enrich] [--concurrency=3] [--dry-run]
 *   npx tsx scripts/scrapers/run-scrape.ts --source=longman --list=ielts-academic
 *   npx tsx scripts/scrapers/run-scrape.ts --source=vocabulary-com --list=toeic-600
 *   npx tsx scripts/scrapers/run-scrape.ts --source=quizlet [--limit=N]
 *   npx tsx scripts/scrapers/run-scrape.ts --source=anki --file=scripts/scrapers/decks/x.apkg
 *
 * Pipeline mỗi từ: scrape → normalize → (--enrich) → resolveWordImage → upsert.
 * Flags:
 *   --concurrency=N  Số từ xử lý song song (default: 1, tăng lên 3 nếu không dùng web scraper)
 *   --dry-run        Chỉ in danh sách từ sẽ scrape, không gọi API thật
 */
import fs from 'fs';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { scrapeWord as scrapeOxford } from './sources/oxford';
import { scrapeWord as scrapeLongman } from './sources/longman';
import { scrapeWord as scrapeVocab } from './sources/vocabulary-com';
import { scrapeSet } from './sources/quizlet';
import { scrapeApkg } from './sources/anki';
import { normalizeToGlobalDict, isUsable, RawEntry } from './core/normalizer';
import { loadCheckpoint, saveCheckpoint } from './core/checkpoint';
import { getWordSourceMap, mergeTags } from '../../src/lib/bot-utils';
import { resolveWordImage } from '../../src/lib/image-pipeline';
import { enrichWord } from '../../src/lib/ai-enrich';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEB_SCRAPERS: Record<string, (w: string) => Promise<RawEntry | null>> = {
  oxford: scrapeOxford,
  longman: scrapeLongman,
  'vocabulary-com': scrapeVocab,
};

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

// --- Concurrent chunk helper ---
/** Xử lý mảng items theo từng chunk N phần tử song song. */
async function runChunked<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

// --- Progress tracker ---
interface ProgressState {
  total: number;
  done: number;
  failed: number;
  startMs: number;
}

function logProgress(state: ProgressState, word: string, ok: boolean): void {
  state.done++;
  if (!ok) state.failed++;
  const elapsedSec = (Date.now() - state.startMs) / 1000;
  const rate = elapsedSec > 0 ? (state.done / elapsedSec) * 60 : 0;
  const remaining = state.total - state.done;
  const etaMin = rate > 0 ? (remaining / rate).toFixed(0) : '?';
  const status = ok ? '✓' : '✗';
  console.log(
    `  ${status} [${state.done}/${state.total}] ${word} | ${rate.toFixed(1)} w/min | ETA ${etaMin}min | failed: ${state.failed}`
  );
}

/** Xử lý 1 entry: chuẩn hóa → enrich (tùy chọn) → ảnh → upsert vào global_dictionary. */
async function processEntry(
  supabase: SupabaseClient,
  raw: RawEntry,
  tags: string[],
  doEnrich: boolean,
  dryRun = false
): Promise<void> {
  const { word, data } = normalizeToGlobalDict(raw);
  if (!isUsable(data)) throw new Error('thiếu nghĩa');

  if (dryRun) {
    console.log(`[DRY] Would upsert: "${word}" (${data.results[0].meanings.length} meanings, enrich=${doEnrich})`);
    return;
  }

  const meanings = data.results[0].meanings;
  const primary = meanings[0];

  // Bổ khuyết bằng AI (tùy chọn — tốn quota Gemini)
  let imageSearchQuery = '';
  if (doEnrich) {
    try {
      const enriched = await enrichWord(word, process.env.GEMINI_API_KEY, data, primary.definition);
      imageSearchQuery = enriched.image_search_query || '';
      const dataExt = data as unknown as Record<string, unknown>;
      dataExt.synonyms = enriched.synonyms;
      dataExt.antonyms = enriched.antonyms;
      dataExt.image_search_query = imageSearchQuery;
    } catch (e) {
      console.warn(`    [enrich] bỏ qua "${word}":`, (e as Error).message);
    }
  }

  // Gắn ảnh qua pipeline thống nhất (validate + AI Vision)
  const img = await resolveWordImage({
    word,
    pos: primary.pos,
    definition: primary.definition,
    imageSearchQuery,
    meaningCount: meanings.length,
  });

  // Dedup: từ đã tồn tại → merge tags, chỉ bổ sung ảnh nếu đang thiếu
  const { data: existing } = await supabase
    .from('global_dictionary')
    .select('word, tags, image_url, image_source')
    .eq('word', word)
    .maybeSingle();

  if (existing) {
    const patch: Record<string, unknown> = {
      tags: mergeTags(existing.tags || [], tags),
    };
    if (!existing.image_url || existing.image_source === 'none') {
      patch.image_url = img.url;
      patch.image_source = img.source;
      patch.image_confidence = img.confidence;
      patch.image_query = img.query;
      patch.image_verified_at = new Date().toISOString();
    }
    const { error } = await supabase.from('global_dictionary').update(patch).eq('word', word);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('global_dictionary').insert({
      word,
      tags,
      data,
      image_url: img.url,
      image_source: img.source,
      image_confidence: img.confidence,
      image_query: img.query,
      image_verified_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

async function runWebDict(
  supabase: SupabaseClient,
  source: string,
  list: string | undefined,
  limit: number,
  doEnrich: boolean,
  concurrency: number,
  dryRun: boolean
): Promise<void> {
  if (!list) {
    console.error('Web dictionary cần tham số --list=<tên file trong scripts/lists>');
    process.exit(1);
  }
  const listPath = path.resolve(process.cwd(), 'scripts/lists', `${list}.txt`);
  if (!fs.existsSync(listPath)) {
    console.error('Không tìm thấy word list:', listPath);
    process.exit(1);
  }

  const allWords = [
    ...new Set(
      fs
        .readFileSync(listPath, 'utf-8')
        .split(/\r?\n|,/)
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  const { wordToTags } = await getWordSourceMap();
  const cp = loadCheckpoint(source, list);
  const doneSet = new Set(cp.done);
  const scraper = WEB_SCRAPERS[source];

  // Lọc ra các từ chưa xử lý, áp dụng limit
  let pending = allWords.filter((w) => !doneSet.has(w));
  if (limit && pending.length > limit) pending = pending.slice(0, limit);

  if (dryRun) {
    console.log(`[DRY-RUN] ${source} / ${list} — sẽ scrape ${pending.length} từ (concurrency=${concurrency}):`);
    pending.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    return;
  }

  console.log(`[run-scrape] ${source} / ${list} — ${allWords.length} từ (${doneSet.size} đã xong, ${pending.length} còn lại, concurrency=${concurrency})`);

  const progress: ProgressState = { total: pending.length, done: 0, failed: 0, startMs: Date.now() };
  let saveCounter = 0;

  await runChunked(pending, concurrency, async (word) => {
    try {
      const raw = await scraper(word);
      if (!raw) {
        cp.failed.push(word);
        logProgress(progress, word, false);
        console.error(`    (không có dữ liệu)`);
      } else {
        await processEntry(supabase, raw, [source, 'scraped', ...(wordToTags[word] || [])], doEnrich);
        cp.done.push(word);
        logProgress(progress, word, true);
      }
    } catch (e) {
      cp.failed.push(word);
      logProgress(progress, word, false);
      console.error(`    lỗi:`, (e as Error).message);
    }
    saveCounter++;
    if (saveCounter % 10 === 0) saveCheckpoint(cp);
  });

  saveCheckpoint(cp);
  const elapsedMin = ((Date.now() - progress.startMs) / 60000).toFixed(1);
  console.log(`\nHoàn tất: ${cp.done.length} done, ${cp.failed.length} failed | ${elapsedMin}min`);
}

async function runQuizlet(supabase: SupabaseClient, limit: number, concurrency: number, dryRun: boolean): Promise<void> {
  const cfgPath = path.resolve(process.cwd(), 'scripts/scrapers/config/quizlet-sets.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('Thiếu config:', cfgPath);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const sets: { url: string; tags: string[] }[] = cfg.sets || [];

  for (const set of sets) {
    console.log(`\n[Quizlet] ${set.url}`);
    const allEntries = await scrapeSet(set.url);
    const entries = limit ? allEntries.slice(0, limit) : allEntries;

    if (dryRun) {
      console.log(`[DRY-RUN] sẽ upsert ${entries.length} từ từ set này`);
      entries.forEach((e) => console.log(`  - ${e.word}`));
      continue;
    }

    const progress: ProgressState = { total: entries.length, done: 0, failed: 0, startMs: Date.now() };
    await runChunked(entries, concurrency, async (raw) => {
      try {
        await processEntry(supabase, raw, ['quizlet', 'scraped', ...(set.tags || [])], false);
        logProgress(progress, raw.word, true);
      } catch (e) {
        logProgress(progress, raw.word, false);
        console.error(`    lỗi:`, (e as Error).message);
      }
    });
  }
}

async function runAnki(
  supabase: SupabaseClient,
  file: string | undefined,
  limit: number,
  concurrency: number,
  dryRun: boolean
): Promise<void> {
  if (!file) {
    console.error('Anki cần --file=<đường dẫn .apkg>');
    process.exit(1);
  }
  const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  const allEntries = await scrapeApkg(filePath);
  const entries = limit ? allEntries.slice(0, limit) : allEntries;
  console.log(`[Anki] ${entries.length} thẻ từ ${filePath}`);
  const deckTag = path.basename(filePath, path.extname(filePath));

  if (dryRun) {
    console.log(`[DRY-RUN] sẽ upsert ${entries.length} từ`);
    entries.forEach((e) => console.log(`  - ${e.word}`));
    return;
  }

  const progress: ProgressState = { total: entries.length, done: 0, failed: 0, startMs: Date.now() };
  await runChunked(entries, concurrency, async (raw) => {
    try {
      await processEntry(supabase, raw, ['anki', 'scraped', deckTag], false);
      logProgress(progress, raw.word, true);
    } catch (e) {
      logProgress(progress, raw.word, false);
      console.error(`    lỗi:`, (e as Error).message);
    }
  });
}

async function main(): Promise<void> {
  const source = getArg('source');
  if (!source) {
    console.error('Thiếu --source. Hỗ trợ: oxford | longman | vocabulary-com | quizlet | anki');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const limit = parseInt(getArg('limit') || '0', 10);
  const concurrency = Math.max(1, parseInt(getArg('concurrency') || '1', 10));
  const doEnrich = hasFlag('enrich');
  const dryRun = hasFlag('dry-run');

  if (dryRun) console.log('[run-scrape] DRY-RUN mode — không gọi API, không ghi DB');

  if (source === 'quizlet') {
    await runQuizlet(supabase, limit, concurrency, dryRun);
  } else if (source === 'anki') {
    await runAnki(supabase, getArg('file'), limit, concurrency, dryRun);
  } else if (WEB_SCRAPERS[source]) {
    await runWebDict(supabase, source, getArg('list'), limit, doEnrich, concurrency, dryRun);
  } else {
    console.error('Source không hợp lệ:', source);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
