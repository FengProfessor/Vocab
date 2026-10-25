/** Probe CEFR/openVocab coverage for Oxford 3000 headwords in global_dictionary. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function loadEnv() {
  const p = path.join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

function parseList(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[\r\n,]+/)) {
    let t = raw.trim().toLowerCase();
    if (!t || t.startsWith('#')) continue;
    t = t.replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ');
    if (t.length > 1 && t.length < 80) out.push(t);
  }
  return [...new Set(out)];
}

async function main() {
  loadEnv();
  const words = parseList(readFileSync(path.join(ROOT, 'scripts/lists/oxford-3000.txt'), 'utf8'));
  const set = new Set(words);
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const byCefr: Record<string, number> = { none: 0 };
  const withCefr: string[] = [];
  let found = 0;
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await sb.from('global_dictionary').select('word, data, tags').range(from, from + page - 1);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data as { word: string; data: { openVocab?: { cefr?: string; cefrMin?: string } } | null; tags: string[] | null }[]) {
      const w = String(r.word).toLowerCase();
      if (!set.has(w)) continue;
      found++;
      const c = r.data?.openVocab?.cefrMin ?? r.data?.openVocab?.cefr;
      if (!c) byCefr.none++;
      else {
        byCefr[c] = (byCefr[c] || 0) + 1;
        if (withCefr.length < 8) withCefr.push(`${w}:${c}`);
      }
    }
    if (data.length < page) break;
    from += page;
  }
  console.log(JSON.stringify({ list: words.length, found, byCefr, withCefr }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
