/**
 * Catalog expand (option C):
 *  A) Wire free lists (Oxford 3000 headwords, AWL, IELTS/TOEIC lists) → subtopics
 *  B) Packs từ global_dictionary (chỉ entry đã có nghĩa VI hợp lệ)
 *
 * Chỉ lấy từ READY trong GD → quality-gate publish 100% nghĩa.
 * Identity ổn định: sourceKey cố định theo list+chunkIndex (append-only).
 *
 * Chạy: npx tsx scripts/catalog-v3/generate-extra-vocab.ts
 * Xuất: src/data/vocab/extra-vocab.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { allOxfordThemeDefs, groupOxfordByTheme } from './oxford-themes.ts';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '../..');
const LISTS_DIR = path.join(ROOT, 'scripts/lists');
const OUT_FILE = path.join(ROOT, 'src/data/vocab/extra-vocab.json');
const CATALOG_FILE = path.join(ROOT, 'src/data/vocab/catalog-v3.json');

const TARGET_SUB = 60; // ~4 packs × 15
const MIN_SUB = 30;
const MAX_SUB = 90;

type SourcePackage =
  | 'list-oxford'
  | 'list-awl'
  | 'list-ielts'
  | 'list-toeic'
  | 'list-academic'
  | 'list-phrasal'
  | 'list-exam'
  | 'list-verbs'
  | 'dict-ready';

interface ListSpec {
  file: string;
  sourcePackage: SourcePackage;
  routeId: string;
  topicKey: string;
  titleBase: string;
  attribution: string;
}

/** Thứ tự ưu tiên: foundation → exam → academic extras → dict vault. */
/** Oxford xử lý riêng (theo theme) — không nằm LIST_SPECS A–Z. */
const OXFORD_LIST = {
  file: 'oxford-3000.txt',
  sourcePackage: 'list-oxford' as const,
  routeId: 'oxford-core',
  attribution:
    'Headwords Oxford 3000™ — gom theo chủ đề học (không A–Z). Nghĩa/ảnh từ global_dictionary LingoPro.',
};

