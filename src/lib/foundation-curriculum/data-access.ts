/**
 * Server-Side Data Access Layer for Foundation Curriculum
 *
 * Implements strict tenant isolation, teacher classroom verification,
 * and integrates the pure domain state derivation engine.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LexicalEvidenceEvent,
  LexicalState,
  FoundationLexicalConcept,
  TeacherActionRecommendation,
  DiagnosticProbeRecommendation,
  DiagnosticProbeOptions,
  EvidenceSource,
} from './types';
import { deriveVocabularyState } from './state-derivation';
import { selectNextDiagnosticProbe, recommendNextAction } from './adaptive-sampler';

export class AuthorizationError extends Error {
  constructor(message = 'Forbidden: Access to learner lexical state denied.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifies that the querying user has permission to access the target learner's data.
 * Access is granted if:
 * 1. The user is the student themselves (currentUserId === targetLearnerId)
 * 2. The user is an authorized teacher whose active classroom contains the student.
 */
export async function verifyLearnerAccess(
  supabase: SupabaseClient,
  currentUserId: string,
  targetLearnerId: string
): Promise<boolean> {
  if (!UUID_REGEX.test(currentUserId) || !UUID_REGEX.test(targetLearnerId)) {
    return false;
  }

  if (currentUserId === targetLearnerId) {
    return true;
  }

  // Teacher verification query
  const { data, error } = await supabase
    .from('enrollments')
    .select('classroom_id, classrooms!inner(teacher_id)')
    .eq('student_id', targetLearnerId)
    .eq('classrooms.teacher_id', currentUserId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Fetches all canonical Foundation Lexical Concepts.
 */
export async function getFoundationConcepts(
  supabase: SupabaseClient
): Promise<FoundationLexicalConcept[]> {
  const { data, error } = await supabase
    .from('foundation_lexical_concepts')
    .select('*')
    .order('generative_power', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    lemma: String(row.lemma),
    pos: row.pos as FoundationLexicalConcept['pos'],
    ipa: String(row.ipa),
    meaning_vi: String(row.meaning_vi),
    cluster: String(row.cluster),
    generative_power: Number(row.generative_power),
    stage: Number(row.stage),
    target_chunks: Array.isArray(row.target_chunks) ? (row.target_chunks as string[]) : [],
    contrast_concepts: Array.isArray(row.contrast_concepts) ? (row.contrast_concepts as string[]) : [],
  }));
}

/**
 * Fetches the complete Lexical State Map for a given learner.
 */
export async function fetchLearnerLexicalMap(
  supabase: SupabaseClient,
  currentUserId: string,
  targetLearnerId: string
): Promise<Map<string, LexicalState>> {
  const hasAccess = await verifyLearnerAccess(supabase, currentUserId, targetLearnerId);
  if (!hasAccess) {
    throw new AuthorizationError();
  }

  const { data, error } = await supabase
    .from('learner_lexical_state')
    .select('*')
    .eq('learner_id', targetLearnerId);

  const stateMap = new Map<string, LexicalState>();

  if (error || !data) {
    return stateMap;
  }

  for (const row of data) {
    stateMap.set(row.concept_id, {
      concept_id: row.concept_id,
      status_bucket: row.status_bucket,
      active_gap: row.active_gap,
      sound_recognition: row.sound_recognition,
      text_recognition: row.text_recognition,
      meaning_recall: row.meaning_recall,
      form_recall: row.form_recall,
      chunk_use: row.chunk_use,
      generative_use: row.generative_use,
      retention_stable: row.retention_stable,
      uncertainty_score: Number(row.uncertainty_score),
      last_support_level: row.last_support_level,
      last_latency_ms: row.last_latency_ms ?? 0,
      consecutive_independent_passes: row.consecutive_independent_passes ?? 0,
      last_probed_at: row.last_probed_at,
    });
  }

  return stateMap;
}

/**
 * Records an immutable lexical evidence event and recalculates the learner's state.
 */
