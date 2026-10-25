/**
 * Backfill synonyms / antonyms / word-family cho global_dictionary
 * theo kiểu đề xuất liên quan như TFlat (đồng nghĩa · trái nghĩa · họ từ).
 *
 * Nguồn:
 *  1) Datamuse (free, nhanh) → synonyms / antonyms tiếng Anh
 *  2) Groq/Gemini (AI router) → họ từ + nghĩa Việt ngắn
 *
 * Chạy (từ web-app):
 *   npx tsx scripts/backfill-related-tflat.ts --limit=300
 *   npx tsx scripts/backfill-related-tflat.ts --words=trash,important,run
 *   npx tsx scripts/backfill-related-tflat.ts --limit=50 --dry
 *   npx tsx scripts/backfill-related-tflat.ts --limit=200 --skip-family
 */

import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1].trim()] = v;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const LIMIT = parseInt(getArg('limit') || '300', 10);
const OFFSET = parseInt(getArg('offset') || '0', 10);
const DRY = process.argv.includes('--dry');
const SKIP_FAMILY = process.argv.includes('--skip-family');
const WORDS_ARG = getArg('words');
const DELAY_MS = parseInt(getArg('delay') || '350', 10);

type FamilyEntry = { word: string; pos?: string; meaning?: string };
type DictData = Record<string, unknown> & {
  synonyms?: string[];
  antonyms?: string[];
  familyWords?: FamilyEntry[] | string[];
  familyChecked?: boolean;
  synAntChecked?: boolean;
  results?: Array<{ meanings?: Array<{ definition?: string; pos?: string }> }>;
};

type Row = { id: string; word: string; data: DictData };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STOP = new Set(
  'a an the i me my we us our you your he him his she her it its they them their and or but if so to of in on at by for as is am are was were be been being do does did have has had not no yes oh ah hey hi tv cd dvd q x'.split(' '),
);

