import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { resolveWordImage } from '@/lib/image-pipeline';

/**
 * POST /api/words/refresh-image  Body: { wordId }
 * Tìm ảnh mới cho 1 từ trong personal list. Ép AI Vision kiểm chứng
 * vì user chủ động yêu cầu đổi ảnh (ảnh cũ bị cho là sai).
 */
export async function POST(req: Request) {
  try {
    const { wordId } = await req.json();
    if (!wordId) return NextResponse.json({ error: 'wordId required' }, { status: 400 });

    const supabase = createServiceClient();

    const { data: word, error: fetchErr } = await supabase
      .from('words')
      .select('word, translation, pos, example')
      .eq('id', wordId)
      .single();

    if (fetchErr || !word) throw new Error('Word not found');

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
  } catch (err: any) {
    console.error('Refresh image error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
