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
 * Request cũ tự hủy khi có speak/stop mới (generation guard).
 */
export async function playWordAudio(
  word: string,
  audioUrl?: string | null,
  rate = 1.0,
): Promise<AudioSource> {
  if (typeof window === 'undefined') return 'tts';
  const text = word?.trim();
  if (!text) return 'tts';

  const myGen = ++playGeneration;
  // Dừng ngay audio/speech đang chạy (từ cũ) trước khi lookup
  stopCurrent();

  const alive = () => myGen === playGeneration;

  const mp3Rate = rate > 0 && rate <= 2 ? rate : 1;
  const cacheKey = text.toLowerCase();
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

  // 1) URL truyền vào (DB audio_real)
  if (audioUrl) {
    if (!alive()) return 'tts';
    if (await playUrl(audioUrl, mp3Rate, myGen)) {
      urlCache.set(cacheKey, audioUrl);
      return 'real';
    }
  }

  // 2-3) Từ đơn: giọng người thật
  // Ưu tiên gstatic trước freeDict — URL deterministic, không chờ API,
  // giảm “chữ đã hiện / đã sang từ mới mà tiếng từ cũ mới tới”.
  if (!isPhrase) {
    if (!alive()) return 'tts';
    const gs = gstaticUrl(cacheKey);
    if (gs && (await playUrl(gs, mp3Rate, myGen))) {
      urlCache.set(cacheKey, gs);
      return 'real';
    }

    if (!alive()) return 'tts';
    const human = await freeDictUrl(cacheKey);
    if (!alive()) return 'tts';
    if (human && (await playUrl(human, mp3Rate, myGen))) {
      urlCache.set(cacheKey, human);
      return 'real';
    }
  }

  // 4) Neural TTS (Google Translate / Youdao proxy) — rõ, hỗ trợ cụm
  if (!alive()) return 'tts';
  const neural = neuralUrl(text);
  if (await playUrl(neural, mp3Rate, myGen)) {
    urlCache.set(cacheKey, neural);
    return 'neural';
  }

  // 5) Web Speech robot — chỉ khi request còn là latest
  if (!alive()) return 'tts';
  // speakLocal tự ++ epoch; nếu giữa chừng đã stop thì epoch lệch → no-op
  speakLocal(text, rate);
  // Double-check: stop xen giữa speakLocal sync path
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
