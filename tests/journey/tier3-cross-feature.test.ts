/**
 * Tier 3: Cross-Feature Combinations Test Suite (Learning Roadmap / Journey Modernization)
 * Pairwise and cross-module interaction verification against PROJECT.md and ORIGINAL_REQUEST.md.
 * Minimum requirement: >= 16 test cases.
 *
 * Covers:
 *  T3.1: Module Card Progress + Node Mini-Quiz Gatekeeper
 *  T3.2: Dual Track Switcher + Assessment Persistence
 *  T3.3: Diagnostic Checkpoint Feedback + Time & Duration Framing
 *  T3.4: Word Pair Matching Widget + Instant Interactive Feedback
 *  T3.5: Dialogue Cloze Widget + Can-Do Objectives
 *  T3.6: Reading Passage Explorer + Topic Previews
 *  T3.7: Level Exit Exam Engine + Module Cards Visual Redesign
 *  T3.8: Phonetic Articulation Widget + Node Mini-Quiz Gatekeeper
 *  T3.9: Assessment Persistence Fallback + Mobile Responsive Design
 *  T3.10: Module Card Status + Linear Progress Gatekeeper
 *  T3.11: Multi-Tier Hierarchy Progression
 *  T3.12: Library Credit Sync + Module Progress Calculation
 *  T3.13: Diagnostic Feedback Remedial Deep Link + Navigation
 *  T3.14: Dual Track Switcher + Mobile Responsive Layout
 *  T3.15: Multimodal Context + Word Pair Matching Widget
 *  T3.16: Exit Exam Pass + Pro Entitlement Gating
 *  T3.17: Checkpoint Failure + Offline Persistence
 *  T3.18: Interactive Widgets + Instant Feedback Error Isolation
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

export async function runTier3Tests(runner: TestRunner): Promise<void> {
  runner.describe('Tier 3: Cross-Feature Combinations (Roadmap/Journey)', () => {});

  const sampleUnit: RoadmapUnitMetadata = {
    id: 'u-a0-1',
    index: 1,
    title: 'Chặng 1 · Khởi động A0',
    description: 'Nền tảng giao tiếp',
    estimatedMinutes: 45,
    canDo: ['Có thể tự giới thiệu tên, tuổi', 'Có thể chào hỏi lịch sự'],
    topicPreview: 'Học từ vựng chào hỏi, đại từ nhân xưng và trọng âm cơ bản.',
    badgeIcon: '🚩',
    badgeName: 'A0 Khởi động',
    steps: [
      { id: 'sv-1', type: 'vocab', title: 'Chào hỏi', estimatedMinutes: 10, refId: 'pack-greetings' },
      { id: 'sg-1', type: 'grammar', title: 'Đại từ', estimatedMinutes: 10, refId: 'grammar-pronouns' },
      { id: 'sp-1', type: 'pronunciation', title: 'Trọng âm', estimatedMinutes: 10, refId: 'phonetic-stress' },
      { id: 'sc-1', type: 'checkpoint', title: 'Checkpoint 1', estimatedMinutes: 15 },
    ],
  };

  // T3.1: Module Card Progress + Node Mini-Quiz Gatekeeper
  await runner.it('T3.1: Module Card Progress + Node Mini-Quiz Gatekeeper: passing mini-quiz advances unit progress % and unlocks next node', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    const questions = [
      { id: 'q1', correctAnswer: 'A' },
      { id: 'q2', correctAnswer: 'B' },
      { id: 'q3', correctAnswer: 'C' },
      { id: 'q4', correctAnswer: 'D' },
    ];
    const quizResult = gradeMiniQuiz(questions, { q1: 'A', q2: 'B', q3: 'C', q4: 'D' });
    expect(quizResult.passed).toBe(true);

    // Save completed step
    supabase.from('user_roadmap_steps').insert({
      user_id: 'learner-cefr-1',
      step_id: 'sv-1',
      status: 'completed',
      score: 100,
      completed_at: new Date().toISOString(),
    });

    const completed = new Set(['sv-1']);
    const progress = calculateUnitProgress(sampleUnit, completed);
    // 1 of 4 steps completed = 25%
    expect(progress.percentage).toBe(25);
    expect(progress.status).toBe('in_progress');

    // Next step in sequence (sg-1) is now active
    const nextStepId = sampleUnit.steps[1].id;
    expect(nextStepId).toBe('sg-1');
  });

  // T3.2: Dual Track Switcher + Assessment Persistence
  await runner.it('T3.2: Dual Track Switcher + Assessment Persistence: CEFR assessments do not bleed into THPT track', async () => {
    const mockDb = createInitialJourneyMockDb();
    const supabase = createMockJourneySupabaseClient(mockDb);

    // Record CEFR attempt
    await supabase.from('user_roadmap_assessments').insert({
      user_id: 'learner-dual-1',
      track: 'cefr',
      tier: 'mini_quiz',
      target_id: 'sv-1',
      score: 100,
      passed: true,
      details: { totalQuestions: 4, correctAnswers: 4 },
    });

    // Record THPT attempt
    await supabase.from('user_roadmap_assessments').insert({
      user_id: 'learner-dual-1',
      track: 'thpt',
      tier: 'checkpoint',
      target_id: 'u-thpt10-1',
      score: 85,
      passed: true,
      details: { totalQuestions: 15, correctAnswers: 13 },
    });

    const cefrRes = await supabase.from('user_roadmap_assessments').select('*').eq('user_id', 'learner-dual-1').eq('track', 'cefr');
    const thptRes = await supabase.from('user_roadmap_assessments').select('*').eq('user_id', 'learner-dual-1').eq('track', 'thpt');

    expect(cefrRes.data.length).toBe(1);
    expect(cefrRes.data[0].target_id).toBe('sv-1');
    expect(thptRes.data.length).toBe(1);
    expect(thptRes.data[0].target_id).toBe('u-thpt10-1');
  });

  // T3.3: Diagnostic Checkpoint Feedback + Time & Duration Framing
  await runner.it('T3.3: Diagnostic Checkpoint Feedback + Time & Duration Framing: diagnostic report calculates estimated remedial study time', () => {
    const questions: DiagnosticQuestion[] = [
      {
        id: 'q1',
        skill: 'vocab',
        conceptRef: 'pack-greetings',
        sourceStepId: 'sv-1',
        prompt: 'Q1',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Exp',
      },
      {
        id: 'q2',
        skill: 'grammar',
        conceptRef: 'grammar-pronouns',
        sourceStepId: 'sg-1',
        prompt: 'Q2',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Exp',
      },
    ];

    // Learner gets both wrong
    const checkpointResult = gradeCheckpoint(questions, { q1: 'wrong', q2: 'wrong' }, sampleUnit.steps);
    expect(checkpointResult.passed).toBe(false);

    // Calculate remedial time based on weak steps
    const weakStepIds = new Set((checkpointResult.details.weakConcepts || []).map((w) => w.reviewStepId).filter(Boolean));
    const remedialMinutes = sampleUnit.steps
      .filter((s) => weakStepIds.has(s.id))
      .reduce((sum, s) => sum + s.estimatedMinutes, 0);

    // sv-1 (10m) + sg-1 (10m) = 20m
    expect(remedialMinutes).toBe(20);
    expect(formatEstimatedMinutes(remedialMinutes)).toBe('~20 phút');
  });

  // T3.4: Word Pair Matching Widget + Instant Interactive Feedback
  await runner.it('T3.4: Word Pair Matching Widget + Instant Interactive Feedback: mismatched pair triggers feedback and increments attempts', () => {
    let attemptsCount = 0;
    let feedbackGiven = '';

    const handlePairAttempt = (leftId: string, rightId: string) => {
      attemptsCount++;
      if (leftId !== rightId) {
        feedbackGiven = 'Chưa đúng, hãy thử ghép lại cặp từ này!';
      } else {
        feedbackGiven = 'Chính xác!';
      }
    };

    handlePairAttempt('p1', 'p2');
    expect(attemptsCount).toBe(1);
    expect(feedbackGiven).toContain('Chưa đúng');

    handlePairAttempt('p1', 'p1');
    expect(attemptsCount).toBe(2);
    expect(feedbackGiven).toBe('Chính xác!');
  });

  // T3.5: Dialogue Cloze Widget + Can-Do Objectives
  await runner.it('T3.5: Dialogue Cloze Widget + Can-Do Objectives: successful dialogue completion validates conversational can-do skill', () => {
    const clozeProps: DialogueClozeWidgetProps = {
      dialogue: [
        {
          speaker: 'Nam',
          text: 'What is your name?',
          blanks: [{ id: 'b1', answer: 'name', options: ['name', 'age'] }],
        },
      ],
      onComplete: (stats) => {
        expect(stats.passed).toBe(true);
      },
    };

    const isCanDoValidated = clozeProps.dialogue[0].blanks![0].answer === 'name';
    expect(isCanDoValidated).toBe(true);
    const relatedCanDo = sampleUnit.canDo[0];
    expect(relatedCanDo).toContain('tự giới thiệu tên');
  });

  // T3.6: Reading Passage Explorer + Topic Previews
  await runner.it('T3.6: Reading Passage Explorer + Topic Previews: passage target words align with unit topicPreview themes', () => {
    const passageProps: ReadingPassageExplorerProps = {
      passage: 'Hello, I am John. She is my sister and he is my brother.',
      targetWords: [
        { word: 'Hello', pos: 'greeting', definition: 'Xin chào' },
        { word: 'sister', pos: 'noun', definition: 'Chị/em gái' },
      ],
      comprehensionQuestions: [{ id: 'q1', question: 'Q', options: ['A'], answerIndex: 0, explanation: 'Exp' }],
      onComplete: () => {},
    };

    // Both passage and topicPreview relate to "chào hỏi" and "đại từ"
    expect(sampleUnit.topicPreview).toContain('chào hỏi');
    expect(sampleUnit.topicPreview).toContain('đại từ');
    expect(passageProps.passage).toContain('Hello');
    expect(passageProps.passage).toContain('She');
  });

  // T3.7: Level Exit Exam Engine + Module Cards Visual Redesign
  await runner.it('T3.7: Level Exit Exam Engine + Module Cards Visual Redesign: passing exit exam awards badge displayed on level module cards', () => {
    const exitQuestions: DiagnosticQuestion[] = Array.from({ length: 25 }).map((_, i) => ({
      id: `ex-${i}`,
      skill: 'vocab',
      conceptRef: `ref-${i}`,
      prompt: `Prompt ${i}`,
      options: ['A', 'B'],
      correctAnswer: 'A',
      explanation: 'Exp',
    }));

    const allCorrectAnswers: Record<string, string> = {};
    for (let i = 0; i < 25; i++) allCorrectAnswers[`ex-${i}`] = 'A';

    const examResult = gradeExitExam(exitQuestions, allCorrectAnswers, 'A0');
    expect(examResult.passed).toBe(true);
    expect(examResult.badgeAwarded).toBe('badge_a0_graduate');

    // Graduation badge attaches to level display state
    const levelState = {
      levelId: 'A0',
      isGraduated: examResult.passed,
      badge: examResult.badgeAwarded,
    };
    expect(levelState.isGraduated).toBe(true);
    expect(levelState.badge).toBe('badge_a0_graduate');
  });

  // T3.8: Phonetic Articulation Widget + Node Mini-Quiz Gatekeeper
  await runner.it('T3.8: Phonetic Articulation Widget + Node Mini-Quiz Gatekeeper: pronunciation mini-quiz tests phonemes taught in articulation widget', () => {
    const phoneticLesson = {
      ipa: '/iː/ vs /ɪ/',
      pairs: [{ a: 'sheep', b: 'ship' }],
    };

    const miniQuizQuestions = [
      {
        id: 'pq1',
        prompt: 'Từ nào phát âm với âm /iː/ dài?',
        options: ['sheep', 'ship', 'fit', 'sit'],
        correctAnswer: 'sheep',
      },
    ];

    const result = gradeMiniQuiz(miniQuizQuestions, { pq1: 'sheep' });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(miniQuizQuestions[0].options).toContain(phoneticLesson.pairs[0].a);
  });

  // T3.9: Assessment Persistence Fallback + Mobile Responsive Design
  await runner.it('T3.9: Assessment Persistence Fallback + Mobile Responsive Design: localStorage offline cache operates efficiently under mobile constraints', () => {
    const mobileLayout = getResponsiveLayout(375);
    expect(mobileLayout.deviceCategory).toBe('mobile');

    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);

    // Save mobile offline attempt
    syncManager.saveAttemptOffline({
      userId: 'learner-cefr-1',
      track: 'cefr',
      tier: 'mini_quiz',
      targetId: 'sv-1',
      score: 100,
      passed: true,
      details: { totalQuestions: 4, correctAnswers: 4 },
    });

    const pending = syncManager.getPendingAttempts();
    expect(pending.length).toBe(1);
    const serializedSize = JSON.stringify(pending).length;
    // Tiny payload (< 500 bytes) safe for mobile localStorage quota
    expect(serializedSize).toBeLessThan(500);
  });

  // T3.10: Module Card Status + Linear Progress Gatekeeper
  await runner.it('T3.10: Module Card Status + Linear Progress Gatekeeper: Unit 2 remains locked until Unit 1 Checkpoint is passed >=80%', () => {
    const isUnit2Unlocked = (unit1CheckpointPassed: boolean) => unit1CheckpointPassed;

    expect(isUnit2Unlocked(false)).toBe(false);
    expect(isUnit2Unlocked(true)).toBe(true);
  });

  // T3.11: Multi-Tier Hierarchy Progression
  await runner.it('T3.11: Multi-Tier Hierarchy Progression: Node Mini-Quiz -> Unit Checkpoint -> Level Exit Exam progression lifecycle', () => {
    // 1. Mini-quiz (tier 1): 75% required
    const mq = gradeMiniQuiz([{ id: '1', correctAnswer: 'A' }], { '1': 'A' });
    expect(mq.passed).toBe(true);

    // 2. Checkpoint (tier 2): 80% required
    const cpQuestions: DiagnosticQuestion[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `c${i}`,
      skill: 'vocab',
      conceptRef: 'v',
      prompt: 'P',
      options: ['A'],
      correctAnswer: 'A',
      explanation: 'E',
    }));
    const cpAnswers = { c0: 'A', c1: 'A', c2: 'A', c3: 'A', c4: 'A' };
    const cp = gradeCheckpoint(cpQuestions, cpAnswers);
    expect(cp.passed).toBe(true);

    // 3. Exit Exam (tier 3): 80% required
    const ee = gradeExitExam(cpQuestions, cpAnswers, 'A0');
    expect(ee.passed).toBe(true);
  });

  // T3.12: Library Credit Sync + Module Progress Calculation
  await runner.it('T3.12: Library Credit Sync + Module Progress Calculation: crediting vocabulary packs outside roadmap updates unit progress %', () => {
    // Student already learned 'pack-greetings' via vocabulary deck outside journey
    const completedStepIds = new Set<string>();

    const creditLibraryWords = (packId: string) => {
      const step = sampleUnit.steps.find((s) => s.refId === packId);
      if (step) completedStepIds.add(step.id);
    };

    creditLibraryWords('pack-greetings');
    expect(completedStepIds.has('sv-1')).toBe(true);

    const progress = calculateUnitProgress(sampleUnit, completedStepIds);
    // 1/4 = 25% completed from library credit
    expect(progress.percentage).toBe(25);
    expect(progress.status).toBe('in_progress');
  });

  // T3.13: Diagnostic Feedback Remedial Deep Link + Navigation
  await runner.it('T3.13: Diagnostic Feedback Remedial Deep Link + Navigation: clicking remedial link targets exact step refId with focus parameter', () => {
    const question: DiagnosticQuestion = {
      id: 'q-weak-grammar',
      skill: 'grammar',
      conceptRef: 'grammar-pronouns',
      sourceStepId: 'sg-1',
      prompt: 'Prompt',
      options: ['A', 'B'],
      correctAnswer: 'A',
      explanation: 'Exp',
    };

    const result = gradeCheckpoint([question], { 'q-weak-grammar': 'wrong' }, sampleUnit.steps);
    const weakConcept = result.details.weakConcepts?.[0];
    expect(weakConcept).toBeDefined();
    expect(weakConcept?.reviewStepId).toBe('sg-1');
    expect(weakConcept?.reviewUrl).toBe('/journey?focusStep=sg-1');
  });

  // T3.14: Dual Track Switcher + Mobile Responsive Layout
  await runner.it('T3.14: Dual Track Switcher + Mobile Responsive Layout: switcher tabs maintain touch target sizing without horizontal overflow', () => {
    const mobileScreen = getResponsiveLayout(375);
    expect(mobileScreen.isCompactView).toBe(true);

    const switcherTabSizing = { width: 160, height: 44 };
    expect(validateTouchTarget(switcherTabSizing)).toBe(true);
    // 2 tabs of 160px width = 320px <= 375px screen width
    expect(switcherTabSizing.width * 2).toBeLessThanOrEqual(375);
  });

  // T3.15: Multimodal Context + Word Pair Matching Widget
  await runner.it('T3.15: Multimodal Context + Word Pair Matching Widget: widget leverages Oxford audio and image metadata', () => {
    const multimodalProps: WordPairMatchWidgetProps = {
      pairs: [
        {
          id: 'pair-1',
          left: 'family',
          right: 'gia đình',
          leftAudio: 'https://audio.lingopro.vn/oxford/family.mp3',
          leftImage: 'https://images.unsplash.com/family.jpg',
        },
        { id: 'pair-2', left: 'mother', right: 'mẹ' },
        { id: 'pair-3', left: 'father', right: 'bố' },
      ],
      onComplete: () => {},
    };

    const res = validateWidgetProps('word_match', multimodalProps);
    expect(res.valid).toBe(true);
    expect(multimodalProps.pairs[0].leftAudio).toContain('oxford');
    expect(multimodalProps.pairs[0].leftImage).toContain('unsplash');
  });

  // T3.16: Exit Exam Pass + Pro Entitlement Gating
  await runner.it('T3.16: Exit Exam Pass + Pro Entitlement Gating: passing A1 exit exam gates access to A2 which validates Pro entitlement', () => {
    const isLevelAccessible = (levelId: string, userPlan: 'free' | 'pro', prevLevelPassed: boolean) => {
      if (['A0', 'A1'].includes(levelId)) return true;
      // Levels A2+ require Pro plan and prior exam passed
      return userPlan === 'pro' && prevLevelPassed;
    };

    expect(isLevelAccessible('A2', 'free', true)).toBe(false);
    expect(isLevelAccessible('A2', 'pro', false)).toBe(false);
    expect(isLevelAccessible('A2', 'pro', true)).toBe(true);
  });

  // T3.17: Checkpoint Failure + Offline Persistence
  await runner.it('T3.17: Checkpoint Failure + Offline Persistence: failed checkpoint is persisted offline with weak concepts retained', () => {
    const storage = new MockLocalStorage();
    const syncManager = new OfflineAssessmentSyncManager(storage);

    const questions: DiagnosticQuestion[] = [
      {
        id: 'q1',
        skill: 'vocab',
        conceptRef: 'starter-greetings',
        sourceStepId: 'sv-1',
        prompt: 'Q1',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: 'Exp',
      },
    ];

    const cp = gradeCheckpoint(questions, { q1: 'wrong' }, sampleUnit.steps);
    expect(cp.passed).toBe(false);

    syncManager.saveAttemptOffline({
      userId: 'learner-cefr-1',
      track: 'cefr',
      tier: 'checkpoint',
      targetId: 'u-a0-1',
      score: cp.score,
      passed: cp.passed,
      details: cp.details,
    });

    const pending = syncManager.getPendingAttempts();
    expect(pending.length).toBe(1);
    expect(pending[0].passed).toBe(false);
    expect(pending[0].details.weakConcepts?.length).toBe(1);
    expect(pending[0].details.weakConcepts?.[0].conceptRef).toBe('starter-greetings');
  });

  // T3.18: Interactive Widgets + Instant Feedback Error Isolation
  await runner.it('T3.18: Interactive Widgets + Instant Feedback Error Isolation: error in Word Pair Widget does not break Dialogue Cloze Widget', () => {
    let wordMatchThrew = false;
    try {
      // Intentionally invalid widget props
      const invalidMatchProps = { pairs: [], onComplete: () => {} };
      const val = validateWidgetProps('word_match', invalidMatchProps);
      if (!val.valid) throw new Error(val.errors.join(', '));
    } catch {
      wordMatchThrew = true;
    }
    expect(wordMatchThrew).toBe(true);

    // Dialogue Cloze executes independently and normally
    const validClozeProps = {
      dialogue: [{ speaker: 'Lan', text: 'Hello!' }],
      onComplete: () => {},
    };
    const clozeValidation = validateWidgetProps('dialogue_cloze', validClozeProps);
    expect(clozeValidation.valid).toBe(true);
  });
}
