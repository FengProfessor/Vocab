/**
 * Static definition of one roadmap station, before the learner's progress is applied.
 */
export interface RoadmapStationBlueprint {
  /** Stable station id persisted on the server. */
  id: string;
  /** Display title. */
  title: string;
  /** Activity description. */
  description: string;
  /** SPA route that runs the activity. */
  actionRoute: string;
  /** Estimated duration in minutes. */
  estimatedMinutes: number;
  /** XP shown as the expected reward. */
  xpReward: number;
  /** Whether this station is a checkpoint or exit exam (passing score 80%). */
  isCheckpointOrExam: boolean;
}
