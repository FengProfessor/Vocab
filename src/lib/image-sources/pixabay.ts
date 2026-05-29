/**
 * Nguồn ảnh Tier 1 — Pixabay API (pixabay.com/api).
 * Ảnh thật, license thương mại rõ ràng (Pixabay License). Cần PIXABAY_KEY.
 * LƯU Ý: Pixabay chặn User-Agent mặc định của fetch/python-requests → phải gửi UA
 * giống browser, nếu không trả 403 Forbidden.
 */
interface PixabayHit {
  webformatURL?: string;
  largeImageURL?: string;
}

/** Hỗ trợ nhiều key phân tách bằng dấu phẩy (rotation tránh rate limit). */
function pickKey(): string {
  const raw = process.env.PIXABAY_KEY || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

export async function search(query: string, limit = 3): Promise<string[]> {
  const key = pickKey();
  if (!key) return []; // chưa cấu hình key → bỏ qua nguồn này, pipeline tự rơi xuống tier sau
  try {
    const url =
      `https://pixabay.com/api/?key=${key}` +
      `&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true` +
      `&lang=en&order=popular&per_page=${Math.max(3, limit)}`; // Pixabay yêu cầu per_page ≥ 3

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const hits: PixabayHit[] = data?.hits || [];
    return hits
      .map((h) => h.webformatURL || h.largeImageURL) // 640px đủ cho flashcard + nhẹ cho Vision
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, limit);
  } catch (e) {
    console.error('[ImageSource:Pixabay]', query, e);
    return [];
  }
}
