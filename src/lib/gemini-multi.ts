/**
 * Gemini multi-key rotation (free tier tạm).
 * GEMINI_API_KEY=key1,key2,key3
 * GEMINI_MODEL=gemini-2.5-flash-lite | gemini-flash-lite-latest | ...
 *
 * Ưu tiên model Lite (RPM/RPD cao hơn trên free).
 * 429 → cooldown key → key khác; hết pool → throw (caller fallback Zhipu).
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
    console.log(`${LOG} loaded ${keys.length} key(s)`);
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

/** Model mặc định: Lite (free RPD cao hơn Flash full trên dashboard user) */
export function resolveGeminiModel(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GEMINI_PACK_MODEL?.trim() ||
    'gemini-2.5-flash-lite'
  );
}

function pickKey(): KeyState {
  loadKeys();
  const now = Date.now();
  const available = keys.filter((k) => k.cooldownUntil <= now);
  if (available.length === 0) {
    throw new Error(`${LOG} all keys in cooldown (${keys.length} total)`);
  }
  rr = (rr + 1) % available.length;
  return available[rr];
}

function mark429(entry: KeyState): void {
  entry.errors429 += 1;
  entry.cooldownUntil = Date.now() + COOLDOWN_MS;
  console.warn(
    `${LOG} 429 key ...${entry.key.slice(-6)} cooldown ${COOLDOWN_MS / 1000}s (errors=${entry.errors429})`,
  );
}

/**
 * Generate text (optional JSON mode). Rotates keys on 429.
 */
export async function geminiGenerate(
  prompt: string,
  opts?: { json?: boolean; temperature?: number; model?: string },
): Promise<string> {
  loadKeys();
  if (keys.length === 0) {
    throw new Error(`${LOG} no GEMINI_API_KEY`);
  }

  const modelName = opts?.model || resolveGeminiModel();
  const json = opts?.json ?? true;
  const temperature = opts?.temperature ?? 0.3;
  const maxAttempts = Math.max(keys.length, 1) + 1;
  let lastErr: Error = new Error(`${LOG} no attempt`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let entry: KeyState;
    try {
      entry = pickKey();
    } catch (e) {
      throw e instanceof Error ? e : lastErr;
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
        `${LOG} try model=${modelName} key=...${entry.key.slice(-6)} attempt=${attempt + 1}`,
      );
      const r = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = (r.response.text() || '').trim();
      if (!text) throw new Error(`${LOG} empty response`);
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastErr = err instanceof Error ? err : new Error(msg);
      if (/429|Too Many Requests|quota|rate.?limit/i.test(msg)) {
        mark429(entry);
        continue;
      }
      // model name invalid — surface immediately
      if (/404|not found|no longer/i.test(msg)) {
        throw new Error(`${LOG} model unavailable: ${modelName} · ${msg.slice(0, 160)}`);
      }
      throw lastErr;
    }
  }

  throw lastErr;
}
