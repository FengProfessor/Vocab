/**
 * Dịch lại nghĩa các từ còn để định nghĩa tiếng Anh (untranslated) trong tmp/quality-bad.json.
 * Gemini sinh nghĩa tiếng Việt NGẮN GỌN, update global_dictionary.data.results[0].meanings[0].definition.
 * Mặc định dry-run; backup trước --apply.
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/fix-untranslated.ts [--apply]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DRY = !process.argv.includes('--apply');
function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; } }
}
let KEYS: string[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
interface GeminiTranslation { vi?: Record<string, string> }
interface DictionaryData { results?: { meanings?: { definition?: string; [key: string]: unknown }[]; [key: string]: unknown }[]; [key: string]: unknown }
async function gemini(prompt: string, attempt = 0): Promise<string> {
  const g = new GoogleGenerativeAI(KEYS[attempt % KEYS.length]).getGenerativeModel({ model: 'gemini-flash-lite-latest', generationConfig: { responseMimeType: 'application/json' } });
  try { const r = await g.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }, { signal: AbortSignal.timeout(45000) }); return r.response.text(); }
  catch (error: unknown) { if (/429|quota|rate/i.test(errorMessage(error)) && attempt < 6) { await sleep(5000 * (attempt + 1)); return gemini(prompt, attempt + 1); } throw error; }
}

async function main() {
  loadEnv();
  KEYS = (process.env.GEMINI_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const bad = JSON.parse(readFileSync(path.join(process.cwd(), 'tmp/quality-bad.json'), 'utf8')) as { word: string; reason: string }[];
  const words = bad.filter((b) => b.reason === 'untranslated' || b.reason === 'missing').map((b) => b.word);
  console.log(`[fix-untranslated] ${words.length} từ. ${DRY ? 'DRY-RUN' : 'APPLY'}.`);
  if (words.length === 0) return;

  // Gemini dịch theo batch
  const trans = new Map<string, string>();
  const B = 40;
  for (let i = 0; i < words.length; i += B) {
    const group = words.slice(i, i + B);
    const prompt = `Dịch mỗi từ/cụm tiếng Anh sang nghĩa tiếng Việt NGẮN GỌN (2-6 từ, có thể vài nghĩa cách nhau dấu phẩy). Trả JSON {"vi":{"<word>":"nghĩa"}} đúng mọi từ. Từ: ${JSON.stringify(group)}`;
    let raw: string; try { raw = await gemini(prompt); } catch (error: unknown) { console.log('✗ batch: ' + errorMessage(error)); continue; }
    let obj: Record<string, string> = {};
    try { obj = (JSON.parse(raw) as GeminiTranslation).vi ?? {}; } catch { const mm = raw.match(/\{[\s\S]*\}/); if (mm) try { obj = (JSON.parse(mm[0]) as GeminiTranslation).vi ?? {}; } catch {} }
    for (const w of group) if (obj?.[w]) trans.set(w, String(obj[w]));
    await sleep(2000);
  }

  const backup: { word: string; data: unknown }[] = [];
  let okN = 0;
  const CH = 200;
  for (let i = 0; i < words.length; i += CH) {
    const slice = words.slice(i, i + CH);
    const { data } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    for (const row of data ?? []) {
      const vi = trans.get(row.word); if (!vi) continue;
      const d = structuredClone(row.data ?? {}) as DictionaryData;
      d.results = d.results ?? [{}]; d.results[0] = d.results[0] ?? {}; d.results[0].meanings = d.results[0].meanings ?? [{}];
      const oldDef = d.results[0].meanings[0]?.definition;
      backup.push({ word: row.word, data: JSON.parse(JSON.stringify(row.data)) });
      d.results[0].meanings[0] = { ...(d.results[0].meanings[0] ?? {}), definition: vi };
      okN++;
      if (i < CH && okN <= 8) console.log(`  ${row.word}: "${oldDef}" → "${vi}"`);
      if (!DRY) { const { error } = await sb.from('global_dictionary').update({ data: d }).eq('word', row.word); if (error) console.log(`  ✗ ${row.word}: ${error.message}`); }
    }
  }
  if (!DRY && backup.length) { const dir = path.join(process.cwd(), 'tmp'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, `untranslated-backup-${Date.now()}.json`), JSON.stringify(backup, null, 2), 'utf8'); }
  console.log(`\n[fix-untranslated] dịch ${trans.size} · update ${okN}.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
