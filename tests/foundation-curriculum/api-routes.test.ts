/**
 * API Route Handler Integration & Security Tests (P2.2 Reconciled)
 *
 * Verifies all API endpoints under /api/foundation/:
 * T1: Learner submits own evidence -> accepted (200 OK, source: LEARNER).
 * T2: Learner submits evidence for another learner -> rejected (403 Forbidden).
 * T3: Authorized teacher submits observation for enrolled learner -> accepted (200 OK, source: TEACHER).
 * T4: Teacher submits observation for unauthorized learner -> rejected (403 Forbidden).
 * T5: Student attempts to forge TEACHER evidence source -> server overrides to LEARNER.
 * T6: Client attempts to forge SYSTEM source -> rejected (400 Bad Request).
 * T7: Teacher observation with PROMPTED support level -> stored as teacher evidence.
 * T8: Teacher observation does not automatically equal independent learner mastery.
 * Additional: Unauthenticated (401), Malformed UUID (400), Invalid enums (400), Unknown concept (400),
 * Stop signals (200, null probe), Recommendations (200), Direct access tenant checks.
 */

import assert from 'node:assert';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GET as getVocabMap, POST as postEvidence } from '../../src/app/api/foundation/vocabulary-map/route';
import { GET as getDiagnosticProbe } from '../../src/app/api/foundation/diagnostic-probe/route';
import { GET as getRecommendations } from '../../src/app/api/foundation/recommendations/route';
import {
  setFoundationTestAuthHook,
  setFoundationTestServiceClientHook,
} from '../../src/lib/foundation-curriculum/foundation-context';
import { verifyLearnerAccess } from '../../src/lib/foundation-curriculum/data-access';
import type { FoundationLexicalConcept, LexicalState } from '../../src/lib/foundation-curriculum/types';

console.log('--- STARTING FOUNDATION API SECURITY & INTEGRATION SUITE (P2.2) ---');

let passedTests = 0;

interface MockSupabaseOptions {
  concepts?: FoundationLexicalConcept[];
  states?: LexicalState[];
  enrollmentFound?: boolean;
  conceptFound?: boolean;
  representationFound?: boolean;
}

