/**
 * Backfill core_senses song song GLM, dùng NotebookLM CLI (nlm).
 *
 * NotebookLM KHÔNG phải bulk API — rate thấp, phù hợp:
 *  - từ ưu tiên (Oxford 3000 / list app)
 *  - batch nhỏ 5–10 từ / query
 *
 * Chạy:
 *   npx tsx scripts/backfill-core-senses-nlm.ts --setup
 *   npx tsx scripts/backfill-core-senses-nlm.ts --words=trash,important,run
 *   npx tsx scripts/backfill-core-senses-nlm.ts --limit=50 --batch-size=5 --delay=8000
 *
 * Env:
 *   NLM_NOTEBOOK_ID=...   (sau --setup)
 *   hoặc file scripts/.nlm-notebook-id
 */

import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NLM =
  process.env.NLM_PATH ||
  path.join(process.env.USERPROFILE || '', 'pipx', 'venvs', 'notebooklm-cli', 'Scripts', 'nlm.exe');

const NOTEBOOK_ID_FILE = path.resolve(__dirname, '.nlm-notebook-id');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const LIMIT = parseInt(getArg('limit') || '40', 10);
const BATCH = parseInt(getArg('batch-size') || '5', 10);
const DELAY = parseInt(getArg('delay') || '8000', 10);
const DRY = process.argv.includes('--dry');
const SETUP = process.argv.includes('--setup');
const FOREVER = process.argv.includes('--forever');
const WORDS_ARG = getArg('words');
const FORCE = process.argv.includes('--force');
const NLM_PROFILE = getArg('profile') || process.env.NLM_PROFILE || 'burn-minh';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withProfile(args: string[]): string[] {
  // nlm accepts -p at end of most subcommands (auth status, notebook list, …)
  if (args.includes('-p') || args.includes('--profile')) return args;
  return [...args, '-p', NLM_PROFILE];
}

async function nlm(args: string[], timeoutMs = 180_000): Promise<string> {
  const finalArgs = withProfile(args);
  const { stdout, stderr } = await execFileAsync(NLM, finalArgs, {
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
    encoding: 'utf8',
    env: { ...process.env, NLM_PROFILE, NOTEBOOKLM_PROFILE: NLM_PROFILE },
  });
  const out = `${stdout || ''}\n${stderr || ''}`.trim();
  if (/authentication may have expired|Cookies have expired|Code 16/i.test(out)) {
    throw new Error('NLM_AUTH_EXPIRED — chạy: nlm login -p ' + NLM_PROFILE);
  }
  return out;
}

function parseJsonLoose(raw: string): unknown {
  let text = raw.trim();
  // strip markdown fences / citations
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // bỏ footnote kiểu [1] [2]
  text = text.replace(/\[\d+\]/g, '');
  // extract array or object
  const m = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (m) text = m[0];
  // NotebookLM đôi khi chèn control char / newline thô trong string
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
  // thử parse; nếu fail → escape newline trong quotes thô
  try {
    return JSON.parse(text);
  } catch {
    const fixed = text.replace(/"([^"\\]|\\.)*"/g, (s) =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'),
    );
    return JSON.parse(fixed);
  }
}

function needsEnrich(data: Record<string, unknown>): boolean {
  if (FORCE) return true;
  if (data.coreSensesChecked === true) return false;
  if (Array.isArray(data.core_senses) && data.core_senses.length > 0) return false;
  return true;
}

