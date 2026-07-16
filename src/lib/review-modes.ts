/**
 * Review modes — cloze / listen / mixed scheduler + map FSRS quality.
 * Dùng chung cho /review hub & session engine.
 */

import { judgeAnswer, type Verdict } from '@/lib/study';

/** Session mode do user chọn trên hub. */
export type ReviewSessionMode = 'mixed' | 'cloze' | 'listen' | 'mcq' | 'type' | 'flash';

/** Item mode thực thi trong 1 card. */
export type ItemMode =
  | 'mcq_vi_en' // nghĩa VI → 4 EN
  | 'mcq_en_vi' // EN → 4 nghĩa
  | 'cloze_mcq' // blank example → 4 options
  | 'cloze_type' // blank example → gõ
  | 'listen_mcq' // nghe → 4 EN
  | 'listen_type' // nghe → gõ (dictation)
  | 'type_vi_en'; // nghĩa → gõ EN

export interface ReviewWordLike {
  id: string;
  word: string;
  translation: string;
  example?: string | null;
  srsLevel?: number;
  reviewCount?: number;
  isDue?: boolean;
}

export interface ClozePayload {
  /** Câu có `___` thay từ target */
  stem: string;
  answer: string;
  /** Câu gốc đầy đủ */
  full: string;
}

/** Escape regex special chars trong word. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tạo cloze từ example: blank từ target (word boundary, case-insensitive).
 * Fallback: dùng translation context nếu example thiếu/không chứa word.
 */