const LIST_SPECS: ListSpec[] = [
  // common-verbs-freq.txt: xử lý riêng (giữ thứ tự tần suất + 3 topic band) — xem buildCommonVerbSubs()
  {
    file: 'academic-word-list.txt',
    sourcePackage: 'list-awl',
    routeId: 'ielts',
    topicKey: 'awl',
    titleBase: 'Academic Word List (AWL)',
    attribution: 'Coxhead Academic Word List (educational use). Nghĩa từ global_dictionary.',
  },
  {
    file: 'nawl-academic.txt',
    sourcePackage: 'list-academic',
    routeId: 'ielts',
    topicKey: 'nawl',
    titleBase: 'NAWL',
    attribution: 'New Academic Word List (Browne et al.). Nghĩa từ global_dictionary.',
  },
  {
    file: 'ielts-band7-8.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'band7',
    titleBase: 'IELTS Band 7–8',
    attribution: 'List nội bộ LingoPro (IELTS Academic band 7–8).',
  },
  {
    file: 'ielts-advanced-band7.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'advanced',
    titleBase: 'IELTS Advanced',
    attribution: 'List nội bộ LingoPro (IELTS advanced).',
  },
  {
    file: 'ielts-topic-vocab.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'topics-extra',
    titleBase: 'IELTS Topics Extra',
    attribution: 'List nội bộ (NLM-grounded IELTS topics).',
  },
  {
    file: 'ielts-task1-data.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'task1',
    titleBase: 'IELTS Writing Task 1',
    attribution: 'List nội bộ (IELTS Writing Task 1 data language).',
  },
  {
    file: 'ielts-speaking-idioms.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'speaking-idioms',
    titleBase: 'IELTS Speaking Idioms',
    attribution: 'List nội bộ (IELTS Speaking idioms).',
  },
  {
    file: 'ielts-academic.txt',
    sourcePackage: 'list-ielts',
    routeId: 'ielts',
    topicKey: 'academic-core',
    titleBase: 'IELTS Academic Core',
    attribution: 'List nội bộ (IELTS academic core).',
  },
  {
    file: 'toeic-600.txt',
    sourcePackage: 'list-toeic',
    routeId: 'toeic',
    topicKey: 'essential-600',
    titleBase: 'TOEIC Essential',
    attribution: 'List nội bộ (TOEIC essential core).',
  },
  {
    file: 'toeic-2026.txt',
    sourcePackage: 'list-toeic',
    routeId: 'toeic',
    topicKey: 'toeic-2026',
    titleBase: 'TOEIC 2026',
    attribution: 'List nội bộ (TOEIC 2023–26 enrichment).',
  },
  {
    file: 'business-english-core.txt',
    sourcePackage: 'list-toeic',
    routeId: 'toeic',
    topicKey: 'business-core',
    titleBase: 'Business English Core',
    attribution: 'List nội bộ (business English core).',
  },
  {
    file: 'cambridge-c1-advanced.txt',
    sourcePackage: 'list-academic',
    routeId: 'hoc-thuat',
    topicKey: 'c1-advanced',
    titleBase: 'Cambridge C1',
    attribution: 'List nội bộ (Cambridge C1 headwords seed).',
  },
  {
    file: 'phrasal-verbs-essential.txt',
    sourcePackage: 'list-phrasal',
    routeId: 'hoc-thuat',
    topicKey: 'phrasal-essential',
    titleBase: 'Phrasal Verbs Essential',
    attribution: 'List nội bộ (essential phrasal verbs).',
  },
  {
    file: 'phrasal-verbs-advanced.txt',
    sourcePackage: 'list-phrasal',
    routeId: 'hoc-thuat',
    topicKey: 'phrasal-advanced',
    titleBase: 'Phrasal Verbs Advanced',
    attribution: 'List nội bộ (advanced phrasal verbs).',
  },
  {
    file: 'academic-collocations.txt',
    sourcePackage: 'list-academic',
    routeId: 'hoc-thuat',
    topicKey: 'academic-colloc',
    titleBase: 'Academic Collocations',
    attribution: 'List nội bộ (academic collocations).',
  },
  {
    file: 'vstep-b1-b2.txt',
    sourcePackage: 'list-exam',
    routeId: 'extended',
    topicKey: 'vstep',
    titleBase: 'VSTEP B1–B2',
    attribution: 'List nội bộ (VSTEP B1–B2).',
  },
  {
    file: 'thpt-quoc-gia-core.txt',
    sourcePackage: 'list-exam',
    routeId: 'extended',
    topicKey: 'thpt-qg',
    titleBase: 'THPT Quốc gia Core',
    attribution: 'List nội bộ (THPT QG core).',
  },
  {
    file: 'thpt-2026-reform.txt',
    sourcePackage: 'list-exam',
    routeId: 'extended',
    topicKey: 'thpt-2026',
    titleBase: 'THPT 2026 Reform',
    attribution: 'List nội bộ (THPT GDPT 2018 reform prep).',
  },
];

