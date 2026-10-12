/**
 * Offline Audio Cache for LingoPro.
 * Caches human pronunciation MP3 Blobs in IndexedDB (audio_cache store)
 * and resolves them via URL.createObjectURL for 0ms offline audio playback.
 */

import { getAudio, putAudio } from './db';

const activeBlobUrls = new Set<string>();

/**
 * Checks IndexedDB audio_cache for a cached Blob for the word.
 * If found, returns an Object URL (blob:...) that can be played with HTML5 Audio.
 */
export async function getOfflineAudioUrl(word: string): Promise<string | null> {
  if (typeof window === 'undefined' || !word?.trim()) return null;

  try {
    const blob = await getAudio(word);
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
 * Priority: 1) audioUrl (if provided) -> 2) Youdao US stream -> 3) /api/tts.
 */
export async function cacheWordAudio(
  word: string,
  audioUrl?: string | null,
): Promise<boolean> {
  if (typeof window === 'undefined' || !word?.trim()) return false;
  const cleanWord = word.trim().toLowerCase();

  try {
    // Check if already cached
    const existing = await getAudio(cleanWord);
    if (existing) return true;

    // Candidates to fetch audio Blob from
    const candidates: string[] = [];
    if (audioUrl && audioUrl.startsWith('http')) {
      candidates.push(audioUrl);
    }
    // Youdao direct MP3 stream
    candidates.push(`https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(cleanWord)}`);
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
            await putAudio(cleanWord, blob, blob.type || 'audio/mp3');
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
