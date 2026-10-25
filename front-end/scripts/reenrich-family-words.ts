import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Re-enrich word-family cho 1 DANH SÁCH từ cụ thể, CHỈ dùng Gemini (chất lượng
 * cao hơn Groq llama-8b). Dùng dọn các từ bot/Groq sinh family rác.
 *
 * Chạy: cd web-app && npx tsx scripts/reenrich-family-words.ts word1 word2 ...
 */

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1].trim()] = v;
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const geminiKey = (process.env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean)[0];
if (!geminiKey) { console.error('❌ Cần GEMINI_API_KEY'); process.exit(1); }
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });

const words = process.argv.slice(2).map((w) => w.trim().toLowerCase()).filter(Boolean);
if (words.length === 0) { console.error('❌ Truyền danh sách từ.'); process.exit(1); }

async function main() {
  let ok = 0;
  for (const word of words) {
    const { data: row } = await supabase.from('global_dictionary').select('data').eq('word', word).maybeSingle();
    if (!row) { console.warn(`⚠️ "${word}" không có trong DB`); continue; }
    const headDef = row.data?.results?.[0]?.meanings?.[0]?.definition || '';

    const prompt = `You are a precise English-Vietnamese lexicographer. For headword "${word}"${headDef ? ` (meaning: "${headDef}")` : ''}, list its REAL word family — only derivational forms that genuinely exist in standard English dictionaries (include the headword). Do NOT invent forms.
Return ONLY: {"family":[{"word","pos","meaning"}]} — pos in noun|verb|adjective|adverb, meaning = concise Vietnamese of that form. If no real family exists, return {"family":[]}. JSON only.`;

    let parsed: any;
    try {
      const res = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
      const raw = res.response.text();
      try { parsed = JSON.parse(raw.trim()); } catch { parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)![0]); }
    } catch (e: any) { console.error(`❌ "${word}":`, e.message); continue; }

    const arr = Array.isArray(parsed) ? parsed : parsed.family;
    const family = (Array.isArray(arr) ? arr : [])
      .map((e: any) => ({
        word: String(e.word || '').trim().toLowerCase(),
        pos: String(e.pos || '').trim().toLowerCase() || undefined,
        meaning: String(e.meaning || '').trim() || undefined,
      }))
      .filter((e: any) => e.word && e.meaning);
    const seen = new Set<string>();
    const deduped = family.filter((e: any) => (seen.has(e.word) ? false : (seen.add(e.word), true)));

    const newData = deduped.length > 0
      ? { ...row.data, familyWords: deduped, familyChecked: undefined }
      : { ...row.data, familyChecked: true, familyWords: undefined };
    const { error } = await supabase.from('global_dictionary').update({ data: newData }).eq('word', word);
    if (error) console.error(`❌ db "${word}":`, error.message);
    else { console.log(`🎉 ${word}: ${deduped.map((f: any) => f.word + '=' + f.meaning).join(' | ') || '(no family)'}`); ok++; }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`\n🏁 ${ok}/${words.length} re-enriched.`);
}
main().catch((e) => { console.error('fatal:', e); process.exit(1); });
