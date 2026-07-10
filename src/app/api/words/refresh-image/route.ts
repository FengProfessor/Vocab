import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveWordImage } from '@/lib/image-pipeline';
import { getAuthUser, unauthorized, checkRateLimitAsync } from '@/lib/api-security';

/**
 * POST /api/words/refresh-image  Body: { wordId }
 * Auth: Bearer JWT required. Chỉ chủ từ (added_by) hoặc teacher của classroom được đổi ảnh.
 * Tìm ảnh mới cho 1 từ trong personal list. Ép AI Vision kiểm chứng
 * vì user chủ động yêu cầu đổi ảnh (ảnh cũ bị cho là sai).
 */
export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimitAsync(`refresh-image:${auth.userId}`, 10, 60_000); // 10 req/min per user
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const { wordId } = await req.json();
    if (!wordId) return NextResponse.json({ success: false, error: 'wordId required' }, { status: 400 });

    const supabase = createServiceClient();

    const { data: word, error: fetchErr } = await supabase
      .from('words')
      .select('word, translation, pos, example, added_by, classroom:classrooms(teacher_id)')
      .eq('id', wordId)
      .single();

    if (fetchErr || !word) throw new Error('Word not found');

    // Ownership: user phải là người thêm từ HOẶC teacher của classroom chứa từ
    const cls = word.classroom as { teacher_id?: string } | { teacher_id?: string }[] | null;
    const teacherId = Array.isArray(cls) ? cls[0]?.teacher_id : cls?.teacher_id;
    if (word.added_by !== auth.userId && teacherId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Pipeline tự sinh query thông minh + đa nguồn + validate + AI Vision
    const img = await resolveWordImage({
      word: word.word,
      pos: word.pos || '',
      definition: word.translation || '',
      exampleSentence: word.example || '',
      forceVision: true,
    });

    if (!img.url) throw new Error('Could not find a better image');

    await supabase
      .from('words')
      .update({
        image_url: img.url,
        image_source: img.source,
        image_confidence: img.confidence,
      })
      .eq('id', wordId);

    return NextResponse.json({
      success: true,
      imageUrl: img.url,
      source: img.source,
      confidence: img.confidence,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Refresh image error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