export function makeCloze(example: string | null | undefined, word: string): ClozePayload | null {
  const w = word?.trim();
  if (!w) return null;

  const full = (example || '').trim();
  if (full) {
    // Multi-word: match cả phrase; single: word boundary
    const pattern =
      w.includes(' ') || w.includes('-')
        ? new RegExp(escapeRegExp(w), 'i')
        : new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
    if (pattern.test(full)) {
      const stem = full.replace(pattern, '___');
      // Lấy surface form đúng như trong câu (giữ hoa/thường)
      const m = full.match(pattern);
      return { stem, answer: m?.[0] ?? w, full };
    }
  }

  // Không có example hợp lệ → stem tối giản
  return {
    stem: `___`,
    answer: w,
    full: w,
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 distractor + correct, shuffle. field = word | translation. */
export function buildWordChoices(
  correct: ReviewWordLike,
  pool: ReviewWordLike[],
  field: 'word' | 'translation',
  n = 4,
): string[] {
  const correctVal = (field === 'word' ? correct.word : correct.translation).trim();
  const others = shuffle(
    pool.filter((w) => w.id !== correct.id && (field === 'word' ? w.word : w.translation)?.trim()),
  )
    .slice(0, Math.max(0, n - 1))
    .map((w) => (field === 'word' ? w.word : w.translation).trim());

  // Không đủ distractor → pad bằng placeholder (hiếm)
  while (others.length < n - 1) {
    others.push(`(option ${others.length + 1})`);
  }
  return shuffle([correctVal, ...others]);
}

/**
 * Chọn item mode theo session + maturity.
 * - New/low: recognition
 * - Mid: type / cloze mcq
 * - Mature: cloze type / dictation
 */
export function pickItemMode(
  word: ReviewWordLike,
  session: ReviewSessionMode,
  poolHasExamples: boolean,
): ItemMode {
  const level = word.srsLevel ?? 0;
  // Chỉ coi cloze-able khi example thực sự chứa target (không fallback stem "___")
  const cloze = makeCloze(word.example, word.word);
  const hasExample = Boolean(
    cloze && cloze.stem.includes('___') && cloze.stem !== '___' && cloze.full !== cloze.answer,
  );
  const r = Math.random();

  if (session === 'cloze') {
    if (!hasExample && !poolHasExamples) return 'type_vi_en';
    return r < 0.55 ? 'cloze_type' : 'cloze_mcq';
  }

  if (session === 'listen') {
    return r < 0.45 ? 'listen_type' : 'listen_mcq';
  }

  if (session === 'mcq') {
    return r < 0.5 ? 'mcq_vi_en' : 'mcq_en_vi';
  }

  if (session === 'type') {
    return 'type_vi_en';
  }

  // mixed
  if (level <= 1) {
    if (r < 0.4) return 'mcq_vi_en';
    if (r < 0.7) return 'mcq_en_vi';
    return 'listen_mcq';
  }
  if (level <= 3) {
    if (hasExample && r < 0.35) return 'cloze_mcq';
    if (r < 0.55) return 'type_vi_en';
    if (r < 0.75) return 'listen_mcq';
    return 'mcq_vi_en';
  }
  // mature
  if (hasExample && r < 0.4) return 'cloze_type';
  if (r < 0.65) return 'listen_type';
  if (hasExample && r < 0.85) return 'cloze_mcq';
  return 'type_vi_en';
}

/**
 * Map kết quả → FSRS quality.
 * MCQ recognition: cap Good (4) — không Easy spam.
 * Production đúng + nhanh (<3s) → Easy (5).
 */
export function resultToQuality(opts: {
  correct: boolean;
  close?: boolean;
  itemMode: ItemMode;
  elapsedMs?: number;
}): 0 | 3 | 4 | 5 {
  const isMcq =
    opts.itemMode === 'mcq_vi_en' ||
    opts.itemMode === 'mcq_en_vi' ||
    opts.itemMode === 'cloze_mcq' ||
    opts.itemMode === 'listen_mcq';

  if (!opts.correct) {
    if (opts.close) return 3;
    return 0;
  }

  if (isMcq) return 4; // cap Good

  const fast = typeof opts.elapsedMs === 'number' && opts.elapsedMs > 0 && opts.elapsedMs < 3000;
  return fast ? 5 : 4;
}

export function verdictAndQuality(
  guess: string,
  answer: string,
  itemMode: ItemMode,
  elapsedMs?: number,
): { verdict: Verdict; quality: 0 | 3 | 4 | 5 } {
  const verdict = judgeAnswer(guess, answer);
  const quality = resultToQuality({
    correct: verdict === 'correct',
    close: verdict === 'close',
    itemMode,
    elapsedMs,
  });
  return { verdict, quality };
}

export function itemModeLabel(m: ItemMode): { en: string; vi: string; emoji: string } {
  switch (m) {
    case 'mcq_vi_en':
      return { en: 'MCQ', vi: 'Nghĩa → chọn từ', emoji: '🅰' };
    case 'mcq_en_vi':
      return { en: 'MCQ', vi: 'Từ → chọn nghĩa', emoji: '🅱' };
    case 'cloze_mcq':
      return { en: 'Cloze', vi: 'Điền chỗ trống', emoji: '🧩' };
    case 'cloze_type':
      return { en: 'Cloze type', vi: 'Gõ vào chỗ trống', emoji: '✏️' };
    case 'listen_mcq':
      return { en: 'Listen', vi: 'Nghe → chọn', emoji: '🎧' };
    case 'listen_type':
      return { en: 'Dictation', vi: 'Nghe → gõ', emoji: '✍️' };
    case 'type_vi_en':
      return { en: 'Type', vi: 'Nghĩa → gõ từ', emoji: '⌨️' };
    default:
      return { en: 'Review', vi: 'Ôn', emoji: '📚' };
  }
}

export const HUB_MODES: Array<{
  id: ReviewSessionMode;
  href: string;
  emoji: string;
  title: string;
  desc: string;
  highlight?: boolean;
}> = [
  {
    id: 'mixed',
    href: '/review/session?mode=mixed',
    emoji: '⚡',
    title: 'Ôn hỗn hợp',
    desc: 'Tự đổi MCQ · cloze · nghe · gõ theo độ nhớ',
    highlight: true,
  },
  {
    id: 'cloze',
    href: '/review/session?mode=cloze',
    emoji: '🧩',
    title: 'Cloze câu ví dụ',
    desc: 'Điền từ vào chỗ trống trong context',
  },
  {
    id: 'listen',
    href: '/review/session?mode=listen',
    emoji: '🎧',
    title: 'Nghe & chép',
    desc: 'Nghe TTS → chọn hoặc gõ từ',
  },
  {
    id: 'mcq',
    href: '/quiz',
    emoji: '🅰',
    title: '4 đáp án',
    desc: 'Quiz nhận diện nhanh EN ↔ VI',
  },
  {
    id: 'type',
    href: '/writing',
    emoji: '✍️',
    title: 'Gõ từ',
    desc: 'Active recall: nghĩa → gõ tiếng Anh',
  },
  {
    id: 'flash',
    href: '/flashcard',
    emoji: '🃏',
    title: 'Flashcard',
    desc: 'Lật thẻ + tự chấm Again/Hard/Good/Easy',
  },
];
