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
 * Epoch cho Web Speech — mỗi speak/silence mới làm voiceschanged/retry cũ thành no-op.
 * Tránh: đang hiện từ B mà listener voiceschanged của từ A mới fire → đọc sai từ.
 */
let speechEpoch = 0;

/** Hủy utterance + vô hiệu hóa mọi speakLocal/voiceschanged đang treo. */
export function silenceSpeech(): void {
  speechEpoch += 1;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function finishLocalSpeak(
  text: string,
  rate: number,
  lang: SpeakLang,
  myEpoch: number,
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    if (myEpoch !== speechEpoch) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
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

    if (myEpoch !== speechEpoch) {
      resolve();
      return;
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };

    u.onend = done;
    u.onerror = done;
    // 3500ms safety watchdog (Chrome/Edge bug where onend fails to fire on muted/headless)
    const timer = window.setTimeout(done, 3500);

    window.speechSynthesis.speak(u);
  });
}

/**
 * Web Speech fallback (robot) — chỉ dùng khi mp3 neural/người thật fail.
 * Prefer: playWordAudio / speak() → cascade chất lượng cao.
 */
export function speakLocal(text: string, rate = 1.0, lang: SpeakLang = 'en-US'): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve();
  const trimmed = text?.trim();
  if (!trimmed) return Promise.resolve();

  const myEpoch = ++speechEpoch;
  attachVoicesListener();

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) {
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        window.speechSynthesis?.removeEventListener('voiceschanged', retry);
        resolve();
      };

      const retry = () => {
        if (myEpoch !== speechEpoch) {
          done();
          return;
        }
        window.speechSynthesis?.removeEventListener('voiceschanged', retry);
        window.clearTimeout(timeoutId);
        finishLocalSpeak(trimmed, rate, lang, myEpoch).then(resolve);
      };

      window.speechSynthesis.addEventListener('voiceschanged', retry);
      const timeoutId = window.setTimeout(done, 2500);
    });
  }

  return finishLocalSpeak(trimmed, rate, lang, myEpoch);
}

/** Cache dynamic import (tránh circular audio ↔ study; tránh import lại mỗi lần speak). */
type AudioMod = typeof import('./audio');
let audioModPromise: Promise<AudioMod> | null = null;
function loadAudioMod(): Promise<AudioMod> {
  if (!audioModPromise) audioModPromise = import('./audio');
  return audioModPromise;
}

/**
 * Phát âm tiếng Anh chất lượng cao (mp3 người thật → neural TTS → Web Speech).
 * rate: 1.0 = thường, 0.6 = chậm.
 * Returns Promise<void> resolving upon playback completion or safety timeout.
 * Mỗi lần gọi tự vô hiệu hóa lookup/play trước đó (generation trong audio.ts).
 */
export function speak(text: string, rate = 1.0, lang: SpeakLang = 'en-US'): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const trimmed = text?.trim();
  if (!trimmed) return Promise.resolve();
  // Sync: chặn utterance/voiceschanged cũ trước khi cascade async chạy
  silenceSpeech();
  const region: 'UK' | 'US' = String(lang).includes('GB') || String(lang).includes('UK') ? 'UK' : 'US';
  // Dynamic import tránh circular: audio.ts → speakLocal từ study.ts
  const audioPromise = loadAudioMod()
    .then(({ playWordAudio }) => playWordAudio(trimmed, null, rate, region))
    .then(() => {})
    .catch(() => speakLocal(trimmed, rate, lang));

  const raceGuard = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 3500);
  });

  return Promise.race([audioPromise, raceGuard]);
}

/**
 * Dừng phát âm + hủy lookup async đang treo.
 * Gọi khi sang từ mới / unmount session — tránh tiếng từ cũ phát trễ.
 */
