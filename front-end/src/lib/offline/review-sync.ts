/**
 * Write-Ahead Log (WAL) Review Sync Engine.
 * Queues review ratings locally in IndexedDB (offline_review_queue),
 * executes background sync to /api/words/srs, and guarantees CAS idempotency.
 */

import { authFetch } from '@/lib/auth-fetch';
import {
  appendReviewEvent,
  getPendingReviews,
  updateReviewEvent,
  deleteReviewEvent,
  getSyncMetadata,
  setSyncMetadata,
} from './db';
import type { OfflineReviewEvent, SyncMetadata } from './types';

let isSyncing = false;
let listenersRegistered = false;
let sequenceCounter = 0;
let lastMonotonicTimestamp = 0;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getMonotonicTimestamp(): number {
  const now = Date.now();
  if (now > lastMonotonicTimestamp) {
    lastMonotonicTimestamp = now;
  } else {
    lastMonotonicTimestamp += 0.001;
  }
  return Number(lastMonotonicTimestamp.toFixed(3));
}

/**
 * Appends a review mutation to the Write-Ahead Log (WAL) with status 'pending'.
 */
export async function queueOfflineReview(
  userId: string,
  wordId: string,
  quality: 0 | 3 | 4 | 5,
  reviewId?: string,
): Promise<OfflineReviewEvent> {
  const safeReviewId =
    reviewId && UUID_PATTERN.test(reviewId) ? reviewId : crypto.randomUUID();

  const seq = ++sequenceCounter;
  const clientTimestamp = getMonotonicTimestamp();

  const event: OfflineReviewEvent = {
    reviewId: safeReviewId,
    userId,
    wordId,
    quality,
    createdAt: new Date().toISOString(),
    clientTimestamp,
    sequence: seq,
    status: 'pending',
    retryCount: 0,
  };

  await appendReviewEvent(event);
  return event;
}

/**
 * Replays all pending review events for a user in chronological order (FIFO).
 * Backend CAS and srs_review_events table handle deduplication.
 */
export async function syncReviewQueue(userId: string): Promise<{
  flushedCount: number;
  duplicateCount: number;
  failedCount: number;
}> {
  if (typeof window === 'undefined' || !userId) {
    return { flushedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  // Prevent concurrent sync replays within the same JS execution context
  if (isSyncing) {
    return { flushedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  // If network is known to be offline, return early
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  // Prevent multi-tab duplicate replays using Web Locks API when available
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return await navigator.locks.request('lingopro_review_sync', async () => {
      return await executeSyncReviewQueue(userId);
    });
  }

  return await executeSyncReviewQueue(userId);
}

async function executeSyncReviewQueue(userId: string): Promise<{
  flushedCount: number;
  duplicateCount: number;
  failedCount: number;
}> {
  if (isSyncing) {
    return { flushedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushedCount: 0, duplicateCount: 0, failedCount: 0 };
  }

  isSyncing = true;
  let flushedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  try {
    const pendingEvents = await getPendingReviews(userId);

    for (const ev of pendingEvents) {
      ev.status = 'syncing';
      await updateReviewEvent(ev);

      try {
        const response = await authFetch('/api/words/srs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wordId: ev.wordId,
            quality: ev.quality,
            reviewId: ev.reviewId,
            reviewedAt: ev.createdAt,
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          duplicate?: boolean;
          applyStatus?: 'applied' | 'duplicate' | 'conflict';
          error?: string;
        } | null;

        if (response.ok && payload?.success) {
          if (payload.duplicate || payload.applyStatus === 'duplicate') {
            duplicateCount++;
          } else {
            flushedCount++;
          }

          ev.status = 'synced';
          await updateReviewEvent(ev);
          // Prune synced event from WAL to keep database lightweight
          await deleteReviewEvent(ev.reviewId);
        } else {
          // Check if it's an unrecoverable client payload error (HTTP 400 or retryCount >= 10)
          const isClientError = response.status === 400;
          const nextRetry = (ev.retryCount || 0) + 1;
          ev.retryCount = nextRetry;
          ev.lastError = payload?.error || `HTTP ${response.status}`;

          if (isClientError || nextRetry >= 10) {
            ev.status = 'failed';
            await updateReviewEvent(ev);
            failedCount++;
          } else {
            // Server error / temporary outage (HTTP 5xx, 502, 503, 504, 429):
            // Keep pending and back off until next sync
            ev.status = 'pending';
            await updateReviewEvent(ev);
            failedCount++;
            break;
          }
        }
      } catch (err: unknown) {
        // Network drop during sync — keep as pending and increment retry count
        const nextRetry = (ev.retryCount || 0) + 1;
        ev.retryCount = nextRetry;
        ev.lastError = err instanceof Error ? err.message : String(err);
        if (nextRetry >= 10) {
          ev.status = 'failed';
        } else {
          ev.status = 'pending';
        }
        await updateReviewEvent(ev);
        failedCount++;

        // Stop remaining replays until network stabilises
        break;
      }
    }

    if (flushedCount > 0 || duplicateCount > 0) {
      const existingMeta = await getSyncMetadata(`meta:${userId}`);
      const meta: SyncMetadata = {
        key: `meta:${userId}`,
        userId,
        lastPrefetchAt: existingMeta?.lastPrefetchAt ?? 0,
        lastSyncAt: Date.now(),
      };
      await setSyncMetadata(meta);
    }
  } finally {
    isSyncing = false;
  }

  return { flushedCount, duplicateCount, failedCount };
}

/**
 * Registers global event listeners for network reconnection and tab focus
 * to automatically flush the WAL review queue.
 */
export function initReviewSyncListeners(getUserId?: () => string | null): void {
  if (typeof window === 'undefined' || listenersRegistered) return;
  listenersRegistered = true;

  const handleReconnect = () => {
    let uid: string | null = null;
    if (getUserId) {
      uid = getUserId();
    }
    if (!uid) {
      try {
        uid =
          localStorage.getItem('lp:last_user_id') ||
          sessionStorage.getItem('lp:last_user_id');
      } catch {}
    }

    if (uid) {
      void syncReviewQueue(uid);
    }
  };

  window.addEventListener('online', handleReconnect);
  window.addEventListener('focus', handleReconnect);
}

// Automatically register listeners on browser import
if (typeof window !== 'undefined') {
  initReviewSyncListeners();
}
