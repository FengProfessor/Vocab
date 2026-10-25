/**
 * Phase 3: Intermediate (5.0-6.5 IELTS / B1-B2) Speaking Curriculum
 * Directory: src/data/speaking/curriculum/phase-3-intermediate/index.ts
 *
 * 10 Comprehensive Lessons for IELTS Speaking Part 2 & Part 3 Mastery:
 * - L01: IELTS Part 2 The 4-Quadrant Cue Card Mindmap
 * - L02: IELTS Part 3 Categorization & Dividing Answers
 * - L03: IELTS Part 3 Concession & Counter-Arguments (While X, Y)
 * - L04: Academic Stalling Devices & Thought Formulators
 * - L05: Hypothetical Scenarios & Advanced Conditionals
 * - L06: Cause & Effect Deep Analysis (Cascading Repercussions)
 * - L07: Defending Opinions & Rebutting Counter-Arguments
 * - L08: Abstract Debate (AI Ethics, Automation & Digital Governance)
 * - L09: Societal Challenges (Heritage Preservation & Urban Sustainability)
 * - L10: 2-Minute Monologue Mastery (Sustained IELTS Part 2 Delivery)
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';
import { p3L01IeltsP2CueCardMindmap } from './p3-l01-ielts-p2-cuecard-mindmap';
import { p3L02IeltsP3CategorizationDividing } from './p3-l02-ielts-p3-categorization-dividing';
import { p3L03IeltsP3ConcessionWhileAlthough } from './p3-l03-ielts-p3-concession-while-although';
import { p3L04AcademicStallingFillers } from './p3-l04-academic-stalling-fillers';
import { p3L05HypotheticalSituationsConditionals } from './p3-l05-hypothetical-situations-conditionals';
import { p3L06CauseEffectDeepAnalysis } from './p3-l06-cause-effect-deep-analysis';
import { p3L07OpinionDefenseCounterArguments } from './p3-l07-opinion-defense-counter-arguments';
import { p3L08AbstractTopicsAiTechnology } from './p3-l08-abstract-topics-ai-technology';
import { p3L09SocialIssuesEnvironmentUrban } from './p3-l09-social-issues-environment-urban';
import { p3L10TwoMinuteMonologueMastery } from './p3-l10-2-minute-monologue-mastery';

export {
  p3L01IeltsP2CueCardMindmap,
  p3L02IeltsP3CategorizationDividing,
  p3L03IeltsP3ConcessionWhileAlthough,
  p3L04AcademicStallingFillers,
  p3L05HypotheticalSituationsConditionals,
  p3L06CauseEffectDeepAnalysis,
  p3L07OpinionDefenseCounterArguments,
  p3L08AbstractTopicsAiTechnology,
  p3L09SocialIssuesEnvironmentUrban,
  p3L10TwoMinuteMonologueMastery,
};

export const phase3Lessons: SpeakingCurriculumLesson[] = [
  p3L01IeltsP2CueCardMindmap,
  p3L02IeltsP3CategorizationDividing,
  p3L03IeltsP3ConcessionWhileAlthough,
  p3L04AcademicStallingFillers,
  p3L05HypotheticalSituationsConditionals,
  p3L06CauseEffectDeepAnalysis,
  p3L07OpinionDefenseCounterArguments,
  p3L08AbstractTopicsAiTechnology,
  p3L09SocialIssuesEnvironmentUrban,
  p3L10TwoMinuteMonologueMastery,
];

/**
 * Retrieve a Phase 3 lesson by ID or slug.
 */
export function getPhase3LessonById(
  idOrSlug: string
): SpeakingCurriculumLesson | undefined {
  return phase3Lessons.find(
    (lesson) => lesson.id === idOrSlug || lesson.slug === idOrSlug
  );
}
