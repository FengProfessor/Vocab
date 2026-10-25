/**
 * Empirical Verification & Stress Test Harness for Milestone M3.2
 * Backend API Cross-Classroom Routing & Caching (src/app/api/words/route.ts)
 */

import { createHash } from 'crypto';
import { cacheSet, cacheGet, invalidateServerWordSummaryCache } from '../src/lib/ttl-cache';
import { GET } from '../src/app/api/words/route';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✅ [PASS] ${suite} -> ${name}`);
  } else {
    results.push({ suite, name, passed: false, details });
    console.error(`  ❌ [FAIL] ${suite} -> ${name}: ${details || 'Assertion failed'}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: Cache Key Isolation & Invalidation
// ─────────────────────────────────────────────────────────────────────────────
async function runSuite1_CacheKeyIsolation() {
  console.log('\n=== SUITE 1: Cache Key Isolation & Invalidation ===');
  const userA = '00000000-0000-0000-0000-000000000001';
  const userB = '00000000-0000-0000-0000-000000000002';
  const classA1 = '11111111-1111-1111-1111-111111111111';
  const classA2 = '22222222-2222-2222-2222-222222222222';

  // Helper mimicking cacheKey generation in route.ts
  const getCacheKey = (userId: string, classroomId: string | null, includeLevels = false) =>
    `wsum:${userId}:${classroomId || 'all'}:${includeLevels ? 1 : 0}`;

  const keyAllLevels0 = getCacheKey(userA, null, false);
  const keyAllLevels1 = getCacheKey(userA, null, true);
  const keyClass1Levels0 = getCacheKey(userA, classA1, false);
  const keyClass2Levels0 = getCacheKey(userA, classA2, false);
  const keyUserBAll = getCacheKey(userB, null, false);

  assert(keyAllLevels0 === `wsum:${userA}:all:0`, 'Suite 1', 'Cache key format for cross-classroom (null classroomId)');
  assert(getCacheKey(userA, '', false) === `wsum:${userA}:all:0`, 'Suite 1', 'Cache key format for empty string classroomId');
  assert(keyClass1Levels0 === `wsum:${userA}:${classA1}:0`, 'Suite 1', 'Cache key format for explicit classroom UUID');
  assert(keyAllLevels0 !== keyClass1Levels0, 'Suite 1', 'Cache key "all" does not collide with classroom UUID key');

  // Populate cache
  const dataAll = { total: 100, dueCount: 15, newCount: 20, reviewDueCount: 10, levelCounts: [0, 0, 0, 0, 0, 0] };
  const dataClass1 = { total: 40, dueCount: 5, newCount: 10, reviewDueCount: 3, levelCounts: [0, 0, 0, 0, 0, 0] };
  const dataClass2 = { total: 60, dueCount: 10, newCount: 10, reviewDueCount: 7, levelCounts: [0, 0, 0, 0, 0, 0] };
  const dataUserB = { total: 50, dueCount: 2, newCount: 5, reviewDueCount: 1, levelCounts: [0, 0, 0, 0, 0, 0] };

  cacheSet(keyAllLevels0, dataAll, 60_000);
  cacheSet(keyAllLevels1, { ...dataAll, levelCounts: [10, 20, 30, 20, 10, 10] }, 60_000);
  cacheSet(keyClass1Levels0, dataClass1, 60_000);
  cacheSet(keyClass2Levels0, dataClass2, 60_000);
  cacheSet(keyUserBAll, dataUserB, 60_000);

  // Verify retrieval isolation
  const hitAll = cacheGet<typeof dataAll>(keyAllLevels0);
  const hitClass1 = cacheGet<typeof dataClass1>(keyClass1Levels0);
  const hitClass2 = cacheGet<typeof dataClass2>(keyClass2Levels0);
  const hitUserB = cacheGet<typeof dataUserB>(keyUserBAll);

  assert(hitAll?.total === 100 && hitAll?.dueCount === 15, 'Suite 1', 'Cross-classroom cache retrieval matches stored data');
  assert(hitClass1?.total === 40 && hitClass1?.dueCount === 5, 'Suite 1', 'Classroom 1 cache retrieval matches stored data');
  assert(hitClass2?.total === 60 && hitClass2?.dueCount === 10, 'Suite 1', 'Classroom 2 cache retrieval matches stored data');
  assert(hitUserB?.total === 50 && hitUserB?.dueCount === 2, 'Suite 1', 'User B cache retrieval matches stored data');

  // Verify Invalidation
  console.log('  Testing invalidateServerWordSummaryCache(userA)...');
  invalidateServerWordSummaryCache(userA);

  const invalidatedAll0 = cacheGet(keyAllLevels0);
  const invalidatedAll1 = cacheGet(keyAllLevels1);
  const invalidatedClass1 = cacheGet(keyClass1Levels0);
  const invalidatedClass2 = cacheGet(keyClass2Levels0);
  const userBRemains = cacheGet<typeof dataUserB>(keyUserBAll);

  assert(invalidatedAll0 === undefined, 'Suite 1', 'Invalidation clears userA cross-classroom (levels=0) cache');
  assert(invalidatedAll1 === undefined, 'Suite 1', 'Invalidation clears userA cross-classroom (levels=1) cache');
  assert(invalidatedClass1 === undefined, 'Suite 1', 'Invalidation clears userA classroom 1 cache');
  assert(invalidatedClass2 === undefined, 'Suite 1', 'Invalidation clears userA classroom 2 cache');
  assert(userBRemains?.total === 50, 'Suite 1', 'Invalidation of userA does NOT purge userB cache (Cross-user leak isolation)');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: Translation Artifact Filtering Logic & Stress Testing
// ─────────────────────────────────────────────────────────────────────────────
async function runSuite2_TranslationFiltering() {
  console.log('\n=== SUITE 2: Translation Artifact Filtering Logic ===');

  // The exact filter predicate from route.ts (lines 899-904, 1001-1006, 1059-1064)
  const isCleanWordFilter = (w: { word?: string | null; translation?: string | null }) =>
    Boolean(
      w.word &&
      w.translation &&
      w.translation.trim() !== '' &&
      !w.translation.includes('failed') &&
      !w.translation.includes('Analyzing') &&
      !w.translation.includes('⏳')
    );

  // New words fallback filter predicate from line 1134-1137
  const isCleanWordNewFallback = (w: { word?: string | null; translation?: string | null }) =>
    Boolean(
      w &&
      w.word &&
      w.translation &&
      !w.translation.includes('failed') &&
      !w.translation.includes('Analyzing') &&
      !w.translation.includes('⏳')
    );

  const testCases = [
    { input: { word: 'apple', translation: 'quả táo' }, expected: true, desc: 'Valid Vietnamese translation' },
    { input: { word: 'hello', translation: 'xin chào' }, expected: true, desc: 'Valid standard translation' },
    { input: { word: 'fast', translation: '⏳ Analyzing...' }, expected: false, desc: 'Rejects "⏳ Analyzing..."' },
    { input: { word: 'test', translation: 'Analyzing...' }, expected: false, desc: 'Rejects "Analyzing..."' },
    { input: { word: 'broken', translation: '❌ Analysis failed - click Retry' }, expected: false, desc: 'Rejects "❌ Analysis failed - click Retry"' },
    { input: { word: 'empty', translation: '' }, expected: false, desc: 'Rejects empty string translation' },
    { input: { word: 'spaces', translation: '     ' }, expected: false, desc: 'Rejects whitespace-only translation' },
    { input: { word: 'null_t', translation: null }, expected: false, desc: 'Rejects null translation' },
    { input: { word: 'hourglass', translation: 'hourglass ⏳' }, expected: false, desc: 'Rejects translation containing ⏳' },
    { input: { word: 'failed_mid', translation: 'lookup failed unexpectedly' }, expected: false, desc: 'Rejects translation containing "failed"' },
    { input: { word: '', translation: 'có từ' }, expected: false, desc: 'Rejects empty word' },
  ];

  for (const tc of testCases) {
    const passed = isCleanWordFilter(tc.input) === tc.expected;
    assert(passed, 'Suite 2 (Main Filter)', tc.desc, `Expected ${tc.expected} for ${JSON.stringify(tc.input)}`);
  }

  // Stress-test the difference in new words fallback (line 1134) with whitespace
  const whitespaceFallback = isCleanWordNewFallback({ word: 'spaces', translation: '   ' });
  console.log(`  ℹ️ [Observation] New words fallback (line 1134) on whitespace '   ': returns ${whitespaceFallback}`);
  assert(whitespaceFallback === true, 'Suite 2 (Edge Case)', 'Line 1134 lacks trim() check on whitespace-only translation');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: Full Route Execution & Parameter Passing via Mock Fetch
// ─────────────────────────────────────────────────────────────────────────────
interface CapturedRpcCall {
  fn: string;
  params: Record<string, unknown>;
}

async function runSuite3_RouteExecutionAndRpcPassing() {
  console.log('\n=== SUITE 3: Full Route Execution & RPC Parameter Passing ===');

  const capturedRpcs: CapturedRpcCall[] = [];
  const testUserId = '33333333-3333-3333-3333-333333333333';
  const testBearerToken = 'mock-bearer-token-challenger-m3-2';
  const tokenHash = createHash('sha256').update(testBearerToken).digest('hex').slice(0, 32);

  // Authenticate test user in ttl-cache
  cacheSet(`auth:${tokenHash}`, { userId: testUserId, email: 'challenger@lingopro.online' }, 300_000);

  const origFetch = globalThis.fetch;

  // Mock global fetch to intercept Supabase client calls
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Handle RPC get_due_words_list
    if (urlStr.includes('/rpc/get_due_words_list')) {
      const body = JSON.parse((init?.body as string) || '{}');
      capturedRpcs.push({ fn: 'get_due_words_list', params: body });
      return new Response(
        JSON.stringify([
          {
            id: 'w-1',
            word: 'meticulous',
            translation: 'tỉ mỉ, cẩn thận',
            ipa: '/məˈtɪk.jə.ləs/',
            pos: 'adj',
            example: 'He is meticulous.',
            example_vi: 'Anh ấy rất tỉ mỉ.',
            review_count: 3,
            classroom_id: 'cls-due-1',
          },
          {
            id: 'w-2',
            word: 'corrupt1',
            translation: '⏳ Analyzing...',
            ipa: '',
            review_count: 1,
            classroom_id: 'cls-due-1',
          },
          {
            id: 'w-3',
            word: 'corrupt2',
            translation: '❌ Analysis failed - click Retry',
            ipa: '',
            review_count: 2,
            classroom_id: 'cls-due-2',
          },
          {
            id: 'w-4',
            word: 'corrupt3',
            translation: '',
            ipa: '',
            review_count: 1,
            classroom_id: 'cls-due-1',
          },
          {
            id: 'w-5',
            word: 'resilient',
            translation: 'kiên cường',
            ipa: '/rɪˈzɪl.jənt/',
            pos: 'adj',
            review_count: 5,
            classroom_id: 'cls-due-2',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle RPC get_word_summary
    if (urlStr.includes('/rpc/get_word_summary')) {
      const body = JSON.parse((init?.body as string) || '{}');
      capturedRpcs.push({ fn: 'get_word_summary', params: body });
      return new Response(
        JSON.stringify([
          {
            total: 25,
            learned: 15,
            review_due: 6,
            srs_due: 6,
            with_srs: 15,
            new_count: 10,
            review_due_count: 6,
            due_count: 16,
            level_counts: [10, 5, 4, 3, 2, 1],
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle classrooms query for authorization check
    if (urlStr.includes('/rest/v1/classrooms')) {
      // Mock user is teacher of the queried classroom
      return new Response(
        JSON.stringify({ teacher_id: testUserId, id: 'cls-authorized-1' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle default fallbacks
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    // ── Test 3.1: Cross-classroom review (filter=review without classroomId) ──
    capturedRpcs.length = 0;
    const reqReviewCross = new Request('https://lingopro.online/api/words?filter=review', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resReviewCross = await GET(reqReviewCross);
    const jsonReviewCross = await resReviewCross.json();

    assert(resReviewCross.status === 200, 'Suite 3.1', 'GET /api/words?filter=review returns 200 OK');
    assert(jsonReviewCross.classroomId === null, 'Suite 3.1', 'Response classroomId is null for cross-classroom review');

    const lastCallReview = capturedRpcs.find((c) => c.fn === 'get_due_words_list');
    assert(Boolean(lastCallReview), 'Suite 3.1', 'get_due_words_list RPC was invoked');
    assert(lastCallReview?.params.p_user_id === testUserId, 'Suite 3.1', 'p_user_id matches authenticated user');
    assert(lastCallReview?.params.p_classroom_id === null, 'Suite 3.1', 'p_classroom_id: null is passed for cross-classroom');

    // Verify artifact filtering in review route
    assert(jsonReviewCross.data.length === 2, 'Suite 3.1', 'Only 2 valid words returned out of 5 items (artifacts filtered)');
    assert(jsonReviewCross.data[0].word === 'meticulous', 'Suite 3.1', 'Item 1 is meticulous');
    assert(jsonReviewCross.data[1].word === 'resilient', 'Suite 3.1', 'Item 2 is resilient');
    assert(jsonReviewCross.data[0].classroom_id === 'cls-due-1', 'Suite 3.1', 'Item 1 retains its classroom_id');
    assert(jsonReviewCross.data[1].classroom_id === 'cls-due-2', 'Suite 3.1', 'Item 2 retains its classroom_id');

    // ── Test 3.2: Scoped review with explicit classroomId ──
    capturedRpcs.length = 0;
    const explicitClassId = '44444444-4444-4444-4444-444444444444';
    const reqReviewScoped = new Request(`https://lingopro.online/api/words?filter=review&classroomId=${explicitClassId}`, {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resReviewScoped = await GET(reqReviewScoped);
    const jsonReviewScoped = await resReviewScoped.json();

    assert(resReviewScoped.status === 200, 'Suite 3.2', 'GET /api/words?filter=review&classroomId=... returns 200 OK');
    assert(jsonReviewScoped.classroomId === explicitClassId, 'Suite 3.2', 'Response classroomId matches requested classroomId');
    const lastCallReviewScoped = capturedRpcs.find((c) => c.fn === 'get_due_words_list');
    assert(lastCallReviewScoped?.params.p_classroom_id === explicitClassId, 'Suite 3.2', 'p_classroom_id passed explicit UUID to RPC');

    // ── Test 3.3: Cross-classroom summary (summary=1 without classroomId) ──
    invalidateServerWordSummaryCache(testUserId);
    capturedRpcs.length = 0;
    const reqSummaryCross = new Request('https://lingopro.online/api/words?summary=1', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resSummaryCross = await GET(reqSummaryCross);
    const jsonSummaryCross = await resSummaryCross.json();

    assert(resSummaryCross.status === 200, 'Suite 3.3', 'GET /api/words?summary=1 returns 200 OK');
    assert(jsonSummaryCross.classroomId === null, 'Suite 3.3', 'Summary response classroomId is null for cross-classroom');
    assert(jsonSummaryCross.totalWords === 25, 'Suite 3.3', 'totalWords matches RPC return (25)');
    assert(jsonSummaryCross.dueCount === 16, 'Suite 3.3', 'dueCount matches RPC return (16)');
    assert(jsonSummaryCross.reviewDueCount === 6, 'Suite 3.3', 'reviewDueCount matches RPC return (6)');

    const lastCallSummary = capturedRpcs.find((c) => c.fn === 'get_word_summary');
    assert(Boolean(lastCallSummary), 'Suite 3.3', 'get_word_summary RPC was invoked');
    assert(lastCallSummary?.params.p_classroom_id === null, 'Suite 3.3', 'p_classroom_id: null is passed for cross-classroom summary');

    // ── Test 3.4: Summary In-Memory Caching Verification ──
    capturedRpcs.length = 0;
    const resSummaryCached = await GET(reqSummaryCross);
    const jsonSummaryCached = await resSummaryCached.json();
    assert(resSummaryCached.status === 200, 'Suite 3.4', 'Second GET /api/words?summary=1 returns 200 OK');
    assert(capturedRpcs.length === 0, 'Suite 3.4', 'No RPC was called on second request (Cache HIT)');
    assert(jsonSummaryCached.totalWords === 25, 'Suite 3.4', 'Cached totalWords matches original');

    // ── Test 3.5: Scoped summary cache key does not hit cross-classroom cache ──
    capturedRpcs.length = 0;
    const reqSummaryScoped = new Request(`https://lingopro.online/api/words?summary=1&classroomId=${explicitClassId}`, {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resSummaryScoped = await GET(reqSummaryScoped);
    const jsonSummaryScoped = await resSummaryScoped.json();
    assert(resSummaryScoped.status === 200, 'Suite 3.5', 'Scoped summary returns 200 OK');
    assert(capturedRpcs.length === 1, 'Suite 3.5', 'RPC called because scoped cache key does NOT collide with "all" cache');
    assert(capturedRpcs[0].params.p_classroom_id === explicitClassId, 'Suite 3.5', 'Scoped summary passed explicit UUID to RPC');

    // ── Test 3.6: Empty string classroomId query param normalizes to null ──
    capturedRpcs.length = 0;
    const reqEmptyClassId = new Request('https://lingopro.online/api/words?filter=review&classroomId=', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resEmptyClassId = await GET(reqEmptyClassId);
    const jsonEmptyClassId = await resEmptyClassId.json();
    assert(jsonEmptyClassId.classroomId === null, 'Suite 3.6', 'Empty string classroomId= normalizes to null');
    assert(capturedRpcs[0].params.p_classroom_id === null, 'Suite 3.6', 'Empty string classroomId passes null to RPC');

  } finally {
    globalThis.fetch = origFetch;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4: Adversarial Security & Boundary Testing
// ─────────────────────────────────────────────────────────────────────────────
async function runSuite4_AdversarialSecurityAndBoundaries() {
  console.log('\n=== SUITE 4: Adversarial Security & Boundary Testing ===');

  const testUserId = '33333333-3333-3333-3333-333333333333';
  const testBearerToken = 'mock-bearer-token-challenger-m3-2';
  const tokenHash = createHash('sha256').update(testBearerToken).digest('hex').slice(0, 32);
  cacheSet(`auth:${tokenHash}`, { userId: testUserId, email: 'challenger@lingopro.online' }, 300_000);

  const origFetch = globalThis.fetch;

  try {
    // ── Test 4.1: IDOR Protection on Classroom Access ──
    // Mock user is NOT teacher and NOT enrolled in forbidden classroom
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlStr.includes('/rest/v1/classrooms')) {
        return new Response(
          JSON.stringify({ teacher_id: 'other-user-uuid', id: 'forbidden-cls' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/rest/v1/enrollments')) {
        return new Response(JSON.stringify(null), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const reqForbidden = new Request('https://lingopro.online/api/words?classroomId=55555555-5555-5555-5555-555555555555&filter=review', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resForbidden = await GET(reqForbidden);
    assert(resForbidden.status === 401, 'Suite 4.1', 'IDOR: Unauthorized access to unowned/unenrolled classroom returns 401');

    // ── Test 4.2: Invalid IDs parameter format rejection ──
    const reqInvalidIds = new Request('https://lingopro.online/api/words?ids=not-a-uuid,invalid-123', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resInvalidIds = await GET(reqInvalidIds);
    assert(resInvalidIds.status === 400, 'Suite 4.2', 'Rejects non-UUID strings in ?ids= parameter with 400');

    // ── Test 4.3: More than 20 IDs parameter rejection ──
    const tooManyIds = Array.from({ length: 25 }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`).join(',');
    const reqTooManyIds = new Request(`https://lingopro.online/api/words?ids=${tooManyIds}`, {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resTooManyIds = await GET(reqTooManyIds);
    assert(resTooManyIds.status === 400, 'Suite 4.3', 'Rejects >20 IDs in ?ids= parameter with 400');

    // ── Test 4.4: Default Word List Fallback to Personal Classroom ──
    globalThis.fetch = async (input: RequestInfo | URL): Promise<Response> => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (urlStr.includes('/rest/v1/classrooms')) {
        // Mock getOrCreatePersonalClassroom finding __personal__
        return new Response(
          JSON.stringify({ id: 'personal-cls-uuid-999', teacher_id: testUserId, name: '__personal__' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (urlStr.includes('/rest/v1/words')) {
        return new Response(
          JSON.stringify([
            { id: 'w-default-1', word: 'cat', translation: 'con mèo', classroom_id: 'personal-cls-uuid-999', srs_progress: [] },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const reqDefault = new Request('https://lingopro.online/api/words', {
      headers: { Authorization: `Bearer ${testBearerToken}` },
    });
    const resDefault = await GET(reqDefault);
    const jsonDefault = await resDefault.json();

    assert(resDefault.status === 200, 'Suite 4.4', 'GET /api/words (default list) returns 200 OK');
    assert(jsonDefault.classroomId === 'personal-cls-uuid-999', 'Suite 4.4', 'Default list scopes to personal classroom');
    assert(jsonDefault.data.length === 1, 'Suite 4.4', 'Returns words scoped to personal classroom');

  } finally {
    globalThis.fetch = origFetch;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('================================================================');
  console.log('Milestone M3.2 Empirical Verification & Adversarial Stress Tests');
  console.log('================================================================');

  await runSuite1_CacheKeyIsolation();
  await runSuite2_TranslationFiltering();
  await runSuite3_RouteExecutionAndRpcPassing();
  await runSuite4_AdversarialSecurityAndBoundaries();

  console.log('\n================================================================');
  console.log('TEST SUMMARY');
  console.log('================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total tests: ${total}`);
  console.log(`Passed:      ${passed}`);
  console.log(`Failed:      ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ ${failed} tests failed!`);
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
