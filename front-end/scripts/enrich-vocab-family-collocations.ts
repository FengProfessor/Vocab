import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Script tự động quét global_dictionary và bổ sung:
 * 1. Word Family (Họ từ vựng phái sinh kèm nghĩa Việt)
 * 2. Collocations (Cụm từ hay đi kèm dạng { phrase, meaning_vi, type })
 * 3. Morphology (Cấu tạo từ: từ gốc, tiền tố, hậu tố kèm nghĩa Việt)
 *
 * Chạy: npx tsx scripts/enrich-vocab-family-collocations.ts [--limit=50] [--offset=0] [--tag=pro3m] [--dry] [--force]
 */

import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env in .env.local');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const LIMIT = parseInt(getArg('limit') || '50', 10);
const OFFSET = parseInt(getArg('offset') || '0', 10);
const TAG = getArg('tag');
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');

interface FamilyEntry { word: string; pos?: string; meaning?: string }
interface CollocationEntry { phrase: string; meaning_vi?: string; type?: string }
interface AffixEntry { affix: string; meaning_vi?: string }
interface MorphologyData {
  rootWord?: string;
  rootMeaning?: string;
  prefixes?: AffixEntry[];
  suffixes?: AffixEntry[];
}

function isFullyEnriched(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.fullEnriched === true) return true;
  const hasFamily = Array.isArray(data.familyWords) && data.familyWords.length > 0 && typeof data.familyWords[0] === 'object';
  const hasCollocations = Array.isArray(data.collocations) && data.collocations.length > 0;
  const hasMorphology = data.morphology && typeof data.morphology === 'object' && (data.morphology.rootWord || data.morphology.prefixes?.length || data.morphology.suffixes?.length);
  return hasFamily && hasCollocations && Boolean(hasMorphology);
}

function buildPrompt(word: string, headDef?: string): string {
  return `You are an expert bilingual lexicographer. Analyze the English headword "${word}"${headDef ? ` (meaning: "${headDef}")` : ''}.

Extract and generate detailed linguistic information in valid JSON:
{
  "family": [
    { "word": "derived English form (lowercase)", "pos": "noun|verb|adjective|adverb", "meaning": "concise Vietnamese meaning" }
  ],
  "collocations": [
    { "phrase": "natural English collocation using ${word}", "meaning_vi": "Vietnamese translation", "type": "v+n | adj+n | prep+n | phrasal" }
  ],
  "morphology": {
    "rootWord": "base root word (e.g. depend for independence)",
    "rootMeaning": "Vietnamese meaning of root word",
    "prefixes": [ { "affix": "prefix (e.g. in-, un-, re-)", "meaning_vi": "Vietnamese function/meaning" } ],
    "suffixes": [ { "affix": "suffix (e.g. -ence, -tion, -able)", "meaning_vi": "Vietnamese function/meaning" } ]
  }
}

Rules:
- "family": 2-6 common real derivational forms (including headword).
- "collocations": 3-6 natural collocations or fixed patterns.
- "morphology": accurately identify prefixes (e.g. un-, dis-, re-, im-), suffixes (e.g. -ness, -ment, -able, -tion), and root word. If the word is a root itself without affixes, leave prefixes/suffixes as empty arrays [].
- Return ONLY raw valid JSON. No markdown backticks.`;
}

