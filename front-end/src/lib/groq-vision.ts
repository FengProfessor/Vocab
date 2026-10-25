/**
 * [GroqVision] Verify ảnh khớp nghĩa từ qua Groq Cloud LLaMA Vision.
 * Drop-in replacement cho verifyImageMeaning trong image-pipeline.ts khi DISABLE_VISION=false
 * và env GROQ_API_KEY có giá trị.
 *
 * Models hỗ trợ Vision (Groq, miễn phí):
 *  - meta-llama/llama-4-scout-17b-16e-instruct  ← khuyến nghị (FREE, mạnh, fast)
 *  - meta-llama/llama-4-maverick-17b-128e-instruct
 *
 * Quota free tier (theo console.groq.com tháng 06/2026):
 *  - 30 RPM, 14,400 RPD (ngày), 100k tokens/min
 *  - DỀu hơn Gemini ~720x → dư backfill toàn bộ
 *
 * Đăng ký: https://console.groq.com (Email/GitHub, không cần Google) → API Keys → Create
 */

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const LOG = '[GroqVision]';

function pickKey(): string {
  const raw = process.env.GROQ_API_KEY || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

/**
 * Trả về:
 *  - score 0-100 nếu Vision OK
 *  - score = -1 nếu Vision lỗi (giữ ảnh, không reject)
 */
export async function verifyImageMeaningGroq(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  const key = pickKey();
  if (!key) return { score: -1, reason: 'no groq api key' };

  // CHIẾN LƯỢC: gửi URL trực tiếp cho Groq fetch — TIẾT KIỆM TOKENS CỰC LỚN.
  // Base64 inline đếm ~20k tokens/ảnh = nhanh chóng cạn TPM 30k.
  // URL direct chỉ đếm ~600 tokens metadata, Groq tự fetch ảnh.
  const imageContent: { type: 'image_url'; image_url: { url: string } } = {
    type: 'image_url',
    image_url: { url: imageUrl },
  };

  const prompt = `You are verifying whether an image correctly illustrates an English vocabulary word on a learner's flashcard.

Word: "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}
Meaning: "${ctx.definition || ''}"

CRITICAL RULES (apply FIRST, override everything else):
- If image shows ONLY the word as text/letters (dictionary card, scrabble tiles, wooden blocks, definition screenshot, blog header with the word) → match_score: 5
- If image is a brand/company logo that happens to contain the word → match_score: 10
- If image is a webpage screenshot or document where the word is just text → match_score: 10
- If image is completely unrelated → match_score: 20

If image ACTUALLY DEPICTS the meaning visually (real photo/illustration of the concept):
- 90-100: Perfect, instantly recognizable
- 70-89: Good, clearly related
- 40-69: Weak link, requires interpretation
- 15-39: Wrong context but same word (homophone collision)

Return ONLY a single JSON object on one line, no markdown:
{"match_score": <integer 0-100>, "reason": "<short explanation, max 80 chars>"}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }, imageContent],
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      // 429 = rate limit → retry sau khi Groq báo Retry-After (header) hoặc 8s mặc định
      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers.get('retry-after') || '8');
        const waitMs = Math.min(60000, Math.max(2000, retryAfter * 1000));
        await new Promise((r) => setTimeout(r, waitMs));
        // Retry 1 lần
        const res2 = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, imageContent] }],
            max_tokens: 200,
            temperature: 0.1,
            response_format: { type: 'json_object' },
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!res2.ok) return { score: -1, reason: `rate limit (retry ${res2.status})` };
        const json2 = await res2.json();
        const content2 = json2?.choices?.[0]?.message?.content || '';
        let parsed2: { match_score?: number; reason?: string } | null = null;
        try { parsed2 = JSON.parse(content2); } catch { const m = content2.match(/\{[\s\S]*\}/); parsed2 = m ? JSON.parse(m[0]) : null; }
        if (!parsed2) return { score: 0, reason: 'parse failed after retry' };
        return {
          score: Math.max(0, Math.min(100, Number(parsed2.match_score) || 0)),
          reason: String(parsed2.reason || '').slice(0, 100),
        };
      }
      console.error(`${LOG} HTTP ${res.status}:`, txt.slice(0, 150));
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
    if (!parsed) return { score: 0, reason: 'parse failed' };

    const score = Math.max(0, Math.min(100, Number(parsed.match_score) || 0));
    return { score, reason: String(parsed.reason || '').slice(0, 100) };
  } catch (e) {
    console.error(`${LOG} exc:`, (e as Error).message);
    return { score: -1, reason: 'exception' };
  }
}
