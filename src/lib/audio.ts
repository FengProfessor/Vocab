// Phát âm chất lượng cao cho từ vựng.
// Cascade:
//   1) audioUrl truyền vào (audio_real DB)
//   2) Free Dictionary API — mp3 người thật (từ đơn)
//   3) Google gstatic Oxford mp3 (từ đơn)
//   4) /api/tts — Google Translate neural TTS (từ + cụm)
//   5) Web Speech API — fallback cuối (speakLocal)

import { speakLocal } from './study';

const FREE_DICT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

/** Cache URL audio thành công theo từ (session). */
const urlCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function playUrl(url: string, rate = 1.0): Promise<boolean> {
  return new Promise((resolve) => {
    stopCurrent();
    const audio = new Audio();
    currentAudio = audio;
    audio.preload = 'auto';
    audio.playbackRate = rate > 0 && rate <= 2 ? rate : 1;
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    audio.onended = () => done(true);
    audio.onerror = () => done(false);
    // Timeout nếu CDN treo
    const timer = window.setTimeout(() => done(false), 8000);
    audio.onended = () => {
      window.clearTimeout(timer);
      done(true);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      done(false);
    };
    audio.src = url;
    audio.play().catch(() => {
      window.clearTimeout(timer);
      done(false);
    });
  });
}

async function freeDictUrl(word: string): Promise<string | null> {
  try {
    const res = await fetch(`${FREE_DICT}${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const entries = (await res.json()) as { phonetics?: { audio?: string }[] }[];
    const urls = entries
      .flatMap((e) => e.phonetics ?? [])
      .map((p) => p.audio || '')
      .filter(Boolean);
    if (!urls.length) return null;
    return urls.find((u) => /us[_-]|\/us\//i.test(u)) ?? urls[0] ?? null;
  } catch {
    return null;
  }
}

function gstaticUrl(word: string): string | null {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length > 40) return null;
  return `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${clean}--_us_1.mp3`;
}

function neuralUrl(text: string): string {
  return `/api/tts?q=${encodeURIComponent(text)}`;
}

export type AudioSource = 'real' | 'neural' | 'tts';

/**
 * Phát âm 1 từ/cụm: mp3 người thật → neural TTS → Web Speech.
 * rate: 1.0 thường, 0.6 chậm.
 */
export async function playWordAudio(
  word: string,
  audioUrl?: string | null,
  rate = 1.0,
): Promise<AudioSource> {
  if (typeof window === 'undefined') return 'tts';
  const text = word?.trim();
  if (!text) return 'tts';

  const mp3Rate = rate > 0 && rate <= 2 ? rate : 1;
  const cacheKey = text.toLowerCase();
  const isPhrase = /\s/.test(text);

  // 0) Cache hit từ lần phát thành công trước
  const cached = urlCache.get(cacheKey);
  if (cached) {
    if (await playUrl(cached, mp3Rate)) {
      return cached.startsWith('/api/tts') ? 'neural' : 'real';
    }
    urlCache.delete(cacheKey);
  }

  // 1) URL truyền vào (DB audio_real)
  if (audioUrl && (await playUrl(audioUrl, mp3Rate))) {
    urlCache.set(cacheKey, audioUrl);
    return 'real';
  }

  // 2-3) Từ đơn: giọng người thật
  if (!isPhrase) {
    const human = await freeDictUrl(cacheKey);
    if (human && (await playUrl(human, mp3Rate))) {
      urlCache.set(cacheKey, human);
      return 'real';
    }
    const gs = gstaticUrl(cacheKey);
    if (gs && (await playUrl(gs, mp3Rate))) {
      urlCache.set(cacheKey, gs);
      return 'real';
    }
  }

  // 4) Neural TTS (Google Translate / Youdao proxy) — rõ, hỗ trợ cụm
  const neural = neuralUrl(text);
  if (await playUrl(neural, mp3Rate)) {
    urlCache.set(cacheKey, neural);
    return 'neural';
  }

  // 5) Web Speech robot
  speakLocal(text, rate);
  return 'tts';
}

/** Dừng phát âm đang chạy. */
export function stopWordAudio(): void {
  stopCurrent();
}
