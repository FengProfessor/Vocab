import { FoundationClarityRating } from '@/types/enums/FoundationClarityRating';

/**
 * Self-rating choices offered after a recording (V0 "not attempted" is excluded).
 */
export const CLARITY_RATING_OPTIONS: ReadonlyArray<{ rating: FoundationClarityRating; label: string }> = [
  { rating: FoundationClarityRating.V1, label: 'V1 — Khó nghe' },
  { rating: FoundationClarityRating.V2, label: 'V2 — Khá rõ' },
  { rating: FoundationClarityRating.V3, label: 'V3 — Rất rõ' },
];
