/**
 * Nguồn ảnh Tier 1 — DuckDuckGo Images.
 * Ảnh thực, chất lượng cao, không cần API key. Phù hợp danh từ cụ thể.
 */
import { imageSearch } from '@mudbill/duckduckgo-images-api';

interface DDGImage {
  image?: string;
  title?: string;
  thumbnail?: string;
}

export async function search(query: string, limit = 5): Promise<string[]> {
  try {
    const res = (await imageSearch({ query, safe: true })) as DDGImage[];
    if (!res || res.length === 0) return [];
    // koala.sh đôi khi trả ảnh AI kỳ lạ → loại bỏ
    return res
      .map((r) => r.image)
      .filter((u): u is string => !!u && !u.includes('koala.sh'))
      .slice(0, limit);
  } catch (e) {
    console.error('[ImageSource:DDG]', query, e);
    return [];
  }
}
