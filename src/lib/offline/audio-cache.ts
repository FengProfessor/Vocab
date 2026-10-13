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
 * Priority: 1) audioUrl (if provided) -> 2) Youdao region stream -> 3) /api/tts.
 */
export async function cacheWordAudio(
  word: string,
  audioUrl?: string | null,
  region: 'US' | 'UK' = 'US',
): Promise<boolean> {
  if (typeof window === 'undefined' || !word?.trim()) return false;
  const cleanWord = word.trim().toLowerCase();
  const storageKey = region === 'UK' ? `uk:${cleanWord}` : cleanWord;

  try {
    // Check if already cached
    const existing = await getAudio(storageKey);
    if (existing) return true;

    // Candidates to fetch audio Blob from
    const candidates: string[] = [];
    if (audioUrl && audioUrl.startsWith('http')) {
      candidates.push(audioUrl);
    }
    // Youdao direct MP3 stream (type=1 UK, type=2 US)
    const ydType = region === 'UK' ? 1 : 2;
    candidates.push(`https://dict.youdao.com/dictvoice?type=${ydType}&audio=${encodeURIComponent(cleanWord)}`);
    // Local Neural TTS endpoint fallback
    candidates.push(`/api/tts?q=${encodeURIComponent(cleanWord)}`);

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(3000),
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
