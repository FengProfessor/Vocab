/**
 * [CFVision] Verify ảnh qua Cloudflare Workers AI.
 * Free tier: 10,000 neurons/day. Vision ~30-50 neurons/req → ~200-300 verifies/day.
 * Model: @cf/meta/llama-3.2-11b-vision-instruct
 *
 * Env:
 *   CLOUDFLARE_ACCOUNT_ID=xxx (32 ký tự)
 *   CLOUDFLARE_API_TOKEN=xxx
 */

// LLaVA-1.5-7b OPEN, không cần Model Agreement, chạy ngay free tier.
// Llama-3.2-Vision yêu cầu submit 'agree' prompt trước → phức tạp.
const MODEL = process.env.CF_VISION_MODEL || '@cf/llava-hf/llava-1.5-7b-hf';
const LOG = '[CFVision]';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

export async function verifyImageMeaningCF(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) return { score: -1, reason: 'no CF credentials' };

  // Cloudflare Workers AI cần image bytes (array of integers) hoặc base64.
  // Fetch ảnh về byte array.
  let imageBytes: number[];
  try {
    const imgRes = await fetch(imageUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!imgRes.ok) return { score: 0, reason: `image fetch ${imgRes.status}` };
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.byteLength < 1000) return { score: 0, reason: 'image too small' };
    if (buf.byteLength > 4_000_000) return { score: 0, reason: 'image too large' };
    imageBytes = Array.from(buf);
  } catch (e) {
    return { score: -1, reason: `image fetch exc: ${(e as Error).message}` };
  }

  // LLaVA-1.5 nhỏ, follow prompt phức tạp kém. Dùng prompt đơn giản, lenient hơn.
  // Groq sẽ catch các trường hợp tinh tế (text-card, brand) trong round-robin.
  const prompt = `Look at this image. Does it correctly illustrate the English word "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}?
Meaning: "${ctx.definition || ''}"

Scoring:
- 90-100: Perfect match
- 70-89: Good, clearly related
- 40-69: Weak link
- 15-39: Wrong word/context
- 0-14: Image only shows text/letters (no visual meaning)

Reply ONE line, exact format:
SCORE: <number> | REASON: <short, max 60 chars>`;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          image: imageBytes,
          max_tokens: 150,
        }),
        signal: AbortSignal.timeout(45000),
      }
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      if (res.status === 429) return { score: -1, reason: 'rate limit' };
      console.error(`${LOG} HTTP ${res.status}:`, txt.slice(0, 150));
      return { score: -1, reason: `http ${res.status}` };
    }

    const json = await res.json();
    // CF LLaVA trả về { result: { description: "..." } } (KHÔNG phải response)
    const content: string = json?.result?.description || json?.result?.response || '';
    if (!content) return { score: 0, reason: 'no content' };

    // Parse "SCORE: <number> | REASON: <text>"
    const scoreMatch = content.match(/SCORE\s*[:=]\s*(\d+)/i);
    const reasonMatch = content.match(/REASON\s*[:=]\s*(.+?)(?:$|\||\n)/i);

    if (!scoreMatch) {
      // Fallback: tìm số 0-100 đầu tiên trong response
      const numMatch = content.match(/\b([0-9]{1,3})\b/);
      if (!numMatch) return { score: 0, reason: `no score: ${content.slice(0, 80)}` };
      const score = Math.max(0, Math.min(100, parseInt(numMatch[1], 10)));
      return { score, reason: content.slice(0, 100).replace(/\n/g, ' ') };
    }

    const score = Math.max(0, Math.min(100, parseInt(scoreMatch[1], 10)));
    const reason = (reasonMatch?.[1] || content).trim().slice(0, 100);
    return { score, reason };
  } catch (e) {
    return { score: -1, reason: `exc: ${(e as Error).message}` };
  }
}
