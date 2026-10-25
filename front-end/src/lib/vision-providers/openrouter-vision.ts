/**
 * [ORVision] Verify ảnh qua OpenRouter API.
 * Free tier: ~50-200 req/day cho :free models, 20 req/min.
 * Vision models free đáng dùng:
 *   - meta-llama/llama-3.2-90b-vision-instruct:free  (90B! Cực mạnh)
 *   - meta-llama/llama-4-maverick:free               (Llama-4, multimodal)
 *   - mistralai/pixtral-12b:free                     (12B, fast)
 *
 * Env: OPENROUTER_API_KEY=sk-or-v1-xxx
 * Optional: OR_VISION_MODEL=meta-llama/llama-3.2-90b-vision-instruct:free
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
// Llama-3.2-90B-Vision đã bị retire. Gemma-4/Kimi temporarily upstream-rate-limited.
// Nemotron-3-nano-omni-30B (NVIDIA) là model FREE vision DUY NHẤT stable hiện tại.
const MODEL = process.env.OR_VISION_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
const LOG = '[ORVision]';

function pickKey(): string {
  const raw = process.env.OPENROUTER_API_KEY || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

export async function verifyImageMeaningOR(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  const key = pickKey();
  if (!key) return { score: -1, reason: 'no OPENROUTER_API_KEY' };

  const prompt = `You are verifying whether an image correctly illustrates an English vocabulary word.

Word: "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}
Meaning: "${ctx.definition || ''}"

CRITICAL RULES:
- Image is ONLY text/letters (dictionary card, scrabble, definition page) → match_score: 5
- Image is a brand logo containing the word → match_score: 10
- Image is webpage screenshot with the word as text → match_score: 10
- Image is unrelated → match_score: 20

If image ACTUALLY DEPICTS the meaning:
- 90-100: Perfect
- 70-89: Good, clearly related
- 40-69: Weak link

Return ONLY one JSON object on one line:
{"match_score": <int 0-100>, "reason": "<short, max 80 chars>"}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        // OpenRouter rate-limits theo HTTP-Referer, gán title app để identify
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://lingopro.online',
        'X-Title': 'LingoPro Vocab Image Verify',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
        // response_format không hỗ trợ rộng rãi trên :free models → bỏ
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      if (res.status === 429) {
        // Retry với cooldown header
        const retryAfter = parseFloat(res.headers.get('retry-after') || '10');
        return { score: -1, reason: `rate limit (retry ${retryAfter}s)` };
      }
      console.error(`${LOG} HTTP ${res.status}:`, txt.slice(0, 200));
      return { score: -1, reason: `http ${res.status}` };
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content || '';

    let parsed: { match_score?: number; reason?: string } | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    }
    if (!parsed) return { score: 0, reason: `parse fail: ${content.slice(0, 80)}` };

    const score = Math.max(0, Math.min(100, Number(parsed.match_score) || 0));
    return { score, reason: String(parsed.reason || '').slice(0, 100) };
  } catch (e) {
    return { score: -1, reason: `exc: ${(e as Error).message}` };
  }
}
