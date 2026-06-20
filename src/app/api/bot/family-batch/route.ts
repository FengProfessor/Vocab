import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { safeErrorResponse } from '@/lib/api-security';

/**
 * GET /api/bot/family-batch?size=30
 *
 * Trả về các TỪ ĐƠN trong global_dictionary CHƯA enrich word-family (familyWords
 * chưa ở dạng object[] có nghĩa). Dùng cho bot cào qua aistudio (browser),
 * nhiều tab song song — chọn ngẫu nhiên để giảm trùng giữa các tab.
 *
 * Khác next-batch: KHÔNG dùng word-source-map, KHÔNG tạo từ mới — chỉ pick từ
 * đã tồn tại để bổ sung familyWords. Merge phía /api/bot/family-save.
 */

function authOk(req: Request): boolean {
  const secret = process.env.BOT_SECRET;
  if (!secret) return true; // dev/local: chưa set secret → cho qua
  const { searchParams } = new URL(req.url);
  if (searchParams.get('secret') === secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

interface FamilyEntry { word?: string; meaning?: string }

/** familyWords đã enrich (object[] có meaning) → bỏ qua */
function isEnriched(fw: unknown): boolean {
  if (!Array.isArray(fw) || fw.length === 0) return false;
  return fw.every(
    (e) => e && typeof e === 'object' &&
      typeof (e as FamilyEntry).word === 'string' &&
      typeof (e as FamilyEntry).meaning === 'string' &&
      (e as FamilyEntry).meaning!.trim() !== ''
  );
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const size = Math.min(parseInt(searchParams.get('size') || '30', 10), 60);
    // Chia cứng cho nhiều tab/nick: shard 0..shards-1, hash(word)%shards === shard
    const shards = Math.max(parseInt(searchParams.get('shards') || '1', 10), 1);
    const shard = ((parseInt(searchParams.get('shard') || '0', 10) % shards) + shards) % shards;

    const supabase = createServiceClient();

    // Lấy word + familyWords + familyChecked (nhẹ — không kéo cả results). Paginate.
    const rows: { word: string; fw: unknown; checked: unknown }[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data: page, error } = await supabase
        .from('global_dictionary')
        .select('word, fw:data->familyWords, checked:data->familyChecked')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!page || page.length === 0) break;
      rows.push(...(page as typeof rows));
      if (page.length < pageSize) break;
      from += pageSize;
    }

    // Pending: từ ĐƠN, chưa enrich object-form VÀ chưa bị đánh dấu không-có-family
    let pending = rows
      .filter((r) => r.word && !/\s/.test(r.word) && !isEnriched(r.fw) && r.checked !== true)
      .map((r) => r.word);

    // Shard: mỗi tab nhận tập từ riêng (hash ổn định) → 0 trùng giữa các tab
    if (shards > 1) {
      pending = pending.filter((w) => {
        let h = 5381;
        for (let i = 0; i < w.length; i++) h = ((h << 5) + h + w.charCodeAt(i)) | 0;
        return (((h % shards) + shards) % shards) === shard;
      });
    }

    // Shuffle nhẹ → nhiều tab cào song song ít trùng
    for (let i = pending.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pending[i], pending[j]] = [pending[j], pending[i]];
    }

    const words = pending.slice(0, size);

    return NextResponse.json({
      success: true,
      words,
      remaining: pending.length,
    });
  } catch (e: unknown) {
    return safeErrorResponse(e, 'Failed to fetch family batch');
  }
}
