/**
 * Nguồn ảnh Tier 2 — Wikipedia Thumbnail API.
 * Miễn phí, không key. Phù hợp thực thể, động/thực vật, địa danh.
 * Tra theo tiêu đề trang nên nhận `word` gốc, KHÔNG nhận query mô tả.
 */
export async function search(word: string): Promise<string[]> {
  try {
    // Wikipedia tra theo title → dùng từ đầu nếu là cụm từ
    const searchWord = word.includes(' ') ? word.split(' ')[0] : word;
    const title = searchWord.trim().replace(/\s+/g, '_');
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&prop=pageimages&format=json&pithumbsize=500&origin=*`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const page = Object.values(pages)[0] as { pageid?: number; thumbnail?: { source?: string } };
    if (!page || page.pageid === -1 || !page.thumbnail) return [];

    const src = page.thumbnail.source || '';
    // Loại logo, cờ, SVG — không phải ảnh minh họa nghĩa từ
    if (!src || src.includes('Wikipedia-logo') || src.includes('Flag_of') || src.endsWith('.svg')) {
      return [];
    }
    return [src];
  } catch (e) {
    console.error('[ImageSource:Wikipedia]', word, e);
    return [];
  }
}
