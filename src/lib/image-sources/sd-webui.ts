/**
 * Nguồn ảnh local — Stable Diffusion WebUI (AUTOMATIC1111 REST API).
 * Tự động tạo hình ảnh minh họa offline 100% miễn phí.
 */
import { createServiceClient } from '@/lib/supabase';

const BUCKET = 'vocab-images';
const LOG = '[SD-WebUI]';

interface SdWebuiResponse {
  images?: unknown;
}

function safeName(query: string): string {
  return query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 80) || 'image';
}

async function uploadImages(query: string, images: string[]): Promise<string[]> {
  const supabase = createServiceClient();
  const urls: string[] = [];

  for (const [index, base64] of images.entries()) {
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.byteLength < 5000) {
      console.warn(`${LOG} ảnh quá nhỏ (${buffer.byteLength}B) cho "${query}"`);
      continue;
    }

    const filePath = `sd-webui/${safeName(query)}-${index + 1}.png`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error(`${LOG} upload lỗi cho "${query}":`, error.message);
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    if (/^https?:\/\//.test(data.publicUrl)) urls.push(data.publicUrl);
  }

  return urls;
}

export async function search(query: string, limit = 1): Promise<string[]> {
  const isEnabled = process.env.ENABLE_LOCAL_SD === 'true';
  if (!isEnabled) return [];

  const apiUrl = process.env.LOCAL_SD_URL || 'http://127.0.0.1:7860';

  try {
    const prompt = `${query}, high quality, digital art, clear concept, illustration for flashcard`;
    const negativePrompt = "nsfw, low quality, blurry, lowres, text, watermark, logo, bad hands, deformed";

    const response = await fetch(`${apiUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: negativePrompt,
        steps: 25,
        width: 800,
        height: 500,
        cfg_scale: 7,
        sampler_name: "Euler a",
        batch_size: Math.max(1, limit)
      }),
      signal: AbortSignal.timeout(60000) // Timeout lớn vì sinh ảnh local mất 5-30 giây tùy GPU
    });

    if (!response.ok) {
      console.warn(`${LOG} API returned status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as SdWebuiResponse;
    const images = Array.isArray(data.images)
      ? data.images.filter((image): image is string => typeof image === 'string' && image.length > 0)
      : [];
    if (images.length > 0) return await uploadImages(query, images);

    return [];
  } catch (error) {
    console.error(`${LOG} lỗi:`, (error as Error).message);
    return [];
  }
}
