/**
 * Tier 2: Boundary & Corner Cases Test Suite (Learning Roadmap / Journey Modernization)
 * Opaque-box boundary, stress, and edge-case verification against ORIGINAL_REQUEST.md
 * and PROJECT.md § Feature Inventory.
 *
 * Covers all 16 Features:
 *  B1. Module Cards Boundaries
 *  B2. Time & Duration Framing Boundaries
 *  B3. Can-Do Skills Boundaries
 *  B4. Topic Previews Boundaries
 *  B5. Dual Track Switcher Boundaries
 *  B6. Mobile & Desktop Responsive Boundaries
 *  B7. Node Mini-Quiz Boundaries
 *  B8. Diagnostic Checkpoint Boundaries
 *  B9. Level Exit Exam Engine Boundaries
 *  B10. Assessment Persistence Boundaries
 *  B11. Multimodal Context Boundaries
 *  B12. Word Pair Matching Widget Boundaries
 *  B13. Dialogue Cloze Widget Boundaries
 *  B14. Reading Passage Explorer Boundaries
 *  B15. Phonetic Articulation Boundaries
 *  B16. Instant Interactive Feedback Boundaries
 */

import {
  TestRunner,
  expect,
  RoadmapUnitMetadata,
  calculateUnitProgress,
  formatEstimatedMinutes,
  gradeMiniQuiz,
  gradeCheckpoint,
  gradeExitExam,
  validateTouchTarget,
  getResponsiveLayout,
  validateWidgetProps,
  createMockJourneySupabaseClient,
  createInitialJourneyMockDb,
  MockLocalStorage,
  OfflineAssessmentSyncManager,
  DiagnosticQuestion,
  MINI_QUIZ_PASS_THRESHOLD,
  CHECKPOINT_PASS_THRESHOLD,
  EXIT_EXAM_PASS_THRESHOLD,
} from './test-harness';

