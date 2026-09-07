// Client helpers cho lộ trình — gọi từ journey/flashcard/grammar/pronunciation/checkpoint.
'use client';

import { authFetch } from './auth-fetch';
import exitStandardsArtifact from '@/data/roadmap/exit-standards-v1.json';

export type RoadmapStepViewType =
  | 'vocab' | 'grammar' | 'pronunciation' | 'checkpoint'
  | 'reading' | 'cloze' | 'arrange' | 'announcement' | 'leaflet' | 'exam';

export interface RoadmapStepView {
  id: string;
  type: RoadmapStepViewType;
  ref: string;
  title: string;
  wordCount?: number;
  status: 'completed' | 'current' | 'locked' | 'review';
  score: number | null;
  /** Step vừa được credit từ kho (vocab/grammar đã học ngoài lộ trình). */
  fromLibrary?: boolean;
  estimatedMinutes?: number;
  canDo?: string[];
  topicPreview?: string;
}
export interface RoadmapUnitView {
  id: string;
  index: number;
  title: string;
  steps: RoadmapStepView[];
  estimatedMinutes?: number;
  canDo?: string[];
  topicPreview?: string;
  badgeIcon?: string;
  badgeName?: string;
  progressPct?: number;
  status?: 'completed' | 'current' | 'locked' | 'review' | 'in-progress';
  completedStepsCount?: number;
  totalStepsCount?: number;
  earnedBadge?: { name: string; icon: string } | null;
}
export interface RoadmapLevelView {
  id: string; title: string; titleVi: string; description: string; isStartLevel: boolean; units: RoadmapUnitView[];
}

export type RoadmapTrackId = 'cefr' | 'thpt';

// ── Exit standards ──
export interface ExitStandard {
  labelVi?: string;
  targetLemmas?: string;
  canDo: string[];
  notYet: string[];
}

export function getExitDisclaimer(): string {
  return (exitStandardsArtifact as { disclaimer?: string }).disclaimer || 'Chuẩn đầu ra theo CEFR. Ôn đều SRS để giữ từ và kỹ năng lâu dài.';
}

export function getExitStandard(levelId: string): ExitStandard | null {
  const levels = (exitStandardsArtifact as unknown as { levels: Record<string, ExitStandard> }).levels;
  return levels[levelId] ?? null;
}

// ── Tiến độ & Thống kê Chặng (Unit Progress & Calculation Helpers) ──

/** Tính tỷ lệ hoàn thành chặng (0 - 100%) */
export function calculateUnitCompletion(
  unit: { steps: { id: string }[] },
  completedStepIds: Set<string> | string[]
): number {
  if (!unit.steps || unit.steps.length === 0) return 0;
  const completedSet = completedStepIds instanceof Set ? completedStepIds : new Set(completedStepIds);
  const doneCount = unit.steps.filter((s) => completedSet.has(s.id)).length;
  return Math.round((doneCount / unit.steps.length) * 100);
}

/** Xác định trạng thái học tập của chặng: completed | in-progress | locked */
export function getUnitStatus(
  unit: { steps: { id: string }[] },
  completedStepIds: Set<string> | string[],
  currentStepId?: string | null
): 'completed' | 'in-progress' | 'locked' {
  if (!unit.steps || unit.steps.length === 0) return 'locked';
  const completedSet = completedStepIds instanceof Set ? completedStepIds : new Set(completedStepIds);
  const isAllDone = unit.steps.every((s) => completedSet.has(s.id));
  if (isAllDone) return 'completed';

  const hasAnyDone = unit.steps.some((s) => completedSet.has(s.id));
  const hasCurrentStep = currentStepId ? unit.steps.some((s) => s.id === currentStepId) : false;
  if (hasAnyDone || hasCurrentStep) return 'in-progress';

  return 'locked';
}

/** Tính tổng thời lượng ước tính (phút) của 1 chặng */
export function calculateUnitDuration(unit: {
  estimatedMinutes?: number;
  steps?: { estimatedMinutes?: number }[];
}): number {
  if (typeof unit.estimatedMinutes === 'number' && unit.estimatedMinutes > 0) {
    return unit.estimatedMinutes;
  }
  if (unit.steps && unit.steps.length > 0) {
    return unit.steps.reduce((sum, s) => sum + (s.estimatedMinutes || 10), 0);
  }
  return 45;
}

