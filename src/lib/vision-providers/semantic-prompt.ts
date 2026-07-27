/**
 * Prompt chấm ảnh từ vựng theo NGHĨA (không theo chữ trên ảnh / tên sản phẩm).
 * Dùng chung mọi VLM provider (Groq, OpenRouter, CF, HF).
 */

export interface VisionWordContext {
  word: string;
  pos?: string;
  definition?: string;
}

/** Ngưỡng chấp nhận: ảnh phải khớp nghĩa rõ. Override bằng env VISION_THRESHOLD. */
export function getVisionThreshold(): number {
  const raw = process.env.VISION_THRESHOLD;
  if (raw) {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 50 && n <= 100) return n;
  }
  return 85;
}

/** Dưới ngưỡng này = sai hoàn toàn, không giữ làm fallback. */
export const VISION_HARD_REJECT = 15;

/**
 * Prompt JSON (Groq / OpenRouter / HF).
 * Mục tiêu: 90%+ ảnh pass phải đúng NGHĨA từ — không chấp nhận:
 * - Ảnh chỉ có chữ/scrabble/thẻ từ điển
 * - Logo / nhãn hàng / packaging mang tên từ
 * - Homonym / nghĩa khác với definition
 */
export function buildSemanticVisionPrompt(ctx: VisionWordContext): string {
  const pos = ctx.pos ? ` (${ctx.pos})` : '';
  const meaning = ctx.definition?.trim() || '(no definition provided — judge by the most common literal meaning of the word)';

  return `You are a STRICT judge for English vocabulary flashcard images.

Word: "${ctx.word}"${pos}
Target meaning (MUST match): "${meaning}"

Score ONLY whether the image VISUALLY DEPICTS the target meaning — not whether the word appears as text.

AUTO-FAIL (match_score 0-12) if ANY of these is true:
1. TEXT-ONLY: dictionary card, scrabble/wooden letters, neon sign spelling the word, blog header, worksheet, screenshot of text, caption is the main subject
2. BRAND / PRODUCT NAME: logo, packaging, storefront, app icon, or commercial product whose NAME is the word (e.g. "Always" pads, "Ally" bank, "Accord" car, "Apple" logo for fruit sense wrong) even if letters match
3. WRONG SENSE: image shows a different meaning/homonym than the Target meaning (e.g. river bank vs money bank; metal spring vs season spring)
4. PERSON/PLACE NAME only: celebrity or place named like the word, without illustrating the meaning
5. UNRELATED: no clear visual link to the meaning

PASS only if a learner would understand the meaning FROM the picture alone (photo or illustration of the concept):
- 90-100: Instant, unambiguous depiction of THIS meaning
- 85-89: Clear match, minor ambiguity OK
- 70-84: Related but needs interpretation — NOT good enough for auto-accept
- 40-69: Weak / stretch metaphor
- 15-39: Same word letters or wrong sense, barely related
- 0-14: Text/logo/product-name/unrelated (see AUTO-FAIL)

Return ONLY one JSON object, no markdown:
{"match_score": <integer 0-100>, "reason": "<max 80 chars, say FAIL reason if low>"}`;
}

/**
 * Prompt dạng SCORE|REASON cho model nhỏ (LLaVA CF) — ngắn hơn nhưng cùng luật cốt lõi.
 */
export function buildSemanticVisionPromptSimple(ctx: VisionWordContext): string {
  const pos = ctx.pos ? ` (${ctx.pos})` : '';
  const meaning = (ctx.definition || '').slice(0, 160);

  return `Does this image VISUALLY show the meaning of "${ctx.word}"${pos}?
Meaning: "${meaning}"

FAIL low score (0-12) if: only text/letters, brand logo, product packaging named after the word, wrong sense/homonym, or unrelated.
PASS high (85-100) only if a student learns the meaning from the picture alone.

Reply ONE line:
SCORE: <0-100> | REASON: <max 60 chars>`;
}

/**
 * Prompt YES/NO cho Ollama local.
 */
export function buildSemanticVisionPromptYesNo(ctx: VisionWordContext): string {
  const pos = ctx.pos ? ` (${ctx.pos})` : '';
  const meaning = (ctx.definition || '').slice(0, 120);
  return `Does this image clearly SHOW the meaning of "${ctx.word}"${pos} (not just text or a product brand named "${ctx.word}")? Meaning: "${meaning}". Answer ONLY: YES or NO`;
}
