import { authFetch } from '@/lib/auth-fetch';
import { queueOfflineReview } from '@/lib/offline/review-sync';
import { updateOfflineWordSrs } from '@/lib/offline/study-queue';
import { deleteReviewEvent, updateReviewEvent } from '@/lib/offline/db';

export async function saveSrsReview(
  wordId: string,
  quality: 0 | 3 | 4 | 5,
  reviewId: string = crypto.randomUUID(),
  userId?: string,
): Promise<void> {
  // Determine effective userId from argument or snapshot storage
  let effectiveUserId = userId;
  if (!effectiveUserId && typeof window !== 'undefined') {
    try {
      effectiveUserId =
        localStorage.getItem('lp:last_user_id') ||
        sessionStorage.getItem('lp:last_user_id') ||
        'anonymous';
    } catch {
      effectiveUserId = 'anonymous';
    }
  }

  // 1. Write-Ahead Log (WAL) pattern: persist event locally and update local SRS state
  if (typeof window !== 'undefined') {
    try {
      await queueOfflineReview(effectiveUserId || 'anonymous', wordId, quality, reviewId);
      await updateOfflineWordSrs(wordId, quality);
    } catch (err) {
      console.warn('[saveSrsReview] Local WAL enqueue warning:', err);
    }
  }

  // 2. If browser is offline, exit cleanly (event stays 'pending' in WAL for later sync)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  // 3. Attempt immediate server sync
  try {
    const response = await authFetch('/api/words/srs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wordId, quality, reviewId }),
    });

    const payload = (await response.json().catch(() => null)) as {
      success?: boolean;
      applyStatus?: 'applied' | 'duplicate' | 'conflict';
      error?: string;
    } | null;

    if (response.ok && payload?.success) {
      // Sync succeeded: remove event from WAL queue
      if (typeof window !== 'undefined') {
        try {
          await deleteReviewEvent(reviewId);
        } catch {}
      }
    } else {
      // Server-side response error: log warning without crashing offline flow
      console.warn('[saveSrsReview] Server returned status error:', payload?.error || response.status);
    }
  } catch (netErr) {
    // Network drop or fetch error: leave status as 'pending' in WAL.
    // DO NOT throw error or trigger error toast so learner continues uninterrupted.
    console.debug('[saveSrsReview] Network fetch failed, review queued offline:', netErr);
  }
}
