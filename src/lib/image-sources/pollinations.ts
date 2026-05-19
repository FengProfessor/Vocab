/**
 * Nguồn ảnh Tier 4 — Pollinations AI (generative).
 * Fallback cuối khi mọi nguồn ảnh thực fail (thường là từ trừu tượng).
 * Ảnh sinh ra dễ lệch nghĩa nên pipeline LUÔN kiểm chứng bằng AI Vision.
 */
export function buildPollinationsUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: '800',
    height: '500',
    nologo: 'true',
    seed: seed.toString(),
    safe: 'true',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

export async function search(query: string, limit = 3): Promise<string[]> {
  // Sinh nhiều ứng viên bằng cách đổi seed → pipeline thử lần lượt
  const base = query.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const urls: string[] = [];
  for (let i = 0; i < limit; i++) {
    urls.push(buildPollinationsUrl(query, base + i * 7919));
  }
  return urls;
}
