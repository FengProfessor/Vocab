/**
 * Offline Study Queue Management.
 * Manages prefetching, instant querying, and optimistic updates of vocabulary
 * stored in IndexedDB (study_words store).
 */

import { authFetch } from '@/lib/auth-fetch';
import {
  replaceStudyWordsByQueue,
  getStudyWordsByUser,
  getStudyWord,
  putStudyWord,
  setSyncMetadata,
  getSyncMetadata,
} from './db';
import type { OfflineStudyWord, SyncMetadata } from './types';
import { cacheWordAudio } from './audio-cache';
import { getNetworkPolicy } from './network-policy';

let isPrefetching = false;
const PREFETCH_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

/**
 * Prefetches up to 50 review words and 25 new words into IndexedDB.
 * Respects network policy (Wi-Fi vs 4G/5G cellular) and enforces a 3-minute cooldown.
 * Atomically replaces each queue so reviewed/stale words never linger.
 */
export async function prefetchStudyQueue(
  userId: string,
  classroomId?: string | null,
  force = false,
): Promise<void> {
  if (typeof window === 'undefined' || !userId || isPrefetching) return;

  const policy = getNetworkPolicy();
  if (!policy.canPrefetchJson) return;

  isPrefetching = true;
  try {
    const now = Date.now();
    const existingMeta = await getSyncMetadata(`meta:${userId}`);
    if (
      !force &&
      existingMeta &&
      typeof existingMeta.lastPrefetchAt === 'number' &&
      now - existingMeta.lastPrefetchAt < PREFETCH_COOLDOWN_MS
    ) {
      return;
    }

    const cidParam = classroomId ? `&classroomId=${encodeURIComponent(classroomId)}` : '';

    // Parallel fetch for review words (due) and new words
    const [reviewRes, newRes] = await Promise.allSettled([
      authFetch(`/api/words?filter=review&limit=50${cidParam}`, {
        headers: { 'X-LingoPro-Request': '1' },
      }).then((r) => r.json()),
      authFetch(`/api/words?filter=new&limit=25${cidParam}`, {
        headers: { 'X-LingoPro-Request': '1' },
      }).then((r) => r.json()),
    ]);

    const wordsToPersist: OfflineStudyWord[] = [];
    let anyQueueUpdated = false;

    if (reviewRes.status === 'fulfilled' && reviewRes.value?.success && Array.isArray(reviewRes.value.data)) {
      const reviewWords: OfflineStudyWord[] = reviewRes.value.data.map((item: Record<string, any>) => ({
        id: item.id,
        userId,
        classroom_id: item.classroom_id || classroomId || undefined,
        word: item.word,
        translation: item.translation || '',
        ipa: item.ipa || '',
        pos: item.pos || '',
        example: item.example || '',
        example_vi: item.example_vi ?? null,
        synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
        image_url: item.image_url ?? null,
        srs: item.srs ?? null,
        reviewCount: Number(item.reviewCount ?? item.srs?.review_count ?? 0),
        srsLevel: Number(item.srsLevel ?? item.srs?.state ?? 0),
        isDue: true,
        queueType: 'review' as const,
        cachedAt: now,
        audioCached: false,
      }));
      await replaceStudyWordsByQueue(userId, 'review', reviewWords);
      wordsToPersist.push(...reviewWords);
      anyQueueUpdated = true;
    }

    if (newRes.status === 'fulfilled' && newRes.value?.success && Array.isArray(newRes.value.data)) {
      const newWords: OfflineStudyWord[] = newRes.value.data.map((item: Record<string, any>) => ({
        id: item.id,
        userId,
        classroom_id: item.classroom_id || classroomId || undefined,
        word: item.word,
        translation: item.translation || '',
        ipa: item.ipa || '',
        pos: item.pos || '',
        example: item.example || '',
        example_vi: item.example_vi ?? null,
        synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
        image_url: item.image_url ?? null,
        srs: item.srs ?? null,
        reviewCount: Number(item.reviewCount ?? 0),
        srsLevel: 0,
        isDue: false,
        queueType: 'new' as const,
        cachedAt: now,
        audioCached: false,
      }));
      await replaceStudyWordsByQueue(userId, 'new', newWords);
      wordsToPersist.push(...newWords);
      anyQueueUpdated = true;
    }

    if (anyQueueUpdated) {
      const meta: SyncMetadata = {
        key: `meta:${userId}`,
        userId,
        lastPrefetchAt: now,
        lastSyncAt: existingMeta?.lastSyncAt ?? 0,
      };
      await setSyncMetadata(meta);
    }

    // Background audio warm-up: only prefetch the first 2 cards after a calm delay
    // so 10–30 concurrent users opening the dashboard on shared Wi-Fi do not trigger
    // a 150–450 request stampede on /api/tts. Active study screens use prefetchAudioWindow(4).
    if (wordsToPersist.length > 0 && policy.canBulkPrefetchMedia) {
      const wordsForAudio = wordsToPersist.slice(0, 2);
      setTimeout(() => {
        void (async () => {
          for (const w of wordsForAudio) {
            await cacheWordAudio(w.word);
            await new Promise((r) => setTimeout(r, 600));
          }
        })();
      }, 4000);
    }
  } catch (err) {
    // Silent degradation
    console.debug('[StudyQueue] Prefetch skipped or offline:', err);
  } finally {
    isPrefetching = false;
  }
}

