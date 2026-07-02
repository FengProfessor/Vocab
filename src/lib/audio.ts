// Phát âm GIỌNG THẬT với fallback TTS.
// Nguồn audio thật: Free Dictionary API (mp3 người thật từ Wikimedia Commons, CC BY-SA)
// đã backfill vào global_dictionary.data.audio_real (scripts/backfill-audio-real.ts),
// hoặc URL truyền thẳng. Không có mp3 → rơi về speechSynthesis (lib/study.ts).

import { speak } from './study';

const FREE_DICT_AUDIO = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Cache URL đã resolve theo từ (session-level, tránh gọi API lặp).
const urlCache = new Map<string, string | null>();
let currentAudio: HTMLAudioElement | null = null;

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function playUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    stopCurrent();
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

/** Tra Free Dictionary API lấy URL mp3 giọng thật (null nếu không có). */
async function resolveRealAudioUrl(word: string): Promise<string | null> {
  const key = word.trim().toLowerCase();
  if (urlCache.has(key)) return urlCache.get(key) ?? null;
  try {
    const res = await fetch(`${FREE_DICT_AUDIO}${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(String(res.status));
    const entries = (await res.json()) as { phonetics?: { audio?: string }[] }[];
    const url = entries
      .flatMap((e) => e.phonetics ?? [])
      .map((p) => p.audio || '')
      .find((a) => a.length > 0) ?? null;
    urlCache.set(key, url);
    return url;
  } catch {
    urlCache.set(key, null);
    return null;
  }
}

/**
 * Phát âm 1 từ: ưu tiên mp3 giọng thật (audioUrl truyền vào → Free Dictionary API),
 * thất bại → fallback TTS. Trả về nguồn đã dùng.
 */
export async function playWordAudio(
  word: string,
  audioUrl?: string | null,
  rate = 1.0,
): Promise<'real' | 'tts'> {
  if (typeof window === 'undefined') return 'tts';

  if (audioUrl) {
    const ok = await playUrl(audioUrl);
    if (ok) return 'real';
  }

  // Chỉ tra API cho TỪ ĐƠN (cụm từ không có trong dictionary API)
  if (!word.includes(' ')) {
    const url = await resolveRealAudioUrl(word);
    if (url) {
      const ok = await playUrl(url);
      if (ok) return 'real';
    }
  }

  speak(word, rate);
  return 'tts';
}
