/**
 * Đo % từ có example tiếng Anh trong global_dictionary (Oxford 3000 + sample catalog).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function loadEnv(): void {
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

type Row = {
  word: string;
  data: {
    results?: {
      meanings?: {
        definition?: string;
        example?: string;
        examples?: string[];
      }[];
      examples?: { text?: string; example?: string }[];
    }[];
    example?: string;
    examples?: string[];
  } | null;
};

function extractExamples(r: Row): string[] {
  const out: string[] = [];
  const d = r.data;
  if (!d) return out;
  if (typeof d.example === 'string' && d.example.trim()) out.push(d.example.trim());
  if (Array.isArray(d.examples)) {
    for (const e of d.examples) if (typeof e === 'string' && e.trim()) out.push(e.trim());
  }
  for (const res of d.results ?? []) {
    if (Array.isArray(res.examples)) {
      for (const e of res.examples) {
        const t = e?.text ?? e?.example;
        if (typeof t === 'string' && t.trim()) out.push(t.trim());
      }
    }
    for (const m of res.meanings ?? []) {
      if (typeof m.example === 'string' && m.example.trim()) out.push(m.example.trim());
      if (Array.isArray(m.examples)) {
        for (const e of m.examples) if (typeof e === 'string' && e.trim()) out.push(e.trim());
      }
    }
  }
  return [...new Set(out)];
}

const EN = /[a-zA-Z]{2,}/;
const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function isEnglishExample(s: string): boolean {
  if (!EN.test(s)) return false;
  // pure VN short gloss → not sentence example
  if (VN.test(s) && !/[.!?]|^\s*[A-Z]/.test(s) && s.split(/\s+/).length < 4) return false;
  return s.split(/\s+/).length >= 3 || /[.!?]/.test(s);
}

async function fetchWords(sb: ReturnType<typeof createClient>, words: string[]): Promise<Map<string, Row>> {
  const map = new Map<string, Row>();
  const CHUNK = 400;
  for (let i = 0; i < words.length; i += CHUNK) {
    const slice = words.slice(i, i + CHUNK);
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    if (error) throw new Error(error.message);
    for (const r of (data ?? []) as Row[]) map.set(String(r.word).toLowerCase(), r);
  }
  return map;
}

function summarize(label: string, words: string[], map: Map<string, Row>): void {
  let inDict = 0;
  let withAnyEx = 0;
  let withEnEx = 0;
  let withVnDef = 0;
  const missingEx: string[] = [];
  const samples: { word: string; ex: string }[] = [];
  for (const w of words) {
    const r = map.get(w);
    if (!r) continue;
    inDict++;
    const def = r.data?.results?.[0]?.meanings?.[0]?.definition ?? '';
    if (def && VN.test(def)) withVnDef++;
    const exs = extractExamples(r);
    if (exs.length) withAnyEx++;
    const en = exs.filter(isEnglishExample);
    if (en.length) {
      withEnEx++;
      if (samples.length < 5) samples.push({ word: w, ex: en[0].slice(0, 100) });
    } else if (missingEx.length < 15) missingEx.push(w);
  }
  const pct = (n: number) => (inDict ? `${((100 * n) / inDict).toFixed(1)}%` : 'n/a');
  console.log(`\n=== ${label} ===`);
  console.log(`list=${words.length} inDict=${inDict}`);
  console.log(`VN def: ${withVnDef} (${pct(withVnDef)})`);
  console.log(`any example field: ${withAnyEx} (${pct(withAnyEx)})`);
  console.log(`EN example (sentence-ish): ${withEnEx} (${pct(withEnEx)})`);
  console.log(`missing EN ex sample: ${missingEx.join(', ')}`);
  console.log('EN samples:', samples);
}

async function main(): Promise<void> {
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

  const oxford = parseList(readFileSync(path.join(ROOT, 'scripts/lists/oxford-3000.txt'), 'utf8'));
  const oxMap = await fetchWords(sb, oxford);
  summarize('Oxford 3000', oxford, oxMap);

  // random 500 from full GD for baseline
  let from = 0;
  const sample: string[] = [];
  while (sample.length < 800) {
    const { data, error } = await sb.from('global_dictionary').select('word, data').range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data as Row[]) sample.push(String(r.word).toLowerCase());
    from += 1000;
    if (data.length < 1000) break;
  }
  const slice = sample.filter((_, i) => i % Math.ceil(sample.length / 500) === 0).slice(0, 500);
  const sMap = new Map(sample.map((w, i) => {
    // re-fetch not needed — we only have words; fetch properly
    return [w, null as unknown as Row];
  }));
  void sMap;
  const map500 = await fetchWords(sb, slice);
  summarize('GD sample ~500', slice, map500);

  // inspect one rich entry shape
  const probe = oxMap.get('abandon') ?? oxMap.get('ability') ?? [...oxMap.values()][0];
  if (probe) {
    console.log('\n=== raw shape sample ===', probe.word);
    console.log(JSON.stringify(probe.data, null, 2)?.slice(0, 1200));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