export async function recordLexicalEvidenceEvent(
  supabase: SupabaseClient,
  currentUserId: string,
  event: LexicalEvidenceEvent
): Promise<LexicalState> {
  // 0. Authorization check: learner self-write or authorized teacher write
  const isSelf = currentUserId === event.learner_id;
  let derivedSource: EvidenceSource;

  if (isSelf) {
    derivedSource = 'LEARNER';
    event.actor_user_id = currentUserId;
    event.evidence_source = 'LEARNER';
  } else {
    // Teacher write: check classroom ownership
    const isAuthorizedTeacher = await verifyLearnerAccess(supabase, currentUserId, event.learner_id);
    if (!isAuthorizedTeacher) {
      throw new AuthorizationError('Forbidden: User is not authorized to record evidence for this learner.');
    }
    derivedSource = 'TEACHER';
    event.actor_user_id = currentUserId;
    event.evidence_source = 'TEACHER';
  }

  // 0a. Validate concept_id existence
  const { data: conceptData, error: conceptError } = await supabase
    .from('foundation_lexical_concepts')
    .select('id')
    .eq('id', event.concept_id)
    .maybeSingle();

  if (conceptError || !conceptData) {
    throw new Error(`Unknown concept ID: '${event.concept_id}'. Event rejected.`);
  }

  // 0b. Validate representation_id existence if provided
  if (event.representation_id) {
    const { data: repData, error: repError } = await supabase
      .from('foundation_representations')
      .select('id, clarity_rating')
      .eq('id', event.representation_id)
      .maybeSingle();

    if (repError || !repData) {
      throw new Error(`Unknown representation ID: '${event.representation_id}'. Event rejected.`);
    }

    // Fail closed: if representation is V2/V3, ensure distractor_selected is flagged
    if (repData.clarity_rating === 'V2' || repData.clarity_rating === 'V3') {
      event.distractor_selected = 'VISUAL_AMBIGUITY_SUSPECTED';
    }
  }

  // 1. Insert immutable evidence event with audit trail (actor_user_id, evidence_source)
  const { error: insertError } = await supabase
    .from('learner_lexical_evidence')
    .insert({
      actor_user_id: event.actor_user_id || currentUserId,
      learner_id: event.learner_id,
      evidence_source: derivedSource,
      concept_id: event.concept_id,
      representation_id: event.representation_id || null,
      probe_mode: event.probe_mode,
      target_dimension: event.target_dimension,
      is_correct: event.is_correct,
      support_level: event.support_level,
      response_latency_ms: event.response_latency_ms,
      distractor_selected: event.distractor_selected || null,
      lesson_id: event.lesson_id || null,
    });

  if (insertError) {
    throw new Error(`Failed to record lexical evidence: ${insertError.message}`);
  }

  // 2. Fetch full historical event stream for this concept & learner
  const { data: eventHistory, error: historyError } = await supabase
    .from('learner_lexical_evidence')
    .select('*')
    .eq('learner_id', event.learner_id)
    .eq('concept_id', event.concept_id)
    .order('created_at', { ascending: true });

  if (historyError) {
    throw new Error(`Failed to fetch lexical history: ${historyError.message}`);
  }

  const history: LexicalEvidenceEvent[] = (eventHistory || []).map((row: Record<string, unknown>) => ({
    id: row.id ? String(row.id) : undefined,
    actor_user_id: row.actor_user_id ? String(row.actor_user_id) : undefined,
    learner_id: String(row.learner_id),
    evidence_source: (row.evidence_source as EvidenceSource) || 'LEARNER',
    concept_id: String(row.concept_id),
    representation_id: row.representation_id ? String(row.representation_id) : undefined,
    probe_mode: row.probe_mode as LexicalEvidenceEvent['probe_mode'],
    target_dimension: row.target_dimension as LexicalEvidenceEvent['target_dimension'],
    is_correct: Boolean(row.is_correct),
    support_level: row.support_level as LexicalEvidenceEvent['support_level'],
    response_latency_ms: Number(row.response_latency_ms) || 0,
    distractor_selected: row.distractor_selected ? String(row.distractor_selected) : undefined,
    lesson_id: row.lesson_id ? String(row.lesson_id) : undefined,
    created_at: String(row.created_at),
  }));

  // 3. Compute derived state via pure domain function
  const derivedState = deriveVocabularyState(history);

  // 4. Upsert derived state into learner_lexical_state
  const { error: upsertError } = await supabase
    .from('learner_lexical_state')
    .upsert(
      {
        learner_id: event.learner_id,
        concept_id: event.concept_id,
        status_bucket: derivedState.status_bucket,
        active_gap: derivedState.active_gap,
        sound_recognition: derivedState.sound_recognition,
        text_recognition: derivedState.text_recognition,
        meaning_recall: derivedState.meaning_recall,
        form_recall: derivedState.form_recall,
        chunk_use: derivedState.chunk_use,
        generative_use: derivedState.generative_use,
        retention_stable: derivedState.retention_stable,
        uncertainty_score: derivedState.uncertainty_score,
        last_support_level: derivedState.last_support_level,
        last_latency_ms: derivedState.last_latency_ms,
        consecutive_independent_passes: derivedState.consecutive_independent_passes,
        last_probed_at: derivedState.last_probed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'learner_id,concept_id' }
    );

  if (upsertError) {
    throw new Error(`Failed to update lexical state: ${upsertError.message}`);
  }

  return derivedState;
}

/**
 * Fetches teacher recommendations for a target learner and upcoming lesson.
 */
export async function fetchTeacherRecommendations(
  supabase: SupabaseClient,
  currentUserId: string,
  targetLearnerId: string,
  currentLessonId: string
): Promise<TeacherActionRecommendation[]> {
  const hasAccess = await verifyLearnerAccess(supabase, currentUserId, targetLearnerId);
  if (!hasAccess) {
    throw new AuthorizationError();
  }

  const [concepts, stateMap] = await Promise.all([
    getFoundationConcepts(supabase),
    fetchLearnerLexicalMap(supabase, currentUserId, targetLearnerId),
  ]);

  return recommendNextAction(stateMap, concepts, currentLessonId);
}

/**
 * Selects the next adaptive diagnostic micro-probe for a learner.
 */
export async function fetchNextDiagnosticProbe(
  supabase: SupabaseClient,
  currentUserId: string,
  targetLearnerId: string,
  options: DiagnosticProbeOptions = {}
): Promise<DiagnosticProbeRecommendation | null> {
  const hasAccess = await verifyLearnerAccess(supabase, currentUserId, targetLearnerId);
  if (!hasAccess) {
    throw new AuthorizationError();
  }

  const [concepts, stateMap] = await Promise.all([
    getFoundationConcepts(supabase),
    fetchLearnerLexicalMap(supabase, currentUserId, targetLearnerId),
  ]);

  return selectNextDiagnosticProbe(stateMap, concepts, options);
}
