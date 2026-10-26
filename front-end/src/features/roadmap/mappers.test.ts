import { describe, expect, it } from 'vitest';
import { buildRoadmapTreeFromDto, mapTrackToDotNet } from '@/features/roadmap/mappers';

describe('roadmap mappers', () => {
  it('maps track names to .NET 10 RoadmapTrackType enum strings', () => {
    expect(mapTrackToDotNet('toeic')).toBe('Toeic');
    expect(mapTrackToDotNet('TOEIC')).toBe('Toeic');
    expect(mapTrackToDotNet('ielts')).toBe('Ielts');
    expect(mapTrackToDotNet('vstep')).toBe('Vstep');
    expect(mapTrackToDotNet('cefr')).toBe('General');
    expect(mapTrackToDotNet(null)).toBe('General');
    expect(mapTrackToDotNet(undefined)).toBe('General');
  });

  it('builds a roadmap tree from DTO with completed, current, and locked steps', () => {
    const initialTree = buildRoadmapTreeFromDto('cefr', null);
    expect(initialTree.track).toBe('cefr');
    expect(initialTree.tree.length).toBeGreaterThan(0);

    const firstLevel = initialTree.tree[0];
    const firstUnit = firstLevel.units[0];
    const firstStepId = firstUnit.steps[0].id;
    const secondStepId = firstUnit.steps[1]?.id;

    const hydrated = buildRoadmapTreeFromDto('cefr', {
      levelId: firstLevel.id,
      needsPlacement: false,
      completedSteps: [{ stepId: firstStepId, score: 95 }],
    });

    expect(hydrated.enrolled).toBe(true);
    expect(hydrated.needsPlacement).toBe(false);
    expect(hydrated.levelId).toBe(firstLevel.id);

    const hydratedFirstStep = hydrated.tree[0].units[0].steps[0];
    expect(hydratedFirstStep.status).toBe('completed');
    expect(hydratedFirstStep.score).toBe(95);

    if (secondStepId) {
      const hydratedSecondStep = hydrated.tree[0].units[0].steps[1];
      expect(hydratedSecondStep.status).toBe('current');
      expect(hydrated.currentStepId).toBe(secondStepId);
    }
  });
});
