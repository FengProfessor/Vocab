/**
 * Backfill core_senses kiểu Oxford/Cambridge (OpenAI-compatible LLM).
 *
 * Providers:
 *   --provider=openrouter  (mặc định khi Zhipu 429)  OPENROUTER_API_KEY
 *   --provider=glm         ZHIPU_API_KEY / BigModel
 *
 * Chạy:
 *   npx tsx scripts/backfill-core-senses-glm.ts --provider=openrouter --forever --shard=0/3
 *   npx tsx scripts/backfill-core-senses-glm.ts --provider=glm --words=trash
 *
 * Ghi global_dictionary.data.core_senses[] ...
 */

import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

type Provider = 'glm' | 'openrouter';

const PROVIDER: Provider = ((getArg('provider') || process.env.CORE_SENSES_PROVIDER || 'openrouter').toLowerCase() ===
'glm'
  ? 'glm'
  : 'openrouter') as Provider;

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function resolveLlm(): { apiKey: string; baseUrl: string; model: string; label: string } {
  if (PROVIDER === 'openrouter') {
    const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    const model =
      process.env.OPENROUTER_MODEL || getArg('model') || 'openrouter/free';
    return { apiKey, baseUrl, model, label: 'openrouter' };
  }
  const apiKey = (
    process.env.ZHIPU_API_KEY ||
    process.env.GLM_API_KEY ||
    process.env.BIGMODEL_API_KEY ||
    ''
  ).trim();
  const baseUrl = (process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '');
  const model = process.env.ZHIPU_MODEL || getArg('model') || 'glm-5.2';
  return { apiKey, baseUrl, model, label: 'glm' };
}

const llm = resolveLlm();
const apiKey = llm.apiKey;
const baseUrl = llm.baseUrl;
const model = llm.model;

