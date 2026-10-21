import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { ServerRoadmapStepDto } from '@/types/roadmap/ServerRoadmapStepDto';

export interface ServerRoadmapProgressDto {
  track: RoadmapTrackType | string;
  enrolled: boolean;
  needsPlacement: boolean;
  levelId: RoadmapLevelId | string | null;
  currentUnitId: string | null;
  completedSteps: ServerRoadmapStepDto[];
}
