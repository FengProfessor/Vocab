/**
 * Gemini multi-key — mỗi request xoay đúng 1 key (round-robin).
 * GEMINI_API_KEY=key1,key2,key3
 * GEMINI_MODEL=gemini-3.5-flash-lite | gemini-flash-lite-latest | ...
 *
 * 429 trên key đó → cooldown key, throw ngay (caller fallback Zhipu).
 * Không thử key khác trong cùng 1 request.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const LOG = '[GeminiMulti]';
const COOLDOWN_MS = 60_000;

type KeyState = {
  key: string;
  cooldownUntil: number;
  errors429: number;
  calls: number;
};

let keys: KeyState[] = [];
/** Index key sẽ dùng cho request tiếp theo */
let rr = 0;
let loaded = false;

function loadKeys(): void {
  if (loaded) return;
  loaded = true;
  const raw = process.env.GEMINI_API_KEY || '';
  keys = raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((key) => ({ key, cooldownUntil: 0, errors429: 0, calls: 0 }));
  if (keys.length) {
    console.log(`${LOG} loaded ${keys.length} key(s) · RR 1 key / request`);
  }
}

export function hasGeminiKeys(): boolean {
  loadKeys();
  return keys.length > 0;
}

export function geminiKeyCount(): number {
  loadKeys();
  return keys.length;
}

export function resolveGeminiModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GEMINI_PACK_MODEL?.trim() ||
    'gemini-3.5-flash-lite'
  );
}

/**
 * Xoay đúng 1 lần: lấy keys[rr], rồi rr++.
 * Nếu key đang cooldown → nhảy tiếp tối đa 1 vòng để tìm key rảnh (vẫn 1 key / request).
 */
function pickKeyOnce(): KeyState {
  loadKeys();
  if (keys.length === 0) {
    throw new Error(`${LOG} no GEMINI_API_KEY`);
  }

  const now = Date.now();
  const start = rr % keys.length;

  for (let i = 0; i < keys.length; i++) {
    const idx = (start + i) % keys.length;
    const entry = keys[idx];
    if (entry.cooldownUntil <= now) {
      // request sau bắt đầu từ key kế tiếp
      rr = (idx + 1) % keys.length;
      return entry;
    }
  }

  const waitSec = Math.ceil(
    Math.min(...keys.map((k) => k.cooldownUntil - now)) / 1000,
  );
  throw new Error(`${LOG} all ${keys.length} keys in cooldown (~${waitSec}s)`);
}

function mark429(entry: KeyState): void {
  entry.errors429 += 1;
  entry.cooldownUntil = Date.now() + COOLDOWN_MS;
  console.warn(
    `${LOG} 429 key ...${entry.key.slice(-6)} cooldown ${COOLDOWN_MS / 1000}s (errors=${entry.errors429})`,
  );
}

/**
 * 1 request = 1 key (RR). Không retry key khác trong cùng call.
 */
export async function geminiGenerate(
  prompt: string,
  opts?: { json?: boolean; temperature?: number; model?: string },
): Promise<string> {
  const entry = pickKeyOnce();
  const modelName = opts?.model || resolveGeminiModel();
  const json = opts?.json ?? true;
  const temperature = opts?.temperature ?? 0.3;

  try {
    entry.calls += 1;
    const genAI = new GoogleGenerativeAI(entry.key);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    });
    console.log(
      `${LOG} model=${modelName} key=...${entry.key.slice(-6)} calls=${entry.calls} nextRR=${rr}`,
    );
    const r = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = (r.response.text() || '').trim();
    if (!text) throw new Error(`${LOG} empty response`);
    return text;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/429|Too Many Requests|quota|rate.?limit/i.test(msg)) {
      mark429(entry);
      throw new Error(`${LOG} 429 on ...${entry.key.slice(-6)} (no same-request rotate)`);
    }
    if (/404|not found|no longer/i.test(msg)) {
      throw new Error(`${LOG} model unavailable: ${modelName} · ${msg.slice(0, 160)}`);
    }
    throw err instanceof Error ? err : new Error(msg);
  }
}
