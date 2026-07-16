import { NextResponse } from 'next/server';
import { createServiceClient, type DictionaryData } from '@/lib/supabase';
import { verifyImageMeaning, resolveWordImage } from '@/lib/image-pipeline';
import { assertBotAuthorized } from '@/lib/api-security';

/**
 * POST /api/words/verify-image  Body: { word: string }
 * Chấm lại ảnh hiện tại của 1 từ trong global_dictionary bằng AI Vision.
 * Nếu điểm thấp (< 70) → tự tìm ảnh thay thế. Dùng cho nút "ảnh sai? kiểm tra lại".
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const botDenied = assertBotAuthorized(req);
    if (botDenied) return botDenied;

    const { word } = await req.json();
    if (!word) return NextResponse.json({ success: false, error: 'word required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: row, error } = await supabase
      .from('global_dictionary')
      .select('word, data, image_url, image_source, image_confidence')
      .eq('word', String(word).trim().toLowerCase())
      .maybeSingle();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!row) return NextResponse.json({ success: false, error: 'word not found' }, { status: 404 });

    const wordData = row.data as DictionaryData | null;
    const meanings = wordData?.results?.[0]?.meanings || [];
    const definition = meanings[0]?.definition || '';
    const pos = meanings[0]?.pos || '';

    // 1. Chấm ảnh hiện tại
    let currentScore: number | null = null;
    if (row.image_url) {
      const v = await verifyImageMeaning(row.image_url, { word: row.word, pos, definition });
      currentScore = v.score;
    }

    // 2. Ảnh hiện tại đủ tốt → giữ nguyên, chỉ cập nhật điểm
    if (currentScore !== null && currentScore >= 70) {
      await supabase
        .from('global_dictionary')
        .update({ image_confidence: currentScore, image_verified_at: new Date().toISOString() })
        .eq('word', row.word);
      return NextResponse.json({ success: true, changed: false, confidence: currentScore });
    }

    // 3. Ảnh kém hoặc chưa có → tìm ảnh thay thế
    const img = await resolveWordImage({
      word: row.word,
      definition,
      pos,
      imageSearchQuery: wordData?.image_search_query || '',
      meaningCount: meanings.length || 1,
      forceVision: true,
    });

    await supabase
      .from('global_dictionary')
      .update({
        image_url: img.url,
        image_source: img.source,
        image_confidence: img.confidence,
        image_query: img.query,
        image_verified_at: new Date().toISOString(),
      })
      .eq('word', row.word);

    return NextResponse.json({
      success: true,
      changed: true,
      previousConfidence: currentScore,
      image_url: img.url,
      source: img.source,
      confidence: img.confidence,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
