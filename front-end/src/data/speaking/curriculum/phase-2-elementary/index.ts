/**
 * Phase 2: Elementary (3.0-5.0 IELTS / CEFR A2-B1) Speaking Curriculum Barrel
 * File: src/data/speaking/curriculum/phase-2-elementary/index.ts
 *
 * Exports all 10 structured 4-stage speaking lessons for elementary learners:
 * - P2-L01: Expanding Answers with PREP
 * - P2-L02: Narrating Past Simple
 * - P2-L03: Cooking & Traditional Cuisine (Research Report § IV Dedicated Module)
 * - P2-L04: Future Intentions with 'Be going to' & 'Will'
 * - P2-L05: Comparison & Contrast with Adjectives
 * - P2-L06: Discourse Markers & Logical Cohesion
 * - P2-L07: PEEL Paragraph Expansion Technique
 * - P2-L08: 5W1H Storytelling Formula
 * - P2-L09: Expressing Feelings, Emotions & Reactions
 * - P2-L10: Conversation Control & Asking for Clarification
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';
import { p2L01Lesson } from './p2-l01-expanding-answers-prep';
import { p2L02Lesson } from './p2-l02-narrating-past-simple';
import { p2L03Lesson } from './p2-l03-cooking-cuisine';
import { p2L04Lesson } from './p2-l04-future-intentions-going-to';
import { p2L05Lesson } from './p2-l05-comparison-contrast-adjectives';
import { p2L06Lesson } from './p2-l06-discourse-markers-connectors';
import { p2L07Lesson } from './p2-l07-peel-paragraph-expansion';
import { p2L08Lesson } from './p2-l08-5w1h-storytelling-technique';
import { p2L09Lesson } from './p2-l09-expressing-feelings-reactions';
import { p2L10Lesson } from './p2-l10-asking-clarification-conversation-control';

export {
  p2L01Lesson,
  p2L02Lesson,
  p2L03Lesson,
  p2L04Lesson,
  p2L05Lesson,
  p2L06Lesson,
  p2L07Lesson,
  p2L08Lesson,
  p2L09Lesson,
  p2L10Lesson,
};

// Aliases matching kebab-case names for convenience
export const p2L01ExpandingAnswersPrep = p2L01Lesson;
export const p2L02NarratingPastSimple = p2L02Lesson;
export const p2L03CookingCuisine = p2L03Lesson;
export const p2L04FutureIntentionsGoingTo = p2L04Lesson;
export const p2L05ComparisonContrastAdjectives = p2L05Lesson;
export const p2L06DiscourseMarkersConnectors = p2L06Lesson;
export const p2L07PeelParagraphExpansion = p2L07Lesson;
export const p2L08Storytelling5W1H = p2L08Lesson;
export const p2L09ExpressingFeelingsReactions = p2L09Lesson;
export const p2L10AskingClarificationConversationControl = p2L10Lesson;

/**
 * Array of all 10 Phase 2 Elementary Speaking Lessons.
 */
export const phase2Lessons: SpeakingCurriculumLesson[] = [
  p2L01Lesson,
  p2L02Lesson,
  p2L03Lesson,
  p2L04Lesson,
  p2L05Lesson,
  p2L06Lesson,
  p2L07Lesson,
  p2L08Lesson,
  p2L09Lesson,
  p2L10Lesson,
];

export default phase2Lessons;
