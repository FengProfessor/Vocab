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
export type SpeakGender = 'male' | 'female' | 'any';

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

/** Giọng nam EN dễ nghe / neural (ưu tiên cao → thấp). */
const MALE_VOICE_RE =
  /\b(guy|ryan|david|christopher|eric|andrew|steffan|mark|james|brian|daniel|alex|fred|george|thomas|tony|roger|jason|adam|matthew|google uk english male|english united kingdom|microsoft david|microsoft guy|microsoft ryan|microsoft mark|microsoft christopher|microsoft eric|microsoft andrew|microsoft steffan)\b/i;

/** Giọng nữ — hạ điểm khi prefer male. */
const FEMALE_VOICE_RE =
  /\b(zira|aria|jenny|michelle|sonia|libby|natasha|susan|samantha|karen|moira|tessa|victoria|raveena|joanna|amy|heather|hazel|linda|catherine|elsa|cora|eva|google us english|google uk english female|microsoft zira|microsoft aria|microsoft jenny)\b/i;

function detectVoiceGender(name: string): 'male' | 'female' | 'unknown' {
  const n = name.toLowerCase();
  // "Google UK English Male" trước "Google UK English"
  if (/male\b|\(male\)|_male| male/i.test(n) || MALE_VOICE_RE.test(n)) return 'male';
  if (/female\b|\(female\)|_female| female/i.test(n) || FEMALE_VOICE_RE.test(n)) return 'female';
  return 'unknown';
}

/**
 * Chọn giọng EN tường minh — mặc định **nam**, dễ nghe.
 * Windows locale vi-VN: chỉ set utterance.lang vẫn hay dính giọng Việt → BẮT BUỘC gán voice en-*.
 */
export function pickEnglishVoice(
  preferred: SpeakLang = 'en-US',
  gender: SpeakGender = 'male',
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  attachVoicesListener();

  const key = `${preferred}:${gender}`;
  if (cachedEnVoice?.key === key) return cachedEnVoice.voice;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    cachedEnVoice = { key, voice: null };
    return null;
  }

  const en = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase().replace('_', '-');
    const name = (v.name || '').toLowerCase();
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
    const name = v.name || '';
    const nameL = name.toLowerCase();
    const g = detectVoiceGender(name);

    // Locale
    if (lang === pref || lang.startsWith(pref)) s += 80;
    else if (lang.startsWith('en-us')) s += 70;
    else if (lang.startsWith('en-gb')) s += 65;
    else s += 35;

    // Neural / Natural — rõ, mượt hơn desktop cũ
    if (/natural|neural|online \(natural\)|online|enhanced|premium|wavenet/i.test(nameL)) s += 50;

    // Giới tính: mặc định muốn nam, dễ nghe khi học từ
    if (gender === 'male') {
      if (g === 'male') s += 120;
      else if (g === 'female') s -= 90;
    } else if (gender === 'female') {
      if (g === 'female') s += 120;
      else if (g === 'male') s -= 90;
    }

    // Tier giọng nam tốt (Win + Chrome + Mac)
    if (/microsoft guy|microsoft ryan|microsoft christopher|microsoft eric|microsoft andrew|microsoft steffan/i.test(nameL)) {
      s += 45; // Natural male Win11
    } else if (/microsoft david|microsoft mark/i.test(nameL)) {
      s += 40; // Desktop male — rõ, ổn định
    } else if (/google uk english male|uk english male/i.test(nameL)) {
      s += 42;
    } else if (/\b(daniel|alex|fred|brian|matthew|george)\b/i.test(nameL) && g !== 'female') {
      s += 30;
    }

    // Desktop robot cũ nhưng vẫn chấp nhận nếu là David
    if (/desktop/i.test(nameL) && g === 'male') s += 8;
    if (/desktop/i.test(nameL) && g === 'female') s -= 15;

    // Tránh espeak / compact / mobile
    if (/espeak|compact|mobile/i.test(nameL)) s -= 50;
    if (v.localService) s += 3;
    return s;
  };

  const best = en.slice().sort((a, b) => score(b) - score(a))[0] ?? null;
  cachedEnVoice = { key, voice: best };
  return best;
}

/**
 * Phát âm tiếng Anh — mặc định giọng **nam** EN, rõ, dễ nghe.
 * rate: 1.0 = thường, 0.6 = chậm.
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
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', retry);
    }, 2500);
    return;
  }

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(trimmed);
  // rate 1.0 → 0.92 (rõ hơn); nút "chậm" 0.6 giữ nguyên
  u.rate = rate === 1.0 ? 0.92 : rate;
  u.pitch = 0.95;
  u.volume = 1;

  const voice = pickEnglishVoice(lang, 'male');
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang || lang;
  } else {
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
