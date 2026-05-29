import { NextResponse } from 'next/server';
import { createServiceClient, type DictionaryData } from '@/lib/supabase';
import { resolveWordImage } from '@/lib/image-pipeline';

/**
 * POST /api/bot/fill-images
 * Backfill ảnh cho các từ đã có trong DB nhưng chưa có image_url
 * Body: { limit?: number } — mặc định 100
 */
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const { limit = 100 } = await req.json().catch(() => ({}));
        const supabase = createServiceClient();

        // Get words with no real image: null URL, or source is none/null
        const { data: words, error } = await supabase
            .from('global_dictionary')
            .select('word, data, image_url, image_source')
            .or('image_url.is.null,image_source.is.null,image_source.eq.none')
            .limit(limit);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!words || words.length === 0) {
            return NextResponse.json({ success: true, message: 'Tất cả từ đã có ảnh!', updated: 0 });
        }

        console.log(`[FILL-IMAGES] Processing ${words.length} words...`);
        let updated = 0;
        const breakdown: Record<string, number> = {};

        for (const row of words) {
            const wordData = row.data as DictionaryData | null;
            const meanings = wordData?.results?.[0]?.meanings || [];
            const definition = meanings[0]?.definition || '';
            const pos = meanings[0]?.pos || '';

            const { url, source, confidence, query } = await resolveWordImage({
                word: row.word,
                definition,
                pos,
                imageSearchQuery: wordData?.image_search_query || '',
                meaningCount: meanings.length || 1,
            });

            const { error: updateErr } = await supabase
                .from('global_dictionary')
                .update({
                    image_url: url,
                    image_source: source,
                    image_confidence: confidence,
                    image_query: query,
                    image_verified_at: new Date().toISOString(),
                })
                .eq('word', row.word);

            if (!updateErr) {
                updated++;
                breakdown[source] = (breakdown[source] || 0) + 1;
                console.log(`[FILL-IMAGES] ✓ "${row.word}" ← ${source} (${confidence ?? 'n/a'})`);
            } else {
                console.error(`[FILL-IMAGES] ✗ "${row.word}":`, updateErr.message);
            }

            // Throttle: giãn nhịp giữa các từ tránh rate limit nguồn ảnh
            await new Promise(r => setTimeout(r, 650));
        }

        return NextResponse.json({
            success: true,
            updated,
            breakdown,
            message: `Đã cập nhật ${updated}/${words.length} từ`
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

/**
 * GET /api/bot/fill-images
 * Kiểm tra trạng thái: bao nhiêu từ đã có ảnh / chưa có
 */
export async function GET(): Promise<NextResponse> {
    try {
        const supabase = createServiceClient();

        const { count: total } = await supabase
            .from('global_dictionary')
            .select('*', { count: 'exact', head: true });

        const { count: withImage } = await supabase
            .from('global_dictionary')
            .select('*', { count: 'exact', head: true })
            .not('image_url', 'is', null)
            .neq('image_source', 'placeholder');

        const { count: withPlaceholder } = await supabase
            .from('global_dictionary')
            .select('*', { count: 'exact', head: true })
            .eq('image_source', 'placeholder');

        return NextResponse.json({
            success: true,
            total: total || 0,
            withRealImage: withImage || 0,
            withPlaceholder: withPlaceholder || 0,
            withoutImage: (total || 0) - (withImage || 0) - (withPlaceholder || 0),
        });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
