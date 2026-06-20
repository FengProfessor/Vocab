import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

/**
 * POST /api/bot/family-save
 * Body: [ { word, familyWords: [{ word, pos, meaning }] } ]
 *
 * CHỈ merge familyWords (object[] có nghĩa Việt) vào row đã tồn tại trong
 * global_dictionary. KHÔNG đụng results/pronunciations/image — tránh đè data
 * đã enrich. Dùng bởi bot cào aistudio (browser).
 */

function authOk(req: Request): boolean {
  const secret = process.env.BOT_SECRET;
  if (!secret) return true;
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') === secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

interface InFamily { word?: string; pos?: string; meaning?: string }
interface InItem { word?: string; familyWords?: InFamily[] }

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let saved = 0;

    for (const item of body as InItem[]) {
      const cleanWord = String(item.word || '').trim().toLowerCase();
      if (!cleanWord) continue;

      const family = (item.familyWords || [])
        .map((e) => ({
          word: String(e.word || '').trim().toLowerCase(),
          pos: String(e.pos || '').trim().toLowerCase() || undefined,
          meaning: String(e.meaning || '').trim() || undefined,
        }))
        .filter((e) => e.word && e.meaning);
      // dedup theo word
      const seen = new Set<string>();
      const deduped = family.filter((e) => (seen.has(e.word) ? false : (seen.add(e.word), true)));

      // Lấy data hiện có để merge (không đè field khác)
      const { data: row, error: selErr } = await supabase
        .from('global_dictionary')
        .select('data')
        .eq('word', cleanWord)
        .maybeSingle();
      if (selErr || !row) continue;

      // Rỗng (AI bảo không có họ phái sinh) → đánh dấu đã kiểm tra để rời pending, KHÔNG kẹt mãi
      const newData = deduped.length > 0
        ? { ...(row.data || {}), familyWords: deduped }
        : { ...(row.data || {}), familyChecked: true };
      const { error: upErr } = await supabase
        .from('global_dictionary')
        .update({ data: newData })
        .eq('word', cleanWord);

      if (!upErr) saved++;
      else console.error(`[FAMILY-SAVE] "${cleanWord}":`, upErr.message);
    }

    return NextResponse.json({ success: true, saved });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to save family batch');
  }
}
