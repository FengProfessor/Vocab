import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Router — phân loại task → chọn model phù hợp → quản lý quota
 *
 * Model tiers:
 *   'fast'   → gemini-2.5-flash-lite  (rẻ nhất, tasks đơn giản: classify, pick index)
 *   'normal' → gemini-2.5-flash        (tasks trung bình: ai-lookup, short generation)
 *   'smart'  → gemini-2.5-flash        (tasks phức tạp: full enrichment, long context)
 *
 * Key rotation:
 *   - Parse GEMINI_API_KEY (comma-separated) thành pool
 *   - Mỗi key có cooldown timestamp (tránh gọi lại key đang bị 429)
 *   - Round-robin với skip key đang cooldown
 *   - Nếu tất cả keys cooldown → throw RateLimitError
 */

interface RouterKey {
  key: string;
  cooldownUntil: number; // epoch ms, 0 = available
  totalCalls: number;
  errors429: number;
}

export type ModelTier = 'fast' | 'normal' | 'smart';

const MODEL_MAP: Record<ModelTier, string> = {
  fast: 'gemini-2.5-flash-lite',
  normal: 'gemini-2.5-flash',
  smart: 'gemini-2.5-flash',
};

/** Timeout per tier (ms) */
const TIMEOUT_MAP: Record<ModelTier, number> = {
  fast: 12_000,
  normal: 30_000,
  smart: 60_000,
};

const COOLDOWN_MS = 60_000; // 60s sau khi bị 429

export class AIRouter {
  private keys: RouterKey[] = [];
  private rrIndex = 0;

  constructor(apiKeys: string) {
    this.keys = apiKeys
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .map(key => ({ key, cooldownUntil: 0, totalCalls: 0, errors429: 0 }));

    if (this.keys.length === 0) {
      throw new Error('[AIRouter] No valid API keys found in GEMINI_API_KEY');
    }
  }

  /** Lấy key available (không trong cooldown), round-robin */
  getKey(): RouterKey {
    const now = Date.now();
    const available = this.keys.filter(k => k.cooldownUntil < now);
    if (available.length === 0) {
      throw new Error('[AIRouter] All keys in cooldown');
    }
    this.rrIndex = (this.rrIndex + 1) % available.length;
    return available[this.rrIndex];
  }

  /**
   * Gọi AI với retry tự động khi 429.
   * Thử tối đa keys.length lần, mỗi lần dùng key khác.
   */
  async generate(prompt: string, tier: ModelTier = 'normal', jsonMode = false): Promise<string> {
    let lastErr: Error = new Error('[AIRouter] No keys available');

    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      let keyEntry: RouterKey;
      try {
        keyEntry = this.getKey();
      } catch {
        throw lastErr;
      }

      try {
        const genAI = new GoogleGenerativeAI(keyEntry.key);
        const model = genAI.getGenerativeModel({
          model: MODEL_MAP[tier],
          generationConfig: jsonMode
            ? { responseMimeType: 'application/json' }
            : undefined,
        });

        const result = await Promise.race([
          model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`[AIRouter] Timeout after ${TIMEOUT_MAP[tier]}ms (tier=${tier})`)),
              TIMEOUT_MAP[tier]
            )
          ),
        ]);

        keyEntry.totalCalls++;
        return result.response.text();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Phát hiện rate limit / quota lỗi
        if (
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('rateLimitExceeded')
        ) {
          keyEntry.cooldownUntil = Date.now() + COOLDOWN_MS;
          keyEntry.errors429++;
          lastErr = new Error(`[AIRouter] Key rate limited (attempt ${attempt + 1}): ${msg}`);
          console.warn(`[AIRouter] 429 on key ...${keyEntry.key.slice(-8)}, cooldown ${COOLDOWN_MS}ms`);
          continue; // thử key tiếp
        }
        // Lỗi khác (network, parse, timeout) → throw luôn
        throw err;
      }
    }

    throw lastErr;
  }

  /** Thống kê trạng thái các keys */
  stats(): Array<{ key: string; calls: number; errors: number; available: boolean }> {
    const now = Date.now();
    return this.keys.map(k => ({
      key: `...${k.key.slice(-8)}`,
      calls: k.totalCalls,
      errors: k.errors429,
      available: k.cooldownUntil < now,
    }));
  }
}

// Singleton per process (API routes share this in same Node.js instance)
let _router: AIRouter | null = null;

export function getRouter(): AIRouter {
  if (!_router) {
    const keys = process.env.GEMINI_API_KEY || '';
    if (!keys) throw new Error('[AIRouter] GEMINI_API_KEY not set');
    _router = new AIRouter(keys);
  }
  return _router;
}
