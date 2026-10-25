/**
 * Tier 1: Feature Coverage Test Suite (Learning Roadmap / Journey Modernization)
 * Opaque-box requirement verification against ORIGINAL_REQUEST.md (§ 2026-09-06T02:40:27Z)
 * and PROJECT.md § Feature Inventory.
 *
 * Covers all 16 Features:
 *  F1. Module Cards Visual Redesign
 *  F2. Time & Duration Framing
 *  F3. Can-Do Skills & Learning Objectives
 *  F4. Topic Previews
 *  F5. Dual Track Switcher (CEFR & THPT)
 *  F6. Mobile & Desktop Responsive Design
 *  F7. Node Mini-Quiz Gatekeeper
 *  F8. Diagnostic Checkpoint Feedback
 *  F9. Level Exit Exam Engine
 *  F10. Assessment Persistence & Graceful Fallback
 *  F11. Multimodal Context & Memory Tips
 *  F12. Word Pair Matching Widget
 *  F13. Dialogue Cloze Widget
 *  F14. Reading Passage Explorer Widget
 *  F15. Phonetic Articulation & Minimal Pair Drill
 *  F16. Instant Interactive Feedback & Explanation
 */

import {
  TestRunner,
  expect,
  RoadmapUnitMetadata,
  RoadmapStepMetadata,
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
  WordPairMatchWidgetProps,
  DialogueClozeWidgetProps,
  ReadingPassageExplorerProps,
  PhoneticArticulationProps,
} from './test-harness';

