import { RoadmapStepMetadataDto } from '@/types/roadmap/RoadmapStepMetadataDto';

/**
 * Props for the RoadmapStepCard component.
 */
export interface RoadmapStepCardProps {
  /** Sequential index of the step (1-based). */
  stepNumber: number;
  /** Step metadata and status. */
  step: RoadmapStepMetadataDto;
  /** Whether a completion request is in flight. */
  isCompleting: boolean;
  /** Marks the step as completed through the API. */
  onCompleteStep: (step: RoadmapStepMetadataDto) => void;
}