async function setupNotebook(): Promise<string> {
  console.log('[nlm] setup notebook + research sources...');
  // research requires notebook-id OR creates new with --title in some versions
  let out = '';
  try {
    out = await nlm(
      [
        'research',
        'start',
        'Oxford Advanced Learner Dictionary Cambridge dictionary entry structure core sense first collocations CEFR register examples for English Vietnamese learners',
        '-m',
        'fast',
        '-t',
        'LingoPro core senses Oxford Cambridge',
        '-f',
      ],
      120_000,
    );
    console.log(out.slice(0, 500));
  } catch (e) {
    console.warn('[nlm] research start:', e instanceof Error ? e.message : e);
  }

  // Try create notebook
  try {
    out = await nlm(['notebook', 'create', 'LingoPro core senses backfill'], 60_000);
    console.log(out.slice(0, 500));
  } catch (e) {
    console.warn('[nlm] notebook create:', e instanceof Error ? e.message : e);
  }

  // list notebooks and pick matching title
  out = await nlm(['notebook', 'list'], 60_000);
  console.log(out.slice(0, 1500));

  // crude ID extract (uuid)
  const ids = out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
  const id = process.env.NLM_NOTEBOOK_ID || ids[0];
  if (!id) throw new Error('Không lấy được notebook id — set NLM_NOTEBOOK_ID=... sau khi tạo tay');

  fs.writeFileSync(NOTEBOOK_ID_FILE, id, 'utf8');
  console.log('[nlm] notebook id saved:', id);

  // seed methodology as text source
  const methodology = `Learner dictionary rules (Oxford/Cambridge style):
1. At most 3 core senses, most common/popular first.
2. Each sense: pos, short Vietnamese label, short VI definition, simple EN definition, CEFR, region US/UK/both, register, one natural example sentence, 2-4 collocations.
3. No archaic senses, no ((old dictionary marks)).
4. synonyms 3-6, antonyms 0-4, family max 5 with VI meaning.
5. distinguish near-synonyms when useful (trash/rubbish/garbage).
6. Output strict JSON array of entries keyed by word.`;

  try {
    await nlm(
      [
        'source',
        'add',
        id,
        '--title',
        'Learner dictionary rules',
        '--text',
        methodology,
      ],
      90_000,
    );
    console.log('[nlm] methodology source added');
  } catch (e) {
    console.warn('[nlm] source add:', e instanceof Error ? e.message : e);
  }

  // import research if any
  try {
    const st = await nlm(['research', 'status'], 30_000);
    console.log(st.slice(0, 400));
    if (/complete|ready|done/i.test(st)) {
      await nlm(['research', 'import', '-n', id], 120_000);
      console.log('[nlm] research imported');
    }
  } catch (e) {
    console.warn('[nlm] research import skip:', e instanceof Error ? e.message : e);
  }

  return id;
}

function getNotebookId(): string {
  if (process.env.NLM_NOTEBOOK_ID) return process.env.NLM_NOTEBOOK_ID.trim();
  if (fs.existsSync(NOTEBOOK_ID_FILE)) return fs.readFileSync(NOTEBOOK_ID_FILE, 'utf8').trim();
  throw new Error('Chưa có notebook. Chạy: npx tsx scripts/backfill-core-senses-nlm.ts --setup');
}

async function queryBatch(notebookId: string, words: string[]): Promise<unknown> {
  const list = words.join(', ');
  const question = `For each English headword in this list: [${list}]
Return ONLY a JSON array (no markdown, no prose) with one object per word:
[{
  "word": "headword",
  "core_senses": [{"pos","label_vi","definition_vi","definition_en","cefr","region","register","example","collocations","popularity"}],
  "synonyms": [],
  "antonyms": [],
  "familyWords": [{"word","pos","meaning"}],
  "distinguish": [{"vs","note_vi"}]
}]
Rules: max 3 core_senses, most common first; example required; Vietnamese definitions; learner style Oxford/Cambridge.`;

  const out = await nlm(['notebook', 'query', notebookId, question], 300_000);
  console.log('[nlm] raw answer head:', out.slice(0, 200).replace(/\s+/g, ' '));
  return parseJsonLoose(out);
}

