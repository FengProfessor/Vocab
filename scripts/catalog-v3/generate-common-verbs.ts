/**
 * Merge pack "100–300 động từ hay gặp" vào extra-vocab.json (append/replace by sourceKey).
 * - Route riêng: common-verbs (ngoài chủ đề đời sống)
 * - Giữ THỨ TỰ tần suất (không sort A–Z)
 * - Chia 3 band × 100 từ → mỗi band 2 subtopic ~50 từ → micro-pack 15 trong generate.ts
 *
 * Chạy (web-app/): npx tsx scripts/catalog-v3/generate-common-verbs.ts
 * Sau đó: npx tsx scripts/catalog-v3/generate.ts
 *          npx tsx scripts/catalog-v3/quality-gate.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const LIST_FILE = path.join(ROOT, 'scripts/lists/common-verbs-freq.txt');
const EXTRA_FILE = path.join(ROOT, 'src/data/vocab/extra-vocab.json');

const SOURCE_PREFIX = 'common-verbs-freq::';
const TARGET_TOTAL = 300;
const BAND = 100;
const CHUNK = 50; // ~3–4 micro-packs × 15

const MOJIBAKE = /[─-╿]|ß[╗║╔╝┤┐]|├[│¼┤]|─[ä]/;
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

interface ExtraSubtopic {
  sourcePackage: string;
  sourceKey: string;
  routeId: string;
  topicKey: string;
  title: string;
  attribution: string;
  words: string[];
}

interface ExtraManifest {
  schemaVersion: number;
  catalogNote: string;
  generatedFrom: string[];
  readyDictCount: number;
  listWordSlots: number;
  dictVaultSlots: number;
  subtopics: ExtraSubtopic[];
}

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

function validMeaning(def?: string): boolean {
  if (!def || def.includes('⏳') || MOJIBAKE.test(def)) return false;
  const t = def.trim();
  if (!t) return false;
  return VN_CHARS.test(t) || (!(/[a-z]/i.test(t) && t.split(/\s+/).length >= 3));
}

/** Giữ thứ tự file, dedupe lần xuất hiện đầu. */
function parseFreqList(filePath: string): string[] {
  const text = readFileSync(filePath, 'utf8');
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\r\n]+/)) {
    let t = raw.trim().toLowerCase();
    if (!t || t.startsWith('#') || t.startsWith('//')) continue;
    t = t.replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim();
    if (t.length < 2 || t.length >= 80) continue;
    if (!/^[a-z][a-z'\-]*$/i.test(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

async function loadReady(words: string[]): Promise<Set<string>> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[common-verbs] no Supabase env — keep all list words (no ready filter)');
    return new Set(words);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const ready = new Set<string>();
  const CHUNK_Q = 400;
  for (let i = 0; i < words.length; i += CHUNK_Q) {
    const slice = words.slice(i, i + CHUNK_Q);
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    if (error) throw new Error('global_dictionary: ' + error.message);
    for (const row of (data ?? []) as { word: string; data: { results?: { meanings?: { definition?: string }[] }[] } | null }[]) {
      const def = row.data?.results?.[0]?.meanings?.[0]?.definition;
      if (validMeaning(def)) ready.add(String(row.word).toLowerCase());
    }
  }
  return ready;
}

function topicKeyForIndex(start1: number): string {
  if (start1 <= 100) return 'freq-1-100';
  if (start1 <= 200) return 'freq-101-200';
  return 'freq-201-300';
}

function bandLabel(start1: number, end1: number): string {
  return `Động từ ${start1}–${end1}`;
}

async function main(): Promise<void> {
  if (!existsSync(LIST_FILE)) throw new Error('Missing ' + LIST_FILE);
  const all = parseFreqList(LIST_FILE);
  console.log(`[common-verbs] list unique ordered: ${all.length}`);

  const ready = await loadReady(all);
  // Giữ thứ tự tần suất; chỉ bỏ từ chưa có nghĩa VI
  const filtered = all.filter((w) => ready.has(w));
  const dropped = all.filter((w) => !ready.has(w));
  if (dropped.length) {
    console.warn(`[common-verbs] drop (no ready meaning): ${dropped.length} → ${dropped.slice(0, 20).join(', ')}${dropped.length > 20 ? '…' : ''}`);
  }

  const words = filtered.slice(0, TARGET_TOTAL);
  console.log(`[common-verbs] ready ordered: ${words.length}`);

  const attribution =
    'High-frequency lexical verbs (COCA/NGSL-style + A1 core). Không phrasal. Nghĩa từ global_dictionary LingoPro.';

  const newSubs: ExtraSubtopic[] = [];
  let part = 0;
  for (let i = 0; i < words.length; i += CHUNK) {
    const slice = words.slice(i, i + CHUNK);
    if (slice.length < 10) break;
    part += 1;
    const start1 = i + 1;
    const end1 = i + slice.length;
    newSubs.push({
      sourcePackage: 'list-verbs',
      sourceKey: `${SOURCE_PREFIX}${part}`,
      routeId: 'common-verbs',
      topicKey: topicKeyForIndex(start1),
      title: bandLabel(start1, end1),
      attribution,
      words: slice,
    });
  }

  let manifest: ExtraManifest;
  if (existsSync(EXTRA_FILE)) {
    manifest = JSON.parse(readFileSync(EXTRA_FILE, 'utf8')) as ExtraManifest;
  } else {
    manifest = {
      schemaVersion: 1,
      catalogNote: 'Append-only list + dict-ready packs.',
      generatedFrom: [],
      readyDictCount: 0,
      listWordSlots: 0,
      dictVaultSlots: 0,
      subtopics: [],
    };
  }

  const kept = manifest.subtopics.filter((s) => !s.sourceKey.startsWith(SOURCE_PREFIX));
  const oldSlots = manifest.subtopics
    .filter((s) => s.sourceKey.startsWith(SOURCE_PREFIX))
    .reduce((n, s) => n + s.words.length, 0);
  const newSlots = newSubs.reduce((n, s) => n + s.words.length, 0);

  const genFrom = new Set(manifest.generatedFrom ?? []);
  genFrom.add('scripts/lists/common-verbs-freq.txt');

  manifest.subtopics = [...kept, ...newSubs];
  manifest.generatedFrom = [...genFrom];
  manifest.listWordSlots = (manifest.listWordSlots ?? 0) - oldSlots + newSlots;
  manifest.catalogNote =
    'Append-only list + dict-ready packs. Includes common-verbs route (100–300 động từ hay gặp).';

  writeFileSync(EXTRA_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `[common-verbs] wrote ${newSubs.length} subtopics · ${newSlots} words → ${EXTRA_FILE}`,
  );
  for (const s of newSubs) {
    console.log(`  ${s.sourceKey} · ${s.topicKey} · ${s.title} · n=${s.words.length}`);
  }
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
