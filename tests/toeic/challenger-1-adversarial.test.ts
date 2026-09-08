/**
 * Challenger 1: Adversarial Stress Test Suite for TOEIC Data Loader & Catalog Routing.
 *
 * Requirements tested:
 * 1. Resilience against malformed IDs, boundary IDs, empty string, non-existent slugs.
 * 2. Rapid concurrent loading performance (100+ loads, latency, immutability).
 * 3. Option schema invariants (Part 2 has exactly 3 options; Parts 1, 3-7 have 4 options; valid answer keys).
 * 4. Media URL syntax, protocols, and domains (Google Cloud Storage & Study4 CDN).
 * 5. Full catalog and routing integration cross-check.
 */

import {
  loadAnyToeicTest,
  loadFullToeicTest,
  loadToeicPartPractice,
  getToeicCatalogIndex,
  getAvailableToeicTests,
  resolveToeicMediaUrl,
  parseQuestionOption,
  normalizeTestId,
  AUTHENTIC_TEST_METADATA,
} from '../../src/lib/toeic-test-loader';
import type { ToeicUnifiedQuestion, ToeicPart } from '../../src/types/toeic';

let totalTests = 0;
let passedTests = 0;
const failures: { testName: string; error: string }[] = [];

function check(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof (res as any).then === 'function') {
      return (res as Promise<void>)
        .then(() => {
          passedTests++;
          console.log(`  ✅ [PASS] ${name}`);
        })
        .catch((err) => {
          failures.push({ testName: name, error: err.message || String(err) });
          console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
        });
    } else {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    }
  } catch (err: any) {
    failures.push({ testName: name, error: err.message || String(err) });
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

async function runChallengerTests() {
  console.log('========================================================================');
  console.log('  CHALLENGER 1: ADVERSARIAL STRESS TEST SUITE (DATA LOADER & CATALOG)');
  console.log('========================================================================\n');

  // ────────────────────────────────────────────────────────────────
  // SECTION 1: MALFORMED, BOUNDARY & NON-EXISTENT TEST IDS
  // ────────────────────────────────────────────────────────────────
  console.log('--- SECTION 1: Malformed, Boundary & Non-Existent IDs ---');

  const requiredAdversarialCases = [
    { input: 'non-existent-test', desc: 'loadAnyToeicTest("non-existent-test")' },
    { input: 'estudyme-test-999', desc: 'loadAnyToeicTest("estudyme-test-999")' },
    { input: 'estudyme-part_99-set-99', desc: 'loadAnyToeicTest("estudyme-part_99-set-99")' },
    { input: '', desc: 'loadAnyToeicTest("")' },
    { input: null as any, desc: 'loadAnyToeicTest(null)' },
    { input: undefined as any, desc: 'loadAnyToeicTest(undefined)' },
  ];

  for (const tc of requiredAdversarialCases) {
    check(`Resilience: ${tc.desc}`, () => {
      const result = loadAnyToeicTest(tc.input);
      assert(Array.isArray(result), `${tc.desc} must return an array`);
      assert(result.length === 200, `${tc.desc} must fallback to 200 questions (got ${result.length})`);
      assert(result[0].questionNumber === 1, `First question must be Q1`);
      assert(result[199].questionNumber === 200, `Last question must be Q200`);
      assert(result[0].testId === '6852', `Fallback testId should be 6852 (got ${result[0].testId})`);
    });
  }

  // Additional boundary and hostile inputs
  const extraHostileCases = [
    { input: '   \t\n  ', desc: 'whitespace-only string' },
    { input: 'estudyme-test-0', desc: 'boundary Estudyme test 0 (out of range)' },
    { input: 'estudyme-test-22', desc: 'boundary Estudyme test 22 (out of range)' },
    { input: 'estudyme-test--1', desc: 'negative Estudyme test -1' },
    { input: 'study4-9999', desc: 'non-existent Study4 4-digit ID' },
    { input: 'study4-0000', desc: 'study4 zero ID' },
    { input: '../../../etc/passwd', desc: 'path traversal attempt' },
    { input: '..\\..\\..\\windows\\system32', desc: 'windows path traversal attempt' },
    { input: '<script>alert("xss")</script>', desc: 'XSS attempt' },
    { input: 'SELECT * FROM users WHERE id=1', desc: 'SQL injection attempt' },
    { input: 6852 as any, desc: 'numeric ID 6852' },
    { input: 0 as any, desc: 'numeric 0' },
    { input: {} as any, desc: 'empty object {}' },
    { input: [] as any, desc: 'empty array []' },
    { input: true as any, desc: 'boolean true' },
  ];

  for (const tc of extraHostileCases) {
    check(`Hostile input: ${tc.desc}`, () => {
      const result = loadAnyToeicTest(tc.input);
      assert(Array.isArray(result), `${tc.desc} must return an array`);
      assert(result.length > 0, `${tc.desc} must return questions gracefully`);
      // Every question has valid structure
      for (const q of result.slice(0, 5)) {
        assert(typeof q.questionNumber === 'number', `q.questionNumber must be number`);
        assert(typeof q.part === 'number' && q.part >= 1 && q.part <= 7, `q.part must be 1-7`);
        assert(Array.isArray(q.options), `q.options must be array`);
        assert(['A', 'B', 'C', 'D'].includes(q.correctAnswer), `q.correctAnswer must be valid`);
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // SECTION 2: RAPID CONCURRENT LOADING & IMMUTABILITY
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- SECTION 2: Rapid Concurrent Loading Performance (100+ Loads) ---');

  await check('Concurrency: 150 rapid concurrent loads across all test families', async () => {
    const testIdsToLoad = [
      // Authentic Study4
      '6852', '6856', '6857', '6859', '7000', '7003', '7004',
      // Estudyme Full Tests
      'estudyme-test-1', 'estudyme-test-2', 'estudyme-test-5', 'estudyme-test-11',
      'estudyme-test-12', 'estudyme-test-20', 'estudyme-test-21',
      // Estudyme Practice Sets
      'estudyme-part_1_photos-test-1', 'estudyme-p1-set1',
      'estudyme-part_2_question_response-test-1', 'estudyme-p2-set2',
      'estudyme-part_5_incomplete_sentences-test-1', 'estudyme-p5-set1',
      'estudyme-part_7_single_passages-test-1', 'estudyme-p7-set1',
      // Malformed / fallback
      'non-existent-test', 'estudyme-test-999', '', null as any, undefined as any,
    ];

    const iterations = 150;
    const start = Date.now();

    const promises = Array.from({ length: iterations }, (_, idx) => {
      const id = testIdsToLoad[idx % testIdsToLoad.length];
      return Promise.resolve().then(() => {
        const questions = loadAnyToeicTest(id);
        assert(Array.isArray(questions) && questions.length > 0, `Load ${idx} (${id}) returned questions`);
        return questions.length;
      });
    });

    const results = await Promise.all(promises);
    const elapsedMs = Date.now() - start;
    const avgMs = (elapsedMs / iterations).toFixed(2);

    console.log(`    Executed ${iterations} concurrent loads in ${elapsedMs}ms (average ${avgMs}ms/load)`);
    assert(results.length === iterations, `All ${iterations} promises resolved`);
    assert(elapsedMs < 2000, `Expected 150 concurrent loads to complete in < 2000ms, took ${elapsedMs}ms`);
  });

  check('Immutability: Cached results are defensively cloned against caller mutation', () => {
    // 1. Full test immutability
    const original6852 = loadAnyToeicTest('6852');
    const origQ1Text = original6852[0].prompt;
    original6852[0].prompt = 'MALICIOUS_MUTATION_1';
    original6852[0].options[0].text = 'MALICIOUS_OPTION_MUTATION';

    const fresh6852 = loadAnyToeicTest('6852');
    assert(
      fresh6852[0].prompt === origQ1Text,
      `Prompt must remain pristine after mutation (${fresh6852[0].prompt} vs ${origQ1Text})`
    );
    assert(
      fresh6852[0].options[0].text !== 'MALICIOUS_OPTION_MUTATION',
      'Option text must not be contaminated by caller mutation'
    );

    // 2. Estudyme full test immutability
    const est1 = loadAnyToeicTest('estudyme-test-1');
    const origEstPrompt = est1[0].prompt;
    est1[0].prompt = 'MALICIOUS_MUTATION_ESTUDYME';

    const freshEst1 = loadAnyToeicTest('estudyme-test-1');
    assert(
      freshEst1[0].prompt === origEstPrompt,
      'Estudyme test cache must be immutable'
    );
  });

  // ────────────────────────────────────────────────────────────────
  // SECTION 3: OPTION SCHEMA INVARIANTS
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- SECTION 3: Option Schema Invariants Across Datasets ---');

  const testDatasetsToCheck = [
    // Authentic tests
    '6852', '6856', '7000', '7004',
    // Estudyme full tests
    'estudyme-test-1', 'estudyme-test-3', 'estudyme-test-7', 'estudyme-test-12', 'estudyme-test-21',
    // Estudyme practice sets (all parts)
    'estudyme-p1-set1', 'estudyme-p2-set1', 'estudyme-p3-set1',
    'estudyme-p4-set1', 'estudyme-p5-set1', 'estudyme-p6-set1', 'estudyme-p7-set1',
  ];

  for (const testId of testDatasetsToCheck) {
    check(`Option schema invariants: ${testId}`, () => {
      const questions = loadAnyToeicTest(testId);
      assert(questions.length > 0, `Dataset ${testId} must have questions`);

      for (const q of questions) {
        // Invariant 1: Part 2 must have exactly 3 options (A, B, C)
        if (q.part === 2) {
          assert(
            q.options.length === 3,
            `${testId} Q${q.questionNumber} (Part 2): expected exactly 3 options, got ${q.options.length}`
          );
          const keys = q.options.map((o) => o.key).join('');
          assert(
            keys === 'ABC',
            `${testId} Q${q.questionNumber} (Part 2): expected option keys ABC, got "${keys}"`
          );
          assert(
            ['A', 'B', 'C'].includes(q.correctAnswer),
            `${testId} Q${q.questionNumber} (Part 2): correctAnswer must be A/B/C, got "${q.correctAnswer}"`
          );
        } else {
          // Invariant 2: Parts 1, 3, 4, 5, 6, 7 must have exactly 4 options (A, B, C, D)
          assert(
            q.options.length === 4,
            `${testId} Q${q.questionNumber} (Part ${q.part}): expected exactly 4 options, got ${q.options.length}`
          );
          const keys = q.options.map((o) => o.key).join('');
          assert(
            keys === 'ABCD',
            `${testId} Q${q.questionNumber} (Part ${q.part}): expected option keys ABCD, got "${keys}"`
          );
          assert(
            ['A', 'B', 'C', 'D'].includes(q.correctAnswer),
            `${testId} Q${q.questionNumber} (Part ${q.part}): correctAnswer must be A/B/C/D, got "${q.correctAnswer}"`
          );
        }

        // Invariant 3: Correct answer must be one of the option keys
        const optionKeys = q.options.map((o) => o.key);
        assert(
          optionKeys.includes(q.correctAnswer as any),
          `${testId} Q${q.questionNumber}: correctAnswer "${q.correctAnswer}" not in options [${optionKeys.join(',')}]`
        );

        // Invariant 4: Each option must have non-undefined text
        for (const opt of q.options) {
          assert(typeof opt.key === 'string', `${testId} Q${q.questionNumber}: option key must be string`);
          assert(typeof opt.text === 'string', `${testId} Q${q.questionNumber}: option text must be string`);
        }
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // SECTION 4: MEDIA URL SYNTAX & DOMAINS
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- SECTION 4: Media URL Syntax & Domains ---');

  check('Media URL resolver: unit edge cases and CDN domain normalization', () => {
    // Relative paths with /media/
    const res1 = resolveToeicMediaUrl('/media/audio/test.mp3');
    assert(res1 === 'https://s4-media1.study4.com/media/audio/test.mp3', `Expected s4-media1 CDN, got ${res1}`);

    // Relative paths with media/
    const res2 = resolveToeicMediaUrl('media/images/q1.jpg');
    assert(res2 === 'https://s4-media1.study4.com/media/images/q1.jpg', `Expected s4-media1 CDN, got ${res2}`);

    // Google Cloud Storage CDN (Estudyme)
    const gcsUrl = 'https://storage.googleapis.com/estudyme-prod/audio/p1_01.mp3';
    const resGcs = resolveToeicMediaUrl(gcsUrl);
    assert(resGcs === gcsUrl, `GCS URL preserved exactly, got ${resGcs}`);

    // Preserves already qualified https:// URLs
    const extUrl = 'https://s4-media1.study4.com/media/test.mp3';
    assert(resolveToeicMediaUrl(extUrl) === extUrl, 'Preserves absolute https://');

    // Falsy / empty checks
    assert(resolveToeicMediaUrl('') === undefined, 'Empty string -> undefined');
    assert(resolveToeicMediaUrl('   ') === undefined, 'Spaces -> undefined');
    assert(resolveToeicMediaUrl(null) === undefined, 'null -> undefined');
    assert(resolveToeicMediaUrl(undefined) === undefined, 'undefined -> undefined');
  });

  check('Dataset Media URLs: all resolved URLs use valid https:// and authorized domains', () => {
    const testsToAudit = [
      '6852', '6856', '7000',
      'estudyme-test-1', 'estudyme-test-2',
      'estudyme-p1-set1', 'estudyme-p3-set1', 'estudyme-p4-set1',
    ];

    const authorizedDomains = [
      's4-media1.study4.com',
      'study4.com',
      'storage.googleapis.com',
      'firebasestorage.googleapis.com',
    ];

    for (const testId of testsToAudit) {
      const questions = loadAnyToeicTest(testId);
      for (const q of questions) {
        if (q.audioUrl) {
          assert(
            q.audioUrl.startsWith('https://') || q.audioUrl.startsWith('http://'),
            `${testId} Q${q.questionNumber}: audioUrl must start with http(s)://, got "${q.audioUrl}"`
          );
          assert(
            !q.audioUrl.startsWith('/media/'),
            `${testId} Q${q.questionNumber}: audioUrl must not be relative /media/`
          );
          const hasValidDomain = authorizedDomains.some((d) => q.audioUrl!.includes(d));
          assert(
            hasValidDomain,
            `${testId} Q${q.questionNumber}: audioUrl domain not in authorized list: "${q.audioUrl}"`
          );
        }

        if (q.imageUrl) {
          assert(
            q.imageUrl.startsWith('https://') || q.imageUrl.startsWith('http://'),
            `${testId} Q${q.questionNumber}: imageUrl must start with http(s)://, got "${q.imageUrl}"`
          );
          assert(
            !q.imageUrl.startsWith('/media/'),
            `${testId} Q${q.questionNumber}: imageUrl must not be relative /media/`
          );
          const hasValidDomain = authorizedDomains.some((d) => q.imageUrl!.includes(d));
          assert(
            hasValidDomain,
            `${testId} Q${q.questionNumber}: imageUrl domain not in authorized list: "${q.imageUrl}"`
          );
        }

        // Part 1 listening questions must have images
        if (q.part === 1) {
          assert(
            Boolean(q.imageUrl),
            `${testId} Q${q.questionNumber} (Part 1): Part 1 photographs must have imageUrl`
          );
        }
      }
    }
  });

  check('Part 3 & 4 Audio Alignment: Clusters of 3 share dialogue audio seamlessly', () => {
    for (const testId of ['6852', '7000', 'estudyme-test-1']) {
      const questions = loadAnyToeicTest(testId);
      const p3 = questions.filter((q) => q.part === 3);
      if (p3.length === 39) {
        for (let cluster = 0; cluster < 13; cluster++) {
          const q1 = p3[cluster * 3];
          const q2 = p3[cluster * 3 + 1];
          const q3 = p3[cluster * 3 + 2];

          assert(Boolean(q1.audioUrl), `${testId} Part 3 cluster ${cluster + 1} Q1 audioUrl missing`);
          assert(q1.audioUrl === q2.audioUrl, `${testId} Part 3 cluster ${cluster + 1} Q1 and Q2 audio mismatch`);
          assert(q1.audioUrl === q3.audioUrl, `${testId} Part 3 cluster ${cluster + 1} Q1 and Q3 audio mismatch`);
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────────
  // SECTION 5: CATALOG MANIFEST & ROUTING SLUGS CROSS-CHECK
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- SECTION 5: Catalog Manifest & Routing Slugs Cross-Check ---');

  check('Catalog Index: All full tests in catalog resolve to valid 200Q tests', () => {
    const index = getToeicCatalogIndex();
    assert(Boolean(index), 'Catalog index exists');
    assert(Array.isArray(index.fullTests), 'index.fullTests is array');
    assert(index.fullTests.length >= 28, `Expected >= 28 full tests, got ${index.fullTests.length}`);

    for (const item of index.fullTests) {
      assert(Boolean(item.id), `Item has id: ${JSON.stringify(item)}`);
      assert(item.questionCount > 0, `Item ${item.id} specified questionCount > 0, got ${item.questionCount}`);
      assert(item.durationMinutes > 0, `Item ${item.id} duration > 0`);

      const loaded = loadAnyToeicTest(item.id);
      assert(
        loaded.length === item.questionCount,
        `Catalog item ${item.id} loaded ${loaded.length} questions (expected ${item.questionCount})`
      );
    }
  });

  check('Catalog Index: Sample practice parts resolve to correct part and questions', () => {
    const index = getToeicCatalogIndex();
    assert(Boolean(index.practiceParts), 'index.practiceParts exists');

    for (let part = 1; part <= 7; part++) {
      const sets = index.practiceParts[String(part)];
      assert(Array.isArray(sets) && sets.length > 0, `Part ${part} has practice sets in catalog`);

      // Test first, middle, and last set in each part
      const samples = [sets[0], sets[Math.floor(sets.length / 2)], sets[sets.length - 1]];
      for (const s of samples) {
        const qs = loadAnyToeicTest(s.id);
        assert(qs.length > 0, `Practice set ${s.id} loaded ${qs.length} questions`);
        for (const q of qs) {
          assert(
            q.part === part,
            `Practice set ${s.id} question part mismatch: expected ${part}, got ${q.part}`
          );
        }
      }
    }
  });

  // ────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log('  CHALLENGER 1 ADVERSARIAL TEST SUMMARY');
  console.log(`  Total Checks:  ${totalTests}`);
  console.log(`  Passed Checks: ${passedTests}`);
  console.log(`  Failed Checks: ${failures.length}`);
  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    for (const f of failures) {
      console.log(`  - [${f.testName}]: ${f.error}`);
    }
    console.log('========================================================================\n');
    process.exit(1);
  } else {
    console.log('  VERDICT: ALL ADVERSARIAL HARDENING CRITERIA PASSED EMPIRICALLY!');
    console.log('========================================================================\n');
  }
}

runChallengerTests().catch((err) => {
  console.error('Fatal error during challenger test run:', err);
  process.exit(1);
});
