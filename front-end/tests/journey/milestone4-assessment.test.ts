/**
 * Milestone 4 Test Suite: Multi-Tier Assessment Engine
 * Validates:
 * 1. Node Mini-Quiz Gatekeeper logic & passing threshold (>=75%)
 * 2. Diagnostic Checkpoint Evaluation & Multi-dimensional Skill Breakdown
 * 3. Granular Weak Concept Identification & Remedial Deep-Link Recommendations
 * 4. Level Exit Exam Question Generation (A0–B2, Lớp 10–12) & Exit Standards Alignment
 * 5. Capstone Level Graduation Badges & Next-Level Advancement
 * 6. Offline Storage Key Generation & Resilience
 */

import { TestRunner, expect } from './test-harness';
import {
  evaluateDiagnostic,
  judgeDiagnosticAnswer,
  getReviewUrlForStep,
  getDiagnosticStorageKey,
  type DiagnosticQuestion,
} from '@/lib/roadmap-assessment';
import {
  generateExitExamQuestions,
  GRADUATION_BADGES,
} from '@/components/journey/assessment/LevelExitExamModal';

export async function runMilestone4Tests(runner: TestRunner) {
  runner.describe('Milestone 4: Multi-tier Assessment Engine', () => {});

  // ── TEST 1: Mini-Quiz Passing Gate (>=75%) ──
  await runner.it('M4.1: Mini-Quiz gatekeeper requires >= 75% to pass', () => {
    // 2/3 = 67% (FAIL)
    const questions3: DiagnosticQuestion[] = [
      { id: 'q1', skill: 'vocab', conceptRef: 'c1', conceptName: 'C1', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P1', answer: 'A' },
      { id: 'q2', skill: 'vocab', conceptRef: 'c2', conceptName: 'C2', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P2', answer: 'B' },
      { id: 'q3', skill: 'vocab', conceptRef: 'c3', conceptName: 'C3', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P3', answer: 'C' },
    ];

    const reportFail = evaluateDiagnostic({
      questions: questions3,
      answers: { q1: 'A', q2: 'B', q3: 'WRONG' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(reportFail.scorePct).toBe(67);
    expect(reportFail.passed).toBe(false);

    // 3/3 = 100% (PASS)
    const reportPass = evaluateDiagnostic({
      questions: questions3,
      answers: { q1: 'A', q2: 'B', q3: 'C' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(reportPass.scorePct).toBe(100);
    expect(reportPass.passed).toBe(true);

    // 3/4 = 75% (PASS)
    const questions4: DiagnosticQuestion[] = [
      ...questions3,
      { id: 'q4', skill: 'grammar', conceptRef: 'c4', conceptName: 'C4', sourceStepId: 's1', sourceStepTitle: 'S1', sourceUrl: '/u1', prompt: 'P4', answer: 'D' },
    ];
    const report75 = evaluateDiagnostic({
      questions: questions4,
      answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'WRONG' },
      metadata: { stepId: 's1', type: 'mini_quiz', passThresholdPct: 75 },
    });
    expect(report75.scorePct).toBe(75);
    expect(report75.passed).toBe(true);
  });

  // ── TEST 2: Diagnostic Checkpoint Multi-dimensional Breakdown ──
  await runner.it('M4.2: Diagnostic Checkpoint computes multi-skill scores (vocab, grammar, pronunciation, reading)', () => {
    const cpQuestions: DiagnosticQuestion[] = [
      // 2 vocab (both correct = 100%)
      { id: 'v1', skill: 'vocab', conceptRef: 'v1', conceptName: 'Vocab 1', sourceStepId: 'sv1', sourceStepTitle: 'V1', sourceUrl: '/v1', prompt: 'P', answer: 'A' },
      { id: 'v2', skill: 'vocab', conceptRef: 'v2', conceptName: 'Vocab 2', sourceStepId: 'sv1', sourceStepTitle: 'V1', sourceUrl: '/v1', prompt: 'P', answer: 'A' },
      // 2 grammar (1 correct, 1 wrong = 50%)
      { id: 'g1', skill: 'grammar', conceptRef: 'g1', conceptName: 'Grammar 1', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'A' },
      { id: 'g2', skill: 'grammar', conceptRef: 'g2', conceptName: 'Grammar 2', sourceStepId: 'sg1', sourceStepTitle: 'G1', sourceUrl: '/g1', prompt: 'P', answer: 'B' },
      // 1 pronunciation (correct = 100%)
      { id: 'p1', skill: 'pronunciation', conceptRef: 'p1', conceptName: 'Pron 1', sourceStepId: 'sp1', sourceStepTitle: 'P1', sourceUrl: '/p1', prompt: 'P', answer: 'A' },
      // 1 reading (wrong = 0%)
      { id: 'r1', skill: 'reading', conceptRef: 'r1', conceptName: 'Reading 1', sourceStepId: 'sr1', sourceStepTitle: 'R1', sourceUrl: '/r1', prompt: 'P', answer: 'A' },
    ];

    const answers = {
      v1: 'A',
      v2: 'A',
      g1: 'A',
      g2: 'WRONG',
      p1: 'A',
      r1: 'WRONG',
    };

    const report = evaluateDiagnostic({
      questions: cpQuestions,
      answers,
      metadata: { stepId: 'sc1', targetId: 'u1', type: 'checkpoint', passThresholdPct: 80 },
    });

    expect(report.totalQuestions).toBe(6);
    expect(report.correctQuestions).toBe(4);
    expect(report.scorePct).toBe(67);
    expect(report.passed).toBe(false);

    // Skill breakdown asserts
    expect(report.skills.vocab?.pct).toBe(100);
    expect(report.skills.vocab?.status).toBe('mastered');

    expect(report.skills.grammar?.pct).toBe(50);
    expect(report.skills.grammar?.status).toBe('weak');

    expect(report.skills.pronunciation?.pct).toBe(100);
    expect(report.skills.pronunciation?.status).toBe('mastered');

    expect(report.skills.reading?.pct).toBe(0);
    expect(report.skills.reading?.status).toBe('weak');
  });

  // ── TEST 3: Granular Weak Concept Identification & Remedial Deep-Links ──
  await runner.it('M4.3: Granular weak concepts capture student choice vs correct answer and rank remedial steps by error count', () => {
    const questions: DiagnosticQuestion[] = [
      { id: 'q1', skill: 'grammar', conceptRef: 'c-past-simple', conceptName: 'Quá khứ đơn', sourceStepId: 'sg-past', sourceStepTitle: 'Past Simple Lesson', sourceUrl: '/grammar/learn?topic=past', prompt: 'Q1', answer: 'went', explanation: 'Went là quá khứ của go' },
      { id: 'q2', skill: 'grammar', conceptRef: 'c-past-cont', conceptName: 'Quá khứ tiếp diễn', sourceStepId: 'sg-past', sourceStepTitle: 'Past Simple Lesson', sourceUrl: '/grammar/learn?topic=past', prompt: 'Q2', answer: 'was going', explanation: 'Hành động đang diễn ra' },
      { id: 'q3', skill: 'vocab', conceptRef: 'c-abandon', conceptName: 'Từ vựng: Abandon', sourceStepId: 'sv-adv', sourceStepTitle: 'Advanced Words', sourceUrl: '/flashcard?pack=adv', prompt: 'Q3', answer: 'leave', explanation: 'Abandon = leave' },
    ];

    const report = evaluateDiagnostic({
      questions,
      answers: { q1: 'goed', q2: 'went', q3: 'leave' },
      metadata: { stepId: 'cp1' },
    });

    expect(report.weakConcepts.length).toBe(2);
    expect(report.weakConcepts[0].conceptRef).toBe('c-past-simple');
    expect(report.weakConcepts[0].userChoice).toBe('goed');
    expect(report.weakConcepts[0].correctAnswer).toBe('went');
    expect(report.weakConcepts[0].explanation).toBe('Went là quá khứ của go');

    // Remedial recommendations aggregated by stepId
    expect(report.recommendations.length).toBe(1);
    expect(report.recommendations[0].stepId).toBe('sg-past');
    expect(report.recommendations[0].errorCount).toBe(2);
    expect(report.recommendations[0].url).toBe('/grammar/learn?topic=past');
  });

  // ── TEST 4: Level Exit Exam Question Generation Across All Levels ──
  await runner.it('M4.4: Exit exam generates 25-30 comprehensive questions for each CEFR and THPT level', () => {
    const levels = ['A0', 'A1', 'A2', 'B1', 'B2', 'lop-10', 'lop-11', 'lop-12'];

    for (const lvl of levels) {
      const qs = generateExitExamQuestions(lvl);
      expect(qs.length >= 25).toBe(true);

      // Verify each question has valid diagnostic structure
      for (const q of qs) {
        expect(q.id.length > 0).toBe(true);
        expect(Boolean(q.skill)).toBe(true);
        expect(Boolean(q.conceptRef)).toBe(true);
        expect(Boolean(q.prompt)).toBe(true);
        expect(Boolean(q.answer)).toBe(true);
        expect(Boolean(q.explanation)).toBe(true);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length >= 2).toBe(true);
      }

      // Check all 4 skills represented in A0
      if (lvl === 'A0') {
        const skillsInA0 = new Set(qs.map((q) => q.skill));
        expect(skillsInA0.has('vocab')).toBe(true);
        expect(skillsInA0.has('grammar')).toBe(true);
        expect(skillsInA0.has('pronunciation')).toBe(true);
        expect(skillsInA0.has('reading')).toBe(true);
      }
    }
  });

  // ── TEST 5: Level Graduation Badges & Level Progression ──
  await runner.it('M4.5: Level graduation badge mapping assigns authentic badges and unlocks next level', () => {
    expect(GRADUATION_BADGES['A0'].id).toBe('badge_a0_graduate');
    expect(GRADUATION_BADGES['A0'].nextLevel).toBe('A1');

    expect(GRADUATION_BADGES['A1'].id).toBe('badge_a1_graduate');
    expect(GRADUATION_BADGES['A1'].nextLevel).toBe('A2');

    expect(GRADUATION_BADGES['B2'].id).toBe('badge_b2_graduate');

    expect(GRADUATION_BADGES['lop-10'].id).toBe('badge_thpt10_graduate');
    expect(GRADUATION_BADGES['lop-10'].nextLevel).toBe('lop-11');

    expect(GRADUATION_BADGES['lop-11'].id).toBe('badge_thpt11_graduate');
    expect(GRADUATION_BADGES['lop-11'].nextLevel).toBe('lop-12');

    expect(GRADUATION_BADGES['lop-12'].id).toBe('badge_thpt12_graduate');
  });

  // ── TEST 6: 1-Click Review URL Generator & Storage Keys ──
  await runner.it('M4.6: 1-click review URL generator and offline storage keys work seamlessly', () => {
    const vocabUrl = getReviewUrlForStep('sv-1', 'vocab', 'pack-family', 'cefr');
    expect(vocabUrl).toContain('/flashcard?class=roadmap&mode=learn&pack=pack-family&roadmapStep=sv-1');

    const starterUrl = getReviewUrlForStep('sv-2', 'vocab', 'starter-greetings', 'cefr');
    expect(starterUrl).toContain('starter=starter-greetings');

    const grammarUrl = getReviewUrlForStep('sg-1', 'grammar', 'present-simple', 'cefr');
    expect(grammarUrl).toBe('/grammar/learn?topic=present-simple&roadmapStep=sg-1');

    const pronUrl = getReviewUrlForStep('sp-1', 'pronunciation', 'p-b', 'cefr');
    expect(pronUrl).toBe('/pronunciation/p-b?roadmapStep=sp-1');

    const key = getDiagnosticStorageKey('u123', 'unit-a0-1');
    expect(key).toBe('roadmap_diag:u123:unit-a0-1');
  });
}

// Execute standalone if run directly
if (process.argv[1]?.includes('milestone4-assessment.test')) {
  const runner = new TestRunner();
  runMilestone4Tests(runner).then(() => {
    const s = runner.getStats();
    console.log(`Milestone 4 Tests: ${s.passed}/${s.total} passed in ${s.durationMs}ms`);
    if (s.failed > 0) process.exit(1);
  });
}