/**
 * Roadmap V1 — loader trung tâm cho lộ trình 5 cấp A0→B2.
 * Artifact: scripts/roadmap-gen/generate.ts → src/data/roadmap/roadmap-v1.json
 * Step ID ổn định gắn nội dung (sv-<packId> / sg-<slug> / sp-<lessonId> / sc-<level>-<n>).
 */
import roadmapArtifact from '@/data/roadmap/roadmap-v1.json';
import placementArtifact from '@/data/roadmap/placement-v1.json';
import pronunciationArtifact from '@/data/pronunciation/lessons-v1.json';

export type RoadmapLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export const ROADMAP_LEVEL_ORDER: RoadmapLevelId[] = ['A0', 'A1', 'A2', 'B1', 'B2'];

export type RoadmapStepType = 'vocab' | 'grammar' | 'pronunciation' | 'checkpoint';

export interface RoadmapStep {
  id: string;
  type: RoadmapStepType;
  ref: string;
  title: string;
  wordCount?: number;
}
export interface RoadmapUnit {
  id: string;
  index: number;
  title: string;
  steps: RoadmapStep[];
}
export interface RoadmapLevel {
  id: RoadmapLevelId;
  title: string;
  titleVi: string;
  description: string;
  units: RoadmapUnit[];
}
interface RoadmapArtifact {
  roadmapVersion: string;
  catalogVersion: string;
  levels: RoadmapLevel[];
}

export interface PronunciationLesson {
  id: string;
  level: string;
  title: string;
  ipa: string;
  whyHard: string;
  mouthTip: string;
  exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: { a: string; b: string; note: string }[];
}

export interface PlacementQuestion {
  id: string;
  level: RoadmapLevelId;
  kind: 'vocab' | 'grammar';
  prompt: string;
  options: string[];
  answer: string;
}

const roadmap = roadmapArtifact as unknown as RoadmapArtifact;
const pronunciation = pronunciationArtifact as unknown as { lessons: PronunciationLesson[] };
const placement = placementArtifact as unknown as {
  version: string;
  rule: { passPerLevel: number; questionsPerLevel: number };
  questions: PlacementQuestion[];
};

export const ROADMAP_VERSION = roadmap.roadmapVersion;

export function getRoadmapLevels(): RoadmapLevel[] {
  return roadmap.levels;
}

const stepIndex = new Map<string, { step: RoadmapStep; unit: RoadmapUnit; level: RoadmapLevel; globalIndex: number }>();
{
  let g = 0;
  for (const level of roadmap.levels) {
    for (const unit of level.units) {
      for (const step of unit.steps) {
        stepIndex.set(step.id, { step, unit, level, globalIndex: g });
        g++;
      }
    }
  }
}

/** Danh sách step phẳng theo thứ tự lộ trình (dùng validate tuần tự). */
export function orderedStepIds(): string[] {
  return [...stepIndex.entries()].sort((a, b) => a[1].globalIndex - b[1].globalIndex).map(([id]) => id);
}

export function resolveStep(stepId: string): { step: RoadmapStep; unit: RoadmapUnit; level: RoadmapLevel; globalIndex: number } | null {
  return stepIndex.get(stepId) ?? null;
}

/** Step đứng ngay trước stepId trong cùng lộ trình (null nếu là step đầu). */
export function previousStepId(stepId: string): string | null {
  const entry = stepIndex.get(stepId);
  if (!entry || entry.globalIndex === 0) return null;
  for (const [id, e] of stepIndex) {
    if (e.globalIndex === entry.globalIndex - 1) return id;
  }
  return null;
}

/** Tra unit theo id (u-<level>-<n>). */
export function resolveUnit(unitId: string): { unit: RoadmapUnit; level: RoadmapLevel } | null {
  for (const level of roadmap.levels) {
    const unit = level.units.find((u) => u.id === unitId);
    if (unit) return { unit, level };
  }
  return null;
}

export function getPronunciationLesson(id: string): PronunciationLesson | null {
  return pronunciation.lessons.find((l) => l.id === id) ?? null;
}

export function getPlacement(): { version: string; rule: { passPerLevel: number; questionsPerLevel: number }; questions: PlacementQuestion[] } {
  return placement;
}

/**
 * Chấm placement: đúng ≥passPerLevel trong cấp → thử cấp sau; rớt → xếp vào cấp đang rớt.
 * answers: map questionId → đáp án đã chọn.
 */
export function scorePlacement(answers: Record<string, string>): RoadmapLevelId {
  for (const levelId of ROADMAP_LEVEL_ORDER) {
    const qs = placement.questions.filter((q) => q.level === levelId);
    const correct = qs.filter((q) => answers[q.id] === q.answer).length;
    // Rớt cấp nào → bắt đầu học từ cấp đó (cấp chưa vững)
    if (correct < placement.rule.passPerLevel) return levelId;
  }
  return 'B2';
}
