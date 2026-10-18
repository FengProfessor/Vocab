import { SrsAlgorithmVersion } from '@/types/enums/SrsAlgorithmVersion';
import { SrsCardScheduleDto } from '@/types/vocab/SrsCardScheduleDto';

/**
 * Represents the computed output of an FSRS v5 flashcard review evaluation.
 */
export interface SrsReviewResultDto extends SrsCardScheduleDto {
  /** Next due timestamp in ISO 8601 format. */
  nextReviewAt: string;

  /** Estimated probability of recall (R) at the moment of review [0..1]. */
  retrievability: number;

  /** Algorithm version used to compute this schedule. */
  algorithmVersion: SrsAlgorithmVersion;
}
