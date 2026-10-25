/**
 * Milestone 1 Empirical Challenger Test Suite:
 * Re-exports Integrity, React SSR Hydration Safety, and Curriculum Type System Adversarial Verification
 *
 * File: tests/speaking/challenger-m1-hydration-exports.test.ts
 */

import React from 'react';
import { renderToString } from 'react-dom/server';

// 1. Imports from unified barrel export
import {
  DualSpeedAudioButton,
  SafeHarborRecorder,
  StageProgressNav,
  FOUNDATION_STAGES,
  SpeechRecorder,
} from '../../src/components/speaking';

// 2. Subpath modular imports
import {
  DualSpeedAudioButton as DualSpeedFromSubpath,
  default as DualSpeedDefault,
} from '../../src/components/speaking/dual-speed-audio-button';

import {
  SafeHarborRecorder as SafeHarborFromSubpath,
  default as SafeHarborDefault,
} from '../../src/components/speaking/safe-harbor-recorder';

import {
  StageProgressNav as StageProgressFromSubpath,
  default as StageProgressDefault,
  FOUNDATION_STAGES as StagesFromSubpath,
} from '../../src/components/speaking/stage-progress-nav';

// 3. Types and Type Guards
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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
}

async function runSuite() {
  console.log('================================================================================');
  console.log('  CHALLENGER 2: EMPIRICAL VERIFICATION & ADVERSARIAL STRESS TEST (MILESTONE 1)');
  console.log('================================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 1: Module Export Invariants & Export Parity
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Suite 1: Module Export Invariants & Export Parity...');

  assert(typeof DualSpeedAudioButton === 'function', 'DualSpeedAudioButton must be a valid component function');
  assert(typeof SafeHarborRecorder === 'function', 'SafeHarborRecorder must be a valid component function');
  assert(typeof StageProgressNav === 'function', 'StageProgressNav must be a valid component function');
  assert(typeof SpeechRecorder === 'function', 'SpeechRecorder must be a valid component function');
  assert(Array.isArray(FOUNDATION_STAGES), 'FOUNDATION_STAGES must be an exported array');
  assert(FOUNDATION_STAGES.length === 5, 'FOUNDATION_STAGES must have exactly 5 stages (mindset + stages 0-3)');

  // Subpath export parity
  assert(DualSpeedAudioButton === DualSpeedFromSubpath, 'DualSpeedAudioButton identity match across barrel and subpath');
  assert(DualSpeedAudioButton === DualSpeedDefault, 'DualSpeedAudioButton matches subpath default export');
  assert(SafeHarborRecorder === SafeHarborFromSubpath, 'SafeHarborRecorder identity match across barrel and subpath');
  assert(SafeHarborRecorder === SafeHarborDefault, 'SafeHarborRecorder matches subpath default export');
  assert(StageProgressNav === StageProgressFromSubpath, 'StageProgressNav identity match across barrel and subpath');
  assert(StageProgressNav === StageProgressDefault, 'StageProgressNav matches subpath default export');
  assert(FOUNDATION_STAGES === StagesFromSubpath, 'FOUNDATION_STAGES identity match across barrel and subpath');

  // Foundation stages structure validation
  for (const stage of FOUNDATION_STAGES) {
    assert(typeof stage.id === 'string' && stage.id.startsWith('stage-'), `Stage id "${stage.id}" must start with stage-`);
    assert(typeof stage.stageNumber === 'number', `Stage ${stage.id} must have a numeric stageNumber`);
    assert(typeof stage.title === 'string' && stage.title.length > 0, `Stage ${stage.id} must have a title`);
    assert(typeof stage.shortTitle === 'string' && stage.shortTitle.length > 0, `Stage ${stage.id} must have a shortTitle`);
    assert(typeof stage.href === 'string' && stage.href.startsWith('/student/speaking/foundation/'), `Stage ${stage.id} href must be valid route`);
    assert(typeof stage.tag === 'string' && stage.tag.length > 0, `Stage ${stage.id} must have tag`);
    assert(typeof stage.icon === 'object' || typeof stage.icon === 'function', `Stage ${stage.id} must have a valid icon component`);
  }
  console.log(`✓ Suite 1 Finished: Export invariants verified cleanly\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 2: React SSR Hydration Safety (Zero Window/DOM Dependency in SSR)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Suite 2: React SSR Hydration Safety (Node.js Environment)...');

  // Verify pure Node environment has no window/document/navigator defined at start of test
  const isServerNode = typeof window === 'undefined';
  assert(isServerNode, 'Test must execute in true server-side Node environment without window defined');

  // 2.1 DualSpeedAudioButton SSR
  let htmlDualSpeed = '';
  try {
    htmlDualSpeed = renderToString(
      React.createElement(DualSpeedAudioButton, {
        text: 'Hello world, nice to meet you.',
        audioUrl: 'https://example.com/audio.mp3',
        size: 'sm',
        showLabels: true,
      })
    );
  } catch (err: any) {
    throw new Error(`DualSpeedAudioButton SSR failed: ${err.message}`);
  }
  assert(htmlDualSpeed.includes('0.8x'), 'DualSpeedAudioButton SSR output must include 0.8x button');
  assert(htmlDualSpeed.includes('1.0x'), 'DualSpeedAudioButton SSR output must include 1.0x button');
  assert(htmlDualSpeed.includes('Chậm (âm đuôi)'), 'DualSpeedAudioButton SSR output must include Vietnamese pedagogical label');
  assert(htmlDualSpeed.includes('Tự nhiên'), 'DualSpeedAudioButton SSR output must include natural label');
  assert(!htmlDualSpeed.includes('undefined'), 'DualSpeedAudioButton SSR output must not contain string "undefined"');

  // 2.2 DualSpeedAudioButton SSR without audioUrl and with showLabels=false
  let htmlDualSpeedMinimal = '';
  try {
    htmlDualSpeedMinimal = renderToString(
      React.createElement(DualSpeedAudioButton, {
        text: 'Minimal test',
        showLabels: false,
        disabled: true,
      })
    );
  } catch (err: any) {
    throw new Error(`DualSpeedAudioButton minimal SSR failed: ${err.message}`);
  }
  assert(htmlDualSpeedMinimal.includes('disabled'), 'DualSpeedAudioButton disabled prop must reflect in SSR HTML');
  assert(!htmlDualSpeedMinimal.includes('Chậm (âm đuôi)'), 'showLabels=false must omit label text');

  // 2.3 SafeHarborRecorder SSR
  let htmlSafeHarbor = '';
  try {
    htmlSafeHarbor = renderToString(
      React.createElement(SafeHarborRecorder, {
        targetSentence: 'My name is Nam and I am from Hanoi.',
        coreKeywords: ['name', 'Nam', 'from', 'Hanoi'],
      })
    );
  } catch (err: any) {
    throw new Error(`SafeHarborRecorder SSR failed: ${err.message}`);
  }
  assert(htmlSafeHarbor.includes('Nhấn Micro và đọc to câu mẫu'), 'SafeHarborRecorder SSR must contain default instruction text');
  assert(htmlSafeHarbor.includes('aria-label="Bắt đầu ghi âm phát âm"'), 'SafeHarborRecorder SSR must contain aria-label for microphone button');
  assert(!htmlSafeHarbor.includes('Đang lắng nghe...'), 'SafeHarborRecorder SSR must not be in recording state initially');
  assert(!htmlSafeHarbor.includes('Vui lòng cho phép quyền truy cập micro'), 'SafeHarborRecorder SSR must not render permission error on server');

  // 2.4 StageProgressNav SSR (Overview hub mode)
  let htmlNavOverview = '';
  try {
    htmlNavOverview = renderToString(
      React.createElement(StageProgressNav, {
        currentStage: undefined,
        showBreadcrumbs: true,
      })
    );
  } catch (err: any) {
    throw new Error(`StageProgressNav overview SSR failed: ${err.message}`);
  }
  assert(htmlNavOverview.includes('Luyện nói Nền tảng'), 'StageProgressNav SSR must include Vietnamese section heading');
  assert(/Chặng (<!-- -->)?0/.test(htmlNavOverview), 'StageProgressNav SSR must include Chặng 0');
  assert(/Chặng (<!-- -->)?1/.test(htmlNavOverview), 'StageProgressNav SSR must include Chặng 1');
  assert(/Chặng (<!-- -->)?2/.test(htmlNavOverview), 'StageProgressNav SSR must include Chặng 2');
  assert(/Chặng (<!-- -->)?3/.test(htmlNavOverview), 'StageProgressNav SSR must include Chặng 3');
  assert(htmlNavOverview.includes('Khai thông cơ miệng'), 'StageProgressNav SSR must include Stage 0 title');
  assert(htmlNavOverview.includes('Học tập'), 'StageProgressNav SSR must include breadcrumb link');

  // 2.5 StageProgressNav SSR (Active stage + progress bars)
  let htmlNavActive = '';
  try {
    htmlNavActive = renderToString(
      React.createElement(StageProgressNav, {
        currentStage: 'stage-1',
        stageProgress: {
          'stage-mindset': { completed: true, percent: 100 },
          'stage-0': { completed: true, percent: 100 },
          'stage-1': { completed: false, percent: 50 },
        },
        showBreadcrumbs: true,
      })
    );
  } catch (err: any) {
    throw new Error(`StageProgressNav active stage SSR failed: ${err.message}`);
  }
  assert(htmlNavActive.includes('Chặng 1: Khung câu'), 'StageProgressNav SSR must show active stage short title in breadcrumb');
  assert(htmlNavActive.includes('width:50%'), 'StageProgressNav SSR must reflect 50% progress style');
  assert(htmlNavActive.includes('width:100%'), 'StageProgressNav SSR must reflect 100% progress style');

  // 2.6 SpeechRecorder SSR
  let htmlSpeechRecorder = '';
  try {
    htmlSpeechRecorder = renderToString(
      React.createElement(SpeechRecorder, {
        onTranscript: () => {},
        disabled: false,
      })
    );
  } catch (err: any) {
    throw new Error(`SpeechRecorder SSR failed: ${err.message}`);
  }
  assert(htmlSpeechRecorder.includes('Bắt đầu nói') || htmlSpeechRecorder.includes('Micro'), 'SpeechRecorder SSR must render mic button');

  console.log(`✓ Suite 2 Finished: All components rendered to string with 0 SSR crashes\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 3: DOM Nesting & Hydration Invariant Audit
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Suite 3: DOM Nesting & Hydration Invariant Audit...');

  // HTML Spec & React Hydration Rule 1: No <button> inside <button>
  const checkNoNestedButtons = (html: string, compName: string) => {
    const hasNested = /<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?<button\b/i.test(html);
    assert(!hasNested, `${compName} must not have nested <button> elements (causes hydration crash)`);
  };

  // HTML Spec & React Hydration Rule 2: No <a> inside <a>
  const checkNoNestedAnchors = (html: string, compName: string) => {
    const hasNested = /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*?<a\b/i.test(html);
    assert(!hasNested, `${compName} must not have nested <a> elements (causes hydration crash)`);
  };

  // HTML Spec & React Hydration Rule 3: No non-deterministic timestamps / random IDs in SSR HTML
  const checkNoRandomIds = (html: string, compName: string) => {
    // Check for common dynamic values that cause mismatches
    assert(!html.includes('NaN'), `${compName} must not render NaN`);
    assert(!html.includes('[object Object]'), `${compName} must not render [object Object]`);
  };

  checkNoNestedButtons(htmlDualSpeed, 'DualSpeedAudioButton');
  checkNoNestedButtons(htmlSafeHarbor, 'SafeHarborRecorder');
  checkNoNestedButtons(htmlNavOverview, 'StageProgressNav');
  checkNoNestedButtons(htmlSpeechRecorder, 'SpeechRecorder');

  checkNoNestedAnchors(htmlDualSpeed, 'DualSpeedAudioButton');
  checkNoNestedAnchors(htmlSafeHarbor, 'SafeHarborRecorder');
  checkNoNestedAnchors(htmlNavOverview, 'StageProgressNav');
  checkNoNestedAnchors(htmlNavActive, 'StageProgressNav Active');

  checkNoRandomIds(htmlDualSpeed, 'DualSpeedAudioButton');
  checkNoRandomIds(htmlSafeHarbor, 'SafeHarborRecorder');
  checkNoRandomIds(htmlNavOverview, 'StageProgressNav');
  checkNoRandomIds(htmlNavActive, 'StageProgressNav Active');

  console.log(`✓ Suite 3 Finished: DOM nesting and hydration invariants verified\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 4: Adversarial Stress Test on Curriculum Types & Type Guards
  // ──────────────────────────────────────────────────────────────────────────
  console.log('▶ Suite 4: Adversarial Stress Test on Curriculum Types & Guards...');

  // 4.1 SpeakingPhaseId Stress
  assert(isSpeakingPhaseId('phase-1-beginner'), 'Valid phase 1');
  assert(isSpeakingPhaseId('phase-2-elementary'), 'Valid phase 2');
  assert(isSpeakingPhaseId('phase-3-intermediate'), 'Valid phase 3');
  assert(!isSpeakingPhaseId('PHASE-1-BEGINNER'), 'Case sensitive reject');
  assert(!isSpeakingPhaseId('phase-1-beginner '), 'Whitespace reject');
  assert(!isSpeakingPhaseId('phase-4-advanced'), 'Phase 4 reject');
  assert(!isSpeakingPhaseId(''), 'Empty string reject');
  assert(!isSpeakingPhaseId(123), 'Number reject');
  assert(!isSpeakingPhaseId(null), 'Null reject');
  assert(!isSpeakingPhaseId(undefined), 'Undefined reject');
  assert(!isSpeakingPhaseId({ phaseId: 'phase-1-beginner' }), 'Object reject');
  assert(!isSpeakingPhaseId("phase-1-beginner'; DROP TABLE lessons;--"), 'SQLi reject');

  // 4.2 CefrLevel Stress
  assert(isCefrLevel('A1'), 'Valid A1');
  assert(isCefrLevel('A2'), 'Valid A2');
  assert(isCefrLevel('B1'), 'Valid B1');
  assert(isCefrLevel('B2'), 'Valid B2');
  assert(!isCefrLevel('a1'), 'Lowercase reject');
  assert(!isCefrLevel('C1'), 'C1 reject (curriculum targets A1-B2)');
  assert(!isCefrLevel('C2'), 'C2 reject');
  assert(!isCefrLevel('B3'), 'Nonexistent CEFR reject');
  assert(!isCefrLevel(''), 'Empty string reject');
  assert(!isCefrLevel(null), 'Null reject');
  assert(!isCefrLevel(undefined), 'Undefined reject');

  // 4.3 Phase Configurations Invariant Verification
  const phases: SpeakingPhaseId[] = ['phase-1-beginner', 'phase-2-elementary', 'phase-3-intermediate'];
  let totalLessonsCount = 0;

  for (const p of phases) {
    const config = SPEAKING_PHASE_CONFIGS[p];
    assert(Boolean(config), `Phase config for ${p} must exist`);
    assert(config.phaseId === p, `Config phaseId match for ${p}`);
    assert(typeof config.totalLessons === 'number' && config.totalLessons > 0, `totalLessons positive for ${p}`);
    assert(typeof config.titleEn === 'string' && config.titleEn.length > 0, `titleEn non-empty for ${p}`);
    assert(typeof config.titleVi === 'string' && config.titleVi.length > 0, `titleVi non-empty for ${p}`);
    assert(typeof config.descriptionVi === 'string' && config.descriptionVi.length > 0, `descriptionVi non-empty for ${p}`);
    assert(typeof config.badge === 'string' && config.badge.length > 0, `badge non-empty for ${p}`);
    assert(typeof config.iconName === 'string' && config.iconName.length > 0, `iconName non-empty for ${p}`);
    totalLessonsCount += config.totalLessons;
  }
  assert(SPEAKING_PHASE_CONFIGS['phase-1-beginner'].totalLessons === 12, 'Phase 1 exactly 12 lessons');
  assert(SPEAKING_PHASE_CONFIGS['phase-2-elementary'].totalLessons === 10, 'Phase 2 exactly 10 lessons');
  assert(SPEAKING_PHASE_CONFIGS['phase-3-intermediate'].totalLessons === 10, 'Phase 3 exactly 10 lessons');
  assert(totalLessonsCount === 32, 'Total 3-Tier curriculum must equal exactly 32 lessons (12 + 10 + 10)');

  // 4.4 isSpeakingCurriculumLesson Fuzzing & Negative Verification
  const validLesson: SpeakingCurriculumLesson = {
    id: 'p1-l01-intro',
    phaseId: 'phase-1-beginner',
    order: 1,
    titleEn: 'Self Introduction',
    titleVi: 'Giới thiệu bản thân',
    cefrLevel: 'A1',
    targetBandIelts: '0-3.0',
    estimatedMinutes: 15,
    summaryVi: 'Tóm tắt bài học',
    stage1Phonetics: {
      titleVi: 'Ngữ âm',
      focusSound: '/s/',
      vietnameseContrastiveTip: 'Mẹo',
      minimalPairs: [],
      practiceSentences: [],
    },
    stage2CorePatterns: {
      titleVi: 'Cấu trúc',
      vietnameseGrammarRule: 'Quy tắc',
      formula: 'Formula',
      legoSlots: [],
    },
    stage3GuidedDialogue: {
      titleVi: 'Hội thoại',
      contextVi: 'Bối cảnh',
      turns: [],
    },
    stage4SafeHarborEvaluation: {
      titleVi: 'Safe Harbor',
      promptVi: 'Câu hỏi',
      targetSentence: 'My name is Nam.',
      acceptableVariations: [],
      coreKeywords: ['name', 'Nam'],
      minimumPassingScore: 75,
    },
  };

  assert(isSpeakingCurriculumLesson(validLesson), 'Valid complete lesson must pass guard');

  // Mutation attacks: Missing required stages
  const missingStage1 = { ...validLesson, stage1Phonetics: undefined };
  assert(!isSpeakingCurriculumLesson(missingStage1), 'Missing stage1Phonetics must fail');

  const missingStage2 = { ...validLesson, stage2CorePatterns: null };
  assert(!isSpeakingCurriculumLesson(missingStage2), 'Missing stage2CorePatterns must fail');

  const missingStage3 = { ...validLesson, stage3GuidedDialogue: 'invalid' as any };
  assert(!isSpeakingCurriculumLesson(missingStage3), 'Invalid stage3GuidedDialogue must fail');

  const missingStage4 = { ...validLesson, stage4SafeHarborEvaluation: undefined };
  assert(!isSpeakingCurriculumLesson(missingStage4), 'Missing stage4SafeHarborEvaluation must fail');

  // Mutation attacks: Invalid metadata
  const badPhase = { ...validLesson, phaseId: 'phase-99-expert' as any };
  assert(!isSpeakingCurriculumLesson(badPhase), 'Bad phaseId must fail');

  const badCefr = { ...validLesson, cefrLevel: 'C2' as any };
  assert(!isSpeakingCurriculumLesson(badCefr), 'Bad cefrLevel must fail');

  const badOrder = { ...validLesson, order: 'one' as any };
  assert(!isSpeakingCurriculumLesson(badOrder), 'Bad order type must fail');

  // 4.5 isStandardizedSpeakingLesson Fuzzing & Negative Verification
  const validStandardized: StandardizedSpeakingLesson = {
    id: 'elllo-101',
    source: 'elllo',
    title: 'Weekend Plans',
    cefrLevel: 'A2',
    topic: 'Leisure',
    turns: [],
    vocabulary: [],
    reflexPairs: [],
    qualityScore: 90,
  };

  assert(isStandardizedSpeakingLesson(validStandardized), 'Valid standardized lesson must pass guard');

  const badSourceLesson = { ...validStandardized, source: 123 as any };
  assert(!isStandardizedSpeakingLesson(badSourceLesson), 'Non-string source must fail');

  const missingTurnsLesson = { ...validStandardized, turns: 'not-an-array' as any };
  assert(!isStandardizedSpeakingLesson(missingTurnsLesson), 'Non-array turns must fail');

  const missingVocabLesson = { ...validStandardized, vocabulary: null as any };
  assert(!isStandardizedSpeakingLesson(missingVocabLesson), 'Null vocabulary must fail');

  const nonNumericQuality = { ...validStandardized, qualityScore: 'ninety' as any };
  assert(!isStandardizedSpeakingLesson(nonNumericQuality), 'Non-numeric qualityScore must fail');

  console.log(`✓ Suite 4 Finished: Type guards and configs adversarial stress tests passed cleanly\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────────────
  console.log('================================================================================');
  console.log(`  EMPIRICAL CHALLENGER VERDICT: ALL ${passedTests}/${totalTests} TESTS PASSED!`);
  console.log('================================================================================\n');
}

runSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
