/**
 * Empirical Adversarial Test Harness for Milestone 1: Speaking Curriculum Architecture & Types
 * Target: src/types/speaking-curriculum.ts and src/components/speaking/index.ts
 *
 * File: tests/speaking/adversarial-curriculum-m1.test.ts
 */

import {
  isSpeakingPhaseId,
  isCefrLevel,
  isSpeakingCurriculumLesson,
  isStandardizedSpeakingLesson,
  SPEAKING_PHASE_CONFIGS,
  type SpeakingCurriculumLesson,
  type StandardizedSpeakingLesson,
  type SpeakingPhaseId,
  type CefrLevel,
} from '../../src/types/speaking-curriculum';

import * as BarrelComponents from '../../src/components/speaking';
import * as DualSpeedModule from '../../src/components/speaking/dual-speed-audio-button';
import * as SafeHarborModule from '../../src/components/speaking/safe-harbor-recorder';
import * as StageNavModule from '../../src/components/speaking/stage-progress-nav';

interface TestResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  error?: string;
  isVulnerability?: boolean;
}

const results: TestResult[] = [];

function recordTest(
  name: string,
  passed: boolean,
  expected: unknown,
  actual: unknown,
  isVulnerability = false,
  error?: string
) {
  results.push({ name, passed, expected, actual, isVulnerability, error });
  const icon = passed ? '✅ PASS' : isVulnerability ? '⚠️ VULNERABILITY LEAK' : '❌ FAIL';
  console.log(`${icon} | ${name}`);
  if (!passed) {
    console.log(`     Expected: ${JSON.stringify(expected)} | Actual: ${JSON.stringify(actual)}`);
    if (error) console.log(`     Details: ${error}`);
  }
}

// ── Baseline Valid Curriculum Lesson Object ──────────────────────────────────
const validBaselineLesson: SpeakingCurriculumLesson = {
  id: 'p1-l01-self-introduction',
  phaseId: 'phase-1-beginner',
  order: 1,
  titleEn: 'Self Introduction',
  titleVi: 'Giới thiệu bản thân cơ bản',
  cefrLevel: 'A1',
  targetBandIelts: '0-3.0',
  estimatedMinutes: 15,
  summaryVi: 'Học cách giới thiệu tên, quê quán và nghề nghiệp.',
  stage1Phonetics: {
    titleVi: 'Luyện phụ âm đuôi /m/, /n/, /z/',
    focusSound: '/m/, /n/, /z/',
    vietnameseContrastiveTip: 'Người Việt hay nuốt phụ âm đuôi. Hãy khép môi nhẹ cho âm /m/.',
    minimalPairs: [
      {
        wordA: 'name',
        wordB: 'nine',
        ipaA: '/neɪm/',
        ipaB: '/naɪn/',
        meaningA: 'tên',
        meaningB: 'số chín',
      },
    ],
    practiceSentences: [
      {
        sentence: 'My name is Minh.',
        phoneticTarget: 'name /neɪm/',
        vietnameseTranslation: 'Tên tôi là Minh.',
      },
    ],
  },
  stage2CorePatterns: {
    titleVi: 'Khung câu đúc sẵn: Giới thiệu bản thân',
    vietnameseGrammarRule: 'Cấu trúc My name is + tên; I am from + nơi chốn.',
    formula: 'My name is {name}. I am from {place}.',
    legoSlots: [
      {
        template: 'My name is {name}.',
        slots: {
          name: ['Nam', 'Lan', 'Minh'],
        },
        examples: [{ en: 'My name is Nam.', vi: 'Tên tôi là Nam.' }],
      },
    ],
  },
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại làm quen tại quán cafe',
    contextVi: 'Bạn gặp một người bạn quốc tế tại quán cafe.',
    turns: [
      {
        speaker: 'Partner',
        en: 'Hi, what is your name?',
        vi: 'Xin chào, bạn tên là gì?',
        coreKeywords: ['what', 'name'],
      },
      {
        speaker: 'Learner',
        en: 'My name is Minh. Nice to meet you.',
        vi: 'Tôi tên là Minh. Rất vui được gặp bạn.',
        coreKeywords: ['my', 'name', 'Minh', 'nice', 'meet'],
      },
    ],
  },
  stage4SafeHarborEvaluation: {
    titleVi: 'Đánh giá phản xạ giới thiệu bản thân',
    promptVi: 'Hãy nói câu giới thiệu tên bạn là Nam và bạn đến từ Hà Nội.',
    targetSentence: "My name is Nam and I'm from Hanoi.",
    acceptableVariations: [
      'My name is Nam, I am from Hanoi.',
      'I am Nam and I come from Hanoi.',
    ],
    coreKeywords: ['name', 'Nam', 'from', 'Hanoi'],
    minimumPassingScore: 75,
  },
};

