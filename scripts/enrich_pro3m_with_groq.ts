import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 1. Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ---- CLI args ----
function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const LIMIT = parseInt(getArg('limit') || '50', 10);
const NO_IMAGE = process.argv.includes('--no-image'); // bỏ resolve ảnh → nhanh hơn, ảnh backfill pass riêng

async function main() {
  // Dynamically import router and image-pipeline to prevent top-level module load env errors
  const { getRouter } = await import('../src/lib/ai-router');
  const { resolveWordImage } = await import('../src/lib/image-pipeline');

  const generalTag = getArg('tag') || 'pro3m';
  console.log(`🔍 Fetching ALL ${generalTag} words (paginated — Supabase giới hạn 1000/lần)...`);

  // PHẢI paginate: query không .range() chỉ trả 1000 dòng đầu → bỏ sót placeholder ở rows >1000
  const rows: { id: string; word: string; tags: string[]; data: any }[] = [];
  let pageFrom = 0; const pageSize = 1000;
  while (true) {
    const { data: page, error: fetchError } = await supabase
      .from('global_dictionary')
      .select('id, word, tags, data')
      .contains('tags', [generalTag])
      .range(pageFrom, pageFrom + pageSize - 1);
    if (fetchError) {
      console.error('❌ Error fetching words:', fetchError.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    rows.push(...(page as typeof rows));
    if (page.length < pageSize) break;
    pageFrom += pageSize;
  }
  console.log(`   → Lấy được ${rows.length} dòng ${generalTag}.`);

  // Filter placeholders in memory
  const pendingWords = (rows || []).filter(row => {
    const firstMeaning = row.data?.results?.[0]?.meanings?.[0];
    return firstMeaning?.definition === '⏳ Click to enrich / Auto-enrich';
  });

  console.log(`📊 Found ${pendingWords.length} pending placeholder words.`);
  
  if (pendingWords.length === 0) {
    console.log('✅ No pending words need enrichment. Exiting.');
    return;
  }

  const wordsToEnrich = pendingWords.slice(0, LIMIT);
  console.log(`🚀 Starting enrichment for ${wordsToEnrich.length} words...`);

  const router = getRouter();
  let successCount = 0;
  let consecutiveRL = 0;      // số từ liên tiếp fail vì rate-limit
  const RL_ABORT = 6;         // chạm ngưỡng → coi như quota cạn → thoát sạch (chạy lại sau reset)

  for (let i = 0; i < wordsToEnrich.length; i++) {
    const { id, word, data } = wordsToEnrich[i];
    const idx = `[${i + 1}/${wordsToEnrich.length}]`;
    console.log(`\n🤖 ${idx} Enriching "${word}"...`);

    const prompt = `You are a bilingual English-Vietnamese dictionary. Analyze the word/phrase: "${word}".
Return ONLY a valid JSON object with these exact keys:
- "english": the English word (lowercase base form)
- "vietnamese": the most common Vietnamese meaning
- "ipa": IPA phonetic transcription (e.g. /ɪmˈpoʊz/)
- "pos": part of speech (noun/verb/adj/adv/phrase/idiom)
- "example": one natural English sentence illustrating usage
- "synonyms": array of 3-5 common English synonyms
- "antonyms": array of 3-5 common English antonyms
- "image_search_query": a 2-5 word descriptive English string representing a clear visual concept of this word (for image search).

Strict JSON format only. Do not include markdown tags like \`\`\`json.`;

    let rawText = '';
    let attempt = 0;
    const maxAttempts = 3;
    let success = false;
    let wasRateLimited = false;

    while (attempt < maxAttempts) {
      try {
        // Call router with 'normal' tier (routes to llama-3.1-8b-instant for Groq or gemini-2.5-flash)
        rawText = await router.generate(prompt, 'normal', true);
        success = true;
        break;
      } catch (err: any) {
        attempt++;
        const errMsg = err.message || String(err);
        const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("cooldown") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit") || errMsg.includes("No keys available");
        wasRateLimited = isRateLimit;

        if (isRateLimit && attempt < maxAttempts) {
          const waitSecs = 30;
          console.warn(`   -> ⚠️ Rate limited / cooldown (attempt ${attempt}/${maxAttempts}). Waiting ${waitSecs}s...`);
          await new Promise(r => setTimeout(r, waitSecs * 1000));
        } else {
          console.error(`   -> ❌ Enrichment failed after attempt ${attempt}:`, errMsg);
          break;
        }
      }
    }

    if (!success) {
      // Quota cạn liên tục → dừng hẳn run thay vì spin 7.5 phút/từ qua hàng nghìn từ
      if (wasRateLimited) {
        consecutiveRL++;
        if (consecutiveRL >= RL_ABORT) {
          console.warn(`\n🛑 ${consecutiveRL} từ liên tiếp fail vì rate-limit → quota cạn. Dừng tại ${successCount} từ đã ghi lượt này. Chạy lại sau khi quota reset.`);
          break;
        }
      }
      continue; // Skip to next word if this one failed
    }
    consecutiveRL = 0; // có 1 từ chạy được → reset chuỗi fail

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawText.trim());
      } catch {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI response is not valid JSON');
        parsed = JSON.parse(jsonMatch[0].trim());
      }

      console.log(`   -> AI translation: "${parsed.vietnamese}" (${parsed.pos})`);
      console.log(`   -> IPA: ${parsed.ipa}`);

      // Bỏ qua nếu AI không trả nghĩa (giữ nguyên placeholder, KHÔNG ghi rỗng)
      if (!parsed.vietnamese || !String(parsed.vietnamese).trim()) {
        console.warn(`   -> ⚠️ Bỏ qua: AI không trả nghĩa.`);
        continue;
      }

      // Chuẩn hóa IPA: bỏ rác (N/A/cannot/AI...), bóc slash thừa, bọc đúng 1 cặp /.../
      let bareIpa = String(parsed.ipa || '').trim();
      if (/n\/a|cannot|provide|\bAI\b|unknown|error|sorry/i.test(bareIpa) || bareIpa.length > 40) bareIpa = '';
      bareIpa = bareIpa.replace(/^\/+|\/+$/g, '').trim();
      const cleanIpa = bareIpa ? `/${bareIpa}/` : '';

      // Prepare enriched data object
      const enrichedData = {
        word: parsed.english || word,
        pronunciations: cleanIpa ? [{ ipa: cleanIpa }] : [],
        results: [{
          meanings: [{
            pos: parsed.pos || '',
            definition: parsed.vietnamese || '',
            example: parsed.example || '',
            collocations: []
          }]
        }],
        synonyms: parsed.synonyms || [],
        antonyms: parsed.antonyms || [],
        image_search_query: parsed.image_search_query || ''
      };

      // Update payload — luôn ghi data; ảnh chỉ resolve khi KHÔNG --no-image
      const updatePayload: Record<string, unknown> = { data: enrichedData };

      if (!NO_IMAGE) {
        console.log(`   -> Resolving image for "${word}"...`);
        let imgUrl: string | null = null;
        let imgSource = 'none';
        let imgConfidence: number | null = null;
        let imgQuery = '';
        try {
          const img = await resolveWordImage({
            word: word,
            pos: parsed.pos || '',
            definition: parsed.vietnamese || '',
            imageSearchQuery: parsed.image_search_query || '',
            meaningCount: 1
          });
          if (img.url && img.source !== 'none') {
            imgUrl = img.url;
            imgSource = img.source;
            imgConfidence = img.confidence;
            imgQuery = img.query;
            console.log(`   -> ✅ Image found: ${imgUrl} (Source: ${imgSource}, Confidence: ${imgConfidence})`);
          } else {
            console.log(`   -> ⚠️ No image found.`);
          }
        } catch (imgErr: any) {
          console.warn(`   -> ⚠️ Image resolution error:`, imgErr.message);
        }
        updatePayload.image_url = imgUrl;
        updatePayload.image_source = imgSource;
        updatePayload.image_confidence = imgConfidence;
        updatePayload.image_query = imgQuery;
        updatePayload.image_verified_at = imgUrl ? new Date().toISOString() : null;
      }

      // Update Supabase
      const { error: updateError } = await supabase
        .from('global_dictionary')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error(`   -> ❌ Database update error:`, updateError.message);
      } else {
        console.log(`   -> 🎉 Successfully enriched database entry for "${word}"!`);
        successCount++;
      }

    } catch (err: any) {
      console.error(`   -> ❌ Enrichment failed:`, err.message || String(err));
    }

    // Gentle sleep to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🏁 Enrichment finished! Successfully updated ${successCount}/${wordsToEnrich.length} words.`);
}

main().catch(err => {
  console.error('❌ Unhandled error in main execution:', err);
  process.exit(1);
});
