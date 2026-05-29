/**
 * Nguồn ảnh Tier 1 — Pexels API (api.pexels.com).
 * Ảnh thật, license thương mại (Pexels License). Cần PEXELS_KEY (gửi qua header Authorization).
 */
interface PexelsPhoto {
  src?: { large?: string; medium?: string };
}

/** Hỗ trợ nhiều key phân tách bằng dấu phẩy (rotation tránh rate limit). */
function pickKey(): string {
  const raw = process.env.PEXELS_KEY || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

export async function search(query: string, limit = 3): Promise<string[]> {
  const key = pickKey();
  if (!key) return []; // chưa cấu hình key → bỏ qua nguồn này
  try {
    const url =
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
      `&per_page=${Math.max(1, limit)}&orientation=square`;

    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const photos: PexelsPhoto[] = data?.photos || [];
    return photos
      .map((p) => p.src?.large || p.src?.medium)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, limit);
  } catch (e) {
    console.error('[ImageSource:Pexels]', query, e);
    return [];
  }
}
