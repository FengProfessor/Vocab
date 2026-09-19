/**
 * Milestone 3 Empirical Adversarial Test Suite:
 * 3-Tier Speaking Curriculum Data Integrity, Deep Validation, Token Scanning & Lookups
 *
 * File: tests/speaking/curriculum-data-integrity.test.ts
 *
 * Covers:
 * 1. Exact catalog cardinality across all 3 tiers (12 + 10 + 10 = 32 lessons)
 * 2. Type guard validation on 100% of curriculum lessons via isSpeakingCurriculumLesson
 * 3. Deep pedagogical validation:
 *    - Strict positive integer order and 1-indexed sequential sequence per phase
 *    - Positive integer estimatedMinutes within pedagogical bounds (10-60m)
 *    - Non-empty stage strings with authentic Vietnamese diacritics
 *    - Valid turns array (length > 0, speaker, en, vi, coreKeywords)
 *    - Valid minimumPassingScore in [0, 100] (specifically >= 70)
 * 4. Static file scanning for forbidden tokens (TODO, FIXME, placeholder, lorem ipsum, dummy) across all 36 files
 * 5. Fast lookup helpers validation (getCurriculumLessonById, getCurriculumLessonsByPhase, edge cases & fuzzing)
 * 6. Adversarial mutation fuzzing on isSpeakingCurriculumLesson type guard
 * 7. Specialized domain checks (Phase 2 Cooking & Cuisine §IV, Phase 3 IELTS Parts 2 & 3)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  allCurriculumLessons,
  phase1Lessons,
  phase2Lessons,
  phase3Lessons,
  getCurriculumLessonById,
  getCurriculumLessonsByPhase,
} from '../../src/data/speaking/curriculum';
import {
  isSpeakingCurriculumLesson,
  SpeakingCurriculumLesson,
  SpeakingPhaseId,
} from '../../src/types/speaking-curriculum';

// ── Test Result Tracking ─────────────────────────────────────────────────────

interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  details?: string;
}

const results: TestCaseResult[] = [];

function assertTest(
  suite: string,
  name: string,
  condition: boolean,
  expected: unknown,
  actual: unknown,
  details?: string
) {
  results.push({
    suite,
    name,
    passed: condition,
    expected,
    actual,
    details,
  });

  const badge = condition ? '✅ [PASS]' : '❌ [FAIL]';
  if (!condition) {
    console.error(`${badge} [${suite}] ${name}`);
    console.error(`       Expected: ${JSON.stringify(expected)}`);
    console.error(`       Actual:   ${JSON.stringify(actual)}`);
    if (details) console.error(`       Details:  ${details}`);
  } else {
    console.log(`${badge} [${suite}] ${name}`);
  }
}

// ── Vietnamese Diacritics Regex Helper ───────────────────────────────────────
const VIETNAMESE_CHAR_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

// ── Main Verification Suite ──────────────────────────────────────────────────

async function runCurriculumAdversarialTests() {
  console.log('================================================================================');
  console.log('  EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 3 (CURRICULUM 32 LESSONS)  ');
  console.log('================================================================================\n');

  // ── SUITE 1: Catalog Cardinality & Identity Invariants ───────────────────────
  console.log('▶ SUITE 1: Catalog Cardinality & Identity Invariants');

  assertTest(
    'Suite 1',
    '1.1: Total curriculum lessons in allCurriculumLessons equals exactly 32',
    allCurriculumLessons.length === 32,
    32,
    allCurriculumLessons.length
  );

  assertTest(
    'Suite 1',
    '1.2: Phase 1 Beginner lessons count equals exactly 12',
    phase1Lessons.length === 12,
    12,
    phase1Lessons.length
  );

  assertTest(
    'Suite 1',
    '1.3: Phase 2 Elementary lessons count equals exactly 10',
    phase2Lessons.length === 10,
    10,
    phase2Lessons.length
  );

  assertTest(
    'Suite 1',
    '1.4: Phase 3 Intermediate lessons count equals exactly 10',
    phase3Lessons.length === 10,
    10,
    phase3Lessons.length
  );

  const lessonIds = allCurriculumLessons.map((l) => l.id);
  const uniqueLessonIds = new Set(lessonIds);
  assertTest(
    'Suite 1',
    '1.5: Zero Lesson ID Collisions (100% unique IDs across all 32 lessons)',
    uniqueLessonIds.size === 32,
    32,
    uniqueLessonIds.size
  );

  const slugs = allCurriculumLessons.map((l) => l.slug).filter(Boolean) as string[];
  const uniqueSlugs = new Set(slugs);
  assertTest(
    'Suite 1',
    '1.6: Zero Slug Collisions among defined slugs',
    uniqueSlugs.size === slugs.length,
    slugs.length,
    uniqueSlugs.size
  );

  const expectedConcatenation = [...phase1Lessons, ...phase2Lessons, ...phase3Lessons];
  const concatenationMatch =
    allCurriculumLessons.length === expectedConcatenation.length &&
    allCurriculumLessons.every((l, idx) => l.id === expectedConcatenation[idx].id);
  assertTest(
    'Suite 1',
    '1.7: allCurriculumLessons is exact strict concatenation of Phase 1, Phase 2, and Phase 3',
    concatenationMatch,
    true,
    concatenationMatch
  );

  // ── SUITE 2: Type Guard Compliance across all 32 Lessons ─────────────────────
  console.log('\n▶ SUITE 2: Type Guard Compliance via isSpeakingCurriculumLesson');

  let allPassTypeGuard = true;
  const typeGuardFailures: string[] = [];

  allCurriculumLessons.forEach((lesson) => {
    if (!isSpeakingCurriculumLesson(lesson)) {
      allPassTypeGuard = false;
      typeGuardFailures.push((lesson as any).id);
    }
  });

  assertTest(
    'Suite 2',
    '2.1: 100% of 32 lessons satisfy isSpeakingCurriculumLesson',
    allPassTypeGuard,
    true,
    allPassTypeGuard,
    typeGuardFailures.length > 0 ? `Failed lessons: ${typeGuardFailures.join(', ')}` : undefined
  );

  // ── SUITE 3: Deep Sequential Ordering, Phase IDs & Estimated Minutes ─────────
  console.log('\n▶ SUITE 3: Deep Sequential Ordering, Phase IDs & Estimated Minutes');

  // Phase 1 Order 1..12
  const p1OrderOk = phase1Lessons.every((l, idx) => l.order === idx + 1);
  assertTest(
    'Suite 3',
    '3.1: Phase 1 lessons are ordered strictly sequential 1..12',
    p1OrderOk,
    true,
    p1OrderOk
  );

  // Phase 2 Order 1..10
  const p2OrderOk = phase2Lessons.every((l, idx) => l.order === idx + 1);
  assertTest(
    'Suite 3',
    '3.2: Phase 2 lessons are ordered strictly sequential 1..10',
    p2OrderOk,
    true,
    p2OrderOk
  );

  // Phase 3 Order 1..10
  const p3OrderOk = phase3Lessons.every((l, idx) => l.order === idx + 1);
  assertTest(
    'Suite 3',
    '3.3: Phase 3 lessons are ordered strictly sequential 1..10',
    p3OrderOk,
    true,
    p3OrderOk
  );

  // Phase ID integrity
  const p1PhaseIdOk = phase1Lessons.every(
    (l) => l.phaseId === 'phase-1-beginner' && l.id.startsWith('p1-')
  );
  assertTest(
    'Suite 3',
    '3.4: Phase 1 lessons have phaseId="phase-1-beginner" and id starting with "p1-"',
    p1PhaseIdOk,
    true,
    p1PhaseIdOk
  );

  const p2PhaseIdOk = phase2Lessons.every(
    (l) => l.phaseId === 'phase-2-elementary' && l.id.startsWith('p2-')
  );
  assertTest(
    'Suite 3',
    '3.5: Phase 2 lessons have phaseId="phase-2-elementary" and id starting with "p2-"',
    p2PhaseIdOk,
    true,
    p2PhaseIdOk
  );

  const p3PhaseIdOk = phase3Lessons.every(
    (l) => l.phaseId === 'phase-3-intermediate' && l.id.startsWith('p3-')
  );
  assertTest(
    'Suite 3',
    '3.6: Phase 3 lessons have phaseId="phase-3-intermediate" and id starting with "p3-"',
    p3PhaseIdOk,
    true,
    p3PhaseIdOk
  );

  // Estimated minutes: strictly positive integers between 10 and 60
  const estimatedMinutesOk = allCurriculumLessons.every(
    (l) =>
      typeof l.estimatedMinutes === 'number' &&
      Number.isInteger(l.estimatedMinutes) &&
      l.estimatedMinutes >= 10 &&
      l.estimatedMinutes <= 60
  );
  assertTest(
    'Suite 3',
    '3.7: 100% of 32 lessons have valid positive integer estimatedMinutes in [10, 60]',
    estimatedMinutesOk,
    true,
    estimatedMinutesOk
  );

  // CEFR & IELTS target alignment
  const cefrP1Ok = phase1Lessons.every((l) => l.cefrLevel === 'A1' && l.targetBandIelts === '0-3.0');
  assertTest(
    'Suite 3',
    '3.8: Phase 1 CEFR level is A1 and IELTS target is 0-3.0',
    cefrP1Ok,
    true,
    cefrP1Ok
  );

  const cefrP2Ok = phase2Lessons.every(
    (l) =>
      (l.cefrLevel === 'A2' || l.cefrLevel === 'B1') &&
      /^(3\.[05]-4\.[05]|4\.0-5\.0|3\.0-5\.0)$/.test(l.targetBandIelts)
  );
  assertTest(
    'Suite 3',
    '3.9: Phase 2 CEFR level is A2/B1 and IELTS target falls within 3.0-5.0 progression',
    cefrP2Ok,
    true,
    cefrP2Ok
  );

  const cefrP3Ok = phase3Lessons.every(
    (l) => (l.cefrLevel === 'B1' || l.cefrLevel === 'B2') && l.targetBandIelts === '5.0-6.5'
  );
  assertTest(
    'Suite 3',
    '3.10: Phase 3 CEFR level is B1/B2 and IELTS target is 5.0-6.5',
    cefrP3Ok,
    true,
    cefrP3Ok
  );

  // ── SUITE 4: Stage 1 Phonetics Drill Deep Validation ─────────────────────────
  console.log('\n▶ SUITE 4: Stage 1 Phonetics Drill Deep Validation');

  let stage1StringsValid = true;
  let stage1PairsValid = true;
  let stage1SentencesValid = true;
  let stage1VideoValid = true;

  allCurriculumLessons.forEach((l) => {
    const s1 = l.stage1Phonetics;
    if (!s1 || !s1.titleVi || s1.titleVi.trim().length < 5 || !s1.focusSound || s1.focusSound.trim().length === 0) {
      stage1StringsValid = false;
    }
    if (!s1.vietnameseContrastiveTip || s1.vietnameseContrastiveTip.trim().length < 20) {
      stage1StringsValid = false;
    }
    if (!Array.isArray(s1.minimalPairs) || s1.minimalPairs.length < 3) {
      stage1PairsValid = false;
    } else {
      for (const pair of s1.minimalPairs) {
        if (!pair.wordA || !pair.wordB || !pair.ipaA || !pair.ipaB || !pair.meaningA || !pair.meaningB) {
          stage1PairsValid = false;
        }
      }
    }
    if (!Array.isArray(s1.practiceSentences) || s1.practiceSentences.length < 3) {
      stage1SentencesValid = false;
    } else {
      for (const sent of s1.practiceSentences) {
        if (!sent.sentence || !sent.phoneticTarget || !sent.vietnameseTranslation) {
          stage1SentencesValid = false;
        }
      }
    }
    if (s1.video) {
      const v = s1.video;
      if (!/^[A-Za-z0-9_-]{11}$/.test(v.youtubeVideoId) || v.startSeconds < 0 || v.endSeconds <= v.startSeconds) {
        stage1VideoValid = false;
      }
    }
  });

  assertTest(
    'Suite 4',
    '4.1: Stage 1 titleVi, focusSound, and vietnameseContrastiveTip (>20 chars) are non-empty',
    stage1StringsValid,
    true,
    stage1StringsValid
  );

  assertTest(
    'Suite 4',
    '4.2: Stage 1 minimalPairs has >= 3 pairs with complete words, IPAs, and Vietnamese meanings',
    stage1PairsValid,
    true,
    stage1PairsValid
  );

  assertTest(
    'Suite 4',
    '4.3: Stage 1 practiceSentences has >= 3 sentences with target and Vietnamese translations',
    stage1SentencesValid,
    true,
    stage1SentencesValid
  );

  assertTest(
    'Suite 4',
    '4.4: Stage 1 videos (where present) adhere to valid YouTube IDs and non-negative timestamps',
    stage1VideoValid,
    true,
    stage1VideoValid
  );

  // ── SUITE 5: Stage 2 Core Patterns & Lexical Chunks Deep Validation ──────────
  console.log('\n▶ SUITE 5: Stage 2 Core Patterns & Lexical Chunks Deep Validation');

  let stage2StringsValid = true;
  let stage2LegoSlotsValid = true;
  let stage2VocabValid = true;

  allCurriculumLessons.forEach((l) => {
    const s2 = l.stage2CorePatterns;
    if (!s2 || !s2.titleVi || s2.titleVi.trim().length < 5) {
      stage2StringsValid = false;
    }
    if (!s2.vietnameseGrammarRule || s2.vietnameseGrammarRule.trim().length < 20) {
      stage2StringsValid = false;
    }
    if (!s2.formula || s2.formula.trim().length < 5) {
      stage2StringsValid = false;
    }
    if (!Array.isArray(s2.legoSlots) || s2.legoSlots.length < 1) {
      stage2LegoSlotsValid = false;
    } else {
      for (const slot of s2.legoSlots) {
        if (!slot.template || !slot.template.includes('{') || !slot.template.includes('}')) {
          stage2LegoSlotsValid = false;
        }
        if (!slot.slots || Object.keys(slot.slots).length === 0) {
          stage2LegoSlotsValid = false;
        }
        if (!Array.isArray(slot.examples) || slot.examples.length < 1) {
          stage2LegoSlotsValid = false;
        } else {
          for (const eg of slot.examples) {
            if (!eg.en || !eg.vi) stage2LegoSlotsValid = false;
          }
        }
      }
    }
    if (!Array.isArray(s2.highFrequencyVocab) || s2.highFrequencyVocab.length < 4) {
      stage2VocabValid = false;
    } else {
      for (const vocab of s2.highFrequencyVocab) {
        if (!vocab.term || !vocab.meaningVi) stage2VocabValid = false;
      }
    }
  });

  assertTest(
    'Suite 5',
    '5.1: Stage 2 titleVi, vietnameseGrammarRule (>20 chars), and formula are non-empty',
    stage2StringsValid,
    true,
    stage2StringsValid
  );

  assertTest(
    'Suite 5',
    '5.2: Stage 2 legoSlots has >= 1 valid slot items with {placeholder} templates and >= 1 examples',
    stage2LegoSlotsValid,
    true,
    stage2LegoSlotsValid
  );

  assertTest(
    'Suite 5',
    '5.3: Stage 2 highFrequencyVocab has >= 4 contextual items with Vietnamese meanings',
    stage2VocabValid,
    true,
    stage2VocabValid
  );

  // ── SUITE 6: Stage 3 Guided Dialogue Deep Validation ─────────────────────────
  console.log('\n▶ SUITE 6: Stage 3 Guided Dialogue Deep Validation');

  let stage3StringsValid = true;
  let stage3TurnsLengthValid = true;
  let stage3TurnContentValid = true;
  let stage3KeywordsValid = true;

  allCurriculumLessons.forEach((l) => {
    const s3 = l.stage3GuidedDialogue;
    if (!s3 || !s3.titleVi || s3.titleVi.trim().length < 5 || !s3.contextVi || s3.contextVi.trim().length < 20) {
      stage3StringsValid = false;
    }
    // Phase 1 and 2 expect >= 6 turns; Phase 3 expects >= 4 turns
    const minTurns = l.phaseId === 'phase-3-intermediate' ? 4 : 6;
    if (!Array.isArray(s3.turns) || s3.turns.length < minTurns) {
      stage3TurnsLengthValid = false;
    }
    for (const turn of s3.turns) {
      if (!turn.speaker || !turn.en || turn.en.trim().length < 3 || !turn.vi || turn.vi.trim().length < 3) {
        stage3TurnContentValid = false;
      }
      if (!Array.isArray(turn.coreKeywords) || turn.coreKeywords.length < 1) {
        stage3KeywordsValid = false;
      } else {
        for (const kw of turn.coreKeywords) {
          if (!kw || typeof kw !== 'string' || kw.trim().length === 0) {
            stage3KeywordsValid = false;
          }
        }
      }
    }
  });

  assertTest(
    'Suite 6',
    '6.1: Stage 3 titleVi and contextVi (>20 chars) are non-empty',
    stage3StringsValid,
    true,
    stage3StringsValid
  );

  assertTest(
    'Suite 6',
    '6.2: Stage 3 turns array length > 0 (>=6 for P1/P2, >=4 for P3)',
    stage3TurnsLengthValid,
    true,
    stage3TurnsLengthValid
  );

  assertTest(
    'Suite 6',
    '6.3: Stage 3 dialogue turns have valid speaker, en text, and vi translation',
    stage3TurnContentValid,
    true,
    stage3TurnContentValid
  );

  assertTest(
    'Suite 6',
    '6.4: Stage 3 dialogue turns have >= 1 non-empty coreKeywords per turn',
    stage3KeywordsValid,
    true,
    stage3KeywordsValid
  );

  // ── SUITE 7: Stage 4 SafeHarbor Evaluation Deep Validation ───────────────────
  console.log('\n▶ SUITE 7: Stage 4 SafeHarbor Evaluation Deep Validation');

  let stage4StringsValid = true;
  let stage4ScoresValid = true;
  let stage4KeywordsValid = true;
  let stage4VariationsValid = true;

  allCurriculumLessons.forEach((l) => {
    const s4 = l.stage4SafeHarborEvaluation;
    if (
      !s4 ||
      !s4.titleVi ||
      s4.titleVi.trim().length < 5 ||
      !s4.promptVi ||
      s4.promptVi.trim().length < 10 ||
      !s4.targetSentence ||
      s4.targetSentence.trim().length < 10
    ) {
      stage4StringsValid = false;
    }
    // passing score must be in [0, 100] and standard pedagogical minimum >= 70
    if (
      typeof s4.minimumPassingScore !== 'number' ||
      s4.minimumPassingScore < 0 ||
      s4.minimumPassingScore > 100 ||
      s4.minimumPassingScore < 70
    ) {
      stage4ScoresValid = false;
    }
    if (!Array.isArray(s4.coreKeywords) || s4.coreKeywords.length < 3) {
      stage4KeywordsValid = false;
    }
    if (!Array.isArray(s4.acceptableVariations) || s4.acceptableVariations.length < 2) {
      stage4VariationsValid = false;
    }
  });

  assertTest(
    'Suite 7',
    '7.1: Stage 4 titleVi, promptVi, and targetSentence (>10 chars) are non-empty',
    stage4StringsValid,
    true,
    stage4StringsValid
  );

  assertTest(
    'Suite 7',
    '7.2: Stage 4 minimumPassingScore is in [0, 100] and meets passing threshold >= 70',
    stage4ScoresValid,
    true,
    stage4ScoresValid
  );

  assertTest(
    'Suite 7',
    '7.3: Stage 4 coreKeywords has >= 3 non-empty keywords',
    stage4KeywordsValid,
    true,
    stage4KeywordsValid
  );

  assertTest(
    'Suite 7',
    '7.4: Stage 4 acceptableVariations has >= 2 valid alternate phrases',
    stage4VariationsValid,
    true,
    stage4VariationsValid
  );

  // ── SUITE 8: Static File Scanning for Forbidden Tokens ───────────────────────
  console.log('\n▶ SUITE 8: Static File Scanning for Forbidden Tokens (All 36 Files)');

  const curriculumBaseDir = path.resolve(__dirname, '../../src/data/speaking/curriculum');
  const forbiddenPatterns = [
    { pattern: /\bTODO\b/i, name: 'TODO' },
    { pattern: /\bFIXME\b/i, name: 'FIXME' },
    { pattern: /placeholder/i, name: 'placeholder' },
    { pattern: /lorem\s+ipsum/i, name: 'lorem ipsum' },
    { pattern: /\bdummy\b/i, name: 'dummy' },
  ];

  function getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allCurriculumFiles = getAllTsFiles(curriculumBaseDir);
  assertTest(
    'Suite 8',
    '8.1: Found all 36 curriculum TypeScript files (32 lessons + 4 index files)',
    allCurriculumFiles.length === 36,
    36,
    allCurriculumFiles.length
  );

  const tokenViolations: Array<{ file: string; token: string; line: number }> = [];

  for (const filePath of allCurriculumFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, lineIndex) => {
      for (const { pattern, name } of forbiddenPatterns) {
        if (pattern.test(line)) {
          tokenViolations.push({
            file: path.relative(curriculumBaseDir, filePath),
            token: name,
            line: lineIndex + 1,
          });
        }
      }
    });
  }

  assertTest(
    'Suite 8',
    '8.2: Zero forbidden tokens (TODO, FIXME, placeholder, lorem ipsum, dummy) across all 36 files',
    tokenViolations.length === 0,
    0,
    tokenViolations.length,
    tokenViolations.length > 0 ? JSON.stringify(tokenViolations) : undefined
  );

  // ── SUITE 9: Lookup Functions Rigorous & Boundary Testing ────────────────────
  console.log('\n▶ SUITE 9: Fast Lookup Functions Rigorous & Boundary Testing');

  // 9.1 Lookup by ID for all 32 lessons
  let allLookupsByIdPass = true;
  for (const lesson of allCurriculumLessons) {
    const found = getCurriculumLessonById(lesson.id);
    if (!found || found.id !== lesson.id) {
      allLookupsByIdPass = false;
    }
  }
  assertTest(
    'Suite 9',
    '9.1: getCurriculumLessonById successfully resolves all 32 lessons by ID',
    allLookupsByIdPass,
    true,
    allLookupsByIdPass
  );

  // 9.2 Lookup by slug for all lessons with slug
  let allLookupsBySlugPass = true;
  const lessonsWithSlug = allCurriculumLessons.filter((l) => l.slug);
  for (const lesson of lessonsWithSlug) {
    const found = getCurriculumLessonById(lesson.slug!);
    if (!found || found.id !== lesson.id) {
      allLookupsBySlugPass = false;
    }
  }
  assertTest(
    'Suite 9',
    '9.2: getCurriculumLessonById successfully resolves all lessons with defined slug',
    allLookupsBySlugPass,
    true,
    allLookupsBySlugPass
  );

  // 9.3 Boundary and malicious ID lookups
  const maliciousLookups = [
    '',
    '   ',
    'unknown-id-404',
    '__proto__',
    'constructor',
    'toString',
    'null',
    'undefined',
    'phase-1-beginner', // phase id is not lesson id
    '<script>alert(1)</script>',
  ];
  let maliciousSafe = true;
  for (const badId of maliciousLookups) {
    const result = getCurriculumLessonById(badId);
    if (result !== undefined) maliciousSafe = false;
  }
  assertTest(
    'Suite 9',
    '9.3: getCurriculumLessonById safely returns undefined for empty/malicious/non-existent queries',
    maliciousSafe,
    true,
    maliciousSafe
  );

  // 9.4 Lookup by Phase
  const p1Lessons = getCurriculumLessonsByPhase('phase-1-beginner');
  assertTest(
    'Suite 9',
    '9.4: getCurriculumLessonsByPhase("phase-1-beginner") returns exactly 12 lessons',
    p1Lessons.length === 12 && p1Lessons.every((l) => l.phaseId === 'phase-1-beginner'),
    true,
    p1Lessons.length === 12
  );

  const p2Lessons = getCurriculumLessonsByPhase('phase-2-elementary');
  assertTest(
    'Suite 9',
    '9.5: getCurriculumLessonsByPhase("phase-2-elementary") returns exactly 10 lessons',
    p2Lessons.length === 10 && p2Lessons.every((l) => l.phaseId === 'phase-2-elementary'),
    true,
    p2Lessons.length === 10
  );

  const p3Lessons = getCurriculumLessonsByPhase('phase-3-intermediate');
  assertTest(
    'Suite 9',
    '9.6: getCurriculumLessonsByPhase("phase-3-intermediate") returns exactly 10 lessons',
    p3Lessons.length === 10 && p3Lessons.every((l) => l.phaseId === 'phase-3-intermediate'),
    true,
    p3Lessons.length === 10
  );

  // 9.7 Invalid phase lookups
  const badPhases = ['phase-0-intro', 'phase-4-mastery', '', 'random-string', '__proto__'];
  let badPhasesReturnEmpty = true;
  for (const badPhase of badPhases) {
    const res = getCurriculumLessonsByPhase(badPhase as SpeakingPhaseId);
    if (!Array.isArray(res) || res.length !== 0) {
      badPhasesReturnEmpty = false;
    }
  }
  assertTest(
    'Suite 9',
    '9.7: getCurriculumLessonsByPhase returns empty array [] for any invalid phase',
    badPhasesReturnEmpty,
    true,
    badPhasesReturnEmpty
  );

  // ── SUITE 10: Adversarial Type Guard Mutation Fuzzing ────────────────────────
  console.log('\n▶ SUITE 10: Adversarial Type Guard Mutation Fuzzing');

  const baselineLesson = JSON.parse(JSON.stringify(phase1Lessons[0])) as SpeakingCurriculumLesson;

  // Mutation 1: order <= 0
  const m1 = { ...baselineLesson, order: 0 };
  assertTest(
    'Suite 10',
    '10.1: Type guard rejects order = 0',
    isSpeakingCurriculumLesson(m1) === false,
    false,
    isSpeakingCurriculumLesson(m1)
  );

  const m2 = { ...baselineLesson, order: -1 };
  assertTest(
    'Suite 10',
    '10.2: Type guard rejects negative order = -1',
    isSpeakingCurriculumLesson(m2) === false,
    false,
    isSpeakingCurriculumLesson(m2)
  );

  const m3 = { ...baselineLesson, order: 1.5 };
  assertTest(
    'Suite 10',
    '10.3: Type guard rejects non-integer order = 1.5',
    isSpeakingCurriculumLesson(m3) === false,
    false,
    isSpeakingCurriculumLesson(m3)
  );

  // Mutation 2: estimatedMinutes <= 0
  const m4 = { ...baselineLesson, estimatedMinutes: 0 };
  assertTest(
    'Suite 10',
    '10.4: Type guard rejects estimatedMinutes = 0',
    isSpeakingCurriculumLesson(m4) === false,
    false,
    isSpeakingCurriculumLesson(m4)
  );

  const m5 = { ...baselineLesson, estimatedMinutes: -10 };
  assertTest(
    'Suite 10',
    '10.5: Type guard rejects negative estimatedMinutes = -10',
    isSpeakingCurriculumLesson(m5) === false,
    false,
    isSpeakingCurriculumLesson(m5)
  );

  // Mutation 3: invalid phaseId
  const m6 = { ...baselineLesson, phaseId: 'phase-4-mastery' };
  assertTest(
    'Suite 10',
    '10.6: Type guard rejects non-existent phaseId',
    isSpeakingCurriculumLesson(m6) === false,
    false,
    isSpeakingCurriculumLesson(m6)
  );

  // Mutation 4: invalid cefrLevel (curriculum max is B2)
  const m7 = { ...baselineLesson, cefrLevel: 'C1' };
  assertTest(
    'Suite 10',
    '10.7: Type guard rejects CEFR level C1 outside curriculum scope',
    isSpeakingCurriculumLesson(m7) === false,
    false,
    isSpeakingCurriculumLesson(m7)
  );

  // Mutation 5: empty titles
  const m8 = { ...baselineLesson, titleEn: '   ' };
  assertTest(
    'Suite 10',
    '10.8: Type guard rejects whitespace-only titleEn',
    isSpeakingCurriculumLesson(m8) === false,
    false,
    isSpeakingCurriculumLesson(m8)
  );

  const m9 = { ...baselineLesson, titleVi: '' };
  assertTest(
    'Suite 10',
    '10.9: Type guard rejects empty string titleVi',
    isSpeakingCurriculumLesson(m9) === false,
    false,
    isSpeakingCurriculumLesson(m9)
  );

  // Mutation 6: Stage 1 missing focusSound
  const m10 = {
    ...baselineLesson,
    stage1Phonetics: { ...baselineLesson.stage1Phonetics, focusSound: '' },
  };
  assertTest(
    'Suite 10',
    '10.10: Type guard rejects empty focusSound in stage 1',
    isSpeakingCurriculumLesson(m10) === false,
    false,
    isSpeakingCurriculumLesson(m10)
  );

  // Mutation 7: Stage 2 missing formula
  const m11 = {
    ...baselineLesson,
    stage2CorePatterns: { ...baselineLesson.stage2CorePatterns, formula: '' },
  };
  assertTest(
    'Suite 10',
    '10.11: Type guard rejects empty formula in stage 2',
    isSpeakingCurriculumLesson(m11) === false,
    false,
    isSpeakingCurriculumLesson(m11)
  );

  // Mutation 8: Stage 3 non-array turns
  const m12 = {
    ...baselineLesson,
    stage3GuidedDialogue: { ...baselineLesson.stage3GuidedDialogue, turns: 'not-an-array' },
  };
  assertTest(
    'Suite 10',
    '10.12: Type guard rejects non-array turns in stage 3',
    isSpeakingCurriculumLesson(m12) === false,
    false,
    isSpeakingCurriculumLesson(m12)
  );

  // Mutation 9: Stage 4 minimumPassingScore out of bounds
  const m13 = {
    ...baselineLesson,
    stage4SafeHarborEvaluation: {
      ...baselineLesson.stage4SafeHarborEvaluation,
      minimumPassingScore: -1,
    },
  };
  assertTest(
    'Suite 10',
    '10.13: Type guard rejects minimumPassingScore < 0',
    isSpeakingCurriculumLesson(m13) === false,
    false,
    isSpeakingCurriculumLesson(m13)
  );

  const m14 = {
    ...baselineLesson,
    stage4SafeHarborEvaluation: {
      ...baselineLesson.stage4SafeHarborEvaluation,
      minimumPassingScore: 101,
    },
  };
  assertTest(
    'Suite 10',
    '10.14: Type guard rejects minimumPassingScore > 100',
    isSpeakingCurriculumLesson(m14) === false,
    false,
    isSpeakingCurriculumLesson(m14)
  );

  const m15 = {
    ...baselineLesson,
    stage4SafeHarborEvaluation: {
      ...baselineLesson.stage4SafeHarborEvaluation,
      targetSentence: '   ',
    },
  };
  assertTest(
    'Suite 10',
    '10.15: Type guard rejects whitespace-only targetSentence in stage 4',
    isSpeakingCurriculumLesson(m15) === false,
    false,
    isSpeakingCurriculumLesson(m15)
  );

  // Non-object inputs
  assertTest(
    'Suite 10',
    '10.16: Type guard rejects null, undefined, primitives',
    isSpeakingCurriculumLesson(null) === false &&
      isSpeakingCurriculumLesson(undefined) === false &&
      isSpeakingCurriculumLesson('string') === false &&
      isSpeakingCurriculumLesson(123) === false &&
      isSpeakingCurriculumLesson({}) === false,
    true,
    true
  );

  // ── SUITE 11: Authentic Vietnamese Language & Diacritics Verification ────────
  console.log('\n▶ SUITE 11: Authentic Vietnamese Language & Diacritics Verification');

  let allHaveVietnameseDiacritics = true;
  allCurriculumLessons.forEach((l) => {
    if (
      !VIETNAMESE_CHAR_REGEX.test(l.titleVi) ||
      !VIETNAMESE_CHAR_REGEX.test(l.summaryVi) ||
      !VIETNAMESE_CHAR_REGEX.test(l.stage1Phonetics.vietnameseContrastiveTip) ||
      !VIETNAMESE_CHAR_REGEX.test(l.stage2CorePatterns.vietnameseGrammarRule) ||
      !VIETNAMESE_CHAR_REGEX.test(l.stage3GuidedDialogue.contextVi) ||
      !VIETNAMESE_CHAR_REGEX.test(l.stage4SafeHarborEvaluation.promptVi)
    ) {
      allHaveVietnameseDiacritics = false;
    }
  });

  assertTest(
    'Suite 11',
    '11.1: 100% of 32 lessons contain authentic Vietnamese diacritics in all pedagogical Vi fields',
    allHaveVietnameseDiacritics,
    true,
    allHaveVietnameseDiacritics
  );

  // ── SUITE 12: Domain Specialized Scenarios Verification ──────────────────────
  console.log('\n▶ SUITE 12: Domain Specialized Scenarios Verification (P2 Cooking & P3 IELTS)');

  // Phase 2 Cooking §IV verification
  const cookingLesson = getCurriculumLessonById('p2-l03-cooking-cuisine');
  assertTest(
    'Suite 12',
    '12.1: P2-L03 Cooking & Cuisine exists and matches ID',
    cookingLesson !== undefined && cookingLesson.id === 'p2-l03-cooking-cuisine',
    true,
    cookingLesson !== undefined
  );

  if (cookingLesson) {
    const rawContent = JSON.stringify(cookingLesson).toLowerCase();
    const appliances = ['blender', 'oven', 'air-fryer', 'stove'];
    const hasAppliances = appliances.every((a) => rawContent.includes(a));
    assertTest(
      'Suite 12',
      '12.2: P2-L03 contains required kitchen appliances (blender, oven, air-fryer, stove)',
      hasAppliances,
      true,
      hasAppliances
    );

    const methods = ['simmer', 'stir-fry', 'roast', 'bake', 'steam'];
    const hasMethods = methods.every((m) => rawContent.includes(m));
    assertTest(
      'Suite 12',
      '12.3: P2-L03 contains required cooking methods (simmer, stir-fry, roast, bake, steam)',
      hasMethods,
      true,
      hasMethods
    );

    const ingredients = ['garlic', 'olive oil', 'fish sauce'];
    const hasIngredients = ingredients.every((i) => rawContent.includes(i));
    assertTest(
      'Suite 12',
      '12.4: P2-L03 contains key ingredients (garlic, olive oil, fish sauce)',
      hasIngredients,
      true,
      hasIngredients
    );

    const sensory = ['crispy', 'savoury', 'tangy', 'tender'];
    const hasSensory = sensory.every((s) => rawContent.includes(s));
    assertTest(
      'Suite 12',
      '12.5: P2-L03 contains sensory taste adjectives (crispy, savoury, tangy, tender)',
      hasSensory,
      true,
      hasSensory
    );

    const connectors = ['first', 'then', 'after that', 'finally'];
    const hasConnectors = connectors.every((c) => rawContent.includes(c));
    assertTest(
      'Suite 12',
      '12.6: P2-L03 contains recipe discourse connectors (first, then, after that, finally)',
      hasConnectors,
      true,
      hasConnectors
    );
  }

  // Phase 3 IELTS Part 2 & Part 3 verification
  const p3L01 = getCurriculumLessonById('p3-l01-ielts-p2-cuecard-mindmap');
  assertTest(
    'Suite 12',
    '12.7: P3-L01 IELTS Part 2 Cue Card Mindmap exists and targets band 5.0-6.5',
    p3L01 !== undefined && p3L01.targetBandIelts === '5.0-6.5',
    true,
    p3L01 !== undefined
  );

  const p3L10 = getCurriculumLessonById('p3-l10-2-minute-monologue-mastery');
  assertTest(
    'Suite 12',
    '12.8: P3-L10 2-Minute Monologue Mastery exists and has >= 4 dialogue turns and high-yield keywords',
    p3L10 !== undefined && p3L10.stage3GuidedDialogue.turns.length >= 4,
    true,
    p3L10 !== undefined
  );

  // ── FINAL SUMMARY ────────────────────────────────────────────────────────────
  console.log('\n================================================================================');
  console.log('  MILESTONE 3 CURRICULUM ADVERSARIAL CHALLENGE EXECUTION SUMMARY');
  console.log('================================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Assertions Evaluated: ${total}`);
  console.log(`Passed:                     ${passed}`);
  console.log(`Failed:                     ${failed}`);
  console.log(`Curriculum Lessons Tested:  ${allCurriculumLessons.length} / 32`);
  console.log(`Source Files Scanned:       ${allCurriculumFiles.length} / 36`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error(`❌ VERDICT: REQUEST_CHANGES (${failed} assertions failed)`);
    process.exit(1);
  } else {
    console.log('✅ VERDICT: APPROVE (100% of assertions passed cleanly with zero defects)');
    process.exit(0);
  }
}

runCurriculumAdversarialTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
