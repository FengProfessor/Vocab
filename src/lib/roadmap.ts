/**
 * Roadmap loader — hỗ trợ 2 track:
 *  - 'cefr': lộ trình 5 cấp A0→B2 (roadmap-v1.json)
 *  - 'thpt': luyện thi lớp 10/11/12 (roadmap-thpt-v1.json) + nội dung đọc/đề (content-v1.json)
 * Step ID ổn định gắn nội dung. Progress per-track (user_roadmap.track).
 */
import roadmapArtifact from '@/data/roadmap/roadmap-v1.json';
import roadmapThptArtifact from '@/data/roadmap/roadmap-thpt-v1.json';
import placementArtifact from '@/data/roadmap/placement-v1.json';
import pronunciationArtifact from '@/data/pronunciation/lessons-v1.json';
import starterPacksArtifact from '@/data/roadmap/starter-packs-v1.json';
import thptContentArtifact from '@/data/thpt/content-v1.json';

export type RoadmapTrack = 'cefr' | 'thpt';
export type RoadmapLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'lop-10' | 'lop-11' | 'lop-12';
export const CEFR_LEVEL_ORDER: RoadmapLevelId[] = ['A0', 'A1', 'A2', 'B1', 'B2'];
export const THPT_LEVEL_ORDER: RoadmapLevelId[] = ['lop-10', 'lop-11', 'lop-12'];
/** Backward-compat: mặc định thứ tự CEFR. */
export const ROADMAP_LEVEL_ORDER = CEFR_LEVEL_ORDER;

export function levelOrder(track: RoadmapTrack): RoadmapLevelId[] {
  return track === 'thpt' ? THPT_LEVEL_ORDER : CEFR_LEVEL_ORDER;
}

export type RoadmapStepType =
  | 'vocab' | 'grammar' | 'pronunciation' | 'checkpoint'
  | 'reading' | 'cloze' | 'arrange' | 'announcement' | 'leaflet' | 'exam';

export interface RoadmapStep {
  id: string;
  type: RoadmapStepType;
  ref: string;
  title: string;
  wordCount?: number;
}
export interface RoadmapUnit { id: string; index: number; title: string; steps: RoadmapStep[] }
export interface RoadmapLevel {
  id: RoadmapLevelId;
  title: string;
  titleVi: string;
  description: string;
  units: RoadmapUnit[];
}
interface RoadmapArtifact { roadmapVersion: string; catalogVersion: string; levels: RoadmapLevel[] }

export interface PronunciationLesson {
  id: string; level: string; title: string; ipa: string;
  whyHard: string; mouthTip: string; exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: { a: string; b: string; note: string }[];
}
export interface PlacementQuestion {
  id: string; level: RoadmapLevelId; kind: 'vocab' | 'grammar' | 'listening';
  prompt: string; options: string[]; answer: string; audioWord?: string;
}

const cefr = roadmapArtifact as unknown as RoadmapArtifact;
const thpt = roadmapThptArtifact as unknown as RoadmapArtifact;
const pronunciation = pronunciationArtifact as unknown as { lessons: PronunciationLesson[] };
const placement = placementArtifact as unknown as {
  version: string; rule: { passPerLevel: number; questionsPerLevel: number }; questions: PlacementQuestion[];
};

export const ROADMAP_VERSION = cefr.roadmapVersion;

function artifactOf(track: RoadmapTrack): RoadmapArtifact {
  return track === 'thpt' ? thpt : cefr;
}

export function getRoadmapLevels(track: RoadmapTrack = 'cefr'): RoadmapLevel[] {
  return artifactOf(track).levels;
}

// Index step theo từng track (id có thể trùng giữa track — luôn tra theo track)
type StepEntry = { step: RoadmapStep; unit: RoadmapUnit; level: RoadmapLevel; globalIndex: number };
function buildIndex(artifact: RoadmapArtifact): Map<string, StepEntry> {
  const idx = new Map<string, StepEntry>();
  let g = 0;
  for (const level of artifact.levels) {
    for (const unit of level.units) {
      for (const step of unit.steps) { idx.set(step.id, { step, unit, level, globalIndex: g }); g++; }
    }
  }
  return idx;
}
const stepIndexByTrack: Record<RoadmapTrack, Map<string, StepEntry>> = {
  cefr: buildIndex(cefr),
  thpt: buildIndex(thpt),
};

