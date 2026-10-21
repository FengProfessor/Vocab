import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

export interface RoadmapTrackSelectorProps {
  /** Currently selected roadmap track. */
  activeTrack: RoadmapTrackType;
  /** Callback fired when user selects a different track. */
  onChangeTrack: (track: RoadmapTrackType) => void;
}
