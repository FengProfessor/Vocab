/**
 * [GeminiImage] Nguồn ảnh AI-generated qua Gemini 2.5 Flash Image (Nano Banana).
 * Chạy server-side, dùng multi-key rotation từ GEMINI_API_KEY.
 *
 * Khác các source khác (trả URL ảnh public sẵn có):
 *   - Gemini gen base64 inline → PHẢI upload Supabase Storage để có URL persistent.
 *   - Bucket bắt buộc: `vocab-images` (public read).
 *
 * Tier này đặt TRƯỚC Pollinations vì:
 *   - Chất lượng ảnh cao hơn nhiều (Nano Banana 4K khả thi)
 *   - Free tier ~100 RPD/key × N keys = đủ backfill toàn DB trong vài ngày
 *   - Tuân thủ ToS Google, không rủi ro ban
 */
import { createServiceClient } from '@/lib/supabase';

const MODEL = 'gemini-2.5-flash-image-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const BUCKET = 'vocab-images';
const LOG = '[GeminiImage]';

function pickKey(): string {
  let key = process.env.GEMINI_API_KEY || '';
  if (key.includes(',')) {
    const keys = key.split(',').map((k) => k.trim()).filter(Boolean);
    key = keys[Math.floor(Math.random() * keys.length)];
  }
  return key;
}

function safeName(word: string): string {
  return word.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'word';
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
}

/**
 * Sinh ảnh từ prompt rồi upload Supabase Storage.
 * Return URL public hoặc null nếu fail.
 */
export async function generateAndUpload(word: string, prompt: string): Promise<string | null> {
  const key = pickKey();
  if (!key) {
    console.warn(`${LOG} không có GEMINI_API_KEY → skip`);
    return null;
  }

  // Prompt được tối ưu cho flashcard: ảnh rõ ràng, không text, illustration style
  const fullPrompt = `Generate a clear, simple illustration suitable for an English vocabulary flashcard.
Subject: ${prompt}
Requirements:
- Centered subject, minimal background, no text or words in the image
- Photographic or clean illustration style, vibrant colors
- Unambiguously depicts the meaning
- 16:10 landscape aspect ratio`;

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (e) {
    console.error(`${LOG} fetch lỗi cho "${word}":`, (e as Error).message);
    return null;
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error(`${LOG} HTTP ${res.status} cho "${word}":`, txt.slice(0, 200));
    return null;
  }

  const json = (await res.json().catch(() => null)) as GeminiResponse | null;
  if (!json) {
    console.error(`${LOG} parse JSON lỗi cho "${word}"`);
    return null;
  }
  if (json.error) {
    console.error(`${LOG} API error cho "${word}":`, json.error.message);
    return null;
  }

  const parts = json.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData?.data);
  if (!imgPart?.inlineData) {
    console.error(`${LOG} response không có inlineData cho "${word}"`);
    return null;
  }

  const { data, mimeType } = imgPart.inlineData;
  const buf = Buffer.from(data, 'base64');
  if (buf.byteLength < 5000) {
    console.error(`${LOG} ảnh quá nhỏ (${buf.byteLength}B) cho "${word}"`);
    return null;
  }

  // Upload Supabase Storage
  const supabase = createServiceClient();
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const filePath = `${safeName(word)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buf, { contentType: mimeType, upsert: true });

  if (upErr) {
    // Bucket chưa tồn tại → log instruction
    if (upErr.message.includes('Bucket not found') || upErr.message.includes('not found')) {
      console.error(`${LOG} BUCKET "${BUCKET}" CHƯA TỒN TẠI. Tạo bằng SQL:`);
      console.error(`  INSERT INTO storage.buckets (id, name, public) VALUES ('${BUCKET}', '${BUCKET}', true);`);
    } else {
      console.error(`${LOG} upload lỗi cho "${word}":`, upErr.message);
    }
    return null;
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return pub.publicUrl;
}

/**
 * Adapter cho image-pipeline: nhận query → trả [url] (đã upload).
 * Pipeline gọi `search(query)` thống nhất với mọi tier khác.
 * `word` được truyền qua param thứ 2 (signature mở rộng).
 */
export async function search(query: string, _limit = 1, word?: string): Promise<string[]> {
  const w = word || query;
  const url = await generateAndUpload(w, query);
  return url ? [url] : [];
}
