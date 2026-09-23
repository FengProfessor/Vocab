/**
 * Adversarial Stress & Empirical Verification Test Suite
 * Speaking Topic Library Dashboard (Search, Filter, Category Partitioning & Image Resilience)
 *
 * File: tests/speaking/adversarial-search-stress.test.ts
 *
 * Runnable via: npx tsx tests/speaking/adversarial-search-stress.test.ts
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import {
  allTopicLibraryItems,
  getTopicLibraryByCategory,
  getTopicLibraryByLevel,
  getTopicLibraryBySubcategory,
  searchTopicLibrary,
  getTopicLibraryStats,
} from '../../src/data/speaking/topic-library';

import {
  TOPIC_LIBRARY_CATEGORY_LABELS,
  TOPIC_LIBRARY_CATEGORY_ICONS,
  type TopicLibraryCategory,
  type TopicLibraryItem,
  type TopicLibraryCefrLevel,
} from '../../src/types/speaking-topic-library';

// ── Dashboard Filter Simulation (matching src/app/student/speaking/topics/page.tsx exactly) ──

const PRIMARY_CATEGORIES: TopicLibraryCategory[] = [
  'describing',
  'daily_situations',
  'social',
  'workplace_extended',
];

const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80';

function resolveTopicImageUrl(topic: TopicLibraryItem): string {
  return (
    topic.imageUrl ||
    topic.keyVocabulary?.find((v) => Boolean(v.imageUrl))?.imageUrl ||
    topic.keyVocabulary?.[0]?.imageUrl ||
    FALLBACK_IMAGE_URL
  );
}

function simulateDashboardFilter(
  items: TopicLibraryItem[],
  searchQuery: string,
  selectedLevel: 'ALL' | TopicLibraryCefrLevel = 'ALL'
): TopicLibraryItem[] {
  const q = (searchQuery || '').trim().toLowerCase();

  return items.filter((item) => {
    const matchLevel = selectedLevel === 'ALL' || item.level === selectedLevel;
    if (!matchLevel) return false;

    if (!q) return true;

    const inEn = item.titleEn?.toLowerCase().includes(q);
    const inVi = item.titleVi?.toLowerCase().includes(q);
    const inSub = item.subcategory?.toLowerCase().includes(q);
    const inSituation = item.situationVi?.toLowerCase().includes(q);
    const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
    const inVocab = item.keyVocabulary?.some(
      (v) => (v.term?.toLowerCase().includes(q)) || (v.meaningVi?.toLowerCase().includes(q))
    );

    return Boolean(inEn || inVi || inSub || inSituation || inTags || inVocab);
  });
}

function simulateDashboardPartition(filtered: TopicLibraryItem[]): Record<TopicLibraryCategory, TopicLibraryItem[]> {
  const grouped: Record<TopicLibraryCategory, TopicLibraryItem[]> = {
    describing: [],
    daily_situations: [],
    social: [],
    workplace_extended: [],
  };

  filtered.forEach((item) => {
    if (grouped[item.category]) {
      grouped[item.category].push(item);
    }
  });

  return grouped;
}

// ── Test Harness ─────────────────────────────────────────────────────────────

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: Error;
}

class AdversarialTestRunner {
  private tests: Array<{ suite: string; name: string; fn: () => void | Promise<void> }> = [];
  private results: TestResult[] = [];

  test(suite: string, name: string, fn: () => void | Promise<void>) {
    this.tests.push({ suite, name, fn });
  }

  async run(): Promise<boolean> {
    const overallStart = performance.now();
    console.log('\n================================================================================');
    console.log('🔥 EMPIRICAL ADVERSARIAL STRESS TEST SUITE — SPEAKING TOPIC LIBRARY');
    console.log('================================================================================\n');

    for (const t of this.tests) {
      const start = performance.now();
      try {
        await t.fn();
        const duration = Math.round((performance.now() - start) * 100) / 100;
        this.results.push({
          suite: t.suite,
          name: t.name,
          passed: true,
          durationMs: duration,
        });
        console.log(`  [PASS] [${t.suite}] ${t.name} (${duration}ms)`);
      } catch (err: unknown) {
        const duration = Math.round((performance.now() - start) * 100) / 100;
        const error = err instanceof Error ? err : new Error(String(err));
        this.results.push({
          suite: t.suite,
          name: t.name,
          passed: false,
          durationMs: duration,
          error,
        });
        console.error(`  [FAIL] [${t.suite}] ${t.name} (${duration}ms)`);
        console.error(`         ❌ ${error.message}\n${error.stack || ''}`);
      }
    }

    const totalDuration = Math.round((performance.now() - overallStart) * 100) / 100;
    const passedCount = this.results.filter((r) => r.passed).length;
    const failedCount = this.results.filter((r) => !r.passed).length;

    const suites = Array.from(new Set(this.results.map((r) => r.suite)));

    console.log('\n--------------------------------------------------------------------------------');
    console.log('📊 SUITE EXECUTION SUMMARY:');
    console.log('--------------------------------------------------------------------------------');
    for (const s of suites) {
      const sResults = this.results.filter((r) => r.suite === s);
      const sPass = sResults.filter((r) => r.passed).length;
      const sTotal = sResults.length;
      const status = sPass === sTotal ? 'ALL PASSED' : `${sTotal - sPass} FAILED`;
      console.log(`  • ${s}: ${sPass}/${sTotal} passed [${status}]`);
    }

    console.log('--------------------------------------------------------------------------------');
    console.log(`Total Tests: ${this.tests.length} | Passed: ${passedCount} | Failed: ${failedCount} | Total Duration: ${totalDuration}ms`);
    console.log('================================================================================\n');

    return failedCount === 0;
  }
}

const runner = new AdversarialTestRunner();

// ============================================================================
// SUITE A: MALICIOUS & EXTREME SEARCH QUERIES
// ============================================================================

runner.test('Suite A: Malicious Search Queries', 'A.1: Catastrophic Regex Backtracking & Metacharacters', () => {
  const regexBombs = [
    '(a+)+$',
    '(a|aa)+',
    '([a-zA-Z]+)*',
    '(a|a?)+$',
    '((a+)+)+$',
    '.*+?^${}()|[]\\',
    '((a+){1,10}){1,10}',
    '(?(?=',
    '[a-z]+.*',
    '\\d+\\w+\\s+',
    '/(?:)/',
    '\\u0000',
    '(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x21\\x23-\\x5b\\x5d-\\x7f]|\\\\[\\x01-\\x09\\x0b\\x0c\\x0e-\\x7f])*")',
  ];

  for (const bomb of regexBombs) {
    const t0 = performance.now();
    let res: TopicLibraryItem[] = [];
    assert.doesNotThrow(() => {
      res = simulateDashboardFilter(allTopicLibraryItems, bomb, 'ALL');
    }, `Regex bomb "${bomb}" threw exception`);
    const elapsed = performance.now() - t0;

    assert.ok(Array.isArray(res), `Result must be an array for "${bomb}"`);
    assert.ok(elapsed < 20, `Regex bomb "${bomb}" execution too slow: ${elapsed.toFixed(2)}ms (must be <20ms)`);
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.2: Cross-Site Scripting (XSS) & Polyglot Payloads', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg onload=alert(document.domain)>',
    'javascript:/*--></title></style></textarea></script></xmp><svg/onload=\'+/"/+/onmouseover=1/+/[*/[]/+alert(1)//\'>',
    '<iframe src="javascript:alert(`xss`)"></iframe>',
    '<body onload=alert(1)>',
    '{{7*7}}',
    '${7*7}',
    '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">click</a>',
    '"><input autofocus onfocus=alert(1)>',
  ];

  for (const payload of xssPayloads) {
    let res: TopicLibraryItem[] = [];
    assert.doesNotThrow(() => {
      res = simulateDashboardFilter(allTopicLibraryItems, payload, 'ALL');
    });
    // None of these should match real topics, resulting in safe empty array
    assert.ok(Array.isArray(res), `Payload "${payload}" should safely return array`);
    assert.equal(res.length, 0, `Payload "${payload}" unexpectedly matched ${res.length} topics`);
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.3: SQL Injection & Command Tokens', () => {
  const sqliTokens = [
    "' OR '1'='1",
    "1; DROP TABLE topics; --",
    "' UNION SELECT 1, null, 'leak', 4, 5 --",
    "admin' --",
    "' OR 1=1 #",
    "1' ORDER BY 1--+",
    "' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT (SELECT CONCAT(0x7e,0x27,0x7e))), FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) a) --",
    "benchmark(50000000,MD5(1))",
    "pg_sleep(5)",
    "WAITFOR DELAY '0:0:5'",
  ];

  for (const sql of sqliTokens) {
    let res: TopicLibraryItem[] = [];
    assert.doesNotThrow(() => {
      res = simulateDashboardFilter(allTopicLibraryItems, sql, 'ALL');
    });
    assert.ok(Array.isArray(res));
    assert.equal(res.length, 0, `SQL injection token "${sql}" matched non-zero topics`);
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.4: Extreme Whitespace, Non-Printable & Control Characters', () => {
  // Standard whitespace characters (spaces, tabs, newlines, non-breaking spaces) must trim cleanly to empty string and return all 229 topics
  const standardSpaces = [
    '   ',
    '\t\t\t\t\t',
    '\n\r\n\r',
    '   \t   \n   \r  ',
    '\u00A0', // Non-breaking space
  ];

  for (const space of standardSpaces) {
    const res = simulateDashboardFilter(allTopicLibraryItems, space, 'ALL');
    assert.equal(res.length, 229, `Standard whitespace query should trim and return all 229 topics`);
  }

  // Non-printable control characters & zero-width characters (null byte, bell, escape, delete, zero-width spaces)
  // They should not throw and should safely return 0 results since no topic contains them
  const nonPrintableControlChars = [
    '\u0000', // NULL byte
    '\u0007', // Bell
    '\u0008', // Backspace
    '\u001B', // Escape
    '\u007F', // Delete
    '\u200B\u200C\u200D\uFEFF', // Zero-width spaces & joiners
  ];

  for (const controlChar of nonPrintableControlChars) {
    assert.doesNotThrow(() => {
      const res = simulateDashboardFilter(allTopicLibraryItems, controlChar, 'ALL');
      assert.equal(res.length, 0, `Control character query should return 0 results safely without crashing`);
    });
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.5: Massive String Payloads (Buffer / Hang Resistance)', () => {
  const lengths = [1_000, 10_000, 100_000];

  for (const len of lengths) {
    const hugeQuery = 'A'.repeat(len);
    const start = performance.now();
    const res = simulateDashboardFilter(allTopicLibraryItems, hugeQuery, 'ALL');
    const elapsed = performance.now() - start;

    assert.equal(res.length, 0, `Huge query of length ${len} must return 0 results`);
    assert.ok(elapsed < 50, `Huge query length ${len} took ${elapsed.toFixed(2)}ms (must be <50ms)`);
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.6: Unicode Normalization & Diacritic Fuzzing', () => {
  // Test Vietnamese searches in NFC and NFD
  const searchPairs = [
    { query: 'thuốc', expectedMin: 1 },
    { query: 'bác sĩ', expectedMin: 1 },
    { query: 'nhà hàng', expectedMin: 1 },
    { query: 'công việc', expectedMin: 1 },
    { query: 'cà phê', expectedMin: 1 },
  ];

  for (const pair of searchPairs) {
    // NFC Form
    const nfcQuery = pair.query.normalize('NFC');
    const nfcRes = simulateDashboardFilter(allTopicLibraryItems, nfcQuery, 'ALL');
    assert.ok(nfcRes.length >= pair.expectedMin, `NFC query "${nfcQuery}" should match at least ${pair.expectedMin} items`);

    // NFD Form (Decomposed accents)
    const nfdQuery = pair.query.normalize('NFD');
    const nfdRes = simulateDashboardFilter(allTopicLibraryItems, nfdQuery, 'ALL');
    assert.ok(Array.isArray(nfdRes), 'NFD search must return valid array without throwing');
  }

  // Emoji queries
  const emojiQueries = ['🎙️', '☕', '🏥', '✈️', '💼', '🍔'];
  for (const emo of emojiQueries) {
    assert.doesNotThrow(() => {
      const res = simulateDashboardFilter(allTopicLibraryItems, emo, 'ALL');
      assert.ok(Array.isArray(res));
    });
  }
});

runner.test('Suite A: Malicious Search Queries', 'A.7: Null, Undefined & Falsy Input Boundary', () => {
  // @ts-expect-error Testing adversarial runtime inputs
  const nullRes = simulateDashboardFilter(allTopicLibraryItems, null, 'ALL');
  assert.equal(nullRes.length, 229, 'Null search query must return all 229 topics');

  // @ts-expect-error Testing adversarial runtime inputs
  const undefRes = simulateDashboardFilter(allTopicLibraryItems, undefined, 'ALL');
  assert.equal(undefRes.length, 229, 'Undefined search query must return all 229 topics');

  // Empty string
  const emptyRes = simulateDashboardFilter(allTopicLibraryItems, '', 'ALL');
  assert.equal(emptyRes.length, 229, 'Empty string search query must return all 229 topics');
});

runner.test('Suite A: Malicious Search Queries', 'A.8: Prototype Pollution & Object Property Injection Tokens', () => {
  const prototypeTokens = [
    '__proto__',
    'constructor',
    'prototype',
    'valueOf',
    'toString',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
  ];

  for (const token of prototypeTokens) {
    assert.doesNotThrow(() => {
      const res = simulateDashboardFilter(allTopicLibraryItems, token, 'ALL');
      assert.ok(Array.isArray(res), `Query with prototype token "${token}" must return array`);
      const partitioned = simulateDashboardPartition(res);
      assert.ok(typeof partitioned === 'object' && partitioned !== null);
      assert.ok(Array.isArray(partitioned.describing));
      assert.ok(Array.isArray(partitioned.daily_situations));
      assert.ok(Array.isArray(partitioned.social));
      assert.ok(Array.isArray(partitioned.workplace_extended));
    }, `Prototype property query "${token}" must not cause prototype pollution or runtime crash`);
  }
});

// ============================================================================
// SUITE B: CATEGORY DISTRIBUTION & ORPHAN INVARIANTS
// ============================================================================

runner.test('Suite B: Category Distribution & Orphans', 'B.1: Exact Total Catalog Scale (229 topics)', () => {
  assert.equal(allTopicLibraryItems.length, 229, 'Catalog must contain exactly 229 topics');
});

runner.test('Suite B: Category Distribution & Orphans', 'B.2: 4-Category Partition Distribution Invariant', () => {
  const partitioned = simulateDashboardPartition(allTopicLibraryItems);

  const expectedCounts: Record<TopicLibraryCategory, number> = {
    describing: 10,
    daily_situations: 103,
    social: 68,
    workplace_extended: 48,
  };

  let totalPartitioned = 0;
  for (const [catKey, expectedCount] of Object.entries(expectedCounts)) {
    const actual = partitioned[catKey as TopicLibraryCategory];
    assert.ok(actual !== undefined, `Category "${catKey}" must exist in partitioned map`);
    assert.equal(
      actual.length,
      expectedCount,
      `Category "${catKey}" count mismatch: got ${actual.length}, expected ${expectedCount}`
    );
    totalPartitioned += actual.length;
  }

  assert.equal(totalPartitioned, 229, 'Sum of partitioned topics must exactly equal 229');
});

runner.test('Suite B: Category Distribution & Orphans', 'B.3: Zero Orphaned or Misclassified Topics', () => {
  const validCategories = new Set(PRIMARY_CATEGORIES);
  const orphans: TopicLibraryItem[] = [];

  for (const item of allTopicLibraryItems) {
    if (!validCategories.has(item.category)) {
      orphans.push(item);
    }
  }

  assert.equal(orphans.length, 0, `Found ${orphans.length} orphaned topic(s) with invalid category: ${orphans.map((o) => o.id).join(', ')}`);
});

runner.test('Suite B: Category Distribution & Orphans', 'B.4: Primary Key ID Uniqueness Invariant', () => {
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const item of allTopicLibraryItems) {
    if (seenIds.has(item.id)) {
      duplicateIds.push(item.id);
    }
    seenIds.add(item.id);
  }

  assert.equal(
    duplicateIds.length,
    0,
    `Found duplicate topic ID(s): ${duplicateIds.join(', ')}`
  );
  assert.equal(seenIds.size, 229, 'Total unique topic IDs must be exactly 229');
});

runner.test('Suite B: Category Distribution & Orphans', 'B.5: Vocabulary & Text Field Type Safety (Zero Null Pointers)', () => {
  for (const item of allTopicLibraryItems) {
    assert.ok(typeof item.id === 'string' && item.id.length > 0, `Topic ${item.id} has invalid id`);
    assert.ok(typeof item.titleEn === 'string' && item.titleEn.length > 0, `Topic ${item.id} has missing titleEn`);
    assert.ok(typeof item.titleVi === 'string' && item.titleVi.length > 0, `Topic ${item.id} has missing titleVi`);
    assert.ok(typeof item.subcategory === 'string' && item.subcategory.length > 0, `Topic ${item.id} has missing subcategory`);

    // Verify keyVocabulary is an array and does not contain null terms that would crash search .toLowerCase()
    if (item.keyVocabulary) {
      assert.ok(Array.isArray(item.keyVocabulary), `Topic ${item.id} keyVocabulary must be array`);
      for (const [idx, v] of item.keyVocabulary.entries()) {
        assert.ok(
          typeof v.term === 'string' && v.term.length > 0,
          `Topic ${item.id} vocab item at ${idx} has invalid term: ${JSON.stringify(v)}`
        );
        assert.ok(
          typeof v.meaningVi === 'string' && v.meaningVi.length > 0,
          `Topic ${item.id} vocab item at ${idx} has invalid meaningVi: ${JSON.stringify(v)}`
        );
      }
    }
  }
});

runner.test('Suite B: Category Distribution & Orphans', 'B.6: Topic ID URL-Safety and Path Traversal Immunity', () => {
  for (const item of allTopicLibraryItems) {
    assert.equal(
      encodeURIComponent(item.id),
      item.id,
      `Topic ID "${item.id}" contains URL-unsafe characters`
    );
    assert.ok(!item.id.includes('/'), `Topic ID "${item.id}" must not contain forward slashes`);
    assert.ok(!item.id.includes('\\'), `Topic ID "${item.id}" must not contain backslashes`);
    assert.ok(!item.id.includes('..'), `Topic ID "${item.id}" must not contain path traversal sequences`);
    assert.ok(!item.id.includes('?'), `Topic ID "${item.id}" must not contain query parameters`);
    assert.ok(!item.id.includes('#'), `Topic ID "${item.id}" must not contain fragments`);
  }
});

runner.test('Suite B: Category Distribution & Orphans', 'B.7: CEFR Level Strict Domain Invariant (A1, A2, B1, B2)', () => {
  const allowedLevels: Set<TopicLibraryCefrLevel> = new Set(['A1', 'A2', 'B1', 'B2']);
  for (const item of allTopicLibraryItems) {
    assert.ok(
      allowedLevels.has(item.level),
      `Topic ${item.id} has illegal CEFR level "${item.level}"`
    );
  }
});

runner.test('Suite B: Category Distribution & Orphans', 'B.8: Subcategory Slug Consistency & Hygiene', () => {
  for (const item of allTopicLibraryItems) {
    assert.ok(
      typeof item.subcategory === 'string' && item.subcategory.length > 0,
      `Topic ${item.id} missing subcategory slug`
    );
    // Subcategory should be slugified (no spaces, all lowercase)
    assert.ok(
      !item.subcategory.includes(' '),
      `Topic ${item.id} subcategory slug "${item.subcategory}" contains spaces`
    );
    assert.equal(
      item.subcategory,
      item.subcategory.toLowerCase(),
      `Topic ${item.id} subcategory slug "${item.subcategory}" is not lowercase`
    );
  }
});

// ============================================================================
// SUITE C: IMAGE RESOLUTION RESILIENCE & FALLBACK GUARANTEE
// ============================================================================

runner.test('Suite C: Image Resilience', 'C.1: 100% of Topic Cards Resolve to Valid HTTPS URLs', () => {
  let resolvedHttpsCount = 0;

  for (const item of allTopicLibraryItems) {
    const url = resolveTopicImageUrl(item);
    assert.ok(typeof url === 'string' && url.length > 0, `Topic ${item.id} failed to resolve image`);
    assert.ok(url.startsWith('https://'), `Topic ${item.id} image is not HTTPS: ${url}`);

    // Parse URL with standard URL parser
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      assert.fail(`Topic ${item.id} image URL is malformed: ${url}`);
    }

    assert.equal(parsedUrl.protocol, 'https:');
    assert.ok(parsedUrl.hostname.length > 0);
    resolvedHttpsCount++;
  }

  assert.equal(resolvedHttpsCount, 229, 'All 229 topics must resolve to valid HTTPS image URLs');
});

