/**
 * Dịch lại nghĩa các từ trong TOÀN BỘ global_dictionary còn để định nghĩa tiếng Anh (untranslated).
 * Gemini sinh nghĩa tiếng Việt NGẮN GỌN → update data.results[0].meanings[0].definition.
 * Mặc định DRY-RUN; backup trước --apply.
 * Chạy (web-app/): npx tsx scripts/fix-untranslated-all.ts [--apply] [--limit=N]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DRY = !process.argv.includes('--apply');
const LIMIT = parseInt((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0', 10);
const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
const BOX = /[─-▟]/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; } }
}

let KEYS: string[] = [];
interface Tr { vi?: Record<string, string> }
interface Dict { results?: { meanings?: { definition?: string; [k: string]: unknown }[]; [k: string]: unknown }[]; [k: string]: unknown }

async function gemini(prompt: string, attempt = 0): Promise<string> {
  const g = new GoogleGenerativeAI(KEYS[attempt % KEYS.length]).getGenerativeModel({ model: 'gemini-flash-lite-latest', generationConfig: { responseMimeType: 'application/json' } });
  try { const r = await g.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }, { signal: AbortSignal.timeout(45000) }); return r.response.text(); }
  catch (e: unknown) { if (/429|quota|rate/i.test(errMsg(e)) && attempt < 6) { await sleep(5000 * (attempt + 1)); return gemini(prompt, attempt + 1); } throw e; }
}

function isUntranslated(def: string | undefined): boolean {
  const d = (def ?? '').trim();
  return !!d && !VN.test(d) && !BOX.test(d) && /[a-z]/i.test(d) && d.split(/\s+/).length >= 3;
}

async function main() {
  loadEnv();
  KEYS = (process.env.GEMINI_API_KEY || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!KEYS.length) throw new Error('thiếu GEMINI_API_KEY');
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  // 1) gom tất cả từ untranslated từ toàn DB
  console.log('[fix-untranslated-all] quét toàn global_dictionary...');
  let from = 0; const size = 1000;
  const targets: { word: string; def: string }[] = [];
  while (true) {
    const { data, error } = await sb.from('global_dictionary').select('word, data').range(from, from + size - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) { const def = (row.data as Dict | null)?.results?.[0]?.meanings?.[0]?.definition; if (isUntranslated(def)) targets.push({ word: row.word, def: def! }); }
    if (data.length < size) break;
    from += size;
  }
  let words = targets.map((t) => t.word);
  if (LIMIT > 0) words = words.slice(0, LIMIT);
  console.log(`[fix-untranslated-all] ${words.length} từ untranslated. ${DRY ? 'DRY-RUN' : 'APPLY'}.`);
  if (!words.length) return;

  // 2) Gemini dịch batch
  const trans = new Map<string, string>();
  const B = 40;
  for (let i = 0; i < words.length; i += B) {
    const group = words.slice(i, i + B);
    const prompt = `Dịch mỗi từ/cụm tiếng Anh sang nghĩa tiếng Việt NGẮN GỌN (2-6 từ, có thể vài nghĩa cách nhau dấu phẩy). Trả JSON {"vi":{"<word>":"nghĩa"}} đúng mọi từ. Từ: ${JSON.stringify(group)}`;
    let raw: string; try { raw = await gemini(prompt); } catch (e: unknown) { console.log(`✗ batch ${i}: ` + errMsg(e)); continue; }
    let obj: Record<string, string> = {};
    try { obj = (JSON.parse(raw) as Tr).vi ?? {}; } catch { const mm = raw.match(/\{[\s\S]*\}/); if (mm) try { obj = (JSON.parse(mm[0]) as Tr).vi ?? {}; } catch {} }
    for (const w of group) if (obj?.[w]) trans.set(w, String(obj[w]));
    if (i % 400 === 0) console.log(`  ...${i + group.length}/${words.length} (dịch được ${trans.size})`);
    await sleep(1500);
  }

  // 3) ghi DB
  const backup: { word: string; data: unknown }[] = [];
  let okN = 0; const CH = 200;
  for (let i = 0; i < words.length; i += CH) {
    const slice = words.slice(i, i + CH);
    const { data } = await sb.from('global_dictionary').select('id, word, data').in('word', slice);
    for (const row of data ?? []) {
      const vi = trans.get(row.word); if (!vi) continue;
      const d = structuredClone(row.data ?? {}) as Dict;
      d.results = d.results ?? [{}]; d.results[0] = d.results[0] ?? {}; d.results[0].meanings = d.results[0].meanings ?? [{}];
      const oldDef = d.results[0].meanings![0]?.definition;
      backup.push({ word: row.word, data: JSON.parse(JSON.stringify(row.data)) });
      d.results[0].meanings![0] = { ...(d.results[0].meanings![0] ?? {}), definition: vi };
      okN++;
      if (okN <= 12) console.log(`  ${row.word}: "${oldDef}" → "${vi}"`);
      if (!DRY) { const { error } = await sb.from('global_dictionary').update({ data: d }).eq('id', (row as any).id); if (error) console.log(`  ✗ ${row.word}: ${error.message}`); }
    }
  }
  if (!DRY && backup.length) { const dir = path.join(process.cwd(), 'tmp'); if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, `untranslated-all-backup-${Date.now()}.json`), JSON.stringify(backup, null, 2), 'utf8'); }
  console.log(`\n[fix-untranslated-all] dịch ${trans.size} · update ${okN}.${DRY ? ' (DRY — chạy --apply để ghi)' : ''}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
