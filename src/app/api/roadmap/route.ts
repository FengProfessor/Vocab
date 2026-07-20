import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { getRoadmapLevels, orderedStepIds, ROADMAP_VERSION, levelOrder, type RoadmapLevelId, type RoadmapTrack } from '@/lib/roadmap';
import { creditRoadmapFromLibrary } from '@/lib/roadmap-credit';

type EnrollmentRow = {
  level_id: string;
  roadmap_version: string;
  current_unit_id: string | null;
  started_at: string;
  track: string | null;
};

type StepRow = { step_id: string; status: string; score: number | null; completed_at: string | null };

/**
 * GET /api/roadmap?track=cefr|thpt
 * - 1 user có thể ghi danh CẢ 2 track (sau migration multi-track).
 * - Không ?track → ưu tiên track query local / enrollment mới nhất.
 * - Trả enrollments[] luôn (kể cả khi track đang xem chưa ghi danh → needsPlacement).
 * - Tự credit step vocab/grammar đã học trong kho (không XP) để không kẹt next.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();

    const { data: rows } = await supabase
      .from('user_roadmap')
      .select('level_id, roadmap_version, current_unit_id, started_at, track')
      .eq('user_id', auth.userId)
      .order('updated_at', { ascending: false });

    const enrollments = ((rows ?? []) as EnrollmentRow[]).map((r) => ({
      track: (r.track === 'thpt' ? 'thpt' : 'cefr') as RoadmapTrack,
      levelId: r.level_id as RoadmapLevelId,
      startedAt: r.started_at,
    }));

    if (enrollments.length === 0) {
      return NextResponse.json({ success: true, data: { enrolled: false, enrollments: [] } });
    }

    const qTrack = req.nextUrl.searchParams.get('track');
    const preferred: RoadmapTrack | null =
      qTrack === 'thpt' || qTrack === 'cefr' ? qTrack : null;
    const activeEnrollment =
      (preferred ? enrollments.find((e) => e.track === preferred) : null) ??
      enrollments[0];

    // Track được chọn nhưng chưa ghi danh → vẫn trả enrollments để UI bật tab + form placement
    if (preferred && !enrollments.some((e) => e.track === preferred)) {
      return NextResponse.json({
        success: true,
        data: {
          enrolled: true,
          enrollments,
          track: preferred,
          needsPlacement: true,
          roadmapVersion: ROADMAP_VERSION,
        },
      });
    }

    const track = activeEnrollment.track;
    const ORDER = levelOrder(track);
    const startLevel = activeEnrollment.levelId;
    const startLevelIdx = Math.max(0, ORDER.indexOf(startLevel));

    let { data: stepRows } = await supabase
      .from('user_roadmap_steps')
      .select('step_id, status, score, completed_at')
      .eq('user_id', auth.userId);

    // Gói/topic đã học trong kho → ghi step completed (fix kẹt "xong rồi mà không next")
    const doneBefore = new Set(
      ((stepRows ?? []) as StepRow[])
        .filter((r) => r.status === 'completed')
        .map((r) => r.step_id),
    );
    const credit = await creditRoadmapFromLibrary(
      supabase,
      auth.userId,
      track,
      startLevel,
      doneBefore,
    );
    if (credit.creditedStepIds.length > 0) {
      const resync = await supabase
        .from('user_roadmap_steps')
        .select('step_id, status, score, completed_at')
        .eq('user_id', auth.userId);
      stepRows = resync.data;
    }

    const doneSteps = new Map(((stepRows ?? []) as StepRow[]).map((r) => [r.step_id, r]));

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
            else if (levelIdx < startLevelIdx) status = 'review';
            else if (step.id === currentStepId) status = 'current';
            else {
              const pos = scopedOrdered.indexOf(step.id);
              status = pos >= 0 && pos < currentPos ? 'current' : 'locked';
            }
            const fromLibrary = credit.creditedStepIds.includes(step.id);
            return { ...step, status, score: done?.score ?? null, fromLibrary: fromLibrary || undefined };
          }),
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        enrolled: true,
        enrollments,
        needsPlacement: false,
        roadmapVersion: ROADMAP_VERSION,
        track,
        levelId: startLevel,
        currentStepId,
        creditedFromLibrary: credit.creditedStepIds.length,
        tree,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