runner.test('Suite C: Image Resilience', 'C.2: Image Host Domain Security Whitelist', () => {
  const allowedHosts = ['images.unsplash.com', 'unsplash.com', 'images.pexels.com', 'pexels.com'];

  for (const item of allTopicLibraryItems) {
    const url = resolveTopicImageUrl(item);
    const parsed = new URL(url);
    const isAllowed = allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
    assert.ok(
      isAllowed,
      `Topic ${item.id} image host "${parsed.hostname}" is not in approved whitelist: ${url}`
    );
  }
});

runner.test('Suite C: Image Resilience', 'C.3: Cascade Fallback Degradation Matrix', () => {
  // Scenario 1: Topic with valid top-level imageUrl
  const topicWithTopLevelImg: TopicLibraryItem = {
    id: 'test-1',
    category: 'daily_situations',
    subcategory: 'test',
    level: 'A1',
    titleEn: 'Test 1',
    titleVi: 'Thử nghiệm 1',
    icon: '🧪',
    situationVi: 'Tình huống',
    sampleDialogue: [],
    keyVocabulary: [{ term: 'foo', ipa: '/fu:/', partOfSpeech: 'noun', meaningVi: 'nghĩa', exampleEn: '', exampleVi: '', imageUrl: 'https://images.unsplash.com/vocab-img' }],
    usefulPhrases: [],
    aiTutorPrompt: '',
    imageUrl: 'https://images.unsplash.com/top-level-img',
  };
  assert.equal(resolveTopicImageUrl(topicWithTopLevelImg), 'https://images.unsplash.com/top-level-img');

  // Scenario 2: Topic without top-level imageUrl, but has vocab imageUrl
  const topicWithVocabImg: TopicLibraryItem = {
    ...topicWithTopLevelImg,
    id: 'test-2',
    imageUrl: undefined,
  };
  assert.equal(resolveTopicImageUrl(topicWithVocabImg), 'https://images.unsplash.com/vocab-img');

  // Scenario 3: Topic without top-level imageUrl, and vocab has no imageUrl
  const topicNoVocabImg: TopicLibraryItem = {
    ...topicWithTopLevelImg,
    id: 'test-3',
    imageUrl: undefined,
    keyVocabulary: [{ term: 'foo', ipa: '/fu:/', partOfSpeech: 'noun', meaningVi: 'nghĩa', exampleEn: '', exampleVi: '' }],
  };
  assert.equal(resolveTopicImageUrl(topicNoVocabImg), FALLBACK_IMAGE_URL);

  // Scenario 4: Topic with empty keyVocabulary
  const topicEmptyVocab: TopicLibraryItem = {
    ...topicWithTopLevelImg,
    id: 'test-4',
    imageUrl: undefined,
    keyVocabulary: [],
  };
  assert.equal(resolveTopicImageUrl(topicEmptyVocab), FALLBACK_IMAGE_URL);

  // Scenario 5: Topic with undefined keyVocabulary
  const topicUndefinedVocab: TopicLibraryItem = {
    ...topicWithTopLevelImg,
    id: 'test-5',
    imageUrl: undefined,
    // @ts-expect-error testing missing vocab
    keyVocabulary: undefined,
  };
  assert.equal(resolveTopicImageUrl(topicUndefinedVocab), FALLBACK_IMAGE_URL);
});

