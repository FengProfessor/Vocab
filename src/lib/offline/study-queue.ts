/**
 * Offline Study Queue Management.
 * Manages prefetching, instant querying, and optimistic updates of vocabulary
 * stored in IndexedDB (study_words store).
 */

import { authFetch } from '@/lib/auth-fetch';
import {
  putStudyWords,
  getStudyWordsByUser,
  getStudyWord,
  putStudyWord,
  setSyncMetadata,
  getSyncMetadata,
} from './db';
import type { OfflineStudyWord, SyncMetadata } from './types';
import { cacheWordAudio } from './audio-cache';

let isPrefetching = false;

/**
 * Prefetches up to 50 review words and 25 new words into IndexedDB.
 * Non-blocking, fails gracefully when offline without affecting UI.
 */
export async function prefetchStudyQueue(
  userId: string,
  classroomId?: string | null,
): Promise<void> {
  if (typeof window === 'undefined' || !userId || isPrefetching) return;
  // If browser is offline, don't attempt network prefetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  isPrefetching = true;
  try {
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
    const now = Date.now();

    if (reviewRes.status === 'fulfilled' && reviewRes.value?.success && Array.isArray(reviewRes.value.data)) {
      for (const item of reviewRes.value.data) {
        wordsToPersist.push({
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
          queueType: 'review',
          cachedAt: now,
          audioCached: false,
        });
      }
    }

    if (newRes.status === 'fulfilled' && newRes.value?.success && Array.isArray(newRes.value.data)) {
      for (const item of newRes.value.data) {
        wordsToPersist.push({
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
          queueType: 'new',
          cachedAt: now,
          audioCached: false,
        });
      }
    }

    if (wordsToPersist.length > 0) {
      await putStudyWords(wordsToPersist);

      // Record prefetch metadata
      const existingMeta = await getSyncMetadata(`meta:${userId}`);
      const meta: SyncMetadata = {
        key: `meta:${userId}`,
        userId,
        lastPrefetchAt: now,
        lastSyncAt: existingMeta?.lastSyncAt ?? 0,
      };
      await setSyncMetadata(meta);

      // Background audio caching (first 25 words to conserve bandwidth)
      const wordsForAudio = wordsToPersist.slice(0, 25);
      setTimeout(() => {
        void Promise.allSettled(
          wordsForAudio.map((w) => cacheWordAudio(w.word)),
        );
      }, 500);
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
      newCount: newWords.length,
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
