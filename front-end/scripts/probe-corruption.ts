/**
 * Probe TẠM: quét toàn global_dictionary tìm 2 lớp lỗi user báo:
 *  - mojibake CP1252 (Ã©, â€¦, Â) + box-drawing (├ ╗ ║) — trên definition VÀ ipa
 *  - untranslated (definition thuần English)
 * Chỉ đọc, in báo cáo + mẫu. KHÔNG ghi.
 * Chạy (web-app/): npx tsx scripts/probe-corruption.ts
 */
import { readFileSync, existsSync } from 'node:fs';
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

const CP1252 = /Ã[\x80-\xbf]|â€|Â[\x80-\xbf°»«]|Ã©|Ã¨|Ä|Å/;       // UTF-8 đọc nhầm Latin1/CP1252
const BOX = /[─-▟]/;                                      // CP437/CP850 box-drawing
const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

interface Dict { results?: { meanings?: { definition?: string }[] }[]; pronunciations?: { ipa?: string }[] }

async function main() {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  let from = 0; const size = 1000; let total = 0;
  const c = { defMoji1252: 0, defBox: 0, ipaMoji1252: 0, ipaBox: 0, untranslated: 0, ipaEmpty: 0 };
  const samp = { defMoji1252: [] as string[], ipaMoji1252: [] as string[], ipaBox: [] as string[], untranslated: [] as string[] };

  while (true) {
    const { data, error } = await sb.from('global_dictionary').select('word, data').range(from, from + size - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      total++;
      const d = (row.data || {}) as Dict;
      const def = (d.results?.[0]?.meanings?.[0]?.definition || '').trim();
      const ipa = (d.pronunciations?.[0]?.ipa || '').trim();
      if (CP1252.test(def)) { c.defMoji1252++; if (samp.defMoji1252.length < 10) samp.defMoji1252.push(`${row.word}: ${def}`); }
      if (BOX.test(def)) c.defBox++;
      if (CP1252.test(ipa)) { c.ipaMoji1252++; if (samp.ipaMoji1252.length < 10) samp.ipaMoji1252.push(`${row.word}: ${ipa}`); }
      if (BOX.test(ipa)) { c.ipaBox++; if (samp.ipaBox.length < 10) samp.ipaBox.push(`${row.word}: ${ipa}`); }
      if (!ipa) c.ipaEmpty++;
      if (def && !VN.test(def) && /[a-z]/i.test(def) && def.split(/\s+/).length >= 3 && !CP1252.test(def) && !BOX.test(def)) {
        c.untranslated++; if (samp.untranslated.length < 10) samp.untranslated.push(`${row.word}: ${def}`);
      }
    }
    if (data.length < size) break;
    from += size;
  }

  console.log(`\n=== PROBE: ${total} rows global_dictionary ===`);
  console.log(JSON.stringify(c, null, 2));
  for (const [k, arr] of Object.entries(samp)) {
    if (arr.length) { console.log(`\n--- ${k} (mẫu ${arr.length}) ---`); arr.forEach((s) => console.log('  ' + s)); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
