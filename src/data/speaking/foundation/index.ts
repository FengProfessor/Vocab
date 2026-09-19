/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * Barrel Export & Data Access Utilities
 * File: src/data/speaking/foundation/index.ts
 */

import { STAGE_MINDSET_LESSONS, MINDSET_PLEDGES } from './stage-mindset';
import { STAGE_0_PHONETIC_LESSONS } from './stage-0-phonetics';
import { STAGE_1_SURVIVAL_FRAMES } from './stage-1-survival-frames';
import { STAGE_2_LEGO_LESSONS } from './stage-2-lego-slots';
import { STAGE_3_EXPANSIONS, STAGE_3_MICRO_DIALOGUES } from './stage-3-expansions';
import type {
  MindsetLesson,
  MindsetPledge,
  Stage0PhoneticLesson,
  SurvivalFrame,
  SurvivalDomainId,
  LegoSlotLesson,
  ThreeBeatExpansionItem,
  MicroDialogue,
  SpeakingStats,
} from '@/types/speaking-foundation';

// Re-export raw datasets
export { STAGE_MINDSET_LESSONS, MINDSET_PLEDGES } from './stage-mindset';
export { STAGE_0_PHONETIC_LESSONS } from './stage-0-phonetics';
export { STAGE_1_SURVIVAL_FRAMES } from './stage-1-survival-frames';
export { STAGE_2_LEGO_LESSONS } from './stage-2-lego-slots';
export { STAGE_3_EXPANSIONS, STAGE_3_MICRO_DIALOGUES } from './stage-3-expansions';

// Re-export types
export * from '@/types/speaking-foundation';

// ── Stage Mindset Lookup Functions ────────────────────────────────────────────
export function getMindsetLessons(): MindsetLesson[] {
  return STAGE_MINDSET_LESSONS;
}

export function getMindsetLessonById(id: string): MindsetLesson | undefined {
  return STAGE_MINDSET_LESSONS.find((lesson) => lesson.id === id || lesson.slug === id);
}

export function getMindsetPledges(): MindsetPledge[] {
  return MINDSET_PLEDGES;
}

// ── Stage 0 Lookup Functions ──────────────────────────────────────────────────
export function getStage0Lessons(): Stage0PhoneticLesson[] {
  return STAGE_0_PHONETIC_LESSONS;
}

export function getStage0LessonById(id: string): Stage0PhoneticLesson | undefined {
  return STAGE_0_PHONETIC_LESSONS.find((lesson) => lesson.id === id);
}

// ── Stage 1 Lookup Functions ──────────────────────────────────────────────────
export function getSurvivalFrames(domain?: SurvivalDomainId): SurvivalFrame[] {
  if (!domain) {
    return STAGE_1_SURVIVAL_FRAMES;
  }
  return STAGE_1_SURVIVAL_FRAMES.filter((frame) => frame.domain === domain);
}

export function getSurvivalFramesByDomain(domain?: SurvivalDomainId): SurvivalFrame[] {
  return getSurvivalFrames(domain);
}

export function getSurvivalFrameById(id: string): SurvivalFrame | undefined {
  return STAGE_1_SURVIVAL_FRAMES.find((frame) => frame.id === id);
}

// ── Stage 2 Lookup Functions ──────────────────────────────────────────────────
export function getLegoSlotLessons(): LegoSlotLesson[] {
  return STAGE_2_LEGO_LESSONS;
}

export function getLegoSlotLessonById(id: string): LegoSlotLesson | undefined {
  return STAGE_2_LEGO_LESSONS.find((lesson) => lesson.id === id);
}

// ── Stage 3 Lookup Functions ──────────────────────────────────────────────────
export function getThreeBeatExpansions(): ThreeBeatExpansionItem[] {
  return STAGE_3_EXPANSIONS;
}

export function getThreeBeatExpansionById(id: string): ThreeBeatExpansionItem | undefined {
  return STAGE_3_EXPANSIONS.find((item) => item.id === id);
}

export function getMicroDialogues(): MicroDialogue[] {
  return STAGE_3_MICRO_DIALOGUES;
}

export function getMicroDialogueById(id: string): MicroDialogue | undefined {
  return STAGE_3_MICRO_DIALOGUES.find((dialogue) => dialogue.id === id);
}

// ── Aggregated Statistics ─────────────────────────────────────────────────────
export function getSpeakingStats(): SpeakingStats {
  const totalPracticeWords = STAGE_0_PHONETIC_LESSONS.reduce(
    (acc, lesson) => acc + (lesson.practiceWords?.length || 0),
    0
  );

  const totalMinimalPairs = STAGE_0_PHONETIC_LESSONS.reduce(
    (acc, lesson) => acc + (lesson.minimalPairs?.length || 0),
    0
  );

  const domainSet = new Set(STAGE_1_SURVIVAL_FRAMES.map((frame) => frame.domain));

  return {
    totalMindsetLessons: STAGE_MINDSET_LESSONS.length,
    totalPhoneticLessons: STAGE_0_PHONETIC_LESSONS.length,
    totalSurvivalFrames: STAGE_1_SURVIVAL_FRAMES.length,
    totalDomains: domainSet.size,
    totalLegoLessons: STAGE_2_LEGO_LESSONS.length,
    totalExpansions: STAGE_3_EXPANSIONS.length,
    totalMicroDialogues: STAGE_3_MICRO_DIALOGUES.length,
    totalPracticeWords,
    totalMinimalPairs,
  };
}