export function stopSpeak(): void {
  if (typeof window === 'undefined') return;
  // Hủy speech ngay (sync); stopWordAudio (generation) sau khi module sẵn
  silenceSpeech();
  void loadAudioMod()
    .then(({ stopWordAudio }) => stopWordAudio())
    .catch(() => {});
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

function normalizeAnswerText(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildAcceptableAnswers(answer: string): string[] {
  const base = normalizeAnswerText(answer);
  if (!base) return [];

  const variants: string[] = [];
  const seen = new Set<string>();
  const add = (value: string) => {
    const norm = normalizeAnswerText(value);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      variants.push(norm);
    }
  };

  add(base);

  if (base.includes('(') && base.includes(')')) {
    add(base.replace(/\(([^)/]+)\)/g, '$1'));
    const stripped = normalizeAnswerText(base.replace(/\s*\([^)]*\)/g, ''));
    if (stripped.length >= 2) add(stripped);
    const parenSlashMatch = base.match(/^(.*?)\(([^()]*\/[^()]*)\)(.*)$/);
    if (parenSlashMatch) {
      const [, prefix, inner, suffix] = parenSlashMatch;
      for (const part of inner.split('/')) {
        if (part.trim()) add(`${prefix} ${part.trim()} ${suffix}`);
      }
    }
  }

  for (const item of [...variants]) {
    if (!item.includes('/')) continue;
    const slashTokenMatch = item.match(/(^|\s)([^\s/]+\/[^\s/]+(?:\s*\/\s*[^\s/]+)*)(\s|$)/);
    if (slashTokenMatch) {
      const fullToken = slashTokenMatch[2];
      for (const part of fullToken.split('/')) {
        if (part.trim()) add(item.replace(fullToken, part.trim()));
      }
    } else {
      for (const part of item.split('/')) {
        if (part.trim().length >= 2) add(part);
      }
    }
  }

  for (const item of [...variants]) {
    if (item.includes('-')) add(item.replace(/-/g, ' '));
  }

  return variants;
}

/** So khớp đáp án: sai số tỷ lệ theo độ dài, hỗ trợ ngoặc/gạch chéo/gạch nối. */
export function judgeAnswer(guess: string, answer: string): Verdict {
  const g = normalizeAnswerText(guess);
  const gNoHyphen = normalizeAnswerText(g.replace(/-/g, ' '));
  const variants = buildAcceptableAnswers(answer);
  if (!g || variants.length === 0) return 'wrong';

  for (const variant of variants) {
    const vNoHyphen = normalizeAnswerText(variant.replace(/-/g, ' '));
    if (g === variant || gNoHyphen === vNoHyphen) {
      return 'correct';
    }
  }

  for (const variant of variants) {
    const maxDistance = variant.length >= 8 ? 2 : variant.length >= 4 ? 1 : 0;
    if (maxDistance > 0 && levenshtein(g, variant) <= maxDistance) {
      return 'close';
    }
  }

  return 'wrong';
}

/** Verdict → FSRS quality: đúng→4 (Good); gần đúng→3 (Hard); sai→0 (Again). */
export function verdictToQuality(v: Verdict): 0 | 3 | 4 {
  if (v === 'correct') return 4;
  if (v === 'close') return 3;
  return 0;
}

const IPA_PHONETIC_MARKERS = /[ˈˌːˑəæɑɒɔɜɛɪʊʌɨʉɵɤɯʏøœɐɶᵻᵿθðʃʒŋɹɾɟɡβɸçʝɣχʁħʕʋɰɬɮɺɥʍʔ]/;
const VALID_ASCII_SHORT_IPA_RE = /^[pbtdfvszhmnlrwjk]*e[pbtdfvszhmnlrwjk]*$/i;
const FAKE_ASCII_DIGRAPH_RE = /(.)\1|th|sh|ch|ph|wh|ng|gh|qu|ck/i;

function isValidShortAsciiIpa(s: string): boolean {
  return (
    s.length >= 2 &&
    s.length <= 6 &&
    VALID_ASCII_SHORT_IPA_RE.test(s) &&
    !FAKE_ASCII_DIGRAPH_RE.test(s)
  );
}

/** IPA có thể là chuỗi thuần hoặc JSON {uk,us}. Trả về chuỗi IPA chuẩn bọc trong /.../. */
export function parseIpa(raw?: string): string {
  if (!raw) return '';
  let str = raw;
  try {
    const parsed = JSON.parse(raw);
    str = parsed.uk || parsed.us || (Object.values(parsed)[0] as string) || raw;
  } catch {
    str = raw;
  }
  if (typeof str !== 'string') return '';
  let bare = str.trim().replace(/^\/+|\/+$/g, '').trim();
  if (!bare) return '';

  // Decode URL-encoded IPA (e.g. %CB%88...)
  if (/%[0-9A-Fa-f]{2}/.test(bare)) {
    try {
      bare = decodeURIComponent(bare).replace(/^\/+|\/+$/g, '').trim();
    } catch {}
  }

  // Garbage placeholders
  if (/^(n\/a|unknown|placeholder|none|null|\.|\-|\?+|gibberish|not found|undefined)$/i.test(bare)) {
    return '';
  }

  // Reject fake word-as-IPA (e.g. "abandoned", "a bad penny" without any phonetic symbols or stress marks)
  if (bare.includes(' ') && !IPA_PHONETIC_MARKERS.test(bare)) {
    return '';
  }
  if (
    bare.length >= 4 &&
    !IPA_PHONETIC_MARKERS.test(bare) &&
    /^[a-zA-Z\s\-_]+$/.test(bare) &&
    !isValidShortAsciiIpa(bare)
  ) {
    return '';
  }

  return `/${bare}/`;
}

