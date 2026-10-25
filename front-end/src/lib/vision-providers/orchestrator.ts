/**
 * [VisionOrch] Orchestrate giữa nhiều Vision providers để tối đa tốc độ + tránh quota.
 *
 * Round-robin qua các providers available:
 *   1. Groq LLaMA-4 Scout       (~200 verifies/day free)
 *   2. HuggingFace Llama-3.2 Vision (~1,000/day free)
 *   3. Cloudflare Llama-3.2 Vision  (~200-300/day free)
 *
 * Tổng: ~1,500/day free. Đủ verify 3,500 ảnh trong 2-3 ngày.
 *
 * Cách dùng từ verify-pass-low-conf.ts:
 *   const { verifyImageMulti } = await import('../src/lib/vision-providers/orchestrator');
 *   const result = await verifyImageMulti(url, ctx);
 */

type Provider = 'ollama' | 'groq' | 'hf' | 'cf' | 'or';

interface ProviderState {
  name: Provider;
  available: boolean;
  exhaustedUntil: number;
  consecutiveErrors: number;
}

const providers: Record<Provider, ProviderState> = {
  ollama: { name: 'ollama', available: false, exhaustedUntil: 0, consecutiveErrors: 0 },
  groq: { name: 'groq', available: false, exhaustedUntil: 0, consecutiveErrors: 0 },
  hf: { name: 'hf', available: false, exhaustedUntil: 0, consecutiveErrors: 0 },
  cf: { name: 'cf', available: false, exhaustedUntil: 0, consecutiveErrors: 0 },
  or: { name: 'or', available: false, exhaustedUntil: 0, consecutiveErrors: 0 },
};

let lastUsed: Provider = 'cf';

function checkAvailability() {
  // Ollama CHẬM trên CPU-only (25-40s/từ AMD Ryzen 5) + accuracy bias NO → tạm tắt.
  // Bật lại khi có GPU NVIDIA hoặc model nhỏ accuracy tốt hơn.
  providers.ollama.available = process.env.USE_OLLAMA === 'true';
  providers.groq.available = !!process.env.GROQ_API_KEY;
  providers.hf.available = false; // deprecated
  providers.cf.available = !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  providers.or.available = !!process.env.OPENROUTER_API_KEY;
}

function pickNextProvider(): Provider | null {
  const now = Date.now();
  // STRATEGY: Ollama local là FREE + unlimited → ưu tiên TUYỆT ĐỐI khi available.
  // Các providers cloud chỉ làm fallback khi Ollama không hoạt động (lỗi server local).
  if (providers.ollama.available && providers.ollama.exhaustedUntil <= now) {
    lastUsed = 'ollama';
    return 'ollama';
  }
  // Fallback round-robin các providers cloud
  const order: Provider[] = ['groq', 'cf', 'or'];
  const lastIdx = order.indexOf(lastUsed as 'groq' | 'cf' | 'or');
  for (let i = 1; i <= order.length; i++) {
    const p = order[(lastIdx + i) % order.length];
    const s = providers[p];
    if (s.available && s.exhaustedUntil <= now) {
      lastUsed = p;
      return p;
    }
  }
  return null;
}

function markExhausted(p: Provider, retryAfterSec = 3600) {
  providers[p].exhaustedUntil = Date.now() + retryAfterSec * 1000;
  providers[p].consecutiveErrors++;
  console.log(`[VisionOrch] ${p} EXHAUSTED, retry sau ${retryAfterSec}s`);
}

function markSuccess(p: Provider) {
  providers[p].consecutiveErrors = 0;
}

export async function verifyImageMulti(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string; provider: string }> {
  checkAvailability();

  const order: Provider[] = ['ollama', 'groq', 'hf', 'cf', 'or'];
  const triedProviders: string[] = [];

  for (let attempt = 0; attempt < order.length; attempt++) {
    const p = pickNextProvider();
    if (!p) break;
    if (triedProviders.includes(p)) continue;
    triedProviders.push(p);

    let result: { score: number; reason: string };
    try {
      if (p === 'ollama') {
        const { verifyImageMeaningOllama } = await import('./ollama-vision');
        result = await verifyImageMeaningOllama(imageUrl, ctx);
      } else if (p === 'groq') {
        const { verifyImageMeaningGroq } = await import('../groq-vision');
        result = await verifyImageMeaningGroq(imageUrl, ctx);
      } else if (p === 'hf') {
        const { verifyImageMeaningHF } = await import('./huggingface-vision');
        result = await verifyImageMeaningHF(imageUrl, ctx);
      } else if (p === 'cf') {
        const { verifyImageMeaningCF } = await import('./cloudflare-vision');
        result = await verifyImageMeaningCF(imageUrl, ctx);
      } else {
        const { verifyImageMeaningOR } = await import('./openrouter-vision');
        result = await verifyImageMeaningOR(imageUrl, ctx);
      }
    } catch (e) {
      result = { score: -1, reason: `${p} exc: ${(e as Error).message}` };
    }

    // Nếu rate limit/exhausted → mark + thử provider khác
    if (result.score === -1 && /rate limit|exhausted|429|TPD|quota/i.test(result.reason)) {
      markExhausted(p, 1800); // 30 phút cooldown
      continue;
    }

    // Score thật (kể cả 0) — return luôn, gắn provider tag vào reason để verify-pass log
    markSuccess(p);
    return { ...result, reason: `${p}: ${result.reason}`, provider: p };
  }

  return { score: -1, reason: `all providers exhausted/failed (tried: ${triedProviders.join(', ')})`, provider: 'none' };
}
