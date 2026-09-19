/**
 * Forensic Audit Test Suite for Milestone 4 (teamwork_preview_auditor).
 * File: tests/speaking/forensic-m4-audit.test.ts
 *
 * Independent forensic verification for:
 * 1. Legacy Foundation Anti-Tampering (Zero modifications to legacy foundation code).
 * 2. Authentic Component Wiring & Export Barrel Invariants (DualSpeedAudioButton, SafeHarborRecorder).
 * 3. Genuine Interactive Client Components & Dataset Connectivity (32 lessons, 3 phases).
 * 4. Lego Slot Substitution Dynamic Engine Invariants.
 * 5. Stage 3 Keyword Highlighting & Guided Dialogue Integrity.
 * 6. Stage 4 SafeHarbor Voice Evaluator & Anti-False-Pass Verification.
 * 7. Master Speaking Hub 3-Track Navigation Integrity.
 * 8. Adversarial Stress Testing (Malicious route parameters, fuzzing).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  allCurriculumLessons,
  getCurriculumLessonById,
  getCurriculumLessonsByPhase,
  SPEAKING_PHASE_CONFIGS,
} from '../../src/data/speaking/curriculum';
import { evaluateSafeHarborSpeech, evaluateSafeHarborSpeechDetailed } from '../../src/lib/speaking/safe-harbor-matcher';
import type { SpeakingCurriculumLesson, SpeakingPhaseId } from '../../src/types/speaking-curriculum';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`[FORENSIC VIOLATION] ${message}`);
  }
  passedTests++;
  console.log(`  [PASS] ${message}`);
}

async function runForensicAudit() {
  console.log('================================================================================');
  console.log('  FORENSIC AUDITOR INDEPENDENT INTEGRITY AUDIT: MILESTONE 4');
  console.log('================================================================================\n');

  // ── CHECK 1: Legacy Foundation Code Anti-Tampering Check ────────────────────
  console.log('▶ CHECK 1: Legacy Foundation Code Anti-Tampering Check...');
  const diffOutput = execSync('git diff src/types/speaking-foundation.ts src/data/speaking/foundation/', {
    encoding: 'utf-8',
  });
  assert(diffOutput.trim() === '', 'Legacy foundation files must have 0 git diff modifications against HEAD');

  const untrackedFoundation = execSync('git status -s src/types/speaking-foundation.ts src/data/speaking/foundation/', {
    encoding: 'utf-8',
  });
  assert(untrackedFoundation.trim() === '', 'Legacy foundation directory must have 0 untracked or staged changes');

  // ── CHECK 2: Authentic Component Exports & Barrel Invariants ─────────────────
  console.log('\n▶ CHECK 2: Authentic Component Exports & Barrel Invariants...');
  const barrelModule = await import('../../src/components/speaking');
  assert(typeof barrelModule.DualSpeedAudioButton === 'function', 'DualSpeedAudioButton is authentically exported as a function component');
  assert(typeof barrelModule.SafeHarborRecorder === 'function', 'SafeHarborRecorder is authentically exported as a function component');
  assert(typeof barrelModule.StageProgressNav === 'function', 'StageProgressNav is authentically exported as a function component');
  assert(Array.isArray(barrelModule.FOUNDATION_STAGES), 'FOUNDATION_STAGES is authentically exported as an array');
  assert(barrelModule.FOUNDATION_STAGES.length === 5, 'FOUNDATION_STAGES contains exactly 5 foundation steps (stage-mindset + stages 0-3)');

  // ── CHECK 3: Authentic UI Pages & Real Dataset Connectivity ────────────────
  console.log('\n▶ CHECK 3: Authentic UI Pages & Real Dataset Connectivity...');
  const catalogPageContent = fs.readFileSync('src/app/student/speaking/curriculum/page.tsx', 'utf-8');
  assert(catalogPageContent.includes("'use client'"), 'Catalog page is an authentic Next.js Client Component');
  assert(catalogPageContent.includes('SPEAKING_PHASE_CONFIGS'), 'Catalog page imports real SPEAKING_PHASE_CONFIGS');
  assert(catalogPageContent.includes('getCurriculumLessonsByPhase'), 'Catalog page queries real getCurriculumLessonsByPhase helper');
  assert(!catalogPageContent.includes('TODO') && !catalogPageContent.includes('dummy'), 'Catalog page contains zero TODO or dummy stubs');

  const detailPageContent = fs.readFileSync('src/app/student/speaking/curriculum/[phaseId]/[lessonId]/page.tsx', 'utf-8');
  assert(detailPageContent.includes("'use client'"), 'Lesson player page is an authentic Next.js Client Component');
  assert(detailPageContent.includes('getCurriculumLessonById'), 'Lesson player page queries real getCurriculumLessonById helper');
  assert(detailPageContent.includes('DualSpeedAudioButton'), 'Lesson player page connects DualSpeedAudioButton');
  assert(detailPageContent.includes('SafeHarborRecorder'), 'Lesson player page connects SafeHarborRecorder');
  assert(detailPageContent.includes('handleSafeHarborResult'), 'Lesson player page wires SafeHarbor callback');

  // Check 32 lessons connected to 3 phases
  const phases: SpeakingPhaseId[] = ['phase-1-beginner', 'phase-2-elementary', 'phase-3-intermediate'];
  let aggregatedLessonsCount = 0;
  for (const pid of phases) {
    const lessons = getCurriculumLessonsByPhase(pid);
    assert(lessons.length > 0, `Phase ${pid} connects to real non-empty lesson list`);
    aggregatedLessonsCount += lessons.length;
  }
  assert(aggregatedLessonsCount === 32, 'Catalog connects exactly to 32 authentic curriculum lessons');

  // ── CHECK 4: Lego Slot Substitution Dynamic Engine Invariants ───────────────
  console.log('\n▶ CHECK 4: Lego Slot Substitution Dynamic Engine Invariants...');
  for (const lesson of allCurriculumLessons) {
    const legoSlots = lesson.stage2CorePatterns.legoSlots;
    assert(Array.isArray(legoSlots) && legoSlots.length > 0, `Lesson ${lesson.id} has valid legoSlots array`);

    for (const item of legoSlots) {
      assert(typeof item.template === 'string' && item.template.length > 0, `Lesson ${lesson.id} template is valid`);
      const slotKeys = Object.keys(item.slots);
      assert(slotKeys.length > 0, `Lesson ${lesson.id} lego slots has >= 1 slot keys`);

      // Test substitution with each slot's first choice
      let assembled = item.template;
      for (const [key, choices] of Object.entries(item.slots)) {
        assert(choices.length > 0, `Lesson ${lesson.id} slot [${key}] has choices`);
        assembled = assembled.replace(new RegExp(`\\{${key}\\}`, 'g'), choices[0]);
      }
      assert(!assembled.includes('{') && !assembled.includes('}'), `Lesson ${lesson.id} assembled sentence has no unreplaced slots`);
      assert(assembled.trim().length > 5, `Lesson ${lesson.id} assembled sentence is non-trivial`);
    }
  }

  // ── CHECK 5: Stage 3 Keyword Highlighting & Guided Dialogue Integrity ───────
  console.log('\n▶ CHECK 5: Stage 3 Keyword Highlighting & Guided Dialogue Integrity...');
  for (const lesson of allCurriculumLessons) {
    const turns = lesson.stage3GuidedDialogue.turns;
    assert(Array.isArray(turns) && turns.length >= 2, `Lesson ${lesson.id} has >= 2 dialogue turns`);

    for (const turn of turns) {
      assert(['A', 'B'].includes(turn.speaker) || turn.speaker.length > 0, `Lesson ${lesson.id} turn has valid speaker`);
      assert(turn.en.trim().length > 0, `Lesson ${lesson.id} turn has non-empty English text`);
      assert(turn.vi.trim().length > 0, `Lesson ${lesson.id} turn has non-empty Vietnamese translation`);
      assert(turn.coreKeywords.length > 0, `Lesson ${lesson.id} turn has >= 1 coreKeywords`);

      // Verify at least one keyword is contained in the turn text
      const atLeastOneMatch = turn.coreKeywords.some((kw) => turn.en.toLowerCase().includes(kw.toLowerCase()));
      assert(atLeastOneMatch, `Lesson ${lesson.id} turn has core keyword grounded in English utterance`);
    }
  }

  // ── CHECK 6: Stage 4 SafeHarbor Voice Evaluator & Anti-False-Pass ────────────
  console.log('\n▶ CHECK 6: Stage 4 SafeHarbor Voice Evaluator & Anti-False-Pass...');
  for (const lesson of allCurriculumLessons) {
    const evalConfig = lesson.stage4SafeHarborEvaluation;
    const target = evalConfig.targetSentence;
    const coreKeywords = evalConfig.coreKeywords;
    const minScore = evalConfig.minimumPassingScore;

    // 1. Perfect recitation must pass with score >= minScore
    const perfectRes = evaluateSafeHarborSpeech(target, target, coreKeywords);
    assert(perfectRes.passed === true, `Lesson ${lesson.id}: perfect speech passes SafeHarbor`);
    assert(perfectRes.score >= minScore, `Lesson ${lesson.id}: perfect score (${perfectRes.score}) >= minimum (${minScore})`);

    // 2. Anti-False-Pass: Completely unrelated foreign gibberish must NOT pass
    const gibberish = 'xyz qwerty blabla 123';
    const failRes = evaluateSafeHarborSpeech(gibberish, target, coreKeywords);
    assert(failRes.passed === false, `Lesson ${lesson.id}: gibberish does NOT pass SafeHarbor`);
    assert(failRes.score < minScore, `Lesson ${lesson.id}: gibberish score (${failRes.score}) < minimum (${minScore})`);

    // 3. Anti-False-Pass: Empty spoken string must NOT pass
    const emptyRes = evaluateSafeHarborSpeech('', target, coreKeywords);
    assert(emptyRes.passed === false, `Lesson ${lesson.id}: empty speech does NOT pass SafeHarbor`);
    assert(emptyRes.score === 0, `Lesson ${lesson.id}: empty speech score is 0`);
  }

  // ── CHECK 7: Master Speaking Hub 3-Track Navigation Integrity ───────────────
  console.log('\n▶ CHECK 7: Master Speaking Hub 3-Track Navigation Integrity...');
  const hubContent = fs.readFileSync('src/app/student/speaking/page.tsx', 'utf-8');
  assert(hubContent.includes('/student/speaking/curriculum'), 'Master Hub routes to Track 1 (/student/speaking/curriculum)');
  assert(hubContent.includes('/student/speaking/foundation'), 'Master Hub routes to Track 2 (/student/speaking/foundation)');
  assert(hubContent.includes('Track 3: AI Speaking Tutor'), 'Master Hub showcases Track 3 (AI Speaking Tutor)');
  assert(hubContent.includes('AI_SPEAKING_TOPICS'), 'Master Hub preserves AI Speaking Topics');

  // ── CHECK 8: Adversarial Edge Cases & Fuzzing ───────────────────────────────
  console.log('\n▶ CHECK 8: Adversarial Edge Cases & Fuzzing...');
  // 1. Unknown lesson lookup returns undefined safely
  assert(getCurriculumLessonById('malicious" OR 1=1 --') === undefined, 'Lookup rejects SQL injection attempt safely');
  assert(getCurriculumLessonById('<script>alert("xss")</script>') === undefined, 'Lookup rejects XSS string safely');
  assert(getCurriculumLessonById('') === undefined, 'Lookup rejects empty string safely');

  // 2. Unknown phase returns empty array
  assert(getCurriculumLessonsByPhase('phase-999-invalid' as any).length === 0, 'Invalid phase returns []');

  // 3. Detailed evaluation token breakdown sanity
  const sampleLesson = allCurriculumLessons[0];
  const detailed = evaluateSafeHarborSpeechDetailed(
    sampleLesson.stage4SafeHarborEvaluation.targetSentence,
    sampleLesson.stage4SafeHarborEvaluation.targetSentence,
    sampleLesson.stage4SafeHarborEvaluation.coreKeywords
  );
  assert(detailed.tokenFeedback.length > 0, 'Detailed evaluation produces structured token feedback');
  assert(detailed.tokenFeedback.every((t) => ['matched', 'fuzzy', 'missed', 'function_word'].includes(t.status)), 'Token statuses strictly conform to [matched, fuzzy, missed, function_word]');

  console.log('\n================================================================================');
  console.log(`  FORENSIC AUDIT RESULT: ${passedTests}/${totalTests} CHECKS PASSED (100%)`);
  console.log('================================================================================\n');
}

runForensicAudit()
  .then(() => {
    console.log('✅ FORENSIC INTEGRITY VERDICT: CLEAN');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ FORENSIC INTEGRITY VERDICT: INTEGRITY VIOLATION', err);
    process.exit(1);
  });
