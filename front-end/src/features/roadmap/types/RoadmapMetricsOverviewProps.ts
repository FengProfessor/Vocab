import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Props for the RoadmapMetricsOverview component.
 */
export interface RoadmapMetricsOverviewProps {
  /** Level id the learner enrolled at, or null when not enrolled yet. */
  levelId: string | null;
  /** Active track. */
  track: RoadmapTrackType;
  /** Overall completion percentage. */
  completionPercent: number;
  /** Number of completed stations. */
  completedCount: number;
  /** Total stations. */
  totalCount: number;
  /** Learner streak in days. */
  streakDays: number;
  /** Learner total XP. */
  totalXp: number;
  /** Whether data is loading from the server. */
  isLoading?: boolean;
  /** Opens the level selection modal. */
  onOpenPlacementModal: () => void;
}
