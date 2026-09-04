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
  const envModel =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GEMINI_PACK_MODEL?.trim();
  if (!envModel || envModel === 'gemini-2.0-flash' || envModel === 'gemini-3.5-flash-lite') {
    return 'gemini-3.6-flash';
  }
  return envModel;
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
  const modelName = opts?.model || resolveGeminiModel();
  const json = opts?.json ?? true;
  const temperature = opts?.temperature ?? 0.3;

  loadKeys();
  const maxAttempts = Math.max(keys.length, 1);
  let lastError: Error = new Error(`${LOG} No Gemini keys available`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let entry: KeyState;
    try {
      entry = pickKeyOnce();
    } catch (_e: unknown) {
      throw lastError;
    }

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
        `${LOG} model=${modelName} key=...${entry.key.slice(-6)} calls=${entry.calls} attempt=${attempt + 1}`,
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
        lastError = new Error(`${LOG} 429 on ...${entry.key.slice(-6)}`);
        console.warn(`${LOG} 429 on ...${entry.key.slice(-6)}, trying next key...`);
        continue;
      }
      if (/503|500|502|504|Service Unavailable|high demand|overloaded|fetch failed|econnreset|etimedout/i.test(msg)) {
        lastError = new Error(`${LOG} transient error on ...${entry.key.slice(-6)}: ${msg.slice(0, 100)}`);
        console.warn(`${LOG} transient error on ...${entry.key.slice(-6)}: ${msg.slice(0, 80)}, trying next key...`);
        continue;
      }
      if (/404|not found|no longer/i.test(msg)) {
        if (modelName !== 'gemini-3.6-flash') {
          console.warn(`${LOG} model ${modelName} returned 404, falling back to gemini-3.6-flash...`);
          return geminiGenerate(prompt, { ...opts, model: 'gemini-3.6-flash' });
        }
        throw new Error(`${LOG} model unavailable: ${modelName} · ${msg.slice(0, 160)}`);
      }
      throw err instanceof Error ? err : new Error(msg);
    }
  }
  throw lastError;
}
