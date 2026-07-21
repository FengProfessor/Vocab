import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse, assertBotAuthorized } from '@/lib/api-security';

/**
 * GET /api/bot/example-vi-batch?size=100&shard=0&shards=4
 *
 * Trả batch câu example EN chưa có example_vi (words table).
 * Dedup theo text example → 1 request Studio dịch được nhiều row.
 * Bot: aistudio / gemini web (Tampermonkey).
 *
 * size: số CÂU unique (default 100, max 150) — Studio tính request, không tính độ dài.
 */

function hashShard(s: string, shards: number): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ((h % shards) + shards) % shards;
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const denied = assertBotAuthorized(req);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    // Studio tính request → batch to (default 100). Max 150 để response AI còn parse được.
    const size = Math.min(Math.max(parseInt(searchParams.get('size') || '100', 10) || 100, 1), 150);
    const shards = Math.max(parseInt(searchParams.get('shards') || '1', 10) || 1, 1);
    const shard = ((parseInt(searchParams.get('shard') || '0', 10) % shards) + shards) % shards;

    const supabase = createServiceClient();

    // Pool candidate — filter phía server + client (empty string)
    const poolLimit = Math.min(Math.max(size * 20, 800), 4000);
    const { data: rows, error } = await supabase
      .from('words')
      .select('id, word, example, example_vi')
      .not('example', 'is', null)
      .neq('example', '')
      .or('example_vi.is.null,example_vi.eq.')
      .order('created_at', { ascending: false })
      .limit(poolLimit);

    if (error) {
      if (/example_vi/i.test(error.message)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Cột example_vi chưa có. Chạy: ALTER TABLE public.words ADD COLUMN IF NOT EXISTS example_vi text;',
          },
          { status: 500 },
        );
      }
      throw error;
    }

    type Row = { id: string; word: string; example: string; example_vi: string | null };
    const pending = ((rows || []) as Row[]).filter(
      (r) => (r.example || '').trim() && !(r.example_vi || '').trim(),
    );

    // Dedup theo example EN → gộp ids
    const byEx = new Map<string, { example: string; word: string; ids: string[] }>();
    for (const r of pending) {
      const ex = r.example.trim();
      const cur = byEx.get(ex);
      if (cur) {
        cur.ids.push(r.id);
      } else {
        byEx.set(ex, { example: ex, word: r.word, ids: [r.id] });
      }
    }

    let groups = [...byEx.values()];

    if (shards > 1) {
      groups = groups.filter((g) => hashShard(g.example, shards) === shard);
    }

    // Shuffle
    for (let i = groups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groups[i], groups[j]] = [groups[j], groups[i]];
    }

    const picked = groups.slice(0, size);
    const items = picked.map((g, i) => ({
      i,
      word: g.word,
      example: g.example,
      ids: g.ids,
    }));

    const rowCount = picked.reduce((n, g) => n + g.ids.length, 0);

    return NextResponse.json({
      success: true,
      items,
      /** số câu unique còn (ước lượng trong pool shard) */
      remaining: groups.length,
      /** số row words sẽ được update nếu dịch hết batch */
      rowCount,
      size: items.length,
    });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to fetch example-vi batch');
  }
}
