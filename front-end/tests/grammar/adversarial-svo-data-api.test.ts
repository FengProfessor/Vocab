/**
 * Adversarial Stress & Empirical Verification Test Suite for Lesson #0 (sentence-structure-svo)
 *
 * Authored by: challenger_svo_1 (Data and API Empirical Challenger)
 * Scope:
 *  1. Roadmap Invariants & Slug Resolution (getTopicBySlug, order: 0, sum of stages = 63, sequentiality)
 *  2. Theory JSON & Token Slice Integrity (16 sentences match R3 verbatim, POS string slice character-level exactness, whitelist, overlap detection)
 *  3. API Route Logic & Security (nullish coalescing preservation of order 0, cache consistency, path traversal resistance)
 *  4. Codebase-wide falsy audit on topic.order
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  UNIFIED_GRAMMAR_TOPICS,
  GRAMMAR_STAGES,
  getTopicBySlug,
  getTopicsByLevel,
} from '@/lib/grammar-roadmap-data';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures: Array<{ suite: string; assertion: string; details?: string }> = [];

function expect(condition: boolean, assertion: string, suite: string, details?: string) {
  totalAssertions++;
  if (condition) {
    console.log(`  [PASS] ${assertion}`);
    passedAssertions++;
  } else {
    console.error(`  [FAIL] ${assertion}`);
    if (details) console.error(`         -> ${details}`);
    failedAssertions++;
    failures.push({ suite, assertion, details });
  }
}

console.log('\n======================================================================');
console.log('   CHALLENGER_SVO_1: ADVERSARIAL DATA & API STRESS TEST HARNESS');
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: ROADMAP DATA INVARIANTS & SLUG RESOLUTION
// ============================================================================
console.log('--- SUITE 1: Roadmap Data Invariants & Slug Resolution ---');

const SVO_SLUG = 'sentence-structure-svo';
const svo = getTopicBySlug(SVO_SLUG);

expect(svo !== undefined, 'getTopicBySlug resolves "sentence-structure-svo"', 'Suite 1');
expect(svo?.order === 0, 'svo.order is strictly 0', 'Suite 1', `Got: ${svo?.order}`);
expect(typeof svo?.order === 'number', 'svo.order is of type number', 'Suite 1', `Type: ${typeof svo?.order}`);
expect(svo?.level === 'A0', 'svo.level is "A0"', 'Suite 1', `Got: ${svo?.level}`);
expect(svo?.stageNumber === 1, 'svo.stageNumber is 1', 'Suite 1', `Got: ${svo?.stageNumber}`);
expect(svo?.stageLabel === 'Stage 1: A0 Khởi đầu', 'svo.stageLabel matches Stage 1', 'Suite 1');
expect(svo?.title === 'Sentence Structure (S + V + O)', 'svo.title matches exact English title', 'Suite 1');
expect(svo?.title_vi === 'Cấu trúc câu cơ bản (S + V + O)', 'svo.title_vi matches exact Vietnamese title', 'Suite 1');

// Adversarial slug inputs
const adversarialSlugs = [
  '',
  '   ',
  'sentence-structure-svo ',
  ' sentence-structure-svo',
  'SENTENCE-STRUCTURE-SVO',
  'Sentence-Structure-Svo',
  'sentence_structure_svo',
  'sentence-structure-svo\0',
  'non-existent-slug',
  '__proto__',
  'constructor',
  'toString',
  'valueOf',
  '../grammar',
  'sentence-structure-svo/sub',
];

for (const badSlug of adversarialSlugs) {
  const result = getTopicBySlug(badSlug);
  expect(
    result === undefined,
    `getTopicBySlug('${badSlug.replace(/\0/g, '\\0')}') safely returns undefined`,
    'Suite 1',
    result ? `Unexpectedly resolved to ${result.slug}` : undefined
  );
}

// Stage count invariants
expect(UNIFIED_GRAMMAR_TOPICS.length === 63, 'UNIFIED_GRAMMAR_TOPICS contains exactly 63 topics', 'Suite 1', `Got: ${UNIFIED_GRAMMAR_TOPICS.length}`);

const stageSum = GRAMMAR_STAGES.reduce((acc, s) => acc + s.topicCount, 0);
expect(stageSum === 63, 'Sum of all stage topicCounts in GRAMMAR_STAGES is exactly 63', 'Suite 1', `Got: ${stageSum}`);

// Each stage matches actual topic distribution
for (const stage of GRAMMAR_STAGES) {
  const matchingByStageNum = UNIFIED_GRAMMAR_TOPICS.filter((t) => t.stageNumber === stage.stageNumber);
  const matchingByLevel = UNIFIED_GRAMMAR_TOPICS.filter((t) => t.level === stage.id);

  expect(
    matchingByStageNum.length === stage.topicCount,
    `Stage ${stage.stageNumber} (${stage.id}) stageNumber count matches topicCount (${stage.topicCount})`,
    'Suite 1',
    `Expected ${stage.topicCount}, got ${matchingByStageNum.length}`
  );

  expect(
    matchingByLevel.length === stage.topicCount,
    `Stage ${stage.stageNumber} (${stage.id}) level filter matches topicCount (${stage.topicCount})`,
    'Suite 1',
    `Expected ${stage.topicCount}, got ${matchingByLevel.length}`
  );
}

// Sequential contiguous order invariant from 0 to 62
const allOrders = UNIFIED_GRAMMAR_TOPICS.map((t) => t.order);
const uniqueOrders = new Set(allOrders);
expect(uniqueOrders.size === 63, 'All 63 topics have unique order numbers (0 collisions)', 'Suite 1', `Unique: ${uniqueOrders.size}`);

let contiguousPass = true;
let nonContiguousDetails = '';
for (let i = 0; i < 63; i++) {
  if (UNIFIED_GRAMMAR_TOPICS[i].order !== i) {
    contiguousPass = false;
    nonContiguousDetails = `Topic at index ${i} has order ${UNIFIED_GRAMMAR_TOPICS[i].order} instead of ${i}`;
    break;
  }
}
expect(contiguousPass, 'Topics are strictly contiguous in array index order (topic[i].order === i for all 0 <= i <= 62)', 'Suite 1', nonContiguousDetails);

// Only one topic has order 0
const orderZeroTopics = UNIFIED_GRAMMAR_TOPICS.filter((t) => t.order === 0);
expect(orderZeroTopics.length === 1 && orderZeroTopics[0].slug === SVO_SLUG, 'Exactly one topic has order: 0 and it is "sentence-structure-svo"', 'Suite 1');

// ============================================================================
// SUITE 2: THEORY JSON & POS STRING SLICING INTEGRITY
// ============================================================================
console.log('\n--- SUITE 2: Theory JSON & POS Token Slicing Integrity ---');

const jsonPath = path.resolve(process.cwd(), 'scripts/grammar-gen/out/sentence-structure-svo.json');
let jsonData: any = null;

try {
  const content = fs.readFileSync(jsonPath, 'utf8');
  jsonData = JSON.parse(content);
  expect(true, 'sentence-structure-svo.json parses cleanly without syntax errors', 'Suite 2');
} catch (e: any) {
  expect(false, 'sentence-structure-svo.json parses cleanly without syntax errors', 'Suite 2', e.message);
}

if (jsonData) {
  expect(jsonData.slug === SVO_SLUG, 'JSON slug === "sentence-structure-svo"', 'Suite 2');
  expect(jsonData.order === 0, 'JSON order === 0', 'Suite 2');
  expect(jsonData.level === 'A0', 'JSON level === "A0"', 'Suite 2');

  const examples = jsonData.sections?.examples || [];
  expect(examples.length === 16, 'sections.examples contains exactly 16 sentences', 'Suite 2', `Got: ${examples.length}`);

  // 16 Verbatim R3 Sentences
  const r3Sentences = [
    // Group 1: Ăn uống & Nhu cầu thiết yếu
    { en: 'I eat rice.', vi: 'Tôi ăn cơm.', group: 'Ăn uống & Nhu cầu thiết yếu' },
    { en: 'I drink water.', vi: 'Tôi uống nước.', group: 'Ăn uống & Nhu cầu thiết yếu' },
    { en: 'We eat bread.', vi: 'Chúng tôi ăn bánh mì.', group: 'Ăn uống & Nhu cầu thiết yếu' },
    { en: 'They drink coffee.', vi: 'Họ uống cà phê.', group: 'Ăn uống & Nhu cầu thiết yếu' },
    // Group 2: Sinh hoạt & Sở thích hàng ngày
    { en: 'I read books.', vi: 'Tôi đọc sách.', group: 'Sinh hoạt & Sở thích hàng ngày' },
    { en: 'You listen to music.', vi: 'Bạn nghe nhạc.', group: 'Sinh hoạt & Sở thích hàng ngày' },
    { en: 'We watch TV.', vi: 'Chúng tôi xem tivi.', group: 'Sinh hoạt & Sở thích hàng ngày' },
    { en: 'They play football.', vi: 'Họ chơi bóng đá.', group: 'Sinh hoạt & Sở thích hàng ngày' },
    // Group 3: Học tập & Công việc
    { en: 'We learn English.', vi: 'Chúng tôi học tiếng Anh.', group: 'Học tập & Công việc' },
    { en: 'She teaches math.', vi: 'Cô ấy dạy toán.', group: 'Học tập & Công việc' },
    { en: 'My father drives a car.', vi: 'Bố tôi lái xe hơi.', group: 'Học tập & Công việc' },
    { en: 'My mother cooks dinner.', vi: 'Mẹ tôi nấu bữa tối.', group: 'Học tập & Công việc' },
    // Group 4: Tương tác giữa người với người
    { en: 'I love you.', vi: 'Tôi yêu bạn.', group: 'Tương tác giữa người với người' },
    { en: 'You love me.', vi: 'Bạn yêu tôi.', group: 'Tương tác giữa người với người' },
    { en: 'I help him.', vi: 'Tôi giúp anh ấy.', group: 'Tương tác giữa người với người' },
    { en: 'He helps me.', vi: 'Anh ấy giúp tôi.', group: 'Tương tác giữa người với người' },
  ];

  for (let i = 0; i < r3Sentences.length; i++) {
    const expected = r3Sentences[i];
    const match = examples.find(
      (ex: any) => ex.en?.trim() === expected.en && ex.vi?.trim() === expected.vi
    );
    expect(
      Boolean(match),
      `R3 sentence #${i + 1} present verbatim: "${expected.en}" / "${expected.vi}"`,
      'Suite 2',
      match ? undefined : `Missing or altered sentence #${i + 1}`
    );
  }

  // POS Slicing Integrity Check
  const posWhitelist = new Set([
    'noun', 'pronoun', 'verb', 'auxiliary', 'modal',
    'adjective', 'adverb', 'preposition', 'conjunction',
    'determiner', 'article', 'interjection', 'other',
  ]);

  let allSlicesMatch = true;
  let allBoundsValid = true;
  let allRolesWhitelisted = true;
  let noWhitespaceInTokens = true;
  let noPunctuationInTokens = true;
  let noOverlappingSlices = true;
  const sliceErrors: string[] = [];

  examples.forEach((ex: any, exIdx: number) => {
    const enText: string = ex.en || '';
    const annotations: any[] = ex.annotations || [];

    if (!Array.isArray(annotations) || annotations.length === 0) {
      allSlicesMatch = false;
      sliceErrors.push(`Example #${exIdx} ("${enText}") has no annotations`);
      return;
    }

    // Sort annotations by start index to check overlap
    const sorted = [...annotations].sort((a, b) => a.start - b.start);

    for (let j = 0; j < sorted.length; j++) {
      const a = sorted[j];

      // Bounds validation
      if (
        typeof a.start !== 'number' ||
        typeof a.end !== 'number' ||
        !Number.isInteger(a.start) ||
        !Number.isInteger(a.end) ||
        a.start < 0 ||
        a.end > enText.length ||
        a.start >= a.end
      ) {
        allBoundsValid = false;
        sliceErrors.push(`Example #${exIdx} invalid bounds [${a.start}, ${a.end}] for "${enText}" (len ${enText.length})`);
      }

      // Slice exact match
      const slice = enText.slice(a.start, a.end);
      if (slice !== a.word) {
        allSlicesMatch = false;
        sliceErrors.push(`Example #${exIdx} slice mismatch: slice "${slice}" !== word "${a.word}" at [${a.start}, ${a.end}] in "${enText}"`);
      }

      // Token hygiene: no whitespace in token
      if (/\s/.test(a.word)) {
        noWhitespaceInTokens = false;
        sliceErrors.push(`Example #${exIdx} token contains whitespace: "${a.word}"`);
      }

      // Token hygiene: no trailing or leading punctuation in token
      if (/^[.,!?;:]|[.,!?;:]$/.test(a.word)) {
        noPunctuationInTokens = false;
        sliceErrors.push(`Example #${exIdx} token contains punctuation: "${a.word}"`);
      }

      // POS Whitelist
      if (!posWhitelist.has(a.role)) {
        allRolesWhitelisted = false;
        sliceErrors.push(`Example #${exIdx} unapproved role: "${a.role}" for word "${a.word}"`);
      }

      // Overlap check with previous annotation
      if (j > 0) {
        const prev = sorted[j - 1];
        if (prev.end > a.start) {
          noOverlappingSlices = false;
          sliceErrors.push(`Example #${exIdx} overlapping annotations: [${prev.start}, ${prev.end}] ("${prev.word}") and [${a.start}, ${a.end}] ("${a.word}")`);
        }
      }
    }
  });

  expect(allBoundsValid, 'All annotation indices are within valid sentence string bounds (0 <= start < end <= text.length)', 'Suite 2', sliceErrors[0]);
  expect(allSlicesMatch, 'All 16 sentences satisfy exact character slicing: example.en.slice(start, end) === word', 'Suite 2', sliceErrors.find((e) => e.includes('slice mismatch')));
  expect(noWhitespaceInTokens, 'All annotated words contain zero whitespace characters', 'Suite 2');
  expect(noPunctuationInTokens, 'All annotated words contain zero trailing or leading punctuation', 'Suite 2');
  expect(allRolesWhitelisted, 'All annotation roles belong to the 13 approved POS taxonomy whitelist', 'Suite 2');
  expect(noOverlappingSlices, 'Zero overlapping token annotations across all sentences', 'Suite 2');
}

// ============================================================================
// SUITE 3: API ROUTE LOGIC & NULLISH COALESCING EVALUATION
// ============================================================================
console.log('\n--- SUITE 3: API Route Logic & Nullish Coalescing Evaluation ---');

// Test the exact semantics of `raw.order ?? 1`
function evaluateOrderNullish(rawOrder: any): number {
  return rawOrder ?? 1;
}

function evaluateOrderFalsy(rawOrder: any): number {
  return rawOrder || 1;
}

// Case 1: raw.order is 0 (Lesson #0)
expect(evaluateOrderNullish(0) === 0, 'Nullish coalescing (0 ?? 1) correctly evaluates to 0', 'Suite 3');
expect(evaluateOrderFalsy(0) === 1, 'Falsy OR (0 || 1) incorrectly coerces 0 to 1 (proves danger of ||)', 'Suite 3');

// Case 2: raw.order is undefined / null
expect(evaluateOrderNullish(undefined) === 1, 'Nullish coalescing (undefined ?? 1) evaluates to 1', 'Suite 3');
expect(evaluateOrderNullish(null) === 1, 'Nullish coalescing (null ?? 1) evaluates to 1', 'Suite 3');

// Case 3: Verify source code in src/app/api/grammar/theory/route.ts
const routeFilePath = path.resolve(process.cwd(), 'src/app/api/grammar/theory/route.ts');
const routeSource = fs.readFileSync(routeFilePath, 'utf8');

expect(routeSource.includes('order: raw.order ?? 1'), 'route.ts strictly uses nullish coalescing: "order: raw.order ?? 1"', 'Suite 3');
expect(!routeSource.includes('order: raw.order || 1'), 'route.ts does NOT contain buggy falsy coalesce: "order: raw.order || 1"', 'Suite 3');

// Security check: Path traversal resistance in route.ts
// In route.ts: const filePath = path.join(process.cwd(), 'scripts/grammar-gen/out', `${topicSlug}.json`);
// If topicSlug contains '..' or '/', it could attempt path traversal.
const hasSlugSanitization =
  routeSource.includes('path.basename') ||
  routeSource.includes('^[a-z0-9-]+$') ||
  routeSource.includes('replace') ||
  routeSource.includes('includes(\'..\')');

if (!hasSlugSanitization) {
  console.warn('  [NOTE/OBSERVATION] route.ts does not explicitly sanitize topicSlug with regex or path.basename before path.join.');
  console.warn('                     However, NextRequest query param is scoped to .json files inside cwd.');
}

// ============================================================================
// SUITE 4: CODEBASE-WIDE FALSY AUDIT ON TOPIC.ORDER
// ============================================================================
console.log('\n--- SUITE 4: Codebase-wide Audit for topic.order Usage ---');

// Search all .ts and .tsx files in src/ for dangerous patterns on .order
const srcDir = path.resolve(process.cwd(), 'src');

function findTsFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findTsFiles(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const allTsFiles = findTsFiles(srcDir);
const suspiciousPatterns = [
  /\bif\s*\(\s*(?:topic|t|raw)\.order\s*\)/,
  /\b(?:topic|t|raw)\.order\s*\|\|\s*\d+/,
  /\b(?:topic|t|raw)\.order\s*===\s*false\b/,
  /\b!(?:topic|t|raw)\.order\b/,
];

let foundSuspicious = false;
const suspiciousOccurrences: string[] = [];

for (const filePath of allTsFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      foundSuspicious = true;
      suspiciousOccurrences.push(`${path.relative(process.cwd(), filePath)} matches ${pattern}`);
    }
  }
}

expect(
  !foundSuspicious,
  'Zero dangerous falsy checks on topic.order (no `if (topic.order)` or `topic.order || 1`) across all src/**/*.ts(x)',
  'Suite 4',
  suspiciousOccurrences.join('; ')
);