/** Tính tổng thời lượng ước tính (phút) của nhiều chặng hoặc cả cấp độ */
export function calculateTotalDuration(
  units: { estimatedMinutes?: number; steps?: { estimatedMinutes?: number }[] }[]
): number {
  return units.reduce((sum, u) => sum + calculateUnitDuration(u), 0);
}

/** Lấy danh sách huy hiệu chặng đã đạt được */
export function getEarnedUnitBadges(
  units: (RoadmapUnitView | { id: string; badgeName?: string; badgeIcon?: string; steps: { id: string }[] })[],
  completedStepIds: Set<string> | string[]
): Array<{ unitId: string; badgeName: string; badgeIcon: string }> {
  const completedSet = completedStepIds instanceof Set ? completedStepIds : new Set(completedStepIds);
  const earned: Array<{ unitId: string; badgeName: string; badgeIcon: string }> = [];

  for (const unit of units) {
    if (unit.steps && unit.steps.length > 0 && unit.steps.every((s) => completedSet.has(s.id))) {
      if (unit.badgeName && unit.badgeIcon) {
        earned.push({
          unitId: unit.id,
          badgeName: unit.badgeName,
          badgeIcon: unit.badgeIcon,
        });
      }
    }
  }

  return earned;
}

export interface RoadmapEnrollmentView {
  track: RoadmapTrackId;
  levelId: string;
  startedAt?: string;
}

export interface RoadmapTreeResponse {
  enrolled: boolean;
  enrollments?: RoadmapEnrollmentView[];
  needsPlacement?: boolean;
  roadmapVersion?: string;
  track?: RoadmapTrackId;
  levelId?: string;
  currentStepId?: string | null;
  /** Số step vừa được ghi completed từ kho trong request này. */
  creditedFromLibrary?: number;
  tree?: RoadmapLevelView[];
}

export async function fetchRoadmap(track?: RoadmapTrackId): Promise<RoadmapTreeResponse> {
  const qs = track ? `?track=${track}` : '';
  const res = await authFetch(`/api/roadmap${qs}`);
  const json = await res.json() as { success: boolean; data?: RoadmapTreeResponse; error?: string };
  if (!res.ok || !json.success || !json.data) throw new Error(json.error || 'Không tải được lộ trình');
  return json.data;
}

export interface CompleteStepResult {
  xpAwarded: number;
  unitCompleted: boolean;
  levelCompleted: boolean;
  levelId: string;
}

/** Flag sessionStorage → Journey hiện popup chúc mừng (unit | level:<id>). */
export function setRoadmapCelebrateFlag(result: Pick<CompleteStepResult, 'levelCompleted' | 'levelId'>): void {
  try {
    if (result.levelCompleted) {
      sessionStorage.setItem('roadmap_celebrate', `level:${result.levelId}`);
    } else {
      sessionStorage.setItem('roadmap_celebrate', 'unit');
    }
  } catch {
    /* ignore */
  }
}

let lastCompleteError: string | undefined;

export function getLastRoadmapStepError(): string | undefined {
  return lastCompleteError;
}

/**
 * Báo hoàn thành 1 step lộ trình. Trả null nếu server từ chối (chưa unlock / chưa đủ điểm).
 * Fire từ màn kết thúc phiên học khi URL có ?roadmapStep=<id>.
 * Lỗi gần nhất: getLastRoadmapStepError().
 */
export async function completeRoadmapStep(stepId: string, score?: number): Promise<CompleteStepResult | null> {
  try {
    const res = await authFetch('/api/roadmap/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, score }),
    });
    const json = await res.json() as { success: boolean; data?: CompleteStepResult; error?: string };
    if (!res.ok || !json.success || !json.data) {
      lastCompleteError = json.error || 'Không ghi được tiến độ lộ trình';
      console.warn('[Roadmap] complete step rejected:', lastCompleteError);
      return null;
    }
    lastCompleteError = undefined;
    return json.data;
  } catch (err) {
    lastCompleteError = err instanceof Error ? err.message : 'Không ghi được tiến độ lộ trình';
    console.error('[Roadmap] complete step failed:', err);
    return null;
  }
}
