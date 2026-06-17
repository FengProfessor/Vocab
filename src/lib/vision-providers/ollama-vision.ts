/**
 * [OllamaVision] Self-host Vision qua Ollama local + LLaVA-Phi3.
 * Endpoint: http://localhost:11434/api/generate
 * Model: llava-phi3 (2.7GB, fast CPU ~1.5s/inference)
 *
 * ZERO cost, ZERO quota, FULLY LOCAL.
 * Strategy: VQA yes/no question — LLaVA-Phi3 trả "Yes" hoặc "No" với confidence cao.
 *   Yes → score 90 (auto KEEP)
 *   No  → score 10 (auto RESET)
 *   Unknown → score 50 (LOW)
 *
 * Ollama auto-load model lần đầu (~40s warmup), sau đó cache.
 */

const ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_VISION_MODEL || 'llava-phi3';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

/**
 * Pre-process URL để fetch ảnh nhỏ hơn nếu provider hỗ trợ query params.
 * Image size là bottleneck #1 cho Ollama CPU inference (73KB → 40s, 14KB → 2.7s).
 */
function smartResizeUrl(url: string): string {
  // Pexels: replace h=N&w=M với 200x300
  if (url.includes('pexels.com')) {
    return url
      .replace(/[?&]h=\d+/g, '')
      .replace(/[?&]w=\d+/g, '')
      .replace(/(\?)/, '?h=200&w=300&');
  }
  // DuckDuckGo / Wikipedia: thường KHÔNG có resize params → tải full, nhưng cap byte
  return url;
}

export async function verifyImageMeaningOllama(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  // Fetch image → base64 (đã smart-resize URL nếu được)
  let base64: string;
  try {
    const fetchUrl = smartResizeUrl(imageUrl);
    const imgRes = await fetch(fetchUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!imgRes.ok) return { score: 0, reason: `image fetch ${imgRes.status}` };
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.byteLength < 1000) return { score: 0, reason: 'image too small' };
    // Cap 50KB — quá lớn → skip Ollama (fallback provider khác trong orchestrator)
    if (buf.byteLength > 50_000) {
      return { score: -1, reason: `img too big ${buf.byteLength}B for Ollama CPU` };
    }
    base64 = buf.toString('base64');
  } catch (e) {
    return { score: -1, reason: `img fetch exc: ${(e as Error).message}` };
  }

  // VQA prompt — LLaVA-Phi3 follow "YES or NO" tốt
  const prompt = `Does this image clearly illustrate the English word "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}? Meaning: "${ctx.definition || ''}". Answer ONLY: YES or NO`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        images: [base64],
        stream: false,
        options: { num_predict: 10, temperature: 0.1 },
        keep_alive: '30m', // GIỮ model trong RAM 30 phút, tránh reload (40s cost)
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      return { score: -1, reason: `http ${res.status}` };
    }

    const json = await res.json();
    const reply = String(json?.response || '').trim().toLowerCase();

    // Parse YES/NO answer
    if (/^\W*yes\b/.test(reply)) {
      return { score: 90, reason: `ollama: YES (${reply.slice(0, 40)})` };
    }
    if (/^\W*no\b/.test(reply)) {
      return { score: 10, reason: `ollama: NO (${reply.slice(0, 40)})` };
    }
    // Ambiguous / empty → LOW (giữ ảnh tạm)
    return { score: 50, reason: `ollama: ambiguous "${reply.slice(0, 60)}"` };
  } catch (e) {
    return { score: -1, reason: `exc: ${(e as Error).message}` };
  }
}
