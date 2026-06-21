import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

/**
 * GET /api/bot/synant-batch?size=30&shard=0&shards=4
 *
 * Trả entry CHƯA có synonyms (và chưa bị đánh dấu synAntChecked) để bot cào
 * synonyms/antonyms qua aistudio/gemini. Áp dụng cả từ đơn lẫn cụm.
 * Merge phía /api/bot/synant-save (chỉ đụng data.synonyms/antonyms).
 */

function authOk(req: Request): boolean {
  const secret = process.env.BOT_SECRET;
  if (!secret) return true;
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') === secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const size = Math.min(parseInt(searchParams.get('size') || '30', 10), 60);
    const shards = Math.max(parseInt(searchParams.get('shards') || '1', 10), 1);
    const shard = ((parseInt(searchParams.get('shard') || '0', 10) % shards) + shards) % shards;

    const supabase = createServiceClient();

    const rows: { word: string; syn: unknown; checked: unknown }[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page, error } = await supabase
        .from('global_dictionary')
        .select('word, syn:data->synonyms, checked:data->synAntChecked')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!page || page.length === 0) break;
      rows.push(...(page as typeof rows));
      if (page.length < pageSize) break;
      from += pageSize;
    }

    // Pending: chưa có synonyms VÀ chưa đánh dấu đã kiểm tra
    let pending = rows
      .filter((r) => r.word && !(Array.isArray(r.syn) && r.syn.length > 0) && r.checked !== true)
      .map((r) => r.word);

    if (shards > 1) {
      pending = pending.filter((w) => {
        let h = 5381;
        for (let i = 0; i < w.length; i++) h = ((h << 5) + h + w.charCodeAt(i)) | 0;
        return (((h % shards) + shards) % shards) === shard;
      });
    }

    for (let i = pending.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pending[i], pending[j]] = [pending[j], pending[i]];
    }

    return NextResponse.json({ success: true, words: pending.slice(0, size), remaining: pending.length });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to fetch synant batch');
  }
}
