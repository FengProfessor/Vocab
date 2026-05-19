/**
 * Nguồn ảnh Tier 3 — Openverse API (api.openverse.org).
 * Kho ảnh Creative Commons, miễn phí, không cần key (rate limit ẩn danh thấp).
 * Lấp khoảng trống khi DuckDuckGo + Wikipedia fail.
 */
interface OpenverseResult {
  url?: string;
  thumbnail?: string;
}

export async function search(query: string, limit = 5): Promise<string[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
      query
    )}&page_size=${limit}&mature=false`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'LingoPro/1.0 (educational vocabulary app)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results: OpenverseResult[] = data?.results || [];
    return results
      .map((r) => r.url || r.thumbnail)
      .filter((u): u is string => typeof u === 'string' && u.length > 0)
      .slice(0, limit);
  } catch (e) {
    console.error('[ImageSource:Openverse]', query, e);
    return [];
  }
}
