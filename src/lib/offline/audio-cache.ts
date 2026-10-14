/**
 * Offline Audio Cache for LingoPro.
 * Caches human pronunciation MP3 Blobs in IndexedDB (audio_cache store)
 * and resolves them via URL.createObjectURL for 0ms offline audio playback.
 */

import { getAudio, putAudio } from './db';

const activeBlobUrls = new Set<string>();

/**
 * Checks IndexedDB audio_cache for a cached Blob for the word and accent region.
 * If found, returns an Object URL (blob:...) that can be played with HTML5 Audio.
 */
export async function getOfflineAudioUrl(
  word: string,
  region: 'US' | 'UK' = 'US',
): Promise<string | null> {
  if (typeof window === 'undefined' || !word?.trim()) return null;
  const cleanWord = word.trim().toLowerCase();
  const regionKey = `${region.toLowerCase()}:${cleanWord}`;

  try {
    let blob = await getAudio(regionKey);
    if (!blob && region === 'US') {
      blob = await getAudio(cleanWord);
    }
    if (!blob) return null;

    const url = URL.createObjectURL(blob);
    activeBlobUrls.add(url);
    return url;
  } catch (err) {
    console.warn('[AudioCache] Failed to get offline audio:', err);
    return null;
  }
}

/**
 * Revokes a previously created Object URL to avoid memory leaks.
 */
export function revokeOfflineAudioUrl(url: string): void {
  if (typeof window === 'undefined' || !url) return;
  if (activeBlobUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
    activeBlobUrls.delete(url);
  }
}

/**
 * Attempts to download and cache an audio Blob for a word.
 * Uses same-origin /api/tts (which proxies Google TTS + Youdao server-side with 1-year cache)
 * to avoid browser CSP connect-src violations and CORS blocks on dict.youdao.com.
 */
export async function cacheWordAudio(
  word: string,
  audioUrl?: string | null,
  region: 'US' | 'UK' = 'US',
): Promise<boolean> {
  if (typeof window === 'undefined' || !word?.trim()) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  const cleanWord = word.trim().toLowerCase();
  const storageKey = region === 'UK' ? `uk:${cleanWord}` : cleanWord;

  try {
    // Check if already cached
    const existing = await getAudio(storageKey);
    if (existing) return true;

    // Candidates to fetch audio Blob from (must be CSP connect-src and CORS safe)
    const candidates: string[] = [];
    if (
      audioUrl &&
      (audioUrl.startsWith('/') ||
        (audioUrl.startsWith('http') && !audioUrl.includes('dict.youdao.com')))
    ) {
      candidates.push(audioUrl);
    }
    // Same-origin TTS proxy endpoint (Google TTS + Youdao server-side fallback)
    candidates.push(`/api/tts?q=${encodeURIComponent(cleanWord)}`);

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 100) {
            await putAudio(storageKey, blob, blob.type || 'audio/mp3');
            return true;
          }
        }
      } catch {
        // Continue to next candidate
      }
    }
  } catch (err) {
    console.warn('[AudioCache] Failed to cache audio for:', cleanWord, err);
  }

  return false;
}

import { getNetworkPolicy } from './network-policy';

/**
 * Rolling-window audio prefetcher for active study screens (Flashcard, LearnMode, Review).
 * Prefetches only the next 3–5 words ahead of the current card so mobile/4G connections
 * never suffer a 25-request burst while still enjoying 0ms audio on every card flip.
 */
export async function prefetchAudioWindow(
  items: ReadonlyArray<string | { word?: string | null }>,
  startIndex = 0,
  windowSize = 4,
): Promise<void> {
  if (typeof window === 'undefined' || !Array.isArray(items) || items.length === 0) return;
  if (!getNetworkPolicy().canPrefetchStudyWindow) return;

  const slice = items.slice(Math.max(0, startIndex), Math.max(0, startIndex) + windowSize);
  for (const item of slice) {
    const wordText = typeof item === 'string' ? item : item?.word;
    if (wordText && wordText.trim()) {
      await cacheWordAudio(wordText);
    }
  }
}