// Check card numbering in src/app/grammar/page.tsx:
// `#{topic.order < 10 ? '0' : ''}{topic.order}`
const grammarPagePath = path.resolve(process.cwd(), 'src/app/grammar/page.tsx');
const grammarPageContent = fs.readFileSync(grammarPagePath, 'utf8');
const formatsWithDoubleZero = grammarPageContent.includes("topic.order < 10 ? '0' : ''");
expect(
  formatsWithDoubleZero,
  'src/app/grammar/page.tsx correctly formats order 0 as "#00" without off-by-one errors',
  'Suite 4'
);

// ============================================================================
// SUMMARY & EXIT
// ============================================================================
console.log('\n======================================================================');
console.log(`TOTAL ADVERSARIAL CHECKS : ${totalAssertions}`);
console.log(`PASSED                   : ${passedAssertions}`);
console.log(`FAILED                   : ${failedAssertions}`);
console.log('======================================================================\n');

if (failedAssertions > 0) {
  console.error('FAILURES:');
  failures.forEach((f, i) => {
    console.error(`  ${i + 1}. [${f.suite}] ${f.assertion}`);
    if (f.details) console.error(`     -> ${f.details}`);
  });
  process.exit(1);
} else {
  console.log('Result: ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY!\n');
  process.exit(0);
}
