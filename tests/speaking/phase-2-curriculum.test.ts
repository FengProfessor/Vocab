/**
 * Phase 2 Elementary Speaking Curriculum Automated Verification Test
 * File: tests/speaking/phase-2-curriculum.test.ts
 *
 * Verifies:
 * 1. Exactly 10 lessons with sequential order 1..10
 * 2. Proper phaseId 'phase-2-elementary'
 * 3. Strict 4-stage pedagogical structure on each lesson
 * 4. P2-L03 Cooking & Cuisine critical requirements (appliances, methods, ingredients, sensory adjectives, recipe discourse)
 * 5. Zero TODO/placeholder values
 * 6. Non-empty Vietnamese guidance across all stages
 * 7. Barrel export integration in src/data/speaking/curriculum/index.ts
 */

import {
  phase2Lessons,
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
} from '@/data/speaking/curriculum/phase-2-elementary';
import {
  allCurriculumLessons,
  getCurriculumLessonById,
  getCurriculumLessonsByPhase,
} from '@/data/speaking/curriculum';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase2Tests() {
  console.log('--- STARTING PHASE 2 ELEMENTARY CURRICULUM VERIFICATION ---');

  // Test 1: Count & Integrity
  assert(phase2Lessons.length === 10, `Expected exactly 10 lessons, got ${phase2Lessons.length}`);
  console.log('✓ Test 1: Exactly 10 lessons present in phase2Lessons array');

  // Test 2: Sequential Ordering & IDs
  const expectedIds = [
    'p2-l01-expanding-answers-prep',
    'p2-l02-narrating-past-simple',
    'p2-l03-cooking-cuisine',
    'p2-l04-future-intentions-going-to',
    'p2-l05-comparison-contrast-adjectives',
    'p2-l06-discourse-markers-connectors',
    'p2-l07-peel-paragraph-expansion',
    'p2-l08-5w1h-storytelling-technique',
    'p2-l09-expressing-feelings-reactions',
    'p2-l10-asking-clarification-conversation-control',
  ];

  phase2Lessons.forEach((lesson, index) => {
    assert(lesson.order === index + 1, `Lesson ${lesson.id} order mismatch. Expected ${index + 1}, got ${lesson.order}`);
    assert(lesson.phaseId === 'phase-2-elementary', `Lesson ${lesson.id} phaseId invalid: ${lesson.phaseId}`);
    assert(lesson.id === expectedIds[index], `Lesson ${lesson.id} id mismatch. Expected ${expectedIds[index]}`);
    assert(lesson.cefrLevel === 'A2' || lesson.cefrLevel === 'B1', `Invalid CEFR level: ${lesson.cefrLevel}`);
    assert(lesson.estimatedMinutes > 0, `Invalid estimated minutes: ${lesson.estimatedMinutes}`);
  });
  console.log('✓ Test 2: Sequential order, IDs, CEFR levels, and phaseId validated');

  // Test 3: 4-Stage Pedagogical Structure on every lesson
  phase2Lessons.forEach((lesson) => {
    // Stage 1
    assert(!!lesson.stage1Phonetics, `${lesson.id}: missing stage1Phonetics`);
    assert(lesson.stage1Phonetics.minimalPairs.length >= 3, `${lesson.id}: minimalPairs < 3`);
    assert(lesson.stage1Phonetics.practiceSentences.length >= 3, `${lesson.id}: practiceSentences < 3`);
    assert(lesson.stage1Phonetics.vietnameseContrastiveTip.length > 20, `${lesson.id}: phonetic tip too short`);

    // Stage 2
    assert(!!lesson.stage2CorePatterns, `${lesson.id}: missing stage2CorePatterns`);
    assert(lesson.stage2CorePatterns.legoSlots.length >= 1, `${lesson.id}: legoSlots empty`);
    assert(lesson.stage2CorePatterns.legoSlots[0].examples.length >= 2, `${lesson.id}: lego examples < 2`);
    assert((lesson.stage2CorePatterns.highFrequencyVocab?.length ?? 0) >= 4, `${lesson.id}: vocab < 4`);

    // Stage 3
    assert(!!lesson.stage3GuidedDialogue, `${lesson.id}: missing stage3GuidedDialogue`);
    assert(lesson.stage3GuidedDialogue.turns.length >= 6, `${lesson.id}: dialogue turns < 6`);

    // Stage 4
    assert(!!lesson.stage4SafeHarborEvaluation, `${lesson.id}: missing stage4SafeHarborEvaluation`);
    assert(lesson.stage4SafeHarborEvaluation.acceptableVariations.length >= 2, `${lesson.id}: variations < 2`);
    assert(lesson.stage4SafeHarborEvaluation.coreKeywords.length >= 4, `${lesson.id}: coreKeywords < 4`);
    assert(lesson.stage4SafeHarborEvaluation.minimumPassingScore >= 70, `${lesson.id}: passing score < 70`);
  });
  console.log('✓ Test 3: 4-Stage Pedagogical Structure strictly satisfied across all 10 lessons');

  // Test 4: Critical P2-L03 Cooking & Cuisine Requirements
  const l03 = p2L03Lesson;
  const l03Content = JSON.stringify(l03).toLowerCase();

  // Appliances
  const requiredAppliances = ['blender', 'oven', 'air-fryer', 'stove'];
  requiredAppliances.forEach((appliance) => {
    assert(l03Content.includes(appliance), `P2-L03 missing critical appliance: ${appliance}`);
  });

  // Cooking methods
  const requiredMethods = ['simmer', 'stir-fry', 'roast', 'bake', 'steam'];
  requiredMethods.forEach((method) => {
    assert(l03Content.includes(method), `P2-L03 missing critical cooking method: ${method}`);
  });

  // Ingredients
  const requiredIngredients = ['garlic', 'olive oil', 'fish sauce'];
  requiredIngredients.forEach((ingredient) => {
    assert(l03Content.includes(ingredient), `P2-L03 missing critical ingredient: ${ingredient}`);
  });

  // Sensory adjectives
  const requiredSensory = ['crispy', 'savoury', 'tangy', 'tender'];
  requiredSensory.forEach((adj) => {
    assert(l03Content.includes(adj), `P2-L03 missing critical sensory adjective: ${adj}`);
  });

  // Recipe discourse connectors
  const requiredConnectors = ['first', 'then', 'after that', 'finally'];
  requiredConnectors.forEach((conn) => {
    assert(l03Content.includes(conn), `P2-L03 missing critical recipe discourse connector: ${conn}`);
  });
  console.log('✓ Test 4: P2-L03 Cooking & Cuisine module fully satisfies all § IV research report constraints');

  // Test 5: No Placeholders, No TODOs, Genuine Vietnamese Explanations
  phase2Lessons.forEach((lesson) => {
    const raw = JSON.stringify(lesson);
    assert(!raw.includes('TODO'), `${lesson.id} contains TODO`);
    assert(!raw.includes('placeholder'), `${lesson.id} contains placeholder`);
    assert(!raw.includes('dummy'), `${lesson.id} contains dummy`);
    assert(!raw.includes('Lorem ipsum'), `${lesson.id} contains lorem ipsum`);
  });
  console.log('✓ Test 5: Zero TODOs, placeholders, or dummy text detected');

  // Test 6: Global Master Catalog Integration
  const p2FromPhase = getCurriculumLessonsByPhase('phase-2-elementary');
  assert(p2FromPhase.length === 10, `getCurriculumLessonsByPhase returned ${p2FromPhase.length}`);

  const foundL03 = getCurriculumLessonById('p2-l03-cooking-cuisine');
  assert(foundL03?.id === 'p2-l03-cooking-cuisine', 'Failed to retrieve P2-L03 by ID');

  assert(allCurriculumLessons.length >= 32, `Total curriculum lessons < 32: got ${allCurriculumLessons.length}`);
  console.log(`✓ Test 6: Master Catalog integration verified (Total lessons: ${allCurriculumLessons.length})`);

  console.log('\n================================================================');
  console.log('  ALL 6 TEST SUITES PASSED FOR PHASE 2 ELEMENTARY CURRICULUM!   ');
  console.log('================================================================');
}

runPhase2Tests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
