import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';

export interface CompleteStepResultDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  xpAwarded: number;
}
