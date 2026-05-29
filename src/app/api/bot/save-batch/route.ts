import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getWordSourceMap } from '@/lib/bot-utils';
import { resolveWordImage } from '@/lib/image-pipeline';

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json();
        if (!Array.isArray(data)) {
            return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
        }
        
        const { wordToTags } = await getWordSourceMap();
        const supabase = createServiceClient();
        
        console.log(`[BOT-API] Saving ${data.length} words (with images)...`);
        let successCount = 0;
        
        for (const item of data) {
            if (!item.word) continue;
            
            const cleanWord = item.word.trim().toLowerCase();
            const sourceTags = wordToTags[cleanWord] || [];
            const finalTags = ['ai-auto-bot', ...sourceTags];

            // Trích xuất definition và pos để tìm ảnh chính xác hơn
            const meanings = item.results?.[0]?.meanings || [];
            const definition = meanings[0]?.definition || '';
            const pos = meanings[0]?.pos || '';

            // Lấy ảnh minh họa qua pipeline thống nhất (validate + AI Vision)
            let imageUrl: string | null = null;
            let imageSource = 'none';
            let imageConfidence: number | null = null;
            let imageQuery = '';
            try {
                const img = await resolveWordImage({
                    word: cleanWord,
                    definition,
                    pos,
                    imageSearchQuery: item.image_search_query || '',
                    meaningCount: meanings.length || 1,
                });
                imageUrl = img.url;
                imageSource = img.source;
                imageConfidence = img.confidence;
                imageQuery = img.query;
                if (imageUrl) console.log(`[IMAGE] "${cleanWord}" ← ${imageSource} (${imageConfidence ?? 'n/a'})`);
            } catch (imgErr: unknown) {
                const imgMsg = imgErr instanceof Error ? imgErr.message : 'Unknown error';
                console.warn(`[IMAGE] Skipped for "${cleanWord}":`, imgMsg);
            }

            // Try full upsert with image metadata columns
            let { error } = await supabase.from('global_dictionary').upsert({
                word: cleanWord,
                tags: finalTags,
                data: item,
                image_url: imageUrl,
                image_source: imageSource,
                image_confidence: imageConfidence,
                image_query: imageQuery,
                image_verified_at: new Date().toISOString(),
            }, { onConflict: 'word' });

            // Fallback: image metadata columns missing (migration not yet run)
            if (error?.code === 'PGRST204') {
                console.warn(`[BOT-API] image metadata columns missing — saving core data only for "${cleanWord}". Run migration: 20260519_legalize_global_dictionary_images.sql`);
                const fallback = await supabase.from('global_dictionary').upsert({
                    word: cleanWord,
                    tags: finalTags,
                    data: item,
                }, { onConflict: 'word' });
                error = fallback.error;
            }

            if (!error) {
                successCount++;
            } else {
                console.error(`[ERROR] Failed to save "${item.word}":`, error.message);
            }
        }

        return NextResponse.json({ success: true, saved: successCount });
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}
