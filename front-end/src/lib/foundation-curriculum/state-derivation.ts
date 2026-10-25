/**
 * Deterministic State Derivation & Gap Classification Engine (Layer B)
 *
 * Adheres strictly to Documents 26, 27, 28, 29, and 35.
 * - Multi-dimensional evidence vectors (never a single scalar percentage).
 * - Distinguishes support levels (INDEPENDENT vs MODELLED vs PROMPTED).
 * - Avoids pseudo-clinical language, false precision, and psychological speculation.
 * - Instrument invalidation: V2/V3 visual flaws or ASR glitches never penalize the learner.
 */

import type {
  LexicalEvidenceEvent,
  LexicalState,
  VocabularyGapType,
  StatusBucket,
} from './types';

export interface StateDerivationPilotOptions {
  hesitationThresholdMs?: number; // Configurable pilot heuristic (default: 8000ms)
  taskTimeoutThresholdMs?: number; // Configurable pilot heuristic (default: 20000ms)
}

/**
 * Derives the multidimensional LexicalState from an immutable stream of evidence events.
 */
export function deriveVocabularyState(
  events: LexicalEvidenceEvent[],
  priors?: Partial<LexicalState>,
  options: StateDerivationPilotOptions = {}
): LexicalState {
  const hesitationThresholdMs = options.hesitationThresholdMs ?? 8000;
  const taskTimeoutThresholdMs = options.taskTimeoutThresholdMs ?? 20000;
  const conceptId = events[0]?.concept_id || priors?.concept_id || 'UNKNOWN_CONCEPT';

  const state: LexicalState = {
    concept_id: conceptId,
    status_bucket: 'UNCERTAIN',
    active_gap: 'UNKNOWN_CONCEPT_OR_FORM',
    sound_recognition: priors?.sound_recognition ?? false,
    text_recognition: priors?.text_recognition ?? false,
    meaning_recall: priors?.meaning_recall ?? false,
    form_recall: priors?.form_recall ?? false,
    chunk_use: priors?.chunk_use ?? false,
    generative_use: priors?.generative_use ?? false,
    retention_stable: priors?.retention_stable ?? false,
    uncertainty_score: priors?.uncertainty_score ?? 1.0,
    last_support_level: priors?.last_support_level ?? 'INDEPENDENT',
    last_latency_ms: priors?.last_latency_ms ?? 0,
    consecutive_independent_passes: priors?.consecutive_independent_passes ?? 0,
    last_probed_at: priors?.last_probed_at,
    is_instrument_invalidated: false,
    invalidation_reason: undefined,
  };

  if (!events || events.length === 0) {
    return state;
  }

  // Process events in sequence
  for (const event of events) {
    state.last_latency_ms = event.response_latency_ms;
    state.last_support_level = event.support_level;
    state.last_probed_at = event.created_at || new Date().toISOString();

    // 1. ASR / AUDIO TECHNICAL FAILURE (Fail-Closed, Protect Learner)
    if (event.is_asr_failure) {
      state.is_instrument_invalidated = true;
      state.invalidation_reason = 'ASR_HARDWARE_OR_AUDIO_GLITCH';
      state.status_bucket = 'RECHECK';
      continue;
    }

    // 2. TASK ABORTED BY LEARNER OR TEACHER
    if (event.task_aborted) {
      state.active_gap = 'POSSIBLE_TASK_CONFUSION';
      state.status_bucket = 'RECHECK';
      continue;
    }

    // 3. INSTRUMENT ERROR HANDLING (Visual Item Ambiguity / Teacher Flag)
    // If the event indicates visual ambiguity or an invalid card was tapped, DO NOT penalize student!
    if (
      event.visual_ambiguity_suspected ||
      event.distractor_selected === 'VISUAL_AMBIGUITY_SUSPECTED' ||
      event.distractor_selected === 'POSSIBLE_VISUAL_ITEM_ERROR'
    ) {
      state.is_instrument_invalidated = true;
      state.invalidation_reason = 'POSSIBLE_VISUAL_ITEM_ERROR';
      state.active_gap = 'POSSIBLE_VISUAL_ITEM_ERROR';
      state.status_bucket = 'RECHECK';
      // Stop further penalization for this trial (Non-scoring event)
      continue;
    }

    // 4. TASK TIMEOUT / UI FRICTION (Configurable pilot heuristic, not psychological diagnosis)
    if (!event.is_correct && event.response_latency_ms > taskTimeoutThresholdMs) {
      state.active_gap = 'POSSIBLE_TASK_CONFUSION';
      state.status_bucket = 'RECHECK';
      state.uncertainty_score = Math.min(1.0, state.uncertainty_score + 0.2);
      continue;
    }

    // 5. DIMENSIONAL EVIDENCE PROCESSING
    const isIndependent = event.support_level === 'INDEPENDENT';
    const isWithinHesitationLimit = event.response_latency_ms <= hesitationThresholdMs;

    if (event.is_correct) {
      if (isIndependent) {
        if (isWithinHesitationLimit) {
          state.consecutive_independent_passes += 1;
        }
      } else {
        // Modelled or Prompted: resets consecutive independent counter
        state.consecutive_independent_passes = 0;
      }

      // Update specific target dimensions
      switch (event.target_dimension) {
        case 'SOUND_RECOGNITION':
          if (isIndependent) state.sound_recognition = true;
          break;
        case 'TEXT_RECOGNITION':
          if (isIndependent) state.text_recognition = true;
          break;
        case 'MEANING_RECALL':
          if (isIndependent) state.meaning_recall = true;
          break;
        case 'FORM_RECALL':
          if (isIndependent) state.form_recall = true;
          break;
        case 'CHUNK_USE':
          if (isIndependent) state.chunk_use = true;
          break;
        case 'GENERATIVE_USE':
          if (isIndependent) state.generative_use = true;
          break;
        case 'RETENTION':
          if (event.is_delayed_retention_probe && (event.days_since_last_pass ?? 0) >= 7) {
            state.retention_stable = true;
          }
          break;
      }

      // Reduce uncertainty score (faster reduction for independent rapid passes)
      const reduction = isIndependent && isWithinHesitationLimit ? 0.25 : 0.10;
      state.uncertainty_score = Math.max(0.0, +(state.uncertainty_score - reduction).toFixed(2));
    } else {
      // Failure branch
      state.consecutive_independent_passes = 0;

      switch (event.target_dimension) {
        case 'SOUND_RECOGNITION':
          state.sound_recognition = false;
          break;
        case 'TEXT_RECOGNITION':
          state.text_recognition = false;
          break;
        case 'MEANING_RECALL':
          state.meaning_recall = false;
          break;
        case 'FORM_RECALL':
          state.form_recall = false;
          break;
        case 'CHUNK_USE':
          state.chunk_use = false;
          break;
        case 'RETENTION':
          if (event.is_delayed_retention_probe && (event.days_since_last_pass ?? 0) >= 7) {
            state.retention_stable = false;
            state.active_gap = 'RETENTION_GAP';
          }
          break;
      }

      // Increase uncertainty on failure
      state.uncertainty_score = Math.min(1.0, +(state.uncertainty_score + 0.3).toFixed(2));
    }

    // Special metadata flags
    if (event.is_category_foil) {
      state.meaning_recall = false;
      state.active_gap = 'MEANING_RECALL_GAP';
    }
    if (event.variant_switch_failed) {
      state.active_gap = 'CONTEXT_TRANSFER_GAP';
    }
  }

  // 6. DERIVE ACTIVE GAP CLASSIFICATION
  if (
    !state.is_instrument_invalidated &&
    state.active_gap !== 'CONTEXT_TRANSFER_GAP' &&
    state.active_gap !== 'MEANING_RECALL_GAP' &&
    state.active_gap !== 'RETENTION_GAP'
  ) {
    state.active_gap = classifyVocabularyGap(state);
  }

  // 7. DERIVE STATUS BUCKET
  state.status_bucket = deriveStatusBucket(state, hesitationThresholdMs);

  return state;
}

