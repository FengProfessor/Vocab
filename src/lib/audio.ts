// Phát âm chất lượng cao cho từ vựng.
// Cascade:
//   1) audioUrl truyền vào (audio_real DB)
//   2) Free Dictionary API — mp3 người thật (từ đơn)
//   3) Google gstatic Oxford mp3 (từ đơn)
//   4) /api/tts — Google Translate neural TTS (từ + cụm)
//   5) Web Speech API — fallback cuối (speakLocal)
//
// Race guard: mỗi lần play/stop tăng playGeneration. Lookup async cũ
// (freeDict, CDN) không được phát sau khi đã sang từ mới / gọi stop.

import { silenceSpeech, speakLocal } from './study';

const FREE_DICT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

/** Cache URL audio thành công theo từ (session). */
const urlCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

/**
 * Monotonic generation: playWordAudio chụp myGen lúc bắt đầu;
 * sau mỗi await nếu myGen !== playGeneration → bỏ, không play từ cũ.
 */
let playGeneration = 0;

function stopCurrent(): void {
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
    } catch {
      // ignore detach errors trên WebView cũ
    }
    currentAudio = null;
  }
  // Hủy Web Speech + vô hiệu hóa voiceschanged treo (speakLocal epoch)
  silenceSpeech();
}

function playUrl(url: string, rate = 1.0, myGen: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Đã có request mới hơn → không đụng audio hiện tại
    if (myGen !== playGeneration) {
      resolve(false);
      return;
    }
    stopCurrent();
    if (myGen !== playGeneration) {
      resolve(false);
      return;
    }

    const audio = new Audio();
    currentAudio = audio;
    audio.preload = 'auto';
    audio.playbackRate = rate > 0 && rate <= 2 ? rate : 1;
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      // Stale generation: không tính là play thành công (tránh cascade/cache nhầm)
      if (ok && myGen !== playGeneration) {
        resolve(false);
        return;
      }
      resolve(ok);
    };
    // Timeout nếu CDN treo
    const timer = window.setTimeout(() => {
      if (myGen !== playGeneration) {
        done(false);
        return;
      }
      done(false);
    }, 8000);
    audio.onended = () => {
      window.clearTimeout(timer);
      done(true);
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      done(false);
    };
    audio.src = url;
    void audio
      .play()
      .then(() => {
        // play() resolve khi bắt đầu — nếu đã sang từ mới thì dừng ngay orphan
        if (myGen !== playGeneration) {
          try {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
          } catch {
            /* ignore */
          }
          if (currentAudio === audio) currentAudio = null;
          window.clearTimeout(timer);
          done(false);
        }
      })
      .catch(() => {
        window.clearTimeout(timer);
        done(false);
      });
  });
}

async function freeDictUrl(word: string, region: 'UK' | 'US' = 'US'): Promise<string | null> {
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
    if (region === 'UK') {
      return urls.find((u) => /uk[_-]|\/uk\//i.test(u)) ?? urls.find((u) => /gb[_-]|\/gb\//i.test(u)) ?? urls[0] ?? null;
    }
    return urls.find((u) => /us[_-]|\/us\//i.test(u)) ?? urls[0] ?? null;
  } catch {
    return null;
  }
}

function gstaticUrl(word: string, region: 'UK' | 'US' = 'US'): string | null {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length > 40) return null;
  const suffix = region === 'UK' ? '_gb_1' : '_us_1';
  return `https://ssl.gstatic.com/dictionary/static/sounds/20200429/${clean}--${suffix}.mp3`;
}

function neuralUrl(text: string): string {
  return `/api/tts?q=${encodeURIComponent(text)}`;
}

export type AudioSource = 'real' | 'neural' | 'tts';

function youdaoUrl(word: string, region: 'UK' | 'US' = 'US'): string {
  const type = region === 'UK' ? 1 : 2;
  return `https://dict.youdao.com/dictvoice?type=${type}&audio=${encodeURIComponent(word)}`;
}

/**
 * Phát âm 1 từ/cụm: Oxford mp3 người thật studio → Wikimedia người thật → Youdao → Neural TTS → Web Speech.
 * rate: 1.0 thường, 0.6 chậm.
 * region: 'UK' (Anh - Anh) hoặc 'US' (Anh - Mỹ).
 */
export async function playWordAudio(
  word: string,
  audioUrl?: string | null,
  rate = 1.0,
  region: 'UK' | 'US' = 'US',
): Promise<AudioSource> {
  if (typeof window === 'undefined') return 'tts';
  const text = word?.trim();
  if (!text) return 'tts';

  const myGen = ++playGeneration;
  // Dừng ngay audio/speech đang chạy (từ cũ) trước khi lookup
  stopCurrent();

  const alive = () => myGen === playGeneration;

  const mp3Rate = rate > 0 && rate <= 2 ? rate : 1;
  const cacheKey = `${region}:${text.toLowerCase()}`;
  const isPhrase = /\s/.test(text);

  // 0) Cache hit từ lần phát thành công trước
  const cached = urlCache.get(cacheKey);
  if (cached) {
    if (!alive()) return 'tts';
    if (await playUrl(cached, mp3Rate, myGen)) {
      return cached.startsWith('/api/tts') ? 'neural' : 'real';
    }
    if (!alive()) return 'tts';
    urlCache.delete(cacheKey);
  }

  // 1) Từ đơn: Oxford Gstatic Studio Human Voice (chuẩn 100% người thật)
  if (!isPhrase) {
    if (!alive()) return 'tts';
    const gs = gstaticUrl(text.toLowerCase(), region);
    if (gs && (await playUrl(gs, mp3Rate, myGen))) {
      urlCache.set(cacheKey, gs);
      return 'real';
    }
  }

  // 2) URL truyền vào (DB audio_real)
  if (audioUrl) {
    if (!alive()) return 'tts';
    if (await playUrl(audioUrl, mp3Rate, myGen)) {
      urlCache.set(cacheKey, audioUrl);
      return 'real';
    }
  }

  // 3) Wikimedia Commons / Free Dictionary API (mp3 người thật)
  if (!isPhrase) {
    if (!alive()) return 'tts';
    const fd = await freeDictUrl(text, region);
    if (fd && (await playUrl(fd, mp3Rate, myGen))) {
      urlCache.set(cacheKey, fd);
      return 'real';
    }
  }

  // 4) Youdao direct voice theo vùng (UK type=1 / US type=2)
  const ydUrl = youdaoUrl(text, region);
  if (await playUrl(ydUrl, mp3Rate, myGen)) {
    urlCache.set(cacheKey, ydUrl);
    return 'real';
  }

  // 5) Neural TTS (Google Translate / Youdao proxy) — rõ, hỗ trợ cụm
  if (!alive()) return 'tts';
  const neural = neuralUrl(text);
  if (await playUrl(neural, mp3Rate, myGen)) {
    urlCache.set(cacheKey, neural);
    return 'neural';
  }

  // 6) Web Speech robot — chỉ khi request còn là latest
  if (!alive()) return 'tts';
  speakLocal(text, rate, region === 'UK' ? 'en-GB' : 'en-US');
  if (!alive()) {
    silenceSpeech();
    return 'tts';
  }
  return 'tts';
}

/** Dừng phát âm đang chạy + vô hiệu hóa mọi lookup async đang treo. */
export function stopWordAudio(): void {
  playGeneration += 1;
  stopCurrent();
}
