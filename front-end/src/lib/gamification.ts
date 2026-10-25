import type { UserGamification } from './supabase';

// XP per flashcard rating (quality: 0=Again, 3=Hard, 4=Good, 5=Easy)
export const XP_BY_QUALITY: Record<number, number> = {
  0: 2,
  3: 5,
  4: 10,
  5: 15,
};

/**
 * Streak = số ngày HỌC LIÊN TIẾP (không phải tổng ngày đã học).
 *
 * Nguồn hiển thị (dashboard/profile): consecutiveStudyStreak(dailyActivity)
 *   — đếm lùi từ hôm nay, gặp gap = dừng. Không cộng dồn ngày rải rác.
 *
 * Nguồn ghi DB: RPC award_xp (current_date server). Có thể stale / lệch TZ.
 * Đọc raw current_streak phải qua effectiveCurrentStreak hoặc resolveDisplayStreak.
 */

/** Múi giờ sản phẩm (VN). Heatmap + streak UI luôn theo lịch này. */
export const APP_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** YYYY-MM-DD theo múi giờ (mặc định VN). */
export function dateKeyInTimeZone(
  d: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** @deprecated dùng dateKeyInTimeZone — giữ alias cho call site cũ */
export function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Cộng/trừ ngày trên khóa YYYY-MM-DD (lịch, không phụ thuộc TZ runtime). */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.slice(0, 10));
  if (!m) return dateKey.slice(0, 10);
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + deltaDays));
  return dt.toISOString().slice(0, 10);
}

/**
 * Build mảng activity N ngày (index 0 = cũ nhất, cuối = hôm nay VN).
 * timestamps ISO → gán vào đúng ngày lịch VN (không dùng server local/UTC getDate).
 */
export function buildDailyActivity(
  timestamps: ReadonlyArray<string | null | undefined>,
  days = 30,
  now: Date = new Date(),
): { date: string; count: number }[] {
  const dayMap: Record<string, number> = {};
  for (const ts of timestamps) {
    if (!ts) continue;
    const key = dateKeyInTimeZone(new Date(ts));
    dayMap[key] = (dayMap[key] ?? 0) + 1;
  }
  const todayKey = dateKeyInTimeZone(now);
  return Array.from({ length: days }, (_, i) => {
    const key = shiftDateKey(todayKey, -(days - 1 - i));
    return { date: key, count: dayMap[key] ?? 0 };
  });
}

/**
 * Streak còn hiệu lực tại thời điểm đọc (theo lịch VN).
 * - last_active = hôm nay hoặc hôm qua → giữ current_streak
 * - last_active cũ hơn → 0 (đã gãy)
 */
export function effectiveCurrentStreak(
  currentStreak: number | null | undefined,
  lastActiveDate: string | null | undefined,
  now: Date = new Date(),
): number {
  const raw = Math.max(0, Math.floor(currentStreak ?? 0));
  if (raw <= 0) return 0;
  if (!lastActiveDate) return 0;

  const last = lastActiveDate.slice(0, 10);
  const today = dateKeyInTimeZone(now);
  const yesterday = shiftDateKey(today, -1);

  if (last === today || last === yesterday) return raw;
  return 0;
}

/**
 * Streak liên tiếp từ mảng activity (index 0 = cũ nhất, cuối = hôm nay).
 * Grace: chưa học hôm nay vẫn tính nếu hôm qua có học.
 * Gặp 1 ngày count=0 → dừng (KHÔNG đếm tổng ngày rải rác).
 */
export function consecutiveStudyStreak(
  dailyActivity: ReadonlyArray<{ count: number }>,
): number {
  if (dailyActivity.length === 0) return 0;

  let i = dailyActivity.length - 1;
  if ((dailyActivity[i]?.count ?? 0) <= 0) {
    i -= 1;
    if (i < 0 || (dailyActivity[i]?.count ?? 0) <= 0) return 0;
  }

  let streak = 0;
  for (; i >= 0; i--) {
    if ((dailyActivity[i]?.count ?? 0) > 0) streak += 1;
    else break;
  }
  return streak;
}

/**
 * Streak hiển thị dashboard/profile.
 * Ưu tiên activity thật (ngày liên tiếp). DB chỉ fallback khi chưa có heatmap
 * hoặc chuỗi đầy cửa sổ 30 ngày và gamification còn sống + cao hơn.
 */
export function resolveDisplayStreak(input: {
  currentStreak?: number | null;
  lastActiveDate?: string | null;
  dailyActivity?: ReadonlyArray<{ count: number }> | null;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const gam = effectiveCurrentStreak(input.currentStreak, input.lastActiveDate, now);
  const activity = input.dailyActivity;

  if (!activity || activity.length === 0) return gam;

  const fromActivity = consecutiveStudyStreak(activity);
  // Cửa sổ 30 ngày đầy liên tiếp → cho phép tin gam nếu còn sống và dài hơn
  if (fromActivity >= activity.length && gam > fromActivity) return gam;
  return fromActivity;
}

/** last_active suy ra từ activity (ngày học gần nhất có count > 0). */
export function lastActiveFromActivity(
  dailyActivity: ReadonlyArray<{ date: string; count: number }>,
): string | null {
  for (let i = dailyActivity.length - 1; i >= 0; i--) {
    if ((dailyActivity[i]?.count ?? 0) > 0) return dailyActivity[i]!.date;
  }
  return null;
}

export const XP_PER_CORRECT_QUIZ = 8;

// Lingo Level: thresholds XP tích luỹ
export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];

