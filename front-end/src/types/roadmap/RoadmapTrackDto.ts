import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Metadata configuration for an academic or standardized test preparation track.
 */
export interface RoadmapTrackDto {
  /** Strongly typed track identifier. */
  track: RoadmapTrackType;
  /** Vietnamese display title. */
  label: string;
  /** Explanatory description. */
  description: string;
  /** Available target band labels in this track. */
  targetBands: string[];
}
