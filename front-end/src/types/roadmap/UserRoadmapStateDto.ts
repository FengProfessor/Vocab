import { RoadmapAssessmentTier } from '@/types/enums/RoadmapAssessmentTier';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { RoadmapStepDto } from '@/types/roadmap/RoadmapStepDto';

/**
 * Represents the user's personalized learning roadmap state and progress metrics.
 */
export interface UserRoadmapStateDto {
  /** Active proficiency band. */
  currentLevel: RoadmapLevelId;

  /** Active curriculum track. */
  trackType: RoadmapTrackType;

  /** Diagnostic placement tier. */
  assessmentTier: RoadmapAssessmentTier;

  /** Overall completion percentage (0..100). */
  completionPercent: number;

  /** Current active day number in the roadmap. */
  currentDay: number;

  /** Ordered list of roadmap steps. */
  steps: RoadmapStepDto[];
}
