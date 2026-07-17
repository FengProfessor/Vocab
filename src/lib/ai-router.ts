/**
 * AI Router — Zhipu GLM Flash (free) primary + Groq fallback
 * Gemini / GLM-5.2 bỏ (5.2 cần nạp).
 *
 * Keys:
 *   ZHIPU_API_KEY / BIGMODEL_API_KEY / GLM_API_KEY — comma-separated
 *   GROQ_API_KEY — optional fallback (gsk_…)
 *   ZHIPU_BASE_URL — default https://open.bigmodel.cn/api/paas/v4
 *   GLM_MODEL — default glm-4-flash
 */

type ProviderId = 'zhipu' | 'groq';

interface RouterKey {
  key: string;
  provider: ProviderId;
  cooldownUntil: number;
  totalCalls: number;
  errors429: number;
}

export type ModelTier = 'fast' | 'normal' | 'smart';

const GLM_MODEL =
  process.env.GLM_MODEL?.trim() ||
  process.env.ZHIPU_MODEL?.trim() ||
  'glm-4-flash';

/** Fallback free Flash khác nếu model chính lỗi */
const GLM_FALLBACK_MODELS = (
  process.env.GLM_FALLBACK_MODELS ||
  'glm-4.7-flash,glm-4-flash'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const ZHIPU_BASE =
  (process.env.ZHIPU_BASE_URL || process.env.BIGMODEL_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4')
    .replace(/\/$/, '');

const GROQ_MODEL_MAP: Record<ModelTier, string> = {
  fast: 'llama-3.1-8b-instant',
  normal: 'llama-3.1-8b-instant',
  smart: 'llama-3.3-70b-versatile',
};

const TIMEOUT_MAP: Record<ModelTier, number> = {
  fast: 12_000,
  normal: 45_000,
  smart: 180_000,
};

const COOLDOWN_MS = 60_000;

function parseKeys(raw: string, provider: ProviderId): RouterKey[] {
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((key) => ({
      key,
      provider,
      cooldownUntil: 0,
      totalCalls: 0,
      errors429: 0,
    }));
}

function extractChatText(data: {
  choices?: Array<{
    message?: { content?: string | null; reasoning_content?: string | null };
  }>;
}): string {
  const msg = data?.choices?.[0]?.message;
  const content = (msg?.content ?? '').trim();
  if (content) return content;
  // Một số model flash trả reasoning_content, content rỗng
  return (msg?.reasoning_content ?? '').trim();
}

function isBalanceOrQuotaError(msg: string): boolean {
  return (
    msg.includes('1113') ||
    msg.includes('余额不足') ||
    msg.includes('无可用资源包') ||
    msg.includes('insufficient') ||
    msg.includes('balance')
  );
}

async function openAiChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
  jsonMode: boolean,
  timeoutMs: number,
  label: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`[${label}] HTTP ${response.status}: ${txt}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string | null; reasoning_content?: string | null };
      }>;
    };
    return extractChatText(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Gọi Zhipu: GLM_MODEL rồi fallback Flash khác */
async function zhipuChatWithFallback(
  apiKey: string,
  prompt: string,
  jsonMode: boolean,
  timeoutMs: number,
): Promise<string> {
  const models = [GLM_MODEL, ...GLM_FALLBACK_MODELS.filter((m) => m !== GLM_MODEL)];
  let lastErr: Error = new Error('[Zhipu] no model');

  for (const model of models) {
    try {
      console.log(`[AIRouter] Zhipu try model=${model}`);
      const text = await openAiChat(
        ZHIPU_BASE,
        apiKey,
        model,
        prompt,
        jsonMode,
        timeoutMs,
        'Zhipu',
      );
      if (!text) {
        lastErr = new Error(`[Zhipu] empty content model=${model}`);
        continue;
      }
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      lastErr = err instanceof Error ? err : new Error(msg);
      // Hết balance/trial 5.2 → thử Flash free; 429 rate → ném ra cho router cooldown
      if (isBalanceOrQuotaError(msg)) {
        console.warn(`[AIRouter] Zhipu balance/quota on ${model}, fallback next`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export class AIRouter {
  private keys: RouterKey[] = [];
  private rrIndex = 0;

  constructor(keys: RouterKey[]) {
    this.keys = keys;
    if (this.keys.length === 0) {
      throw new Error(
        '[AIRouter] No keys. Set ZHIPU_API_KEY (or BIGMODEL_API_KEY / GLM_API_KEY) and/or GROQ_API_KEY',
      );
    }
  }

  getKey(): RouterKey {
    const now = Date.now();
    const available = this.keys.filter((k) => k.cooldownUntil < now);
    if (available.length === 0) {
      throw new Error('[AIRouter] All keys in cooldown');
    }
    // Ưu tiên zhipu còn available, rồi groq
    const preferred = available.filter((k) => k.provider === 'zhipu');
    const pool = preferred.length > 0 ? preferred : available;
    this.rrIndex = (this.rrIndex + 1) % pool.length;
    return pool[this.rrIndex];
  }

  async generate(prompt: string, tier: ModelTier = 'normal', jsonMode = false): Promise<string> {
    let lastErr: Error = new Error('[AIRouter] No keys available');
    const maxAttempts = Math.max(this.keys.length, 1);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let keyEntry: RouterKey;
      try {
        keyEntry = this.getKey();
      } catch {
        throw lastErr;
      }

      try {
        if (keyEntry.provider === 'groq') {
          const model = GROQ_MODEL_MAP[tier];
          console.log(`[AIRouter] Groq ${model} ...${keyEntry.key.slice(-8)}`);
          const text = await openAiChat(
            'https://api.groq.com/openai/v1',
            keyEntry.key,
            model,
            prompt,
            jsonMode,
            TIMEOUT_MAP[tier],
            'Groq',
          );
          keyEntry.totalCalls++;
          return text;
        }

        // Zhipu / BigModel — Flash free
        console.log(`[AIRouter] Zhipu ...${keyEntry.key.slice(-8)}`);
        const text = await zhipuChatWithFallback(
          keyEntry.key,
          prompt,
          jsonMode,
          TIMEOUT_MAP[tier],
        );
        keyEntry.totalCalls++;
        return text;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // 1113 balance đã xử lý trong zhipu fallback; còn lại 429 rate-limit → cooldown key
        const isRateLimit =
          (msg.includes('429') && !isBalanceOrQuotaError(msg)) ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('rateLimitExceeded') ||
          msg.includes('too many requests') ||
          msg.includes('1302');

        if (isRateLimit) {
          keyEntry.cooldownUntil = Date.now() + COOLDOWN_MS;
          keyEntry.errors429++;
          lastErr = new Error(`[AIRouter] Rate limited (attempt ${attempt + 1}): ${msg}`);
          console.warn(`[AIRouter] 429 ...${keyEntry.key.slice(-8)}, cooldown ${COOLDOWN_MS}ms`);
          continue;
        }
        // Lỗi mạng/5xx/model: thử key/provider khác thay vì fail ngay
        lastErr = err instanceof Error ? err : new Error(msg);
        console.warn(`[AIRouter] key fail ...${keyEntry.key.slice(-8)}: ${msg.slice(0, 160)}`);
        // cooldown ngắn cho key hỏng tạm
        keyEntry.cooldownUntil = Date.now() + 8_000;
        continue;
      }
    }

    throw lastErr;
  }

  stats(): Array<{ key: string; provider: ProviderId; calls: number; errors: number; available: boolean }> {
    const now = Date.now();
    return this.keys.map((k) => ({
      key: `...${k.key.slice(-8)}`,
      provider: k.provider,
      calls: k.totalCalls,
      errors: k.errors429,
      available: k.cooldownUntil < now,
    }));
  }
}

let _router: AIRouter | null = null;

/** Build pool: Zhipu first, Groq fallback. Gemini bỏ. */
export function buildRouterKeysFromEnv(): RouterKey[] {
  const zhipuRaw =
    process.env.ZHIPU_API_KEY ||
    process.env.BIGMODEL_API_KEY ||
    process.env.GLM_API_KEY ||
    '';
  const groqRaw = process.env.GROQ_API_KEY || '';

  return [...parseKeys(zhipuRaw, 'zhipu'), ...parseKeys(groqRaw, 'groq')];
}

export function getRouter(): AIRouter {
  if (!_router) {
    const keys = buildRouterKeysFromEnv();
    if (keys.length === 0) {
      throw new Error(
        '[AIRouter] Set ZHIPU_API_KEY (glm-4-flash) and/or GROQ_API_KEY — Gemini/5.2 disabled',
      );
    }
    _router = new AIRouter(keys);
  }
  return _router;
}

/** Test / custom key: zhipu key string hoặc gsk_ */
export function createRouterFromKeyString(apiKeys: string): AIRouter {
  const parts = apiKeys
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .map((key) => ({
      key,
      provider: (key.startsWith('gsk_') ? 'groq' : 'zhipu') as ProviderId,
      cooldownUntil: 0,
      totalCalls: 0,
      errors429: 0,
    }));
  return new AIRouter(parts);
}
