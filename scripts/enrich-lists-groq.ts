/**
 * Enrich wordlist files → global_dictionary bằng GROQ (né quota Gemini).
 * Đọc trực tiếp scripts/lists/<name>.txt, bỏ từ đã có trong DB, gọi Groq sinh
 * nghĩa VN + IPA + synonyms, upsert global_dictionary (shape DictionaryData).
 *
 * Chạy: npx tsx scripts/enrich-lists-groq.ts --list=esp-finance,gre-highfreq [--limit=N] [--model=llama-3.1-8b-instant]
 */
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// --- load .env.local manual (top-level import an toàn) ---
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1].trim()] = v;
  }
}

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_KEY = (process.env.GROQ_API_KEY || '').split(',')[0].trim();
if (!SUPA_URL || !SUPA_KEY) { console.error('[groq-enrich] thiếu Supabase env'); process.exit(1); }
if (!GROQ_KEY) { console.error('[groq-enrich] thiếu GROQ_API_KEY'); process.exit(1); }

const supabase = createClient(SUPA_URL, SUPA_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const arg = (n: string) => { const p = process.argv.find(a => a.startsWith(`--${n}=`)); return p ? p.split('=').slice(1).join('=') : undefined; };
const LISTS = (arg('list') || '').split(',').map(s => s.trim()).filter(Boolean);
const LIMIT = parseInt(arg('limit') || '100000', 10);
const MODEL = arg('model') || 'llama-3.1-8b-instant';
const WORDS = arg('words') || 'all'; // all | single | multi (theo số từ trong entry)
const LISTS_DIR = path.resolve(__dirname, 'lists');
if (LISTS.length === 0) { console.error('[groq-enrich] cần --list=a,b,c'); process.exit(1); }

function readList(name: string): string[] {
  const f = path.join(LISTS_DIR, `${name}.txt`);
  if (!fs.existsSync(f)) { console.warn(`[groq-enrich] không thấy ${f}`); return []; }
  return [...new Set(fs.readFileSync(f, 'utf8').split(/\r?\n|,/).map(w => w.trim().toLowerCase()).filter(Boolean))];
}

async function existingWords(words: string[]): Promise<Set<string>> {
  const present = new Set<string>();
  for (let i = 0; i < words.length; i += 200) {
    const chunk = words.slice(i, i + 200);
    const { data, error } = await supabase.from('global_dictionary').select('word').in('word', chunk);
    if (error) { console.warn('[groq-enrich] check existing lỗi:', error.message); continue; }
    for (const r of data || []) present.add((r as { word: string }).word.toLowerCase());
  }
  return present;
}

async function groq(prompt: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: 'json_object' } }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    return j?.choices?.[0]?.message?.content || '';
  } finally { clearTimeout(t); }
}

const PROMPT = (w: string) => `You are a bilingual English-Vietnamese dictionary. Analyze the word/phrase: "${w}".
Return ONLY a valid JSON object with these exact keys:
- "english": the English word (lowercase base form)
- "vietnamese": the most common Vietnamese meaning
- "ipa": IPA phonetic transcription (e.g. /ɪmˈpoʊz/)
- "pos": part of speech (noun/verb/adj/adv/phrase/idiom)
- "example": one natural English sentence illustrating usage
- "synonyms": array of 3-5 common English synonyms
- "antonyms": array of 3-5 common English antonyms
- "image_search_query": a 2-5 word descriptive English string representing a clear visual concept of this word.
Strict JSON only. No markdown fences.`;

async function main() {
  // gom + dedup mọi list
  const all = [...new Set(LISTS.flatMap(readList))];
  console.log(`[groq-enrich] ${LISTS.length} list → ${all.length} từ unique. Model=${MODEL}`);
  const present = await existingWords(all);
  const byType = (w: string) => WORDS === 'all' || (WORDS === 'multi' ? w.includes(' ') : !w.includes(' '));
  const todo = all.filter(w => !present.has(w) && byType(w)).slice(0, LIMIT);
  console.log(`[groq-enrich] filter words=${WORDS}`);
  console.log(`[groq-enrich] ${present.size} đã có DB, ${todo.length} cần enrich.`);

  let ok = 0, fail = 0, rl = 0;
  for (let i = 0; i < todo.length; i++) {
    const word = todo[i];
    const tag = LISTS.find(l => readList(l).includes(word)) || LISTS[0];
    try {
      const raw = await groq(PROMPT(word));
      let p: any;
      try { p = JSON.parse(raw.trim()); } catch { const m = raw.match(/\{[\s\S]*\}/); if (!m) throw new Error('not JSON'); p = JSON.parse(m[0]); }
      if (!p.vietnamese || !String(p.vietnamese).trim()) { console.warn(`  [${i + 1}/${todo.length}] "${word}" → AI no meaning, skip`); fail++; continue; }
      let ipa = String(p.ipa || '').trim();
      if (/n\/a|cannot|provide|\bAI\b|unknown|error|sorry/i.test(ipa) || ipa.length > 40) ipa = '';
      ipa = ipa.replace(/^\/+|\/+$/g, '').trim();
      const data = {
        word: p.english || word,
        pronunciations: ipa ? [{ ipa: `/${ipa}/` }] : [],
        results: [{ meanings: [{ pos: p.pos || '', definition: p.vietnamese, example: p.example || '', collocations: [] }] }],
        synonyms: p.synonyms || [], antonyms: p.antonyms || [], image_search_query: p.image_search_query || '',
      };
      const { error } = await supabase.from('global_dictionary').upsert(
        { word, data, tags: [tag, 'groq-enriched', 'scraped'] }, { onConflict: 'word', ignoreDuplicates: true });
      if (error) { console.error(`  [${i + 1}/${todo.length}] "${word}" upsert lỗi:`, error.message); fail++; }
      else { ok++; if (i % 20 === 0 || i < 5) console.log(`  ✓ [${i + 1}/${todo.length}] ${word} → ${p.vietnamese} ${ipa ? '/' + ipa + '/' : ''}`); }
      rl = 0;
    } catch (e: any) {
      const msg = e.message || String(e);
      if (/429|rate|quota|limit/i.test(msg)) { rl++; console.warn(`  ⚠️ rate-limit ${rl} ("${word}") → wait 20s`); await new Promise(r => setTimeout(r, 20000)); if (rl >= 8) { console.warn('🛑 quota Groq cạn, dừng'); break; } i--; continue; }
      console.error(`  ✗ "${word}":`, msg); fail++;
    }
    await new Promise(r => setTimeout(r, 2100)); // ~28 req/min, dưới Groq free 30 RPM
  }
  console.log(`\n[groq-enrich] DONE: ${ok} enriched, ${fail} fail / ${todo.length}`);
}
main().catch(e => { console.error('[groq-enrich] fatal:', e); process.exit(1); });
