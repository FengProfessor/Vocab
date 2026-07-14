// Helpers dùng chung cho các luồng học/ôn (flashcard, writing, learn mode).
// Gom về 1 chỗ để tránh 3 bản copy lệch nhau.

export type Verdict = 'correct' | 'close' | 'wrong';

/**
 * True nếu thiết bị dùng con trỏ chính xác (chuột/trackpad) → an toàn để auto-focus.
 * Trên cảm ứng (pointer: coarse) trả false để KHÔNG tự bật bàn phím ảo che layout khi vừa vào màn.
 * React không serialize autoFocus ra HTML nên gọi lúc render client không gây hydration mismatch.
 */
export function canAutoFocus(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: fine)').matches;
}

export type SpeakLang = 'en-US' | 'en-GB';

/** Cache voice EN — invalidate khi voiceschanged (Chrome load async). */
let cachedEnVoice: { key: string; voice: SpeechSynthesisVoice | null } | null = null;
let voicesListenerAttached = false;

function attachVoicesListener(): void {
  if (voicesListenerAttached || typeof window === 'undefined' || !window.speechSynthesis) return;
  voicesListenerAttached = true;
  // Chrome: getVoices() rỗng đến khi voiceschanged fire
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedEnVoice = null;
  });
  // Warm-up sớm
  window.speechSynthesis.getVoices();
}

/**
 * Chọn giọng EN tường minh.
 * Windows locale vi-VN: chỉ set utterance.lang = 'en-US' vẫn hay dính Microsoft
 * Vietnamese → đọc "earn money" kiểu Việt. BẮT BUỘC gán voice.lang en-*.
 */
export function pickEnglishVoice(preferred: SpeakLang = 'en-US'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  attachVoicesListener();

  const key = preferred;
  if (cachedEnVoice?.key === key) return cachedEnVoice.voice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    cachedEnVoice = { key, voice: null };
    return null;
  }

  const en = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
    // Loại giọng Việt / non-EN dù lang lạ
    if (lang.startsWith('vi') || /vietnam|tiếng việt|vietnamese/i.test(name)) return false;
    return lang.startsWith('en');
  });

  if (!en.length) {
    cachedEnVoice = { key, voice: null };
    return null;
  }

  const pref = preferred.toLowerCase();
  const score = (v: SpeechSynthesisVoice): number => {
    let s = 0;
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
    if (lang === pref || lang.startsWith(pref)) s += 100;
    else if (lang.startsWith('en-us')) s += 80;
    else if (lang.startsWith('en-gb')) s += 70;
    else s += 40;
    // Ưu tiên neural/natural (chất lượng cao hơn robot)
    if (/natural|neural|online|enhanced|premium|wavenet/i.test(name)) s += 35;
    // Voice EN phổ biến tốt trên Win/Mac/Chrome
    if (
      /google us|google uk|google english|microsoft aria|microsoft jenny|microsoft guy|microsoft michelle|microsoft ryan|microsoft sonia|microsoft libby|microsoft natasha|microsoft zira|microsoft david|microsoft mark|microsoft susan|samantha|daniel|karen|moira|tessa|alex|fred|victoria|raveena|joanna|matthew|amy|brian/i.test(
        name,
      )
    ) {
      s += 25;
    }
    // Tránh espeak / compact
    if (/espeak|compact|mobile/i.test(name)) s -= 40;
    if (v.localService) s += 5;
    if (v.default) s += 2;
    return s;
  };

  const best = en.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
  cachedEnVoice = { key, voice: best };
  return best;
}

/**
 * Phát âm tiếng Anh bằng Web Speech API.
 * rate: 1.0 = thường, 0.6 = chậm.
 * Luôn gán voice en-* nếu có — tránh fallback giọng Việt trên máy locale vi.
 */
export function speak(text: string, rate = 1.0, lang: SpeakLang = 'en-US'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const trimmed = text?.trim();
  if (!trimmed) return;

  attachVoicesListener();

  // Chrome: voices load async — nếu list rỗng, đợi voiceschanged rồi đọc lại 1 lần
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    const retry = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', retry);
      speak(trimmed, rate, lang);
    };
    window.speechSynthesis.addEventListener('voiceschanged', retry);
    // Timeout an toàn — tránh listener treo nếu engine không fire
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', retry);
    }, 2500);
    return;
  }

  // Hủy câu đang đọc để tránh chồng tiếng
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(trimmed);
  u.rate = rate;

  const voice = pickEnglishVoice(lang);
  if (voice) {
    u.voice = voice;
    // Khớp lang với voice — một số engine bỏ qua voice nếu lang lệch
    u.lang = voice.lang || lang;
  } else {
    // Không có voice en-* (máy chỉ cài vi) — vẫn set lang, kết quả kém hơn
    u.lang = lang;
  }

  window.speechSynthesis.speak(u);
}

/** Levenshtein edit distance (DP 2 hàng, O(a*b)). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** So khớp đáp án: trùng = correct; Levenshtein ≤2 = close; còn lại = wrong. */
export function judgeAnswer(guess: string, answer: string): Verdict {
  const g = guess.trim().toLowerCase();
  const a = answer.trim().toLowerCase();
  if (!g) return 'wrong';
  if (g === a) return 'correct';
  if (levenshtein(g, a) <= 2) return 'close';
  return 'wrong';
}

/** Verdict → FSRS quality: đúng→4 (Good); gần đúng→3 (Hard); sai→0 (Again). */
export function verdictToQuality(v: Verdict): 0 | 3 | 4 {
  if (v === 'correct') return 4;
  if (v === 'close') return 3;
  return 0;
}

/** IPA có thể là chuỗi thuần hoặc JSON {uk,us}. Trả về chuỗi hiển thị được. */
export function parseIpa(raw?: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    return parsed.uk || parsed.us || (Object.values(parsed)[0] as string) || raw;
  } catch {
    return raw;
  }
}