// ── Baseline Valid Standardized Lesson ───────────────────────────────────────
const validStandardizedLesson: StandardizedSpeakingLesson = {
  id: 'elllo-1420-hometown',
  source: 'elllo',
  title: 'Talking about your hometown',
  cefrLevel: 'A2',
  topic: 'Hometown & Living',
  audioUrl: 'https://example.com/audio/1420.mp3',
  turns: [
    {
      speaker: 'Host',
      textEn: 'Where are you from originally?',
      coreKeywords: ['where', 'from'],
    },
  ],
  vocabulary: [
    {
      term: 'coastal',
      meaningVi: 'thuộc vùng ven biển',
    },
  ],
  reflexPairs: [
    {
      promptEn: 'Where is your hometown?',
      responseEn: 'My hometown is in the countryside.',
      coreKeywords: ['hometown', 'countryside'],
    },
  ],
  qualityScore: 95,
};

console.log('================================================================================');
console.log('  EMPIRICAL ADVERSARIAL CHALLENGE SUITE: MILESTONE 1 (SPEAKING CURRICULUM)     ');
console.log('================================================================================\n');

// ── TIER 1: isSpeakingCurriculumLesson Boundary & Corner Case Challenges ──────
console.log('--- Tier 1: isSpeakingCurriculumLesson Boundary & Corner Cases ---');

// 1.1 Baseline sanity
const baselineValid = isSpeakingCurriculumLesson(validBaselineLesson);
recordTest('1.1 Baseline valid lesson passes type guard', baselineValid, true, baselineValid);

// 1.2 Invalid CEFR Levels: 'C1', 'C2', 'B3', empty string, number
const c1Lesson = { ...validBaselineLesson, cefrLevel: 'C1' };
const c1Res = isSpeakingCurriculumLesson(c1Lesson);
recordTest('1.2a Rejects CEFR "C1" (curriculum max is B2)', !c1Res, false, c1Res);

const c2Lesson = { ...validBaselineLesson, cefrLevel: 'C2' };
const c2Res = isSpeakingCurriculumLesson(c2Lesson);
recordTest('1.2b Rejects CEFR "C2" (curriculum max is B2)', !c2Res, false, c2Res);

const invalidCefrLesson = { ...validBaselineLesson, cefrLevel: 'INVALID' };
const invCefrRes = isSpeakingCurriculumLesson(invalidCefrLesson);
recordTest('1.2c Rejects arbitrary invalid CEFR string', !invCefrRes, false, invCefrRes);

const emptyCefrLesson = { ...validBaselineLesson, cefrLevel: '' };
const emptyCefrRes = isSpeakingCurriculumLesson(emptyCefrLesson);
recordTest('1.2d Rejects empty string CEFR', !emptyCefrRes, false, emptyCefrRes);

// 1.3 Missing or Malformed Stages
const missingStage1 = { ...validBaselineLesson, stage1Phonetics: undefined };
recordTest('1.3a Rejects missing stage1Phonetics', !isSpeakingCurriculumLesson(missingStage1), false, isSpeakingCurriculumLesson(missingStage1));

const missingStage2 = { ...validBaselineLesson, stage2CorePatterns: undefined };
recordTest('1.3b Rejects missing stage2CorePatterns', !isSpeakingCurriculumLesson(missingStage2), false, isSpeakingCurriculumLesson(missingStage2));

const missingStage3 = { ...validBaselineLesson, stage3GuidedDialogue: undefined };
recordTest('1.3c Rejects missing stage3GuidedDialogue', !isSpeakingCurriculumLesson(missingStage3), false, isSpeakingCurriculumLesson(missingStage3));

const missingStage4 = { ...validBaselineLesson, stage4SafeHarborEvaluation: undefined };
recordTest('1.3d Rejects missing stage4SafeHarborEvaluation', !isSpeakingCurriculumLesson(missingStage4), false, isSpeakingCurriculumLesson(missingStage4));

