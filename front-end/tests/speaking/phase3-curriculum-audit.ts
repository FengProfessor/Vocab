/**
 * Phase 3 Intermediate Curriculum and Master Catalog Empirical Audit
 */

import {
  allCurriculumLessons,
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  getCurriculumLessonById,
  getCurriculumLessonsByPhase,
} from '@/data/speaking/curriculum';
import { isSpeakingCurriculumLesson } from '@/types/speaking-curriculum';

function runAudit() {
  console.log('=== PHASE 3 & MASTER CATALOG AUDIT ===');
  console.log(`Phase 1 Lessons: ${phase1Lessons.length} (Expected: 12)`);
  console.log(`Phase 2 Lessons: ${phase2Lessons.length} (Expected: 10)`);
  console.log(`Phase 3 Lessons: ${phase3Lessons.length} (Expected: 10)`);
  console.log(`Total Curriculum Lessons: ${allCurriculumLessons.length} (Expected: 32)`);

  if (phase1Lessons.length !== 12) {
    throw new Error(`Expected 12 Phase 1 lessons, got ${phase1Lessons.length}`);
  }
  if (phase2Lessons.length !== 10) {
    throw new Error(`Expected 10 Phase 2 lessons, got ${phase2Lessons.length}`);
  }
  if (phase3Lessons.length !== 10) {
    throw new Error(`Expected 10 Phase 3 lessons, got ${phase3Lessons.length}`);
  }
  if (allCurriculumLessons.length !== 32) {
    throw new Error(`Expected 32 total lessons, got ${allCurriculumLessons.length}`);
  }

  // Verify Phase 3 lessons
  const expectedPhase3Ids = [
    'p3-l01-ielts-p2-cuecard-mindmap',
    'p3-l02-ielts-p3-categorization-dividing',
    'p3-l03-ielts-p3-concession-while-although',
    'p3-l04-academic-stalling-fillers',
    'p3-l05-hypothetical-situations-conditionals',
    'p3-l06-cause-effect-deep-analysis',
    'p3-l07-opinion-defense-counter-arguments',
    'p3-l08-abstract-topics-ai-technology',
    'p3-l09-social-issues-environment-urban',
    'p3-l10-2-minute-monologue-mastery',
  ];

  for (let i = 0; i < phase3Lessons.length; i++) {
    const lesson = phase3Lessons[i];
    const expectedId = expectedPhase3Ids[i];

    if (lesson.id !== expectedId) {
      throw new Error(`Lesson order mismatch at index ${i}: expected ${expectedId}, got ${lesson.id}`);
    }
    if (lesson.order !== i + 1) {
      throw new Error(`Lesson order number mismatch for ${lesson.id}: expected ${i + 1}, got ${lesson.order}`);
    }
    if (lesson.phaseId !== 'phase-3-intermediate') {
      throw new Error(`Lesson phaseId mismatch for ${lesson.id}: ${lesson.phaseId}`);
    }
    const testLesson: unknown = lesson;
    if (!isSpeakingCurriculumLesson(testLesson)) {
      throw new Error(`Type guard isSpeakingCurriculumLesson failed`);
    }

    // Stage 1 checks
    if (!lesson.stage1Phonetics.titleVi || !lesson.stage1Phonetics.focusSound) {
      throw new Error(`Missing stage 1 fields in ${lesson.id}`);
    }
    if (lesson.stage1Phonetics.minimalPairs.length < 3) {
      throw new Error(`Expected at least 3 minimal pairs in ${lesson.id}`);
    }
    if (lesson.stage1Phonetics.practiceSentences.length < 3) {
      throw new Error(`Expected at least 3 practice sentences in ${lesson.id}`);
    }

    // Stage 2 checks
    if (!lesson.stage2CorePatterns.titleVi || !lesson.stage2CorePatterns.vietnameseGrammarRule) {
      throw new Error(`Missing stage 2 fields in ${lesson.id}`);
    }
    if (lesson.stage2CorePatterns.legoSlots.length < 1) {
      throw new Error(`Expected at least 1 lego slot item in ${lesson.id}`);
    }
    if (!lesson.stage2CorePatterns.highFrequencyVocab || lesson.stage2CorePatterns.highFrequencyVocab.length < 4) {
      throw new Error(`Expected at least 4 high frequency vocab in ${lesson.id}`);
    }

    // Stage 3 checks
    if (!lesson.stage3GuidedDialogue.titleVi || !lesson.stage3GuidedDialogue.contextVi) {
      throw new Error(`Missing stage 3 fields in ${lesson.id}`);
    }
    if (lesson.stage3GuidedDialogue.turns.length < 4) {
      throw new Error(`Expected at least 4 turns in ${lesson.id}`);
    }

    // Stage 4 checks
    if (!lesson.stage4SafeHarborEvaluation.targetSentence) {
      throw new Error(`Missing stage 4 targetSentence in ${lesson.id}`);
    }
    if (lesson.stage4SafeHarborEvaluation.minimumPassingScore < 70) {
      throw new Error(`Invalid passing score in ${lesson.id}`);
    }
    if (lesson.stage4SafeHarborEvaluation.coreKeywords.length < 5) {
      throw new Error(`Expected at least 5 core keywords in ${lesson.id}`);
    }

    console.log(`✓ Verified Lesson ${lesson.order}: ${lesson.id} — ${lesson.titleEn}`);
  }

  // Lookup helper verification
  console.log('\nTesting query helpers...');
  const lookup1 = getCurriculumLessonById('p3-l01-ielts-p2-cuecard-mindmap');
  if (!lookup1 || lookup1.titleEn !== 'IELTS Part 2: The 4-Quadrant Cue Card Mindmap') {
    throw new Error('getCurriculumLessonById failed for p3-l01-ielts-p2-cuecard-mindmap');
  }

  const lookupSlug = getCurriculumLessonById('2-minute-monologue-mastery');
  if (!lookupSlug || lookupSlug.id !== 'p3-l10-2-minute-monologue-mastery') {
    throw new Error('getCurriculumLessonById failed for slug 2-minute-monologue-mastery');
  }

  const p1Query = getCurriculumLessonsByPhase('phase-1-beginner');
  const p2Query = getCurriculumLessonsByPhase('phase-2-elementary');
  const p3Query = getCurriculumLessonsByPhase('phase-3-intermediate');

  if (p1Query.length !== 12) throw new Error('Query phase-1-beginner failed');
  if (p2Query.length !== 10) throw new Error('Query phase-2-elementary failed');
  if (p3Query.length !== 10) throw new Error('Query phase-3-intermediate failed');

  console.log('✓ All lookup helpers verified successfully!');
  console.log('\n🎉 AUDIT COMPLETE: 100% SUCCESS ACROSS ALL 32 LESSONS!');
}

runAudit();