// Tên cấp độ cho từng level (1-11+). Index khớp với level - 1.
export const LEVEL_NAMES = [
  'Rookie',         // Lv 1
  'Beginner',       // Lv 2
  'Learner',        // Lv 3
  'Apprentice',     // Lv 4
  'Intermediate',   // Lv 5
  'Advanced',       // Lv 6
  'Proficient',     // Lv 7
  'Expert',         // Lv 8
  'Master',         // Lv 9
  'Grandmaster',    // Lv 10
  'Legend',         // Lv 11+
] as const;

export function xpToLevel(totalXp: number): number {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function levelName(level: number): string {
  const idx = Math.min(Math.max(level, 1), LEVEL_NAMES.length) - 1;
  return LEVEL_NAMES[idx];
}

export function levelProgress(totalXp: number): {
  level: number;
  name: string;
  current: number;
  next: number;
  pct: number;
  isMax: boolean;
} {
  const level = xpToLevel(totalXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const pct = !isMax && nextThreshold > currentThreshold
    ? Math.round(((totalXp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100;
  return {
    level,
    name: levelName(level),
    current: totalXp - currentThreshold,
    next: nextThreshold - currentThreshold,
    pct,
    isMax,
  };
}

export interface BadgeDefinition {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface EarnedBadge extends BadgeDefinition {
  earned: boolean;
}

interface BadgeContext extends UserGamification {
  masteredWords?: number;
  /** Số unit lộ trình đã hoàn thành (checkpoint pass). */
  roadmapUnitsDone?: number;
  /** Cấp lộ trình cao nhất đã hoàn thành trọn vẹn ('A0'...'B2'). */
  roadmapLevelsDone?: string[];
}

const BADGES: (BadgeDefinition & { check: (g: BadgeContext) => boolean })[] = [
  { id: 'streak_3',    label: '3 ngày',      emoji: '🔥', description: 'Streak 3 ngày liên tiếp',   check: g => g.current_streak >= 3 },
  { id: 'streak_7',    label: '7 ngày',      emoji: '🔥', description: 'Streak 7 ngày liên tiếp',   check: g => g.current_streak >= 7 },
  { id: 'streak_30',   label: '30 ngày',     emoji: '🔥', description: 'Streak 30 ngày liên tiếp',  check: g => g.current_streak >= 30 },
  { id: 'xp_100',      label: '100 XP',      emoji: '⭐', description: 'Tích luỹ 100 XP',            check: g => g.total_xp >= 100 },
  { id: 'xp_500',      label: '500 XP',      emoji: '🌟', description: 'Tích luỹ 500 XP',            check: g => g.total_xp >= 500 },
  { id: 'xp_2000',     label: '2000 XP',     emoji: '💫', description: 'Tích luỹ 2000 XP',           check: g => g.total_xp >= 2000 },
  { id: 'words_10',    label: '10 từ',       emoji: '📚', description: 'Thành thạo 10 từ',           check: g => (g.masteredWords ?? 0) >= 10 },
  { id: 'words_50',    label: '50 từ',       emoji: '📖', description: 'Thành thạo 50 từ',           check: g => (g.masteredWords ?? 0) >= 50 },
  { id: 'words_100',   label: '100 từ',      emoji: '🏆', description: 'Thành thạo 100 từ',          check: g => (g.masteredWords ?? 0) >= 100 },
  // Lộ trình học 5 cấp
  { id: 'journey_unit_1',  label: 'Chặng đầu',  emoji: '🚩', description: 'Vượt chặng đầu tiên của lộ trình',  check: g => (g.roadmapUnitsDone ?? 0) >= 1 },
  { id: 'journey_unit_10', label: '10 chặng',   emoji: '⛳', description: 'Vượt 10 chặng lộ trình',            check: g => (g.roadmapUnitsDone ?? 0) >= 10 },
  { id: 'journey_a0',      label: 'Xong A0',    emoji: '🌱', description: 'Hoàn thành cấp A0 — thoát mất gốc', check: g => (g.roadmapLevelsDone ?? []).includes('A0') },
  { id: 'journey_a1',      label: 'Xong A1',    emoji: '🌿', description: 'Hoàn thành cấp A1',                 check: g => (g.roadmapLevelsDone ?? []).includes('A1') },
  { id: 'journey_a2',      label: 'Xong A2',    emoji: '🌳', description: 'Hoàn thành cấp A2',                 check: g => (g.roadmapLevelsDone ?? []).includes('A2') },
  { id: 'journey_b1',      label: 'Xong B1',    emoji: '⛰️', description: 'Hoàn thành cấp B1',                 check: g => (g.roadmapLevelsDone ?? []).includes('B1') },
  { id: 'journey_b2',      label: 'Xong B2',    emoji: '🏔️', description: 'Hoàn thành cấp B2 — trung cao!',    check: g => (g.roadmapLevelsDone ?? []).includes('B2') },
];

export function earnedBadges(
  gamification: UserGamification,
  masteredWords = 0,
  roadmap?: { unitsDone: number; levelsDone: string[] },
): EarnedBadge[] {
  return BADGES.map(b => ({
    id: b.id,
    label: b.label,
    emoji: b.emoji,
    description: b.description,
    earned: b.check({
      ...gamification,
      masteredWords,
      roadmapUnitsDone: roadmap?.unitsDone,
      roadmapLevelsDone: roadmap?.levelsDone,
    }),
  }));
}