function normalizeEntry(item: Record<string, unknown>, fallbackWord: string) {
  const word = String(item.word || item.headword || fallbackWord)
    .toLowerCase()
    .trim();
  const sensesRaw = Array.isArray(item.core_senses) ? item.core_senses : [];
  const core_senses = [];
  for (let i = 0; i < sensesRaw.length && core_senses.length < 3; i++) {
    const s = sensesRaw[i] as Record<string, unknown>;
    if (!s || typeof s !== 'object') continue;
    const definition_vi = String(s.definition_vi || s.meaning_vi || s.vi || '').trim();
    if (!definition_vi) continue;
    const posRaw = String(s.pos || 'noun').trim().toLowerCase();
    const pos =
      /danh|noun|n\./i.test(posRaw)
        ? 'noun'
        : /động|verb|v\./i.test(posRaw)
          ? 'verb'
          : /tính|adj/i.test(posRaw)
            ? 'adjective'
            : /trạng|adv/i.test(posRaw)
              ? 'adverb'
              : posRaw.slice(0, 20);
    core_senses.push({
      pos,
      label_vi: String(s.label_vi || definition_vi).trim().slice(0, 40),
      definition_vi: definition_vi.slice(0, 120),
      definition_en: String(s.definition_en || '').trim().slice(0, 160) || undefined,
      cefr: String(s.cefr || '').trim().toUpperCase() || undefined,
      region: String(s.region || '').trim() || undefined,
      register: String(s.register || '').trim() || undefined,
      example: String(s.example || '').trim().slice(0, 160),
      collocations: Array.isArray(s.collocations)
        ? s.collocations.map((c) => String(c).trim()).filter(Boolean).slice(0, 4)
        : [],
      popularity: typeof s.popularity === 'number' ? s.popularity : i + 1,
    });
  }
  const clean = (arr: unknown, max: number) => {
    if (!Array.isArray(arr)) return [] as string[];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of arr) {
      const w = String(typeof x === 'object' && x && 'word' in (x as object) ? (x as { word: string }).word : x || '')
        .toLowerCase()
        .trim();
      if (!/^[a-z][a-z'-]{1,24}$/.test(w) || seen.has(w)) continue;
      seen.add(w);
      out.push(w);
      if (out.length >= max) break;
    }
    return out;
  };
  const familyWords: Array<{ word: string; pos?: string; meaning?: string }> = [];
  if (Array.isArray(item.familyWords)) {
    for (const f of item.familyWords) {
      if (typeof f === 'string') {
        const w = f.toLowerCase().trim();
        if (/^[a-z][a-z'-]{1,24}$/.test(w)) familyWords.push({ word: w });
      } else if (f && typeof f === 'object') {
        const o = f as Record<string, unknown>;
        const w = String(o.word || '').toLowerCase().trim();
        if (/^[a-z][a-z'-]{1,24}$/.test(w)) {
          familyWords.push({
            word: w,
            pos: o.pos ? String(o.pos) : undefined,
            meaning: o.meaning ? String(o.meaning) : undefined,
          });
        }
      }
      if (familyWords.length >= 5) break;
    }
  }
  const distinguish: Array<{ vs: string; note_vi: string }> = [];
  if (Array.isArray(item.distinguish)) {
    for (const d of item.distinguish) {
      if (d && typeof d === 'object') {
        const o = d as Record<string, unknown>;
        const vs = String(o.vs || '').toLowerCase().trim();
        const note_vi = String(o.note_vi || o.note || '').trim();
        if (vs && note_vi) distinguish.push({ vs, note_vi: note_vi.slice(0, 120) });
      }
      if (distinguish.length >= 3) break;
    }
  } else if (typeof item.distinguish === 'string' && item.distinguish.trim()) {
    distinguish.push({ vs: 'note', note_vi: item.distinguish.trim().slice(0, 120) });
  }
  return {
    word,
    core_senses,
    synonyms: clean(item.synonyms, 6),
    antonyms: clean(item.antonyms, 4),
    familyWords,
    distinguish,
  };
}

async function fetchPendingWords(): Promise<string[]> {
  if (WORDS_ARG) {
    return WORDS_ARG.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
  }
  const all: Array<{ word: string; data: Record<string, unknown> }> = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('word, data')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...(data as typeof all));
    if (data.length < 1000) break;
    from += 1000;
  }
  return all
    .filter((r) => /^[a-z][a-z'-]{2,30}$/i.test(r.word) && needsEnrich(r.data || {}))
    .sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word))
    .slice(0, LIMIT)
    .map((r) => r.word.toLowerCase());
}

async function saveEntry(entry: ReturnType<typeof normalizeEntry>): Promise<boolean> {
  if (!entry.core_senses.length) return false;
  const { data: row, error } = await supabase
    .from('global_dictionary')
    .select('id, data')
    .eq('word', entry.word)
    .maybeSingle();
  if (error || !row) {
    console.warn(`  skip db missing "${entry.word}"`);
    return false;
  }
  if (DRY) {
    console.log(`  [dry] ${entry.word} senses=${entry.core_senses.length}`);
    return true;
  }
  const next = {
    ...(row.data as Record<string, unknown>),
    core_senses: entry.core_senses,
    synonyms: entry.synonyms.length ? entry.synonyms : (row.data as Record<string, unknown>).synonyms,
    antonyms: entry.antonyms.length ? entry.antonyms : (row.data as Record<string, unknown>).antonyms,
    familyWords: entry.familyWords.length ? entry.familyWords : (row.data as Record<string, unknown>).familyWords,
    distinguish: entry.distinguish,
    coreSensesChecked: true,
    coreSensesSource: 'notebooklm',
  };
  const { error: up } = await supabase.from('global_dictionary').update({ data: next }).eq('id', row.id);
  if (up) {
    console.error(`  db fail ${entry.word}:`, up.message);
    return false;
  }
  return true;
}

async function runOnce(notebookId: string): Promise<{ ok: number; fail: number }> {
  const words = await fetchPendingWords();
  console.log(`pending batch size: ${words.length}, batch-size=${BATCH}`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < words.length; i += BATCH) {
    const chunk = words.slice(i, i + BATCH);
    console.log(`\n[nlm] words ${i + 1}-${i + chunk.length}: ${chunk.join(', ')}`);
    try {
      const parsed = await queryBatch(notebookId, chunk);
      const arr = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { entries?: unknown }).entries)
          ? (parsed as { entries: unknown[] }).entries
          : [parsed];

      for (let j = 0; j < arr.length; j++) {
        const item = arr[j] as Record<string, unknown>;
        const entry = normalizeEntry(item, chunk[j] || chunk[0]);
        const saved = await saveEntry(entry);
        if (saved) {
          ok++;
          console.log(`  ✓ ${entry.word} · ${entry.core_senses[0]?.label_vi || ''}`);
        } else {
          fail++;
        }
      }
    } catch (e) {
      fail += chunk.length;
      console.error('  batch fail:', e instanceof Error ? e.message : e);
      if (String(e).includes('NLM_AUTH_EXPIRED')) process.exit(2);
    }
    await sleep(DELAY);
  }
  return { ok, fail };
}

