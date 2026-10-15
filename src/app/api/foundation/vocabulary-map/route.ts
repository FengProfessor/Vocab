import { NextResponse } from 'next/server';
import {
  getFoundationAuthUser,
  getFoundationServiceClient,
  unauthorized,
  forbidden,
} from '@/lib/foundation-curriculum/foundation-context';
import {
  fetchLearnerLexicalMap,
  recordLexicalEvidenceEvent,
  getFoundationConcepts,
  verifyLearnerAccess,
  AuthorizationError,
} from '@/lib/foundation-curriculum/data-access';
import type { LexicalEvidenceEvent, EvidenceSource } from '@/lib/foundation-curriculum/types';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_PROBE_MODES = new Set([
  'MODE_A_SOUND_IMAGE',
  'MODE_B_TEXT_IMAGE',
  'MODE_C_FORM_RECALL',
  'MODE_D_CHUNK_CLOZE',
  'MODE_E_TEACHER_OBSERVATION',
]);
const ALLOWED_TARGET_DIMENSIONS = new Set([
  'SOUND_RECOGNITION',
  'TEXT_RECOGNITION',
  'MEANING_RECALL',
  'FORM_RECALL',
  'CHUNK_USE',
  'GENERATIVE_USE',
  'RETENTION',
]);
const ALLOWED_SUPPORT_LEVELS = new Set([
  'INDEPENDENT',
  'MODELLED',
  'PROMPTED',
  'NOT_YET',
]);

/**
 * GET /api/foundation/vocabulary-map?learner_id=<UUID>
 * Fetches the learner's complete multi-dimensional vocabulary gap map.
 */
export async function GET(req: Request) {
  const auth = await getFoundationAuthUser(req);
  if (!auth) return unauthorized();

  const url = new URL(req.url);
  const targetLearnerId = url.searchParams.get('learner_id') || auth.userId;

  if (!UUID_REGEX.test(targetLearnerId)) {
    return NextResponse.json({ success: false, error: 'Malformed learner ID' }, { status: 400 });
  }

  try {
    const supabase = getFoundationServiceClient();
    const [concepts, stateMap] = await Promise.all([
      getFoundationConcepts(supabase),
      fetchLearnerLexicalMap(supabase, auth.userId, targetLearnerId),
    ]);

    // Format into serializable payload
    const items = concepts.map((concept) => {
      const state = stateMap.get(concept.id);
      return {
        concept,
        state: state || {
          concept_id: concept.id,
          status_bucket: 'UNCERTAIN',
          active_gap: 'UNKNOWN_CONCEPT_OR_FORM',
          sound_recognition: false,
          text_recognition: false,
          meaning_recall: false,
          form_recall: false,
          chunk_use: false,
          generative_use: false,
          retention_stable: false,
          uncertainty_score: 1.0,
          last_support_level: 'INDEPENDENT',
          last_latency_ms: 0,
          consecutive_independent_passes: 0,
        },
      };
    });

    // Barometer totals
    const counts = {
      solid: items.filter((i) => i.state.status_bucket === 'SOLID').length,
      partial: items.filter((i) => i.state.status_bucket === 'PARTIAL').length,
      unknown: items.filter((i) => i.state.status_bucket === 'UNKNOWN').length,
      uncertain: items.filter((i) => i.state.status_bucket === 'UNCERTAIN').length,
      recheck: items.filter((i) => i.state.status_bucket === 'RECHECK').length,
      total: items.length,
    };

    return NextResponse.json({
      success: true,
      learner_id: targetLearnerId,
      barometer: counts,
      items,
    });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return forbidden(err.message);
    }
    console.error('Error fetching foundation vocabulary map:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/foundation/vocabulary-map
 * Ingests a new diagnostic / lesson observation evidence event.
 * Supports both learner self-telemetry and authorized teacher observations.
 */
export async function POST(req: Request) {
  const auth = await getFoundationAuthUser(req);
  if (!auth) return unauthorized();

  try {
    const body = (await req.json()) as Record<string, unknown>;

    // 1. Prevent client from forging SYSTEM evidence
    if (body.evidence_source === 'SYSTEM') {
      return NextResponse.json({ success: false, error: 'Client cannot submit SYSTEM evidence' }, { status: 400 });
    }

    const targetLearnerId = body.learner_id ? String(body.learner_id) : auth.userId;
    if (!UUID_REGEX.test(targetLearnerId)) {
      return NextResponse.json({ success: false, error: 'Malformed learner ID' }, { status: 400 });
    }

    // 2. Validate input fields
    if (!body.concept_id || typeof body.concept_id !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid concept_id' }, { status: 400 });
    }

    if (!ALLOWED_PROBE_MODES.has(String(body.probe_mode))) {
      return NextResponse.json({ success: false, error: 'Invalid probe_mode' }, { status: 400 });
    }

    if (!ALLOWED_TARGET_DIMENSIONS.has(String(body.target_dimension))) {
      return NextResponse.json({ success: false, error: 'Invalid target_dimension' }, { status: 400 });
    }

    if (body.support_level && !ALLOWED_SUPPORT_LEVELS.has(String(body.support_level))) {
      return NextResponse.json({ success: false, error: 'Invalid support_level' }, { status: 400 });
    }

    const supabase = getFoundationServiceClient();

    // 3. Determine evidence source and verify authorization
    const isSelf = targetLearnerId === auth.userId;
    let evidenceSource: EvidenceSource;

    if (isSelf) {
      // Learner self-submission: always forced to LEARNER (even if student attempted to forge TEACHER)
      evidenceSource = 'LEARNER';
    } else {
      // Teacher submitting observation for another learner: verify classroom enrollment
      const isAuthorizedTeacher = await verifyLearnerAccess(supabase, auth.userId, targetLearnerId);
      if (!isAuthorizedTeacher) {
        return forbidden('Forbidden: User is not authorized to record observations for this learner.');
      }
      evidenceSource = 'TEACHER';
    }

    // 4. Construct validated event with immutable provenance audit trail
    const event: LexicalEvidenceEvent = {
      actor_user_id: auth.userId,
      learner_id: targetLearnerId,
      evidence_source: evidenceSource,
      concept_id: String(body.concept_id),
      representation_id: body.representation_id ? String(body.representation_id) : undefined,
      probe_mode: body.probe_mode as LexicalEvidenceEvent['probe_mode'],
      target_dimension: body.target_dimension as LexicalEvidenceEvent['target_dimension'],
      is_correct: Boolean(body.is_correct),
      support_level: (body.support_level as LexicalEvidenceEvent['support_level']) || 'INDEPENDENT',
      response_latency_ms: Math.max(100, Math.min(120000, Number(body.response_latency_ms) || 2000)),
      distractor_selected: body.distractor_selected ? String(body.distractor_selected) : undefined,
      lesson_id: body.lesson_id ? String(body.lesson_id) : undefined,
      is_asr_failure: Boolean(body.is_asr_failure),
      task_aborted: Boolean(body.task_aborted),
    };

    const updatedState = await recordLexicalEvidenceEvent(supabase, auth.userId, event);

    return NextResponse.json({
      success: true,
      updated_state: updatedState,
    });
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      return forbidden(err.message);
    }
    const message = err instanceof Error ? err.message : 'Bad Request';
    console.error('Error recording foundation evidence:', message);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