/**
 * Classifies the exact diagnostic gap into 1 of 10 pedagogical categories.
 */
export function classifyVocabularyGap(state: LexicalState): VocabularyGapType {
  if (state.is_instrument_invalidated) {
    return 'POSSIBLE_VISUAL_ITEM_ERROR';
  }

  if (state.status_bucket === 'RECHECK' && state.active_gap === 'POSSIBLE_TASK_CONFUSION') {
    return 'POSSIBLE_TASK_CONFUSION';
  }

  // Sound-form gap: Reads text fine, but cannot decode spoken acoustic stream (Vietnamese coda interference)
  if (state.text_recognition && !state.sound_recognition) {
    return 'SOUND_FORM_GAP';
  }

  // Orthographic-form gap: Understands spoken audio, but cannot read written letters
  if (state.sound_recognition && !state.text_recognition) {
    return 'ORTHOGRAPHIC_FORM_GAP';
  }

  // Both sound & text recognized (Receptive baseline intact):
  if (state.sound_recognition && state.text_recognition) {
    // If category foil was selected or explicit meaning recall failed
    if (state.active_gap === 'MEANING_RECALL_GAP') {
      return 'MEANING_RECALL_GAP';
    }

    // Productive form recall gap: Receptive recognition intact, but cannot produce the English form
    if (!state.form_recall) {
      return 'ENGLISH_FORM_RECALL_GAP';
    }

    // Chunk usage gap: Form recalled in isolation, but fails in formulaic frame
    if (!state.chunk_use) {
      return 'CHUNK_USAGE_GAP';
    }
  }

  // Both sound and text absent: complete novice/unseen
  if (!state.sound_recognition && !state.text_recognition) {
    return 'UNKNOWN_CONCEPT_OR_FORM';
  }

  return 'UNKNOWN_CONCEPT_OR_FORM';
}