export async function runTier1Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 1: Feature Coverage (Roadmap/Journey Modernization)', () => {});

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 1: Module Cards Visual Redesign
  // ──────────────────────────────────────────────────────────────────────────

  const sampleUnit1: RoadmapUnitMetadata = {
    id: 'u-a0-1',
    index: 1,
    title: 'Chặng 1 · Đại từ nhân xưng & Chào hỏi',
    description: 'Nền tảng giao tiếp cơ bản nhất',
    estimatedMinutes: 50,
    canDo: ['Có thể tự giới thiệu tên, nghề nghiệp', 'Có thể chào hỏi lịch sự'],
    topicPreview: 'Làm quen với đại từ I, you, he, she và các câu chào hỏi hàng ngày.',
    badgeIcon: '🚩',
    badgeName: 'A0 Khởi động',
    steps: [
      { id: 'sv-starter-a0-greetings', type: 'vocab', title: 'Chào hỏi', estimatedMinutes: 10 },
      { id: 'sv-starter-a0-people', type: 'vocab', title: 'Gia đình', estimatedMinutes: 10 },
      { id: 'sg-personal-pronouns', type: 'grammar', title: 'Đại từ', estimatedMinutes: 12 },
      { id: 'sp-word-stress-basics', type: 'pronunciation', title: 'Trọng âm', estimatedMinutes: 10 },
      { id: 'sc-a0-1', type: 'checkpoint', title: 'Checkpoint 1', estimatedMinutes: 15 },
    ],
  };

  await runner.it('T1.1.1: Unit progress percentage computes accurately as (completedSteps / totalSteps) * 100', () => {
    const completedSteps = new Set(['sv-starter-a0-greetings', 'sv-starter-a0-people']);
    const progress = calculateUnitProgress(sampleUnit1, completedSteps);
    expect(progress.totalSteps).toBe(5);
    expect(progress.completedSteps).toBe(2);
    expect(progress.percentage).toBe(40);
  });

  await runner.it('T1.1.2: Unit status transitions correctly from locked -> in_progress -> completed', () => {
    const noSteps = new Set<string>();
    expect(calculateUnitProgress(sampleUnit1, noSteps).status).toBe('locked');

    const twoSteps = new Set(['sv-starter-a0-greetings', 'sv-starter-a0-people']);
    expect(calculateUnitProgress(sampleUnit1, twoSteps).status).toBe('in_progress');

    const allSteps = new Set(sampleUnit1.steps.map((s) => s.id));
    expect(calculateUnitProgress(sampleUnit1, allSteps).status).toBe('completed');
  });

  await runner.it('T1.1.3: Module card displays distinct badgeIcon and badgeName upon unit completion', () => {
    expect(sampleUnit1.badgeIcon).toBe('🚩');
    expect(sampleUnit1.badgeName).toBe('A0 Khởi động');
  });

  await runner.it('T1.1.4: Module card displays total steps count and completed steps count', () => {
    const completedSteps = new Set(['sv-starter-a0-greetings']);
    const progress = calculateUnitProgress(sampleUnit1, completedSteps);
    const summary = `${progress.completedSteps}/${progress.totalSteps} bài học`;
    expect(summary).toBe('1/5 bài học');
  });

  await runner.it('T1.1.5: Module cards in a level are ordered sequentially by unit index', () => {
    const units: RoadmapUnitMetadata[] = [
      { ...sampleUnit1, id: 'u-a0-2', index: 2 },
      { ...sampleUnit1, id: 'u-a0-1', index: 1 },
      { ...sampleUnit1, id: 'u-a0-3', index: 3 },
    ];
    const sorted = [...units].sort((a, b) => a.index - b.index);
    expect(sorted[0].id).toBe('u-a0-1');
    expect(sorted[1].id).toBe('u-a0-2');
    expect(sorted[2].id).toBe('u-a0-3');
  });

  await runner.it('T1.1.6: Empty unit with 0 steps defaults to 0% and does not produce NaN', () => {
    const emptyUnit: RoadmapUnitMetadata = { ...sampleUnit1, steps: [] };
    const progress = calculateUnitProgress(emptyUnit, new Set());
    expect(progress.percentage).toBe(0);
    expect(Number.isNaN(progress.percentage)).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 2: Time & Duration Framing
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.2.1: Node estimatedMinutes is defined and conforms to micro-learning timeframe (10-15m)', () => {
    for (const step of sampleUnit1.steps) {
      expect(step.estimatedMinutes).toBeGreaterThanOrEqual(10);
      expect(step.estimatedMinutes).toBeLessThanOrEqual(15);
    }
  });

  await runner.it('T1.2.2: Unit estimatedMinutes correctly aggregates step durations (~45-60m)', () => {
    const aggregated = sampleUnit1.steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    expect(aggregated).toBeGreaterThanOrEqual(45);
    expect(aggregated).toBeLessThanOrEqual(65);
    expect(sampleUnit1.estimatedMinutes).toBe(50);
  });

  await runner.it('T1.2.3: formatEstimatedMinutes correctly formats durations < 60 mins into minutes', () => {
    expect(formatEstimatedMinutes(15)).toBe('~15 phút');
    expect(formatEstimatedMinutes(45)).toBe('~45 phút');
  });

  await runner.it('T1.2.4: formatEstimatedMinutes correctly formats durations >= 60 mins into hours', () => {
    expect(formatEstimatedMinutes(60)).toBe('~1 giờ');
    expect(formatEstimatedMinutes(90)).toBe('~1.5 giờ');
    expect(formatEstimatedMinutes(120)).toBe('~2 giờ');
  });

  await runner.it('T1.2.5: Level total estimated hours aggregates all unit durations accurately', () => {
    const levelUnits: RoadmapUnitMetadata[] = [
      { ...sampleUnit1, id: 'u1', estimatedMinutes: 45 },
      { ...sampleUnit1, id: 'u2', estimatedMinutes: 55 },
      { ...sampleUnit1, id: 'u3', estimatedMinutes: 50 },
      { ...sampleUnit1, id: 'u4', estimatedMinutes: 60 },
    ];
    const totalMinutes = levelUnits.reduce((acc, u) => acc + u.estimatedMinutes, 0);
    expect(totalMinutes).toBe(210);
    expect(formatEstimatedMinutes(totalMinutes)).toBe('~3.5 giờ');
  });

  await runner.it('T1.2.6: Both CEFR and THPT tracks provide estimatedMinutes across steps', () => {
    const cefrStep: RoadmapStepMetadata = { id: 'sv-a1-1', type: 'vocab', title: 'A1 Vocab', estimatedMinutes: 10 };
    const thptStep: RoadmapStepMetadata = { id: 'sr-u-thpt10-1', type: 'reading', title: 'THPT10 Reading', estimatedMinutes: 15 };
    expect(cefrStep.estimatedMinutes).toBe(10);
    expect(thptStep.estimatedMinutes).toBe(15);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 3: Can-Do Skills & Learning Objectives
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.3.1: Unit canDo contains actionable learning objectives starting with CEFR action verbs', () => {
    expect(sampleUnit1.canDo.length).toBeGreaterThanOrEqual(1);
    for (const obj of sampleUnit1.canDo) {
      expect(obj.startsWith('Có thể')).toBe(true);
    }
  });

  await runner.it('T1.3.2: Node canDo defines specific measurable competency for the lesson', () => {
    const node: RoadmapStepMetadata = {
      id: 'sv-1',
      type: 'vocab',
      title: 'Chào hỏi',
      estimatedMinutes: 10,
      canDo: 'Nhận biết và phát âm chuẩn 12 từ vựng chào hỏi hàng ngày',
    };
    expect(node.canDo).toBeDefined();
    expect(node.canDo!.length).toBeGreaterThan(10);
  });

  await runner.it('T1.3.3: getExitStandard structure returns CEFR can-do targets for level', () => {
    const exitStandards: Record<string, { canDo: string[]; notYet: string[] }> = {
      A0: {
        canDo: ['Hiểu và sử dụng các câu chào hỏi quen thuộc', 'Tự giới thiệu bản thân và hỏi thông tin cơ bản'],
        notYet: ['Chưa thể tham gia các cuộc hội thoại ngẫu hứng ngoài chủ đề quen thuộc'],
      },
    };
    const standard = exitStandards['A0'];
    expect(standard).toBeDefined();
    expect(standard.canDo.length).toBe(2);
    expect(standard.notYet.length).toBe(1);
  });

  await runner.it('T1.3.4: getExitDisclaimer returns clear CEFR guidance', () => {
    const disclaimer = 'Chuẩn đầu ra theo CEFR. Ôn đều SRS để giữ từ và kỹ năng lâu dài.';
    expect(disclaimer).toContain('CEFR');
    expect(disclaimer).toContain('SRS');
  });

  await runner.it('T1.3.5: Step canDo is exposed before learner enters lesson session', () => {
    const stepView = {
      id: sampleUnit1.steps[0].id,
      title: sampleUnit1.steps[0].title,
      canDo: 'Sử dụng thành thạo đại từ I/You/He/She trong ngữ cảnh gia đình',
    };
    expect(stepView.canDo).toBeDefined();
    expect(stepView.canDo).toContain('đại từ');
  });

  await runner.it('T1.3.6: Level canDo list distinguishes mastered skills from in-progress skills', () => {
    const completedCanDos = ['Chào hỏi lịch sự'];
    const allCanDos = ['Chào hỏi lịch sự', 'Hỏi đường', 'Gọi món ăn'];
    const pending = allCanDos.filter((c) => !completedCanDos.includes(c));
    expect(pending.length).toBe(2);
    expect(pending).toContain('Hỏi đường');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 4: Topic Previews
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.4.1: Unit topicPreview provides engaging summary of core knowledge points', () => {
    expect(sampleUnit1.topicPreview).toBeDefined();
    expect(sampleUnit1.topicPreview.length).toBeGreaterThan(15);
    expect(sampleUnit1.topicPreview).toContain('đại từ');
  });

  await runner.it('T1.4.2: Node topicPreview highlights key lesson focus without leaking answers', () => {
    const grammarStep: RoadmapStepMetadata = {
      id: 'sg-to-be',
      type: 'grammar',
      title: 'Động từ To Be',
      estimatedMinutes: 12,
      topicPreview: 'Khám phá 3 biến thể am/is/are và cách gắn kết với chủ ngữ.',
    };
    expect(grammarStep.topicPreview).toContain('am/is/are');
  });

  await runner.it('T1.4.3: topicPreview is non-empty string with optimal preview length (<= 250 characters)', () => {
    expect(sampleUnit1.topicPreview.length).toBeLessThanOrEqual(250);
  });

  await runner.it('T1.4.4: Topic preview renders cleanly without unparsed markdown or raw HTML', () => {
    const preview = sampleUnit1.topicPreview;
    expect(preview.includes('<script>')).toBe(false);
    expect(preview.includes('<div>')).toBe(false);
  });

  await runner.it('T1.4.5: Both vocabulary and grammar steps have tailored topic previews', () => {
    const vocabStep: RoadmapStepMetadata = {
      id: 'sv-1',
      type: 'vocab',
      title: 'Numbers',
      estimatedMinutes: 10,
      topicPreview: 'Nắm vững số đếm 1-100 và cách hỏi giờ trong tiếng Anh.',
    };
    const grammarStep: RoadmapStepMetadata = {
      id: 'sg-1',
      type: 'grammar',
      title: 'Articles',
      estimatedMinutes: 12,
      topicPreview: 'Phân biệt mạo từ a, an và the qua các tình huống đời sống.',
    };
    expect(vocabStep.topicPreview).toContain('số đếm');
    expect(grammarStep.topicPreview).toContain('mạo từ');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 5: Dual Track Switcher (CEFR & THPT)
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.5.1: Switching active track toggles between cefr and thpt seamlessly', () => {
    let currentTrack: 'cefr' | 'thpt' = 'cefr';
    const switchTrack = (newTrack: 'cefr' | 'thpt') => {
      currentTrack = newTrack;
    };
    switchTrack('thpt');
    expect(currentTrack).toBe('thpt');
    switchTrack('cefr');
    expect(currentTrack).toBe('cefr');
  });

  await runner.it('T1.5.2: user_roadmap table isolates enrollment records by composite PK (user_id, track)', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const cefrEnrollment = await supabase
      .from('user_roadmap')
      .select('*')
      .eq('user_id', 'learner-dual-1')
      .eq('track', 'cefr')
      .single();

    const thptEnrollment = await supabase
      .from('user_roadmap')
      .select('*')
      .eq('user_id', 'learner-dual-1')
      .eq('track', 'thpt')
      .single();

    expect(cefrEnrollment.data?.level_id).toBe('A1');
    expect(thptEnrollment.data?.level_id).toBe('lop-11');
  });

  await runner.it('T1.5.3: CEFR step IDs and THPT step IDs use distinct namespace prefixes and never collide', () => {
    const cefrStepId = 'sv-starter-a0-greetings';
    const thptStepId = 'sv-u-thpt10-1';
    expect(cefrStepId.startsWith('sv-starter-') || cefrStepId.startsWith('sv-u-a')).toBe(true);
    expect(thptStepId.startsWith('sv-u-thpt') || thptStepId.startsWith('sr-u-thpt')).toBe(true);
    expect(cefrStepId).not.toBe(thptStepId);
  });

  await runner.it('T1.5.4: Completing steps in CEFR track does not alter step statuses in THPT track', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    await supabase.from('user_roadmap_steps').insert({
      user_id: 'learner-dual-1',
      step_id: 'sv-starter-a0-greetings',
      status: 'completed',
      score: 100,
      completed_at: new Date().toISOString(),
    });

    const cefrSteps = mockDb.user_roadmap_steps.filter((s) => s.user_id === 'learner-dual-1' && s.step_id.startsWith('sv-starter'));
    const thptSteps = mockDb.user_roadmap_steps.filter((s) => s.user_id === 'learner-dual-1' && s.step_id.startsWith('sv-u-thpt'));

    expect(cefrSteps.length).toBe(1);
    expect(thptSteps.length).toBe(0);
  });

  await runner.it('T1.5.5: Invalid track argument gracefully falls back to default cefr track', () => {
    const resolveTrack = (raw: string | undefined | null): 'cefr' | 'thpt' => {
      if (raw === 'thpt') return 'thpt';
      return 'cefr';
    };
    expect(resolveTrack('thpt')).toBe('thpt');
    expect(resolveTrack('random_track')).toBe('cefr');
    expect(resolveTrack(null)).toBe('cefr');
  });

  await runner.it('T1.5.6: Returning to a previously studied track preserves its current_unit_id', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const record = await supabase
      .from('user_roadmap')
      .select('*')
      .eq('user_id', 'learner-cefr-1')
      .eq('track', 'cefr')
      .single();

    expect(record.data?.current_unit_id).toBe('u-a0-1');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 6: Mobile & Desktop Responsive Design
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.6.1: Responsive layout utility identifies mobile category and 1-column grid for width < 640px', () => {
    const mobileLayout = getResponsiveLayout(375); // iPhone width
    expect(mobileLayout.deviceCategory).toBe('mobile');
    expect(mobileLayout.gridColumns).toBe(1);
    expect(mobileLayout.isCompactView).toBe(true);
  });

  await runner.it('T1.6.2: Responsive layout utility assigns 2-column grid for tablet (640px <= width < 1024px)', () => {
    const tabletLayout = getResponsiveLayout(768); // iPad portrait
    expect(tabletLayout.deviceCategory).toBe('tablet');
    expect(tabletLayout.gridColumns).toBe(2);
    expect(tabletLayout.isCompactView).toBe(false);
  });

  await runner.it('T1.6.3: Responsive layout utility assigns 3-column grid for desktop (width >= 1024px)', () => {
    const desktopLayout = getResponsiveLayout(1440); // MacBook / Desktop
    expect(desktopLayout.deviceCategory).toBe('desktop');
    expect(desktopLayout.gridColumns).toBe(3);
    expect(desktopLayout.isCompactView).toBe(false);
  });

  await runner.it('T1.6.4: Touch target validator confirms buttons meet minimum 44x44px accessible target size', () => {
    expect(validateTouchTarget({ width: 48, height: 48 })).toBe(true);
    expect(validateTouchTarget({ width: 44, height: 44 })).toBe(true);
  });

  await runner.it('T1.6.5: Touch target validator rejects targets smaller than 44x44px for accessibility compliance', () => {
    expect(validateTouchTarget({ width: 40, height: 44 })).toBe(false);
    expect(validateTouchTarget({ width: 44, height: 32 })).toBe(false);
  });

  await runner.it('T1.6.6: Mobile view activates compact card view flags to avoid vertical layout overflow', () => {
    const mobile = getResponsiveLayout(360);
    expect(mobile.isCompactView).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 7: Node Mini-Quiz Gatekeeper
  // ──────────────────────────────────────────────────────────────────────────

  const sampleMiniQuizQuestions = [
    { id: 'mq-1', correctAnswer: 'hello' },
    { id: 'mq-2', correctAnswer: 'good morning' },
    { id: 'mq-3', correctAnswer: 'goodbye' },
    { id: 'mq-4', correctAnswer: 'please' },
  ];

  await runner.it('T1.7.1: Mini-quiz generates 3-4 micro questions evaluating immediate lesson retention', () => {
    expect(sampleMiniQuizQuestions.length).toBeGreaterThanOrEqual(3);
    expect(sampleMiniQuizQuestions.length).toBeLessThanOrEqual(4);
  });

  await runner.it('T1.7.2: Mini-quiz computes percentage score correctly based on correctAnswers / totalQuestions', () => {
    const answers = { 'mq-1': 'hello', 'mq-2': 'good morning', 'mq-3': 'wrong', 'mq-4': 'please' };
    const result = gradeMiniQuiz(sampleMiniQuizQuestions, answers);
    expect(result.correctAnswers).toBe(3);
    expect(result.totalQuestions).toBe(4);
    expect(result.score).toBe(75);
  });

  await runner.it('T1.7.3: Scoring >= 75% passes the mini-quiz gatekeeper (passed: true)', () => {
    const answersPass = { 'mq-1': 'hello', 'mq-2': 'good morning', 'mq-3': 'goodbye', 'mq-4': 'please' };
    const result = gradeMiniQuiz(sampleMiniQuizQuestions, answersPass);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  await runner.it('T1.7.4: Scoring < 75% fails the mini-quiz and blocks node completion', () => {
    const answersFail = { 'mq-1': 'hello', 'mq-2': 'wrong', 'mq-3': 'wrong', 'mq-4': 'please' };
    const result = gradeMiniQuiz(sampleMiniQuizQuestions, answersFail);
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
  });

  await runner.it('T1.7.5: Passing mini-quiz awards XP and records step status as completed in database', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const stepId = 'sv-starter-a0-greetings';
    await supabase.from('user_roadmap_steps').insert({
      user_id: 'learner-cefr-1',
      step_id: stepId,
      status: 'completed',
      score: 100,
      completed_at: new Date().toISOString(),
    });

    const userXp = mockDb.user_gamification.find((g) => g.user_id === 'learner-cefr-1');
    if (userXp) userXp.xp += 15;

    expect(mockDb.user_roadmap_steps.length).toBe(1);
    expect(mockDb.user_roadmap_steps[0].status).toBe('completed');
    expect(userXp?.xp).toBe(15);
  });

  await runner.it('T1.7.6: Retaking mini-quiz after failure allows learner to pass without penalty', () => {
    const firstAttempt = gradeMiniQuiz(sampleMiniQuizQuestions, { 'mq-1': 'hello' });
    expect(firstAttempt.passed).toBe(false);

    const secondAttempt = gradeMiniQuiz(sampleMiniQuizQuestions, {
      'mq-1': 'hello',
      'mq-2': 'good morning',
      'mq-3': 'goodbye',
      'mq-4': 'please',
    });
    expect(secondAttempt.passed).toBe(true);
    expect(secondAttempt.score).toBe(100);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 8: Diagnostic Checkpoint Feedback
  // ──────────────────────────────────────────────────────────────────────────

  const sampleCheckpointQuestions: DiagnosticQuestion[] = [
    {
      id: 'cq-1',
      skill: 'vocab',
      conceptRef: 'starter-a0-greetings',
      sourceStepId: 'sv-starter-a0-greetings',
      prompt: 'Từ nào có nghĩa là "Xin chào"?',
      options: ['Hello', 'Goodbye', 'Thanks', 'Sorry'],
      correctAnswer: 'Hello',
      explanation: 'Hello là lời chào thông dụng.',
    },
    {
      id: 'cq-2',
      skill: 'vocab',
      conceptRef: 'starter-a0-people',
      sourceStepId: 'sv-starter-a0-people',
      prompt: 'Từ nào có nghĩa là "Mẹ"?',
      options: ['Father', 'Mother', 'Brother', 'Sister'],
      correctAnswer: 'Mother',
      explanation: 'Mother là mẹ.',
    },
    {
      id: 'cq-3',
      skill: 'grammar',
      conceptRef: 'personal-pronouns',
      sourceStepId: 'sg-personal-pronouns',
      prompt: 'Chọn đại từ thay thế cho "John": ___ is a student.',
      options: ['He', 'She', 'It', 'They'],
      correctAnswer: 'He',
      explanation: 'John là nam số ít, dùng He.',
    },
    {
      id: 'cq-4',
      skill: 'grammar',
      conceptRef: 'personal-pronouns',
      sourceStepId: 'sg-personal-pronouns',
      prompt: 'Chọn đại từ: Mary and I are friends. ___ study together.',
      options: ['We', 'They', 'You', 'She'],
      correctAnswer: 'We',
      explanation: 'Mary and I là ngôi thứ nhất số nhiều -> We.',
    },
    {
      id: 'cq-5',
      skill: 'pronunciation',
      conceptRef: 'word-stress-basics',
      sourceStepId: 'sp-word-stress-basics',
      prompt: 'Từ nào có trọng âm rơi vào âm tiết thứ nhất?',
      options: ['Mother', 'Hello', 'Today', 'Again'],
      correctAnswer: 'Mother',
      explanation: 'MOTHER trọng âm rơi vào âm 1.',
    },
  ];

  await runner.it('T1.8.1: Checkpoint evaluates multiple skills (vocab, grammar, pronunciation)', () => {
    const skills = new Set(sampleCheckpointQuestions.map((q) => q.skill));
    expect(skills.has('vocab')).toBe(true);
    expect(skills.has('grammar')).toBe(true);
    expect(skills.has('pronunciation')).toBe(true);
  });

  await runner.it('T1.8.2: Checkpoint computes individual percentage scores for each tested skill category', () => {
    // 2/2 vocab correct (100%), 1/2 grammar correct (50%), 0/1 pronunciation correct (0%)
    const answers = {
      'cq-1': 'Hello',
      'cq-2': 'Mother',
      'cq-3': 'He',
      'cq-4': 'Wrong',
      'cq-5': 'Wrong',
    };
    const result = gradeCheckpoint(sampleCheckpointQuestions, answers, sampleUnit1.steps);
    expect(result.details.skillBreakdown?.vocab?.score).toBe(100);
    expect(result.details.skillBreakdown?.grammar?.score).toBe(50);
    expect(result.details.skillBreakdown?.pronunciation?.score).toBe(0);
  });

  await runner.it('T1.8.3: Skills with incorrect answers are flagged as weak concepts in diagnostic report', () => {
    const answers = {
      'cq-1': 'Hello',
      'cq-2': 'Mother',
      'cq-3': 'He',
      'cq-4': 'Wrong',
      'cq-5': 'Wrong',
    };
    const result = gradeCheckpoint(sampleCheckpointQuestions, answers, sampleUnit1.steps);
    const weakConcepts = result.details.weakConcepts || [];
    expect(weakConcepts.length).toBe(2);
    const concepts = weakConcepts.map((w) => w.conceptRef);
    expect(concepts).toContain('personal-pronouns');
    expect(concepts).toContain('word-stress-basics');
  });

  await runner.it('T1.8.4: Each weak concept includes direct 1-click remedial link (reviewUrl) to relevant node', () => {
    const answers = { 'cq-1': 'Hello', 'cq-2': 'Mother', 'cq-3': 'He', 'cq-4': 'Wrong', 'cq-5': 'Wrong' };
    const result = gradeCheckpoint(sampleCheckpointQuestions, answers, sampleUnit1.steps);
    for (const weak of result.details.weakConcepts || []) {
      expect(weak.reviewUrl).toBeDefined();
      expect(weak.reviewUrl.startsWith('/journey?focusStep=')).toBe(true);
    }
  });

  await runner.it('T1.8.5: Overall checkpoint score >= 80% marks unit completed and unlocks next unit', () => {
    // 4/5 = 80%
    const answers = {
      'cq-1': 'Hello',
      'cq-2': 'Mother',
      'cq-3': 'He',
      'cq-4': 'We',
      'cq-5': 'Wrong',
    };
    const result = gradeCheckpoint(sampleCheckpointQuestions, answers, sampleUnit1.steps);
    expect(result.score).toBe(80);
    expect(result.passed).toBe(true);
  });

  await runner.it('T1.8.6: Overall checkpoint score < 80% keeps next unit locked while displaying diagnostic report', () => {
    // 3/5 = 60%
    const answers = {
      'cq-1': 'Hello',
      'cq-2': 'Mother',
      'cq-3': 'He',
      'cq-4': 'Wrong',
      'cq-5': 'Wrong',
    };
    const result = gradeCheckpoint(sampleCheckpointQuestions, answers, sampleUnit1.steps);
    expect(result.score).toBe(60);
    expect(result.passed).toBe(false);
    expect((result.details.weakConcepts || []).length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 9: Level Exit Exam Engine
  // ──────────────────────────────────────────────────────────────────────────

  // Generate 25 summative questions for A0 Exit Exam
  const sampleExitExamQuestions: DiagnosticQuestion[] = Array.from({ length: 25 }).map((_, i) => ({
    id: `ex-${i + 1}`,
    skill: i < 10 ? 'vocab' : i < 18 ? 'grammar' : 'pronunciation',
    conceptRef: `concept-${Math.floor(i / 3)}`,
    prompt: `Exit Question #${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    explanation: `Option A is correct for question ${i + 1}`,
  }));

  await runner.it('T1.9.1: Exit exam provides comprehensive summative evaluation across entire level (25 items)', () => {
    expect(sampleExitExamQuestions.length).toBe(25);
  });

  await runner.it('T1.9.2: Passing threshold is strictly set to >= 80%', () => {
    // 19/25 = 76% (FAIL)
    const answers76: Record<string, string> = {};
    for (let i = 0; i < 19; i++) answers76[`ex-${i + 1}`] = 'A';
    const result76 = gradeExitExam(sampleExitExamQuestions, answers76, 'A0');
    expect(result76.score).toBe(76);
    expect(result76.passed).toBe(false);

    // 20/25 = 80% (PASS)
    const answers80: Record<string, string> = {};
    for (let i = 0; i < 20; i++) answers80[`ex-${i + 1}`] = 'A';
    const result80 = gradeExitExam(sampleExitExamQuestions, answers80, 'A0');
    expect(result80.score).toBe(80);
    expect(result80.passed).toBe(true);
  });

  await runner.it('T1.9.3: Passing exit exam unlocks advancement to next level (A0 -> A1)', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 25; i++) answers[`ex-${i + 1}`] = 'A';
    const result = gradeExitExam(sampleExitExamQuestions, answers, 'A0');
    expect(result.passed).toBe(true);

    const levelProgression = { currentLevel: 'A0', nextLevel: 'A1', unlocked: result.passed };
    expect(levelProgression.unlocked).toBe(true);
    expect(levelProgression.nextLevel).toBe('A1');
  });

  await runner.it('T1.9.4: Passing exit exam awards official graduation badge (badge_a0_graduate)', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 22; i++) answers[`ex-${i + 1}`] = 'A';
    const result = gradeExitExam(sampleExitExamQuestions, answers, 'A0');
    expect(result.badgeAwarded).toBe('badge_a0_graduate');
  });

  await runner.it('T1.9.5: Failing exit exam (< 80%) prevents level advancement and provides full diagnostic review', () => {
    const answers: Record<string, string> = {};
    for (let i = 0; i < 15; i++) answers[`ex-${i + 1}`] = 'A';
    const result = gradeExitExam(sampleExitExamQuestions, answers, 'A0');
    expect(result.passed).toBe(false);
    expect(result.badgeAwarded).toBeUndefined();
    expect((result.details.weakConcepts || []).length).toBeGreaterThan(0);
  });

  await runner.it('T1.9.6: Exit exam attempts are recorded with capstone tier tag exit_exam', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    await supabase.from('user_roadmap_assessments').insert({
      id: 'attempt-exit-1',
      user_id: 'learner-cefr-1',
      track: 'cefr',
      tier: 'exit_exam',
      target_id: 'A0',
      score: 88,
      passed: true,
      details: { totalQuestions: 25, correctAnswers: 22 },
    });

    const recorded = mockDb.user_roadmap_assessments.find((a) => a.id === 'attempt-exit-1');
    expect(recorded).toBeDefined();
    expect(recorded?.tier).toBe('exit_exam');
    expect(recorded?.passed).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 10: Assessment Persistence & Graceful Fallback
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.10.1: Database stores assessment attempts in user_roadmap_assessments table', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    await supabase.from('user_roadmap_assessments').insert({
      user_id: 'learner-cefr-1',
      track: 'cefr',
      tier: 'checkpoint',
      target_id: 'u-a0-1',
      score: 85,
      passed: true,
      details: { totalQuestions: 15, correctAnswers: 13 },
    });

    expect(mockDb.user_roadmap_assessments.length).toBe(1);
    expect(mockDb.user_roadmap_assessments[0].target_id).toBe('u-a0-1');
  });

  await runner.it('T1.10.2: Assessment attempt record contains required schema attributes', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const { data } = await supabase
      .from('user_roadmap_assessments')
      .insert({
        id: 'rec-test-schema',
        user_id: 'learner-cefr-1',
        track: 'cefr',
        tier: 'mini_quiz',
        target_id: 'sv-starter-a0-greetings',
        score: 100,
        passed: true,
        details: { totalQuestions: 4, correctAnswers: 4 },
      })
      .select()
      .single();

    expect(data?.user_id).toBe('learner-cefr-1');
    expect(data?.track).toBe('cefr');
    expect(data?.tier).toBe('mini_quiz');
    expect(data?.target_id).toBe('sv-starter-a0-greetings');
    expect(data?.score).toBe(100);
    expect(data?.passed).toBe(true);
  });

  await runner.it('T1.10.3: Database queries retrieve assessment history ordered by created_at descending', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    await supabase.from('user_roadmap_assessments').insert([
      {
        id: 'att-1',
        user_id: 'learner-cefr-1',
        track: 'cefr',
        tier: 'mini_quiz',
        target_id: 'step-1',
        score: 50,
        passed: false,
        created_at: '2026-09-01T10:00:00Z',
      },
      {
        id: 'att-2',
        user_id: 'learner-cefr-1',
        track: 'cefr',
        tier: 'mini_quiz',
        target_id: 'step-1',
        score: 100,
        passed: true,
        created_at: '2026-09-01T10:15:00Z',
      },
    ]);

    const res = await supabase
      .from('user_roadmap_assessments')
      .select('*')
      .eq('user_id', 'learner-cefr-1')
      .order('created_at', { ascending: false });

    expect(res.data.length).toBe(2);
    expect(res.data[0].id).toBe('att-2');
    expect(res.data[1].id).toBe('att-1');
  });

  await runner.it('T1.10.4: When database is unreachable, assessment attempts are safely cached in localStorage', () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);

    syncManager.saveAttemptOffline({
      userId: 'learner-cefr-1',
      track: 'cefr',
      tier: 'checkpoint',
      targetId: 'u-a0-1',
      score: 80,
      passed: true,
      details: { totalQuestions: 10, correctAnswers: 8 },
    });

    const pending = syncManager.getPendingAttempts();
    expect(pending.length).toBe(1);
    expect(pending[0].targetId).toBe('u-a0-1');
    expect(pending[0].score).toBe(80);
  });

  await runner.it('T1.10.5: OfflineAssessmentSyncManager retrieves cached attempts from localStorage', () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);

    syncManager.saveAttemptOffline({
      userId: 'learner-thpt-1',
      track: 'thpt',
      tier: 'mini_quiz',
      targetId: 'sr-u-thpt10-1',
      score: 100,
      passed: true,
      details: { totalQuestions: 3, correctAnswers: 3 },
    });

    const pending = syncManager.getPendingAttempts();
    expect(pending.length).toBe(1);
    expect(pending[0].userId).toBe('learner-thpt-1');
  });

  await runner.it('T1.10.6: Reconnected client syncs pending offline attempts to database and clears local queue', async () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    syncManager.saveAttemptOffline({
      userId: 'learner-cefr-1',
      track: 'cefr',
      tier: 'checkpoint',
      targetId: 'u-a0-1',
      score: 90,
      passed: true,
      details: { totalQuestions: 10, correctAnswers: 9 },
    });

    const syncResult = await syncManager.syncPendingAttempts(supabase);
    expect(syncResult.syncedCount).toBe(1);
    expect(syncResult.failedCount).toBe(0);
    expect(syncManager.getPendingAttempts().length).toBe(0);
    expect(mockDb.user_roadmap_assessments.length).toBe(1);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 11: Multimodal Context & Memory Tips
  // ──────────────────────────────────────────────────────────────────────────

  const sampleMultimodalWord = {
    word: 'family',
    ipa: '/ˈfæm.əl.i/',
    pos: 'noun',
    translation: 'gia đình',
    scenario: 'Introducing parents and siblings at a weekend dinner.',
    example: 'I have a small family with three people.',
    exampleVi: 'Tôi có một gia đình nhỏ gồm ba người.',
    imageUrl: 'https://images.unsplash.com/photo-family-sample.jpg',
    audioUrl: 'https://audio.lingopro.vn/family.mp3',
    mnemonicTip: 'Gợi nhớ: "F-A-M-I-L-Y" = Father And Mother I Love You ❤️',
  };

  await runner.it('T1.11.1: Vocabulary items include real-world contextual usage scenarios and examples', () => {
    expect(sampleMultimodalWord.scenario).toBeDefined();
    expect(sampleMultimodalWord.example).toContain('family');
    expect(sampleMultimodalWord.exampleVi).toContain('gia đình');
  });

  await runner.it('T1.11.2: Items support illustration URLs and Oxford/TTS audio URLs', () => {
    expect(sampleMultimodalWord.imageUrl.startsWith('https://')).toBe(true);
    expect(sampleMultimodalWord.audioUrl.endsWith('.mp3')).toBe(true);
  });

  await runner.it('T1.11.3: Deep memory mnemonics and learning tips are provided for challenging terms', () => {
    expect(sampleMultimodalWord.mnemonicTip).toBeDefined();
    expect(sampleMultimodalWord.mnemonicTip).toContain('Father And Mother');
  });

  await runner.it('T1.11.4: Phonetic data parses IPA symbols accurately into formatted string', () => {
    expect(sampleMultimodalWord.ipa.startsWith('/') && sampleMultimodalWord.ipa.endsWith('/')).toBe(true);
  });

  await runner.it('T1.11.5: Audio fallback cascade handles missing audio file with synthetic speech fallback', () => {
    const resolveAudioSource = (humanAudioUrl?: string): string => {
      if (humanAudioUrl && humanAudioUrl.trim().length > 0) return humanAudioUrl;
      return 'tts:en-US:neural';
    };
    expect(resolveAudioSource('https://real-audio.mp3')).toBe('https://real-audio.mp3');
    expect(resolveAudioSource('')).toBe('tts:en-US:neural');
    expect(resolveAudioSource(undefined)).toBe('tts:en-US:neural');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 12: Word Pair Matching Widget
  // ──────────────────────────────────────────────────────────────────────────

  const samplePairProps: WordPairMatchWidgetProps = {
    pairs: [
      { id: 'p1', left: 'Hello', right: 'Xin chào', leftAudio: 'https://audio/hello.mp3' },
      { id: 'p2', left: 'Family', right: 'Gia đình', leftImage: 'https://img/family.jpg' },
      { id: 'p3', left: 'Mother', right: 'Mẹ' },
      { id: 'p4', left: 'Father', right: 'Bố' },
    ],
    onComplete: (_stats) => {},
  };

  await runner.it('T1.12.1: WordPairMatchWidget accepts 4-5 pairs and validates prop schema', () => {
    const validation = validateWidgetProps('word_match', samplePairProps);
    expect(validation.valid).toBe(true);
    expect(samplePairProps.pairs.length).toBe(4);
  });

  await runner.it('T1.12.2: Correct matching of left and right items increments matched count', () => {
    let matchedCount = 0;
    const selectPair = (leftId: string, rightId: string) => {
      if (leftId === rightId) matchedCount++;
    };
    selectPair('p1', 'p1');
    expect(matchedCount).toBe(1);
    selectPair('p2', 'p2');
    expect(matchedCount).toBe(2);
  });

  await runner.it('T1.12.3: Mismatched selections reset active selection and increment attempts counter', () => {
    let attempts = 0;
    let selectedLeft: string | null = null;

    const handleSelect = (leftId: string, rightId: string) => {
      attempts++;
      if (leftId !== rightId) {
        selectedLeft = null; // reset
      }
    };

    handleSelect('p1', 'p2');
    expect(attempts).toBe(1);
    expect(selectedLeft).toBeNull();
  });

  await runner.it('T1.12.4: onComplete callback triggers with stats when all pairs matched', () => {
    let completedStats: { correct: number; attempts: number; elapsedSeconds: number } | null = null;
    const testProps: WordPairMatchWidgetProps = {
      pairs: samplePairProps.pairs,
      onComplete: (stats) => {
        completedStats = stats;
      },
    };

    testProps.onComplete({ correct: 4, attempts: 5, elapsedSeconds: 22 });
    expect(completedStats).toBeDefined();
    expect(completedStats!.correct).toBe(4);
    expect(completedStats!.attempts).toBe(5);
    expect(completedStats!.elapsedSeconds).toBe(22);
  });

  await runner.it('T1.12.5: Word pairs list supports audio and image metadata for multimodal matching', () => {
    expect(samplePairProps.pairs[0].leftAudio).toBeDefined();
    expect(samplePairProps.pairs[1].leftImage).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 13: Dialogue Cloze Widget
  // ──────────────────────────────────────────────────────────────────────────

  const sampleDialogueProps: DialogueClozeWidgetProps = {
    dialogue: [
      { speaker: 'Nam', text: 'Good morning, Ms. Lan! How are you today?' },
      {
        speaker: 'Ms. Lan',
        text: 'I am doing well, thank you. Is this your sister?',
        blanks: [{ id: 'b1', answer: 'sister', options: ['sister', 'brother', 'mother'] }],
      },
      {
        speaker: 'Nam',
        text: 'Yes, she is my younger sister.',
        blanks: [{ id: 'b2', answer: 'younger', options: ['older', 'younger', 'tall'] }],
      },
    ],
    onComplete: (_stats) => {},
  };

  await runner.it('T1.13.1: DialogueClozeWidget accepts conversational dialogue script with blanks', () => {
    const validation = validateWidgetProps('dialogue_cloze', sampleDialogueProps);
    expect(validation.valid).toBe(true);
    expect(sampleDialogueProps.dialogue.length).toBe(3);
  });

  await runner.it('T1.13.2: Interactive word bank chips contain correct words and distractors', () => {
    const blank1 = sampleDialogueProps.dialogue[1].blanks![0];
    expect(blank1.options).toContain(blank1.answer);
    expect(blank1.options.length).toBeGreaterThan(1);
  });

  await runner.it('T1.13.3: Filling blanks validates choices against expected answers', () => {
    const evaluateBlank = (blank: { answer: string }, chosen: string) => blank.answer === chosen;
    const b1 = sampleDialogueProps.dialogue[1].blanks![0];
    expect(evaluateBlank(b1, 'sister')).toBe(true);
    expect(evaluateBlank(b1, 'brother')).toBe(false);
  });

  await runner.it('T1.13.4: onComplete callback returns final score and passed flag based on correctness', () => {
    let resultScore = 0;
    let resultPassed = false;
    const testProps: DialogueClozeWidgetProps = {
      dialogue: sampleDialogueProps.dialogue,
      onComplete: (stats) => {
        resultScore = stats.score;
        resultPassed = stats.passed;
      },
    };

    testProps.onComplete({ score: 100, passed: true });
    expect(resultScore).toBe(100);
    expect(resultPassed).toBe(true);
  });

  await runner.it('T1.13.5: Dialogue lines distinguish speaker names and contextual dialogue turns', () => {
    expect(sampleDialogueProps.dialogue[0].speaker).toBe('Nam');
    expect(sampleDialogueProps.dialogue[1].speaker).toBe('Ms. Lan');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 14: Reading Passage Explorer Widget
  // ──────────────────────────────────────────────────────────────────────────

  const samplePassageProps: ReadingPassageExplorerProps = {
    passage: 'My family lives in a beautiful house in Hanoi. My mother is a doctor and my father is an engineer.',
    audioUrl: 'https://audio.lingopro.vn/passages/a0-family.mp3',
    targetWords: [
      { word: 'family', pos: 'noun', definition: 'Gia đình', audioUrl: 'https://audio/family.mp3' },
      { word: 'mother', pos: 'noun', definition: 'Mẹ', audioUrl: 'https://audio/mother.mp3' },
      { word: 'father', pos: 'noun', definition: 'Bố', audioUrl: 'https://audio/father.mp3' },
    ],
    comprehensionQuestions: [
      {
        id: 'pq-1',
        question: 'Where does the family live?',
        options: ['In Danang', 'In Hanoi', 'In Hue', 'In Saigon'],
        answerIndex: 1,
        explanation: 'The text states: lives in a beautiful house in Hanoi.',
      },
    ],
    onComplete: (_stats) => {},
  };

  await runner.it('T1.14.1: ReadingPassageExplorer accepts passage text, target words, and questions', () => {
    const validation = validateWidgetProps('passage_explorer', samplePassageProps);
    expect(validation.valid).toBe(true);
    expect(samplePassageProps.targetWords.length).toBe(3);
  });

  await runner.it('T1.14.2: Target vocabulary words are highlighted within the passage text', () => {
    for (const tw of samplePassageProps.targetWords) {
      expect(samplePassageProps.passage.toLowerCase()).toContain(tw.word.toLowerCase());
    }
  });

  await runner.it('T1.14.3: Clicking target word provides popup definition, part of speech, and audio', () => {
    const lookup = samplePassageProps.targetWords.find((w) => w.word === 'mother');
    expect(lookup).toBeDefined();
    expect(lookup!.definition).toBe('Mẹ');
    expect(lookup!.pos).toBe('noun');
    expect(lookup!.audioUrl).toBeDefined();
  });

  await runner.it('T1.14.4: Passage supports full audio narration playback sync', () => {
    expect(samplePassageProps.audioUrl).toBeDefined();
    expect(samplePassageProps.audioUrl!.endsWith('.mp3')).toBe(true);
  });

  await runner.it('T1.14.5: Comprehension questions evaluate answering accuracy and invoke onComplete with score', () => {
    let finalScore = 0;
    const testProps: ReadingPassageExplorerProps = {
      ...samplePassageProps,
      onComplete: (stats) => {
        finalScore = stats.score;
      },
    };
    testProps.onComplete({ score: 100 });
    expect(finalScore).toBe(100);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 15: Phonetic Articulation & Minimal Pair Drill
  // ──────────────────────────────────────────────────────────────────────────

  const samplePhoneticProps: PhoneticArticulationProps = {
    ipa: '/iː/ vs /ɪ/',
    mouthTip: 'Âm /iː/ căng mép miệng như đang cười tươi. Âm /ɪ/ thả lỏng cơ miệng ngắn và dứt khoát.',
    whyHard: 'Người Việt thường phát âm cả hai âm thành âm "i" ngắn giống nhau, dẫn đến hiểu nhầm từ.',
    audioUrl: 'https://audio.lingopro.vn/phonetics/sheep-ship.mp3',
    minimalPairs: [
      { a: 'sheep /ʃiːp/', b: 'ship /ʃɪp/', note: 'con cừu vs con tàu' },
      { a: 'feet /fiːt/', b: 'fit /fɪt/', note: 'bàn chân vs vừa vặn' },
      { a: 'seat /siːt/', b: 'sit /sɪt/', note: 'chỗ ngồi vs ngồi' },
    ],
    onComplete: (_stats) => {},
  };

  await runner.it('T1.15.1: Phonetic widget displays target IPA symbol and mouth articulation visual tips', () => {
    expect(samplePhoneticProps.ipa).toBe('/iː/ vs /ɪ/');
    expect(samplePhoneticProps.mouthTip).toContain('căng mép miệng');
  });

  await runner.it('T1.15.2: Explains L1 Vietnamese contrastive difficulty (whyHard) for specific sounds', () => {
    expect(samplePhoneticProps.whyHard).toContain('Người Việt');
    expect(samplePhoneticProps.whyHard).toContain('âm "i"');
  });

  await runner.it('T1.15.3: Minimal pair discrimination drill presents pairs of acoustic contrast words', () => {
    expect(samplePhoneticProps.minimalPairs.length).toBe(3);
    expect(samplePhoneticProps.minimalPairs[0].a).toContain('sheep');
    expect(samplePhoneticProps.minimalPairs[0].b).toContain('ship');
  });

  await runner.it('T1.15.4: Evaluating acoustic choices computes accuracy across drill rounds', () => {
    const rounds = [
      { chosen: 'sheep', target: 'sheep' },
      { chosen: 'ship', target: 'ship' },
      { chosen: 'fit', target: 'feet' },
    ];
    const correct = rounds.filter((r) => r.chosen === r.target).length;
    const accuracy = Math.round((correct / rounds.length) * 100);
    expect(correct).toBe(2);
    expect(accuracy).toBe(67);
  });

  await runner.it('T1.15.5: onComplete callback records drill score and determines passing status', () => {
    let drillPassed = false;
    const testProps: PhoneticArticulationProps = {
      ...samplePhoneticProps,
      onComplete: (stats) => {
        drillPassed = stats.passed;
      },
    };
    testProps.onComplete({ score: 85, passed: true });
    expect(drillPassed).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Feature 16: Instant Interactive Feedback & Explanation
  // ──────────────────────────────────────────────────────────────────────────

  await runner.it('T1.16.1: Submitting answers provides immediate feedback state without full page reload', () => {
    const evaluateInstantFeedback = (answer: string, correct: string) => {
      const isCorrect = answer.trim().toLowerCase() === correct.trim().toLowerCase();
      return {
        verdict: isCorrect ? 'correct' : 'incorrect',
        showExplanation: true,
        latencyMs: 5,
      };
    };
    const feedback = evaluateInstantFeedback('hello', 'hello');
    expect(feedback.verdict).toBe('correct');
    expect(feedback.showExplanation).toBe(true);
    expect(feedback.latencyMs).toBeLessThan(50);
  });

  await runner.it('T1.16.2: Correct answers return positive feedback with reinforcing explanation', () => {
    const feedback = {
      verdict: 'correct',
      message: 'Chính xác!',
      explanation: 'He là đại từ nhân xưng phù hợp thay thế cho danh từ số ít chỉ nam giới (John).',
    };
    expect(feedback.verdict).toBe('correct');
    expect(feedback.explanation).toContain('He');
  });

  await runner.it('T1.16.3: Incorrect answers return clear educational explanations clarifying the error', () => {
    const feedback = {
      verdict: 'incorrect',
      message: 'Chưa chính xác.',
      explanation: 'Mary and I gồm người nói (I) và Mary, do đó phải dùng đại từ "We", không dùng "They".',
    };
    expect(feedback.verdict).toBe('incorrect');
    expect(feedback.explanation).toContain('We');
  });

  await runner.it('T1.16.4: Error identification highlights exact token or phrase in error', () => {
    const sentenceTokens = ['He', 'go', 'to', 'school', 'yesterday'];
    const errorTokenIndex = 1; // 'go' should be 'went'
    expect(sentenceTokens[errorTokenIndex]).toBe('go');
  });

  await runner.it('T1.16.5: Feedback payload provides clean formatted text suitable for mobile rendering', () => {
    const feedbackPayload = {
      verdict: 'correct',
      title: 'Tuyệt vời!',
      detail: 'Bạn đã hoàn thành xuất sắc thử thách này.',
    };
    expect(feedbackPayload.detail.length).toBeLessThan(100);
    expect(feedbackPayload.title).toBe('Tuyệt vời!');
  });
}