// ============================================================================
// SUITE D: PERFORMANCE & CONCURRENCY BENCHMARKS
// ============================================================================

runner.test('Suite D: Performance Benchmarks', 'D.1: Cold Partitioning Speed (< 10ms for full catalog)', () => {
  const start = performance.now();
  const partitioned = simulateDashboardPartition(allTopicLibraryItems);
  const elapsed = performance.now() - start;

  assert.equal(partitioned.describing.length, 10);
  assert.ok(elapsed < 10, `Cold partitioning took ${elapsed.toFixed(3)}ms (must be <10ms)`);
});

runner.test('Suite D: Performance Benchmarks', 'D.2: Filter & Partition Pipeline Latency (< 10ms per operation)', () => {
  const testQueries = [
    { q: '', level: 'ALL' as const },
    { q: 'coffee', level: 'ALL' as const },
    { q: 'meeting', level: 'B1' as const },
    { q: 'hotel', level: 'A2' as const },
    { q: 'bác sĩ', level: 'ALL' as const },
    { q: 'interview', level: 'B2' as const },
    { q: 'xyz_nonexistent_query_12345', level: 'ALL' as const },
  ];

  for (const { q, level } of testQueries) {
    const start = performance.now();
    const filtered = simulateDashboardFilter(allTopicLibraryItems, q, level);
    const partitioned = simulateDashboardPartition(filtered);
    const elapsed = performance.now() - start;

    assert.ok(
      elapsed < 10,
      `Filter & partition for query "${q}" [${level}] took ${elapsed.toFixed(3)}ms (must be <10ms)`
    );
    assert.ok(Array.isArray(partitioned.describing));
  }
});