const nullStage1 = { ...validBaselineLesson, stage1Phonetics: null };
recordTest('1.3e Rejects null stage1Phonetics', !isSpeakingCurriculumLesson(nullStage1), false, isSpeakingCurriculumLesson(nullStage1));

const stringStage2 = { ...validBaselineLesson, stage2CorePatterns: 'not an object' };
recordTest('1.3f Rejects primitive string for stage2CorePatterns', !isSpeakingCurriculumLesson(stringStage2), false, isSpeakingCurriculumLesson(stringStage2));

// 1.4 Deep Structural Edge Cases: Non-array turns & Negative Numbers
// ADVERSARIAL PROBE: Does isSpeakingCurriculumLesson validate that turns is an Array?
const nonArrayTurnsLesson = {
  ...validBaselineLesson,
  stage3GuidedDialogue: {
    titleVi: 'Hội thoại lỗi',
    contextVi: 'Ngữ cảnh lỗi',
    turns: 'THIS_IS_NOT_AN_ARRAY',
  },
};
const nonArrayTurnsRes = isSpeakingCurriculumLesson(nonArrayTurnsLesson);
// If isSpeakingCurriculumLesson returns true, it's a vulnerability leak because runtime player will crash on turns.map(...)!
const turnsArrayProtected = (nonArrayTurnsRes === false);
recordTest(
  '1.4a Deep check: Rejects stage3GuidedDialogue with non-array turns',
  turnsArrayProtected,
  false,
  nonArrayTurnsRes,
  !turnsArrayProtected,
  !turnsArrayProtected ? 'Vulnerability: Type guard does not verify Array.isArray(stage3GuidedDialogue.turns)' : undefined
);

// ADVERSARIAL PROBE: Empty object stages {}
const emptyObjectStagesLesson = {
  ...validBaselineLesson,
  stage1Phonetics: {},
  stage2CorePatterns: {},
  stage3GuidedDialogue: {},
  stage4SafeHarborEvaluation: {},
};
const emptyStagesRes = isSpeakingCurriculumLesson(emptyObjectStagesLesson);
const emptyStagesProtected = (emptyStagesRes === false);
recordTest(
  '1.4b Deep check: Rejects stages that are empty dummy objects {} lacking core fields',
  emptyStagesProtected,
  false,
  emptyStagesRes,
  !emptyStagesProtected,
  !emptyStagesProtected ? 'Shallow Guard: isSpeakingCurriculumLesson accepts empty {} for all 4 stages' : undefined
);

// ADVERSARIAL PROBE: Negative numbers
const negativeMinutesLesson = { ...validBaselineLesson, estimatedMinutes: -15 };
const negMinRes = isSpeakingCurriculumLesson(negativeMinutesLesson);
const negMinProtected = (negMinRes === false);
recordTest(
  '1.4c Deep check: Rejects negative estimatedMinutes (-15)',
  negMinProtected,
  false,
  negMinRes,
  !negMinProtected,
  !negMinProtected ? 'Boundary leak: typeof number check accepts negative minutes' : undefined
);

const negativeOrderLesson = { ...validBaselineLesson, order: -1 };
const negOrderRes = isSpeakingCurriculumLesson(negativeOrderLesson);
const negOrderProtected = (negOrderRes === false);
recordTest(
  '1.4d Deep check: Rejects negative lesson order (-1)',
  negOrderProtected,
  false,
  negOrderRes,
  !negOrderProtected,
  !negOrderProtected ? 'Boundary leak: typeof number check accepts negative order' : undefined
);

const negativeScoreLesson = {
  ...validBaselineLesson,
  stage4SafeHarborEvaluation: {
    ...validBaselineLesson.stage4SafeHarborEvaluation,
    minimumPassingScore: -50,
  },
};
const negScoreRes = isSpeakingCurriculumLesson(negativeScoreLesson);
const negScoreProtected = (negScoreRes === false);
recordTest(
  '1.4e Deep check: Rejects negative minimumPassingScore (-50)',
  negScoreProtected,
  false,
  negScoreRes,
  !negScoreProtected,
  !negScoreProtected ? 'Boundary leak: minimumPassingScore is not validated for positive range [0, 100]' : undefined
);

// ── TIER 2: isStandardizedSpeakingLesson Boundary & Corner Cases ──────────────
console.log('\n--- Tier 2: isStandardizedSpeakingLesson Boundary & Corner Cases ---');

