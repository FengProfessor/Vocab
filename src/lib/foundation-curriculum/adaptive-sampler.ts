/**
 * Adaptive Diagnostic Probe Sampler & Teacher Recommender (Layer B)
 *
 * Implements:
 * 1. Generative Power (GP) item sampling.
 * 2. Session fatigue safeguard (configurable max consecutive unsuccessful probes before break).
 * 3. Observable stop signals (learner requested stop, teacher requested stop, task aborted).
 * 4. Deterministic, evidence-backed teacher recommendations.
 */

import type {
  FoundationLexicalConcept,
  LexicalState,
  DiagnosticProbeOptions,
  DiagnosticProbeRecommendation,
  TeacherActionRecommendation,
  ProbeMode,
  EvidenceDimension,
} from './types';

/**
 * Selects the next optimal diagnostic micro-probe based on the learner's current state map.
 * Respects observable pause/stop signals and session fatigue safeguards.
 */
export function selectNextDiagnosticProbe(
  learnerStateMap: Map<string, LexicalState>,
  concepts: FoundationLexicalConcept[],
  options: DiagnosticProbeOptions = {}
): DiagnosticProbeRecommendation | null {
  // 1. OBSERVABLE STOP SIGNALS (Immediate Fail-Safe)
  if (options.learnerRequestedStop || options.teacherRequestedStop || options.taskAborted) {
    return null;
  }

  const maxProbes = options.maxProbes ?? 16;
  const maxConsecutiveUnsuccessful = options.maxConsecutiveUnsuccessfulProbesBeforeBreak ?? 3;

  // 2. SESSION FATIGUE SAFEGUARD
  // Check recent unsuccessful streak across probed concepts
  let consecutiveUnsuccessful = 0;
  for (const state of learnerStateMap.values()) {
    if (state.last_support_level === 'NOT_YET' || state.active_gap === 'POSSIBLE_TASK_CONFUSION') {
      consecutiveUnsuccessful++;
    } else if (state.consecutive_independent_passes > 0) {
      consecutiveUnsuccessful = 0;
    }
  }

  if (consecutiveUnsuccessful >= maxConsecutiveUnsuccessful) {
    // SAFEGUARD TRIGGERED: Suggest session pause or switch to supportive review
    return null;
  }

  // 3. CHECK PROBE QUOTA
  const probedCount = Array.from(learnerStateMap.values()).filter(
    (s) => s.uncertainty_score < 1.0 || s.last_probed_at
  ).length;

  if (probedCount >= maxProbes) {
    return null;
  }

  // 4. PRIORITIZE ITEMS BY GENERATIVE POWER (GP)
  // Sort candidates by GP descending, filtering for UNCERTAIN or UNKNOWN concepts
  const candidates = [...concepts].sort((a, b) => b.generative_power - a.generative_power);

  for (const concept of candidates) {
    const state = learnerStateMap.get(concept.id);

    // If completely unprobed or highly uncertain
    if (!state || state.status_bucket === 'UNCERTAIN' || state.uncertainty_score > 0.6) {
      let probeMode: ProbeMode = 'MODE_A_SOUND_IMAGE';
      let targetDimension: EvidenceDimension = 'SOUND_RECOGNITION';

      if (state) {
        if (!state.sound_recognition) {
          probeMode = 'MODE_A_SOUND_IMAGE';
          targetDimension = 'SOUND_RECOGNITION';
        } else if (!state.text_recognition) {
          probeMode = 'MODE_B_TEXT_IMAGE';
          targetDimension = 'TEXT_RECOGNITION';
        } else if (!state.form_recall) {
          probeMode = 'MODE_C_FORM_RECALL';
          targetDimension = 'FORM_RECALL';
        } else if (!state.chunk_use) {
          probeMode = 'MODE_D_CHUNK_CLOZE';
          targetDimension = 'CHUNK_USE';
        }
      }

      return {
        concept_id: concept.id,
        lemma: concept.lemma,
        probe_mode: probeMode,
        target_dimension: targetDimension,
        recommended_representation_id: `IMG-${concept.lemma.toUpperCase()}-CANONICAL`,
        reason: `High Generative Power (GP: ${concept.generative_power}) candidate in cluster '${concept.cluster}'. Probing ${targetDimension}.`,
      };
    }
  }

  return null;
}

/**
 * Generates deterministic, actionable pedagogical recommendations for the human teacher.
 */