if (!supabaseUrl || !supabaseKey) {
  console.error('[backfill] Missing Supabase env', { url: Boolean(supabaseUrl), service: Boolean(supabaseKey) });
  process.exit(1);
}
if (!apiKey) {
  console.error(
    PROVIDER === 'openrouter'
      ? '[backfill] Missing OPENROUTER_API_KEY in .env.local'
      : '[backfill] Missing ZHIPU_API_KEY in .env.local',
  );
  process.exit(1);
}
console.log(`[backfill] env ok · provider=${PROVIDER} · model=${model} · keylen=${apiKey.length}`);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const LIMIT = parseInt(getArg('limit') || '300', 10);
const OFFSET = parseInt(getArg('offset') || '0', 10);
const DELAY = parseInt(getArg('delay') || '700', 10);
const DRY = process.argv.includes('--dry');
const FORCE = process.argv.includes('--force');
const FOREVER = process.argv.includes('--forever');
const WORDS_ARG = getArg('words');
/** Shard: --shard=0/3 → chỉ xử lý word có hash%3===0 (tránh đụng worker khác) */
const SHARD_RAW = getArg('shard'); // "0/3"
const SHARD_INDEX = SHARD_RAW ? parseInt(SHARD_RAW.split('/')[0] || '0', 10) : 0;
const SHARD_COUNT = SHARD_RAW ? parseInt(SHARD_RAW.split('/')[1] || '1', 10) : 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function logLine(msg: string): void {
  const line = `${new Date().toISOString().slice(11, 19)} ${msg}`;
  console.log(line);
  try {
    const logPath = process.env.GLM_BACKFILL_LOG;
    if (logPath) fs.appendFileSync(logPath, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Rate limit mềm — backoff, KHÔNG exit 42 */
function isRateLimitError(msg: string): boolean {
  return /429|rate.?limit|limit_requests|too many|temporarily|1113/i.test(msg);
}

/** Auth/quota cứng — exit 42 */
function isHardQuotaError(msg: string): boolean {
  if (isRateLimitError(msg)) return false;
  return /401|403|quota|余额|不足|exhausted|Unauthorized|invalid.?api.?key|payment|billing/i.test(msg);
}

type CoreSense = {
  pos: string;
  label_vi: string;
  definition_vi: string;
  definition_en?: string;
  cefr?: string;
  region?: string;
  register?: string;
  example: string;
  collocations: string[];
  popularity: number;
};

type EnrichPayload = {
  core_senses: CoreSense[];
  synonyms: string[];
  antonyms: string[];
  familyWords: Array<{ word: string; pos?: string; meaning?: string }>;
  distinguish: Array<{ vs: string; note_vi: string }>;
};

type Row = { id: string; word: string; data: Record<string, unknown> };

function needsEnrich(data: Record<string, unknown>): boolean {
  if (FORCE) return true;
  if (data.coreSensesChecked === true) return false;
  const cs = data.core_senses;
  if (Array.isArray(cs) && cs.length > 0) return false;
  return true;
}

function isSingleWord(w: string): boolean {
  return /^[a-z][a-z'-]{2,30}$/i.test(w) && !/\s/.test(w);
}

async function callLlm(prompt: string): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (PROVIDER === 'openrouter') {
    headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER || 'https://lingopro.local';
    headers['X-Title'] = process.env.OPENROUTER_TITLE || 'LingoPro-core-senses';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a bilingual English-Vietnamese lexicographer for Oxford/Cambridge-style learner dictionaries. Output valid JSON only. No markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      stream: false,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${llm.label} HTTP ${res.status}: ${body.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (json.error?.message) throw new Error(json.error.message);
  const content = json.choices?.[0]?.message?.content?.trim() || '';
  if (!content) throw new Error('Empty GLM response');
  return content;
}

function parseJsonLoose(raw: string): EnrichPayload {
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON object in response');
    parsed = JSON.parse(m[0]);
  }
  const o = parsed as Record<string, unknown>;

  const sensesRaw = Array.isArray(o.core_senses) ? o.core_senses : [];
  const core_senses: CoreSense[] = [];
  for (let i = 0; i < sensesRaw.length && core_senses.length < 3; i++) {
    const s = sensesRaw[i] as Record<string, unknown>;
    if (!s || typeof s !== 'object') continue;
    const definition_vi = String(s.definition_vi || '').trim();
    const example = String(s.example || '').trim();
    if (!definition_vi) continue;
    const coll = Array.isArray(s.collocations)
      ? s.collocations.map((c) => String(c).trim()).filter(Boolean).slice(0, 4)
      : [];
    core_senses.push({
      pos: String(s.pos || 'noun').trim().toLowerCase(),
      label_vi: String(s.label_vi || definition_vi).trim().slice(0, 40),
      definition_vi: definition_vi.slice(0, 120),
      definition_en: String(s.definition_en || '').trim().slice(0, 160) || undefined,
      cefr: String(s.cefr || '').trim().toUpperCase() || undefined,
      region: String(s.region || '').trim() || undefined,
      register: String(s.register || '').trim() || undefined,
      example: example.slice(0, 160),
      collocations: coll,
      popularity: typeof s.popularity === 'number' ? s.popularity : i + 1,
    });
  }

  const cleanList = (arr: unknown, max: number): string[] => {
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const item of arr) {
      const w = String(item || '').trim().toLowerCase();
      if (!/^[a-z][a-z'-]{1,24}$/.test(w) || seen.has(w)) continue;
      seen.add(w);
      out.push(w);
      if (out.length >= max) break;
    }
    return out;
  };

  const familyRaw = Array.isArray(o.familyWords) ? o.familyWords : [];
  const familyWords: EnrichPayload['familyWords'] = [];
  const seenF = new Set<string>();
  for (const item of familyRaw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const w = String(e.word || '').trim().toLowerCase();
    const meaning = String(e.meaning || '').trim();
    if (!w || !meaning || seenF.has(w)) continue;
    if (!/^[a-z][a-z'-]{0,24}$/.test(w)) continue;
    if (/(ier|iest)$/.test(w)) continue;
    seenF.add(w);
    familyWords.push({
      word: w,
      pos: String(e.pos || '').trim() || undefined,
      meaning: meaning.slice(0, 60),
    });
    if (familyWords.length >= 5) break;
  }

  const distinguishRaw = Array.isArray(o.distinguish) ? o.distinguish : [];
  const distinguish: EnrichPayload['distinguish'] = [];
  for (const item of distinguishRaw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const vs = String(e.vs || '').trim().toLowerCase();
    const note_vi = String(e.note_vi || '').trim();
    if (!vs || !note_vi) continue;
    distinguish.push({ vs, note_vi: note_vi.slice(0, 120) });
    if (distinguish.length >= 3) break;
  }

  return {
    core_senses,
    synonyms: cleanList(o.synonyms, 6),
    antonyms: cleanList(o.antonyms, 4),
    familyWords,
    distinguish,
  };
}

async function enrichWord(word: string, headDef: string): Promise<EnrichPayload> {
  const prompt = `Tạo entry từ điển learner (Oxford/Cambridge style) cho headword tiếng Anh: "${word}"
${headDef ? `Gợi ý nghĩa hiện có (có thể cổ/rườm): "${headDef}"` : ''}

Trả JSON DUY NHẤT:
{
  "core_senses": [
    {
      "pos": "noun|verb|adjective|adverb",
      "label_vi": "nhãn ngắn 2-4 từ",
      "definition_vi": "nghĩa Việt ngắn, phổ biến nhất trước",
      "definition_en": "simple English definition",
      "cefr": "A2|B1|B2|C1",
      "region": "US|UK|both",
      "register": "neutral|informal|formal",
      "example": "1 natural English sentence",
      "collocations": ["2-4 common collocations"],
      "popularity": 1
    }
  ],
  "synonyms": ["3-6 common English synonyms"],
  "antonyms": ["0-4 antonyms or []"],
  "familyWords": [{"word":"form","pos":"noun","meaning":"nghĩa Việt"}],
  "distinguish": [{"vs":"near_synonym","note_vi":"khác biệt ngắn tiếng Việt"}]
}

Rules:
- Tối đa 3 core_senses, xếp NGHĨA PHỔ BIẾN trước (popularity 1 = phổ biến nhất)
- Không nghĩa cổ hiếm, không ((chú thích)) kiểu từ điển cũ
- Example bắt buộc cho mỗi sense
- distinguish: chỉ khi có cặp hay nhầm (trash/rubbish/garbage, make/do...)
- family: chỉ dạng thật, max 5
- JSON only`;

  const raw = await callLlm(prompt);
  const payload = parseJsonLoose(raw);
  if (payload.core_senses.length === 0) {
    throw new Error('No core_senses parsed');
  }
  return payload;
}

async function fetchRows(): Promise<Row[]> {
  if (WORDS_ARG) {
    const list = WORDS_ARG.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
    const { data, error } = await supabase.from('global_dictionary').select('id, word, data').in('word', list);
    if (error) throw new Error(error.message);
    const map = new Map((data as Row[] | null)?.map((r) => [r.word.toLowerCase(), r]) || []);
    return list.map((w) => map.get(w)).filter(Boolean) as Row[];
  }

  const all: Row[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('global_dictionary')
      .select('id, word, data')
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < 1000) break;
    from += 1000;
  }

  let pending = all
    .filter((r) => isSingleWord(r.word) && needsEnrich(r.data || {}))
    .filter((r) => (SHARD_COUNT <= 1 ? true : simpleHash(r.word.toLowerCase()) % SHARD_COUNT === SHARD_INDEX))
    .sort((a, b) => a.word.length - b.word.length || a.word.localeCompare(b.word));

  if (!FOREVER) {
    pending = pending.slice(OFFSET, OFFSET + LIMIT);
  } else {
    // forever: lấy chunk LIMIT mỗi vòng (tránh giữ 7k row RAM + luôn re-fetch)
    pending = pending.slice(0, LIMIT > 0 ? LIMIT : 200);
  }
  return pending;
}

async function processOneRound(): Promise<{
  ok: number;
  fail: number;
  skip: number;
  quota: boolean;
  rateLimit: boolean;
}> {
  const rows = await fetchRows();
  logLine(`round fetch=${rows.length} shard=${SHARD_INDEX}/${SHARD_COUNT}`);

  let ok = 0;
  let fail = 0;
  let skip = 0;
  let consecutiveFail = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const idx = `[${i + 1}/${rows.length}]`;
    const word = row.word.toLowerCase();
    if (!needsEnrich(row.data || {})) {
      skip++;
      continue;
    }

    const headDef =
      (row.data?.results as Array<{ meanings?: Array<{ definition?: string }> }> | undefined)?.[0]
        ?.meanings?.[0]?.definition || '';

    try {
      const payload = await enrichWord(word, String(headDef));
      if (!DRY) {
        const next = {
          ...row.data,
          core_senses: payload.core_senses,
          synonyms: payload.synonyms.length ? payload.synonyms : row.data.synonyms,
          antonyms: payload.antonyms.length ? payload.antonyms : row.data.antonyms,
          familyWords: payload.familyWords.length ? payload.familyWords : row.data.familyWords,
          distinguish: payload.distinguish,
          coreSensesChecked: true,
          coreSensesSource: PROVIDER === 'openrouter' ? `openrouter:${model}` : 'glm-5.2',
        };
        const { error } = await supabase.from('global_dictionary').update({ data: next }).eq('id', row.id);
        if (error) throw new Error(error.message);
      }
      ok++;
      consecutiveFail = 0;
      logLine(
        `${idx} ✓ ${word} · ${payload.core_senses[0]?.label_vi || ''} | ${payload.core_senses[0]?.example || ''}`,
      );
    } catch (e) {
      fail++;
      consecutiveFail++;
      const msg = e instanceof Error ? e.message : String(e);
      logLine(`${idx} ✗ ${word} · ${msg}`);
      if (isHardQuotaError(msg)) {
        logLine('HARD_QUOTA/AUTH — stop round');
        return { ok, fail, skip, quota: true, rateLimit: false };
      }
      if (isRateLimitError(msg)) {
        logLine('RATE_LIMIT 429 — pause round for backoff');
        return { ok, fail, skip, quota: false, rateLimit: true };
      }
      // 5 fail liên tiếp → nghỉ 30s
      if (consecutiveFail >= 5) {
        logLine('cooldown 30s after consecutive fails');
        await sleep(30_000);
        consecutiveFail = 0;
      }
    }
    await sleep(DELAY);
  }
  return { ok, fail, skip, quota: false, rateLimit: false };
}

async function smokeWithRetry(maxAttempts = 6): Promise<void> {
  logLine(`Smoke test ${PROVIDER}...`);
  let wait = 20_000;
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const hi = await callLlm('Reply with exactly: {"ok":true}');
      logLine(`Smoke OK ${hi.slice(0, 80)}`);
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logLine(`Smoke FAIL ${i}/${maxAttempts}: ${msg}`);
      if (isHardQuotaError(msg)) {
        process.exit(42);
      }
      if (i === maxAttempts) {
        // forever mode: sleep long then retry forever loop outside
        if (FOREVER) {
          logLine(`Smoke still failing — sleep ${Math.round(wait / 1000)}s then continue`);
          await sleep(wait);
          wait = Math.min(wait * 2, 15 * 60_000);
          i = 0; // reset attempts
          continue;
        }
        process.exit(1);
      }
      await sleep(wait);
      wait = Math.min(wait * 1.5, 5 * 60_000);
    }
  }
}

async function main(): Promise<void> {
  logLine('══════════════════════════════════════════════');
  logLine(` core_senses backfill · provider=${PROVIDER}`);
  logLine(` model=${model} forever=${FOREVER} shard=${SHARD_INDEX}/${SHARD_COUNT}`);
  logLine(` base=${baseUrl} dry=${DRY} force=${FORCE} limit=${LIMIT} delay=${DELAY}`);
  logLine('══════════════════════════════════════════════');

  await smokeWithRetry();

  if (!FOREVER) {
    const r = await processOneRound();
    logLine(`Done: ok=${r.ok} skip=${r.skip} fail=${r.fail} rateLimit=${r.rateLimit}`);
    if (r.quota) process.exit(42);
    return;
  }

  // ── FOREVER: không thoát trừ hard quota / pending=0 ──
  let totalOk = 0;
  let totalFail = 0;
  let emptyRounds = 0;
  let round = 0;
  let rateLimitBackoff = 60_000;

  while (true) {
    round++;
    logLine(`── forever round ${round} ──`);
    try {
      const r = await processOneRound();
      totalOk += r.ok;
      totalFail += r.fail;
      logLine(
        `round ${round} ok=${r.ok} fail=${r.fail} skip=${r.skip} | totalOk=${totalOk} totalFail=${totalFail}`,
      );

      if (r.quota) {
        logLine('EXIT 42 hard quota/auth');
        process.exit(42);
      }
      if (r.rateLimit) {
        logLine(`RATE_LIMIT backoff ${Math.round(rateLimitBackoff / 1000)}s`);
        await sleep(rateLimitBackoff);
        rateLimitBackoff = Math.min(rateLimitBackoff * 2, 20 * 60_000);
        continue;
      }
      rateLimitBackoff = 60_000;

      if (r.ok === 0 && r.fail === 0) {
        emptyRounds++;
        if (emptyRounds >= 3) {
          logLine('EXIT 0 no pending for this shard');
          process.exit(0);
        }
        await sleep(15_000);
      } else {
        emptyRounds = 0;
      }
    } catch (e) {
      logLine(`round crash: ${e instanceof Error ? e.message : e}`);
      await sleep(20_000);
    }
    await sleep(3_000);
  }
}

// keep alive on unexpected rejection
process.on('unhandledRejection', (e) => {
  logLine(`unhandledRejection ${e}`);
});
process.on('uncaughtException', (e) => {
  logLine(`uncaughtException ${e}`);
});

main().catch((e) => {
  logLine(`fatal ${e}`);
  process.exit(1);
});