runner.test('Suite D: Performance Benchmarks', 'D.3: Stress Throughput: 1,000 Consecutive Filter Operations (< 1,500ms total)', () => {
  const dictionary = ['coffee', 'hotel', 'doctor', 'meeting', 'office', 'friend', 'order', 'weather', 'travel', 'food'];
  const levels: Array<'ALL' | TopicLibraryCefrLevel> = ['ALL', 'A1', 'A2', 'B1', 'B2'];

  const ITERATIONS = 1000;
  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i++) {
    const word = dictionary[i % dictionary.length];
    const lvl = levels[i % levels.length];
    const filtered = simulateDashboardFilter(allTopicLibraryItems, word, lvl);
    const partitioned = simulateDashboardPartition(filtered);
    assert.ok(partitioned !== null);
  }

  const totalTime = performance.now() - start;
  const avgTimePerOp = totalTime / ITERATIONS;

  console.log(`      ⚡ 1,000 operations completed in ${totalTime.toFixed(2)}ms (avg: ${avgTimePerOp.toFixed(4)}ms/op)`);
  assert.ok(totalTime < 1500, `1,000 filter operations took ${totalTime.toFixed(2)}ms (must be <1,500ms)`);
  assert.ok(avgTimePerOp < 10, `Average per-operation latency ${avgTimePerOp.toFixed(4)}ms must be <10ms`);
});

runner.test('Suite D: Performance Benchmarks', 'D.4: Memory Stability & Allocation Under Heavy Filtering (5,000 passes)', () => {
  const heapBefore = process.memoryUsage().heapUsed;
  const ITERATIONS = 5000;
  const queries = ['coffee', 'pharmacy', 'meeting', 'interview', 'doctor', 'airport', 'supermarket', 'bus'];

  for (let i = 0; i < ITERATIONS; i++) {
    const q = queries[i % queries.length];
    const filtered = simulateDashboardFilter(allTopicLibraryItems, q, 'ALL');
    const grouped = simulateDashboardPartition(filtered);
    assert.ok(grouped.describing.length >= 0);
  }

  const heapAfter = process.memoryUsage().heapUsed;
  const heapDiffMb = (heapAfter - heapBefore) / (1024 * 1024);
  console.log(`      ⚡ Heap delta after 5,000 filtering passes: ${heapDiffMb.toFixed(2)} MB`);
  assert.ok(heapDiffMb < 50, `Heap grew abnormally: ${heapDiffMb.toFixed(2)} MB`);
});

// Run the runner
runner.run().then((success) => {
  if (!success) {
    process.exit(1);
  }
});
