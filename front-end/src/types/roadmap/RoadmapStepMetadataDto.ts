import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';

/**
 * Client display metadata for a concrete learning activity step in the roadmap.
 */
export interface RoadmapStepMetadataDto {
  /** Step unique identifier. */
  stepId: string;
  /** Display title. */
  title: string;
  /** Activity description and instructions. */
  description: string;
  /** Target React Router navigation route. */
  actionRoute: string;
  /** Estimated completion time in minutes. */
  estimatedMinutes: number;
  /** XP rewarded on successful completion. */
  xpReward: number;
  /** Step completion status. */
  status: RoadmapStepStatus;
  /** Optional completion score (0..100). */
  score?: number | null;
}
