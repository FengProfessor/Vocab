import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

export interface RoadmapPlacementModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Currently selected track. */
  track: RoadmapTrackType;
  /** Callback to close the modal. */
  onClose: () => void;
}