async function main() {
  console.log('=== NLM core_senses backfill ===');
  console.log(`profile=${NLM_PROFILE} forever=${FOREVER} limit=${LIMIT} batch=${BATCH} delay=${DELAY}`);
  if (!fs.existsSync(NLM)) {
    console.error('nlm.exe not found:', NLM);
    process.exit(1);
  }

  // auth check
  try {
    const st = await nlm(['auth', 'status'], 60_000);
    console.log(st.split('\n').slice(0, 8).join('\n'));
  } catch (e) {
    console.error(e);
    console.error('Chạy: nlm login -p', NLM_PROFILE);
    process.exit(1);
  }

  if (SETUP) {
    await setupNotebook();
    return;
  }

  let notebookId: string;
  try {
    notebookId = getNotebookId();
  } catch {
    console.log('[nlm] no notebook id — running setup...');
    notebookId = await setupNotebook();
  }
  console.log('notebook:', notebookId);

  if (!FOREVER) {
    const r = await runOnce(notebookId);
    console.log(`\nDone nlm: ok=${r.ok} fail=${r.fail}`);
    return;
  }

  let totalOk = 0;
  let totalFail = 0;
  let empty = 0;
  let round = 0;
  while (true) {
    round++;
    console.log(`\n── nlm forever round ${round} ──`);
    try {
      const r = await runOnce(notebookId);
      totalOk += r.ok;
      totalFail += r.fail;
      console.log(`round ${round} ok=${r.ok} fail=${r.fail} | totalOk=${totalOk} totalFail=${totalFail}`);
      if (r.ok === 0) {
        empty++;
        if (empty >= 5) {
          console.log('no progress 5 rounds — sleep 10m');
          await sleep(600_000);
          empty = 0;
        } else {
          await sleep(30_000);
        }
      } else {
        empty = 0;
        await sleep(5_000);
      }
    } catch (e) {
      console.error('round crash:', e);
      await sleep(60_000);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
