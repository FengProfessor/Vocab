import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Represents an individual daily or milestone step inside the adaptive learning roadmap.
 */
export interface RoadmapStepDto {
  /** Unique step identifier. */
  id: string;

  /** Sequential day or step order index (1-based). */
  stepIndex: number;

  /** Display title of the roadmap milestone. */
  title: string;

  /** Summary of skills and tasks covered in this step. */
  description: string;

  /** Target roadmap level band. */
  levelId: RoadmapLevelId;

  /** Learning track type. */
  trackType: RoadmapTrackType;

  /** Current completion state for the user. */
  status: RoadmapStepStatus;

  /** Estimated study duration in minutes. */
  estimatedMinutes: number;

  /** Target route path in the SPA to execute this activity. */
  actionRoute: string;

  /** XP reward granted upon completion. */
  xpReward: number;
}
