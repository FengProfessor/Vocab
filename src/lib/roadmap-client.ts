// Client helpers cho lộ trình — gọi từ journey/flashcard/grammar/pronunciation/checkpoint.
'use client';

import { authFetch } from './auth-fetch';

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
}
export interface RoadmapUnitView { id: string; index: number; title: string; steps: RoadmapStepView[] }
export interface RoadmapLevelView {
  id: string; title: string; titleVi: string; description: string; isStartLevel: boolean; units: RoadmapUnitView[];
}

export type RoadmapTrackId = 'cefr' | 'thpt';

// ── Exit standards (stub) ──
// Ở đây thay vì roadmap.ts để tránh kéo ~157KB JSON lộ trình vào bundle client
// chỉ vì 2 hàm hằng số (roadmap.ts build index từ 6 file JSON ở top-level, không tree-shake được).
export type ExitStandard = { canDo: string[]; notYet: string[] };

export function getExitDisclaimer(): string {
  return 'Chuẩn đầu ra theo CEFR. Ôn đều SRS để giữ từ và kỹ năng lâu dài.';
}

export function getExitStandard(_levelId: string): ExitStandard | null {
  return null;
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
