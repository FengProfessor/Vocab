/**
 * P3 Visual Pipeline & Local Diagnostic Probe Test Suite
 *
 * Verifies:
 * 1. Physical asset disk reality matching manifest declarations.
 * 2. Strict separation between generation, teaching approval, and diagnostic approval.
 * 3. Runtime validation of V0 vs V1 vs V2 assets.
 * 4. Teacher/system escape hatch: visual_ambiguity_suspected is non-scoring.
 * 5. End-to-end local visual vocabulary probe simulation with approved canonical assets.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { isDiagnosticRepresentationValid } from '../../src/lib/foundation-curriculum/representation-validator';
import { deriveVocabularyState } from '../../src/lib/foundation-curriculum/state-derivation';
import type {
  RepresentationEntity,
  LexicalEvidenceEvent,
  LexicalState,
} from '../../src/lib/foundation-curriculum/types';

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${msg}`);
    process.exit(1);
  }
}

console.log('--- STARTING P3 VISUAL ASSET & LOCAL PROBE TEST SUITE ---');

const manifestPath = path.resolve(process.cwd(), 'src/data/foundation-visual-manifest.json');
const manifestRaw = fs.readFileSync(manifestPath, 'utf-8');
const manifest = JSON.parse(manifestRaw);

// ---------------------------------------------------------------------------
// TEST 1: Physical Asset Disk Reality matches Manifest
// ---------------------------------------------------------------------------
runTest('P3-1: Physical files exist on disk for all declared physical assets', () => {
  assert.strictEqual(manifest.audit_summary.physical_images_found, 11, 'Manifest must declare exactly 11 physical images');

  for (const asset of manifest.assets) {
    if (asset.physical_asset_exists) {
      const fullPath = path.resolve(process.cwd(), asset.file_path);
      assert.strictEqual(fs.existsSync(fullPath), true, `Physical file must exist on disk: ${asset.file_path}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 10000, `Physical file must be a non-empty image (>10KB): ${asset.file_path}`);
    } else {
      assert.strictEqual(asset.file_path, null, 'Un-generated asset must have null file_path');
    }
  }
});

// ---------------------------------------------------------------------------
// TEST 2: Strict Non-Destructive Versioning (V1 rejected, V2 approved)
// ---------------------------------------------------------------------------
runTest('P3-2: Non-destructive versioning preserves rejected V1 and patched V2 assets', () => {
  const tiredV1 = manifest.assets.find((a: Record<string, unknown>) => a.asset_id === 'IMG-G6-014-v1');
  const tiredV2 = manifest.assets.find((a: Record<string, unknown>) => a.asset_id === 'IMG-G6-014-v2');

  assert.ok(tiredV1, 'tired_v1 must exist in manifest');
  assert.ok(tiredV2, 'tired_v2 must exist in manifest');
  assert.strictEqual(tiredV1.review_status, 'REJECTED', 'tired_v1 must be marked REJECTED for diagnostic');
  assert.strictEqual(tiredV1.semantic_clarity, 'V2', 'tired_v1 clarity must be V2');
  assert.strictEqual(tiredV2.review_status, 'APPROVED_TEACHING', 'tired_v2 must be marked APPROVED_TEACHING');
  assert.strictEqual(tiredV2.semantic_clarity, 'V1', 'tired_v2 clarity must be V1 (downgraded for pedagogical conservatism)');
  assert.strictEqual(tiredV1.superseded_by, 'IMG-G6-014-v2', 'tired_v1 must point to tired_v2 as replacement');

  const bigSmallV1 = manifest.assets.find((a: Record<string, unknown>) => a.asset_id === 'IMG-G6-017-v1');
  const bigSmallV2 = manifest.assets.find((a: Record<string, unknown>) => a.asset_id === 'IMG-G6-017-v2');

  assert.ok(bigSmallV1, 'big_small_v1 must exist in manifest');
  assert.ok(bigSmallV2, 'big_small_v2 must exist in manifest');
  assert.strictEqual(bigSmallV1.review_status, 'REJECTED', 'big_small_v1 must be REJECTED for diagnostic');
  assert.strictEqual(bigSmallV1.semantic_clarity, 'V2', 'big_small_v1 clarity must be V2');
  assert.strictEqual(bigSmallV2.review_status, 'APPROVED_TEACHING', 'big_small_v2 must be APPROVED_TEACHING');
  assert.strictEqual(bigSmallV2.semantic_clarity, 'V1', 'big_small_v2 clarity must be V1 (teaching contrast only)');
  assert.strictEqual(bigSmallV1.superseded_by, 'IMG-G6-017-v2', 'big_small_v1 must point to big_small_v2 as replacement');
});

runTest('P3-2b: Manual Owner Review Gate - Exactly 4 canonical V0 assets OWNER_APPROVED, 7 remaining PENDING', () => {
  const approvedIds = ['IMG-G6-001-v1', 'IMG-G6-002-v1', 'IMG-G6-003-v1', 'IMG-G6-012-v1'];
  for (const asset of manifest.assets) {
    if (asset.physical_asset_exists) {
      if (approvedIds.includes(asset.asset_id)) {
        assert.strictEqual(asset.owner_review_status, 'OWNER_APPROVED', `Asset ${asset.asset_id} must be OWNER_APPROVED`);
      } else {
        assert.strictEqual(asset.owner_review_status, 'OWNER_REVIEW_PENDING', `Asset ${asset.asset_id} must be OWNER_REVIEW_PENDING`);
      }
    }
  }
});

// ---------------------------------------------------------------------------
// TEST 3: Runtime Validator strictly filters by Diagnostic Approval Bar
// ---------------------------------------------------------------------------
runTest('P3-3: Runtime validator approves V0 diagnostic assets and rejects V1/V2 for diagnostic probes', () => {
  // Canonical V0 bag
  const bagEntity: RepresentationEntity = {
    id: 'IMG-G6-001-v1',
    concept_id: 'CON-G6-001',
    modality: 'VISUAL',
    sub_type: 'flashcard_image',
    content_payload: 'public/curriculum/beginner-grade6/images/bag_v1.jpg',
    clarity_rating: 'V0',
    approved_diagnostic: true,
    approved_teaching: true,
    metadata: {
      physical_asset_exists: true,
      provenance: 'PROJECT_AI_GENERATED',
      license: 'PROPRIETARY',
      contains_text: false,
    },
  };

  const bagValidation = isDiagnosticRepresentationValid(bagEntity, 'MODE_A_SOUND_IMAGE');
  assert.strictEqual(bagValidation.valid, true, 'V0 canonical bag must be valid for diagnostic probe');

  // Teaching-only V1 run (background clutter)
  const runEntity: RepresentationEntity = {
    id: 'IMG-G6-007-v1',
    concept_id: 'CON-G6-017',
    modality: 'VISUAL',
    sub_type: 'flashcard_image',
    content_payload: 'public/curriculum/beginner-grade6/images/run_v1.jpg',
    clarity_rating: 'V1',
    approved_diagnostic: false,
    approved_teaching: true,
    metadata: {
      physical_asset_exists: true,
      provenance: 'PROJECT_AI_GENERATED',
      license: 'PROPRIETARY',
    },
  };

  const runValidation = isDiagnosticRepresentationValid(runEntity, 'MODE_A_SOUND_IMAGE');
  assert.strictEqual(runValidation.valid, false, 'V1 teaching run must be REJECTED for diagnostic probe');

  // Rejected V2 tired (looks like sleeping)
  const tiredV1Entity: RepresentationEntity = {
    id: 'IMG-G6-014-v1',
    concept_id: 'CON-G6-042',
    modality: 'VISUAL',
    sub_type: 'flashcard_image',
    content_payload: 'public/curriculum/beginner-grade6/images/tired_v1.jpg',
    clarity_rating: 'V2',
    approved_diagnostic: false,
    approved_teaching: true,
    metadata: {
      physical_asset_exists: true,
      provenance: 'PROJECT_AI_GENERATED',
      license: 'PROPRIETARY',
    },
  };

  const tiredValidation = isDiagnosticRepresentationValid(tiredV1Entity, 'MODE_A_SOUND_IMAGE');
  assert.strictEqual(tiredValidation.valid, false, 'V2 tired_v1 must be REJECTED for diagnostic probe');
});

// ---------------------------------------------------------------------------
// TEST 4: Real Learner Escape Hatch (visual_ambiguity_suspected is non-scoring)
// ---------------------------------------------------------------------------
runTest('P3-4: visual_ambiguity_suspected escape hatch does not penalize learner', () => {
  const priorState: Partial<LexicalState> = {
    sound_recognition: true,
    consecutive_independent_passes: 3,
  };

  // Student is shown an approved image, but interprets it ambiguously
  const event: LexicalEvidenceEvent = {
    learner_id: 'learner-001',
    concept_id: 'CON-G6-001',
    representation_id: 'IMG-G6-001-v1',
    probe_mode: 'MODE_A_SOUND_IMAGE',
    target_dimension: 'SOUND_RECOGNITION',
    is_correct: false,
    support_level: 'INDEPENDENT',
    response_latency_ms: 3500,
    visual_ambiguity_suspected: true, // TEACHER / SYSTEM ESCAPE HATCH
  };

  const state = deriveVocabularyState([event], priorState);
  assert.strictEqual(state.is_instrument_invalidated, true, 'Must flag instrument invalidation');
  assert.strictEqual(state.status_bucket, 'RECHECK', 'Status must be set to RECHECK rather than UNKNOWN');
  assert.strictEqual(state.sound_recognition, true, 'Prior sound recognition must NOT be cleared');
  assert.strictEqual(state.consecutive_independent_passes, 3, 'Consecutive passes must NOT be decremented on visual ambiguity');
});

// ---------------------------------------------------------------------------
// TEST 5: Local Visual Vocabulary Probe Simulation (Happy Path)
// ---------------------------------------------------------------------------
runTest('P3-5: Simulated local visual vocabulary probe with canonical approved asset succeeds', () => {
  // Step 1: Probe selection recommends bag
  const assetRecord = manifest.assets.find((a: Record<string, unknown>) => a.lemma === 'bag' && a.approved_diagnostic);
  assert.ok(assetRecord, 'Must have approved diagnostic asset for bag');

  // Step 2: Student hears audio stimulus /bæɡ/, sees bag_v1.jpg, selects correctly
  const successfulProbeEvent: LexicalEvidenceEvent = {
    learner_id: 'learner-001',
    concept_id: 'CON-G6-001',
    representation_id: assetRecord.asset_id,
    probe_mode: 'MODE_A_SOUND_IMAGE',
    target_dimension: 'SOUND_RECOGNITION',
    is_correct: true,
    support_level: 'INDEPENDENT',
    response_latency_ms: 1450,
  };

  const state = deriveVocabularyState([successfulProbeEvent]);
  assert.strictEqual(state.sound_recognition, true, 'Student must receive sound recognition credit');
  assert.strictEqual(state.status_bucket, 'PARTIAL', 'State advances to PARTIAL');
  assert.strictEqual(state.consecutive_independent_passes, 1, 'Pass counter increments');
  assert.strictEqual(state.is_instrument_invalidated, false, 'No instrument error');
});

console.log('--- ALL 5 P3 VISUAL PIPELINE TESTS PASSED (100% SUCCESS) ---');
