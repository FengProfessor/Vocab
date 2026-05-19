/**
 * Orchestrator cào từ vựng → global_dictionary.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/run-scrape.ts --source=oxford --list=oxford-3000 [--limit=N] [--enrich]
 *   npx tsx scripts/scrapers/run-scrape.ts --source=longman --list=ielts-academic
 *   npx tsx scripts/scrapers/run-scrape.ts --source=vocabulary-com --list=toeic-600
 *   npx tsx scripts/scrapers/run-scrape.ts --source=quizlet [--limit=N]
 *   npx tsx scripts/scrapers/run-scrape.ts --source=anki --file=scripts/scrapers/decks/x.apkg
 *
 * Pipeline mỗi từ: scrape → normalize → (--enrich) → resolveWordImage → upsert.
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

/** Xử lý 1 entry: chuẩn hóa → enrich (tùy chọn) → ảnh → upsert vào global_dictionary. */
async function processEntry(
  supabase: SupabaseClient,
  raw: RawEntry,
  tags: string[],
  doEnrich: boolean
): Promise<void> {
  const { word, data } = normalizeToGlobalDict(raw);
  if (!isUsable(data)) throw new Error('thiếu nghĩa');

  const meanings = data.results[0].meanings;
  const primary = meanings[0];

  // Bổ khuyết bằng AI (tùy chọn — tốn quota Gemini)
  let imageSearchQuery = '';
  if (doEnrich) {
    try {
      const enriched = await enrichWord(word, process.env.GEMINI_API_KEY, data, primary.definition);
      imageSearchQuery = enriched.image_search_query || '';
      const dataExt = data as Record<string, unknown>;
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
  doEnrich: boolean
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

  const words = [
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

  console.log(`[run-scrape] ${source} / ${list} — ${words.length} từ (${doneSet.size} đã xong)`);
  let processed = 0;

  for (const word of words) {
    if (doneSet.has(word)) continue;
    if (limit && processed >= limit) break;
    processed++;
    try {
      const raw = await scraper(word);
      if (!raw) {
        cp.failed.push(word);
        console.log(`  ✗ ${word} (không có dữ liệu)`);
      } else {
        await processEntry(supabase, raw, [source, 'scraped', ...(wordToTags[word] || [])], doEnrich);
        cp.done.push(word);
        console.log(`  ✓ ${word}`);
      }
    } catch (e) {
      cp.failed.push(word);
      console.error(`  ✗ ${word}:`, (e as Error).message);
    }
    if (processed % 10 === 0) saveCheckpoint(cp);
  }

  saveCheckpoint(cp);
  console.log(`\nHoàn tất: ${cp.done.length} done, ${cp.failed.length} failed`);
}

async function runQuizlet(supabase: SupabaseClient, limit: number): Promise<void> {
  const cfgPath = path.resolve(process.cwd(), 'scripts/scrapers/config/quizlet-sets.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('Thiếu config:', cfgPath);
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const sets: { url: string; tags: string[] }[] = cfg.sets || [];

  for (const set of sets) {
    console.log(`\n[Quizlet] ${set.url}`);
    const entries = await scrapeSet(set.url);
    let count = 0;
    for (const raw of entries) {
      if (limit && count >= limit) break;
      count++;
      try {
        await processEntry(supabase, raw, ['quizlet', 'scraped', ...(set.tags || [])], false);
        console.log(`  ✓ ${raw.word}`);
      } catch (e) {
        console.error(`  ✗ ${raw.word}:`, (e as Error).message);
      }
    }
  }
}

async function runAnki(
  supabase: SupabaseClient,
  file: string | undefined,
  limit: number
): Promise<void> {
  if (!file) {
    console.error('Anki cần --file=<đường dẫn .apkg>');
    process.exit(1);
  }
  const filePath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  const entries = await scrapeApkg(filePath);
  console.log(`[Anki] ${entries.length} thẻ từ ${filePath}`);
  const deckTag = path.basename(filePath, path.extname(filePath));

  let count = 0;
  for (const raw of entries) {
    if (limit && count >= limit) break;
    count++;
    try {
      await processEntry(supabase, raw, ['anki', 'scraped', deckTag], false);
      console.log(`  ✓ ${raw.word}`);
    } catch (e) {
      console.error(`  ✗ ${raw.word}:`, (e as Error).message);
    }
  }
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
  const doEnrich = hasFlag('enrich');

  if (source === 'quizlet') {
    await runQuizlet(supabase, limit);
  } else if (source === 'anki') {
    await runAnki(supabase, getArg('file'), limit);
  } else if (WEB_SCRAPERS[source]) {
    await runWebDict(supabase, source, getArg('list'), limit, doEnrich);
  } else {
    console.error('Source không hợp lệ:', source);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