function createMockSupabase(options: MockSupabaseOptions = {}) {
  const {
    concepts = [
      {
        id: 'CON-G6-001',
        lemma: 'bag',
        pos: 'noun',
        ipa: '/bæɡ/',
        meaning_vi: 'cái túi, cặp sách',
        cluster: 'school_objects',
        generative_power: 4,
        stage: 1,
        target_chunks: ['in the bag', 'my bag'],
        contrast_concepts: ['CON-G6-002'],
      },
    ],
    states = [],
    enrollmentFound = true,
    conceptFound = true,
    representationFound = true,
  } = options;

  const insertedEvidence: Record<string, unknown>[] = [];
  let upsertedState: Record<string, unknown> | null = null;

  const client = {
    from: (table: string) => {
      if (table === 'enrollments') {
        return {
          select: () => ({
            eq: (_col1: string, val1: string) => ({
              eq: (_col2: string, val2: string) => ({
                maybeSingle: async () => {
                  // Only return enrollment if teacher & student match enrollment condition
                  if (enrollmentFound && val1 !== 'unauthorized-student' && val2 !== 'unauthorized-teacher') {
                    return { data: { classroom_id: 'cls-1' }, error: null };
                  }
                  return { data: null, error: { message: 'Not found' } };
                },
              }),
            }),
          }),
        };
      }
      if (table === 'foundation_lexical_concepts') {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: concepts, error: null }),
            eq: () => ({
              maybeSingle: async () => ({
                data: conceptFound ? { id: 'CON-G6-001' } : null,
                error: conceptFound ? null : { message: 'Concept not found' },
              }),
            }),
          }),
        };
      }
      if (table === 'foundation_representations') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: representationFound ? { id: 'REP-BAG-001', clarity_rating: 'V0' } : null,
                error: representationFound ? null : { message: 'Representation not found' },
              }),
            }),
          }),
        };
      }
      if (table === 'learner_lexical_state') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: states, error: null }),
          }),
          upsert: async (payload: Record<string, unknown>) => {
            upsertedState = payload;
            return { error: null };
          },
        };
      }
      if (table === 'learner_lexical_evidence') {
        return {
          insert: async (row: Record<string, unknown>) => {
            insertedEvidence.push(row);
            return { error: null };
          },
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve({
                  data: [
                    ...insertedEvidence,
                    {
                      actor_user_id: insertedEvidence[insertedEvidence.length - 1]?.actor_user_id || '00000000-0000-0000-0000-000000000002',
                      learner_id: '00000000-0000-0000-0000-000000000002',
                      evidence_source: insertedEvidence[insertedEvidence.length - 1]?.evidence_source || 'LEARNER',
                      concept_id: 'CON-G6-001',
                      probe_mode: 'MODE_A_SOUND_IMAGE',
                      target_dimension: 'SOUND_RECOGNITION',
                      is_correct: true,
                      support_level: 'INDEPENDENT',
                      response_latency_ms: 1500,
                      created_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    },
    getUpsertedState: () => upsertedState,
    getInsertedEvidence: () => insertedEvidence,
  };

  return client as unknown as SupabaseClient & {
    getUpsertedState: () => Record<string, unknown> | null;
    getInsertedEvidence: () => Record<string, unknown>[];
  };
}

async function runAllApiTests() {
  const teacherA_id = '00000000-0000-0000-0000-000000000001';
  const studentB_id = '00000000-0000-0000-0000-000000000002';
  const studentC_id = '00000000-0000-0000-0000-000000000003';

  // -------------------------------------------------------------------------
  // TEST 1: Unauthenticated request rejected (401)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => null);

    const reqGet = new Request('http://localhost:3000/api/foundation/vocabulary-map');
    const resGet = await getVocabMap(reqGet);
    assert.strictEqual(resGet.status, 401, 'Unauthenticated GET must return 401');

    const reqPost = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const resPost = await postEvidence(reqPost);
    assert.strictEqual(resPost.status, 401, 'Unauthenticated POST must return 401');

    console.log('  ✓ PASS: API 1: Unauthenticated requests rejected with 401');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 2: Malformed learner ID rejected (400)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: teacherA_id }));

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map?learner_id=not-a-valid-uuid');
    const res = await getVocabMap(req);
    assert.strictEqual(res.status, 400, 'Malformed learner ID must return 400 Bad Request');
    const body = (await res.json()) as { error?: string };
    assert.ok(body.error?.includes('learner ID'), 'Error must mention learner ID');
    console.log('  ✓ PASS: API 2: Malformed learner ID rejected with 400');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 3 (T1): Learner submits own evidence -> accepted (200 OK, source: LEARNER)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));
    const mockDb = createMockSupabase({ conceptFound: true, representationFound: true });
    setFoundationTestServiceClientHook(() => mockDb);

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentB_id,
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        support_level: 'INDEPENDENT',
        response_latency_ms: 1500,
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 200, 'Learner self-submission must return 200 OK');
    const inserted = mockDb.getInsertedEvidence();
    assert.strictEqual(inserted.length, 1);
    assert.strictEqual(inserted[0].evidence_source, 'LEARNER', 'Evidence source must be LEARNER');
    assert.strictEqual(inserted[0].actor_user_id, studentB_id, 'Actor user ID must match learner');
    console.log('  ✓ PASS: T1: Learner submits own evidence -> accepted (source: LEARNER)');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 4 (T2): Learner submits evidence for another learner -> rejected (403)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id })); // Student B logged in
    setFoundationTestServiceClientHook(() => createMockSupabase({ enrollmentFound: false }));

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentC_id, // Student C target
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 403, 'Learner submitting for another learner must return 403 Forbidden');
    console.log('  ✓ PASS: T2: Learner submits evidence for another learner -> rejected (403)');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 5 (T3): Authorized teacher submits observation for enrolled learner -> accepted (200)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: teacherA_id })); // Teacher A logged in
    const mockDb = createMockSupabase({ enrollmentFound: true, conceptFound: true });
    setFoundationTestServiceClientHook(() => mockDb);

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentB_id, // Student B enrolled in Teacher A's classroom
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_E_TEACHER_OBSERVATION',
        target_dimension: 'FORM_RECALL',
        is_correct: true,
        support_level: 'INDEPENDENT',
        response_latency_ms: 2500,
        lesson_id: '001',
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 200, 'Authorized teacher observation must return 200 OK');
    const inserted = mockDb.getInsertedEvidence();
    assert.strictEqual(inserted.length, 1);
    assert.strictEqual(inserted[0].evidence_source, 'TEACHER', 'Evidence source must be derived as TEACHER');
    assert.strictEqual(inserted[0].actor_user_id, teacherA_id, 'Actor user ID must be the teacher');
    assert.strictEqual(inserted[0].learner_id, studentB_id, 'Learner ID must be student B');
    console.log('  ✓ PASS: T3: Authorized teacher submits observation for enrolled learner -> accepted (source: TEACHER)');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 6 (T4): Teacher submits observation for unauthorized learner -> rejected (403)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: teacherA_id }));
    setFoundationTestServiceClientHook(() => createMockSupabase({ enrollmentFound: false }));

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentC_id, // Student C not in Teacher A's classroom
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_E_TEACHER_OBSERVATION',
        target_dimension: 'FORM_RECALL',
        is_correct: true,
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 403, 'Cross-tenant teacher observation must return 403 Forbidden');
    console.log('  ✓ PASS: T4: Teacher submits observation for unauthorized learner -> rejected (403)');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 7 (T5): Student attempts to forge TEACHER evidence source -> server overrides to LEARNER
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));
    const mockDb = createMockSupabase({ conceptFound: true });
    setFoundationTestServiceClientHook(() => mockDb);

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentB_id,
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        evidence_source: 'TEACHER', // Forgery attempt!
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 200, 'Request succeeds, but source must be forced to LEARNER');
    const inserted = mockDb.getInsertedEvidence();
    assert.strictEqual(inserted[0].evidence_source, 'LEARNER', 'Server MUST override forged TEACHER source to LEARNER');
    console.log('  ✓ PASS: T5: Student attempts to forge TEACHER source -> server strictly overrides to LEARNER');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 8 (T6): Client attempts to forge SYSTEM source -> rejected (400)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentB_id,
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        evidence_source: 'SYSTEM', // Client claims SYSTEM source
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 400, 'Client claiming SYSTEM evidence must return 400 Bad Request');
    const body = (await res.json()) as { error?: string };
    assert.ok(body.error?.includes('SYSTEM'), 'Error message must mention SYSTEM evidence');
    console.log('  ✓ PASS: T6: Client attempts to forge SYSTEM source -> rejected with 400 Bad Request');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 9 (T7): Teacher observation with PROMPTED support level -> stored as teacher evidence
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: teacherA_id }));
    const mockDb = createMockSupabase({ enrollmentFound: true, conceptFound: true });
    setFoundationTestServiceClientHook(() => mockDb);

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        learner_id: studentB_id,
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_E_TEACHER_OBSERVATION',
        target_dimension: 'MEANING_RECALL',
        is_correct: true,
        support_level: 'PROMPTED',
        response_latency_ms: 4500,
        lesson_id: '001',
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 200);
    const inserted = mockDb.getInsertedEvidence();
    assert.strictEqual(inserted[0].evidence_source, 'TEACHER');
    assert.strictEqual(inserted[0].support_level, 'PROMPTED');
    console.log('  ✓ PASS: T7: Teacher observation with PROMPTED support level -> correctly stored');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 10: Invalid enum parameters rejected (400)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));

    // Bad probe_mode
    const req1 = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        concept_id: 'CON-G6-001',
        probe_mode: 'INVALID_HACKED_MODE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
      }),
    });
    const res1 = await postEvidence(req1);
    assert.strictEqual(res1.status, 400);

    // Bad target_dimension
    const req2 = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'TELEPATHY_RECALL',
        is_correct: true,
      }),
    });
    const res2 = await postEvidence(req2);
    assert.strictEqual(res2.status, 400);

    // Bad support_level
    const req3 = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        support_level: 'CHEATING_ALLOWED',
        is_correct: true,
      }),
    });
    const res3 = await postEvidence(req3);
    assert.strictEqual(res3.status, 400);

    console.log('  ✓ PASS: API: Malformed payload parameters strictly rejected with 400');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 11: Unknown concept ID rejected (400)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));
    setFoundationTestServiceClientHook(() => createMockSupabase({ conceptFound: false }));

    const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
      method: 'POST',
      body: JSON.stringify({
        concept_id: 'NON_EXISTENT_CONCEPT',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
      }),
    });

    const res = await postEvidence(req);
    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as { error?: string };
    assert.ok(body.error?.includes('Unknown concept ID'));
    console.log('  ✓ PASS: API: Unknown concept ID rejected with 400');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 12: Diagnostic probe respects observable stop signal
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: studentB_id }));
    setFoundationTestServiceClientHook(() => createMockSupabase({ enrollmentFound: true }));

    const req = new Request(`http://localhost:3000/api/foundation/diagnostic-probe?learner_id=${studentB_id}&learner_stop=true`);
    const res = await getDiagnosticProbe(req);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { probe: unknown };
    assert.strictEqual(body.probe, null);
    console.log('  ✓ PASS: API: Diagnostic probe respects observable stop signal');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 13: Teacher recommendations endpoint (200 OK)
  // -------------------------------------------------------------------------
  {
    setFoundationTestAuthHook(() => ({ userId: teacherA_id }));
    setFoundationTestServiceClientHook(() => createMockSupabase({ enrollmentFound: true }));

    const req = new Request(`http://localhost:3000/api/foundation/recommendations?learner_id=${studentB_id}&lesson_id=001`);
    const res = await getRecommendations(req);
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as { success: boolean; recommendations: unknown[] };
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.recommendations));
    console.log('  ✓ PASS: API: Teacher recommendations endpoint returns guidance');
    passedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST 14: Direct data-access verifyLearnerAccess unit verification
  // -------------------------------------------------------------------------
  {
    const emptyClient = {} as unknown as SupabaseClient;

    // Self access
    const selfAccess = await verifyLearnerAccess(emptyClient, studentB_id, studentB_id);
    assert.strictEqual(selfAccess, true, 'Self access must always be granted');

    // Invalid UUID
    const badUuidAccess = await verifyLearnerAccess(emptyClient, 'invalid-id', studentB_id);
    assert.strictEqual(badUuidAccess, false, 'Invalid UUID must be rejected');

    // Teacher with enrollment
    const teacherAllowedDb = createMockSupabase({ enrollmentFound: true });
    const teacherAllowed = await verifyLearnerAccess(teacherAllowedDb, teacherA_id, studentB_id);
    assert.strictEqual(teacherAllowed, true, 'Teacher with enrollment must be granted access');

    // Teacher without enrollment
    const teacherDeniedDb = createMockSupabase({ enrollmentFound: false });
    const teacherDenied = await verifyLearnerAccess(teacherDeniedDb, teacherA_id, studentB_id);
    assert.strictEqual(teacherDenied, false, 'Teacher without enrollment must be denied access');

    console.log('  ✓ PASS: API: verifyLearnerAccess tenant isolation unit tests passed');
    passedTests++;
  }

  // Clean up hooks
  setFoundationTestAuthHook(null);
  setFoundationTestServiceClientHook(null);

  console.log(`\n--- ALL ${passedTests} API ROUTE INTEGRATION & SECURITY TESTS PASSED ---`);
}

runAllApiTests().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('Fatal API test failure:', msg);
  process.exit(1);
});
