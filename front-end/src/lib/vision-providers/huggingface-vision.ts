/**
 * [HFVision] Verify ảnh qua HuggingFace Inference API.
 * Free tier: 1,000 req/day cho serverless inference.
 * Model: meta-llama/Llama-3.2-11B-Vision-Instruct (đa-năng) hoặc llava-hf/llava-1.5-7b-hf.
 *
 * Env: HF_TOKEN=hf_xxx (tạo tại https://huggingface.co/settings/tokens)
 * Optional: HF_VISION_MODEL=meta-llama/Llama-3.2-11B-Vision-Instruct
 */

// LLaVA-1.5-7b chạy stable trên HF serverless inference free tier.
// Llama-3.2-Vision yêu cầu provider agreement (Sambanova/Together) — không free đại trà.
const MODEL = process.env.HF_VISION_MODEL || 'llava-hf/llava-1.5-7b-hf';
const LOG = '[HFVision]';

function pickKey(): string {
  const raw = process.env.HF_TOKEN || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

/**
 * Verify dùng HF Router (OpenAI-compatible endpoint).
 * Trả score 0-100 hoặc -1 nếu Vision lỗi.
 */
export async function verifyImageMeaningHF(
  imageUrl: string,
  ctx: { word: string; pos?: string; definition?: string }
): Promise<{ score: number; reason: string }> {
  const key = pickKey();
  if (!key) return { score: -1, reason: 'no HF_TOKEN' };

  const prompt = `Verify if image illustrates the English vocab word "${ctx.word}"${ctx.pos ? ` (${ctx.pos})` : ''}.
Meaning: "${ctx.definition || ''}"
Score 0-100: 90+=perfect, 70+=good, 40+=weak, 15+=wrong context, 0-14=completely wrong/text-card.
Return ONLY JSON one line: {"match_score": <int>, "reason": "<short>"}`;

  // Direct Inference API endpoint (KHÔNG dùng Router) — free tier OK.
  // LLaVA-1.5-7b dùng prompt format đặc biệt: "USER: <image>\n<prompt>\nASSISTANT:"
  const llavaPrompt = `USER: <image>\n${prompt}\nASSISTANT:`;

  try {
    // Fetch image về base64 (HF Inference API cần raw base64 trong inputs)
    let base64: string;
    try {
      const imgRes = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!imgRes.ok) return { score: 0, reason: `image fetch ${imgRes.status}` };
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.byteLength < 1000) return { score: 0, reason: 'image too small' };
      base64 = buf.toString('base64');
    } catch (e) {
      return { score: -1, reason: `img fetch exc: ${(e as Error).message}` };
    }

    const res = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          inputs: {
            image: base64,
            text: llavaPrompt,
          },
          parameters: {
            max_new_tokens: 150,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(45000),
      }
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      if (res.status === 429 || res.status === 503) return { score: -1, reason: 'rate limit / busy' };
      console.error(`${LOG} HTTP ${res.status}:`, txt.slice(0, 150));
      return { score: -1, reason: `http ${res.status}` };
    }

    const json = await res.json();
    // HF Inference API trả về { generated_text: "..." } cho LLaVA
    const content = Array.isArray(json)
      ? (json[0]?.generated_text || '')
      : (json?.generated_text || json?.choices?.[0]?.message?.content || '');
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
    return { score: -1, reason: `exc: ${(e as Error).message}` };
  }
}
