/**
 * Tier 4: Real-World Scenarios Test Suite (Learning Roadmap / Journey Modernization)
 * End-to-end full-lifecycle user journey simulations against ORIGINAL_REQUEST.md (§ 2026-09-06T02:40:27Z)
 * and PROJECT.md § Architecture.
 * Minimum requirement: >= 8 test scenarios.
 *
 * Scenarios:
 *  1. Complete Beginner A0 Onboarding & Unit 1 Mastery
 *  2. National High School Exam (THPT) Grade 10 Learning Flow
 *  3. Remedial Diagnostic Feedback & Retest Recovery Loop
 *  4. Capstone Level Graduation & Exit Exam Certification
 *  5. Multi-Track, Dual-Device Study Routine
 *  6. Network Interruption & Seamless Offline Fallback Sync
 *  7. Prior Knowledge Library Credit Acceleration
 *  8. Gatekeeper Mini-Quiz Failure and Retry Mastery Loop
 */

import {
  TestRunner,
  expect,
  RoadmapUnitMetadata,
  RoadmapStepMetadata,
  calculateUnitProgress,
  gradeMiniQuiz,
  gradeCheckpoint,
  gradeExitExam,
  getResponsiveLayout,
  createMockJourneySupabaseClient,
  createInitialJourneyMockDb,
  MockLocalStorage,
  OfflineAssessmentSyncManager,
  DiagnosticQuestion,
} from './test-harness';

