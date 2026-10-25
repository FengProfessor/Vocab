import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

/**
 * Enrich word family (họ từ vựng) cho TOÀN BỘ global_dictionary.
 *
 * Mỗi entry → data.familyWords = WordFamilyEntry[] { word, pos, meaning(VN) }.
 * - Dạng cũ familyWords: string[] ("word (pos)") → bị ghi đè bằng object[] có nghĩa.
 * - Resume-safe: skip row mà familyWords ĐÃ là object[] có meaning.
 *
 * Chạy: cd web-app && npx tsx scripts/enrich-word-family.ts --limit=200 [--offset=0] [--tag=pro3m] [--dry]
 */

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1].trim()] = v;
    }
  });
}

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

const LIMIT = parseInt(getArg('limit') || '200', 10);
const OFFSET = parseInt(getArg('offset') || '0', 10);
const TAG = getArg('tag'); // optional: chỉ lọc theo tag
const DRY = process.argv.includes('--dry');

interface FamilyEntry { word: string; pos?: string; meaning?: string }

/** familyWords đã enrich xong (object[] có meaning) → skip */
function isEnriched(fw: unknown): boolean {
  if (!Array.isArray(fw) || fw.length === 0) return false;
  return fw.every(
    (e) => e && typeof e === 'object' && typeof (e as FamilyEntry).word === 'string' && typeof (e as FamilyEntry).meaning === 'string' && (e as FamilyEntry).meaning!.trim() !== ''
  );
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
  console.log(`   → ${rows.length} rows total.`);

  // Cần enrich: từ ĐƠN + chưa enriched object[] + chưa bị đánh dấu không-có-family
  const pending = rows.filter((r) => !/\s/.test(r.word) && !isEnriched(r.data?.familyWords) && r.data?.familyChecked !== true);
  console.log(`📊 ${pending.length} rows pending word-family enrich.`);

  const batch = pending.slice(OFFSET, OFFSET + LIMIT);
  console.log(`🚀 Processing ${batch.length} rows (offset ${OFFSET}, limit ${LIMIT})${DRY ? ' [DRY]' : ''}.`);

  const router = getRouter();
  let ok = 0;
  let consecutiveRL = 0;
  const RL_ABORT = 6;

  for (let i = 0; i < batch.length; i++) {
    const { id, word, data } = batch[i];
    const idx = `[${i + 1}/${batch.length}]`;
    const headDef = data?.results?.[0]?.meanings?.[0]?.definition || '';
    console.log(`\n🤖 ${idx} "${word}" ${headDef ? `(${headDef})` : ''}`);

    const prompt = `You are a bilingual English-Vietnamese lexicographer. For the English headword "${word}"${headDef ? ` (Vietnamese meaning: "${headDef}")` : ''}, list its WORD FAMILY — the common derivational forms (noun, verb, adjective, adverb) that actually exist in standard English. Include the headword itself.

Return ONLY a JSON object: {"family":[{"word","pos","meaning"}]}
- "word": the English derived form (lowercase base form)
- "pos": one of noun | verb | adjective | adverb
- "meaning": concise Vietnamese meaning of THAT form (not the headword)
Rules: only real, common forms (max 6). If the word has no real derivational family, return {"family":[]}. No markdown, JSON only.`;

    let raw = '';
    let success = false;
    let wasRL = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        raw = await router.generate(prompt, 'normal', true);
        success = true;
        break;
      } catch (err: any) {
        const msg = err.message || String(err);
        wasRL = /429|quota|cooldown|RESOURCE_EXHAUSTED|limit|No keys available/i.test(msg);
        if (wasRL && attempt < 2) {
          console.warn(`   -> ⚠️ rate-limited (try ${attempt + 1}/3), wait 30s`);
          await new Promise((r) => setTimeout(r, 30000));
        } else {
          console.error(`   -> ❌ fail:`, msg);
          break;
        }
      }
    }

    if (!success) {
      if (wasRL && ++consecutiveRL >= RL_ABORT) {
        console.warn(`\n🛑 ${consecutiveRL} fail liên tiếp do rate-limit → quota cạn. Dừng tại ${ok} từ. Chạy lại sau.`);
        break;
      }
      continue;
    }
    consecutiveRL = 0;

    let family: FamilyEntry[];
    try {
      let parsed: any;
      try { parsed = JSON.parse(raw.trim()); }
      catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('not JSON');
        parsed = JSON.parse(m[0]);
      }
      const arr = Array.isArray(parsed) ? parsed : parsed.family;
      if (!Array.isArray(arr)) throw new Error('no family array');
      family = arr
        .map((e: any) => ({
          word: String(e.word || '').trim().toLowerCase(),
          pos: String(e.pos || '').trim().toLowerCase() || undefined,
          meaning: String(e.meaning || '').trim() || undefined,
        }))
        .filter((e: FamilyEntry) => e.word && e.meaning);
      // dedup theo word
      const seen = new Set<string>();
      family = family.filter((e) => (seen.has(e.word) ? false : (seen.add(e.word), true)));
    } catch (err: any) {
      console.error(`   -> ❌ parse:`, err.message);
      continue;
    }

    console.log(`   -> ${family.length} family words: ${family.map((f) => f.word).join(', ')}`);

    if (DRY) { ok++; continue; }

    // Rỗng → đánh dấu đã kiểm tra để rời pending (không kẹt lặp)
    const newData = family.length > 0
      ? { ...data, familyWords: family }
      : { ...data, familyChecked: true };
    const { error: upErr } = await supabase.from('global_dictionary').update({ data: newData }).eq('id', id);
    if (upErr) console.error(`   -> ❌ db:`, upErr.message);
    else { console.log(`   -> 🎉 saved`); ok++; }

    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\n🏁 Done. ${ok}/${batch.length} enriched. Còn pending (ước tính): ${pending.length - batch.length}.`);
}

main().catch((e) => { console.error('❌ fatal:', e); process.exit(1); });
