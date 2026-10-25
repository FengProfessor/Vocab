/**
 * FULL fix grammar exercises trên prod DB:
 * 1) Xóa meta/boilerplate, pollution chéo topic (high-precision), mojibake, VI-only rác
 * 2) Dedup trong lesson
 * 3) Gen bù bằng Groq (canonical type: mcq|fill|error) tới target
 *
 *   npx tsx scripts/grammar-gen/fix-refill-exercises-db.ts --dry
 *   npx tsx scripts/grammar-gen/fix-refill-exercises-db.ts --apply --clean-only
 *   npx tsx scripts/grammar-gen/fix-refill-exercises-db.ts --apply --target 80
 *   npx tsx scripts/grammar-gen/fix-refill-exercises-db.ts --apply --provider openrouter --target 50
 *   npx tsx scripts/grammar-gen/fix-refill-exercises-db.ts --apply --only future-will,mixed-conditionals
 *
 * Provider: openrouter (mặc định, free) | groq | gemini-cli | gemini-api
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

// ─── CLI ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const get = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? (args[i + 1] ?? '') : '';
};
const DRY = !has('--apply');
const CLEAN_ONLY = has('--clean-only');
const TARGET = Math.max(12, parseInt(get('--target') || '80', 10) || 80);
const PROVIDER = (get('--provider') || 'openrouter').toLowerCase();
const ONLY = get('--only')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const LOG = '[GrammarFixFull]';

type Ex = {
  type?: string;
  q?: string;
  question?: string;
  opts?: string[];
  options?: string[];
  answer?: string | string[] | boolean;
  correct_answer?: string | string[] | boolean;
  fb?: string;
  explanation?: string;
  difficulty?: number;
  [k: string]: unknown;
};

// ─── Env ───────────────────────────────────────────────────────────────────
function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]]) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function getQ(e: Ex): string {
  return String(e.question ?? e.q ?? '').trim();
}
function getOpts(e: Ex): string[] {
  const o = e.options ?? e.opts;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
}
function getAns(e: Ex): unknown {
  return e.correct_answer !== undefined ? e.correct_answer : e.answer;
}
function getFb(e: Ex): string {
  return String(e.explanation ?? e.fb ?? '').trim();
}

// ─── High-precision removal rules ──────────────────────────────────────────
/** allowSlugs rỗng = xóa mọi lesson */
type Rule = { id: string; re: RegExp; allow: string[] };

const META_RULES: Rule[] = [
  { id: 'meta-cau-truc', re: /^chọn cấu trúc phù hợp nhất\.?$/i, allow: [] },
  { id: 'meta-dien-ten', re: /^điền tên cấu trúc\/chủ điểm đang luyện\.?$/i, allow: [] },
  { id: 'meta-kiem-tra', re: /^điều cần kiểm tra đầu tiên là gì\??$/i, allow: [] },
  { id: 'meta-loi-khuyen', re: /^chọn lời khuyên sai\.?$/i, allow: [] },
  { id: 'meta-dich-tu', re: /^có thể luôn dịch từng từ tiếng việt/i, allow: [] },
  { id: 'meta-vi-du-khac', re: /^câu nào là một ví dụ đúng khác\??$/i, allow: [] },
  {
    id: 'meta-bo-thanh-phan',
    re: /^câu\/mô tả nào sai\??$/i,
    allow: [],
  },
];

