/**
 * Milestone 1 Architecture & Types Verification Test
 * File: tests/speaking/curriculum-types-m1.test.ts
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

import {
  DualSpeedAudioButton,
  SafeHarborRecorder,
  StageProgressNav,
  FOUNDATION_STAGES,
} from '../../src/components/speaking';

import { DualSpeedAudioButton as DualSpeedDirect } from '../../src/components/speaking/dual-speed-audio-button';
import { SafeHarborRecorder as SafeHarborDirect } from '../../src/components/speaking/safe-harbor-recorder';
import { StageProgressNav as StageNavDirect } from '../../src/components/speaking/stage-progress-nav';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Testing Milestone 1 Types & Barrel Exports ---');

// 1. Phase ID Validation
assert(isSpeakingPhaseId('phase-1-beginner'), 'phase-1-beginner should be valid');
assert(isSpeakingPhaseId('phase-2-elementary'), 'phase-2-elementary should be valid');
assert(isSpeakingPhaseId('phase-3-intermediate'), 'phase-3-intermediate should be valid');
assert(!isSpeakingPhaseId('phase-4-advanced'), 'phase-4-advanced should be invalid');
assert(!isSpeakingPhaseId(null), 'null should not be valid phase ID');
console.log('✓ Phase ID type guard verified');

// 2. CEFR Level Validation
assert(isCefrLevel('A1'), 'A1 should be valid');
assert(isCefrLevel('A2'), 'A2 should be valid');
assert(isCefrLevel('B1'), 'B1 should be valid');
assert(isCefrLevel('B2'), 'B2 should be valid');
assert(!isCefrLevel('C1'), 'C1 should be invalid');
assert(!isCefrLevel(''), 'empty string should be invalid');
console.log('✓ CEFR level type guard verified');

// 3. SpeakingCurriculumLesson structural verification
const sampleCurriculumLesson: SpeakingCurriculumLesson = {
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
        examples: [
          { en: 'My name is Nam.', vi: 'Tên tôi là Nam.' },
        ],
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

assert(isSpeakingCurriculumLesson(sampleCurriculumLesson), 'Sample lesson should pass type guard');
assert(!isSpeakingCurriculumLesson({ id: 'bad' }), 'Malformed object should fail type guard');
console.log('✓ SpeakingCurriculumLesson schema verified');

// 4. StandardizedSpeakingLesson structural verification
const sampleStandardizedLesson: StandardizedSpeakingLesson = {
  id: 'elllo-1420-hometown',
  source: 'elllo',
  title: 'Talking about your hometown',
  cefrLevel: 'A2',
  topic: 'Hometown & Living',
  audioUrl: 'https://example.com/audio/1420.mp3',
  slowAudioUrl: 'https://example.com/audio/1420-slow.mp3',
  turns: [
    {
      speaker: 'Host',
      textEn: 'Where are you from originally?',
      textVi: 'Bạn gốc ở đâu?',
      coreKeywords: ['where', 'from', 'originally'],
    },
    {
      speaker: 'Guest',
      textEn: 'I was born and raised in a coastal city.',
      textVi: 'Tôi sinh ra và lớn lên ở một thành phố ven biển.',
      coreKeywords: ['born', 'raised', 'coastal', 'city'],
    },
  ],
  vocabulary: [
    {
      term: 'coastal',
      ipa: '/ˈkəʊstəl/',
      meaningVi: 'thuộc vùng ven biển',
      exampleEn: 'Da Nang is a beautiful coastal city.',
    },
  ],
  reflexPairs: [
    {
      promptEn: 'Where is your hometown?',
      promptVi: 'Quê bạn ở đâu?',
      responseEn: 'My hometown is in the countryside.',
      responseVi: 'Quê tôi ở vùng nông thôn.',
      coreKeywords: ['hometown', 'countryside'],
    },
  ],
  qualityScore: 95,
};

assert(isStandardizedSpeakingLesson(sampleStandardizedLesson), 'Standardized lesson should pass type guard');
console.log('✓ StandardizedSpeakingLesson schema verified');

// 5. Phase Catalog Verification
assert(SPEAKING_PHASE_CONFIGS['phase-1-beginner'].totalLessons === 12, 'Phase 1 should have 12 lessons');
assert(SPEAKING_PHASE_CONFIGS['phase-2-elementary'].totalLessons === 10, 'Phase 2 should have 10 lessons');
assert(SPEAKING_PHASE_CONFIGS['phase-3-intermediate'].totalLessons === 10, 'Phase 3 should have 10 lessons');
console.log('✓ Phase Catalog verified (12 + 10 + 10 = 32 lessons total)');

// 6. Barrel Exports Verification
assert(typeof DualSpeedAudioButton === 'function', 'DualSpeedAudioButton should be exported from index');
assert(typeof SafeHarborRecorder === 'function', 'SafeHarborRecorder should be exported from index');
assert(typeof StageProgressNav === 'function', 'StageProgressNav should be exported from index');
assert(Array.isArray(FOUNDATION_STAGES), 'FOUNDATION_STAGES should be exported from index');

assert(typeof DualSpeedDirect === 'function', 'DualSpeedAudioButton direct modular export should work');
assert(typeof SafeHarborDirect === 'function', 'SafeHarborRecorder direct modular export should work');
assert(typeof StageNavDirect === 'function', 'StageProgressNav direct modular export should work');
console.log('✓ Component barrel & modular exports verified');

console.log('\n🎉 ALL MILESTONE 1 CHECKS PASSED CLEANLY!\n');