function isSingleWord(w: string): boolean {
  const s = w.toLowerCase();
  if (!/^[a-z][a-z'-]{1,30}$/i.test(s) || /\s/.test(s)) return false;
  if (STOP.has(s)) return false;
  if (s.length < 3) return false; // bỏ a/i/q — không enrich
  return true;
}

function cleanWordList(raw: unknown, head: string, max = 6): string[] {
  if (!Array.isArray(raw)) return [];
  const base = head.toLowerCase();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const w = String(item || '').trim().toLowerCase();
    if (!/^[a-z][a-z'-]{1,24}$/.test(w)) continue;
    if (w === base || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

function hasSyn(data: DictData): boolean {
  return Array.isArray(data.synonyms) && data.synonyms.length > 0;
}

function hasAnt(data: DictData): boolean {
  return Array.isArray(data.antonyms) && data.antonyms.length > 0;
}

function hasFamily(data: DictData): boolean {
  const fw = data.familyWords;
  if (!Array.isArray(fw) || fw.length === 0) return false;
  // object[] có meaning = already TFlat-quality
  if (fw.every((e) => typeof e === 'object' && e && typeof (e as FamilyEntry).word === 'string')) {
    return true;
  }
  // string[] cũ cũng coi là "có" — script có thể nâng cấp bằng --force-family sau
  return fw.some((e) => typeof e === 'string' && e.trim().length > 0);
}

function needsWork(data: DictData): boolean {
  const needSyn = !hasSyn(data) && data.synAntChecked !== true;
  const needAnt = !hasAnt(data) && data.synAntChecked !== true;
  const needFamily = !SKIP_FAMILY && !hasFamily(data) && data.familyChecked !== true;
  return needSyn || needAnt || needFamily;
}

/** Từ rác / nghĩa lệch / formal hiếm — không hợp learner TFlat */
const SYN_DENY = new Set([
  'folderol', 'trumpery', 'applesauce', 'wish-wash', 'pan', 'tripe',
  'tear', 'apart', 'scum', 'tacky', 'dirtbag', 'vulgar', 'rag',
  'wishwash', 'applesauce',
]);

async function fetchDatamuseWords(word: string, query: string): Promise<string[]> {
  const url = `https://api.datamuse.com/words?${query}=${encodeURIComponent(word)}&max=30`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ word?: string; score?: number }>;
    if (!Array.isArray(rows)) return [];
    const ranked = [...rows].sort((a, b) => (b.score || 0) - (a.score || 0));
    const base = word.toLowerCase();
    const out: string[] = [];
    const seen = new Set<string>();
    for (const row of ranked) {
      const w = (row.word || '').trim().toLowerCase();
      if (!/^[a-z][a-z'-]{1,24}$/.test(w)) continue;
      if (w === base || seen.has(w) || SYN_DENY.has(w)) continue;
      seen.add(w);
      out.push(w);
      if (out.length >= 8) break;
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Synonyms learner-friendly: ưu tiên `ml` (means-like) vì ranking tốt hơn `rel_syn`
 * (rel_syn cho trash → folderol trước rubbish).
 */
async function fetchSynonyms(word: string): Promise<string[]> {
  const [ml, syn] = await Promise.all([
    fetchDatamuseWords(word, 'ml'),
    fetchDatamuseWords(word, 'rel_syn'),
  ]);
  return cleanWordList([...ml, ...syn], word, 8);
}

async function fetchAntonyms(word: string): Promise<string[]> {
  return fetchDatamuseWords(word, 'rel_ant');
}

async function fetchFamilyAi(word: string, headDef: string): Promise<FamilyEntry[]> {
  const { getRouter } = await import('../src/lib/ai-router');
  const router = getRouter();
  const prompt = `You are a bilingual English-Vietnamese lexicographer for a learner dictionary (TFlat-style).
Headword: "${word}"${headDef ? ` (VI: "${headDef}")` : ''}.
List REAL word-family forms only (noun/verb/adjective/adverb that exist in standard English). Include the headword.

Return ONLY JSON:
{"family":[{"word":"form","pos":"noun|verb|adjective|adverb","meaning":"nghĩa Việt ngắn"}]}
Rules: max 6, no invented forms, meaning in Vietnamese, JSON only.`;

  const raw = await router.generate(prompt, 'fast', true);
  let parsed: { family?: unknown };
  try {
    parsed = JSON.parse(raw.trim()) as { family?: unknown };
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return [];
    parsed = JSON.parse(m[0]) as { family?: unknown };
  }
  const arr = Array.isArray(parsed.family) ? parsed.family : [];
  const out: FamilyEntry[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const w = String(o.word || '').trim().toLowerCase();
    const meaning = String(o.meaning || '').trim();
    const pos = String(o.pos || '').trim().toLowerCase() || undefined;
    if (!w || !meaning || seen.has(w)) continue;
    if (!/^[a-z][a-z'-]{0,24}$/.test(w)) continue;
    // Bỏ comparative/superlative rác (trashier, trashiest)
    if (/(ier|iest|er|est)$/.test(w) && w !== word) continue;
    seen.add(w);
    out.push({ word: w, pos, meaning });
    if (out.length >= 6) break;
  }
  return out;
}

async function fetchAllRows(): Promise<Row[]> {
  const rows: Row[] = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, data')
      .range(from, from + page - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...(data as Row[]));
    if (data.length < page) break;
    from += page;
  }
  return rows;
}

async function fetchByWords(words: string[]): Promise<Row[]> {
  const { data, error } = await supabase
    .from('global_dictionary')
    .select('id, word, data')
    .in('word', words);
  if (error) throw new Error(error.message);
  return (data || []) as Row[];
}

async function processRow(row: Row): Promise<'ok' | 'skip' | 'fail'> {
  const word = row.word.toLowerCase();
  if (!isSingleWord(word)) return 'skip';

  const data: DictData = { ...(row.data || {}) };
  if (!needsWork(data)) return 'skip';

  const needSyn = !hasSyn(data) && data.synAntChecked !== true;
  const needAnt = !hasAnt(data) && data.synAntChecked !== true;
  const needFamily = !SKIP_FAMILY && !hasFamily(data) && data.familyChecked !== true;
  const headDef = data.results?.[0]?.meanings?.[0]?.definition || '';

  // --words: luôn refresh syn/ant/family (sửa data rác trước đó)
  const force = Boolean(WORDS_ARG);
  let syn = hasSyn(data) && !force ? cleanWordList(data.synonyms, word) : [];
  let ant = hasAnt(data) && !force ? cleanWordList(data.antonyms, word) : [];
  let family: FamilyEntry[] = [];

  if (needSyn || needAnt || force) {
    const [dSyn, dAnt] = await Promise.all([
      (needSyn || force) ? fetchSynonyms(word) : Promise.resolve([] as string[]),
      (needAnt || force) ? fetchAntonyms(word) : Promise.resolve([] as string[]),
    ]);
    if (needSyn || force) {
      syn = cleanWordList([...dSyn, ...(force ? [] : data.synonyms || [])], word, 8);
    }
    if (needAnt || force) {
      ant = cleanWordList([...dAnt, ...(force ? [] : data.antonyms || [])], word, 8);
    }
  }

  if (needFamily || force) {
    try {
      family = await fetchFamilyAi(word, headDef);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`   ⚠️ family AI fail "${word}": ${msg}`);
    }
  }

  const next: DictData = { ...data };

  if (needSyn || needAnt) {
    if (syn.length) next.synonyms = syn;
    if (ant.length) next.antonyms = ant;
    // đánh dấu đã check kể cả khi Datamuse rỗng → tránh loop
    if (!syn.length && !ant.length) next.synAntChecked = true;
    else delete next.synAntChecked;
  }

  if (needFamily || force) {
    if (family.length) {
      next.familyWords = family;
      delete next.familyChecked;
    } else if (needFamily) {
      next.familyChecked = true;
    }
  }

  const changed =
    JSON.stringify(next.synonyms || []) !== JSON.stringify(data.synonyms || [])
    || JSON.stringify(next.antonyms || []) !== JSON.stringify(data.antonyms || [])
    || JSON.stringify(next.familyWords || []) !== JSON.stringify(data.familyWords || [])
    || next.synAntChecked !== data.synAntChecked
    || next.familyChecked !== data.familyChecked;

  if (!changed) return 'skip';

  console.log(
    `   → syn=[${(next.synonyms || []).join(', ')}] ant=[${(next.antonyms || []).join(', ')}] family=${Array.isArray(next.familyWords) ? next.familyWords.length : 0}`,
  );

  if (DRY) return 'ok';

  const { error } = await supabase.from('global_dictionary').update({ data: next }).eq('id', row.id);
  if (error) {
    console.error(`   ❌ db: ${error.message}`);
    return 'fail';
  }
  return 'ok';
}

async function main(): Promise<void> {
  console.log('══════════════════════════════════════════════');
  console.log(' TFlat-style related backfill (syn/ant/family)');
  console.log(` dry=${DRY} skipFamily=${SKIP_FAMILY} limit=${LIMIT} offset=${OFFSET}`);
  console.log('══════════════════════════════════════════════');

  let pending: Row[] = [];

  if (WORDS_ARG) {
    const list = WORDS_ARG.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    console.log(`📌 Mode --words (${list.length}): ${list.join(', ')}`);
    pending = await fetchByWords(list);
    // giữ thứ tự ưu tiên
    const map = new Map(pending.map((r) => [r.word.toLowerCase(), r]));
    pending = list.map((w) => map.get(w)).filter(Boolean) as Row[];
  } else {
    console.log('🔍 Fetch all global_dictionary...');
    const all = await fetchAllRows();
    console.log(`   total rows: ${all.length}`);
    pending = all
      .filter((r) => isSingleWord(r.word) && needsWork(r.data || {}))
      // ưu tiên từ ngắn phổ biến
      .sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));
    console.log(`   pending: ${pending.length}`);
    pending = pending.slice(OFFSET, OFFSET + LIMIT);
  }

  // luôn ưu tiên trash/rubbish/garbage nếu có trong batch words mode không — prepend nếu full scan
  if (!WORDS_ARG) {
    const boost = ['trash', 'rubbish', 'garbage', 'important', 'happy', 'run', 'make', 'good'];
    const boostRows = await fetchByWords(boost);
    const ids = new Set(pending.map((r) => r.id));
    for (const r of boostRows) {
      if (!ids.has(r.id) && needsWork(r.data || {})) pending.unshift(r);
    }
  }

  console.log(`🚀 Processing ${pending.length} rows${DRY ? ' [DRY]' : ''}\n`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const idx = `[${i + 1}/${pending.length}]`;
    process.stdout.write(`\n${idx} "${row.word}"`);
    try {
      const result = await processRow(row);
      if (result === 'ok') {
        ok++;
        console.log(' ✓');
      } else if (result === 'skip') {
        skip++;
        console.log(' · skip');
      } else {
        fail++;
        console.log(' ✗');
      }
    } catch (e) {
      fail++;
      console.log(' ✗', e instanceof Error ? e.message : e);
    }
    await sleep(DELAY_MS);
  }

  console.log('\n══════════════════════════════════════════════');
  console.log(` Done: ok=${ok} skip=${skip} fail=${fail}`);
  console.log('══════════════════════════════════════════════');

  // verify trash
  const { data: trash } = await supabase.from('global_dictionary').select('data').eq('word', 'trash').maybeSingle();
  if (trash?.data) {
    const d = trash.data as DictData;
    console.log('\n🔎 Verify trash:');
    console.log('  synonyms:', d.synonyms || []);
    console.log('  antonyms:', d.antonyms || []);
    console.log('  familyWords:', d.familyWords || []);
  }
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
