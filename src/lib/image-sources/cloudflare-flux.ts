/**
 * Nguồn ảnh Tier 2 — Cloudflare Workers AI FLUX-1-schnell (generative).
 * Phù hợp cho từ trừu tượng hoặc fallback khi stock ảnh thiếu ứng viên.
 * Ảnh sinh ra được upload lên Supabase Storage bucket 'vocab-images'.
 */
import { createServiceClient } from '@/lib/supabase';

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
const BUCKET = 'vocab-images';
const LOG = '[CloudflareFlux]';

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

    const filePath = `cloudflare-flux/${safeName(query)}-${index + 1}.png`;
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
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    console.warn(`${LOG} không có CLOUDFLARE_ACCOUNT_ID hoặc CLOUDFLARE_API_TOKEN → skip`);
    return [];
  }

  try {
    const prompt = `${query}, high quality, digital art, clear concept, illustration for flashcard, no text, no words, no writing, no labels`;
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
      signal: AbortSignal.timeout(45000), // flux model generation takes some time
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      console.warn(`${LOG} API returned status ${response.status}:`, txt.slice(0, 300));
      return [];
    }

    const data = await response.json();
    if (data?.result?.image) {
      return await uploadImages(query, [data.result.image]);
    }

    return [];
  } catch (error) {
    console.error(`${LOG} lỗi:`, (error as Error).message);
    return [];
  }
}