export function recommendNextAction(
  learnerStateMap: Map<string, LexicalState>,
  concepts: FoundationLexicalConcept[],
  currentLessonId: string
): TeacherActionRecommendation[] {
  const recommendations: TeacherActionRecommendation[] = [];

  for (const concept of concepts) {
    const state = learnerStateMap.get(concept.id);

    if (!state) {
      // Unprobed concept
      recommendations.push({
        concept_id: concept.id,
        lemma: concept.lemma,
        status_bucket: 'UNCERTAIN',
        active_gap: 'UNKNOWN_CONCEPT_OR_FORM',
        action_type: 'PROBE',
        prescriptive_advice: `Sample during Lesson ${currentLessonId} warm-up (GP: ${concept.generative_power}).`,
        evidence_summary: 'Unprobed baseline item.',
      });
      continue;
    }

    // 1. SOLID ITEMS: Do not waste time re-teaching!
    if (state.status_bucket === 'SOLID') {
      recommendations.push({
        concept_id: concept.id,
        lemma: concept.lemma,
        status_bucket: 'SOLID',
        active_gap: state.active_gap,
        action_type: 'IGNORE',
        prescriptive_advice: `DO NOT RE-TEACH. Solid across sound, text, and syntax. Use as familiar anchor in new chunks.`,
        evidence_summary: `Independent passes: ${state.consecutive_independent_passes}, latency: ${state.last_latency_ms}ms.`,
      });
      continue;
    }

    // 2. GAP-SPECIFIC ACTIONS
    switch (state.active_gap) {
      case 'SOUND_FORM_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'REVIEW',
          prescriptive_advice: `Phonological coda intervention: Student reads '${concept.lemma}' fine but misses spoken acoustic stream. Drill final stop coda.`,
          evidence_summary: `Text: PASS, Sound: FAIL. Latency: ${state.last_latency_ms}ms.`,
        });
        break;

      case 'ORTHOGRAPHIC_FORM_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'REVIEW',
          prescriptive_advice: `Sight-word decoding needed: Spoken form is clear, but student confuses printed letters. Use tactile letter-tile assembly.`,
          evidence_summary: `Sound: PASS, Text: FAIL.`,
        });
        break;

      case 'ENGLISH_FORM_RECALL_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'TEACH',
          prescriptive_advice: `Passive-Active asymmetry: Receptive recognition intact, but freezes on production. Use 3-second teacher model and whisper choral drill.`,
          evidence_summary: `Sound: PASS, Text: PASS, Form Recall: FAIL.`,
        });
        break;

      case 'CHUNK_USAGE_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'TEACH',
          prescriptive_advice: `Isolated-to-syntax breakdown: Knows single word '${concept.lemma}' but freezes in frame. Practice slot-filling: '${concept.target_chunks[0] || 'I like [X]'}'.`,
          evidence_summary: `Form Recall: PASS, Chunk Use: FAIL.`,
        });
        break;

      case 'MEANING_RECALL_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'TEACH',
          prescriptive_advice: `Category boundary confusion: Selected semantic foil (e.g. pen vs pencil). Drill side-by-side minimal contrast pairs.`,
          evidence_summary: `Category foil selected during meaning probe.`,
        });
        break;

      case 'POSSIBLE_VISUAL_ITEM_ERROR':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: 'RECHECK',
          active_gap: state.active_gap,
          action_type: 'PROBE',
          prescriptive_advice: `Instrument error suspected: Image card ambiguity flagged. Re-check using physical realia or certified V0 asset. Student unpenalized.`,
          evidence_summary: `Trial invalidated due to visual card ambiguity.`,
        });
        break;

      case 'RETENTION_GAP':
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: 'RECHECK',
          active_gap: state.active_gap,
          action_type: 'REVIEW',
          prescriptive_advice: `Spaced decay detected: Learned previously but failed delayed 7-day probe. Recycle in lesson warm-up.`,
          evidence_summary: `Delayed retention probe failed after 7+ days.`,
        });
        break;

      default:
        recommendations.push({
          concept_id: concept.id,
          lemma: concept.lemma,
          status_bucket: state.status_bucket,
          active_gap: state.active_gap,
          action_type: 'TEACH',
          prescriptive_advice: `Introduce inductively via communicative chunk '${concept.target_chunks[0] || 'I have a [X]'}'.`,
          evidence_summary: `Receptive recognition absent.`,
        });
        break;
    }
  }

  return recommendations;
}
