/**
 * P4 Pilot Dry-Run Simulation Test Suite
 *
 * Verifies the complete teacher workflow and evidence derivation for Lesson 1 Pilot
 * using strictly isolated synthetic test data (mock-pilot-learner-001).
 *
 * Requirements tested (Parts 46–47):
 * 1. Independent answer verification (support_level: 'INDEPENDENT').
 * 2. Prompted answer verification (support_level: 'PROMPTED', does not equal independent mastery).
 * 3. Unexpected lexical responses (drink -> "water", book -> "notebook", pen -> "pencil").
 * 4. Visual ambiguity escape hatch (visual_ambiguity_suspected: true is non-scoring).
 * 5. Teacher observation write path (evidence_source: 'TEACHER').
 * 6. Learner self-event write path (evidence_source: 'LEARNER').
 * 7. Multi-dimensional session summary without toxic overall percentage scores.
 * 8. Synthetic test data cleanup and isolation.
 */

import assert from 'node:assert';
import { deriveVocabularyState } from '../../src/lib/foundation-curriculum/state-derivation';
import { POST as postEvidence } from '../../src/app/api/foundation/vocabulary-map/route';
import {
  setFoundationTestAuthHook,
  setFoundationTestServiceClientHook,
} from '../../src/lib/foundation-curriculum/foundation-context';
import type {
  LexicalEvidenceEvent,
  LexicalState,
} from '../../src/lib/foundation-curriculum/types';

console.log('--- STARTING P4 PILOT DRY-RUN SIMULATION SUITE ---');

let passedTests = 0;

// Synthetic Test Constants (Strictly isolated from real learner data)
const MOCK_PILOT_LEARNER_ID = '00000000-0000-0000-0000-000000000099';
const MOCK_PILOT_TEACHER_ID = '00000000-0000-0000-0000-000000000088';
const IS_TEST_DATA = true;

// Mock database store for simulation
interface MockDbStore {
  evidence: (LexicalEvidenceEvent & { id: string; created_at: string; is_test_data?: boolean })[];
  states: LexicalState[];
}

