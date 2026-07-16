import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';
import { getPlacement, scorePlacement, levelOrder, ROADMAP_VERSION, type RoadmapLevelId, type RoadmapTrack } from '@/lib/roadmap';

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
 * POST /api/roadmap/placement — xếp cấp + ghi danh 1 track (không đè track kia).
 * Body:
 *   CEFR: { track?: 'cefr', answers } HOẶC { track?: 'cefr', selfSelect: 'A0'..'B2' }
 *   THPT: { track: 'thpt', selfSelect: 'lop-10'|'lop-11'|'lop-12' } (chọn lớp thẳng, 10/11/12 đều được)
 * Upsert theo (user_id, track) — migration 20260716_roadmap_multi_track.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const body = await req.json();

    const track = (body?.track === 'thpt' ? 'thpt' : 'cefr') as RoadmapTrack;
    const ORDER = levelOrder(track);

    let levelId: RoadmapLevelId;
    let placementRecord: Record<string, unknown> | null = null;

    if (typeof body?.selfSelect === 'string') {
      if (!ORDER.includes(body.selfSelect as RoadmapLevelId)) {
        return NextResponse.json({ success: false, error: 'Cấp/lớp không hợp lệ' }, { status: 400 });
      }
      levelId = body.selfSelect as RoadmapLevelId;
      placementRecord = { mode: 'self-select', track, levelId };
    } else if (track === 'cefr' && body?.answers && typeof body.answers === 'object') {
      const answers = body.answers as Record<string, string>;
      levelId = scorePlacement(answers);
      const questions = getPlacement().questions;
      const correct = questions.filter((q) => answers[q.id] === q.answer).length;
      placementRecord = { mode: 'test', track, levelId, correct, total: questions.length, answers };
    } else {
      return NextResponse.json({ success: false, error: 'Thiếu answers hoặc selfSelect' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const row = {
      user_id: auth.userId,
      roadmap_version: ROADMAP_VERSION,
      track,
      level_id: levelId,
      placement: placementRecord,
      updated_at: new Date().toISOString(),
    };
    // Multi-track PK (user_id, track). Fallback schema cũ PK user_id (ghi đè 1 hàng).
    const { error } = await supabase.from('user_roadmap').upsert(row, { onConflict: 'user_id,track' });
    if (error) {
      const { error: legacyErr } = await supabase.from('user_roadmap').upsert(row, { onConflict: 'user_id' });
      if (legacyErr) throw new Error(legacyErr.message);
    }

    return NextResponse.json({ success: true, data: { track, levelId } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