async function main() {
  const { getRouter } = await import('../src/lib/ai-router');

  console.log(`🔍 Fetching global_dictionary${TAG ? ` (tag=${TAG})` : ' (ALL)'} ...`);
  const rows: { id: string; word: string; data: any }[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let q = supabase.from('global_dictionary').select('id, word, data').range(from, from + pageSize - 1);
    if (TAG) q = q.contains('tags', [TAG]);
    const { data: page, error } = await q;
    if (error) { console.error('❌ fetch:', error.message); process.exit(1); }
    if (!page || page.length === 0) break;
    rows.push(...(page as typeof rows));
    if (page.length < pageSize) break;
    from += pageSize;
  }
  console.log(`   → ${rows.length} rows total in DB.`);

  // Lọc từ đơn chưa enriched (hoặc ép bằng --force)
  const pending = rows.filter((r) => !/\s/.test(r.word) && (FORCE || !isFullyEnriched(r.data)));
  console.log(`📊 ${pending.length} single words pending full family & collocation enrichment.`);

  const batch = pending.slice(OFFSET, OFFSET + LIMIT);
  console.log(`🚀 Processing ${batch.length} words (offset ${OFFSET}, limit ${LIMIT})${DRY ? ' [DRY RUN]' : ''}.`);

  const router = getRouter();
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < batch.length; i++) {
    const { id, word, data } = batch[i];
    const idx = `[${i + 1}/${batch.length}]`;
    const headDef = data?.results?.[0]?.meanings?.[0]?.definition || '';
    console.log(`\n🤖 ${idx} Word: "${word}" ${headDef ? `(${headDef})` : ''}`);

    const prompt = buildPrompt(word, headDef);
    let raw = '';
    let success = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        raw = await router.generate(prompt, 'normal', true);
        success = true;
        break;
      } catch (err: any) {
        const msg = err.message || String(err);
        const wasRL = /429|quota|cooldown|RESOURCE_EXHAUSTED|limit/i.test(msg);
        if (wasRL && attempt < 2) {
          console.warn(`   -> ⚠️ Rate-limited (try ${attempt + 1}/3), waiting 20s...`);
          await new Promise((r) => setTimeout(r, 20000));
        } else {
          console.error(`   -> ❌ Fail:`, msg);
          break;
        }
      }
    }

    if (!success) { fail++; continue; }

    try {
      let parsed: any;
      try { parsed = JSON.parse(raw.trim()); }
      catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('Could not parse JSON output');
        parsed = JSON.parse(m[0]);
      }

      const family: FamilyEntry[] = Array.isArray(parsed.family) ? parsed.family : [];
      const collocations: CollocationEntry[] = Array.isArray(parsed.collocations) ? parsed.collocations : [];
      const morphology: MorphologyData = parsed.morphology || {};

      console.log(`   -> 👨‍👩‍👧‍👦 Family (${family.length}): ${family.map(f => f.word).join(', ')}`);
      console.log(`   -> 🔗 Collocations (${collocations.length}): ${collocations.map(c => c.phrase).slice(0, 3).join('; ')}`);
      if (morphology.rootWord || morphology.prefixes?.length || morphology.suffixes?.length) {
        console.log(`   -> 🧬 Morphology: Root="${morphology.rootWord || ''}", Prefixes=${(morphology.prefixes || []).map(p=>p.affix).join(',')}, Suffixes=${(morphology.suffixes || []).map(s=>s.affix).join(',')}`);
      }

      if (DRY) { ok++; continue; }

      const updatedData = {
        ...(data || {}),
        familyWords: family.length > 0 ? family : data?.familyWords,
        collocations: collocations.length > 0 ? collocations : data?.collocations,
        morphology: (morphology.rootWord || morphology.prefixes?.length || morphology.suffixes?.length) ? morphology : data?.morphology,
        fullEnriched: true,
      };

      const { error: upErr } = await supabase
        .from('global_dictionary')
        .update({ data: updatedData })
        .eq('id', id);

      if (upErr) {
        console.error(`   -> ❌ DB update error:`, upErr.message);
        fail++;
      } else {
        console.log(`   -> 🎉 Updated DB successfully`);
        ok++;
      }
    } catch (err: any) {
      console.error(`   -> ❌ JSON Parse Error:`, err.message);
      fail++;
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n🏁 Finish: ${ok} succeeded, ${fail} failed. Remaining pending: ${pending.length - batch.length}.`);
}

main().catch((e) => { console.error('❌ Fatal error:', e); process.exit(1); });
