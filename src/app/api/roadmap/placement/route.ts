import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { getPlacement, scorePlacement, ROADMAP_LEVEL_ORDER, ROADMAP_VERSION, type RoadmapLevelId } from '@/lib/roadmap';

/** GET /api/roadmap/placement — bộ câu hỏi (KHÔNG kèm đáp án). */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const placement = getPlacement();
    return NextResponse.json({
      success: true,
      data: {
        version: placement.version,
        questions: placement.questions.map(({ answer: _answer, ...q }) => q),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/roadmap/placement — xếp cấp + ghi danh lộ trình.
 * Body: { answers: Record<questionId, chosen> } HOẶC { selfSelect: 'A0'|'A1'|'A2'|'B1'|'B2' }.
 * Idempotent: gọi lại sẽ cập nhật cấp (cho phép làm lại placement/đổi cấp).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const body = await req.json();

    let levelId: RoadmapLevelId;
    let placementRecord: Record<string, unknown> | null = null;

    if (typeof body?.selfSelect === 'string') {
      if (!ROADMAP_LEVEL_ORDER.includes(body.selfSelect as RoadmapLevelId)) {
        return NextResponse.json({ success: false, error: 'Cấp không hợp lệ' }, { status: 400 });
      }
      levelId = body.selfSelect as RoadmapLevelId;
      placementRecord = { mode: 'self-select', levelId };
    } else if (body?.answers && typeof body.answers === 'object') {
      const answers = body.answers as Record<string, string>;
      levelId = scorePlacement(answers);
      const questions = getPlacement().questions;
      const correct = questions.filter((q) => answers[q.id] === q.answer).length;
      placementRecord = { mode: 'test', levelId, correct, total: questions.length, answers };
    } else {
      return NextResponse.json({ success: false, error: 'Thiếu answers hoặc selfSelect' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.from('user_roadmap').upsert({
      user_id: auth.userId,
      roadmap_version: ROADMAP_VERSION,
      level_id: levelId,
      placement: placementRecord,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data: { levelId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
