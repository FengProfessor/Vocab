import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { getRoadmapLevels, orderedStepIds, ROADMAP_VERSION, levelOrder, type RoadmapLevelId, type RoadmapTrack } from '@/lib/roadmap';

/**
 * GET /api/roadmap — cây lộ trình + progress user + trạng thái unlock.
 * Trả { enrolled, levelId, tree } — tree đã merge status từng step:
 *   completed | current (step kế tiếp được học) | locked
 * Quy tắc unlock: tuần tự toàn cục từ unit đầu của CẤP user chọn (các cấp thấp hơn coi như mở sẵn để ôn).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();

    const { data: enrollment } = await supabase
      .from('user_roadmap')
      .select('level_id, roadmap_version, current_unit_id, started_at, track')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ success: true, data: { enrolled: false } });
    }

    const track = (enrollment.track ?? 'cefr') as RoadmapTrack;
    const ORDER = levelOrder(track);

    const { data: stepRows } = await supabase
      .from('user_roadmap_steps')
      .select('step_id, status, score, completed_at')
      .eq('user_id', auth.userId);
    const doneSteps = new Map((stepRows ?? []).map((r) => [r.step_id, r]));

    const startLevel = enrollment.level_id as RoadmapLevelId;
    const startLevelIdx = ORDER.indexOf(startLevel);

    // Step đầu tiên chưa hoàn thành TÍNH TỪ cấp bắt đầu = "current"; sau nó = locked.
    const ordered = orderedStepIds(track);
    const levels = getRoadmapLevels(track);
    const levelOfStep = new Map<string, number>();
    for (const level of levels) {
      const idx = ORDER.indexOf(level.id);
      for (const unit of level.units) for (const step of unit.steps) levelOfStep.set(step.id, idx);
    }
    const scopedOrdered = ordered.filter((id) => (levelOfStep.get(id) ?? 0) >= startLevelIdx);
    const currentStepId = scopedOrdered.find((id) => doneSteps.get(id)?.status !== 'completed') ?? null;
    const currentPos = currentStepId ? scopedOrdered.indexOf(currentStepId) : scopedOrdered.length;

    const tree = levels.map((level) => {
      const levelIdx = ORDER.indexOf(level.id);
      return {
        id: level.id,
        title: level.title,
        titleVi: level.titleVi,
        description: level.description,
        isStartLevel: level.id === startLevel,
        units: level.units.map((unit) => ({
          id: unit.id,
          index: unit.index,
          title: unit.title,
          steps: unit.steps.map((step) => {
            const done = doneSteps.get(step.id);
            let status: 'completed' | 'current' | 'locked' | 'review';
            if (done?.status === 'completed') status = 'completed';
            else if (levelIdx < startLevelIdx) status = 'review'; // cấp dưới cấp bắt đầu: mở tự do để ôn
            else if (step.id === currentStepId) status = 'current';
            else {
              const pos = scopedOrdered.indexOf(step.id);
              status = pos >= 0 && pos < currentPos ? 'current' : 'locked';
            }
            return { ...step, status, score: done?.score ?? null };
          }),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        enrolled: true,
        roadmapVersion: ROADMAP_VERSION,
        track,
        levelId: startLevel,
        currentStepId,
        tree,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
