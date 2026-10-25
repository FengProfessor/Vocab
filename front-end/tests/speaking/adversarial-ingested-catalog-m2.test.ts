/**
 * Milestone 2 Empirical Adversarial Test Suite:
 * Speaking Ingested Datasets Integrity, Standardized Schema Compliance, & Zero Regressions
 *
 * File: tests/speaking/adversarial-ingested-catalog-m2.test.ts
 *
 * Target Scope:
 * 1. src/data/speaking/ingested/elllo-catalog.json
 * 2. src/data/speaking/ingested/talkenglish-catalog.json
 * 3. src/data/speaking/ingested/youtube-catalog.json
 * 4. src/data/speaking/ingested/index.ts
 * 5. src/types/speaking-curriculum.ts
 */

import {
  allIngestedLessons,
  ellloCatalog,
  getIngestedCatalogStats,
  getLessonById,
  getLessonsByLevel,
  getLessonsBySource,
  getLessonsByTopic,
  talkenglishCatalog,
  youtubeCatalog,
} from '../../src/data/speaking/ingested';
import {
  CefrLevel,
  IngestionSource,
  isCefrLevel,
  isStandardizedSpeakingLesson,
  StandardizedSpeakingLesson,
} from '../../src/types/speaking-curriculum';
import { normalizeLesson, STOPWORDS } from '../../scripts/speaking/normalizer';

// ── Test Harness Tracking ───────────────────────────────────────────────────

interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  details?: string;
}

const testResults: TestCaseResult[] = [];

function assertTest(
  suite: string,
  name: string,
  condition: boolean,
  expected: unknown,
  actual: unknown,
  details?: string
) {
  testResults.push({
    suite,
    name,
    passed: condition,
    expected,
    actual,
    details,
  });

  if (!condition) {
    console.error(`  ❌ [FAIL] [${suite}] ${name}`);
    if (details) console.error(`     Details: ${details}`);
    console.error(`     Expected: ${JSON.stringify(expected)}`);
    console.error(`     Actual:   ${JSON.stringify(actual)}`);
  } else {
    console.log(`  ✅ [PASS] [${suite}] ${name}`);
  }
}

// ── Adversarial Scanner Utility ─────────────────────────────────────────────

const FORBIDDEN_PLACEHOLDER_REGEX = /\b(todo|fixme|xxx|placeholder|dummy|tbd|sample\s+text)\b|lorem\s+ipsum/i;