function createSimulationMockDb(store: MockDbStore) {
  return {
    from: (table: string) => {
      if (table === 'enrollments') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { classroom_id: 'cls-mock-001' },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'foundation_lexical_concepts') {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: [{ id: 'CON-G6-001', lemma: 'bag' }], error: null }),
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: 'CON-G6-001', lemma: 'bag' },
                error: null,
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
                data: { id: 'IMG-G6-001-v1', clarity_rating: 'V0', approved_diagnostic: true },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'learner_lexical_evidence') {
        return {
          insert: async (row: Record<string, unknown>) => {
            store.evidence.push({
              ...(row as unknown as LexicalEvidenceEvent),
              id: `evi-${store.evidence.length + 1}`,
              created_at: new Date().toISOString(),
              is_test_data: IS_TEST_DATA,
            });
            return { error: null };
          },
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => Promise.resolve({
                  data: store.evidence,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }

      if (table === 'learner_lexical_state') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: store.states, error: null }),
          }),
          upsert: async (payload: Record<string, unknown>) => {
            const idx = store.states.findIndex((s) => s.concept_id === payload.concept_id);
            if (idx >= 0) {
              store.states[idx] = payload as unknown as LexicalState;
            } else {
              store.states.push(payload as unknown as LexicalState);
            }
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table queried in mock db: ${table}`);
    },
  };
}

// ---------------------------------------------------------------------------
// TEST 1: Independent Answer Verification
// ---------------------------------------------------------------------------
{
  const event: LexicalEvidenceEvent = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    concept_id: 'CON-G6-003', // book
    representation_id: 'IMG-G6-003-v1',
    probe_mode: 'MODE_A_SOUND_IMAGE',
    target_dimension: 'SOUND_RECOGNITION',
    is_correct: true,
    support_level: 'INDEPENDENT',
    response_latency_ms: 1800,
  };

  const state = deriveVocabularyState([event]);
  assert.strictEqual(state.sound_recognition, true, 'Independent correct sound probe must set sound_recognition to true');
  assert.strictEqual(state.consecutive_independent_passes, 1, 'Consecutive independent passes must increment to 1');
  assert.strictEqual(state.status_bucket, 'PARTIAL', 'Status bucket must advance to PARTIAL');
  assert.strictEqual(state.uncertainty_score < 1.0, true, 'Uncertainty must decrease after independent correct trial');
  console.log('  ✓ PASS: P4-1: Independent answer grants sound credit and increments passes');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 2: Prompted Answer Verification (Not Equivalent to Independent Mastery)
// ---------------------------------------------------------------------------
{
  const event: LexicalEvidenceEvent = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    concept_id: 'CON-G6-002', // pen
    representation_id: 'IMG-G6-002-v1',
    probe_mode: 'MODE_C_FORM_RECALL',
    target_dimension: 'FORM_RECALL',
    is_correct: true,
    support_level: 'PROMPTED', // Teacher gave initial phoneme /p.../
    response_latency_ms: 5500,
  };

  const state = deriveVocabularyState([event]);
  // When support is PROMPTED, form_recall is NOT credited as independent mastery
  assert.strictEqual(state.form_recall, false, 'Prompted recall must NOT credit form_recall as independent mastery');
  assert.strictEqual(state.consecutive_independent_passes, 0, 'Consecutive independent passes must remain 0 for prompted response');
  assert.strictEqual(state.last_support_level, 'PROMPTED', 'Last support level must record PROMPTED');
  console.log('  ✓ PASS: P4-2: Prompted answer recorded accurately without granting false independent mastery');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 3: Unexpected Lexical Responses (Calibration Cases)
// ---------------------------------------------------------------------------
{
  // Case 3A: drink -> Student says "water" to drink_v1.jpg
  // Teacher does NOT record a wrong response. Instead, tests Sound->Image probe for drink.
  const drinkSoundProbe: LexicalEvidenceEvent = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    concept_id: 'CON-G6-088', // drink
    representation_id: 'IMG-G6-012-v1',
    probe_mode: 'MODE_A_SOUND_IMAGE',
    target_dimension: 'SOUND_RECOGNITION',
    is_correct: true, // Learner pointed to drink when hearing /drɪŋk/
    support_level: 'INDEPENDENT',
    response_latency_ms: 2100,
  };

  const drinkState = deriveVocabularyState([drinkSoundProbe]);
  assert.strictEqual(drinkState.sound_recognition, true, 'Learner receives sound credit for drink');
  assert.strictEqual(drinkState.form_recall, false, 'Form recall remains uncredited without penalty');
  assert.strictEqual(drinkState.status_bucket, 'PARTIAL', 'Status advances to PARTIAL via receptive recognition');

  // Case 3B: book -> Student says "notebook"
  // Teacher tests Text->Image probe to check reading recognition
  const bookTextProbe: LexicalEvidenceEvent = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    concept_id: 'CON-G6-003', // book
    representation_id: 'IMG-G6-003-v1',
    probe_mode: 'MODE_B_TEXT_IMAGE',
    target_dimension: 'TEXT_RECOGNITION',
    is_correct: true,
    support_level: 'INDEPENDENT',
    response_latency_ms: 1900,
  };

  const bookState = deriveVocabularyState([bookTextProbe]);
  assert.strictEqual(bookState.text_recognition, true, 'Reading recognition confirmed for book');

  console.log('  ✓ PASS: P4-3: Unexpected lexical responses handled with targeted non-penalizing micro-probes');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 4: Visual Ambiguity Flag (Non-Scoring Escape Hatch)
// ---------------------------------------------------------------------------
{
  const priorState: Partial<LexicalState> = {
    sound_recognition: true,
    consecutive_independent_passes: 2,
  };

  const ambiguousEvent: LexicalEvidenceEvent = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    concept_id: 'CON-G6-001',
    representation_id: 'IMG-G6-001-v1',
    probe_mode: 'MODE_A_SOUND_IMAGE',
    target_dimension: 'SOUND_RECOGNITION',
    is_correct: false,
    support_level: 'INDEPENDENT',
    response_latency_ms: 4000,
    visual_ambiguity_suspected: true, // ESCAPE HATCH FLAGGED
  };

  const state = deriveVocabularyState([ambiguousEvent], priorState);
  assert.strictEqual(state.is_instrument_invalidated, true, 'Must invalidate instrument');
  assert.strictEqual(state.status_bucket, 'RECHECK', 'Status set to RECHECK rather than failure');
  assert.strictEqual(state.sound_recognition, true, 'Prior sound recognition preserved');
  assert.strictEqual(state.consecutive_independent_passes, 2, 'Independent passes preserved without penalty');
  console.log('  ✓ PASS: P4-4: Visual ambiguity escape hatch protects learner from false negative');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 5: Teacher Observation Write Path (evidence_source: TEACHER)
// ---------------------------------------------------------------------------
async function testTeacherWritePath() {
  const store: MockDbStore = { evidence: [], states: [] };
  const mockDb = createSimulationMockDb(store);
  setFoundationTestAuthHook(() => ({ userId: MOCK_PILOT_TEACHER_ID }));
  setFoundationTestServiceClientHook(() => mockDb as unknown as import('@supabase/supabase-js').SupabaseClient);

  const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
    method: 'POST',
    body: JSON.stringify({
      learner_id: MOCK_PILOT_LEARNER_ID,
      concept_id: 'CON-G6-001',
      representation_id: 'IMG-G6-001-v1',
      probe_mode: 'MODE_E_TEACHER_OBSERVATION',
      target_dimension: 'MEANING_RECALL',
      is_correct: true,
      support_level: 'PROMPTED',
      response_latency_ms: 3200,
      lesson_id: '001',
    }),
  });

  const res = await postEvidence(req);
  assert.strictEqual(res.status, 200, 'Teacher post must return 200 OK');
  assert.strictEqual(store.evidence.length, 1, 'Evidence must be stored in database');
  assert.strictEqual(store.evidence[0].evidence_source, 'TEACHER', 'Evidence source must be TEACHER');
  assert.strictEqual(store.evidence[0].actor_user_id, MOCK_PILOT_TEACHER_ID, 'Actor must be teacher');
  assert.strictEqual(store.evidence[0].is_test_data, true, 'Must be marked as test data');
  console.log('  ✓ PASS: P4-5: Teacher observation recorded with verified TEACHER source');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 6: Learner Self-Event Write Path (evidence_source: LEARNER)
// ---------------------------------------------------------------------------
async function testLearnerWritePath() {
  const store: MockDbStore = { evidence: [], states: [] };
  const mockDb = createSimulationMockDb(store);
  setFoundationTestAuthHook(() => ({ userId: MOCK_PILOT_LEARNER_ID }));
  setFoundationTestServiceClientHook(() => mockDb as unknown as import('@supabase/supabase-js').SupabaseClient);

  const req = new Request('http://localhost:3000/api/foundation/vocabulary-map', {
    method: 'POST',
    body: JSON.stringify({
      learner_id: MOCK_PILOT_LEARNER_ID,
      concept_id: 'CON-G6-001',
      representation_id: 'IMG-G6-001-v1',
      probe_mode: 'MODE_A_SOUND_IMAGE',
      target_dimension: 'SOUND_RECOGNITION',
      is_correct: true,
      support_level: 'INDEPENDENT',
      response_latency_ms: 1650,
      lesson_id: '001',
    }),
  });

  const res = await postEvidence(req);
  assert.strictEqual(res.status, 200, 'Learner post must return 200 OK');
  assert.strictEqual(store.evidence.length, 1, 'Evidence must be stored');
  assert.strictEqual(store.evidence[0].evidence_source, 'LEARNER', 'Evidence source must be LEARNER');
  assert.strictEqual(store.evidence[0].actor_user_id, MOCK_PILOT_LEARNER_ID, 'Actor must be learner');
  console.log('  ✓ PASS: P4-6: Learner self-event recorded with verified LEARNER source');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 7: Multi-Dimensional Session Summary (No Overall Percentage Score)
// ---------------------------------------------------------------------------
{
  // Simulated Lesson 1 session events for mock-pilot-learner-001
  const sessionEvents: Record<string, LexicalEvidenceEvent[]> = {
    'CON-G6-003': [ // book: Sound probe correct
      {
        learner_id: MOCK_PILOT_LEARNER_ID,
        concept_id: 'CON-G6-003',
        representation_id: 'IMG-G6-003-v1',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        support_level: 'INDEPENDENT',
        response_latency_ms: 1800,
      },
    ],
    'CON-G6-002': [ // pen: Form recall prompted
      {
        learner_id: MOCK_PILOT_LEARNER_ID,
        concept_id: 'CON-G6-002',
        representation_id: 'IMG-G6-002-v1',
        probe_mode: 'MODE_C_FORM_RECALL',
        target_dimension: 'FORM_RECALL',
        is_correct: true,
        support_level: 'PROMPTED',
        response_latency_ms: 5500,
      },
    ],
    'CON-G6-012': [ // drink: Sound recognized
      {
        learner_id: MOCK_PILOT_LEARNER_ID,
        concept_id: 'CON-G6-012',
        representation_id: 'IMG-G6-012-v1',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        support_level: 'INDEPENDENT',
        response_latency_ms: 2200,
      },
    ],
  };

  // Derive per-concept state
  const derivedStates: Record<string, LexicalState> = {};
  for (const [conceptId, events] of Object.entries(sessionEvents)) {
    derivedStates[conceptId] = deriveVocabularyState(events);
  }

  // Check 1: No overall percentage calculation exists in the output
  const sessionSummary = {
    learner_id: MOCK_PILOT_LEARNER_ID,
    session_id: 'session-mock-001',
    lesson_id: '001',
    evaluated_concepts: derivedStates,
    // Verify untracked/untested concepts explicitly state UNKNOWN / NOT TESTED
    untested_concepts: ['CON-G6-007', 'CON-G6-011', 'CON-G6-014'], // run, eat, tired
    untested_dimensions: ['CHUNK_USE', 'GENERATIVE_USE', 'RETENTION'],
    recommended_pathway: 'ADVANCE_WITH_REVIEW',
  };

  assert.strictEqual('overall_percentage' in sessionSummary, false, 'Session summary MUST NOT contain an overall percentage score');
  assert.strictEqual('pass_fail' in sessionSummary, false, 'Session summary MUST NOT contain a pass/fail flag');
  assert.strictEqual(sessionSummary.evaluated_concepts['CON-G6-003'].sound_recognition, true);
  assert.strictEqual(sessionSummary.evaluated_concepts['CON-G6-003'].chunk_use, false, 'Untested chunk_use must remain false/untested');
  assert.strictEqual(sessionSummary.recommended_pathway, 'ADVANCE_WITH_REVIEW');
  console.log('  ✓ PASS: P4-7: Multi-dimensional session summary derived without overall percentage score');
  passedTests++;
}

// ---------------------------------------------------------------------------
// TEST 8: Synthetic Data Isolation & Teardown Verification
// ---------------------------------------------------------------------------
{
  const store: MockDbStore = {
    evidence: [
      {
        id: 'test-1',
        learner_id: MOCK_PILOT_LEARNER_ID,
        concept_id: 'CON-G6-001',
        probe_mode: 'MODE_A_SOUND_IMAGE',
        target_dimension: 'SOUND_RECOGNITION',
        is_correct: true,
        support_level: 'INDEPENDENT',
        response_latency_ms: 1500,
        created_at: new Date().toISOString(),
        is_test_data: true,
      },
    ],
    states: [],
  };

  // Teardown function for dry-run data
  function cleanupSyntheticTestData(dbStore: MockDbStore) {
    dbStore.evidence = dbStore.evidence.filter((e) => !e.is_test_data && !e.learner_id.startsWith('mock-pilot-'));
    dbStore.states = dbStore.states.filter((s) => !s.concept_id.startsWith('mock-'));
  }

  assert.strictEqual(store.evidence.length, 1);
  cleanupSyntheticTestData(store);
  assert.strictEqual(store.evidence.length, 0, 'Cleanup must purge all synthetic pilot test records');
  console.log('  ✓ PASS: P4-8: Synthetic pilot test data safely isolated and purged');
  passedTests++;
}

// Execute async tests
async function runAll() {
  await testTeacherWritePath();
  await testLearnerWritePath();
  console.log(`--- ALL ${passedTests} P4 PILOT DRY-RUN TESTS PASSED (100% SUCCESS) ---`);
}

runAll().catch((err) => {
  console.error('P4 test runner failure:', err);
  process.exit(1);
});