interface ExtraSubtopic {
  sourcePackage: SourcePackage;
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

const MOJIBAKE = /[─-╿]|ß[╗║╔╝┤┐]|├[│¼┤]|─[ä]/;
const VN_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function validMeaning(def?: string): boolean {
  if (!def || def.includes('⏳') || MOJIBAKE.test(def)) return false;
  const t = def.trim();
  if (!t) return false;
  return VN_CHARS.test(t) || (!(/[a-z]/i.test(t) && t.split(/\s+/).length >= 3));
}

function parseListFile(filePath: string): string[] {
  const text = readFileSync(filePath, 'utf8');
  const out: string[] = [];
  for (const raw of text.split(/[\r\n,]+/)) {
    let t = raw.trim().toLowerCase();
    if (!t || t.startsWith('#') || t.startsWith('//')) continue;
    t = t.replace(/^\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim();
    if (t.length > 1 && t.length < 80 && /^[a-z][a-z\s'\-]*$/i.test(t)) out.push(t);
  }
  return [...new Set(out)].sort((a, b) => a.localeCompare(b, 'en'));
}

/** Giữ thứ tự tần suất (không A–Z). */
function parseFreqOrderedList(filePath: string): string[] {
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

function buildCommonVerbSubs(
  ready: Set<string>,
  usedInLists: Set<string>,
): { subs: ExtraSubtopic[]; from: string; slots: number } {
  const fp = path.join(LISTS_DIR, 'common-verbs-freq.txt');
  if (!existsSync(fp)) return { subs: [], from: '', slots: 0 };
  const all = parseFreqOrderedList(fp);
  const words = all.filter((w) => ready.has(w) && !usedInLists.has(w)).slice(0, 300);
  for (const w of words) usedInLists.add(w);

  const attribution =
    'High-frequency lexical verbs (COCA/NGSL-style + A1 core). Không phrasal. Nghĩa từ global_dictionary LingoPro.';
  const CHUNK = 50;
  const subs: ExtraSubtopic[] = [];
  let part = 0;
  for (let i = 0; i < words.length; i += CHUNK) {
    const slice = words.slice(i, i + CHUNK);
    if (slice.length < 10) break;
    part += 1;
    const start1 = i + 1;
    const end1 = i + slice.length;
    const topicKey =
      start1 <= 100 ? 'freq-1-100' : start1 <= 200 ? 'freq-101-200' : 'freq-201-300';
    subs.push({
      sourcePackage: 'list-verbs',
      sourceKey: `common-verbs-freq::${part}`,
      routeId: 'common-verbs',
      topicKey,
      title: `Động từ ${start1}–${end1}`,
      attribution,
      words: slice,
    });
  }
  console.log(`[extra] common-verbs-freq: list=${all.length} ready=${words.length} subs=${subs.length}`);
  return {
    subs,
    from: 'scripts/lists/common-verbs-freq.txt',
    slots: words.length,
  };
}

function splitBalanced(words: string[], target = TARGET_SUB): string[][] {
  if (words.length === 0) return [];
  if (words.length <= MAX_SUB) {
    if (words.length < MIN_SUB && words.length >= 10) return [words];
    if (words.length < 10) return [];
    return [words];
  }
  const n = Math.ceil(words.length / target);
  const base = Math.floor(words.length / n);
  const extra = words.length % n;
  const chunks: string[][] = [];
  let i = 0;
  for (let c = 0; c < n; c++) {
    const size = base + (c < extra ? 1 : 0);
    const slice = words.slice(i, i + size);
    i += size;
    if (slice.length >= 10) chunks.push(slice);
  }
  return chunks;
}

/**
 * Baseline = từ đã có trong pro3m / plus / exam (KHÔNG dùng catalog-v3 full).
 * Tránh vòng lặp: lần gen trước đưa vault vào catalog → lần sau vault = 0.
 */
function loadBaselineCoveredWords(): Set<string> {
  const set = new Set<string>();
  const addWords = (arr: unknown): void => {
    if (!Array.isArray(arr)) return;
    for (const w of arr) {
      if (typeof w === 'string' && w.trim()) set.add(w.trim().toLowerCase());
      else if (w && typeof w === 'object' && typeof (w as { word?: string }).word === 'string') {
        set.add(String((w as { word: string }).word).toLowerCase());
      }
    }
  };
  for (const rel of ['src/data/vocab/pro3m.json', 'src/data/vocab/pro3m-plus.json'] as const) {
    const fp = path.join(ROOT, rel);
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, 'utf8')) as Record<string, { words?: string[] }>;
    for (const lesson of Object.values(data)) addWords(lesson?.words);
  }
  const examFp = path.join(ROOT, 'src/data/vocab/exam-vocab.json');
  if (existsSync(examFp)) {
    const exam = JSON.parse(readFileSync(examFp, 'utf8')) as { subtopics?: { words?: string[] }[] };
    for (const s of exam.subtopics ?? []) addWords(s.words);
  }
  return set;
}

async function loadCefrForWords(words: string[]): Promise<Map<string, string | null>> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Map();
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const out = new Map<string, string | null>();
  const CHUNK = 400;
  for (let i = 0; i < words.length; i += CHUNK) {
    const slice = words.slice(i, i + CHUNK);
    const { data, error } = await sb.from('global_dictionary').select('word, data').in('word', slice);
    if (error) {
      console.warn('[extra] cefr query fail:', error.message);
      break;
    }
    for (const r of (data ?? []) as { word: string; data: { openVocab?: { cefr?: string; cefrMin?: string } } | null }[]) {
      const c = r.data?.openVocab?.cefrMin ?? r.data?.openVocab?.cefr ?? null;
      out.set(String(r.word).toLowerCase(), c);
    }
  }
  const withCefr = [...out.values()].filter(Boolean).length;
  console.log(`[extra] oxford CEFR tags: ${withCefr}/${words.length}`);
  return out;
}

async function loadReadyDict(): Promise<Set<string>> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const ready = new Set<string>();
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await sb
      .from('global_dictionary')
      .select('word, data')
      .range(from, from + page - 1);
    if (error) throw new Error('global_dictionary: ' + error.message);
    if (!data?.length) break;
    for (const row of data as { word: string; data: { results?: { meanings?: { definition?: string }[] }[] } | null }[]) {
      const def = row.data?.results?.[0]?.meanings?.[0]?.definition;
      if (validMeaning(def)) ready.add(String(row.word).toLowerCase());
    }
    if (data.length < page) break;
    from += page;
    if (from % 5000 === 0) console.log(`[extra] scanned GD ${from}, ready ${ready.size}`);
  }
  return ready;
}

