/**
 * Core Types & Domain Interfaces for English From Zero - Foundation Curriculum
 * (Grade 6 Vietnam Pre-A1 False Beginner).
 *
 * Adheres strictly to Documents 26, 27, 28, 29, 33, and 35.
 * Strictly avoids pseudo-clinical language, false precision, and psychological speculation.
 */

export type EvidenceDimension =
  | 'SOUND_RECOGNITION'
  | 'TEXT_RECOGNITION'
  | 'MEANING_RECALL'
  | 'FORM_RECALL'
  | 'CHUNK_USE'
  | 'GENERATIVE_USE'
  | 'RETENTION';

export type SupportLevel =
  | 'INDEPENDENT'
  | 'MODELLED'
  | 'PROMPTED'
  | 'NOT_YET';

export type ClarityRating = 'V0' | 'V1' | 'V2' | 'V3';

export type RepresentationModality =
  | 'TEXT'
  | 'AUDIO'
  | 'VISUAL'
  | 'SYNTACTIC_FRAME';

export type ProbeMode =
  | 'MODE_A_SOUND_IMAGE'
  | 'MODE_B_TEXT_IMAGE'
  | 'MODE_C_FORM_RECALL'
  | 'MODE_D_CHUNK_CLOZE'
  | 'MODE_E_TEACHER_OBSERVATION';

export type StatusBucket =
  | 'SOLID'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'UNCERTAIN'
  | 'RECHECK';

export type VocabularyGapType =
  | 'UNKNOWN_CONCEPT_OR_FORM'
  | 'SOUND_FORM_GAP'
  | 'ORTHOGRAPHIC_FORM_GAP'
  | 'MEANING_RECALL_GAP'
  | 'ENGLISH_FORM_RECALL_GAP'
  | 'CHUNK_USAGE_GAP'
  | 'CONTEXT_TRANSFER_GAP'
  | 'RETENTION_GAP'
  | 'POSSIBLE_VISUAL_ITEM_ERROR'
  | 'POSSIBLE_TASK_CONFUSION';

export interface FoundationLexicalConcept {
  id: string; // e.g. 'CON-G6-001'
  lemma: string; // e.g. 'bag'
  pos: string; // 'noun' | 'verb' | 'adj' | 'adv' | 'pronoun' | 'prep'
  ipa: string; // e.g. '/bæɡ/'
  meaning_vi: string;
  cluster: string; // 'school_nouns' | 'core_verbs' | 'food_drink' | etc.
  generative_power: number; // 0-100
  stage: number; // 0 = Lessons 1-3
  target_chunks: string[];
  contrast_concepts: string[];
}

export interface RepresentationEntity {
  id: string; // e.g. 'IMG-G6-001-v1'
  concept_id: string;
  modality: RepresentationModality;
  sub_type: string;
  content_payload: string;
  clarity_rating: ClarityRating;
  approved_diagnostic: boolean;
  approved_teaching: boolean;
  is_active?: boolean;
  metadata?: {
    aspect_ratio?: string;
    prompt_id?: string;
    contains_text?: boolean;
    is_abstract_function_word?: boolean;
    physical_asset_exists?: boolean;
    provenance?: string;
    license?: string;
    distractor_notes?: string;
    [key: string]: unknown;
  };
}

export type EvidenceSource = 'LEARNER' | 'TEACHER' | 'SYSTEM';

export interface LexicalEvidenceEvent {
  id?: string;
  actor_user_id?: string; // User ID who created/observed the evidence (teacher or learner)
  learner_id: string; // The learner being assessed
  evidence_source?: EvidenceSource; // 'LEARNER' | 'TEACHER' | 'SYSTEM'
  concept_id: string;
  representation_id?: string;
  probe_mode: ProbeMode;
  target_dimension: EvidenceDimension;
  is_correct: boolean;
  support_level: SupportLevel;
  response_latency_ms: number;
  distractor_selected?: string;
  is_category_foil?: boolean;
  variant_switch_failed?: boolean;
  is_delayed_retention_probe?: boolean;
  days_since_last_pass?: number;
  is_asr_failure?: boolean; // Observable ASR or microphone glitch; must not penalize learner
  task_aborted?: boolean; // Learner or teacher stopped task
  visual_ambiguity_suspected?: boolean; // Teacher or system observed ambiguity; non-scoring escape hatch
  lesson_id?: string;
  created_at?: string;
}

export interface LexicalState {
  concept_id: string;
  status_bucket: StatusBucket;
  active_gap: VocabularyGapType;
  sound_recognition: boolean;
  text_recognition: boolean;
  meaning_recall: boolean;
  form_recall: boolean;
  chunk_use: boolean;
  generative_use: boolean;
  retention_stable: boolean;
  uncertainty_score: number; // 0.00 (Fully certain) to 1.00 (Unprobed/Uncertain)
  last_support_level: SupportLevel;
  last_latency_ms: number;
  consecutive_independent_passes: number;
  last_probed_at?: string;
  is_instrument_invalidated?: boolean;
  invalidation_reason?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface DiagnosticProbeOptions {
  currentLessonId?: string;
  maxProbes?: number;
  maxConsecutiveUnsuccessfulProbesBeforeBreak?: number; // Configurable session fatigue safeguard (default 3)
  learnerRequestedStop?: boolean; // Observable signal
  teacherRequestedStop?: boolean; // Observable signal
  taskAborted?: boolean;
  allowHighLatencyFallback?: boolean;
}

export interface DiagnosticProbeRecommendation {
  concept_id: string;
  lemma: string;
  probe_mode: ProbeMode;
  target_dimension: EvidenceDimension;
  recommended_representation_id: string;
  reason: string;
}

export interface TeacherActionRecommendation {
  concept_id: string;
  lemma: string;
  status_bucket: StatusBucket;
  active_gap: VocabularyGapType;
  action_type: 'REVIEW' | 'TEACH' | 'PROBE' | 'IGNORE';
  prescriptive_advice: string;
  evidence_summary: string;
}
