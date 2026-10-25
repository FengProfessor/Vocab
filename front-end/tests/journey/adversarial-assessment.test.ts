/**
 * Adversarial Assessment & Unlocking Test Suite
 * Challenger 1 (Empirical Verifier: Assessment & Unlocking)
 * Milestone 5 — Learning Roadmap / Journey Modernization
 *
 * Stress-tests:
 * 1. Linear Unlocking: Out-of-order step completion, checkpoint pass threshold (79% vs 80%), unit lock enforcement
 * 2. Mini-Quiz Gatekeeping: Score < 75% prevents completion; score >= 75% allows completion
 * 3. Diagnostic Breakdown: Multi-skill error distribution (Vocab, Grammar, Pronunciation, Reading),
 *    weak concept extraction accuracy, 1-click deep-link formatting
 * 4. Level Exit Exam: 25-30 question generation, >= 80% pass threshold, certificate & badge awards,
 *    level advancement gating
 */

import { TestRunner, expect } from './test-harness';
import {
  orderedStepIds,
  resolveStepAny,
  getRoadmapLevels,
  levelOrder,
  calculateUnitCompletion,
  getUnitStatus,
  getEarnedUnitBadges,
  calculateUnitDuration,
  calculateTotalDuration,
  getExitStandard,
  type RoadmapTrack,
  type RoadmapLevelId,
} from '@/lib/roadmap';
import {
  evaluateDiagnostic,
  judgeDiagnosticAnswer,
  getReviewUrlForStep,
  getDiagnosticStorageKey,
  type DiagnosticQuestion,
  type AssessmentSkill,
} from '@/lib/roadmap-assessment';
import {
  generateExitExamQuestions,
  GRADUATION_BADGES,
} from '@/components/journey/assessment/LevelExitExamModal';

// ──────────────────────────────────────────────────────────────────────────
// Linear Step Progression Validator (Matches server /api/roadmap/progress logic)
// ──────────────────────────────────────────────────────────────────────────
function validateLinearStepProgression(
  track: RoadmapTrack,
  enrollLevelId: RoadmapLevelId,
  stepId: string,
  completedStepIds: Set<string>,
  stepScore: number | null = null,
): { allowed: boolean; status: number; error?: string; missingSteps?: string[] } {
  const resolved = resolveStepAny(stepId);
  if (!resolved) return { allowed: false, status: 400, error: 'Step không tồn tại' };
  const { entry } = resolved;
  const ORDER = levelOrder(track);

  // Checkpoint / Exam passing score requirement
  const CHECKPOINT_PASS_PCT = 80;
  if (
    (entry.step.type === 'checkpoint' || entry.step.type === 'exam') &&
    (stepScore === null || stepScore < CHECKPOINT_PASS_PCT)
  ) {
    return {
      allowed: false,
      status: 422,
      error: `Checkpoint cần đạt ≥${CHECKPOINT_PASS_PCT}% (hiện tại ${stepScore ?? 0}%). Ôn lại chặng rồi thử lại nhé!`,
    };
  }

  // Validate sequential completion within scope of start level
  const startIdx = ORDER.indexOf(enrollLevelId);
  const stepLevelIdx = ORDER.indexOf(entry.level.id);
  if (stepLevelIdx >= startIdx) {
    const levels = getRoadmapLevels(track);
    const levelOfStep = new Map<string, number>();
    for (const level of levels) {
      const idx = ORDER.indexOf(level.id);
      for (const unit of level.units) {
        for (const step of unit.steps) {
          levelOfStep.set(step.id, idx);
        }
      }
    }
    const scoped = orderedStepIds(track).filter((id) => (levelOfStep.get(id) ?? 0) >= startIdx);
    const position = scoped.indexOf(stepId);
    const priorIds = scoped.slice(0, position);
    if (priorIds.length > 0) {
      const missing = priorIds.filter((id) => !completedStepIds.has(id));
      if (missing.length > 0) {
        return {
          allowed: false,
          status: 400,
          error: 'Chặng này chưa mở — hoàn thành các bước trước đã nhé!',
          missingSteps: missing.slice(0, 5),
        };
      }
    }
  }

  return { allowed: true, status: 200 };
}

