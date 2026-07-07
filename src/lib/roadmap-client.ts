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
}
export interface RoadmapUnitView { id: string; index: number; title: string; steps: RoadmapStepView[] }
export interface RoadmapLevelView {
  id: string; title: string; titleVi: string; description: string; isStartLevel: boolean; units: RoadmapUnitView[];
}
export interface RoadmapTreeResponse {
  enrolled: boolean;
  roadmapVersion?: string;
  track?: 'cefr' | 'thpt';
  levelId?: string;
  currentStepId?: string | null;
  tree?: RoadmapLevelView[];
}

export async function fetchRoadmap(): Promise<RoadmapTreeResponse> {
  const res = await authFetch('/api/roadmap');
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

/**
 * Báo hoàn thành 1 step lộ trình. Trả null nếu server từ chối (chưa unlock / chưa đủ điểm).
 * Fire từ màn kết thúc phiên học khi URL có ?roadmapStep=<id>.
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
      console.warn('[Roadmap] complete step rejected:', json.error);
      return null;
    }
    return json.data;
  } catch (err) {
    console.error('[Roadmap] complete step failed:', err);
    return null;
  }
}
