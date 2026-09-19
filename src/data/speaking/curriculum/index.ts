/**
 * LingoPro 3-Tier Speaking Curriculum Master Catalog
 * File: src/data/speaking/curriculum/index.ts
 *
 * Unified Barrel Export & Querying Engine for all 3 Tiers:
 * - Phase 1: Beginner Foundation (12 Lessons, CEFR A1 / IELTS 0-3.0)
 * - Phase 2: Elementary Expansion (10 Lessons, CEFR A2-B1 / IELTS 3.0-5.0)
 * - Phase 3: Intermediate Mastery (10 Lessons, CEFR B1-B2 / IELTS 5.0-6.5)
 *
 * Provides:
 * 1. allCurriculumLessons aggregator (32 structured lessons)
 * 2. Tier-specific aggregators: phase1Lessons, phase2Lessons, phase3Lessons
 * 3. Fast lookup helpers: getCurriculumLessonById, getCurriculumLessonsByPhase
 */

import {
  type SpeakingCurriculumLesson,
  type SpeakingPhaseId,
  SPEAKING_PHASE_CONFIGS,
} from '@/types/speaking-curriculum';
import { phase1Lessons } from './phase-1-beginner';
import { phase2Lessons } from './phase-2-elementary';
import { phase3Lessons } from './phase-3-intermediate';

export { phase1Lessons, phase2Lessons, phase3Lessons, SPEAKING_PHASE_CONFIGS };

/**
 * All 32 curriculum lessons across Phase 1, Phase 2, and Phase 3.
 */
export const allCurriculumLessons: SpeakingCurriculumLesson[] = [
  ...phase1Lessons,
  ...phase2Lessons,
  ...phase3Lessons,
];

/**
 * Fast lookup helper: Retrieve any curriculum lesson by unique ID or slug.
 */
export function getCurriculumLessonById(
  idOrSlug: string
): SpeakingCurriculumLesson | undefined {
  return allCurriculumLessons.find(
    (lesson) => lesson.id === idOrSlug || lesson.slug === idOrSlug
  );
}

/**
 * Retrieve all lessons belonging to a specific SpeakingPhaseId.
 */
export function getCurriculumLessonsByPhase(
  phaseId: SpeakingPhaseId
): SpeakingCurriculumLesson[] {
  switch (phaseId) {
    case 'phase-1-beginner':
      return phase1Lessons;
    case 'phase-2-elementary':
      return phase2Lessons;
    case 'phase-3-intermediate':
      return phase3Lessons;
    default:
      return [];
  }
}
