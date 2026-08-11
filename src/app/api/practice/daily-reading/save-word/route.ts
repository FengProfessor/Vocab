import { NextResponse } from 'next/server';
import { getAuthUser, isValidString } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/practice/daily-reading/save-word
 *
 * Save a bonus vocabulary word from a daily reading exercise into the user's
 * word bank (classroom words table) and initialize SRS progress.
 *
 * Body: { word, translation, pos?, classroomId, exerciseId? }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth?.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      word?: string;
      translation?: string;
      pos?: string;
      classroomId?: string;
      exerciseId?: string;
    };

    const word = (body.word || '').trim().toLowerCase();
    const translation = (body.translation || '').trim();
    const pos = (body.pos || '').trim();
    const classroomId = (body.classroomId || '').trim();

    if (!word || !isValidString(word, 50)) {
      return NextResponse.json({ success: false, error: 'Invalid word' }, { status: 400 });
    }
    if (!translation || !isValidString(translation, 200)) {
      return NextResponse.json({ success: false, error: 'Invalid translation' }, { status: 400 });
    }
    if (!classroomId) {
      return NextResponse.json({ success: false, error: 'Missing classroomId' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify enrollment or teacher ownership
    const [{ data: enrolled }, { data: owned }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', auth.userId)
        .eq('classroom_id', classroomId)
        .maybeSingle(),
      supabase
        .from('classrooms')
        .select('id')
        .eq('id', classroomId)
        .eq('teacher_id', auth.userId)
        .maybeSingle(),
    ]);

    if (!enrolled && !owned) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this classroom' },
        { status: 403 },
      );
    }

    // Check if word already exists in this classroom
    const { data: existing } = await supabase
      .from('words')
      .select('id')
      .eq('classroom_id', classroomId)
      .ilike('word', word)
      .maybeSingle();

    let wordId: string;

    if (existing) {
      wordId = existing.id;
    } else {
      // Insert new word
      const { data: newWord, error: insertErr } = await supabase
        .from('words')
        .insert({
          classroom_id: classroomId,
          added_by: auth.userId,
          word,
          translation,
          pos: pos || null,
        })
        .select('id')
        .single();

      if (insertErr) {
        return NextResponse.json(
          { success: false, error: `Lưu từ thất bại: ${insertErr.message}` },
          { status: 500 },
        );
      }
      wordId = newWord.id;
    }

    // Initialize SRS progress (if not exists)
    const { error: srsErr } = await supabase.from('srs_progress').upsert(
      {
        user_id: auth.userId,
        word_id: wordId,
        ease_factor: 2.5,
        interval_days: 1,
        review_count: 0,
        next_review_date: new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'user_id,word_id' },
    );

    if (srsErr) {
      console.warn('[SaveWord] SRS upsert error:', srsErr.message);
    }

    return NextResponse.json({
      success: true,
      wordId,
      isNew: !existing,
      message: existing ? 'Từ đã có — đã thêm vào ôn tập' : 'Đã lưu từ mới!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SaveWord] error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