const POLLUTION_RULES: Rule[] = [
  // There is/are stock
  {
    id: 'there-choose-form',
    re: /choose the correct form:\s*there\s+___/i,
    allow: ['there-is-there-are'],
  },
  {
    id: 'there-cat-students-water',
    re: /there\s+___\s+(a cat|many students|some water)\b/i,
    allow: ['there-is-there-are'],
  },
  // Subjunctive stock (sai chỗ)
  {
    id: 'subj-named',
    re: /subjunctive mood|subjunctive construction|uses the subjunctive correctly|correct subjunctive/i,
    allow: ['subjunctive'],
  },
  {
    id: 'subj-vital-finish',
    re: /it is vital that she finish|it is imperative that the witness|it is essential that he be|it is crucial that he ___ the contract|it is required that every applicant provides|it is recommended that the building is evacuated|they proposed that he go home/i,
    allow: ['subjunctive'],
  },
  // Wish stock
  {
    id: 'wish-stock',
    re: /which sentence correctly uses the past subjunctive|i wish i were taller|if only he ___ here now|i wish i ___ \(know\) the answer/i,
    allow: ['wish-if-only', 'subjunctive'],
  },
  // Gerund/infinitive stock block (copy-paste hàng loạt)
  {
    id: 'gerund-stock',
    re: /they managed ___ the project on time despite|she promised ___ \(call\) me as soon|we hope ___ abroad for our summer|i remember ___ \(lock\) the door|she suggested ___ to the cinema this weekend|i finished to write the report|don'?t forget ___ \(turn\) off the lights|he seems ___ tired today|they agreed ___ us with the move|i prepared studying for the exam|select the right structure:\s*they managed/i,
    allow: ['gerunds-infinitives'],
  },
  {
    id: 'gerund-finished-writing',
    re: /which sentence is grammatically correct\?[\s\S]*finished writing the report/i,
    allow: ['gerunds-infinitives'],
  },
  // Conditional stock in wrong lessons (future-will etc.)
  {
    id: 'mixed-cond-stock',
    re: /if he had studied harder, he ___ a doctor now|if i were you, i ___ that job yesterday|if they had left earlier, they ___ here by now/i,
    allow: [
      'mixed-conditionals',
      'second-conditional',
      'third-conditional',
      'conditionals-0-1',
      'wish-if-only',
    ],
  },
  {
    id: 'second-cond-shoes',
    re: /if i ___ \(be\) in your shoes, i would accept/i,
    allow: ['second-conditional', 'mixed-conditionals', 'subjunctive', 'wish-if-only'],
  },
  // Plural / article stock in wrong place (often countable contamination is softer)
  {
    id: 'plural-of-named',
    re: /^what is the plural of/i,
    allow: ['plural-nouns'],
  },
  // Modal permission stock wrongly placed
  {
    id: 'permission-borrow-dict',
    re: /can i ___ your dictionary for a few minutes|may i borrow your laptop, sir/i,
    allow: ['modals-permission', 'modals-ability'],
  },
  // Extra stock pollution seen in audit
  {
    id: 'there-is-are-basic',
    re: /choose the correct form:\s*there\s+___|there\s+___\s+(a|an|many|some|two)\b/i,
    allow: ['there-is-there-are'],
  },
  {
    id: 'to-be-weather',
    re: /choose the correct to be form:\s*the weather\s+___/i,
    allow: ['verb-to-be', 'present-simple'],
  },
];

function hasMojibake(s: string): boolean {
  return (
    /Ho\?n th\?nh|c\?u:|th\?nh|Ã.|â€|á»|áº|�/.test(s) ||
    /Ho\?n th\?nh c\?u/i.test(s)
  );
}

