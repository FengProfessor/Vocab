import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { resolveStepAny, orderedStepIds, getRoadmapLevels, levelOrder, type RoadmapLevelId, type RoadmapTrack } from '@/lib/roadmap';
import { checkRoadmapLevelAccess, getEffectivePlan, type Plan } from '@/lib/entitlement';
import { creditRoadmapFromLibrary } from '@/lib/roadmap-credit';

const XP_PER_STEP = 15;
const XP_CHECKPOINT_BONUS = 30;
const CHECKPOINT_PASS_PCT = 80;

/**
 * POST /api/roadmap/progress — hoàn thành 1 step.
 * Body: { stepId: string, score?: number } — score % cho checkpoint (bắt buộc ≥80 mới pass).
 * Track suy ra từ step_id; enrollment theo (user_id, track). Fallback schema cũ 1 hàng/user.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const body = await req.json();
    const stepId = typeof body?.stepId === 'string' ? body.stepId : '';
    const score = typeof body?.score === 'number' ? Math.round(body.score) : null;

    const resolved = resolveStepAny(stepId);
    if (!resolved) return NextResponse.json({ success: false, error: 'Step không tồn tại' }, { status: 400 });
    const { entry, track } = resolved;
    const ORDER = levelOrder(track);

    const supabase = createServiceClient();

    // Ưu tiên enrollment đúng track; fallback schema cũ (1 hàng/user)
    let enrollRow: { level_id: string; track: string | null } | null = null;
    const { data: byTrack } = await supabase
      .from('user_roadmap')
      .select('level_id, track')
      .eq('user_id', auth.userId)
      .eq('track', track)
      .maybeSingle();
    if (byTrack) {
      enrollRow = byTrack;
    } else {
      const { data: legacy } = await supabase
        .from('user_roadmap')
        .select('level_id, track')
        .eq('user_id', auth.userId)
        .maybeSingle();
      if (legacy && ((legacy.track ?? 'cefr') as RoadmapTrack) === track) {
        enrollRow = legacy;
      }
    }
    if (!enrollRow) {
      return NextResponse.json({ success: false, error: 'Chưa ghi danh lộ trình này' }, { status: 400 });
    }

    // Level-gate theo gói CHỈ áp track CEFR (THPT chưa gate). Free = hết A1.
    if (track === 'cefr') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', auth.userId)
        .maybeSingle();
      const plan = getEffectivePlan(profile?.plan as Plan | undefined, profile?.plan_expires_at as string | null | undefined);
      const levelAccess = checkRoadmapLevelAccess(plan, entry.level.id as 'A0' | 'A1' | 'A2' | 'B1' | 'B2');
      if (!levelAccess.allowed) {
        return NextResponse.json({
          success: false,
          error: `Cấp ${entry.level.id} thuộc gói Pro. Nâng cấp để mở toàn bộ lộ trình A2 → B2 nhé!`,
          data: { upgradeTo: levelAccess.upgradeTo },
        }, { status: 403 });
      }
    }

    // Checkpoint/đề mini phải đủ điểm pass
    if ((entry.step.type === 'checkpoint' || entry.step.type === 'exam') && (score === null || score < CHECKPOINT_PASS_PCT)) {
      return NextResponse.json({
        success: false,
        error: `Checkpoint cần đạt ≥${CHECKPOINT_PASS_PCT}% (hiện tại ${score ?? 0}%). Ôn lại chặng rồi thử lại nhé!`,
      }, { status: 422 });
    }

    // Validate tuần tự trong phạm vi từ cấp bắt đầu (cấp thấp hơn = ôn tự do, không chặn)
    const startIdx = ORDER.indexOf(enrollRow.level_id as RoadmapLevelId);
    const stepLevelIdx = ORDER.indexOf(entry.level.id);
    if (stepLevelIdx >= startIdx) {
      const levels = getRoadmapLevels(track);
      const levelOfStep = new Map<string, number>();
      for (const level of levels) {
        const idx = ORDER.indexOf(level.id);
        for (const unit of level.units) for (const step of unit.steps) levelOfStep.set(step.id, idx);
      }
      const scoped = orderedStepIds(track).filter((id) => (levelOfStep.get(id) ?? 0) >= startIdx);
      const position = scoped.indexOf(stepId);
      const priorIds = scoped.slice(0, position);
      if (priorIds.length > 0) {
        // Credit gói/topic đã học trong kho trước khi check tuần tự (tránh kẹt vì học ngoài journey)
        const { data: allDoneRows } = await supabase
          .from('user_roadmap_steps')
          .select('step_id')
          .eq('user_id', auth.userId)
          .eq('status', 'completed');
        await creditRoadmapFromLibrary(
          supabase,
          auth.userId,
          track,
          enrollRow.level_id as RoadmapLevelId,
          new Set((allDoneRows ?? []).map((r) => r.step_id as string)),
        );

        const { data: doneRows } = await supabase
          .from('user_roadmap_steps')
          .select('step_id')
          .eq('user_id', auth.userId)
          .eq('status', 'completed')
          .in('step_id', priorIds);
        const doneSet = new Set((doneRows ?? []).map((r) => r.step_id));
        const missing = priorIds.filter((id) => !doneSet.has(id));
        if (missing.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Chặng này chưa mở — hoàn thành các bước trước đã nhé!',
            data: { missingSteps: missing.slice(0, 5) },
          }, { status: 400 });
        }
      }
    }

    const { error: upsertErr } = await supabase.from('user_roadmap_steps').upsert({
      user_id: auth.userId,
      step_id: stepId,
      status: 'completed',
      score,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,step_id' });
    if (upsertErr) throw new Error(upsertErr.message);

    // Cập nhật current_unit_id theo đúng track
    const { error: unitErr } = await supabase.from('user_roadmap').update({
      current_unit_id: entry.unit.id,
      updated_at: new Date().toISOString(),
    }).eq('user_id', auth.userId).eq('track', track);
    if (unitErr) {
      const { error: legacyUnitErr } = await supabase.from('user_roadmap').update({
        current_unit_id: entry.unit.id,
        updated_at: new Date().toISOString(),
      }).eq('user_id', auth.userId);
      if (legacyUnitErr) console.error('[Roadmap] update current_unit failed:', legacyUnitErr.message);
    }

    const isBig = entry.step.type === 'checkpoint' || entry.step.type === 'exam';
    const xp = isBig ? XP_PER_STEP + XP_CHECKPOINT_BONUS : XP_PER_STEP;
    const { error: xpError } = await supabase.rpc('award_xp', { p_user_id: auth.userId, p_xp: xp });
    if (xpError) console.error('[Gamification] award_xp failed:', xpError.message);

    const unitCompleted = isBig;
    const levelCompleted = unitCompleted && entry.unit.index === entry.level.units.length;

    return NextResponse.json({
      success: true,
      data: { stepId, xpAwarded: xp, unitCompleted, levelCompleted, levelId: entry.level.id },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
