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
const LIST_SPECS: ListSpec[] = [
  {
    file: 'oxford-3000.txt',
    sourcePackage: 'list-oxford',
    routeId: 'oxford-core',
    topicKey: 'a1-b2',
    titleBase: 'Oxford 3000',
    attribution: 'Headwords Oxford 3000™ (seed list). Nghĩa/ảnh từ global_dictionary LingoPro.',
  },
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

function loadExistingCatalogWords(): Set<string> {
  const set = new Set<string>();
  if (!existsSync(CATALOG_FILE)) return set;
  const art = JSON.parse(readFileSync(CATALOG_FILE, 'utf8')) as {
    packs?: { words?: { word?: string }[] }[];
  };
  for (const p of art.packs ?? []) {
    for (const w of p.words ?? []) {
      if (w.word) set.add(w.word.toLowerCase());
    }
  }
  return set;
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

  const existingCatalog = loadExistingCatalogWords();
  console.log(`[extra] existing catalog unique words: ${existingCatalog.size}`);

  const usedInLists = new Set<string>(); // dedupe across EXTRA lists only (catalog overlap OK for foundation)
  const subtopics: ExtraSubtopic[] = [];
  const generatedFrom: string[] = [];
  let listWordSlots = 0;

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

  // Dict vault: ready words NOT in existing catalog AND NOT already assigned to list packs
  const vaultWords = [...ready]
    .filter((w) => !existingCatalog.has(w) && !usedInLists.has(w))
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
