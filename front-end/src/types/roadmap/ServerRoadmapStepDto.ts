import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';

export interface ServerRoadmapStepDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  score: number | null;
  completedAt: string | null;
}
