import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';

/**
 * Client display metadata for a concrete learning activity step in the roadmap.
 */
export interface RoadmapStepMetadataDto {
  /** Step unique identifier (matches the server step id). */
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
  /** Checkpoint / exit-exam stations require a score of at least 80% to unlock the next station. */
  isCheckpointOrExam: boolean;
  /** Step completion status derived from the server progress. */
  status: RoadmapStepStatus;
}
