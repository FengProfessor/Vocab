/**
 * Backfill words.example_vi — dịch câu ví dụ EN → VI (batch).
 *
 * Provider (tránh Gemini 429):
 *   --provider=zhipu      (mặc định) ZHIPU_API_KEY / BIGMODEL / GLM  · glm-4-flash
 *   --provider=groq       GROQ_API_KEY · llama-3.1-8b-instant
 *   --provider=openrouter OPENROUTER_API_KEY · openrouter/free
 *   --provider=gemini     GEMINI_API_KEY · flash-lite (dễ 429 free tier)
 *   --provider=auto       thử zhipu → groq → openrouter → gemini
 *
 * Không scrape: example custom, không khớp nguồn cào.
 *
 * Chạy (web-app/):
 *   npx tsx scripts/backfill-example-vi.ts
 *   npx tsx scripts/backfill-example-vi.ts --apply --provider=zhipu
 *   npx tsx scripts/backfill-example-vi.ts --apply --provider=groq --limit=200
 *   npx tsx scripts/backfill-example-vi.ts --apply --provider=auto --sync-gd
 *   npx tsx scripts/backfill-example-vi.ts --apply --batch=12 --sleep=2000
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Provider = 'zhipu' | 'groq' | 'openrouter' | 'gemini' | 'auto';

const DRY = !process.argv.includes('--apply');
const SYNC_GD = process.argv.includes('--sync-gd');
const LIMIT = parseInt(
  (process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0',
  10,
);
const BATCH = Math.max(
  5,
  parseInt((process.argv.find((a) => a.startsWith('--batch=')) || '').split('=')[1] || '15', 10),
);
const SLEEP_MS = Math.max(
  500,
  parseInt((process.argv.find((a) => a.startsWith('--sleep=')) || '').split('=')[1] || '1500', 10),
);
const PROVIDER_ARG = (
  (process.argv.find((a) => a.startsWith('--provider=')) || '').split('=')[1] ||
  process.env.EXAMPLE_VI_PROVIDER ||
  'zhipu'
).toLowerCase() as Provider;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2];
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

function splitKeys(...raws: Array<string | undefined>): string[] {
  const out: string[] = [];
  for (const raw of raws) {
    if (!raw) continue;
    for (const k of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!out.includes(k)) out.push(k);
    }
  }
  return out;
}

type LlmSlot = {
  id: string;
  label: string;
  baseUrl?: string;
  model: string;
  keys: string[];
  kind: 'openai' | 'gemini';
};

function buildSlots(pref: Provider): LlmSlot[] {
  const zhipu: LlmSlot = {
    id: 'zhipu',
    label: 'zhipu',
    kind: 'openai',
    baseUrl: (process.env.ZHIPU_BASE_URL || process.env.BIGMODEL_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(
      /\/$/,
      '',
    ),
    model: process.env.ZHIPU_MODEL || process.env.GLM_MODEL || 'glm-4-flash',
    keys: splitKeys(process.env.ZHIPU_API_KEY, process.env.BIGMODEL_API_KEY, process.env.GLM_API_KEY),
  };
  const groq: LlmSlot = {
    id: 'groq',
    label: 'groq',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    keys: splitKeys(process.env.GROQ_API_KEY),
  };
  const openrouter: LlmSlot = {
    id: 'openrouter',
    label: 'openrouter',
    kind: 'openai',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: process.env.OPENROUTER_MODEL || 'openrouter/free',
    keys: splitKeys(process.env.OPENROUTER_API_KEY),
  };
  const gemini: LlmSlot = {
    id: 'gemini',
    label: 'gemini',
    kind: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    keys: splitKeys(process.env.GEMINI_API_KEY),
  };

  const all = [zhipu, groq, openrouter, gemini];
  if (pref === 'auto') return all.filter((s) => s.keys.length > 0);
  const one = all.find((s) => s.id === pref);
  if (!one) throw new Error(`provider không hợp lệ: ${pref}`);
  if (!one.keys.length) {
    throw new Error(
      `thiếu key cho --provider=${pref}. Zhipu: ZHIPU_API_KEY · Groq: GROQ_API_KEY · OpenRouter: OPENROUTER_API_KEY · Gemini: GEMINI_API_KEY`,
    );
  }
  return [one];
}

let slots: LlmSlot[] = [];
let slotIdx = 0;
let keyIdx = 0;

function currentSlot(): LlmSlot {
  return slots[slotIdx % slots.length];
}

function rotateOn429() {
  const slot = currentSlot();
  keyIdx++;
  if (keyIdx < slot.keys.length) {
    console.log(`  ↻ ${slot.label} key #${keyIdx + 1}/${slot.keys.length}`);
    return;
  }
  // hết key của provider → provider kế (auto) hoặc wrap
  keyIdx = 0;
  if (slots.length > 1) {
    slotIdx = (slotIdx + 1) % slots.length;
    console.log(`  ↻ chuyển provider → ${currentSlot().label}`);
  } else {
    console.log(`  ⏳ ${slot.label} hết key, chờ cooldown…`);
  }
}

async function callOpenAi(slot: LlmSlot, prompt: string): Promise<string> {
  const apiKey = slot.keys[keyIdx % slot.keys.length];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (slot.id === 'openrouter') {
    headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER || 'https://lingopro.local';
    headers['X-Title'] = process.env.OPENROUTER_TITLE || 'LingoPro-example-vi';
  }

  const res = await fetch(`${slot.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: slot.model,
      messages: [
        {
          role: 'system',
          content: 'You are a bilingual EN-VI translator for a vocabulary app. Output valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${slot.label} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = JSON.parse(body) as {
    choices?: Array<{ message?: { content?: string | null; reasoning_content?: string | null } }>;
    error?: { message?: string };
  };
  if (json.error?.message) throw new Error(json.error.message);
  const msg = json.choices?.[0]?.message;
  const content = (msg?.content || msg?.reasoning_content || '').trim();
  if (!content) throw new Error(`${slot.label} empty content`);
  return content;
}

async function callGemini(slot: LlmSlot, prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = slot.keys[keyIdx % slot.keys.length];
  const g = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: slot.model,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const r = await g.generateContent(
    { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
    { signal: AbortSignal.timeout(60_000) },
  );
  return r.response.text();
}

async function llm(prompt: string, attempt = 0): Promise<string> {
  const slot = currentSlot();
  try {
    if (slot.kind === 'gemini') return await callGemini(slot, prompt);
    return await callOpenAi(slot, prompt);
  } catch (e: unknown) {
    const msg = errMsg(e);
    const is429 = /429|rate.?limit|quota|too many|1113|资源|限流/i.test(msg);
    if (is429 && attempt < 12) {
      rotateOn429();
      const wait = Math.min(30_000, 2500 * (attempt + 1));
      console.log(`  ⚠ 429/quota (${slot.label}) · wait ${wait}ms · retry ${attempt + 1}`);
      await sleep(wait);
      return llm(prompt, attempt + 1);
    }
    // lỗi khác: thử provider kế nếu auto
    if (slots.length > 1 && attempt < slots.length * 3) {
      rotateOn429();
      await sleep(1000);
      return llm(prompt, attempt + 1);
    }
    throw e;
  }
}

type Row = {
  id: string;
  word: string;
  example: string;
  example_vi: string | null;
};

type GdData = {
  results?: Array<{
    meanings?: Array<{
      example?: string;
      example_vi?: string;
      [k: string]: unknown;
    }>;
  }>;
  [k: string]: unknown;
};

async function main() {
  loadEnv();
  slots = buildSlots(PROVIDER_ARG === 'auto' || ['zhipu', 'groq', 'openrouter', 'gemini'].includes(PROVIDER_ARG)
    ? PROVIDER_ARG
    : 'zhipu');
  if (!slots.length) {
    throw new Error(
      'Không có API key nào. Thêm ZHIPU_API_KEY (khuyên) hoặc GROQ_API_KEY / OPENROUTER_API_KEY. Tránh Gemini nếu đang 429.',
    );
  }

  console.log(
    `[backfill-example-vi] providers=${slots.map((s) => `${s.label}(${s.keys.length}k/${s.model})`).join(' → ')}`,
  );
  console.log(
    `[backfill-example-vi] batch=${BATCH} sleep=${SLEEP_MS}ms ${DRY ? 'DRY-RUN' : 'APPLY'}${SYNC_GD ? ' +sync-gd' : ''}`,
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const targets: Row[] = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const { data: raw, error } = await sb
      .from('words')
      .select('id, word, example, example_vi')
      .not('example', 'is', null)
      .neq('example', '')
      .range(from, from + page - 1);

    if (error) {
      if (/example_vi/i.test(error.message)) {
        throw new Error(
          `Cột example_vi chưa có — apply migration trước:\nALTER TABLE public.words ADD COLUMN IF NOT EXISTS example_vi text;\n(${error.message})`,
        );
      }
      throw new Error(error.message);
    }
    if (!raw?.length) break;
    for (const r of raw as Row[]) {
      if (!(r.example || '').trim()) continue;
      if ((r.example_vi || '').trim()) continue;
      targets.push(r);
    }
    if (raw.length < page) break;
    from += page;
    if (LIMIT > 0 && targets.length >= LIMIT) break;
  }

  let work = targets;
  if (LIMIT > 0) work = targets.slice(0, LIMIT);
  console.log(`[backfill-example-vi] ${work.length} rows cần sub VI`);
  if (!work.length) {
    console.log('Không còn gì để backfill.');
    return;
  }

  const byExample = new Map<string, Row[]>();
  for (const r of work) {
    const ex = r.example.trim();
    const list = byExample.get(ex) || [];
    list.push(r);
    byExample.set(ex, list);
  }
  const uniqueExamples = [...byExample.keys()];
  console.log(`[backfill-example-vi] ${uniqueExamples.length} câu unique (dedup)`);

  const translations = new Map<string, string>();

  for (let i = 0; i < uniqueExamples.length; i += BATCH) {
    const group = uniqueExamples.slice(i, i + BATCH);
    const items = group.map((en, idx) => ({ i: idx, en }));
    const prompt = `Dịch MỖI câu tiếng Anh sang 1 câu tiếng Việt TỰ NHIÊN (không word-by-word, không giải thích).

Trả JSON đúng dạng:
{"vi":{"0":"...","1":"...",...}}
Khóa = index số. Đủ mọi index 0..${group.length - 1}.

Câu:
${JSON.stringify(items)}`;

    let raw: string;
    try {
      raw = await llm(prompt);
    } catch (e: unknown) {
      console.log(`✗ batch ${i}: ${errMsg(e)}`);
      await sleep(SLEEP_MS * 2);
      continue;
    }

    let map: Record<string, string> = {};
    try {
      let text = raw.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      }
      const parsed = JSON.parse(text) as { vi?: Record<string, string> };
      map = parsed.vi ?? {};
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          map = (JSON.parse(m[0]) as { vi?: Record<string, string> }).vi ?? {};
        } catch {
          /* ignore */
        }
      }
    }

    let hit = 0;
    for (let j = 0; j < group.length; j++) {
      const vi = (map[String(j)] || '').trim();
      if (vi.length < 2) continue;
      translations.set(group[j], vi.slice(0, 280));
      hit++;
    }
    console.log(
      `  …${Math.min(i + BATCH, uniqueExamples.length)}/${uniqueExamples.length} · batch+${hit} · total ${translations.size} · via ${currentSlot().label}`,
    );
    await sleep(SLEEP_MS);
  }

  const backup: Array<{ id: string; example: string; example_vi: string }> = [];
  let ok = 0;
  let fail = 0;

  for (const r of work) {
    const vi = translations.get(r.example.trim());
    if (!vi) {
      fail++;
      continue;
    }
    backup.push({ id: r.id, example: r.example, example_vi: vi });
    if (!DRY) {
      const { error } = await sb.from('words').update({ example_vi: vi }).eq('id', r.id);
      if (error) {
        console.log(`  ✗ ${r.word}: ${error.message}`);
        fail++;
        continue;
      }
    }
    ok++;
    if (ok <= 8) {
      console.log(`  ✓ ${r.word}: "${r.example.slice(0, 48)}…" → "${vi.slice(0, 48)}…"`);
    }
  }

  let gdOk = 0;
  if (SYNC_GD && !DRY && translations.size) {
    console.log('[backfill-example-vi] sync-gd…');
    const wordsUnique = [...new Set(work.map((r) => r.word.trim().toLowerCase()))];
    for (let i = 0; i < wordsUnique.length; i += 80) {
      const slice = wordsUnique.slice(i, i + 80);
      const { data: rows } = await sb.from('global_dictionary').select('id, word, data').in('word', slice);
      for (const row of rows ?? []) {
        const d = structuredClone(row.data ?? {}) as GdData;
        const m0 = d.results?.[0]?.meanings?.[0];
        if (!m0?.example) continue;
        const vi = translations.get(String(m0.example).trim());
        if (!vi || (m0.example_vi || '').trim()) continue;
        m0.example_vi = vi;
        const { error } = await sb.from('global_dictionary').update({ data: d }).eq('id', row.id);
        if (!error) gdOk++;
      }
    }
    console.log(`[backfill-example-vi] sync-gd updated ${gdOk}`);
  }

  if (!DRY && backup.length) {
    const dir = path.join(process.cwd(), 'tmp');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const out = path.join(dir, `example-vi-backup-${Date.now()}.json`);
    writeFileSync(out, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`[backfill-example-vi] backup → ${out}`);
  }

  for (const [en, vi] of [...translations.entries()].slice(0, 3)) {
    if (!VN.test(vi)) console.log(`  ⚠ sub thiếu dấu VN? "${vi}" ← "${en.slice(0, 40)}"`);
  }

  console.log(
    `\n[backfill-example-vi] done: ok=${ok} fail/skip=${fail} unique=${translations.size}.${DRY ? ' (DRY — --apply để ghi)' : ''}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