function isMostlyVietnamesePrompt(q: string): boolean {
  // Câu hỏi toàn tiếng Việt (không phải instruction chuẩn EN grammar)
  if (/^chọn |^điền |^câu |^hoàn thành|^tìm |^find |^choose |^complete |^select /i.test(q)) {
    return false;
  }
  const vi = (q.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || [])
    .length;
  const enWords = (q.match(/\b[a-z]{3,}\b/gi) || []).length;
  const letters = (q.match(/[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g) || [])
    .length;
  if (letters < 12) return false;
  // Nhiều dấu Việt + ít từ Anh
  return vi >= 3 && enWords <= 2;
}

function matchRule(q: string, slug: string, rules: Rule[]): string | null {
  for (const r of rules) {
    if (!r.re.test(q)) continue;
    if (r.allow.length === 0) return r.id;
    if (!r.allow.includes(slug)) return r.id;
  }
  return null;
}

/** Meta error options: "This sentence missing required grammar" */
function isMetaErrorJunk(e: Ex): boolean {
  const opts = getOpts(e).join(' ').toLowerCase();
  return (
    opts.includes('this sentence missing required grammar') ||
    opts.includes('incorrectly structure sentence') ||
    opts.includes('có thể bỏ mọi thành phần bắt buộc')
  );
}

type DropReason = string;

function shouldDrop(e: Ex, slug: string): DropReason | null {
  const q = getQ(e);
  if (!q) return 'empty-q';

  const meta = matchRule(q, slug, META_RULES);
  if (meta) return meta;

  if (isMetaErrorJunk(e)) return 'meta-error-junk';

  // "Câu này tự nhiên..." + feedback meta generic
  if (
    /^câu này tự nhiên và đúng ngữ pháp/i.test(q) &&
    /minh họa một biến thể|cấu trúc tự nhiên/i.test(getFb(e))
  ) {
    // Keep only if sentence clearly on-topic is hard; drop generic seed pair after meta block
    // Drop if it's the seed template style (short fb)
    if (getFb(e).length < 80) return 'meta-tf-seed';
  }

  const poll = matchRule(q, slug, POLLUTION_RULES);
  if (poll) return poll;

  // Multi-line / opts+q match for gerund stock
  const blob = `${q}\n${getOpts(e).join('\n')}`;
  const poll2 = matchRule(blob, slug, POLLUTION_RULES);
  if (poll2) return poll2;

  if (hasMojibake(q) || hasMojibake(getFb(e)) || getOpts(e).some(hasMojibake)) {
    return 'mojibake';
  }

  // VI-only prompts (đặc biệt countable-uncountable batch tiếng Việt)
  if (isMostlyVietnamesePrompt(q)) return 'vi-only-prompt';

  // "Chọn câu dùng đúng X" seed — low quality but on-topic; keep
  // Drop fill "Hoàn thành theo mẫu" only if mojibake already handled

  return null;
}

function normalizeType(t: string | undefined): string {
  if (!t) return 'mcq';
  if (t === 'multiple_choice') return 'mcq';
  if (t === 'fill_blank') return 'fill';
  if (t === 'error_correction') return 'error';
  return t;
}

function toCanonical(e: Ex): Ex {
  const type = normalizeType(e.type);
  const q = getQ(e);
  const opts = getOpts(e);
  const ans = getAns(e);
  const fb = getFb(e);
  const difficulty =
    typeof e.difficulty === 'number' && [1, 2, 3].includes(e.difficulty) ? e.difficulty : 2;

  // Keep compact canonical shape used by golden + drill
  const out: Ex = { type, q, answer: ans as string | string[] | boolean, fb, difficulty };
  if (type === 'mcq' || type === 'error') {
    out.opts = opts.length ? opts : type === 'error' ? [] : [];
  } else if (type === 'fill') {
    if (opts.length) out.opts = opts;
    // ensure answer is array for fill when string
    if (typeof ans === 'string') out.answer = [ans];
    else if (Array.isArray(ans)) out.answer = ans.map(String);
  } else if (type === 'tf') {
    if (typeof ans === 'boolean') out.answer = ans;
    else {
      const s = String(ans).toLowerCase();
      out.answer = s === 'true' || s === 'đúng' || s === 'yes' || s === 'correct';
    }
  } else {
    if (opts.length) out.opts = opts;
  }
  return out;
}

function qKey(e: Ex): string {
  return getQ(e).toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanLesson(
  slug: string,
  exercises: Ex[],
): { kept: Ex[]; dropped: { idx: number; reason: string; q: string }[] } {
  const dropped: { idx: number; reason: string; q: string }[] = [];
  const kept: Ex[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < exercises.length; i++) {
    const e = exercises[i];
    const reason = shouldDrop(e, slug);
    if (reason) {
      dropped.push({ idx: i, reason, q: getQ(e).slice(0, 100) });
      continue;
    }
    const key = qKey(e);
    if (key && seen.has(key)) {
      dropped.push({ idx: i, reason: 'dup', q: getQ(e).slice(0, 100) });
      continue;
    }
    if (key) seen.add(key);
    kept.push(toCanonical(e));
  }
  return { kept, dropped };
}

// ─── LLM generation ────────────────────────────────────────────────────────
function splitKeys(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 8);
}

let groqKeyIdx = 0;
function nextGroqKey(): string {
  const keys = splitKeys(process.env.GROQ_API_KEY);
  if (!keys.length) throw new Error('Thiếu GROQ_API_KEY');
  const k = keys[groqKeyIdx % keys.length];
  groqKeyIdx++;
  return k;
}

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    // strip raw control chars that break JSON.parse (keep \n via re-escape later if needed)
    .replace(/[\u0000-\u001F]+/g, ' ')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*"exercises"[\s\S]*\}/);
    if (!m) throw new Error(`No JSON object in LLM output: ${cleaned.slice(0, 120)}`);
    try {
      return JSON.parse(m[0]);
    } catch {
      // last resort: remove trailing commas
      const fixed = m[0].replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    }
  }
}