export async function runTier4Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 4: Real-World Application Scenarios (Roadmap/Journey)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 1: Complete Beginner A0 Onboarding & Unit 1 Mastery
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 1: Complete Beginner A0 Onboarding & Unit 1 Mastery', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    // 1. Placement test assigns A0
    const userId = 'newbie-learner-1';
    supabase.from('user_roadmap').insert({
      user_id: userId,
      track: 'cefr',
      roadmap_version: 'roadmap-v1',
      level_id: 'A0',
      current_unit_id: 'u-a0-1',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const unit1: RoadmapUnitMetadata = {
      id: 'u-a0-1',
      index: 1,
      title: 'Chặng 1 · Chào hỏi & Đại từ',
      description: 'Nền tảng khởi đầu',
      estimatedMinutes: 45,
      canDo: ['Có thể tự giới thiệu tên, nghề nghiệp'],
      topicPreview: 'Làm quen từ vựng chào hỏi, đại từ nhân xưng.',
      badgeIcon: '🚩',
      badgeName: 'A0 Khởi động',
      steps: [
        { id: 'sv-1', type: 'vocab', title: 'Chào hỏi', estimatedMinutes: 10 },
        { id: 'sg-1', type: 'grammar', title: 'Đại từ', estimatedMinutes: 10 },
        { id: 'sp-1', type: 'pronunciation', title: 'Trọng âm', estimatedMinutes: 10 },
        { id: 'sc-1', type: 'checkpoint', title: 'Checkpoint 1', estimatedMinutes: 15 },
      ],
    };

    const completed = new Set<string>();
    expect(calculateUnitProgress(unit1, completed).percentage).toBe(0);

    // Step 1: Vocab -> Mini-quiz pass
    const mq1 = gradeMiniQuiz([{ id: '1', correctAnswer: 'hello' }], { '1': 'hello' });
    expect(mq1.passed).toBe(true);
    completed.add('sv-1');
    expect(calculateUnitProgress(unit1, completed).percentage).toBe(25);

    // Step 2: Grammar -> Mini-quiz pass
    const mq2 = gradeMiniQuiz([{ id: '2', correctAnswer: 'he' }], { '2': 'he' });
    expect(mq2.passed).toBe(true);
    completed.add('sg-1');
    expect(calculateUnitProgress(unit1, completed).percentage).toBe(50);

    // Step 3: Pronunciation -> Mini-quiz pass
    const mq3 = gradeMiniQuiz([{ id: '3', correctAnswer: 'stress' }], { '3': 'stress' });
    expect(mq3.passed).toBe(true);
    completed.add('sp-1');
    expect(calculateUnitProgress(unit1, completed).percentage).toBe(75);

    // Step 4: Checkpoint -> Pass with 90%
    const cpQuestions: DiagnosticQuestion[] = [
      { id: 'c1', skill: 'vocab', conceptRef: 'v1', prompt: 'P1', options: ['A'], correctAnswer: 'A', explanation: 'E' },
      { id: 'c2', skill: 'grammar', conceptRef: 'g1', prompt: 'P2', options: ['A'], correctAnswer: 'A', explanation: 'E' },
    ];
    const cpResult = gradeCheckpoint(cpQuestions, { c1: 'A', c2: 'A' }, unit1.steps);
    expect(cpResult.score).toBe(100);
    expect(cpResult.passed).toBe(true);
    completed.add('sc-1');

    const finalProgress = calculateUnitProgress(unit1, completed);
    expect(finalProgress.percentage).toBe(100);
    expect(finalProgress.status).toBe('completed');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 2: National High School Exam (THPT) Grade 10 Learning Flow
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 2: National High School Exam (THPT) Grade 10 Learning Flow', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const userId = 'student-thpt-10';
    await supabase.from('user_roadmap').insert({
      user_id: userId,
      track: 'thpt',
      roadmap_version: 'roadmap-v1',
      level_id: 'lop-10',
      current_unit_id: 'u-thpt10-1',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const thptUnit: RoadmapUnitMetadata = {
      id: 'u-thpt10-1',
      index: 1,
      title: 'Unit 1 · Family Life',
      description: 'Chủ đề đời sống gia đình THPT Lớp 10 Global Success',
      estimatedMinutes: 60,
      canDo: ['Có thể đọc hiểu thông báo và tờ rơi chủ đề gia đình'],
      topicPreview: 'Luyện kỹ năng đọc hiểu thông báo và sắp xếp đoạn văn.',
      steps: [
        { id: 'sr-announcement-1', type: 'announcement', title: 'Thông báo gia đình', estimatedMinutes: 15 },
        { id: 'sr-reading-1', type: 'reading', title: 'Đọc hiểu bài báo', estimatedMinutes: 20 },
        { id: 'sc-thpt10-1', type: 'checkpoint', title: 'Đề kiểm tra chặng', estimatedMinutes: 25 },
      ],
    };

    // Completes reading announcement
    const completed = new Set<string>(['sr-announcement-1']);
    expect(calculateUnitProgress(thptUnit, completed).percentage).toBe(33);

    // Completes reading passage explorer
    completed.add('sr-reading-1');
    expect(calculateUnitProgress(thptUnit, completed).percentage).toBe(67);

    // Takes THPT Checkpoint (Mini-exam)
    const questions: DiagnosticQuestion[] = [
      { id: 't1', skill: 'reading', conceptRef: 'rc', prompt: 'Reading Q', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Exp' },
      { id: 't2', skill: 'vocab', conceptRef: 'vc', prompt: 'Vocab Q', options: ['A', 'B'], correctAnswer: 'A', explanation: 'Exp' },
    ];
    const examResult = gradeCheckpoint(questions, { t1: 'A', t2: 'A' });
    expect(examResult.score).toBe(100);
    expect(examResult.passed).toBe(true);

    completed.add('sc-thpt10-1');
    expect(calculateUnitProgress(thptUnit, completed).status).toBe('completed');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 3: Remedial Diagnostic Feedback & Retest Recovery Loop
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 3: Remedial Diagnostic Feedback & Retest Recovery Loop', async () => {
    const unitSteps: RoadmapStepMetadata[] = [
      { id: 'sv-greet', type: 'vocab', title: 'Chào hỏi', estimatedMinutes: 10, refId: 'concept-greet' },
      { id: 'sg-pronoun', type: 'grammar', title: 'Đại từ nhân xưng', estimatedMinutes: 12, refId: 'concept-pronoun' },
    ];

    const questions: DiagnosticQuestion[] = [
      { id: 'q1', skill: 'vocab', conceptRef: 'concept-greet', sourceStepId: 'sv-greet', prompt: 'Vocab Q', options: ['A'], correctAnswer: 'A', explanation: 'E' },
      { id: 'q2', skill: 'grammar', conceptRef: 'concept-pronoun', sourceStepId: 'sg-pronoun', prompt: 'Grammar Q1', options: ['A'], correctAnswer: 'A', explanation: 'E' },
      { id: 'q3', skill: 'grammar', conceptRef: 'concept-pronoun', sourceStepId: 'sg-pronoun', prompt: 'Grammar Q2', options: ['A'], correctAnswer: 'A', explanation: 'E' },
    ];

    // Attempt 1: Gets both grammar questions wrong -> Score 33% (FAIL)
    const attempt1 = gradeCheckpoint(questions, { q1: 'A', q2: 'wrong', q3: 'wrong' }, unitSteps);
    expect(attempt1.score).toBe(33);
    expect(attempt1.passed).toBe(false);

    // Diagnostic report exposes weak grammar concept and remedial link
    const weak = attempt1.details.weakConcepts?.[0];
    expect(weak).toBeDefined();
    expect(weak?.conceptRef).toBe('concept-pronoun');
    expect(weak?.reviewUrl).toBe('/journey?focusStep=sg-pronoun');

    // Attempt 2: Learner reviews grammar and retakes checkpoint -> 100% (PASS)
    const attempt2 = gradeCheckpoint(questions, { q1: 'A', q2: 'A', q3: 'A' }, unitSteps);
    expect(attempt2.score).toBe(100);
    expect(attempt2.passed).toBe(true);
    expect(attempt2.details.weakConcepts?.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 4: Capstone Level Graduation & Exit Exam Certification
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 4: Capstone Level Graduation & Exit Exam Certification', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    // Learner finished all units in A0
    const exitQuestions: DiagnosticQuestion[] = Array.from({ length: 25 }).map((_, i) => ({
      id: `eq-${i}`,
      skill: 'vocab',
      conceptRef: `concept-${i}`,
      prompt: `Prompt ${i}`,
      options: ['A', 'B'],
      correctAnswer: 'A',
      explanation: 'Exp',
    }));

    const answers: Record<string, string> = {};
    for (let i = 0; i < 22; i++) answers[`eq-${i}`] = 'A'; // 22/25 = 88%

    const exitResult = gradeExitExam(exitQuestions, answers, 'A0');
    expect(exitResult.score).toBe(88);
    expect(exitResult.passed).toBe(true);
    expect(exitResult.badgeAwarded).toBe('badge_a0_graduate');

    // Record assessment in database
    await supabase.from('user_roadmap_assessments').insert({
      user_id: 'learner-cefr-1',
      track: 'cefr',
      tier: 'exit_exam',
      target_id: 'A0',
      score: exitResult.score,
      passed: exitResult.passed,
      details: exitResult.details,
    });

    // Advance user level to A1
    await supabase.from('user_roadmap').update({ level_id: 'A1', current_unit_id: 'u-a1-1' }).eq('user_id', 'learner-cefr-1');

    const updatedProfile = await supabase.from('user_roadmap').select('*').eq('user_id', 'learner-cefr-1').eq('track', 'cefr').single();
    expect(updatedProfile.data?.level_id).toBe('A1');
    expect(updatedProfile.data?.current_unit_id).toBe('u-a1-1');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 5: Multi-Track, Dual-Device Study Routine
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 5: Multi-Track, Dual-Device Study Routine', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const userId = 'learner-dual-1';

    // Morning on desktop (width 1440px) studying CEFR
    const desktopLayout = getResponsiveLayout(1440);
    expect(desktopLayout.deviceCategory).toBe('desktop');
    expect(desktopLayout.gridColumns).toBe(3);

    await supabase.from('user_roadmap_steps').insert({
      user_id: userId,
      step_id: 'sv-a1-1',
      status: 'completed',
      score: 100,
    });

    // Evening on mobile (width 375px) studying THPT
    const mobileLayout = getResponsiveLayout(375);
    expect(mobileLayout.deviceCategory).toBe('mobile');
    expect(mobileLayout.gridColumns).toBe(1);

    await supabase.from('user_roadmap_steps').insert({
      user_id: userId,
      step_id: 'sr-u-thpt11-1',
      status: 'completed',
      score: 95,
    });

    // Verify both track enrollments intact
    const enrollments = await supabase.from('user_roadmap').select('*').eq('user_id', userId);
    expect(enrollments.data.length).toBe(2);

    const cefrEnrollment = enrollments.data.find((e: any) => e.track === 'cefr');
    const thptEnrollment = enrollments.data.find((e: any) => e.track === 'thpt');

    expect(cefrEnrollment.level_id).toBe('A1');
    expect(thptEnrollment.level_id).toBe('lop-11');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 6: Network Interruption & Seamless Offline Fallback Sync
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 6: Network Interruption & Seamless Offline Fallback Sync', async () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    // 1. Connection drops
    supabase.setSimulateFailure(true);

    const attempt = {
      userId: 'learner-cefr-1',
      track: 'cefr' as const,
      tier: 'checkpoint' as const,
      targetId: 'u-a0-2',
      score: 85,
      passed: true,
      details: { totalQuestions: 10, correctAnswers: 8, weakConcepts: [] },
    };

    // Attempt fails on network, cached locally
    const { error } = await supabase.from('user_roadmap_assessments').insert(attempt);
    expect(error).toBeDefined();
    syncManager.saveAttemptOffline(attempt);

    expect(syncManager.getPendingAttempts().length).toBe(1);

    // 2. Connection restores -> sync runs
    const syncResult = await syncManager.syncPendingAttempts(supabase);
    expect(syncResult.syncedCount).toBe(1);
    expect(syncResult.failedCount).toBe(0);
    expect(syncManager.getPendingAttempts().length).toBe(0);

    const savedInDb = mockDb.user_roadmap_assessments.find((a) => a.target_id === 'u-a0-2');
    expect(savedInDb).toBeDefined();
    expect(savedInDb?.score).toBe(85);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 7: Prior Knowledge Library Credit Acceleration
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 7: Prior Knowledge Library Credit Acceleration', () => {
    const unit: RoadmapUnitMetadata = {
      id: 'u-a0-1',
      index: 1,
      title: 'Chặng 1',
      description: 'Desc',
      estimatedMinutes: 45,
      canDo: ['Can do'],
      topicPreview: 'Preview',
      steps: [
        { id: 'sv-1', type: 'vocab', title: 'Từ vựng 1', estimatedMinutes: 10, refId: 'pack-greetings' },
        { id: 'sv-2', type: 'vocab', title: 'Từ vựng 2', estimatedMinutes: 10, refId: 'pack-family' },
        { id: 'sg-1', type: 'grammar', title: 'Ngữ pháp 1', estimatedMinutes: 10 },
        { id: 'sc-1', type: 'checkpoint', title: 'Checkpoint 1', estimatedMinutes: 15 },
      ],
    };

    // Student already finished pack-greetings and pack-family in flashcard study deck
    const completedOutsideRoadmap = ['pack-greetings', 'pack-family'];
    const autoCreditedStepIds = new Set<string>();

    for (const step of unit.steps) {
      if (step.refId && completedOutsideRoadmap.includes(step.refId)) {
        autoCreditedStepIds.add(step.id);
      }
    }

    const progress = calculateUnitProgress(unit, autoCreditedStepIds);
    // 2 out of 4 steps credited = 50%
    expect(progress.percentage).toBe(50);
    expect(progress.completedSteps).toBe(2);
    expect(autoCreditedStepIds.has('sv-1')).toBe(true);
    expect(autoCreditedStepIds.has('sv-2')).toBe(true);
    expect(autoCreditedStepIds.has('sg-1')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Scenario 8: Gatekeeper Mini-Quiz Failure and Retry Mastery Loop
  // ──────────────────────────────────────────────────────────────────────────
  await runner.it('Scenario 8: Gatekeeper Mini-Quiz Failure and Retry Mastery Loop', () => {
    const grammarMiniQuiz = [
      { id: 'q1', prompt: 'I ___ a student.', options: ['am', 'is', 'are'], correctAnswer: 'am' },
      { id: 'q2', prompt: 'She ___ a doctor.', options: ['am', 'is', 'are'], correctAnswer: 'is' },
      { id: 'q3', prompt: 'They ___ teachers.', options: ['am', 'is', 'are'], correctAnswer: 'are' },
      { id: 'q4', prompt: 'We ___ friends.', options: ['am', 'is', 'are'], correctAnswer: 'are' },
    ];

    // Attempt 1: Learner scores 2/4 (50%) -> Blocked (<75%)
    const attempt1 = gradeMiniQuiz(grammarMiniQuiz, { q1: 'am', q2: 'am', q3: 'is', q4: 'are' });
    expect(attempt1.score).toBe(50);
    expect(attempt1.passed).toBe(false);

    let isStepCompleted = attempt1.passed;
    expect(isStepCompleted).toBe(false);

    // Learner reads the explanation, understands mistakes, and retries
    const attempt2 = gradeMiniQuiz(grammarMiniQuiz, { q1: 'am', q2: 'is', q3: 'are', q4: 'are' });
    expect(attempt2.score).toBe(100);
    expect(attempt2.passed).toBe(true);

    isStepCompleted = attempt2.passed;
    expect(isStepCompleted).toBe(true);
  });
}