// ──────────────────────────────────────────────────────────────────────────
// Test Suite Execution
// ──────────────────────────────────────────────────────────────────────────
export async function runAdversarialAssessmentTests(runner: TestRunner) {
  runner.describe('Adversarial Assessment & Unlocking Test Suite', () => {});

  // ========================================================================
  // SECTION 1: LINEAR UNLOCKING & BOUNDARY CONDITIONS
  // ========================================================================

  await runner.it('ADV-1.1: Out-of-order step completion is strictly rejected with HTTP 400 and missing steps', () => {
    const cefrSteps = orderedStepIds('cefr');
    expect(cefrSteps.length).toBeGreaterThan(10);

    const step0 = cefrSteps[0]; // e.g. sv-starter-a0-greetings
    const step1 = cefrSteps[1]; // e.g. sv-starter-a0-people
    const step2 = cefrSteps[2]; // e.g. sg-personal-pronouns
    const stepCheckpoint = cefrSteps[4]; // Unit 1 Checkpoint sc-a0-1

    const completed = new Set<string>();

    // 1. Attempt step 1 before step 0
    const res1 = validateLinearStepProgression('cefr', 'A0', step1, completed, 100);
    expect(res1.allowed).toBe(false);
    expect(res1.status).toBe(400);
    expect(res1.error).toContain('Chặng này chưa mở');
    expect(res1.missingSteps).toContain(step0);

    // 2. Attempt step 2 before step 0 & 1
    const res2 = validateLinearStepProgression('cefr', 'A0', step2, completed, 100);
    expect(res2.allowed).toBe(false);
    expect(res2.status).toBe(400);
    expect(res2.missingSteps?.length).toBeGreaterThanOrEqual(2);

    // 3. Attempt Checkpoint directly with 0 steps completed
    const resCp = validateLinearStepProgression('cefr', 'A0', stepCheckpoint, completed, 100);
    expect(resCp.allowed).toBe(false);
    expect(resCp.status).toBe(400);
    expect(resCp.missingSteps).toContain(step0);
  });

  await runner.it('ADV-1.2: Checkpoint pass threshold strictly discriminates 79% (REJECTED) vs 80% (PASSED)', () => {
    const cefrSteps = orderedStepIds('cefr');
    const step0 = cefrSteps[0];
    const step1 = cefrSteps[1];
    const step2 = cefrSteps[2];
    const step3 = cefrSteps[3];
    const cpStep = cefrSteps[4]; // Checkpoint

    // Simulate completion of all 4 prior steps in unit
    const completed = new Set<string>([step0, step1, step2, step3]);

    // Test 1: Score 79% -> strictly REJECTED (HTTP 422)
    const res79 = validateLinearStepProgression('cefr', 'A0', cpStep, completed, 79);
    expect(res79.allowed).toBe(false);
    expect(res79.status).toBe(422);
    expect(res79.error).toContain('Checkpoint cần đạt ≥80%');
    expect(res79.error).toContain('79%');

    // Test 2: Score 0% -> strictly REJECTED (HTTP 422)
    const res0 = validateLinearStepProgression('cefr', 'A0', cpStep, completed, 0);
    expect(res0.allowed).toBe(false);
    expect(res0.status).toBe(422);

    // Test 3: Score null / undefined -> strictly REJECTED (HTTP 422)
    const resNull = validateLinearStepProgression('cefr', 'A0', cpStep, completed, null);
    expect(resNull.allowed).toBe(false);
    expect(resNull.status).toBe(422);

    // Test 4: Score 80% -> strictly PASSED (HTTP 200)
    const res80 = validateLinearStepProgression('cefr', 'A0', cpStep, completed, 80);
    expect(res80.allowed).toBe(true);
    expect(res80.status).toBe(200);

    // Test 5: Score 100% -> strictly PASSED (HTTP 200)
    const res100 = validateLinearStepProgression('cefr', 'A0', cpStep, completed, 100);
    expect(res100.allowed).toBe(true);
    expect(res100.status).toBe(200);
  });

  await runner.it('ADV-1.3: Unit lock enforcement: Unit 2 remains strictly locked until Unit 1 checkpoint is passed >= 80%', () => {
    const levels = getRoadmapLevels('cefr');
    const a0 = levels.find((l) => l.id === 'A0')!;
    const unit1 = a0.units[0];
    const unit2 = a0.units[1];
    expect(unit1).toBeDefined();
    expect(unit2).toBeDefined();

    const unit1StepIds = unit1.steps.map((s) => s.id);
    const unit1CpId = unit1StepIds[unit1StepIds.length - 1];
    const unit2Step0 = unit2.steps[0].id;

    const completed = new Set<string>();

    // 1. Initial State: Unit 1 has current step -> in-progress; Unit 2 -> locked
    expect(getUnitStatus(unit1, completed, unit1StepIds[0])).toBe('in-progress');
    expect(getUnitStatus(unit2, completed, unit1StepIds[0])).toBe('locked');
    expect(calculateUnitCompletion(unit1, completed)).toBe(0);

    // Attempting Unit 2 Step 0 is blocked
    const resBlock = validateLinearStepProgression('cefr', 'A0', unit2Step0, completed, 100);
    expect(resBlock.allowed).toBe(false);

    // 2. Complete all lesson steps of Unit 1 EXCEPT checkpoint
    for (let i = 0; i < unit1StepIds.length - 1; i++) {
      completed.add(unit1StepIds[i]);
    }
    // Unit 1 is still in-progress (e.g. 80%); Unit 2 is STILL locked
    expect(getUnitStatus(unit1, completed, unit1CpId)).toBe('in-progress');
    expect(getUnitStatus(unit2, completed, unit1CpId)).toBe('locked');
    expect(calculateUnitCompletion(unit1, completed)).toBeLessThan(100);

    // Attempting Unit 2 Step 0 is STILL blocked because Checkpoint 1 is missing
    const resStillBlock = validateLinearStepProgression('cefr', 'A0', unit2Step0, completed, 100);
    expect(resStillBlock.allowed).toBe(false);
    expect(resStillBlock.missingSteps).toContain(unit1CpId);

    // 3. Pass Checkpoint 1 with 80% -> Unit 1 completes, Unit 2 unlocks
    const resCpPass = validateLinearStepProgression('cefr', 'A0', unit1CpId, completed, 80);
    expect(resCpPass.allowed).toBe(true);
    completed.add(unit1CpId);

    // Unit 1 is now COMPLETED (100%); Unit 2 is now current/in-progress
    expect(getUnitStatus(unit1, completed, unit2Step0)).toBe('completed');
    expect(calculateUnitCompletion(unit1, completed)).toBe(100);
    expect(getUnitStatus(unit2, completed, unit2Step0)).toBe('in-progress');

    // Unit 2 Step 0 can now be completed without linear errors
    const resUnit2Open = validateLinearStepProgression('cefr', 'A0', unit2Step0, completed, 100);
    expect(resUnit2Open.allowed).toBe(true);
    expect(resUnit2Open.status).toBe(200);

    // Badge verification: Unit 1 earned, Unit 2 not yet
    const earnedBadges = getEarnedUnitBadges([unit1, unit2], completed);
    expect(earnedBadges.some((b) => b.unitId === unit1.id)).toBe(true);
    expect(earnedBadges.some((b) => b.unitId === unit2.id)).toBe(false);
  });

  await runner.it('ADV-1.4: Linear bypass protection across dual tracks (THPT track linear gating and exam score threshold)', () => {
    const thptSteps = orderedStepIds('thpt');
    const thptStep0 = thptSteps[0];
    const thptStep1 = thptSteps[1];
    const thptStep2 = thptSteps[2];

    const completed = new Set<string>();

    // 1. Out of order attempt on THPT track: Attempting step 1 before step 0
    const resThpt = validateLinearStepProgression('thpt', 'lop-10', thptStep1, completed, 100);
    expect(resThpt.allowed).toBe(false);
    expect(resThpt.status).toBe(400);
    expect(resThpt.missingSteps).toContain(thptStep0);

    // 2. In-order progression: Step 0 passes
    const resStep0 = validateLinearStepProgression('thpt', 'lop-10', thptStep0, completed, 100);
    expect(resStep0.allowed).toBe(true);
    expect(resStep0.status).toBe(200);
    completed.add(thptStep0);

    // 3. Now Step 1 passes
    const resStep1 = validateLinearStepProgression('thpt', 'lop-10', thptStep1, completed, 100);
    expect(resStep1.allowed).toBe(true);
    expect(resStep1.status).toBe(200);
    completed.add(thptStep1);

    // 4. Now Step 2 passes
    const resStep2 = validateLinearStepProgression('thpt', 'lop-10', thptStep2, completed, 100);
    expect(resStep2.allowed).toBe(true);
    expect(resStep2.status).toBe(200);

    // 5. THPT capstone exam step score threshold gating (sx-u-thpt10-10-exam-10-1)
    const examStep = 'sx-u-thpt10-10-exam-10-1';
    const pos = thptSteps.indexOf(examStep);
    expect(pos).toBeGreaterThan(0);
    const priorToExam = new Set(thptSteps.slice(0, pos));

    // Score 79% on exam step strictly rejected with HTTP 422
    const resExam79 = validateLinearStepProgression('thpt', 'lop-10', examStep, priorToExam, 79);
    expect(resExam79.allowed).toBe(false);
    expect(resExam79.status).toBe(422);
    expect(resExam79.error).toContain('Checkpoint cần đạt ≥80%');

    // Score 80% on exam step passes with HTTP 200
    const resExam80 = validateLinearStepProgression('thpt', 'lop-10', examStep, priorToExam, 80);
    expect(resExam80.allowed).toBe(true);
    expect(resExam80.status).toBe(200);
  });

  await runner.it('ADV-1.5: Placement exemption: prior levels allow free review without linear blocking', () => {
    const cefrSteps = orderedStepIds('cefr');
    const a0Step5 = cefrSteps[5]; // Step inside A0 Unit 2

    // Learner enrolled directly at A1 (placement passed A0)
    // When reviewing A0 step 5 with 0 steps completed in A0:
    const resFreeReview = validateLinearStepProgression('cefr', 'A1', a0Step5, new Set(), 100);
    // Allowed because step level A0 < start level A1
    expect(resFreeReview.allowed).toBe(true);
    expect(resFreeReview.status).toBe(200);
  });

  // ========================================================================
  // SECTION 2: MINI-QUIZ GATEKEEPING
  // ========================================================================

  await runner.it('ADV-2.1: Mini-Quiz strictly prevents node completion when score < 75%', () => {
    const questions: DiagnosticQuestion[] = [
      { id: 'mq-1', skill: 'vocab', conceptRef: 'c1', conceptName: 'C1', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P1', answer: 'apple' },
      { id: 'mq-2', skill: 'vocab', conceptRef: 'c2', conceptName: 'C2', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P2', answer: 'banana' },
      { id: 'mq-3', skill: 'vocab', conceptRef: 'c3', conceptName: 'C3', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P3', answer: 'cherry' },
      { id: 'mq-4', skill: 'vocab', conceptRef: 'c4', conceptName: 'C4', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P4', answer: 'date' },
    ];

    // Scenario A: 0/4 = 0%
    const report0 = evaluateDiagnostic({
      questions,
      answers: { 'mq-1': 'wrong', 'mq-2': 'wrong', 'mq-3': 'wrong', 'mq-4': 'wrong' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report0.scorePct).toBe(0);
    expect(report0.passed).toBe(false);

    // Scenario B: 1/4 = 25%
    const report25 = evaluateDiagnostic({
      questions,
      answers: { 'mq-1': 'apple', 'mq-2': 'wrong', 'mq-3': 'wrong', 'mq-4': 'wrong' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report25.scorePct).toBe(25);
    expect(report25.passed).toBe(false);

    // Scenario C: 2/4 = 50%
    const report50 = evaluateDiagnostic({
      questions,
      answers: { 'mq-1': 'apple', 'mq-2': 'banana', 'mq-3': 'wrong', 'mq-4': 'wrong' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report50.scorePct).toBe(50);
    expect(report50.passed).toBe(false);

    // Scenario D: 2/3 = 67% (3-question quiz boundary)
    const report67 = evaluateDiagnostic({
      questions: questions.slice(0, 3),
      answers: { 'mq-1': 'apple', 'mq-2': 'banana', 'mq-3': 'wrong' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report67.scorePct).toBe(67);
    expect(report67.passed).toBe(false);

    // Verify Gatekeeping action simulation: If passed is false, step must NOT complete
    let stepCompleted = false;
    let xpAwarded = 0;
    const onPassedHandler = () => {
      stepCompleted = true;
      xpAwarded += 15;
    };

    if (report50.passed) {
      onPassedHandler();
    }
    expect(stepCompleted).toBe(false);
    expect(xpAwarded).toBe(0);
  });

  await runner.it('ADV-2.2: Mini-Quiz allows node completion and XP award when score >= 75%', () => {
    const questions: DiagnosticQuestion[] = [
      { id: 'mq-1', skill: 'vocab', conceptRef: 'c1', conceptName: 'C1', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P1', answer: 'apple' },
      { id: 'mq-2', skill: 'vocab', conceptRef: 'c2', conceptName: 'C2', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P2', answer: 'banana' },
      { id: 'mq-3', skill: 'vocab', conceptRef: 'c3', conceptName: 'C3', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P3', answer: 'cherry' },
      { id: 'mq-4', skill: 'vocab', conceptRef: 'c4', conceptName: 'C4', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P4', answer: 'date' },
    ];

    // Scenario A: Exactly 3/4 = 75% (Critical pass threshold boundary)
    const report75 = evaluateDiagnostic({
      questions,
      answers: { 'mq-1': 'apple', 'mq-2': 'banana', 'mq-3': 'cherry', 'mq-4': 'wrong' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report75.scorePct).toBe(75);
    expect(report75.passed).toBe(true);

    // Scenario B: 4/4 = 100%
    const report100 = evaluateDiagnostic({
      questions,
      answers: { 'mq-1': 'apple', 'mq-2': 'banana', 'mq-3': 'cherry', 'mq-4': 'date' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report100.scorePct).toBe(100);
    expect(report100.passed).toBe(true);

    // Verify Gatekeeping action simulation: If passed is true, step completes
    let stepCompleted = false;
    let xpAwarded = 0;
    const onPassedHandler = () => {
      stepCompleted = true;
      xpAwarded += 15;
    };

    if (report75.passed) {
      onPassedHandler();
    }
    expect(stepCompleted).toBe(true);
    expect(xpAwarded).toBe(15);
  });

  await runner.it('ADV-2.3: Mini-Quiz fuzzy typing and case-insensitive normalization adversarial checks', () => {
    // 1. Exact case match & whitespace trimming
    expect(judgeDiagnosticAnswer('  Apple  ', 'apple', false)).toBe(true);
    expect(judgeDiagnosticAnswer('apple', 'APPLE', false)).toBe(true);

    // 2. Empty string or only spaces rejected
    expect(judgeDiagnosticAnswer('', 'apple', false)).toBe(false);
    expect(judgeDiagnosticAnswer('   ', 'apple', false)).toBe(false);

    // 3. Typing question: fuzzy levenshtein distance <= 2 tolerance
    expect(judgeDiagnosticAnswer('studing', 'studying', true)).toBe(true); // 1 deletion -> close
    expect(judgeDiagnosticAnswer('styding', 'studying', true)).toBe(true); // 1 substitution -> close

    // 4. Catastrophic spelling error rejected
    expect(judgeDiagnosticAnswer('xyz', 'studying', true)).toBe(false);
    expect(judgeDiagnosticAnswer('unrelated', 'studying', true)).toBe(false);
  });

  // ========================================================================
  // SECTION 3: DIAGNOSTIC BREAKDOWN & DEEP-LINK ACCURACY
  // ========================================================================

  await runner.it('ADV-3.1: Multi-skill error distribution evaluates Vocab, Grammar, Pronunciation, Reading with strict status thresholds', () => {
    const cpQuestions: DiagnosticQuestion[] = [
      // Vocab: 3 questions, 3 correct = 100% (>=85% -> 'mastered')
      { id: 'v1', skill: 'vocab', conceptRef: 'v-1', conceptName: 'Vocab 1', sourceStepId: 'sv1', sourceStepTitle: 'V1', sourceUrl: '/v1', prompt: 'P', answer: 'A' },
      { id: 'v2', skill: 'vocab', conceptRef: 'v-2', conceptName: 'Vocab 2', sourceStepId: 'sv1', sourceStepTitle: 'V1', sourceUrl: '/v1', prompt: 'P', answer: 'B' },
      { id: 'v3', skill: 'vocab', conceptRef: 'v-3', conceptName: 'Vocab 3', sourceStepId: 'sv1', sourceStepTitle: 'V1', sourceUrl: '/v1', prompt: 'P', answer: 'C' },

      // Grammar: 4 questions, 3 correct = 75% (70-84% -> 'adequate')
      { id: 'g1', skill: 'grammar', conceptRef: 'g-1', conceptName: 'Grammar 1', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'A' },
      { id: 'g2', skill: 'grammar', conceptRef: 'g-2', conceptName: 'Grammar 2', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'B' },
      { id: 'g3', skill: 'grammar', conceptRef: 'g-3', conceptName: 'Grammar 3', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'C' },
      { id: 'g4', skill: 'grammar', conceptRef: 'g-4', conceptName: 'Grammar 4', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'D' },

      // Pronunciation: 3 questions, 1 correct = 33% (<70% -> 'weak')
      { id: 'p1', skill: 'pronunciation', conceptRef: 'p-1', conceptName: 'Pron 1', sourceStepId: 'sp1', sourceStepTitle: 'P1', sourceUrl: '/p1', prompt: 'P', answer: 'A' },
      { id: 'p2', skill: 'pronunciation', conceptRef: 'p-2', conceptName: 'Pron 2', sourceStepId: 'sp1', sourceStepTitle: 'P1', sourceUrl: '/p1', prompt: 'P', answer: 'B' },
      { id: 'p3', skill: 'pronunciation', conceptRef: 'p-3', conceptName: 'Pron 3', sourceStepId: 'sp1', sourceStepTitle: 'P1', sourceUrl: '/p1', prompt: 'P', answer: 'C' },

      // Reading: 2 questions, 0 correct = 0% (<70% -> 'weak')
      { id: 'r1', skill: 'reading', conceptRef: 'r-1', conceptName: 'Reading 1', sourceStepId: 'sr1', sourceStepTitle: 'R1', sourceUrl: '/r1', prompt: 'P', answer: 'A' },
      { id: 'r2', skill: 'reading', conceptRef: 'r-2', conceptName: 'Reading 2', sourceStepId: 'sr1', sourceStepTitle: 'R1', sourceUrl: '/r1', prompt: 'P', answer: 'B' },
    ];

    const answers = {
      v1: 'A', v2: 'B', v3: 'C',       // 3/3
      g1: 'A', g2: 'B', g3: 'C', g4: 'WRONG', // 3/4
      p1: 'A', p2: 'WRONG', p3: 'WRONG',      // 1/3
      r1: 'WRONG', r2: 'WRONG',               // 0/2
    };

    const report = evaluateDiagnostic({
      questions: cpQuestions,
      answers,
      metadata: { stepId: 'sc1', targetId: 'u1', type: 'checkpoint', passThresholdPct: 80 },
    });

    // 7 correct out of 12 questions = 58%
    expect(report.totalQuestions).toBe(12);
    expect(report.correctQuestions).toBe(7);
    expect(report.scorePct).toBe(58);
    expect(report.passed).toBe(false);

    // Vocab status
    expect(report.skills.vocab?.pct).toBe(100);
    expect(report.skills.vocab?.status).toBe('mastered');

    // Grammar status
    expect(report.skills.grammar?.pct).toBe(75);
    expect(report.skills.grammar?.status).toBe('adequate');

    // Pronunciation status
    expect(report.skills.pronunciation?.pct).toBe(33);
    expect(report.skills.pronunciation?.status).toBe('weak');

    // Reading status
    expect(report.skills.reading?.pct).toBe(0);
    expect(report.skills.reading?.status).toBe('weak');

    // Vietnamese diagnostic summary lists weak skills
    expect(report.summaryVi).toContain('Phát âm');
    expect(report.summaryVi).toContain('Đọc hiểu');
    expect(report.summaryVi).not.toContain('Từ vựng');
  });

  await runner.it('ADV-3.2: Weak concept extraction captures precise conceptRef, student input vs key, and explanation', () => {
    const questions: DiagnosticQuestion[] = [
      {
        id: 'q-tense',
        skill: 'grammar',
        conceptRef: 'c-past-perfect',
        conceptName: 'Quá khứ hoàn thành',
        sourceStepId: 'sg-past-perfect',
        sourceStepTitle: 'Past Perfect Lesson',
        sourceUrl: '/grammar/learn?topic=past-perfect',
        prompt: 'They _____ before I arrived.',
        answer: 'had left',
        explanation: 'Diễn tả hành động xảy ra trước một hành động khác trong quá khứ.',
      },
      {
        id: 'q-vocab',
        skill: 'vocab',
        conceptRef: 'c-hesitate',
        conceptName: 'Từ vựng: Hesitate',
        sourceStepId: 'sv-emotions',
        sourceStepTitle: 'Emotions Pack',
        sourceUrl: '/flashcard?pack=emotions',
        prompt: 'Từ nào có nghĩa là ngập ngừng, do dự?',
        answer: 'hesitate',
        explanation: 'Hesitate = do dự, phân vân.',
      },
    ];

    const report = evaluateDiagnostic({
      questions,
      answers: {
        'q-tense': 'left', // wrong answer
        'q-vocab': 'hesitate', // correct answer
      },
      metadata: { stepId: 'sc1' },
    });

    // Exactly 1 weak concept extracted
    expect(report.weakConcepts.length).toBe(1);
    const wc = report.weakConcepts[0];
    expect(wc.conceptRef).toBe('c-past-perfect');
    expect(wc.conceptName).toBe('Quá khứ hoàn thành');
    expect(wc.skill).toBe('grammar');
    expect(wc.userChoice).toBe('left');
    expect(wc.correctAnswer).toBe('had left');
    expect(wc.explanation).toContain('trước một hành động khác');
    expect(wc.sourceStepId).toBe('sg-past-perfect');
    expect(wc.sourceUrl).toBe('/grammar/learn?topic=past-perfect');

    // Unanswered items capture '(Chưa trả lời)' fallback
    const reportEmpty = evaluateDiagnostic({
      questions,
      answers: {},
      metadata: { stepId: 'sc1' },
    });
    expect(reportEmpty.weakConcepts[0].userChoice).toBe('(Chưa trả lời)');
  });

  await runner.it('ADV-3.3: Remedial recommendations aggregate multiple errors by step and rank descending by errorCount', () => {
    const questions: DiagnosticQuestion[] = [
      // 3 errors for Step A (Grammar)
      { id: 'q1', skill: 'grammar', conceptRef: 'g1', conceptName: 'G1', sourceStepId: 'step-A', sourceStepTitle: 'Step A', sourceUrl: '/step-A', prompt: 'P1', answer: 'Ans1' },
      { id: 'q2', skill: 'grammar', conceptRef: 'g2', conceptName: 'G2', sourceStepId: 'step-A', sourceStepTitle: 'Step A', sourceUrl: '/step-A', prompt: 'P2', answer: 'Ans2' },
      { id: 'q3', skill: 'grammar', conceptRef: 'g3', conceptName: 'G3', sourceStepId: 'step-A', sourceStepTitle: 'Step A', sourceUrl: '/step-A', prompt: 'P3', answer: 'Ans3' },

      // 1 error for Step B (Vocab)
      { id: 'q4', skill: 'vocab', conceptRef: 'v1', conceptName: 'V1', sourceStepId: 'step-B', sourceStepTitle: 'Step B', sourceUrl: '/step-B', prompt: 'P4', answer: 'Ans4' },

      // 2 errors for Step C (Pronunciation)
      { id: 'q5', skill: 'pronunciation', conceptRef: 'p1', conceptName: 'P1', sourceStepId: 'step-C', sourceStepTitle: 'Step C', sourceUrl: '/step-C', prompt: 'P5', answer: 'Ans5' },
      { id: 'q6', skill: 'pronunciation', conceptRef: 'p2', conceptName: 'P2', sourceStepId: 'step-C', sourceStepTitle: 'Step C', sourceUrl: '/step-C', prompt: 'P6', answer: 'Ans6' },
    ];

    // All wrong
    const report = evaluateDiagnostic({
      questions,
      answers: {},
      metadata: { stepId: 'sc-test' },
    });

    // Aggregated into exactly 3 recommendations
    expect(report.recommendations.length).toBe(3);

    // Must be sorted strictly descending by errorCount: Step A (3) -> Step C (2) -> Step B (1)
    expect(report.recommendations[0].stepId).toBe('step-A');
    expect(report.recommendations[0].errorCount).toBe(3);

    expect(report.recommendations[1].stepId).toBe('step-C');
    expect(report.recommendations[1].errorCount).toBe(2);

    expect(report.recommendations[2].stepId).toBe('step-B');
    expect(report.recommendations[2].errorCount).toBe(1);
  });

  await runner.it('ADV-3.4: 1-Click deep-link formatting correctly routes to flashcard, grammar, pronunciation, and THPT modules', () => {
    // 1. Vocab starter pack
    const starterUrl = getReviewUrlForStep('sv-starter-1', 'vocab', 'starter-greetings', 'cefr');
    expect(starterUrl).toBe(
      '/flashcard?class=roadmap&mode=learn&starter=starter-greetings&roadmapStep=sv-starter-1',
    );

    // 2. Vocab regular pack
    const packUrl = getReviewUrlForStep('sv-pack-1', 'vocab', 'pack-family-a1', 'cefr');
    expect(packUrl).toBe(
      '/flashcard?class=roadmap&mode=learn&pack=pack-family-a1&roadmapStep=sv-pack-1',
    );

    // 3. Grammar lesson
    const grammarUrl = getReviewUrlForStep('sg-grammar-1', 'grammar', 'present-continuous', 'cefr');
    expect(grammarUrl).toBe(
      '/grammar/learn?topic=present-continuous&roadmapStep=sg-grammar-1',
    );

    // 4. Pronunciation lesson
    const pronUrl = getReviewUrlForStep('sp-pron-1', 'pronunciation', 'p-b', 'cefr');
    expect(pronUrl).toBe(
      '/pronunciation/p-b?roadmapStep=sp-pron-1',
    );

    // 5. THPT reading and cloze modules
    const readingUrl = getReviewUrlForStep('st-read-1', 'reading', 'read-item-101', 'thpt');
    expect(readingUrl).toBe(
      '/thpt/reading/read-item-101?roadmapStep=st-read-1',
    );

    const clozeUrl = getReviewUrlForStep('st-cloze-1', 'cloze', 'cloze-item-202', 'thpt');
    expect(clozeUrl).toBe(
      '/thpt/cloze/cloze-item-202?roadmapStep=st-cloze-1',
    );

    // 6. Special character URL encoding
    const encodedUrl = getReviewUrlForStep('step with spaces', 'grammar', 'tense & aspect', 'cefr');
    expect(encodedUrl).toContain('topic=tense%20%26%20aspect');
    expect(encodedUrl).toContain('roadmapStep=step%20with%20spaces');

    // 7. Offline storage key format
    const storageKey = getDiagnosticStorageKey('usr_99', 'unit_a0_1');
    expect(storageKey).toBe('roadmap_diag:usr_99:unit_a0_1');
  });

  // ========================================================================
  // SECTION 4: LEVEL EXIT EXAM & CAPSTONE ADVANCEMENT
  // ========================================================================

  await runner.it('ADV-4.1: Level Exit Exam generates 25-30 comprehensive questions spanning all 8 CEFR and THPT levels', () => {
    const allLevels = ['A0', 'A1', 'A2', 'B1', 'B2', 'lop-10', 'lop-11', 'lop-12'];

    for (const lvl of allLevels) {
      const questions = generateExitExamQuestions(lvl);

      // Question count constraint: exactly 25 for A0, 30 for all other levels
      if (lvl === 'A0') {
        expect(questions.length).toBe(25);
      } else {
        expect(questions.length).toBe(30);
      }

      // Deep structure verification on every single question
      const ids = new Set<string>();
      for (const q of questions) {
        expect(q.id.length).toBeGreaterThan(0);
        expect(ids.has(q.id)).toBe(false); // Unique question IDs
        ids.add(q.id);

        expect(['vocab', 'grammar', 'pronunciation', 'reading']).toContain(q.skill);
        expect(q.prompt.length).toBeGreaterThan(5);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(2);

        // Crucial: The correct answer MUST exist inside options array
        expect(q.options!).toContain(q.answer);

        expect(q.explanation?.length).toBeGreaterThan(5);
        expect(q.sourceStepId?.length).toBeGreaterThan(0);
        expect(q.sourceUrl?.length).toBeGreaterThan(0);
      }

      // Exit standard alignment
      const std = getExitStandard(lvl);
      expect(std).toBeDefined();
      expect(std!.canDo.length).toBeGreaterThan(0);
    }
  });

  await runner.it('ADV-4.2: Exit Exam evaluates >= 80% pass threshold strictly and discriminates 79% (FAIL) vs 80% (PASS)', () => {
    // A0 exam: 25 questions
    const a0Questions = generateExitExamQuestions('A0');
    expect(a0Questions.length).toBe(25);

    // Test 1: 19/25 = 76% (FAIL)
    const answers19: Record<string, string> = {};
    a0Questions.forEach((q, idx) => {
      answers19[q.id] = idx < 19 ? q.answer : 'WRONG';
    });
    const report19 = evaluateDiagnostic({
      questions: a0Questions,
      answers: answers19,
      metadata: { stepId: 'se-A0-exit', targetId: 'A0', type: 'exit_exam', passThresholdPct: 80 },
    });
    expect(report19.scorePct).toBe(76);
    expect(report19.passed).toBe(false);

    // Test 2: Exactly 20/25 = 80% (PASS)
    const answers20: Record<string, string> = {};
    a0Questions.forEach((q, idx) => {
      answers20[q.id] = idx < 20 ? q.answer : 'WRONG';
    });
    const report20 = evaluateDiagnostic({
      questions: a0Questions,
      answers: answers20,
      metadata: { stepId: 'se-A0-exit', targetId: 'A0', type: 'exit_exam', passThresholdPct: 80 },
    });
    expect(report20.scorePct).toBe(80);
    expect(report20.passed).toBe(true);

    // 30-question exam (e.g. lop-10):
    const thpt10Questions = generateExitExamQuestions('lop-10');
    expect(thpt10Questions.length).toBe(30);

    // Test 3: 23/30 = 76.7% (rounds to 77%) -> FAIL
    const answers23: Record<string, string> = {};
    thpt10Questions.forEach((q, idx) => {
      answers23[q.id] = idx < 23 ? q.answer : 'WRONG';
    });
    const report23 = evaluateDiagnostic({
      questions: thpt10Questions,
      answers: answers23,
      metadata: { stepId: 'se-lop-10-exit', targetId: 'lop-10', type: 'exit_exam', passThresholdPct: 80 },
    });
    expect(report23.scorePct).toBe(77);
    expect(report23.passed).toBe(false);

    // Test 4: Exactly 24/30 = 80% -> PASS
    const answers24: Record<string, string> = {};
    thpt10Questions.forEach((q, idx) => {
      answers24[q.id] = idx < 24 ? q.answer : 'WRONG';
    });
    const report24 = evaluateDiagnostic({
      questions: thpt10Questions,
      answers: answers24,
      metadata: { stepId: 'se-lop-10-exit', targetId: 'lop-10', type: 'exit_exam', passThresholdPct: 80 },
    });
    expect(report24.scorePct).toBe(80);
    expect(report24.passed).toBe(true);
  });

  await runner.it('ADV-4.3: Certificate & Badge mapping guarantees authentic graduation badges and next-level progression', () => {
    // Verify badge dictionary for all levels
    const expectedBadges: Record<string, { badgeId: string; nextLevel: string }> = {
      A0: { badgeId: 'badge_a0_graduate', nextLevel: 'A1' },
      A1: { badgeId: 'badge_a1_graduate', nextLevel: 'A2' },
      A2: { badgeId: 'badge_a2_graduate', nextLevel: 'B1' },
      B1: { badgeId: 'badge_b1_graduate', nextLevel: 'B2' },
      B2: { badgeId: 'badge_b2_graduate', nextLevel: 'B2' },
      'lop-10': { badgeId: 'badge_thpt10_graduate', nextLevel: 'lop-11' },
      'lop-11': { badgeId: 'badge_thpt11_graduate', nextLevel: 'lop-12' },
      'lop-12': { badgeId: 'badge_thpt12_graduate', nextLevel: 'lop-12' },
    };

    for (const [lvl, expected] of Object.entries(expectedBadges)) {
      const badge = GRADUATION_BADGES[lvl];
      expect(badge).toBeDefined();
      expect(badge.id).toBe(expected.badgeId);
      expect(badge.nextLevel).toBe(expected.nextLevel);
      expect(badge.name.length).toBeGreaterThan(5);
      expect(badge.icon.length).toBeGreaterThan(0);
    }
  });

  await runner.it('ADV-4.4: Level advancement gating blocks failed attempts and unlocks next level CTA on pass', () => {
    const a0Questions = generateExitExamQuestions('A0');
    let onGraduatedCalled = false;
    let awardedLevel = '';
    let awardedBadge = '';

    const onGraduatedMock = (levelId: string, badgeId: string) => {
      onGraduatedCalled = true;
      awardedLevel = levelId;
      awardedBadge = badgeId;
    };

    // 1. Simulation on failure (76%)
    const answersFail: Record<string, string> = {};
    a0Questions.forEach((q, idx) => {
      answersFail[q.id] = idx < 19 ? q.answer : 'WRONG';
    });
    const reportFail = evaluateDiagnostic({
      questions: a0Questions,
      answers: answersFail,
      metadata: { stepId: 'se-A0-exit', targetId: 'A0', type: 'exit_exam', passThresholdPct: 80 },
    });

    if (reportFail.passed) {
      onGraduatedMock('A0', GRADUATION_BADGES['A0'].id);
    }
    expect(onGraduatedCalled).toBe(false);
    expect(awardedLevel).toBe('');

    // 2. Simulation on success (80%)
    const answersPass: Record<string, string> = {};
    a0Questions.forEach((q, idx) => {
      answersPass[q.id] = idx < 20 ? q.answer : 'WRONG';
    });
    const reportPass = evaluateDiagnostic({
      questions: a0Questions,
      answers: answersPass,
      metadata: { stepId: 'se-A0-exit', targetId: 'A0', type: 'exit_exam', passThresholdPct: 80 },
    });

    if (reportPass.passed) {
      onGraduatedMock('A0', GRADUATION_BADGES['A0'].id);
    }
    expect(onGraduatedCalled).toBe(true);
    expect(awardedLevel).toBe('A0');
    expect(awardedBadge).toBe('badge_a0_graduate');
  });
}

// Standalone runner execution
if (process.argv[1]?.includes('adversarial-assessment.test')) {
  const runner = new TestRunner();
  console.log('================================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL ASSESSMENT & UNLOCKING VERIFICATION SUITE');
  console.log('  Testing Linear Unlocking, Mini-Quiz Gating, Diagnostic Breakdown & Exit Exam');
  console.log('================================================================================\n');

  runAdversarialAssessmentTests(runner).then(() => {
    const stats = runner.getStats();
    console.log('\n================================================================================');
    console.log(`  ADVERSARIAL SUITE SUMMARY: ${stats.passed}/${stats.total} PASSED (Failed: ${stats.failed})`);
    console.log(`  Duration: ${stats.durationMs}ms`);
    console.log('================================================================================\n');
    if (stats.failed > 0) {
      console.error(`❌ Adversarial suite detected ${stats.failed} failures!`);
      process.exit(1);
    } else {
      console.log('✅ ALL ADVERSARIAL TESTS PASSED EMPIRICALLY WITH ZERO DEFECTS!');
      process.exit(0);
    }
  });
}