export function orderedStepIds(track: RoadmapTrack = 'cefr'): string[] {
  return [...stepIndexByTrack[track].entries()].sort((a, b) => a[1].globalIndex - b[1].globalIndex).map(([id]) => id);
}

export function resolveStep(stepId: string, track: RoadmapTrack = 'cefr'): StepEntry | null {
  return stepIndexByTrack[track].get(stepId) ?? null;
}

/** Tra step ở cả 2 track (step_id không trùng giữa artifact). Dùng khi progress không biết track. */
export function resolveStepAny(stepId: string): { entry: StepEntry; track: RoadmapTrack } | null {
  for (const track of ['cefr', 'thpt'] as const) {
    const entry = stepIndexByTrack[track].get(stepId);
    if (entry) return { entry, track };
  }
  return null;
}

export function resolveUnit(unitId: string, track: RoadmapTrack = 'cefr'): { unit: RoadmapUnit; level: RoadmapLevel } | null {
  for (const level of artifactOf(track).levels) {
    const unit = level.units.find((u) => u.id === unitId);
    if (unit) return { unit, level };
  }
  return null;
}

// ── Starter packs A0 ──
export interface StarterPack { id: string; title: string; words: string[] }
const starterPacks = (starterPacksArtifact as unknown as { packs: StarterPack[] }).packs;
export function getStarterPack(packId: string): StarterPack | null {
  if (!packId.startsWith('starter-')) return null;
  return starterPacks.find((p) => p.id === packId) ?? null;
}

export function getPronunciationLesson(id: string): PronunciationLesson | null {
  return pronunciation.lessons.find((l) => l.id === id) ?? null;
}

// ── Nội dung THPT (đọc/điền/sắp xếp/cloze/đề) ──
export interface ThptBlank { options: string[]; answer: string; explain: string }
export interface ThptFillItem { id: string; grade: string; title: string; text: string; blanks: ThptBlank[] }
export interface ThptArrangeItem { id: string; grade: string; prompt: string; sentences: { key: string; text: string }[]; answer: string[]; explain: string }
export interface ThptReadingItem { id: string; grade: string; title: string; length?: string; passage: string; questions: { q: string; options: string[]; answer: string; explain: string }[] }
export interface ThptExamItem { id: string; grade: string; title: string; note?: string; itemRefs: { type: string; id: string }[] }

const thptContent = thptContentArtifact as unknown as {
  announcement: ThptFillItem[]; leaflet: ThptFillItem[]; arrange: ThptArrangeItem[];
  cloze: ThptFillItem[]; reading: ThptReadingItem[]; exam: ThptExamItem[];
};

export type ThptContentType = 'announcement' | 'leaflet' | 'arrange' | 'cloze' | 'reading' | 'exam';

export function getThptContent(type: ThptContentType, id: string): ThptFillItem | ThptArrangeItem | ThptReadingItem | ThptExamItem | null {
  const list = thptContent[type] as { id: string }[] | undefined;
  return (list?.find((x) => x.id === id) as ThptFillItem | ThptArrangeItem | ThptReadingItem | ThptExamItem) ?? null;
}

// ── Placement (chỉ track CEFR) ──
export function getPlacement(): { version: string; rule: { passPerLevel: number; questionsPerLevel: number }; questions: PlacementQuestion[] } {
  return placement;
}
export function scorePlacement(answers: Record<string, string>): RoadmapLevelId {
  for (const levelId of CEFR_LEVEL_ORDER) {
    const qs = placement.questions.filter((q) => q.level === levelId);
    const correct = qs.filter((q) => answers[q.id] === q.answer).length;
    if (correct < placement.rule.passPerLevel) return levelId;
  }
  return 'B2';
}

// ── Exit standards (stub — full content load sau khi có exit-standards data) ──
export type ExitStandard = { canDo: string[]; notYet: string[] };

export function getExitDisclaimer(): string {
  return 'Chuẩn đầu ra theo CEFR. Ôn đều SRS để giữ từ và kỹ năng lâu dài.';
}

export function getExitStandard(_levelId: string): ExitStandard | null {
  return null;
}
