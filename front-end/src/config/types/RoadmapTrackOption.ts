import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Presentation metadata of a roadmap track in the selector.
 */
export interface RoadmapTrackOption {
  /** Track identifier sent to the API. */
  value: RoadmapTrackType;
  /** Vietnamese label. */
  label: string;
  /** Icon displayed before the label. */
  icon: React.ReactNode;
}
