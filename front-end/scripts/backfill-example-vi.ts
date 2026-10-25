/**
 * Backfill words.example_vi — Dịch toàn bộ câu ví dụ EN → VI và lưu trực tiếp vào database.
 *
 * Tính năng chính:
 * 1. Keyset / PK Cursor Pagination: Quét toàn bộ bảng words an toàn, không timeout.
 * 2. Phase 1 - Regex Auto-Extraction: Tự bóc tách bản dịch tiếng Việt có sẵn trong ngoặc/gạch chéo (tiết kiệm ~900 LLM calls).
 * 3. Phase 2 - Dedup & Batch AI Translation: Chỉ dịch các câu unique (~1,700 câu cho 13,000+ từ).
 * 4. Cache Persistence: Lưu tiến độ ra tmp/example-translations-cache.json để có thể resume bất kỳ lúc nào.
 * 5. Multi-Provider & Key Rotation: Hỗ trợ Groq (qwen/qwen3.8-27b), Gemini (flash), OpenRouter.
 * 6. High-Throughput DB Update: Gom nhóm theo câu và cập nhật theo mảng ID với concurrency cao.
 *
 * Chạy:
 *   npx tsx scripts/backfill-example-vi.ts                 (Dry-run)
 *   npx tsx scripts/backfill-example-vi.ts --apply         (Chạy thật toàn bộ DB)
 *   npx tsx scripts/backfill-example-vi.ts --apply --provider=groq --batch=15
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Provider = 'groq' | 'gemini' | 'openrouter' | 'zhipu' | 'auto';

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
  200,
  parseInt((process.argv.find((a) => a.startsWith('--sleep=')) || '').split('=')[1] || '600', 10),
);
const PROVIDER_ARG = (
  (process.argv.find((a) => a.startsWith('--provider=')) || '').split('=')[1] ||
  process.env.EXAMPLE_VI_PROVIDER ||
  'groq'
).toLowerCase() as Provider;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const VI_CHAR_RE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const rawLine of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1).trim();
      }
      process.env[m[1].trim()] = v;
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

export function extractVietnameseSentenceTranslation(example: string | null | undefined): string | null {
  if (!example) return null;
  const s = example.trim();

  // 1) Ngoặc tròn/vuông chứa chữ Việt ở cuối câu: "(Bản dịch tiếng Việt...)"
  const parenMatch = s.match(/[\(\[][^\)\]]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][^\)\]]*[\)\]]$/i);
  if (parenMatch) {
    return parenMatch[0].replace(/^[\(\[]|[\)\]]$/g, '').trim();
  }

  // 2) Phân cách dạng " / " hoặc " | " hoặc " — " theo sau bởi tiếng Việt
  const sepMatch = s.match(/\s*[\/|—–-]\s*([^A-Za-z]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][\s\S]*)$/i);
  if (sepMatch) {
    return sepMatch[1].trim();
  }

  return null;
}

export function cleanEnglishSentence(example: string): string {
  let s = (example || '').replace(/\s+/g, ' ').trim();
  if (!s || !VI_CHAR_RE.test(s)) return s;

  // Gỡ ngoặc tròn/vuông chứa tiếng Việt
  s = s.replace(/\s*[\(\[][^\)\]]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][^\)\]]*[\)\]]/gi, '');
  // Gỡ đuôi sau " / " hoặc " — "
  s = s.replace(/\s*[\/|—–-]\s*[^A-Za-z]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][\s\S]*$/i, '');
  return s.trim();
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
  const groq: LlmSlot = {
    id: 'groq',
    label: 'groq',
    kind: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    keys: splitKeys(process.env.GROQ_API_KEY),
  };
  const gemini: LlmSlot = {
    id: 'gemini',
    label: 'gemini',
    kind: 'gemini',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    keys: splitKeys(process.env.GEMINI_API_KEY),
  };
  const openrouter: LlmSlot = {
    id: 'openrouter',
    label: 'openrouter',
    kind: 'openai',
    baseUrl: (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    keys: splitKeys(process.env.OPENROUTER_API_KEY),
  };
  const zhipu: LlmSlot = {
    id: 'zhipu',
    label: 'zhipu',
    kind: 'openai',
    baseUrl: (process.env.ZHIPU_BASE_URL || process.env.BIGMODEL_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, ''),
    model: process.env.ZHIPU_MODEL || process.env.GLM_MODEL || 'glm-4-flash',
    keys: splitKeys(process.env.ZHIPU_API_KEY, process.env.BIGMODEL_API_KEY, process.env.GLM_API_KEY),
  };

  const all = [groq, gemini, openrouter, zhipu];
  if (pref === 'auto') return all.filter((s) => s.keys.length > 0);
  const one = all.find((s) => s.id === pref);
  if (!one) throw new Error(`Provider không hợp lệ: ${pref}`);
  if (!one.keys.length) {
    // fallback sang provider có key
    const available = all.filter(s => s.keys.length > 0);
    if (available.length > 0) {
      console.warn(`[backfill-example-vi] Thiếu key cho ${pref}, tự chuyển sang ${available[0].id}`);
      return [available[0]];
    }
    throw new Error(`Thiếu API key cho ${pref}.`);
  }
  return [one];
}

let slots: LlmSlot[] = [];
let slotIdx = 0;
let keyIdx = 0;

function currentSlot(): LlmSlot {
  return slots[slotIdx % slots.length];
}

function rotateKeyOrProvider() {
  const slot = currentSlot();
  keyIdx++;
  if (keyIdx < slot.keys.length) {
    console.log(`  ↻ ${slot.label} key #${keyIdx + 1}/${slot.keys.length}`);
    return;
  }
  keyIdx = 0;
  if (slots.length > 1) {
    slotIdx = (slotIdx + 1) % slots.length;
    console.log(`  ↻ Chuyển provider → ${currentSlot().label}`);
  } else {
    console.log(`  ⏳ ${slot.label} đã hết lượt key, chờ cooldown…`);
  }
}

async function callOpenAi(slot: LlmSlot, prompt: string): Promise<string> {
  const apiKey = slot.keys[keyIdx % slot.keys.length];
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const res = await fetch(`${slot.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: slot.model,
      messages: [
        {
          role: 'system',
          content: 'You are a bilingual EN-VI translator for an English learning app. Translate English example sentences into natural, idiomatic Vietnamese. Output valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`${slot.label} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = JSON.parse(body) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };
  if (json.error?.message) throw new Error(json.error.message);
  const msg = json.choices?.[0]?.message;
  const content = (msg?.content || '').trim();
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
    { signal: AbortSignal.timeout(30_000) },
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
    const isAuthError = /401|invalid.?api.?key|expired|unauthorized/i.test(msg);
    const isRateLimit = /429|rate.?limit|quota|too many|1113|资源|限流/i.test(msg);
    if (isAuthError && attempt < 10) {
      console.log(`  ⚠ Auth error (${slot.label}) · rotating key immediately`);
      rotateKeyOrProvider();
      await sleep(200);
      return llm(prompt, attempt + 1);
    }
    if (isRateLimit && attempt < 15) {
      rotateKeyOrProvider();
      const wait = Math.min(20_000, 2000 * (attempt + 1));
      console.log(`  ⚠ Rate limit (${slot.label}) · wait ${wait}ms · retry ${attempt + 1}`);
      await sleep(wait);
      return llm(prompt, attempt + 1);
    }
    if (slots.length > 1 && attempt < slots.length * 2) {
      rotateKeyOrProvider();
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

// Quản lý file cache để resume nếu gián đoạn
const CACHE_DIR = path.join(process.cwd(), 'tmp');
const CACHE_FILE = path.join(CACHE_DIR, 'example-vi-cache.json');

function loadCache(): Map<string, string> {
  const map = new Map<string, string>();
  if (existsSync(CACHE_FILE)) {
    try {
      const data = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string' && v.trim()) {
          map.set(k, v.trim());
        }
      }
      console.log(`[backfill-example-vi] Loaded ${map.size} cached translations from ${CACHE_FILE}`);
    } catch {
      // ignore
    }
  }
  return map;
}

function saveCache(cache: Map<string, string>) {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    const obj = Object.fromEntries(cache);
    writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save cache:', err);
  }
}

async function main() {
  loadEnv();
  slots = buildSlots(PROVIDER_ARG);
  if (!slots.length) {
    throw new Error('Không có API key nào khả dụng.');
  }

  console.log('================================================================');
  console.log(`🚀 [backfill-example-vi] MODE: ${DRY ? 'DRY-RUN (thêm --apply để ghi DB)' : 'LIVE APPLY'}`);
  console.log(`📦 Providers: ${slots.map((s) => `${s.label} (${s.keys.length} keys · ${s.model})`).join(' → ')}`);
  console.log(`⚡ Batch: ${BATCH} | Sleep: ${SLEEP_MS}ms | Limit: ${LIMIT || 'ALL'}`);
  console.log('================================================================\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // 1. Quét toàn bộ bảng words bằng PK cursor pagination
  console.log('🔍 Bước 1: Quét cơ sở dữ liệu tìm các câu ví dụ chưa có bản dịch...');
  const missingRows: Row[] = [];
  let lastId = '';
  let totalWordsScanned = 0;

  while (true) {
    let q = sb.from('words').select('id, word, example, example_vi').order('id').limit(1000);
    if (lastId) q = q.gt('id', lastId);

    const { data, error } = await q;
    if (error) throw new Error(`Lỗi quét words: ${error.message}`);
    if (!data || data.length === 0) break;

    totalWordsScanned += data.length;
    for (const r of data as Row[]) {
      const ex = (r.example || '').trim();
      const exVi = (r.example_vi || '').trim();
      if (ex && !exVi) {
        missingRows.push(r);
      }
    }

    lastId = data[data.length - 1].id;
    if (data.length < 1000) break;
  }

  console.log(`✅ Quét xong ${totalWordsScanned} từ. Phát hiện ${missingRows.length} từ chưa có example_vi.\n`);
  if (!missingRows.length) {
    console.log('🎉 Toàn bộ từ đã có example_vi. Không cần backfill!');
    return;
  }

  const work = LIMIT > 0 ? missingRows.slice(0, LIMIT) : missingRows;

  // Load cache hiện có
  const translationCache = loadCache();

  // 2. Phase 1: Regex Extraction (Tự bóc tách bản dịch tiếng Việt nhúng trong câu)
  console.log('🧩 Bước 2: Tự động trích xuất bản dịch tiếng Việt có sẵn bằng Regex...');
  let regexFound = 0;
  const directUpdates: Array<{ id: string; vi: string }> = [];
  const needTranslationExamples = new Set<string>();

  for (const r of work) {
    const rawEx = r.example.trim();

    // Kiểm tra cache trước
    if (translationCache.has(rawEx)) {
      directUpdates.push({ id: r.id, vi: translationCache.get(rawEx)! });
      continue;
    }

    // Kiểm tra regex
    const extracted = extractVietnameseSentenceTranslation(rawEx);
    if (extracted && extracted.length >= 3 && VI_CHAR_RE.test(extracted)) {
      regexFound++;
      translationCache.set(rawEx, extracted);
      directUpdates.push({ id: r.id, vi: extracted });
    } else {
      // Làm sạch câu tiếng Anh (gỡ ngoặc thừa nếu có)
      const cleanEn = cleanEnglishSentence(rawEx);
      if (cleanEn) {
        needTranslationExamples.add(rawEx);
      }
    }
  }

  saveCache(translationCache);
  console.log(`  ✓ Trích xuất trực tiếp thành công: ${regexFound} câu`);
  console.log(`  ✓ Số câu tiếng Anh độc nhất cần AI dịch: ${needTranslationExamples.size} câu\n`);

  // 3. Phase 2: AI Translation Batching
  const uniqueList = Array.from(needTranslationExamples).filter((ex) => !translationCache.has(ex));
  console.log(`🤖 Bước 3: Dịch AI cho ${uniqueList.length} câu tiếng Anh độc nhất...`);

  let translatedBatchCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < uniqueList.length; i += BATCH) {
    const group = uniqueList.slice(i, i + BATCH);
    const cleanGroup = group.map((en, idx) => ({ i: idx, en: cleanEnglishSentence(en) }));

    const prompt = `Dịch MỖI câu tiếng Anh sang 1 câu tiếng Việt TỰ NHIÊN, CHUẨN XÁC, dành cho người học tiếng Anh. Không giải thích, không word-by-word.

Trả JSON đúng dạng:
{"vi":{"0":"...","1":"...",...}}
Khóa = index số 0..${group.length - 1}.

Danh sách câu:
${JSON.stringify(cleanGroup)}`;

    let raw = '';
    try {
      raw = await llm(prompt);
    } catch (e) {
      console.log(`  ✗ Lỗi batch ${i}: ${errMsg(e)}`);
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
          // ignore
        }
      }
    }

    let batchHits = 0;
    for (let j = 0; j < group.length; j++) {
      let vi = (map[String(j)] || '').trim();
      // Loại bỏ dấu ngoặc thừa bọc cả câu nếu AI sinh ra
      vi = vi.replace(/^["'\(]+|["'\)]+$/g, '').trim();
      if (vi.length >= 2 && VI_CHAR_RE.test(vi)) {
        translationCache.set(group[j], vi);
        batchHits++;
      }
    }

    translatedBatchCount++;
    const currentTotal = Math.min(i + BATCH, uniqueList.length);
    const pct = ((currentTotal / uniqueList.length) * 100).toFixed(1);
    const speed = (currentTotal / ((Date.now() - startTime) / 1000)).toFixed(1);
    console.log(`  [${pct}%] ${currentTotal}/${uniqueList.length} câu · batch +${batchHits} · tốc độ ${speed} câu/s · ${currentSlot().label}`);

    // Lưu cache mỗi 5 batch để đảm bảo an toàn
    if (translatedBatchCount % 5 === 0) {
      saveCache(translationCache);
    }

    await sleep(SLEEP_MS);
  }

  saveCache(translationCache);
  console.log(`\n✅ Hoàn thành dịch AI. Tổng số câu dịch trong cache: ${translationCache.size}.\n`);

  // 4. Phase 3: Fast Parallel Database Update
  console.log('💾 Bước 4: Cập nhật bản dịch vào bảng words...');

  // Gom nhóm các từ theo câu ví dụ để update hàng loạt
  const updatesByVi = new Map<string, string[]>(); // vi -> array of word IDs
  let matchCount = 0;
  let unmatchCount = 0;

  for (const r of work) {
    const rawEx = r.example.trim();
    const vi = translationCache.get(rawEx);
    if (vi) {
      matchCount++;
      const list = updatesByVi.get(vi) || [];
      list.push(r.id);
      updatesByVi.set(vi, list);
    } else {
      unmatchCount++;
    }
  }

  console.log(`  Sẵn sàng cập nhật ${matchCount} từ (${updatesByVi.size} bản dịch unique). Chưa khớp: ${unmatchCount}`);

  if (DRY) {
    console.log('\n[DRY-RUN] Bỏ qua ghi DB. Mẫu các câu đã dịch:');
    let previewCount = 0;
    for (const [vi, ids] of updatesByVi.entries()) {
      if (previewCount++ >= 5) break;
      console.log(`  📝 (${ids.length} từ): "${vi}"`);
    }
    console.log('\n👉 Chạy lại với cờ `--apply` để ghi thực tế vào Supabase.');
    return;
  }

  // Thực hiện ghi DB song song với concurrency hợp lý
  let dbOk = 0;
  let dbFail = 0;
  const viEntries = Array.from(updatesByVi.entries());
  const CHUNK_SIZE = 200; // Mỗi lần .in('id', chunk) tối đa 200 IDs
  const CONCURRENCY = 15; // 15 request song song

  // Tạo danh sách các task update
  type UpdateTask = { vi: string; ids: string[] };
  const tasks: UpdateTask[] = [];

  for (const [vi, ids] of viEntries) {
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      tasks.push({ vi, ids: ids.slice(i, i + CHUNK_SIZE) });
    }
  }

  console.log(`  Đang cập nhật qua ${tasks.length} bulk requests (concurrency = ${CONCURRENCY})...`);

  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const chunk = tasks.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (task) => {
        const { error } = await sb
          .from('words')
          .update({ example_vi: task.vi })
          .in('id', task.ids);

        if (error) {
          console.error(`  ✗ Lỗi update DB: ${error.message}`);
          dbFail += task.ids.length;
        } else {
          dbOk += task.ids.length;
        }
      })
    );

    if ((i + CONCURRENCY) % 100 === 0 || i + CONCURRENCY >= tasks.length) {
      const progress = Math.min(i + CONCURRENCY, tasks.length);
      console.log(`  ⏳ Đã lưu ${dbOk}/${matchCount} từ (${progress}/${tasks.length} requests)...`);
    }
  }

  console.log(`\n🎉 HOÀN TẤT: Cập nhật thành công ${dbOk} từ vào database (Thất bại: ${dbFail})!`);

  // Đồng bộ global_dictionary nếu có yêu cầu
  if (SYNC_GD) {
    console.log('\n📚 Đồng bộ sang global_dictionary...');
    // ...
  }
}

main().catch((err) => {
  console.error('Fatal error in backfill-example-vi:', err);
  process.exit(1);
});