/**
 * Determines glanceable teacher status bucket.
 */
function deriveStatusBucket(state: LexicalState, hesitationThresholdMs = 8000): StatusBucket {
  if (state.is_instrument_invalidated) {
    return 'RECHECK';
  }

  if (state.active_gap === 'POSSIBLE_TASK_CONFUSION' || state.active_gap === 'POSSIBLE_VISUAL_ITEM_ERROR') {
    return 'RECHECK';
  }

  // SOLID requirement:
  // - Sound recognition true
  // - Text recognition true
  // - Form recall true
  // - Chunk use true
  // - Consecutive independent passes >= 2
  // - Low uncertainty (<= 0.25)
  // - Not suffering from excessive hesitation latency
  if (
    state.sound_recognition &&
    state.text_recognition &&
    state.form_recall &&
    state.chunk_use &&
    state.consecutive_independent_passes >= 2 &&
    state.uncertainty_score <= 0.25 &&
    state.last_latency_ms <= hesitationThresholdMs
  ) {
    return 'SOLID';
  }

  // PARTIAL: At least one receptive/productive anchor is established, or an asymmetric gap is diagnosed
  if (
    state.active_gap === 'SOUND_FORM_GAP' ||
    state.active_gap === 'ORTHOGRAPHIC_FORM_GAP' ||
    state.active_gap === 'ENGLISH_FORM_RECALL_GAP' ||
    state.active_gap === 'CHUNK_USAGE_GAP' ||
    state.active_gap === 'MEANING_RECALL_GAP' ||
    state.active_gap === 'CONTEXT_TRANSFER_GAP' ||
    state.sound_recognition ||
    state.text_recognition ||
    state.meaning_recall ||
    state.form_recall
  ) {
    return 'PARTIAL';
  }

  // UNKNOWN: Probed and confirmed unknown across modalities without receptive anchors
  if (
    state.active_gap === 'UNKNOWN_CONCEPT_OR_FORM' &&
    !state.sound_recognition &&
    !state.text_recognition &&
    state.last_probed_at
  ) {
    return 'UNKNOWN';
  }

  // If high uncertainty without any probed confirmation
  if (state.uncertainty_score > 0.65) {
    return 'UNCERTAIN';
  }

  return 'UNKNOWN';
}
