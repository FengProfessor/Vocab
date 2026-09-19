/**
 * Phase 1: Beginner (0-3.0 IELTS / CEFR A1) Speaking Curriculum Barrel
 * File: src/data/speaking/curriculum/phase-1-beginner/index.ts
 *
 * Exports all 12 structured 4-stage speaking lessons for false beginners.
 */

import type { SpeakingCurriculumLesson } from '@/types/speaking-curriculum';
import { p1L01GreetingsSelfIntro } from './p1-l01-greetings-self-intro';
import { p1L02FinalConsonantsSz } from './p1-l02-final-consonants-sz';
import { p1L03DailyRoutinesPresentSimple } from './p1-l03-daily-routines-present-simple';
import { p1L04FinalConsonantsEd } from './p1-l04-final-consonants-ed';
import { p1L05DescribingObjectsThereIsAre } from './p1-l05-describing-objects-there-is-are';
import { p1L06ConsonantClustersStSp } from './p1-l06-consonant-clusters-st-sp';
import { p1L07ThreeBeatBreathExpansion } from './p1-l07-three-beat-breath-expansion';
import { p1L08ConsonantClustersPlGr } from './p1-l08-consonant-clusters-pl-gr';
import { p1L09OrderingFoodDrink } from './p1-l09-ordering-food-drink';
import { p1L10VowelLengthIVsEe } from './p1-l10-vowel-length-i-vs-ee';
import { p1L11AskingAnsweringQuestions } from './p1-l11-asking-answering-questions';
import { p1L12FinalReviewSafeharborReflex } from './p1-l12-final-review-safeharbor-reflex';

export {
  p1L01GreetingsSelfIntro,
  p1L02FinalConsonantsSz,
  p1L03DailyRoutinesPresentSimple,
  p1L04FinalConsonantsEd,
  p1L05DescribingObjectsThereIsAre,
  p1L06ConsonantClustersStSp,
  p1L07ThreeBeatBreathExpansion,
  p1L08ConsonantClustersPlGr,
  p1L09OrderingFoodDrink,
  p1L10VowelLengthIVsEe,
  p1L11AskingAnsweringQuestions,
  p1L12FinalReviewSafeharborReflex,
};

export const phase1Lessons: SpeakingCurriculumLesson[] = [
  p1L01GreetingsSelfIntro,
  p1L02FinalConsonantsSz,
  p1L03DailyRoutinesPresentSimple,
  p1L04FinalConsonantsEd,
  p1L05DescribingObjectsThereIsAre,
  p1L06ConsonantClustersStSp,
  p1L07ThreeBeatBreathExpansion,
  p1L08ConsonantClustersPlGr,
  p1L09OrderingFoodDrink,
  p1L10VowelLengthIVsEe,
  p1L11AskingAnsweringQuestions,
  p1L12FinalReviewSafeharborReflex,
];

export default phase1Lessons;
