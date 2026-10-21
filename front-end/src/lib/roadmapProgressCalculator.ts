import { RoadmapStepStatus } from '@/types/enums/RoadmapStepStatus';
import { RoadmapStationBlueprint } from '@/types/roadmap/RoadmapStationBlueprint';
import { RoadmapStepMetadataDto } from '@/types/roadmap/RoadmapStepMetadataDto';

/**
 * Pure domain logic turning the static station list and the server progress into displayable steps.
 * Unlock rule (SRS_03): a station is open when it is the first one or the previous station is completed.
 */
export class RoadmapProgressCalculator {
  /**
   * Applies the completed step ids onto the blueprints, computing Locked / InProgress / Completed.
   */
  public static buildSteps(
    blueprints: readonly RoadmapStationBlueprint[],
    completedStepIds: ReadonlySet<string>
  ): RoadmapStepMetadataDto[] {
    return blueprints.map((blueprint, index) => {
      const isCompleted = completedStepIds.has(blueprint.id);
      const previousCompleted = index === 0 || completedStepIds.has(blueprints[index - 1].id);

      let status = RoadmapStepStatus.Locked;
      if (isCompleted) {
        status = RoadmapStepStatus.Completed;
      } else if (previousCompleted) {
        status = RoadmapStepStatus.InProgress;
      }

      return {
        stepId: blueprint.id,
        title: blueprint.title,
        description: blueprint.description,
        actionRoute: blueprint.actionRoute,
        estimatedMinutes: blueprint.estimatedMinutes,
        xpReward: blueprint.xpReward,
        isCheckpointOrExam: blueprint.isCheckpointOrExam,
        status,
      };
    });
  }

  /**
   * Completion percentage (0..100) over all steps.
   */
  public static completionPercent(steps: readonly RoadmapStepMetadataDto[]): number {
    if (steps.length === 0) {
      return 0;
    }
    const completed = steps.filter((s) => s.status === RoadmapStepStatus.Completed).length;
    return Math.round((completed / steps.length) * 100);
  }
}