const baseStdValid = isStandardizedSpeakingLesson(validStandardizedLesson);
recordTest('2.1 Baseline valid standardized lesson passes', baseStdValid, true, baseStdValid);

const stdC2 = { ...validStandardizedLesson, cefrLevel: 'C2' };
const stdC2Res = isStandardizedSpeakingLesson(stdC2);
recordTest('2.2 Rejects CEFR "C2" in standardized lesson', !stdC2Res, false, stdC2Res);

const stdNonArrayTurns = { ...validStandardizedLesson, turns: 'not array' };
recordTest('2.3 Rejects non-array turns in standardized lesson', !isStandardizedSpeakingLesson(stdNonArrayTurns), false, isStandardizedSpeakingLesson(stdNonArrayTurns));

const stdNonArrayVocab = { ...validStandardizedLesson, vocabulary: { item: 1 } };
recordTest('2.4 Rejects non-array vocabulary in standardized lesson', !isStandardizedSpeakingLesson(stdNonArrayVocab), false, isStandardizedSpeakingLesson(stdNonArrayVocab));

const stdNonArrayReflex = { ...validStandardizedLesson, reflexPairs: null };
recordTest('2.5 Rejects non-array reflexPairs in standardized lesson', !isStandardizedSpeakingLesson(stdNonArrayReflex), false, isStandardizedSpeakingLesson(stdNonArrayReflex));

// ── TIER 3: SPEAKING_PHASE_CONFIGS Validation ─────────────────────────────────
console.log('\n--- Tier 3: SPEAKING_PHASE_CONFIGS Architecture & Metadata Validation ---');

const phaseKeys = Object.keys(SPEAKING_PHASE_CONFIGS) as SpeakingPhaseId[];
recordTest(
  '3.1 All 3 canonical phases defined in config',
  phaseKeys.length === 3 &&
    phaseKeys.includes('phase-1-beginner') &&
    phaseKeys.includes('phase-2-elementary') &&
    phaseKeys.includes('phase-3-intermediate'),
  3,
  phaseKeys.length
);

// Verify totalLessons sums to 32
const totalLessonsSum = phaseKeys.reduce((sum, k) => sum + SPEAKING_PHASE_CONFIGS[k].totalLessons, 0);
recordTest(
  '3.2 totalLessons across phases equals exactly 32 (12 + 10 + 10)',
  totalLessonsSum === 32,
  32,
  totalLessonsSum
);

recordTest(
  '3.3 Phase 1 totalLessons is exactly 12',
  SPEAKING_PHASE_CONFIGS['phase-1-beginner'].totalLessons === 12,
  12,
  SPEAKING_PHASE_CONFIGS['phase-1-beginner'].totalLessons
);

recordTest(
  '3.4 Phase 2 totalLessons is exactly 10',
  SPEAKING_PHASE_CONFIGS['phase-2-elementary'].totalLessons === 10,
  10,
  SPEAKING_PHASE_CONFIGS['phase-2-elementary'].totalLessons
);

recordTest(
  '3.5 Phase 3 totalLessons is exactly 10',
  SPEAKING_PHASE_CONFIGS['phase-3-intermediate'].totalLessons === 10,
  10,
  SPEAKING_PHASE_CONFIGS['phase-3-intermediate'].totalLessons
);

// Verify CEFR and Tier alignment
for (const p of phaseKeys) {
  const meta = SPEAKING_PHASE_CONFIGS[p];
  recordTest(
    `3.6 Phase ${p} CEFR level "${meta.cefrLevel}" is valid CEFR`,
    isCefrLevel(meta.cefrLevel),
    true,
    isCefrLevel(meta.cefrLevel)
  );
  recordTest(
    `3.7 Phase ${p} phaseId "${meta.phaseId}" matches key`,
    meta.phaseId === p,
    p,
    meta.phaseId
  );
  recordTest(
    `3.8 Phase ${p} has non-empty titleEn, titleVi, and badge`,
    Boolean(meta.titleEn && meta.titleVi && meta.badge),
    true,
    Boolean(meta.titleEn && meta.titleVi && meta.badge)
  );
}