async function callOpenRouterJson(prompt: string): Promise<unknown> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.length < 10) throw new Error('Thiếu OPENROUTER_API_KEY');
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lingopro.app',
      'X-Title': 'LingoPro grammar fix-refill',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert English grammar teacher for Vietnamese learners. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const text = await res.text();
    const waitMatch = text.match(/try again in ([\d.]+)\s*s/i);
    if (res.status === 429) {
      const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1]) + 2) : 20;
      const err = new Error(`OpenRouter HTTP 429: wait ${waitSec}s`);
      (err as Error & { waitMs?: number }).waitMs = waitSec * 1000;
      throw err;
    }
    throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('OpenRouter empty content');
  return extractJsonObject(content);
}

async function callGroqJson(prompt: string): Promise<unknown> {
  const key = nextGroqKey();
  // 8b: TPM cao hơn, rẻ hơn; 70b dễ 429 trên free tier
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an expert English grammar teacher for Vietnamese learners. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const text = await res.text();
    // Parse "try again in Xs" / "in 29.5s"
    const waitMatch = text.match(/try again in ([\d.]+)\s*s/i);
    if (res.status === 429 && waitMatch) {
      const waitSec = Math.ceil(parseFloat(waitMatch[1]) + 2);
      const err = new Error(`Groq HTTP 429: wait ${waitSec}s`);
      (err as Error & { waitMs?: number }).waitMs = waitSec * 1000;
      throw err;
    }
    throw new Error(`Groq HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Groq empty content');
  return extractJsonObject(content);
}

/** Gemini CLI headless — cần GEMINI_API_KEY + settings selectedType=gemini-api-key */
async function callGeminiCliJson(prompt: string): Promise<unknown> {
  const model = process.env.GEMINI_CLI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const fullPrompt =
    prompt +
    '\n\nIMPORTANT: Output ONLY a single JSON object. No markdown fences, no commentary.';
  const args = ['-p', fullPrompt, '-m', model, '-o', 'text', '--yolo'];
  try {
    const { stdout, stderr } = await execFileAsync('gemini', args, {
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        GEMINI_CLI_TRUST_WORKSPACE: 'true',
      },
      shell: true,
    });
    const text = `${stdout}\n${stderr}`;
    if (/IneligibleTierError|exhausted your daily quota|leaked/i.test(text)) {
      throw new Error(`Gemini CLI auth/quota: ${text.slice(0, 200)}`);
    }
    return extractJsonObject(stdout || stderr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/429|quota|rate/i.test(msg)) {
      const err = new Error(`Gemini CLI 429: ${msg.slice(0, 160)}`);
      (err as Error & { waitMs?: number }).waitMs = 45_000;
      throw err;
    }
    throw new Error(`Gemini CLI fail: ${msg.slice(0, 240)}`);
  }
}

/** Gemini REST API (không qua CLI) */
async function callGeminiApiJson(prompt: string): Promise<unknown> {
  const keys = splitKeys(process.env.GEMINI_API_KEY);
  if (!keys.length) throw new Error('Thiếu GEMINI_API_KEY');
  const key = keys[Math.floor(Math.random() * keys.length)];
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 4500,
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      const err = new Error(`Gemini API 429: ${text.slice(0, 120)}`);
      (err as Error & { waitMs?: number }).waitMs = 40_000;
      throw err;
    }
    throw new Error(`Gemini API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini API empty');
  return extractJsonObject(text);
}

async function callLlmJson(prompt: string): Promise<unknown> {
  if (PROVIDER === 'groq') return callGroqJson(prompt);
  if (PROVIDER === 'gemini-cli') return callGeminiCliJson(prompt);
  if (PROVIDER === 'gemini-api' || PROVIDER === 'gemini') return callGeminiApiJson(prompt);
  // default openrouter
  return callOpenRouterJson(prompt);
}

function validateGen(ex: unknown): ex is {
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
} {
  if (!ex || typeof ex !== 'object') return false;
  const e = ex as Record<string, unknown>;
  if (!['multiple_choice', 'fill_blank', 'error_correction', 'mcq', 'fill', 'error'].includes(String(e.type)))
    return false;
  if (typeof e.question !== 'string' || !e.question.trim()) return false;
  if (!Array.isArray(e.options) || e.options.length < 3 || e.options.length > 5) return false;
  if (typeof e.correct_answer !== 'string' || !e.correct_answer.trim()) return false;
  const opts = e.options.map((o) => String(o).trim());
  const ans = e.correct_answer.trim();
  if (!opts.some((o) => o.toLowerCase() === ans.toLowerCase())) return false;
  if (typeof e.explanation !== 'string' || !e.explanation.trim()) return false;
  return true;
}

function genToCanonical(ex: {
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty?: number;
}): Ex {
  let type = normalizeType(ex.type);
  // map legacy names already handled
  if (type === 'fill_blank') type = 'fill';
  if (type === 'multiple_choice') type = 'mcq';
  if (type === 'error_correction') type = 'error';

  const opts = ex.options.map((o) => String(o).trim());
  const matched = opts.find((o) => o.toLowerCase() === ex.correct_answer.trim().toLowerCase()) ?? ex.correct_answer;
  const difficulty =
    typeof ex.difficulty === 'number' && [1, 2, 3].includes(ex.difficulty) ? ex.difficulty : 2;

  if (type === 'fill') {
    // fill_blank style with options → keep as mcq if options look like choices; else fill
    // Prefer fill: answer as array of acceptable forms; still keep options if short words
    return {
      type: 'fill',
      q: ex.question,
      opts,
      answer: [matched],
      fb: ex.explanation,
      difficulty,
    };
  }
  return {
    type: type === 'error' ? 'error' : 'mcq',
    q: ex.question,
    opts,
    answer: matched,
    fb: ex.explanation,
    difficulty,
  };
}

async function generateBatch(
  slug: string,
  title: string,
  titleVi: string,
  level: string,
  definition: string,
  existingQs: string[],
  batchSize: number,
): Promise<Ex[]> {
  const prompt = `Generate exactly ${batchSize} NEW English grammar exercises ONLY about: ${title} (${titleVi}).
Level: ${level}. Context: ${definition.slice(0, 280)}

Rules:
- Test ONLY this topic (slug=${slug}). No other grammar topics mixed in.
- Mix types: multiple_choice, fill_blank, error_correction.
- fill_blank: question has "___"; 4 short options.
- error_correction: "Find the error: " + sentence; 4 options = words in sentence; answer = wrong word.
- multiple_choice: 4 options; correct_answer exact match.
- explanation: Vietnamese, max 2 sentences.
- difficulty: 1|2|3.
- No meta questions. English stems only.
- Avoid similar to: ${JSON.stringify(existingQs.slice(-12))}

JSON only: {"exercises":[{"type","question","options","correct_answer","explanation","difficulty"}]}`;

  const raw = await callLlmJson(prompt);
  const arr = (raw as { exercises?: unknown[] })?.exercises;
  if (!Array.isArray(arr)) throw new Error('No exercises array');

  const out: Ex[] = [];
  for (const item of arr) {
    if (!validateGen(item)) continue;
    // Reject if still matches pollution against this slug? check foreign topics
    const q = item.question;
    if (matchRule(q, slug, META_RULES) || matchRule(q, slug, POLLUTION_RULES)) continue;
    if (hasMojibake(q) || isMostlyVietnamesePrompt(q)) continue;
    // Reject if existing dup
    if (existingQs.some((eq) => eq === q.toLowerCase().replace(/\s+/g, ' '))) continue;
    out.push(genToCanonical(item));
  }
  return out;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu Supabase env');

  const client: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  const { data: topics, error: te } = await client
    .from('grammar_topics')
    .select('id, slug, title, title_vi, level');
  if (te) throw te;

  const { data: lessons, error: le } = await client
    .from('grammar_lessons')
    .select('id, topic_id, title, exercises, sections, theory_vi');
  if (le) throw le;

  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));
  const onlySet = ONLY.length ? new Set(ONLY) : null;

  const report: {
    slug: string;
    before: number;
    afterClean: number;
    dropped: number;
    reasons: Record<string, number>;
    generated: number;
    final: number;
  }[] = [];

  let totalDropped = 0;
  let totalGen = 0;

  const work = (lessons ?? []).filter((lesson) => {
    const slug = topicById.get(lesson.topic_id)?.slug ?? '';
    return !onlySet || onlySet.has(slug);
  });

  console.log(
    `${LOG} lessons=${work.length} dry=${DRY} cleanOnly=${CLEAN_ONLY} target=${TARGET} provider=${PROVIDER} only=${ONLY.join(',') || '*'}`,
  );

  for (const lesson of work) {
    const topic = topicById.get(lesson.topic_id);
    const slug = topic?.slug ?? String(lesson.topic_id);
    const title = topic?.title ?? lesson.title ?? slug;
    const titleVi = topic?.title_vi ?? lesson.title ?? slug;
    const level = topic?.level ?? 'beginner';
    const before = Array.isArray(lesson.exercises) ? (lesson.exercises as Ex[]) : [];
    const { kept, dropped } = cleanLesson(slug, before);

    const reasons: Record<string, number> = {};
    for (const d of dropped) {
      reasons[d.reason] = (reasons[d.reason] || 0) + 1;
    }
    totalDropped += dropped.length;

    let exercises = kept;
    let generated = 0;

    console.log(
      `${LOG} ${slug}: ${before.length} → clean ${kept.length} (drop ${dropped.length}) ${JSON.stringify(reasons)}`,
    );
    if (dropped.length && dropped.length <= 8) {
      dropped.forEach((d) => console.log(`   - #${d.idx} [${d.reason}] ${d.q}`));
    } else if (dropped.length > 8) {
      dropped.slice(0, 5).forEach((d) => console.log(`   - #${d.idx} [${d.reason}] ${d.q}`));
      console.log(`   ... +${dropped.length - 5} dropped`);
    }

    // Refill
    if (!CLEAN_ONLY && exercises.length < TARGET) {
      const need = TARGET - exercises.length;
      const batchSize = 6;
      const batches = Math.ceil(need / batchSize);
      console.log(`${LOG} ${slug}: need gen ${need} (${batches} batches)`);

      for (let b = 0; b < batches; b++) {
        const remain = TARGET - exercises.length;
        if (remain <= 0) break;
        const n = Math.min(batchSize, remain);
        const existingQs = exercises.map((e) => qKey(e));
        const def =
          (typeof lesson.sections === 'object' &&
          lesson.sections &&
          (lesson.sections as { definition?: string }).definition) ||
          String(lesson.theory_vi ?? '').slice(0, 280);

        if (DRY) {
          console.log(`${LOG} ${slug}: dry-skip gen batch ${b + 1} size=${n}`);
          break;
        }

        let ok = false;
        for (let attempt = 0; attempt < 5 && !ok; attempt++) {
          try {
            const news = await generateBatch(slug, title, titleVi, level, def, existingQs, n);
            if (!news.length) throw new Error('0 valid after filter');
            // re-clean generated
            const { kept: k2 } = cleanLesson(slug, news);
            const seen = new Set(exercises.map(qKey));
            let added = 0;
            for (const ex of k2) {
              const k = qKey(ex);
              if (!k || seen.has(k)) continue;
              seen.add(k);
              exercises.push(ex);
              added++;
              generated++;
              totalGen++;
              if (exercises.length >= TARGET) break;
            }
            console.log(
              `${LOG} ${slug}: batch ${b + 1} +${added} (total ${exercises.length}/${TARGET})`,
            );
            ok = added > 0;
            if (!ok) throw new Error('all dups/filtered');
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const waitMs =
              typeof err === 'object' && err && 'waitMs' in err
                ? Number((err as { waitMs?: number }).waitMs) || 0
                : 0;
            console.warn(`${LOG} ${slug}: gen fail attempt ${attempt + 1}: ${msg}`);
            if (/429|rate|quota/i.test(msg)) await sleep(waitMs > 0 ? waitMs : 35_000);
            else await sleep(1500 * (attempt + 1));
          }
        }
        if (!ok) {
          console.error(`${LOG} ${slug}: stop gen after failures`);
          break;
        }
        await sleep(1500);
      }
    }

    // Hard cap 100. KHÔNG cắt content đã clean chỉ vì > TARGET
    // (TARGET chỉ là ngưỡng gen bù, không phải max bắt buộc)
    const HARD_CAP = 100;
    if (exercises.length > HARD_CAP) {
      exercises = exercises.slice(0, HARD_CAP);
    }

    report.push({
      slug,
      before: before.length,
      afterClean: kept.length,
      dropped: dropped.length,
      reasons,
      generated,
      final: DRY && !CLEAN_ONLY ? kept.length : exercises.length,
    });

    if (!DRY) {
      const { error } = await client
        .from('grammar_lessons')
        .update({ exercises })
        .eq('id', lesson.id);
      if (error) throw new Error(`${slug}: ${error.message}`);
      // clear quiz cache if exists
      await client.from('grammar_quiz_cache').delete().eq('lesson_id', lesson.id);
      console.log(`${LOG} UPDATED ${slug} final=${exercises.length}`);
    }
  }

  // Report
  const outDir = path.join(process.cwd(), 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const summary = {
    dry: DRY,
    cleanOnly: CLEAN_ONLY,
    target: TARGET,
    totalDropped,
    totalGen,
    report: report.sort((a, b) => b.dropped - a.dropped),
  };
  writeFileSync(path.join(outDir, 'grammar-fix-refill-report.json'), JSON.stringify(summary, null, 2));

  console.log(`\n${LOG} === SUMMARY ===`);
  console.log(`${LOG} dropped=${totalDropped} generated=${totalGen} dry=${DRY}`);
  for (const r of report.sort((a, b) => b.dropped - a.dropped).slice(0, 25)) {
    console.log(
      `  ${r.slug.padEnd(32)} ${r.before} → clean ${r.afterClean} +gen ${r.generated} → final~${r.final} drop=${r.dropped}`,
    );
  }
  console.log(`${LOG} report: tmp/grammar-fix-refill-report.json`);
}

main().catch((e) => {
  console.error(LOG, 'FATAL', e);
  process.exit(1);
});
