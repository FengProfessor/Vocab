/**
 * Quét chất lượng nghĩa của TỪ TRONG CATALOG (global_dictionary.data) → tìm:
 *  - mojibake (hỏng UTF-8: box-drawing U+2500-257F, ß, các chuỗi mis-decode)
 *  - chưa dịch (definition thuần English, không có ký tự tiếng Việt)
 *  - rỗng / placeholder
 * Xuất danh sách word cần re-enrich → tmp/quality-bad.json
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/scan-quality.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) { let v = m[2]; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v; }
  }
}

const MOJIBAKE = /[─-╿]|ß[╗║╔╝┤┐]|├[│¼┤]|─[ä]/; // box-drawing hoặc chuỗi mis-decode đặc trưng
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function classify(def: string | undefined): 'ok' | 'empty' | 'mojibake' | 'untranslated' {
  const d = (def ?? '').trim();
  if (!d || d.includes('⏳')) return 'empty';
  if (MOJIBAKE.test(d)) return 'mojibake';
  // chưa dịch: có chữ Latin nhưng KHÔNG có ký tự tiếng Việt nào, và dài như câu English
  if (!VN_CHARS.test(d) && /[a-z]/i.test(d) && d.split(/\s+/).length >= 3) return 'untranslated';
  return 'ok';
}

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const cat = JSON.parse(readFileSync(path.join(process.cwd(), 'src/data/vocab/catalog-v3.json'), 'utf8'));
  const words: string[] = [...new Set((cat.packs as any[]).flatMap((p) => p.words.map((w: any) => w.word)))];

  const bad: { word: string; reason: string; def: string }[] = [];
  const counts: Record<string, number> = { ok: 0, empty: 0, mojibake: 0, untranslated: 0, missing: 0 };
  const CH = 400;
  for (let i = 0; i < words.length; i += CH) {
    const slice = words.slice(i, i + CH);
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    if (error) throw new Error(error.message);
    const m = new Map((data ?? []).map((r: any) => [r.word.toLowerCase(), r]));
    for (const w of slice) {
      const r: any = m.get(w);
      if (!r) { counts.missing++; bad.push({ word: w, reason: 'missing', def: '' }); continue; }
      const def = r.data?.results?.[0]?.meanings?.[0]?.definition;
      const c = classify(def);
      counts[c]++;
      if (c !== 'ok') bad.push({ word: w, reason: c, def: def ?? '' });
    }
  }

  const outDir = path.join(process.cwd(), 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'quality-bad.json'), JSON.stringify(bad, null, 2), 'utf8');
  console.log(`[scan] ${words.length} từ catalog · ` + Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' '));
  console.log(`  → cần re-enrich: ${bad.length} → tmp/quality-bad.json`);
  console.log('  mojibake mẫu:', bad.filter((b) => b.reason === 'mojibake').slice(0, 6).map((b) => b.word).join(', '));
  console.log('  untranslated mẫu:', bad.filter((b) => b.reason === 'untranslated').slice(0, 6).map((b) => b.word).join(', '));
}
main().catch((e) => { console.error(e); process.exit(1); });