/**
 * Retrieves cached words for a user immediately (<5ms) from IndexedDB.
 */
export async function getOfflineStudyQueue(
  userId: string,
  queueType?: 'review' | 'new',
): Promise<OfflineStudyWord[]> {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    return await getStudyWordsByUser(userId, queueType);
  } catch (err) {
    console.warn('[StudyQueue] Error getting offline queue:', err);
    return [];
  }
}

/**
 * Fast count of cached review words and new words for a user.
 */
export async function getOfflineDueCount(
  userId: string,
): Promise<{ dueCount: number; newCount: number }> {
  if (typeof window === 'undefined' || !userId) {
    return { dueCount: 0, newCount: 0 };
  }
  try {
    const [reviewWords, newWords] = await Promise.all([
      getStudyWordsByUser(userId, 'review'),
      getStudyWordsByUser(userId, 'new'),
    ]);
    return {
      dueCount: reviewWords.filter((w) => w.isDue !== false).length,
      newCount: newWords.filter((w) => (w.reviewCount || 0) === 0 && w.isDue !== true).length,
    };
  } catch {
    return { dueCount: 0, newCount: 0 };
  }
}

/**
 * Optimistically updates a card's SRS status in IndexedDB study_words.
 */
export async function updateOfflineWordSrs(
  wordId: string,
  quality: 0 | 3 | 4 | 5,
): Promise<OfflineStudyWord | null> {
  if (typeof window === 'undefined' || !wordId) return null;
  try {
    const word = await getStudyWord(wordId);
    if (!word) return null;

    const now = new Date();
    const isPassing = quality >= 3;
    const intervalDays = isPassing ? Math.max(1, (word.srs?.interval_days || 1) * 2) : 1;
    const nextReview = new Date(now.getTime() + intervalDays * 86400000);

    word.reviewCount = (word.reviewCount || 0) + 1;
    word.isDue = false;
    word.queueType = 'review';
    word.srsLevel = isPassing ? Math.min(5, Math.max(1, (word.srsLevel || 0) + 1)) : 1;
    word.srs = {
      stability: word.srs ? word.srs.stability * (isPassing ? 1.2 : 0.8) : 1,
      difficulty: word.srs ? word.srs.difficulty : 5,
      interval_days: intervalDays,
      review_count: (word.srs?.review_count || 0) + 1,
      state: isPassing ? 2 : 1,
      lapses: quality === 0 ? (word.srs?.lapses || 0) + 1 : (word.srs?.lapses || 0),
      next_review_date: nextReview.toISOString(),
      last_reviewed_at: now.toISOString(),
    };

    await putStudyWord(word);
    return word;
  } catch (err) {
    console.warn('[StudyQueue] Optimistic SRS update failed:', err);
    return null;
  }
}

