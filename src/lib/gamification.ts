import type { UserGamification } from './supabase';

// XP per flashcard rating (quality: 0=Again, 3=Hard, 4=Good, 5=Easy)
export const XP_BY_QUALITY: Record<number, number> = {
  0: 2,
  3: 5,
  4: 10,
  5: 15,
};

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
