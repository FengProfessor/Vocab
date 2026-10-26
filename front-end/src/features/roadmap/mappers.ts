import { getRoadmapLevels, type RoadmapTrack } from '@/lib/roadmap';

/**
 * Maps client roadmap track identifiers ('cefr', 'toeic', 'ielts', 'vstep', 'thpt')
 * into the `.NET 10` `RoadmapTrackType` enum name.
 */
export function mapTrackToDotNet(track?: string | null): 'Toeic' | 'Ielts' | 'Vstep' | 'General' {
  const t = (track || 'cefr').trim().toLowerCase();
  if (t === 'toeic') return 'Toeic';
  if (t === 'ielts') return 'Ielts';
  if (t === 'vstep') return 'Vstep';
  return 'General';
}

/**
 * Builds the hydrated roadmap level/unit/step tree from the `.NET 10` `RoadmapProgressDto` payload.
 */
export function buildRoadmapTreeFromDto(
  trackParam: string | null | undefined,
  dto: Record<string, any> | null | undefined,
) {
  const track: RoadmapTrack =
    trackParam === 'thpt' ? 'thpt' : trackParam === 'toeic' ? 'toeic' : 'cefr';
  const rawLevels = getRoadmapLevels(track);
  const completedSteps: Array<{ stepId: string; status?: string; score?: number | null }> =
    Array.isArray(dto?.completedSteps) ? dto!.completedSteps : [];
  const completedMap = new Map<string, number | null>();
  for (const s of completedSteps) {
    if (s?.stepId) completedMap.set(s.stepId, s.score ?? null);
  }

  const startLevelId = String(dto?.levelId || rawLevels[0]?.id || 'A0');
  let foundCurrent = false;
  let currentStepId: string | null = null;

  const tree = rawLevels.map((lvl) => {
    const units = lvl.units.map((u) => {
      let doneInUnit = 0;
      const steps = u.steps.map((st) => {
        const isDone = completedMap.has(st.id);
        if (isDone) {
          doneInUnit++;
          return {
            ...st,
            status: 'completed' as const,
            score: completedMap.get(st.id) ?? 100,
          };
        }
        if (!foundCurrent) {
          foundCurrent = true;
          currentStepId = st.id;
          return {
            ...st,
            status: 'current' as const,
            score: null,
          };
        }
        return {
          ...st,
          status: 'locked' as const,
          score: null,
        };
      });
      const total = steps.length || 1;
      const progressPct = Math.round((doneInUnit / total) * 100);
      return {
        ...u,
        steps,
        progressPct,
        completedStepsCount: doneInUnit,
        totalStepsCount: steps.length,
        status:
          doneInUnit === steps.length
            ? ('completed' as const)
            : steps.some((x) => x.status === 'current') || doneInUnit > 0
              ? ('in-progress' as const)
              : ('locked' as const),
      };
    });
    return {
      ...lvl,
      isStartLevel: lvl.id.toLowerCase() === startLevelId.toLowerCase(),
      units,
    };
  });

  const enrolled = dto ? !dto.needsPlacement : true;
  return {
    enrolled,
    needsPlacement: Boolean(dto?.needsPlacement),
    track,
    levelId: startLevelId,
    currentStepId,
    tree,
  };
}
