/**
 * FSRS scheduler — dùng thư viện CHÍNH THỨC ts-fsrs (open-spaced-repetition).
 *
 * Thay cho bản tự-tune ở `srs.ts` (vẫn giữ helpers stabilityToLevel/mapQualityToRating).
 * Khác biệt cốt lõi: CÓ learning/relearning steps (enable_short_term) →
 *   - Từ MỚI: gặp lại sau 1–10 phút trước khi giãn theo ngày.
 *   - QUÊN (Again): ôn lại sau ~10 phút (relearning) thay vì nhảy thẳng nhiều ngày.
 *   - Trọng số: bộ FSRS đã benchmark trên hàng triệu lượt ôn (không tự chỉnh tay).
 *
 * `next_review_date` là timestamptz → đã hỗ trợ mốc < 1 ngày (phút/giờ).
 */
import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs';

/** Cấu hình lịch ôn — chuẩn Anki-like, retention 90%. */
const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,          // chống dồn cục (Anki default)
  enable_short_term: true,    // BẬT learning/relearning steps
  learning_steps: ['1m', '10m'],
  relearning_steps: ['10m', '30m'], // Quên → khắc lại 2 lần (10' rồi 30') trước khi giãn theo ngày
});
const scheduler = fsrs(params);

/** Rating FSRS (1=Again,2=Hard,3=Good,4=Easy). */
export type FsrsGrade = 1 | 2 | 3 | 4;

/** Shape lưu trong DB (srs_progress / grammar_progress). */
export interface StoredSRS {
  stability: number;
  difficulty: number;
  interval_days: number;     // ~ scheduled_days (0 nếu đang ở learning step < 1 ngày)
  review_count: number;      // ~ reps
  state: number;             // 0=New,1=Learning,2=Review,3=Relearning
  lapses: number;
  learning_steps: number;    // chỉ số bước learning hiện tại (ts-fsrs cần để tiến bước)
  next_review_date: string;  // ISO (due)
  last_reviewed_at: string;  // ISO
}

/** Dữ liệu hàng DB thô (mọi cột optional vì có thể thiếu ở bản cũ). */
export interface SrsRowLike {
  stability?: number | null;
  difficulty?: number | null;
  interval_days?: number | null;
  review_count?: number | null;
  state?: number | null;
  lapses?: number | null;
  learning_steps?: number | null;
  next_review_date?: string | null;
  last_reviewed_at?: string | null;
}

/** Tái dựng ts-fsrs Card từ hàng DB; suy luận state cho dữ liệu legacy (state=0 nhưng đã học). */
function toCard(row: SrsRowLike | null | undefined, now: Date): Card {
  // Chưa từng học → thẻ mới
  const hasHistory = !!row && ((row.stability ?? 0) > 0 || (row.review_count ?? 0) > 0 || !!row.last_reviewed_at);
  if (!row || !hasHistory) return createEmptyCard(now);

  const last = row.last_reviewed_at ? new Date(row.last_reviewed_at) : now;
  const due = row.next_review_date ? new Date(row.next_review_date) : now;
  const elapsed = Math.max(0, (now.getTime() - last.getTime()) / 86_400_000);

  // Legacy: nhiều hàng cũ có state=0 (New) dù đã có stability → coi như Review để không reset.
  let state = (row.state ?? 0) as State;
  if (state === State.New && hasHistory) state = State.Review;

  return {
    due,
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    elapsed_days: elapsed,
    scheduled_days: row.interval_days ?? 0,
    learning_steps: row.learning_steps ?? 0,
    reps: row.review_count ?? 0,
    lapses: row.lapses ?? 0,
    state,
    last_review: row.last_reviewed_at ? last : undefined,
  };
}

/** Lên lịch ôn kế tiếp. Trả shape sẵn sàng upsert vào DB. */
export function scheduleNext(row: SrsRowLike | null | undefined, grade: FsrsGrade, now: Date = new Date()): StoredSRS {
  const card = toCard(row, now);
  const { card: c } = scheduler.next(card, now, grade as unknown as Grade);
  return {
    stability: c.stability,
    difficulty: c.difficulty,
    interval_days: c.scheduled_days,
    review_count: c.reps,
    state: c.state,
    lapses: c.lapses,
    learning_steps: c.learning_steps,
    next_review_date: c.due.toISOString(),
    last_reviewed_at: (c.last_review ?? now).toISOString(),
  };
}

/** Map state số (FSRS) → text cho bảng grammar_progress (cột state TEXT). */
export function stateToText(state: number): 'new' | 'learning' | 'review' | 'relearning' {
  switch (state) {
    case State.Learning: return 'learning';
    case State.Review: return 'review';
    case State.Relearning: return 'relearning';
    default: return 'new';
  }
}

/** Map text (grammar_progress legacy) → state số FSRS. */
export function textToState(text?: string | null): number {
  switch (text) {
    case 'learning': return State.Learning;
    case 'review':
    case 'mastered': return State.Review;
    case 'relearning': return State.Relearning;
    default: return State.New;
  }
}

export { Rating, State };
