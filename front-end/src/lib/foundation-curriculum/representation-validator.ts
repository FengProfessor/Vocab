/**
 * Representation Validator for Foundation Curriculum (Layer C)
 *
 * Enforces strict pedagogical and security firewalls:
 * 1. Prohibits ambiguous (V2) or misleading (V3) visual assets from diagnostic tasks.
 * 2. Rejects assets that leak text or letters.
 * 3. Prohibits static single clipart flashcards for abstract function words (want, need, know, etc.).
 * 4. Fails closed on missing physical assets, unknown provenance, or inactive representations.
 * 5. Requires V0 rating for unassisted diagnostic probes (V1 is teaching-only).
 */

import type { RepresentationEntity, ProbeMode, ValidationResult } from './types';

export function isDiagnosticRepresentationValid(
  representation: RepresentationEntity,
  taskType: ProbeMode | 'DIAGNOSTIC_SEED' | 'IN_LESSON_PROBE'
): ValidationResult {
  if (!representation) {
    return { valid: false, reason: 'Representation entity is undefined or null.' };
  }

  // 1. Inactive representation check
  if (representation.is_active === false) {
    return {
      valid: false,
      reason: 'Representation is marked inactive. Prohibited from active diagnostic sampling.',
    };
  }

  // 2. Physical Binary Asset Integrity (Fail-Closed)
  if (representation.metadata?.physical_asset_exists === false) {
    return {
      valid: false,
      reason: 'Physical binary file does not exist on disk. Diagnostic probes require verified physical assets.',
    };
  }

  // 3. Provenance and License Check (Fail-Closed)
  if (
    representation.metadata?.provenance === 'UNKNOWN' ||
    representation.metadata?.license === 'UNKNOWN'
  ) {
    return {
      valid: false,
      reason: 'Asset provenance or license is unverified. Fails closed for diagnostic testing.',
    };
  }

  // 4. Visual Modality Safeguards
  if (representation.modality === 'VISUAL') {
    // Clarity rating check: V2 and V3 are strictly forbidden for diagnostic trials
    if (representation.clarity_rating === 'V2' || representation.clarity_rating === 'V3') {
      return {
        valid: false,
        reason: `Visual asset clarity is rated ${representation.clarity_rating} (ambiguous or misleading). Prohibited in diagnostic tasks to prevent penalizing the learner for instrument error.`,
      };
    }

    // Diagnostic approval flag (Strict V0 requirement)
    if (representation.clarity_rating === 'V1' && (taskType === 'DIAGNOSTIC_SEED' || taskType.startsWith('MODE_'))) {
      return {
        valid: false,
        reason: 'Visual asset clarity is rated V1 (Teaching Variant). Prohibited in unassisted diagnostic probes; only canonical V0 assets are approved for diagnostics.',
      };
    }

    if (!representation.approved_diagnostic) {
      return {
        valid: false,
        reason: 'Visual asset is not certified for diagnostic probes (approved_diagnostic must be true, requiring canonical V0 rating).',
      };
    }

    // Text leakage check
    if (representation.metadata?.contains_text) {
      return {
        valid: false,
        reason: 'Visual asset contains printed text or typography, which invalidates pure auditory/conceptual mapping.',
      };
    }

    // Abstract function word prohibition check
    if (representation.metadata?.is_abstract_function_word) {
      return {
        valid: false,
        reason: 'Abstract function words (want, need, know, because, can) are strictly prohibited from standalone visual flashcards.',
      };
    }
  }

  // 5. Modality vs Probe Mode Alignment
  if (taskType === 'MODE_A_SOUND_IMAGE') {
    // In Mode A (Sound -> Image), text representations must not be presented to the student
    if (representation.modality === 'TEXT') {
      return {
        valid: false,
        reason: 'Text modality is prohibited in Mode A (Auditory Sound-to-Image) probe to prevent orthographic cues.',
      };
    }
  }

  return { valid: true };
}