// ADVERSARIAL INSPECTION: Check if lesson IDs are explicitly defined in SPEAKING_PHASE_CONFIGS
const rawPhase1 = SPEAKING_PHASE_CONFIGS['phase-1-beginner'] as unknown as Record<string, unknown>;
const hasLessonIdsArray = Array.isArray(rawPhase1.lessonIds);
recordTest(
  '3.9 Inspection: SPEAKING_PHASE_CONFIGS contains lessonIds array',
  hasLessonIdsArray,
  true,
  hasLessonIdsArray,
  !hasLessonIdsArray,
  !hasLessonIdsArray
    ? 'Design Finding: SPEAKING_PHASE_CONFIGS defines phase metadata and totalLessons count, but does not embed the 32 individual lesson ID strings (actual 32 lesson content files are scheduled for M3)'
    : undefined
);

// ── TIER 4: Component Re-exports & Barrel Import Resolution ───────────────────
console.log('\n--- Tier 4: Component Re-exports & Barrel Import Resolution ---');

recordTest(
  '4.1 Barrel exports DualSpeedAudioButton as a valid React component/function',
  typeof BarrelComponents.DualSpeedAudioButton === 'function',
  'function',
  typeof BarrelComponents.DualSpeedAudioButton
);

recordTest(
  '4.2 Barrel exports SafeHarborRecorder as a valid React component/function',
  typeof BarrelComponents.SafeHarborRecorder === 'function',
  'function',
  typeof BarrelComponents.SafeHarborRecorder
);

recordTest(
  '4.3 Barrel exports StageProgressNav as a valid React component/function',
  typeof BarrelComponents.StageProgressNav === 'function',
  'function',
  typeof BarrelComponents.StageProgressNav
);

recordTest(
  '4.4 Barrel exports SpeechRecorder as a valid React component/function',
  typeof BarrelComponents.SpeechRecorder === 'function',
  'function',
  typeof BarrelComponents.SpeechRecorder
);

recordTest(
  '4.5 Barrel exports FOUNDATION_STAGES array with 5 stages (mindset + stage 0-3)',
  Array.isArray(BarrelComponents.FOUNDATION_STAGES) && BarrelComponents.FOUNDATION_STAGES.length === 5,
  5,
  BarrelComponents.FOUNDATION_STAGES?.length
);

// Modular subpath import tests
recordTest(
  '4.6 Modular dual-speed-audio-button exports DualSpeedAudioButton & default',
  typeof DualSpeedModule.DualSpeedAudioButton === 'function' && typeof DualSpeedModule.default === 'function',
  true,
  typeof DualSpeedModule.DualSpeedAudioButton === 'function' && typeof DualSpeedModule.default === 'function'
);

recordTest(
  '4.7 Modular safe-harbor-recorder exports SafeHarborRecorder & default',
  typeof SafeHarborModule.SafeHarborRecorder === 'function' && typeof SafeHarborModule.default === 'function',
  true,
  typeof SafeHarborModule.SafeHarborRecorder === 'function' && typeof SafeHarborModule.default === 'function'
);

recordTest(
  '4.8 Modular stage-progress-nav exports StageProgressNav, default, & FOUNDATION_STAGES',
  typeof StageNavModule.StageProgressNav === 'function' &&
    typeof StageNavModule.default === 'function' &&
    Array.isArray(StageNavModule.FOUNDATION_STAGES),
  true,
  typeof StageNavModule.StageProgressNav === 'function' &&
    typeof StageNavModule.default === 'function' &&
    Array.isArray(StageNavModule.FOUNDATION_STAGES)
);

// ── Summary Report ───────────────────────────────────────────────────────────
console.log('\n================================================================================');
console.log('  CHALLENGE EXECUTION SUMMARY');
console.log('================================================================================');

const totalTests = results.length;
const passedTests = results.filter((r) => r.passed).length;
const failedTests = results.filter((r) => !r.passed && !r.isVulnerability).length;
const vulnerabilities = results.filter((r) => r.isVulnerability).length;

console.log(`Total Scenarios Tested: ${totalTests}`);
console.log(`Passed:                 ${passedTests}`);
console.log(`Failed (Hard Failure):  ${failedTests}`);
console.log(`Vulnerabilities / Leaks Found: ${vulnerabilities}`);
console.log('================================================================================\n');

if (vulnerabilities > 0) {
  console.log('Detected Edge-Case Vulnerabilities & Leaks:');
  for (const v of results.filter((r) => r.isVulnerability)) {
    console.log(`- [${v.name}] ${v.error}`);
  }
}
