/**
 * Nguồn ảnh Tier 1 — Pixabay API (pixabay.com/api).
 * Ảnh thật, license thương mại rõ ràng (Pixabay License). Cần PIXABAY_KEY.
 * LƯU Ý: Pixabay chặn User-Agent mặc định của fetch/python-requests → phải gửi UA
 * giống browser, nếu không trả 403 Forbidden.
 *
 * v2: thêm exclude brand/NSFW vào query (Pixabay hỗ trợ `keyword -exclude`).
 * Filter post-hoc các hit có tags chứa NSFW/brand collision.
 */
import { buildPixabayExcludeSuffix, isNSFWUrl, isTextArt } from '../word-classifier';

interface PixabayHit {
  webformatURL?: string;
  largeImageURL?: string;
  tags?: string;
  imageWidth?: number;
  imageHeight?: number;
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
  if (!key) return [];
  try {
    // Pixabay: cú pháp `keyword -exclude1 -exclude2` để loại bỏ kết quả chứa từ đó
    const fullQuery = `${query} ${buildPixabayExcludeSuffix()}`.trim();

    const url =
      `https://pixabay.com/api/?key=${key}` +
      `&q=${encodeURIComponent(fullQuery)}&image_type=photo&safesearch=true` +
      `&lang=en&order=popular&per_page=${Math.max(3, limit + 2)}`; // +2 dự phòng để filter

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
      .filter((h) => {
        // Filter NSFW + text-art qua tags/URL
        const url = h.webformatURL || h.largeImageURL || '';
        const tags = (h.tags || '').split(',').map((t) => t.trim());
        if (isNSFWUrl(url, '', tags)) return false;
        if (isTextArt('', tags)) return false;
        return true;
      })
      .map((h) => h.webformatURL || h.largeImageURL)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, limit);
  } catch (e) {
    console.error('[ImageSource:Pixabay]', query, e);
    return [];
  }
}