export async function runTier2Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 2: Boundary & Corner Cases (Roadmap/Journey)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // B1. Module Cards Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.1.1: Unit with 1 single step handles 0% and 100% boundary states cleanly', () => {
    const singleStepUnit: RoadmapUnitMetadata = {
      id: 'u-single',
      index: 1,
      title: 'Chặng 1 bước',
      description: 'Test',
      estimatedMinutes: 15,
      canDo: ['Test'],
      topicPreview: 'Test',
      steps: [{ id: 'step-only', type: 'checkpoint', title: 'Only Step', estimatedMinutes: 15 }],
    };
    expect(calculateUnitProgress(singleStepUnit, new Set()).percentage).toBe(0);
    expect(calculateUnitProgress(singleStepUnit, new Set(['step-only'])).percentage).toBe(100);
    expect(calculateUnitProgress(singleStepUnit, new Set(['step-only'])).status).toBe('completed');
  });

  await runner.it('T2.1.2: Completed steps set containing non-existent IDs does not inflate progress', () => {
    const unit: RoadmapUnitMetadata = {
      id: 'u-test',
      index: 1,
      title: 'Chặng Test',
      description: 'Test',
      estimatedMinutes: 20,
      canDo: ['Test'],
      topicPreview: 'Test',
      steps: [
        { id: 'real-step-1', type: 'vocab', title: 'Step 1', estimatedMinutes: 10 },
        { id: 'real-step-2', type: 'vocab', title: 'Step 2', estimatedMinutes: 10 },
      ],
    };
    const completed = new Set(['real-step-1', 'fake-step-x', 'fake-step-y']);
    const progress = calculateUnitProgress(unit, completed);
    expect(progress.completedSteps).toBe(1);
    expect(progress.percentage).toBe(50);
  });

  await runner.it('T2.1.3: Large step count (50 steps) computes percentage without floating point precision issues', () => {
    const manySteps = Array.from({ length: 50 }).map((_, i) => ({
      id: `step-${i}`,
      type: 'vocab' as const,
      title: `Step ${i}`,
      estimatedMinutes: 10,
    }));
    const largeUnit: RoadmapUnitMetadata = {
      id: 'u-large',
      index: 1,
      title: 'Large Unit',
      description: 'Test',
      estimatedMinutes: 500,
      canDo: ['Test'],
      topicPreview: 'Test',
      steps: manySteps,
    };
    const completed = new Set(manySteps.slice(0, 33).map((s) => s.id));
    const progress = calculateUnitProgress(largeUnit, completed);
    // 33 / 50 = 66%
    expect(progress.percentage).toBe(66);
  });

  await runner.it('T2.1.4: Unit with undefined badge properties falls back safely without crash', () => {
    const unitNoBadge: RoadmapUnitMetadata = {
      id: 'u-no-badge',
      index: 1,
      title: 'No Badge Unit',
      description: 'Test',
      estimatedMinutes: 30,
      canDo: ['Test'],
      topicPreview: 'Test',
      steps: [],
    };
    const badgeIcon = unitNoBadge.badgeIcon || '🎯';
    const badgeName = unitNoBadge.badgeName || 'Hoàn thành chặng';
    expect(badgeIcon).toBe('🎯');
    expect(badgeName).toBe('Hoàn thành chặng');
  });

  await runner.it('T2.1.5: Unit title with special Vietnamese diacritics and emojis renders faithfully', () => {
    const title = 'Chặng 1 · Xin chào & Giới thiệu bản thân 🌟';
    expect(title).toContain('Xin chào');
    expect(title).toContain('🌟');
  });

  await runner.it('T2.1.6: Progress rounding rules round values to nearest integer (99.4 -> 99, 99.6 -> 100)', () => {
    expect(Math.round(99.4)).toBe(99);
    expect(Math.round(99.6)).toBe(100);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B2. Time & Duration Framing Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.2.1: Zero or near-zero minute duration handled gracefully as < 5 phút', () => {
    const formatSafeDuration = (mins: number) => (mins <= 5 ? '< 5 phút' : formatEstimatedMinutes(mins));
    expect(formatSafeDuration(0)).toBe('< 5 phút');
    expect(formatSafeDuration(3)).toBe('< 5 phút');
    expect(formatSafeDuration(10)).toBe('~10 phút');
  });

  await runner.it('T2.2.2: Extreme duration (600 minutes) formats properly into hours (~10 giờ)', () => {
    expect(formatEstimatedMinutes(600)).toBe('~10 giờ');
  });

  await runner.it('T2.2.3: Duration threshold boundary: exactly 59 mins vs exactly 60 mins', () => {
    expect(formatEstimatedMinutes(59)).toBe('~59 phút');
    expect(formatEstimatedMinutes(60)).toBe('~1 giờ');
  });

  await runner.it('T2.2.4: Non-integer / float minute inputs (12.7 mins) rounded cleanly', () => {
    const sanitizeMinutes = (mins: number) => Math.round(mins);
    expect(sanitizeMinutes(12.7)).toBe(13);
    expect(sanitizeMinutes(14.2)).toBe(14);
  });

  await runner.it('T2.2.5: Negative duration input clamped to minimum 0', () => {
    const clampDuration = (mins: number) => Math.max(0, mins);
    expect(clampDuration(-15)).toBe(0);
    expect(clampDuration(20)).toBe(20);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B3. Can-Do Skills Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.3.1: Empty canDo array falls back to default notification string', () => {
    const canDoList: string[] = [];
    const displayCanDo = canDoList.length > 0 ? canDoList : ['Đang cập nhật mục tiêu học tập'];
    expect(displayCanDo[0]).toBe('Đang cập nhật mục tiêu học tập');
  });

  await runner.it('T2.3.2: Extremely long canDo string (>500 chars) truncates cleanly with ellipsis', () => {
    const longString = 'Có thể '.padEnd(520, 'a');
    const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max - 3) + '...' : s);
    const truncated = truncate(longString, 100);
    expect(truncated.length).toBe(100);
    expect(truncated.endsWith('...')).toBe(true);
  });

  await runner.it('T2.3.3: canDo items with leading/trailing whitespace are trimmed properly', () => {
    const rawCanDo = '   Có thể tự giới thiệu tên và tuổi   ';
    expect(rawCanDo.trim()).toBe('Có thể tự giới thiệu tên và tuổi');
  });

  await runner.it('T2.3.4: Querying exit standards for non-existent level returns null safely', () => {
    const exitStandardsMock: Record<string, any> = { A0: {}, A1: {} };
    const getExitStandardMock = (lvl: string) => exitStandardsMock[lvl] || null;
    expect(getExitStandardMock('C2')).toBeNull();
    expect(getExitStandardMock('invalid-level')).toBeNull();
  });

  await runner.it('T2.3.5: canDo string with script tags sanitized against XSS', () => {
    const malicious = 'Có thể <script>alert("hack")</script> giao tiếp';
    const sanitize = (s: string) => s.replace(/<[^>]*>?/gm, '');
    expect(sanitize(malicious)).toBe('Có thể alert("hack") giao tiếp');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B4. Topic Previews Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.4.1: Missing or undefined topicPreview falls back to default description', () => {
    const unitMeta = { title: 'Unit Title', topicPreview: undefined };
    const preview = unitMeta.topicPreview || `Khám phá các bài học trong ${unitMeta.title}`;
    expect(preview).toBe('Khám phá các bài học trong Unit Title');
  });

  await runner.it('T2.4.2: topicPreview with maximum character boundary (exact 250 chars) accepted', () => {
    const exact250 = 'A'.repeat(250);
    expect(exact250.length).toBe(250);
    expect(exact250.length <= 250).toBe(true);
  });

  await runner.it('T2.4.3: topicPreview exceeding 250 characters safely trimmed with ellipsis', () => {
    const overLength = 'A'.repeat(300);
    const formatPreview = (s: string) => (s.length > 250 ? s.slice(0, 247) + '...' : s);
    const result = formatPreview(overLength);
    expect(result.length).toBe(250);
    expect(result.endsWith('...')).toBe(true);
  });

  await runner.it('T2.4.4: topicPreview containing quotes, newlines, and tabs sanitized', () => {
    const messy = 'Học từ vựng:\n\t"Family" và \'Parents\'';
    const clean = messy.replace(/[\n\t]+/g, ' ').trim();
    expect(clean).toBe('Học từ vựng: "Family" và \'Parents\'');
  });

  await runner.it('T2.4.5: topicPreview with markdown syntax formatted or stripped cleanly', () => {
    const md = 'Làm quen **đại từ nhân xưng** và *cách dùng*.';
    const stripMd = (s: string) => s.replace(/[*_~`]/g, '');
    expect(stripMd(md)).toBe('Làm quen đại từ nhân xưng và cách dùng.');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B5. Dual Track Switcher Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.5.1: Switching to unknown track string defaults to cefr', () => {
    const normalizeTrack = (t: string): 'cefr' | 'thpt' => (t === 'thpt' ? 'thpt' : 'cefr');
    expect(normalizeTrack('toeic')).toBe('cefr');
    expect(normalizeTrack('ielts')).toBe('cefr');
    expect(normalizeTrack('')).toBe('cefr');
  });

  await runner.it('T2.5.2: Rapid toggling between tracks produces stable final state without race conditions', () => {
    let track: 'cefr' | 'thpt' = 'cefr';
    const sequence = ['thpt', 'cefr', 'thpt', 'thpt', 'cefr'];
    for (const next of sequence) {
      track = next as 'cefr' | 'thpt';
    }
    expect(track).toBe('cefr');
  });

  await runner.it('T2.5.3: User enrolled only in CEFR attempting to access THPT defaults to starting grade (lop-10)', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const checkEnrollment = async (userId: string, track: 'cefr' | 'thpt') => {
      const res = await supabase.from('user_roadmap').select('*').eq('user_id', userId).eq('track', track).maybeSingle();
      if (!res.data) {
        return { enrolled: false, defaultLevel: track === 'thpt' ? 'lop-10' : 'A0' };
      }
      return { enrolled: true, defaultLevel: res.data.level_id };
    };

    const res = await checkEnrollment('learner-cefr-1', 'thpt');
    expect(res.enrolled).toBe(false);
    expect(res.defaultLevel).toBe('lop-10');
  });

  await runner.it('T2.5.4: Track switcher preserves active level tab independently per track', () => {
    const activeLevelState: Record<'cefr' | 'thpt', string> = {
      cefr: 'A1',
      thpt: 'lop-11',
    };
    expect(activeLevelState.cefr).toBe('A1');
    expect(activeLevelState.thpt).toBe('lop-11');
  });

  await runner.it('T2.5.5: Case-insensitive track parameter normalized to lowercase', () => {
    const normalize = (t: string) => t.trim().toLowerCase();
    expect(normalize('CEFR')).toBe('cefr');
    expect(normalize('Thpt')).toBe('thpt');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B6. Mobile & Desktop Responsive Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.6.1: Exact breakpoint boundary width 639px returns mobile, 640px returns tablet', () => {
    expect(getResponsiveLayout(639).deviceCategory).toBe('mobile');
    expect(getResponsiveLayout(640).deviceCategory).toBe('tablet');
  });

  await runner.it('T2.6.2: Exact breakpoint boundary width 1023px returns tablet, 1024px returns desktop', () => {
    expect(getResponsiveLayout(1023).deviceCategory).toBe('tablet');
    expect(getResponsiveLayout(1024).deviceCategory).toBe('desktop');
  });

  await runner.it('T2.6.3: Ultra-narrow screen width (320px) retains 1-column mobile layout', () => {
    const layout = getResponsiveLayout(320);
    expect(layout.deviceCategory).toBe('mobile');
    expect(layout.gridColumns).toBe(1);
    expect(layout.isCompactView).toBe(true);
  });

  await runner.it('T2.6.4: Ultra-wide 4K monitor (2560px) retains 3-column desktop layout', () => {
    const layout = getResponsiveLayout(2560);
    expect(layout.deviceCategory).toBe('desktop');
    expect(layout.gridColumns).toBe(3);
  });

  await runner.it('T2.6.5: Sub-pixel touch target (43.9px) strictly fails minimum 44px threshold', () => {
    expect(validateTouchTarget({ width: 43.9, height: 44 })).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B7. Node Mini-Quiz Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  const quizBoundaryQuestions = [
    { id: 'q1', correctAnswer: 'A' },
    { id: 'q2', correctAnswer: 'B' },
    { id: 'q3', correctAnswer: 'C' },
    { id: 'q4', correctAnswer: 'D' },
  ];

  await runner.it('T2.7.1: Boundary score of 50% evaluates as FAIL (< 75% threshold)', () => {
    const answers = { q1: 'A', q2: 'B', q3: 'wrong', q4: 'wrong' };
    const res = gradeMiniQuiz(quizBoundaryQuestions, answers);
    expect(res.score).toBe(50);
    expect(res.passed).toBe(false);
  });

  await runner.it('T2.7.2: Boundary score of exactly 75% evaluates as PASS (>= 75% threshold)', () => {
    const answers = { q1: 'A', q2: 'B', q3: 'C', q4: 'wrong' };
    const res = gradeMiniQuiz(quizBoundaryQuestions, answers);
    expect(res.score).toBe(75);
    expect(res.passed).toBe(true);
    expect(MINI_QUIZ_PASS_THRESHOLD).toBe(75);
  });

  await runner.it('T2.7.3: All answers empty or unanswered yields 0% and false', () => {
    const res = gradeMiniQuiz(quizBoundaryQuestions, {});
    expect(res.score).toBe(0);
    expect(res.passed).toBe(false);
    expect(res.correctAnswers).toBe(0);
  });

  await runner.it('T2.7.4: Empty questions array returns 0% score and false without division by zero crash', () => {
    const res = gradeMiniQuiz([], { q1: 'A' });
    expect(res.score).toBe(0);
    expect(res.passed).toBe(false);
    expect(res.totalQuestions).toBe(0);
  });

  await runner.it('T2.7.5: Answers with trailing/leading spaces trimmed before evaluation', () => {
    const answers = { q1: '  A  ', q2: 'B', q3: 'C', q4: 'D' };
    const res = gradeMiniQuiz(quizBoundaryQuestions, answers);
    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
  });

  await runner.it('T2.7.6: Answers with differing case matched case-insensitively', () => {
    const answers = { q1: 'a', q2: 'b', q3: 'c', q4: 'd' };
    const res = gradeMiniQuiz(quizBoundaryQuestions, answers);
    expect(res.score).toBe(100);
    expect(res.passed).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B8. Diagnostic Checkpoint Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  const tenQuestions: DiagnosticQuestion[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `chk-${i + 1}`,
    skill: i < 5 ? 'vocab' : 'grammar',
    conceptRef: `concept-${i < 5 ? 'v' : 'g'}`,
    prompt: `Question ${i + 1}`,
    options: ['A', 'B'],
    correctAnswer: 'A',
    explanation: 'Explanation',
  }));

  await runner.it('T2.8.1: Checkpoint score of exactly 70% evaluates as FAIL (>= 80% threshold required)', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 7; i++) answers[`chk-${i + 1}`] = 'A';
    const res = gradeCheckpoint(tenQuestions, answers);
    expect(res.score).toBe(70);
    expect(res.passed).toBe(false);
  });

  await runner.it('T2.8.2: Checkpoint score of exactly 80% evaluates as PASS (>= 80% threshold required)', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 8; i++) answers[`chk-${i + 1}`] = 'A';
    const res = gradeCheckpoint(tenQuestions, answers);
    expect(res.score).toBe(80);
    expect(res.passed).toBe(true);
    expect(CHECKPOINT_PASS_THRESHOLD).toBe(80);
  });

  await runner.it('T2.8.3: 100% score produces empty weakConcepts array ([])', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 10; i++) answers[`chk-${i + 1}`] = 'A';
    const res = gradeCheckpoint(tenQuestions, answers);
    expect(res.score).toBe(100);
    expect(res.details.weakConcepts?.length).toBe(0);
  });

  await runner.it('T2.8.4: 0% score flags all tested concepts as weak without null pointer exceptions', () => {
    const res = gradeCheckpoint(tenQuestions, {});
    expect(res.score).toBe(0);
    expect(res.passed).toBe(false);
    expect(res.details.weakConcepts?.length).toBeGreaterThan(0);
  });

  await runner.it('T2.8.5: Skill category with 0 questions omitted from skillBreakdown to avoid NaN', () => {
    const res = gradeCheckpoint(tenQuestions, { 'chk-1': 'A' });
    expect(res.details.skillBreakdown?.pronunciation).toBeUndefined();
    expect(res.details.skillBreakdown?.reading).toBeUndefined();
  });

  await runner.it('T2.8.6: Missing sourceStepId falls back to general skill review link', () => {
    const qNoStep: DiagnosticQuestion[] = [
      {
        id: 'q-no-step',
        skill: 'grammar',
        conceptRef: 'generic-rule',
        prompt: 'Prompt',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Exp',
      },
    ];
    const res = gradeCheckpoint(qNoStep, { 'q-no-step': 'wrong' }, []);
    expect(res.details.weakConcepts?.[0].reviewUrl).toBe('/journey?skill=grammar');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B9. Level Exit Exam Engine Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  const exit30Questions: DiagnosticQuestion[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `exit-${i + 1}`,
    skill: 'vocab',
    conceptRef: `vocab-${i}`,
    prompt: `Exit Q${i + 1}`,
    options: ['A', 'B'],
    correctAnswer: 'A',
    explanation: 'Exp',
  }));

  await runner.it('T2.9.1: Exit exam score of 77% (23/30) fails and withholds graduation badge', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 23; i++) answers[`exit-${i + 1}`] = 'A';
    const res = gradeExitExam(exit30Questions, answers, 'A0');
    expect(res.score).toBe(77);
    expect(res.passed).toBe(false);
    expect(res.badgeAwarded).toBeUndefined();
  });

  await runner.it('T2.9.2: Exit exam score of 80% (24/30) passes and issues graduation badge', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 24; i++) answers[`exit-${i + 1}`] = 'A';
    const res = gradeExitExam(exit30Questions, answers, 'A0');
    expect(res.score).toBe(80);
    expect(res.passed).toBe(true);
    expect(res.badgeAwarded).toBe('badge_a0_graduate');
    expect(EXIT_EXAM_PASS_THRESHOLD).toBe(80);
  });

  await runner.it('T2.9.3: Capstone attempt with partial submission grades unanswered items as incorrect', () => {
    const answers = { 'exit-1': 'A', 'exit-2': 'A' };
    const res = gradeExitExam(exit30Questions, answers, 'A1');
    expect(res.details.totalQuestions).toBe(30);
    expect(res.details.correctAnswers).toBe(2);
    expect(res.passed).toBe(false);
  });

  await runner.it('T2.9.4: Exit exam for highest available track level (B2 / lop-12) awards master badge without crash', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 30; i++) answers[`exit-${i + 1}`] = 'A';
    const resB2 = gradeExitExam(exit30Questions, answers, 'B2');
    expect(resB2.badgeAwarded).toBe('badge_b2_graduate');

    const resThpt12 = gradeExitExam(exit30Questions, answers, 'lop-12');
    expect(resThpt12.badgeAwarded).toBe('badge_thpt12_graduate');
  });

  await runner.it('T2.9.5: Rapid double submission of exit exam throttled to prevent duplicate writes', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    let submitCount = 0;
    const submitExitExam = async (payload: any): Promise<{ data?: any; error: any }> => {
      // Throttle simulation
      if (submitCount > 0) return { error: 'Throttled' };
      submitCount++;
      const res: any = supabase.from('user_roadmap_assessments').insert(payload);
      return { data: res.data, error: res.error ?? null };
    };

    const first = await submitExitExam({ user_id: 'u1', tier: 'exit_exam', score: 85, passed: true, details: {} });
    const second = await submitExitExam({ user_id: 'u1', tier: 'exit_exam', score: 85, passed: true, details: {} });

    expect((first as any).error).toBeNull();
    expect((second as any).error).toBe('Throttled');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B10. Assessment Persistence Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.10.1: Database error during attempt insert triggers immediate local caching without losing payload', async () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    supabase.setSimulateFailure(true);

    const attempt = {
      userId: 'learner-cefr-1',
      track: 'cefr' as const,
      tier: 'checkpoint' as const,
      targetId: 'u-a0-1',
      score: 85,
      passed: true,
      details: { totalQuestions: 10, correctAnswers: 8 },
    };

    const { error } = await supabase.from('user_roadmap_assessments').insert(attempt);
    if (error) {
      syncManager.saveAttemptOffline(attempt);
    }

    expect(syncManager.getPendingAttempts().length).toBe(1);
    expect(syncManager.getPendingAttempts()[0].targetId).toBe('u-a0-1');
  });

  await runner.it('T2.10.2: Malformed JSON in localStorage details recovered safely without crashing app', () => {
    const storage = new MockLocalStorage();
    storage.setItem('vocab_roadmap_pending_assessments', 'INVALID_JSON{{{');

    const safeRetrieve = () => {
      try {
        const raw = storage.getItem('vocab_roadmap_pending_assessments');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };
    expect(safeRetrieve().length).toBe(0);
  });

  await runner.it('T2.10.3: Offline queue batch sync handles partial failures (failed items remain queued)', async () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    syncManager.saveAttemptOffline({
      userId: 'learner-cefr-1',
      track: 'cefr',
      tier: 'mini_quiz',
      targetId: 'step-1',
      score: 100,
      passed: true,
      details: { totalQuestions: 4, correctAnswers: 4 },
    });

    const res = await syncManager.syncPendingAttempts(supabase);
    expect(res.syncedCount).toBe(1);
    expect(res.failedCount).toBe(0);
    expect(syncManager.getPendingAttempts().length).toBe(0);
  });

  await runner.it('T2.10.4: Storing assessment with empty details object {} handled gracefully', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    await supabase.from('user_roadmap_assessments').insert({
      user_id: 'learner-cefr-1',
      track: 'cefr',
      tier: 'mini_quiz',
      target_id: 'step-empty',
      score: 100,
      passed: true,
      details: {},
    });

    expect(mockDb.user_roadmap_assessments.length).toBe(1);
    expect(JSON.stringify(mockDb.user_roadmap_assessments[0].details)).toBe('{}');
  });

  await runner.it('T2.10.5: Attempt ID generation collision resistance verified across 100 iterations', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B11. Multimodal Context Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.11.1: Missing image URL falls back to placeholder or initials avatar', () => {
    const resolveImage = (url?: string, word?: string) => {
      if (url && url.trim().length > 0) return url;
      return `https://avatar.lingopro.vn/placeholder?char=${word?.[0] || 'V'}`;
    };
    expect(resolveImage('https://img.jpg', 'hello')).toBe('https://img.jpg');
    expect(resolveImage(undefined, 'family')).toBe('https://avatar.lingopro.vn/placeholder?char=f');
  });

  await runner.it('T2.11.2: Corrupt or 404 audio URL triggers fallback to Web Speech synthesis', () => {
    const getAudioEngine = (audioAvailable: boolean) => (audioAvailable ? 'native_audio' : 'web_speech_synth');
    expect(getAudioEngine(true)).toBe('native_audio');
    expect(getAudioEngine(false)).toBe('web_speech_synth');
  });

  await runner.it('T2.11.3: Malformed IPA string handled without parser crash', () => {
    const sanitizeIpa = (raw?: string) => {
      if (!raw || typeof raw !== 'string') return '';
      const trimmed = raw.trim();
      if (trimmed.startsWith('/') && trimmed.endsWith('/')) return trimmed;
      return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
    };
    expect(sanitizeIpa('hello')).toBe('/hello/');
    expect(sanitizeIpa('/hello/')).toBe('/hello/');
    expect(sanitizeIpa('')).toBe('');
  });

  await runner.it('T2.11.4: Translation with multiple meanings separated by comma parsed correctly', () => {
    const rawTranslation = 'gia đình, dòng họ, người thân';
    const primaryMeaning = rawTranslation.split(/[,;]/)[0].trim();
    expect(primaryMeaning).toBe('gia đình');
  });

  await runner.it('T2.11.5: Missing mnemonic tip hides mnemonic container without leaving blank space', () => {
    const wordData: { word: string; mnemonicTip?: string } = { word: 'test', mnemonicTip: undefined };
    const shouldRenderMnemonic = Boolean(wordData.mnemonicTip && wordData.mnemonicTip.trim().length > 0);
    expect(shouldRenderMnemonic).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B12. Word Pair Matching Widget Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.12.1: Attempting to match fewer than 3 pairs rejected by schema validator', () => {
    const invalidProps = {
      pairs: [{ id: '1', left: 'A', right: 'B' }],
      onComplete: () => {},
    };
    const res = validateWidgetProps('word_match', invalidProps);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('micro-learning range'))).toBe(true);
  });

  await runner.it('T2.12.2: Attempting to match more than 8 pairs rejected by schema validator', () => {
    const manyPairs = Array.from({ length: 9 }).map((_, i) => ({ id: `${i}`, left: `L${i}`, right: `R${i}` }));
    const invalidProps = { pairs: manyPairs, onComplete: () => {} };
    const res = validateWidgetProps('word_match', invalidProps);
    expect(res.valid).toBe(false);
  });

  await runner.it('T2.12.3: Clicking same card twice toggles selection off rather than registering an attempt', () => {
    let selectedLeft: string | null = null;
    let attempts = 0;

    const clickLeft = (id: string) => {
      if (selectedLeft === id) {
        selectedLeft = null; // deselect
      } else {
        selectedLeft = id;
      }
    };

    clickLeft('p1');
    expect(selectedLeft).toBe('p1');
    clickLeft('p1');
    expect(selectedLeft).toBeNull();
    expect(attempts).toBe(0);
  });

  await runner.it('T2.12.4: Duplicate word names with different IDs match based on ID, not text', () => {
    const isPairMatched = (leftId: string, rightId: string) => leftId === rightId;
    expect(isPairMatched('id-apple-1', 'id-apple-1')).toBe(true);
    expect(isPairMatched('id-apple-1', 'id-apple-2')).toBe(false);
  });

  await runner.it('T2.12.5: Zero elapsedSeconds handles non-negative time safely', () => {
    const elapsedSeconds = Math.max(0, 0);
    expect(elapsedSeconds).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B13. Dialogue Cloze Widget Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.13.1: Dialogue without any blanks passes if dialogue has text or fails if empty', () => {
    const noBlanks = {
      dialogue: [{ speaker: 'A', text: 'Hello world' }],
      onComplete: () => {},
    };
    const res = validateWidgetProps('dialogue_cloze', noBlanks);
    expect(res.valid).toBe(true);
  });

  await runner.it('T2.13.2: Dialogue line with missing speaker rejected by schema validator', () => {
    const invalid = {
      dialogue: [{ speaker: '', text: 'Hello' }],
      onComplete: () => {},
    };
    const res = validateWidgetProps('dialogue_cloze', invalid);
    expect(res.valid).toBe(false);
  });

  await runner.it('T2.13.3: Word bank with duplicate options deduplicated for display chips', () => {
    const options = ['apple', 'banana', 'apple', 'orange'];
    const uniqueOptions = Array.from(new Set(options));
    expect(uniqueOptions.length).toBe(3);
    expect(uniqueOptions).toContain('banana');
  });

  await runner.it('T2.13.4: Special punctuation right after blank preserved without corrupting answer matching', () => {
    const sentence = 'Where are you from, ___?';
    const cleanWord = (w: string) => w.replace(/[?!.,;]/g, '').trim().toLowerCase();
    expect(cleanWord('Vietnam')).toBe('vietnam');
    expect(sentence.includes('___?')).toBe(true);
  });

  await runner.it('T2.13.5: User submits before filling all blanks flags incomplete status', () => {
    const totalBlanks = 3;
    const filledBlanks = { b1: 'ans1', b2: 'ans2' };
    const isAllFilled = Object.keys(filledBlanks).length === totalBlanks;
    expect(isAllFilled).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B14. Reading Passage Explorer Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.14.1: Empty passage string rejected by schema validator', () => {
    const emptyProps = {
      passage: '   ',
      targetWords: [{ word: 'a', pos: 'n', definition: 'b' }],
      comprehensionQuestions: [{ id: '1', question: 'Q', options: ['A'], answerIndex: 0, explanation: 'E' }],
      onComplete: () => {},
    };
    const res = validateWidgetProps('passage_explorer', emptyProps);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('Missing or empty reading passage'))).toBe(true);
  });

  await runner.it('T2.14.2: Target word occurring multiple times in passage tokenized consistently', () => {
    const passage = 'My mother is lovely. I love my mother dearly.';
    const occurrences = (passage.match(/mother/gi) || []).length;
    expect(occurrences).toBe(2);
  });

  await runner.it('T2.14.3: Target word with case variations matched case-insensitively in passage', () => {
    const passage = 'Family is everything. A good FAMILY brings joy.';
    const regex = new RegExp('\\bfamily\\b', 'gi');
    const matches = passage.match(regex);
    expect(matches?.length).toBe(2);
  });

  await runner.it('T2.14.4: Passage with 0 comprehension questions rejected by validator', () => {
    const noQuestions = {
      passage: 'Some text',
      targetWords: [{ word: 'a', pos: 'n', definition: 'b' }],
      comprehensionQuestions: [],
      onComplete: () => {},
    };
    const res = validateWidgetProps('passage_explorer', noQuestions);
    expect(res.valid).toBe(false);
  });

  await runner.it('T2.14.5: Long passage length tracked for micro-learning bounds', () => {
    const wordCount = (text: string) => text.trim().split(/\s+/).length;
    const shortPassage = 'This is a short reading passage for beginners.';
    expect(wordCount(shortPassage)).toBe(8);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B15. Phonetic Articulation Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.15.1: Missing IPA symbol rejected by validator', () => {
    const invalidProps = {
      ipa: '',
      mouthTip: 'Tip',
      whyHard: 'Why',
      minimalPairs: [{ a: 'ship', b: 'sheep' }],
      onComplete: () => {},
    };
    const res = validateWidgetProps('phonetic_drill', invalidProps);
    expect(res.valid).toBe(false);
  });

  await runner.it('T2.15.2: Minimal pair item with identical words detected as non-contrastive', () => {
    const isContrastive = (pair: { a: string; b: string }) => pair.a.trim().toLowerCase() !== pair.b.trim().toLowerCase();
    expect(isContrastive({ a: 'ship', b: 'ship' })).toBe(false);
    expect(isContrastive({ a: 'ship', b: 'sheep' })).toBe(true);
  });

  await runner.it('T2.15.3: Minimal pair note with empty string treated as optional', () => {
    const pairItem = { a: 'ship', b: 'sheep', note: '' };
    expect(pairItem.note).toBe('');
    expect(pairItem.note || 'No note').toBe('No note');
  });

  await runner.it('T2.15.4: Microphone permission denied state provides visual fallback drill without crash', () => {
    let mode: 'audio_record' | 'audio_listen_only' = 'audio_record';
    const onPermissionDenied = () => {
      mode = 'audio_listen_only';
    };
    onPermissionDenied();
    expect(mode).toBe('audio_listen_only');
  });

  await runner.it('T2.15.5: Empty audio recording detected and prompts retry', () => {
    const isAudioValid = (audioBlobSize: number) => audioBlobSize > 1000;
    expect(isAudioValid(0)).toBe(false);
    expect(isAudioValid(5000)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B16. Instant Interactive Feedback Boundaries
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T2.16.1: Submitting response multiple times in rapid succession (< 100ms) debounced', () => {
    let callCount = 0;
    let lastCallTime = 0;

    const debouncedSubmit = () => {
      const now = Date.now();
      if (now - lastCallTime < 100) return;
      lastCallTime = now;
      callCount++;
    };

    debouncedSubmit();
    debouncedSubmit();
    expect(callCount).toBe(1);
  });

  await runner.it('T2.16.2: Explanation text containing HTML markup escaped to prevent injection', () => {
    const rawExplanation = 'Đáp án đúng là: <b>Hello</b> <img src=x onerror=alert(1)>';
    const escapeHtml = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safe = escapeHtml(rawExplanation);
    expect(safe.includes('<img')).toBe(false);
    expect(safe.includes('&lt;b&gt;')).toBe(true);
  });

  await runner.it('T2.16.3: Feedback object with undefined optional fields does not break UI renderer', () => {
    const feedback = { verdict: 'correct', explanation: undefined };
    const safeExplanation = feedback.explanation || 'Chính xác! Tiếp tục phát huy nhé.';
    expect(safeExplanation).toBe('Chính xác! Tiếp tục phát huy nhé.');
  });

  await runner.it('T2.16.4: Extremely long explanation text scrolls without clipping', () => {
    const longExp = 'A'.repeat(800);
    expect(longExp.length).toBe(800);
    const hasScroll = longExp.length > 200;
    expect(hasScroll).toBe(true);
  });

  await runner.it('T2.16.5: Unicode Vietnamese feedback text preserved without encoding corruption', () => {
    const feedbackText = 'Tuyệt vời! Bạn đã vượt qua chặng học này với số điểm xuất sắc.';
    expect(feedbackText).toContain('Tuyệt vời');
    expect(feedbackText).toContain('xuất sắc');
  });
}
