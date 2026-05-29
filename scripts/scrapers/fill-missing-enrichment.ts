/**
 * Enrich các từ trong global_dictionary đang thiếu synonyms hoặc image.
 *
 * Cách chạy (từ thư mục web-app):
 *   npx tsx scripts/scrapers/fill-missing-enrichment.ts [--limit=100] [--mode=synonyms|image|all] [--dry-run]
 *
 * Modes:
 *   synonyms  — enrich synonyms/antonyms/image_search_query bằng Gemini (data->synonyms IS NULL)
 *   image     — resolve image cho từ đang có image_source='none'
 *   all       — chạy cả hai (default)
 *
 * Rate limit: 1 request/giây để không spam Gemini / image APIs.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { enrichWord } from '../../src/lib/ai-enrich';
import { resolveWordImage } from '../../src/lib/image-pipeline';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ---- CLI args ----
function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit') || '100', 10);
const MODE = (getArg('mode') || 'all') as 'synonyms' | 'image' | 'all';
const DRY_RUN = hasFlag('dry-run');
// Delay giữa các request — 1000ms đủ tránh Gemini rate-limit
const DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Supabase setup ----
function createSB(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[fill-enrich] Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  return createClient(url, key);
}

// ---- Enrich synonyms cho 1 từ ----
async function enrichSynonyms(supabase: SupabaseClient, word: string, data: Record<string, unknown>): Promise<void> {
  const primaryDef = (data?.results as { meanings: { definition: string }[] }[])?.[0]?.meanings?.[0]?.definition || '';
  const enriched = await enrichWord(word, process.env.GEMINI_API_KEY, data as Parameters<typeof enrichWord>[2], primaryDef);

  const patch = {
    data: {
      ...data,
      synonyms: enriched.synonyms,
      antonyms: enriched.antonyms,
      image_search_query: enriched.image_search_query,
    },
  };

  const { error } = await supabase.from('global_dictionary').update(patch).eq('word', word);
  if (error) throw error;
}

// ---- Re-resolve image cho 1 từ ----
async function refillImage(supabase: SupabaseClient, word: string, data: Record<string, unknown>): Promise<void> {
  const meanings = (data?.results as { meanings: { pos?: string; definition: string }[] }[])?.[0]?.meanings || [];
  const primary = meanings[0];
  const imageSearchQuery = (data?.image_search_query as string) || '';

  const img = await resolveWordImage({
    word,
    pos: primary?.pos || '',
    definition: primary?.definition || '',
    imageSearchQuery,
    meaningCount: meanings.length,
  });

  if (!img.url || img.source === 'none') return; // vẫn không có ảnh → không update

  const { error } = await supabase
    .from('global_dictionary')
    .update({
      image_url: img.url,
      image_source: img.source,
      image_confidence: img.confidence,
      image_query: img.query,
      image_verified_at: new Date().toISOString(),
    })
    .eq('word', word);
  if (error) throw error;
}

// ---- Query từ cần enrich synonyms ----
async function fetchMissingSynonyms(supabase: SupabaseClient, limit: number): Promise<{ word: string; data: Record<string, unknown> }[]> {
  // Lọc: data không có key 'synonyms' (hoặc synonyms là null/rỗng)
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .is('data->synonyms', null)
    .limit(limit);
  if (error) throw error;
  return (data || []) as { word: string; data: Record<string, unknown> }[];
}

// ---- Query từ cần refill image ----
async function fetchMissingImages(supabase: SupabaseClient, limit: number): Promise<{ word: string; data: Record<string, unknown> }[]> {
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word, data')
    .eq('image_source', 'none')
    .limit(limit);
  if (error) throw error;
  return (data || []) as { word: string; data: Record<string, unknown> }[];
}

// ---- Main ----
async function main(): Promise<void> {
  const supabase = createSB();

  if (DRY_RUN) console.log('[fill-enrich] DRY-RUN mode — không ghi DB, không gọi API');

  const runSynonyms = MODE === 'synonyms' || MODE === 'all';
  const runImage = MODE === 'image' || MODE === 'all';

  // ---- Synonyms pass ----
  if (runSynonyms) {
    const words = await fetchMissingSynonyms(supabase, LIMIT);
    console.log(`[fill-enrich] Synonyms pass: ${words.length} từ cần enrich`);

    let ok = 0, fail = 0;
    for (let i = 0; i < words.length; i++) {
      const { word, data } = words[i];
      const idx = `[${i + 1}/${words.length}]`;

      if (DRY_RUN) {
        console.log(`  [DRY] ${idx} Would enrich synonyms: "${word}"`);
        continue;
      }

      try {
        await enrichSynonyms(supabase, word, data);
        ok++;
        console.log(`  ✓ ${idx} ${word} — synonyms done`);
      } catch (e) {
        fail++;
        console.error(`  ✗ ${idx} ${word}:`, (e as Error).message);
      }

      // Rate limit: chờ 1s giữa mỗi Gemini call
      await sleep(DELAY_MS);
    }

    console.log(`\nSynonyms pass: ${ok} ok, ${fail} failed`);
  }

  // ---- Image pass ----
  if (runImage) {
    const words = await fetchMissingImages(supabase, LIMIT);
    console.log(`[fill-enrich] Image pass: ${words.length} từ đang thiếu ảnh`);

    let ok = 0, fail = 0, skipped = 0;
    for (let i = 0; i < words.length; i++) {
      const { word, data } = words[i];
      const idx = `[${i + 1}/${words.length}]`;

      if (DRY_RUN) {
        console.log(`  [DRY] ${idx} Would refill image: "${word}"`);
        continue;
      }

      try {
        await refillImage(supabase, word, data);
        ok++;
        console.log(`  ✓ ${idx} ${word} — image resolved`);
      } catch (e) {
        // Nếu vẫn không tìm được ảnh (resolved nhưng source=none), đây không phải lỗi
        if ((e as Error).message?.includes('still none')) {
          skipped++;
          console.log(`  - ${idx} ${word}: vẫn không có ảnh`);
        } else {
          fail++;
          console.error(`  ✗ ${idx} ${word}:`, (e as Error).message);
        }
      }

      // Rate limit giữa các image request
      await sleep(DELAY_MS);
    }

    console.log(`\nImage pass: ${ok} filled, ${skipped} still missing, ${fail} failed`);
  }
}

main().catch((e) => {
  console.error('[fill-enrich] Fatal:', e);
  process.exit(1);
});