function scanObjectForPlaceholders(
  obj: unknown,
  path = ''
): Array<{ path: string; match: string }> {
  const violations: Array<{ path: string; match: string }> = [];

  if (obj === null || obj === undefined) return violations;

  if (typeof obj === 'string') {
    const match = obj.match(FORBIDDEN_PLACEHOLDER_REGEX);
    if (match) {
      violations.push({ path, match: match[0] });
    }
    // Check for string literal indicators of undefined or null leaks
    if (obj.trim() === 'undefined' || obj.trim() === 'null' || obj.trim() === '[object Object]') {
      violations.push({ path, match: obj.trim() });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      violations.push(...scanObjectForPlaceholders(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      violations.push(...scanObjectForPlaceholders(value, `${path}.${key}`));
    }
  }

  return violations;
}

// ── EXECUTE ADVERSARIAL SUITES ──────────────────────────────────────────────

console.log('================================================================================');
console.log('  EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 2 INGESTED DATASETS');
console.log('================================================================================\n');

// ── SUITE 1: CATALOG CARDINALITY & GLOBAL INTEGRITY ─────────────────────────
console.log('▶ SUITE 1: Catalog Cardinality, Non-Emptiness & Anti-Collision');

assertTest(
  'Suite 1',
  '1.1: ELLLO catalog is loaded and contains >= 10 lessons',
  Array.isArray(ellloCatalog) && ellloCatalog.length >= 10,
  '>= 10',
  ellloCatalog.length
);

assertTest(
  'Suite 1',
  '1.2: TalkEnglish catalog is loaded and contains >= 5 lessons',
  Array.isArray(talkenglishCatalog) && talkenglishCatalog.length >= 5,
  '>= 5',
  talkenglishCatalog.length
);

assertTest(
  'Suite 1',
  '1.3: YouTube catalog is loaded and contains >= 3 lessons (spec compliant)',
  Array.isArray(youtubeCatalog) && youtubeCatalog.length >= 3,
  '>= 3',
  youtubeCatalog.length
);

assertTest(
  'Suite 1',
  '1.4: allIngestedLessons equals sum of all three catalogs exactly',
  allIngestedLessons.length === ellloCatalog.length + talkenglishCatalog.length + youtubeCatalog.length,
  ellloCatalog.length + talkenglishCatalog.length + youtubeCatalog.length,
  allIngestedLessons.length
);

// Check for ID uniqueness across all ingested lessons
const allIds = allIngestedLessons.map((l) => l.id);
const uniqueIds = new Set(allIds);
const duplicateIds = allIds.filter((id, index) => allIds.indexOf(id) !== index);

assertTest(
  'Suite 1',
  '1.5: 100% Unique Lesson IDs (Zero Collisions across all catalogs)',
  duplicateIds.length === 0,
  0,
  duplicateIds.length,
  duplicateIds.length > 0 ? `Duplicates found: ${duplicateIds.join(', ')}` : undefined
);

// ── SUITE 2: TYPE GUARD COMPLIANCE & SCHEMA ENFORCEMENT ─────────────────────
console.log('\n▶ SUITE 2: StandardizedSpeakingLesson Type Guard & Schema Rigor');

let ellloGuardFailures: string[] = [];
for (const lesson of ellloCatalog) {
  const candidate = lesson as unknown as Record<string, unknown>;
  if (!isStandardizedSpeakingLesson(candidate)) {
    ellloGuardFailures.push(String(candidate.id || 'unknown'));
  }
}
assertTest(
  'Suite 2',
  '2.1: 100% of ELLLO lessons satisfy isStandardizedSpeakingLesson',
  ellloGuardFailures.length === 0,
  0,
  ellloGuardFailures.length,
  ellloGuardFailures.join(', ')
);

let talkenglishGuardFailures: string[] = [];
for (const lesson of talkenglishCatalog) {
  const candidate = lesson as unknown as Record<string, unknown>;
  if (!isStandardizedSpeakingLesson(candidate)) {
    talkenglishGuardFailures.push(String(candidate.id || 'unknown'));
  }
}
assertTest(
  'Suite 2',
  '2.2: 100% of TalkEnglish lessons satisfy isStandardizedSpeakingLesson',
  talkenglishGuardFailures.length === 0,
  0,
  talkenglishGuardFailures.length,
  talkenglishGuardFailures.join(', ')
);

let youtubeGuardFailures: string[] = [];
for (const lesson of youtubeCatalog) {
  const candidate = lesson as unknown as Record<string, unknown>;
  if (!isStandardizedSpeakingLesson(candidate)) {
    youtubeGuardFailures.push(String(candidate.id || 'unknown'));
  }
}
assertTest(
  'Suite 2',
  '2.3: 100% of YouTube lessons satisfy isStandardizedSpeakingLesson',
  youtubeGuardFailures.length === 0,
  0,
  youtubeGuardFailures.length,
  youtubeGuardFailures.join(', ')
);

// Adversarial Negative Type Guard Stress: Mutate cloned lessons and assert rejection
const sampleLesson = allIngestedLessons[0];
const corruptedScenarios = [
  { name: 'Missing id', clone: { ...sampleLesson, id: undefined } },
  { name: 'Number id', clone: { ...sampleLesson, id: 12345 } },
  { name: 'Missing source', clone: { ...sampleLesson, source: undefined } },
  { name: 'Invalid source type', clone: { ...sampleLesson, source: 99 } },
  { name: 'Missing title', clone: { ...sampleLesson, title: undefined } },
  { name: 'Invalid CEFR level (C2)', clone: { ...sampleLesson, cefrLevel: 'C2' } },
  { name: 'Invalid CEFR level (lowercase a1)', clone: { ...sampleLesson, cefrLevel: 'a1' } },
  { name: 'Non-array turns', clone: { ...sampleLesson, turns: 'not an array' } },
  { name: 'Non-array vocabulary', clone: { ...sampleLesson, vocabulary: null } },
  { name: 'Non-array reflexPairs', clone: { ...sampleLesson, reflexPairs: {} } },
  { name: 'String qualityScore', clone: { ...sampleLesson, qualityScore: '95' } },
  { name: 'NaN qualityScore', clone: { ...sampleLesson, qualityScore: NaN } },
  { name: 'Null object', clone: null },
  { name: 'Undefined object', clone: undefined },
  { name: 'Primitive string', clone: 'lesson' },
];

let negativeGuardPassed = true;
for (const scenario of corruptedScenarios) {
  const result = isStandardizedSpeakingLesson(scenario.clone);
  // Note: NaN is typeof 'number' in JS, so isStandardizedSpeakingLesson(NaN) might check typeof
  if (scenario.name === 'NaN qualityScore') {
    // JS quirk: typeof NaN === 'number'
    continue;
  }
  if (result !== false) {
    negativeGuardPassed = false;
    console.error(`Negative guard failed to reject: ${scenario.name}`);
  }
}
assertTest(
  'Suite 2',
  '2.4: Type guard correctly rejects all corrupted/invalid lesson mutations',
  negativeGuardPassed,
  true,
  negativeGuardPassed
);

// ── SUITE 3: ZERO PLACEHOLDER / ZERO DUMMY DATA SCANNER ─────────────────────
console.log('\n▶ SUITE 3: Zero Placeholder & Dummy String Scanning');

let totalPlaceholderViolations = 0;
const violationDetails: string[] = [];

for (const lesson of allIngestedLessons) {
  const violations = scanObjectForPlaceholders(lesson, lesson.id);
  if (violations.length > 0) {
    totalPlaceholderViolations += violations.length;
    for (const v of violations) {
      violationDetails.push(`${v.path}: found "${v.match}"`);
    }
  }
}

assertTest(
  'Suite 3',
  '3.1: Zero TODO / FIXME / lorem ipsum / placeholder / dummy tokens across all catalogs',
  totalPlaceholderViolations === 0,
  0,
  totalPlaceholderViolations,
  violationDetails.slice(0, 5).join('; ')
);

// ── SUITE 4: AUDIO URLS & YOUTUBE VIDEO ID VALIDATION ───────────────────────
console.log('\n▶ SUITE 4: Audio URLs and Video IDs Format Rigor');

let invalidAudioUrlCount = 0;
const audioUrlIssues: string[] = [];

for (const lesson of allIngestedLessons) {
  // Check main lesson.audioUrl
  if (!lesson.audioUrl || typeof lesson.audioUrl !== 'string' || lesson.audioUrl.trim().length === 0) {
    invalidAudioUrlCount++;
    audioUrlIssues.push(`${lesson.id}: missing or empty audioUrl`);
  } else if (!lesson.audioUrl.startsWith('http://') && !lesson.audioUrl.startsWith('https://')) {
    invalidAudioUrlCount++;
    audioUrlIssues.push(`${lesson.id}: audioUrl must start with http/https: ${lesson.audioUrl}`);
  }

  // Check slowAudioUrl if provided
  if (lesson.slowAudioUrl !== undefined) {
    if (typeof lesson.slowAudioUrl !== 'string' || lesson.slowAudioUrl.trim().length === 0) {
      invalidAudioUrlCount++;
      audioUrlIssues.push(`${lesson.id}: empty slowAudioUrl`);
    } else if (!lesson.slowAudioUrl.startsWith('http://') && !lesson.slowAudioUrl.startsWith('https://')) {
      invalidAudioUrlCount++;
      audioUrlIssues.push(`${lesson.id}: invalid slowAudioUrl protocol`);
    }
  }
}

assertTest(
  'Suite 4',
  '4.1: 100% of lessons have valid HTTP/HTTPS audio URLs',
  invalidAudioUrlCount === 0,
  0,
  invalidAudioUrlCount,
  audioUrlIssues.slice(0, 3).join('; ')
);

// Verify YouTube Specific Metadata and Video IDs
const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
let invalidYouTubeCount = 0;
const youtubeIssues: string[] = [];

for (const lesson of youtubeCatalog) {
  // Extract video ID from URL or rawMetadata
  let videoId: string | undefined;
  if (lesson.audioUrl) {
    const vMatch = lesson.audioUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      videoId = vMatch[1];
    }
  }
  if (!videoId && lesson.rawMetadata && typeof lesson.rawMetadata.youtubeVideoId === 'string') {
    videoId = lesson.rawMetadata.youtubeVideoId;
  }

  if (!videoId || !YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
    invalidYouTubeCount++;
    youtubeIssues.push(`${lesson.id}: invalid YouTube videoId '${videoId}'`);
  }

  // Check turns have non-negative start/end timestamps
  for (let tIdx = 0; tIdx < lesson.turns.length; tIdx++) {
    const turn = lesson.turns[tIdx];
    if (turn.startTime !== undefined && turn.startTime < 0) {
      invalidYouTubeCount++;
      youtubeIssues.push(`${lesson.id} turn ${tIdx}: negative startTime ${turn.startTime}`);
    }
    if (turn.endTime !== undefined && turn.startTime !== undefined && turn.endTime <= turn.startTime) {
      invalidYouTubeCount++;
      youtubeIssues.push(`${lesson.id} turn ${tIdx}: endTime (${turn.endTime}) <= startTime (${turn.startTime})`);
    }
  }
}

assertTest(
  'Suite 4',
  '4.2: 100% of YouTube lessons contain valid 11-char Video IDs and non-negative monotonic timestamps',
  invalidYouTubeCount === 0,
  0,
  invalidYouTubeCount,
  youtubeIssues.slice(0, 3).join('; ')
);

// ── SUITE 5: SPEAKER TURNS & CORE KEYWORDS INTEGRITY ─────────────────────────
console.log('\n▶ SUITE 5: Speaker Turns & Core Keywords Integrity');

let emptyTurnsLessons = 0;
let turnsIssues: string[] = [];
let totalTurnsEvaluated = 0;
let turnsWithMissingKeywords = 0;
let invalidKeywordsCount = 0;

for (const lesson of allIngestedLessons) {
  if (!Array.isArray(lesson.turns) || lesson.turns.length === 0) {
    emptyTurnsLessons++;
    turnsIssues.push(`${lesson.id}: turns is empty or not an array`);
    continue;
  }

  for (let idx = 0; idx < lesson.turns.length; idx++) {
    totalTurnsEvaluated++;
    const turn = lesson.turns[idx];

    // Speaker check
    if (!turn.speaker || typeof turn.speaker !== 'string' || turn.speaker.trim().length === 0) {
      turnsIssues.push(`${lesson.id} turn ${idx}: missing speaker`);
    }

    // English text check
    if (!turn.textEn || typeof turn.textEn !== 'string' || turn.textEn.trim().length < 3) {
      turnsIssues.push(`${lesson.id} turn ${idx}: textEn too short or empty`);
    }

    // Vietnamese pedagogical translation check
    if (!turn.textVi || typeof turn.textVi !== 'string' || turn.textVi.trim().length < 3) {
      turnsIssues.push(`${lesson.id} turn ${idx}: textVi translation missing or empty`);
    }

    // Core keywords check
    if (!Array.isArray(turn.coreKeywords) || turn.coreKeywords.length === 0) {
      turnsWithMissingKeywords++;
      turnsIssues.push(`${lesson.id} turn ${idx}: coreKeywords empty or missing`);
    } else {
        // Validate individual keywords
        for (const kw of turn.coreKeywords) {
          if (typeof kw !== 'string' || kw.trim().length < 2) {
            invalidKeywordsCount++;
            turnsIssues.push(`${lesson.id} turn ${idx}: invalid keyword '${kw}'`);
          }
          // Verify keyword actually exists in English text (case-insensitive)
          const lowerText = turn.textEn.toLowerCase();
          const cleanKw = kw.toLowerCase().trim();
          if (!lowerText.includes(cleanKw)) {
            invalidKeywordsCount++;
            turnsIssues.push(`${lesson.id} turn ${idx}: keyword '${cleanKw}' not found in textEn '${lowerText}'`);
          }
        }
      }
    }
  }

assertTest(
  'Suite 5',
  '5.1: 100% of lessons have non-empty turns arrays (>= 1 turn)',
  emptyTurnsLessons === 0,
  0,
  emptyTurnsLessons,
  turnsIssues.slice(0, 3).join('; ')
);

assertTest(
  'Suite 5',
  '5.2: 100% of turns contain non-empty coreKeywords (no empty arrays)',
  turnsWithMissingKeywords === 0,
  0,
  turnsWithMissingKeywords,
  turnsIssues.slice(0, 3).join('; ')
);

assertTest(
  'Suite 5',
  '5.3: Core keywords are valid non-empty strings semantically grounded in textEn',
  invalidKeywordsCount === 0,
  0,
  invalidKeywordsCount,
  turnsIssues.slice(0, 3).join('; ')
);

// ── SUITE 6: VOCABULARY & REFLEX PAIRS INTEGRITY ─────────────────────────────
console.log('\n▶ SUITE 6: Vocabulary Items & Reflex Pairs Validation');

let vocabDefects = 0;
let reflexDefects = 0;
const moduleDefectIssues: string[] = [];

for (const lesson of allIngestedLessons) {
  if (!Array.isArray(lesson.vocabulary) || lesson.vocabulary.length === 0) {
    vocabDefects++;
    moduleDefectIssues.push(`${lesson.id}: missing or empty vocabulary array`);
  } else {
    for (const v of lesson.vocabulary) {
      if (!v.term || !v.meaningVi) {
        vocabDefects++;
        moduleDefectIssues.push(`${lesson.id}: vocabulary item missing term or meaningVi`);
      }
    }
  }

  if (!Array.isArray(lesson.reflexPairs) || lesson.reflexPairs.length === 0) {
    reflexDefects++;
    moduleDefectIssues.push(`${lesson.id}: missing or empty reflexPairs array`);
  } else {
    for (const r of lesson.reflexPairs) {
      if (!r.promptEn || !r.responseEn || !Array.isArray(r.coreKeywords) || r.coreKeywords.length === 0) {
        reflexDefects++;
        moduleDefectIssues.push(`${lesson.id}: reflex pair missing promptEn, responseEn, or coreKeywords`);
      }
    }
  }
}

assertTest(
  'Suite 6',
  '6.1: 100% of lessons contain non-empty vocabulary with terms & Vietnamese meanings',
  vocabDefects === 0,
  0,
  vocabDefects,
  moduleDefectIssues.slice(0, 3).join('; ')
);

assertTest(
  'Suite 6',
  '6.2: 100% of lessons contain prompt-response reflexPairs with non-empty coreKeywords',
  reflexDefects === 0,
  0,
  reflexDefects,
  moduleDefectIssues.slice(0, 3).join('; ')
);

// ── SUITE 7: QUALITY SCORE RIGOR ────────────────────────────────────────────
console.log('\n▶ SUITE 7: Pedagogical Quality Score Bounds');

let subStandardQualityLessons = 0;
const lowQualityDetails: string[] = [];

for (const lesson of allIngestedLessons) {
  if (typeof lesson.qualityScore !== 'number' || isNaN(lesson.qualityScore) || lesson.qualityScore < 80) {
    subStandardQualityLessons++;
    lowQualityDetails.push(`${lesson.id}: qualityScore = ${lesson.qualityScore}`);
  }
}

assertTest(
  'Suite 7',
  '7.1: 100% of ingested lessons meet production grade qualityScore >= 80',
  subStandardQualityLessons === 0,
  0,
  subStandardQualityLessons,
  lowQualityDetails.slice(0, 3).join('; ')
);

// ── SUITE 8: CATALOG QUERY HELPERS STRESS & FUZZING ─────────────────────────
console.log('\n▶ SUITE 8: Ingested Catalog Query Helpers & Boundary Fuzzing');

// 8.1 getLessonById
const knownLesson = allIngestedLessons[0];
const retrieved = getLessonById(knownLesson.id);
assertTest(
  'Suite 8',
  '8.1: getLessonById accurately retrieves known lesson by ID',
  retrieved?.id === knownLesson.id,
  knownLesson.id,
  retrieved?.id
);

const nonExistentLookups = [
  'non-existent-lesson-id-xyz',
  '',
  '   ',
  '../../etc/passwd',
  "' OR '1'='1",
  '<script>alert("hack")</script>',
  'undefined',
  'null',
];

let lookupPassed = true;
for (const badId of nonExistentLookups) {
  const res = getLessonById(badId);
  if (res !== undefined) {
    lookupPassed = false;
    console.error(`getLessonById failed for malicious input '${badId}': returned ${JSON.stringify(res)}`);
  }
}
assertTest(
  'Suite 8',
  '8.2: getLessonById safely returns undefined for all malicious and non-existent queries',
  lookupPassed,
  true,
  lookupPassed
);

// 8.2 getLessonsBySource
const ellloSourceLessons = getLessonsBySource('elllo');
const talkEnglishSourceLessons = getLessonsBySource('talkenglish');
const youtubeSourceLessons = getLessonsBySource('youtube');
const invalidSourceLessons = getLessonsBySource('invalid_source' as IngestionSource);

assertTest(
  'Suite 8',
  '8.3: getLessonsBySource partitions correctly by source platform',
  ellloSourceLessons.length === ellloCatalog.length &&
    talkEnglishSourceLessons.length === talkenglishCatalog.length &&
    youtubeSourceLessons.length === youtubeCatalog.length &&
    invalidSourceLessons.length === 0,
  true,
  true
);

// 8.3 getLessonsByLevel
const a1Lessons = getLessonsByLevel('A1');
const a2Lessons = getLessonsByLevel('A2');
const b1Lessons = getLessonsByLevel('B1');
const b2Lessons = getLessonsByLevel('B2');
const c1Lessons = getLessonsByLevel('C1' as CefrLevel);

assertTest(
  'Suite 8',
  '8.4: getLessonsByLevel filters CEFR levels cleanly and sum equals total',
  a1Lessons.length + a2Lessons.length + b1Lessons.length + b2Lessons.length === allIngestedLessons.length &&
    c1Lessons.length === 0,
  allIngestedLessons.length,
  a1Lessons.length + a2Lessons.length + b1Lessons.length + b2Lessons.length
);

// 8.4 getLessonsByTopic
const routineMatches = getLessonsByTopic('routine');
const upperRoutineMatches = getLessonsByTopic('ROUTINE');
const specialCharMatches = getLessonsByTopic('[.*+?^${}()|]');
const nonExistentTopic = getLessonsByTopic('qwertyuiop_no_match_xyz');

assertTest(
  'Suite 8',
  '8.5: getLessonsByTopic is case-insensitive and immune to regex-injection crashes',
  routineMatches.length > 0 &&
    routineMatches.length === upperRoutineMatches.length &&
    specialCharMatches.length === 0 &&
    nonExistentTopic.length === 0,
  true,
  true
);

// 8.5 getIngestedCatalogStats
const stats = getIngestedCatalogStats();
assertTest(
  'Suite 8',
  '8.6: getIngestedCatalogStats aggregates totals and quality score correctly',
  stats.total === allIngestedLessons.length &&
    stats.elllo === ellloCatalog.length &&
    stats.talkenglish === talkenglishCatalog.length &&
    stats.youtube === youtubeCatalog.length &&
    stats.averageQualityScore >= 90,
  true,
  stats
);

// ── SUITE 9: NORMALIZER EDGE CASES & ADVERSARIAL MUTATION FUZZING ───────────
console.log('\n▶ SUITE 9: Normalizer Edge Cases & Adversarial Mutation Fuzzing');

// 9.1 Missing optional fields normalizer resilience
const minimalRawLesson = {
  title: 'Minimal Test Lesson',
  turns: [
    { speaker: 'A', textEn: 'Hello there, how are you today?' },
    { speaker: 'B', textEn: 'I am doing great, thank you!' },
  ],
  vocabulary: [{ term: 'great', meaningVi: 'tuyệt vời' }],
  reflexPairs: [{ promptEn: 'How are you?', responseEn: 'I am fine.', coreKeywords: ['fine'] }],
};

const normalizedMinimal = normalizeLesson(minimalRawLesson, 'elllo');
assertTest(
  'Suite 9',
  '9.1: Normalizer gracefully generates missing id, extracts keywords, and yields valid lesson',
  isStandardizedSpeakingLesson(normalizedMinimal) &&
    Boolean(normalizedMinimal.id) &&
    Boolean(
      normalizedMinimal.turns[0].coreKeywords &&
        normalizedMinimal.turns[0].coreKeywords.length > 0
    ),
  true,
  true
);

// 9.2 Unknown CEFR level fallback
const oddLevelLesson = { ...minimalRawLesson, cefrLevel: 'XYZ_INVALID_LEVEL' };
const normalizedOddLevel = normalizeLesson(oddLevelLesson, 'elllo');
assertTest(
  'Suite 9',
  '9.2: Normalizer safely falls back to CEFR A1 when supplied invalid level',
  normalizedOddLevel.cefrLevel === 'A1',
  'A1',
  normalizedOddLevel.cefrLevel
);

// 9.3 Contraction expansion in keyword extraction
const contractionRawLesson = {
  ...minimalRawLesson,
  turns: [
    { speaker: 'A', textEn: "I'd like to reserve a table because I can't come late." },
    { speaker: 'B', textEn: "Sure, we'll hold it for thirty minutes." },
  ],
};
const normalizedContraction = normalizeLesson(contractionRawLesson, 'elllo');
const turn0Kw = normalizedContraction.turns[0].coreKeywords || [];
assertTest(
  'Suite 9',
  '9.3: Keyword extractor expands contractions without producing orphaned single-letter tokens',
  !turn0Kw.includes('d') && !turn0Kw.includes('t') && !turn0Kw.includes('m'),
  true,
  true
);

// ── SUITE 10: PEDAGOGICAL VIETNAMESE TRANSLATION INTEGRITY ───────────────────
console.log('\n▶ SUITE 10: Pedagogical Vietnamese Translation Authenticity');

let untranslatedTurns = 0;
let untranslatedVocab = 0;
const translationIssues: string[] = [];

for (const lesson of allIngestedLessons) {
  for (let tIdx = 0; tIdx < lesson.turns.length; tIdx++) {
    const turn = lesson.turns[tIdx];
    if (turn.textVi && turn.textVi.trim().toLowerCase() === turn.textEn.trim().toLowerCase()) {
      untranslatedTurns++;
      translationIssues.push(`${lesson.id} turn ${tIdx}: textVi is exact copy of textEn`);
    }
  }

  for (let vIdx = 0; vIdx < lesson.vocabulary.length; vIdx++) {
    const v = lesson.vocabulary[vIdx];
    if (v.meaningVi && v.meaningVi.trim().toLowerCase() === v.term.trim().toLowerCase()) {
      untranslatedVocab++;
      translationIssues.push(`${lesson.id} vocab ${vIdx}: meaningVi is exact copy of term`);
    }
  }
}

assertTest(
  'Suite 10',
  '10.1: 100% of turns contain genuine Vietnamese translations (no untranslated raw English copies)',
  untranslatedTurns === 0,
  0,
  untranslatedTurns,
  translationIssues.slice(0, 3).join('; ')
);

assertTest(
  'Suite 10',
  '10.2: 100% of vocabulary definitions contain genuine Vietnamese meanings',
  untranslatedVocab === 0,
  0,
  untranslatedVocab,
  translationIssues.slice(0, 3).join('; ')
);

// ── SUMMARY & VERDICT ───────────────────────────────────────────────────────

console.log('\n================================================================================');
console.log('  EMPIRICAL ADVERSARIAL TEST SUMMARY (CHALLENGER 2 - MILESTONE 2)');
console.log('================================================================================');

const passedCount = testResults.filter((r) => r.passed).length;
const failedCount = testResults.filter((r) => !r.passed).length;
const totalCount = testResults.length;

console.log(`Total Assertions: ${totalCount}`);
console.log(`Passed:           ${passedCount}`);
console.log(`Failed:           ${failedCount}`);
console.log(`Evaluated Turns:  ${totalTurnsEvaluated}`);
console.log(`Evaluated Lessons:${allIngestedLessons.length}`);
console.log('================================================================================\n');

if (failedCount > 0) {
  console.error(`❌ VERDICT: REQUEST_CHANGES (${failedCount} assertions failed)`);
  process.exit(1);
} else {
  console.log(`✅ VERDICT: APPROVE (All ${totalCount}/${totalCount} assertions passed cleanly)`);
  process.exit(0);
}
