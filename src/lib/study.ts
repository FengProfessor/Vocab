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

/** Phát âm bằng Web Speech API. rate: 1.0 = thường, 0.6 = chậm. */
export function speak(text: string, rate = 1.0): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Hủy câu đang đọc để tránh chồng tiếng
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
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