const IRREGULAR_VERB_LEMMAS: Record<string, string> = {
  am: 'be',
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  been: 'be',
  being: 'be',
  has: 'have',
  had: 'have',
  having: 'have',
  does: 'do',
  did: 'do',
  done: 'do',
  doing: 'do',
  goes: 'go',
  went: 'go',
  gone: 'go',
  going: 'go',
  comes: 'come',
  came: 'come',
  coming: 'come',
  saw: 'see',
  seen: 'see',
  seeing: 'see',
  knew: 'know',
  known: 'know',
  knowing: 'know',
  thought: 'think',
  ran: 'run',
  running: 'run',
  sat: 'sit',
  sitting: 'sit',
  stood: 'stand',
  standing: 'stand',
  'woke up': 'wake up',
  'woken up': 'wake up',
  woke: 'wake up',
  woken: 'wake up',
  ate: 'eat',
  eaten: 'eat',
  drank: 'drink',
  drunk: 'drink',
  wore: 'wear',
  worn: 'wear',
  slept: 'sleep',
  said: 'say',
  says: 'say',
  told: 'tell',
  spoke: 'speak',
  spoken: 'speak',
  heard: 'hear',
  wrote: 'write',
  written: 'write',
  gave: 'give',
  given: 'give',
  took: 'take',
  taken: 'take',
  made: 'make',
  brought: 'bring',
  sent: 'send',
  shown: 'show',
  showed: 'show',
  met: 'meet',
  taught: 'teach',
  found: 'find',
  bought: 'buy',
  sold: 'sell',
  paid: 'pay',
  spent: 'spend',
  chose: 'choose',
  chosen: 'choose',
  felt: 'feel',
  forgot: 'forget',
  forgotten: 'forget',
  understood: 'understand',
  held: 'hold',
  caught: 'catch',
  lost: 'lose',
  won: 'win',
  grew: 'grow',
  grown: 'grow',
  kept: 'keep',
  became: 'become',
  become: 'become',
  left: 'leave',
};

/**
 * Khớp biến thể chia động từ / thì (vd: "am", "cooks", "takes", "went") về đúng entry gốc trong gói.
 */
export function matchFoundationVerb<T extends { lemma: string }>(
  rawWord: string,
  verbs: T[],
): T | undefined {
  const clean = rawWord.trim().toLowerCase();
  if (!clean) return undefined;

  const byLemma = new Map(verbs.map((v) => [v.lemma.toLowerCase(), v]));
  const direct = byLemma.get(clean);
  if (direct) return direct;

  const irregularLemma = IRREGULAR_VERB_LEMMAS[clean];
  if (irregularLemma && byLemma.has(irregularLemma)) {
    return byLemma.get(irregularLemma);
  }

  const candidates: string[] = [];
  if (clean.endsWith('ies') && clean.length > 3) {
    candidates.push(`${clean.slice(0, -3)}y`);
  }
  if (clean.endsWith('ied') && clean.length > 3) {
    candidates.push(`${clean.slice(0, -3)}y`);
  }
  if (clean.endsWith('es') && clean.length > 2) {
    candidates.push(clean.slice(0, -2), clean.slice(0, -1));
  }
  if (clean.endsWith('s') && clean.length > 1) {
    candidates.push(clean.slice(0, -1));
  }
  if (clean.endsWith('ed') && clean.length > 2) {
    candidates.push(clean.slice(0, -2), clean.slice(0, -1));
    if (clean.length > 3) candidates.push(clean.slice(0, -3));
  }
  if (clean.endsWith('ing') && clean.length > 3) {
    const stem = clean.slice(0, -3);
    candidates.push(stem, `${stem}e`);
    if (stem.length > 1) candidates.push(stem.slice(0, -1));
  }

  for (const candidate of candidates) {
    const matched = byLemma.get(candidate);
    if (matched) return matched;
  }

  return undefined;
}
