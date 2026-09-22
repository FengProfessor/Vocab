import { authFetch } from '@/lib/auth-fetch';

export async function saveSrsReview(
  wordId: string,
  quality: 0 | 3 | 4 | 5,
  accessToken?: string | null,
  reviewId: string = crypto.randomUUID(),
): Promise<void> {
  const response = await authFetch('/api/words/srs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wordId, quality, reviewId }),
  }, accessToken);
  const payload = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || `Không lưu được lịch ôn (${response.status})`);
  }
}