async function main(): Promise<void> {
  console.log('[extra] loading global_dictionary (ready meanings)...');
  const ready = await loadReadyDict();
  console.log(`[extra] ready dict words: ${ready.size}`);

  const baselineCovered = loadBaselineCoveredWords();
  console.log(`[extra] baseline covered (pro3m+exam): ${baselineCovered.size}`);

  const usedInLists = new Set<string>(); // dedupe across EXTRA lists only (catalog overlap OK for foundation)
  const subtopics: ExtraSubtopic[] = [];
  const generatedFrom: string[] = [];
  let listWordSlots = 0;

  // ── 100–300 động từ hay gặp (route riêng, giữ thứ tự tần suất) ──
  {
    const cv = buildCommonVerbSubs(ready, usedInLists);
    if (cv.from) generatedFrom.push(cv.from);
    subtopics.push(...cv.subs);
    listWordSlots += cv.slots;
  }

  // ── Oxford 3000: theo CHỦ ĐỀ (NLM pedagogy), không A–Z ──
  {
    const fp = path.join(LISTS_DIR, OXFORD_LIST.file);
    if (existsSync(fp)) {
      generatedFrom.push(`scripts/lists/${OXFORD_LIST.file}`);
      const all = parseListFile(fp);
      const readyWords = all.filter((w) => ready.has(w));
      for (const w of readyWords) usedInLists.add(w);

      // CEFR (openVocab) — sort trong từng theme: A1 → B2
      const cefrByWord = await loadCefrForWords(readyWords);

      const grouped = groupOxfordByTheme(readyWords, cefrByWord);
      // Gộp theme <10 từ vào abstract trước khi chunk
      const abs = grouped.get('abstract') ?? [];
      for (const theme of allOxfordThemeDefs()) {
        if (theme.key === 'abstract' || theme.key === 'function') continue;
        const list = grouped.get(theme.key) ?? [];
        if (list.length > 0 && list.length < 10) {
          abs.push(...list);
          grouped.set(theme.key, []);
        }
      }
      abs.sort((a, b) => a.localeCompare(b, 'en'));
      grouped.set('abstract', abs);

      const themeOrder = allOxfordThemeDefs().map((t) => t.key);
      let oxSlots = 0;
      for (const themeKey of themeOrder) {
        const words = grouped.get(themeKey) ?? [];
        if (words.length < 10) {
          console.log(`[extra] oxford theme ${themeKey}: skip (${words.length})`);
          continue;
        }
        const themeTitle = allOxfordThemeDefs().find((t) => t.key === themeKey)?.title ?? themeKey;
        const chunks = splitBalanced(words);
        chunks.forEach((chunk, idx) => {
          const n = idx + 1;
          const sourceKey = `oxford-theme:${themeKey}::${n}`;
          subtopics.push({
            sourcePackage: OXFORD_LIST.sourcePackage,
            sourceKey,
            routeId: OXFORD_LIST.routeId,
            topicKey: themeKey,
            title: chunks.length === 1 ? themeTitle : `${themeTitle} · chặng ${n}/${chunks.length}`,
            attribution: OXFORD_LIST.attribution,
            words: chunk,
          });
          oxSlots += chunk.length;
          listWordSlots += chunk.length;
        });
        console.log(`[extra] oxford theme ${themeKey}: ${words.length} words → ${chunks.length} units`);
      }
      console.log(`[extra] oxford-3000 thematic total slots=${oxSlots} (list=${all.length} ready=${readyWords.length})`);
    }
  }

  for (const spec of LIST_SPECS) {
    const fp = path.join(LISTS_DIR, spec.file);
    if (!existsSync(fp)) {
      console.warn(`[extra] missing list: ${spec.file}`);
      continue;
    }
    generatedFrom.push(`scripts/lists/${spec.file}`);
    const all = parseListFile(fp);
    // Chỉ từ đã ready; dedupe trong extra lists (ưu tiên list trước trong LIST_SPECS)
    const readyWords = all.filter((w) => ready.has(w) && !usedInLists.has(w));
    for (const w of readyWords) usedInLists.add(w);

    const chunks = splitBalanced(readyWords);
    chunks.forEach((words, idx) => {
      const n = idx + 1;
      const sourceKey = `${spec.file.replace(/\.txt$/, '')}::${n}`;
      subtopics.push({
        sourcePackage: spec.sourcePackage,
        sourceKey,
        routeId: spec.routeId,
        topicKey: spec.topicKey,
        title: chunks.length === 1 ? spec.titleBase : `${spec.titleBase} ${n}/${chunks.length}`,
        attribution: spec.attribution,
        words,
      });
      listWordSlots += words.length;
    });
    console.log(
      `[extra] ${spec.file}: list=${all.length} ready-unique=${readyWords.length} chunks=${chunks.length}`,
    );
  }

  // Dict vault: ready − list packs − pro3m/exam baseline (stable qua mỗi lần regen)
  const vaultWords = [...ready]
    .filter((w) => !usedInLists.has(w) && !baselineCovered.has(w))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const vaultChunks = splitBalanced(vaultWords);
  let dictVaultSlots = 0;
  vaultChunks.forEach((words, idx) => {
    const n = idx + 1;
    // Pad index for stable sort (dict-ready::001)
    const pad = String(n).padStart(3, '0');
    subtopics.push({
      sourcePackage: 'dict-ready',
      sourceKey: `dict-ready::${pad}`,
      routeId: 'dict-vault',
      topicKey: 'san-sang',
      title: `Kho sẵn sàng ${n}/${vaultChunks.length}`,
      attribution: 'Từ đã có nghĩa tiếng Việt trong global_dictionary, chưa nằm catalog cũ/list pack.',
      words,
    });
    dictVaultSlots += words.length;
  });
  console.log(`[extra] dict vault: ${vaultWords.length} words → ${vaultChunks.length} subtopics`);

  const manifest: ExtraManifest = {
    schemaVersion: 1,
    catalogNote: 'Append-only list + dict-ready packs. sourceKey stable. Ready-filter = publishable.',
    generatedFrom,
    readyDictCount: ready.size,
    listWordSlots,
    dictVaultSlots,
    subtopics,
  };

  writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(
    `[extra] wrote ${OUT_FILE} · subtopics=${subtopics.length} · listSlots=${listWordSlots} · vaultSlots=${dictVaultSlots}`,
  );
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
