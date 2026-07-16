import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getClientIp } from '@/lib/api-security';
import { assertScrapeQuota, QUOTA } from '@/lib/anti-scrape';

// Gợi ý từ từ global_dictionary khi user đang gõ (autocomplete)
export const dynamic = 'force-dynamic';

/** Escape ký tự đặc biệt trong LIKE pattern của Postgres */
function escapeLikePattern(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const rawQ = searchParams.get('q') ?? '';
  const q = rawQ.trim().toLowerCase();

  // Validate: 1-50 ký tự, chỉ chữ cái a-z, dấu nháy đơn, dấu cách, gạch nối
  if (!q || q.length > 50) {
    return NextResponse.json({ success: false, error: 'q must be 1-50 characters' }, { status: 400 });
  }
  if (!/^[a-z' -]+$/.test(q)) {
    return NextResponse.json({ success: false, error: 'q contains invalid characters' }, { status: 400 });
  }

  const ip = getClientIp(req);
  const denied = await assertScrapeQuota(`suggest:${ip}`, QUOTA.dictSuggest);
  if (denied) return denied;

  const supabase = createServiceClient();
  const pattern = escapeLikePattern(q) + '%';

  const { data, error } = await supabase
    .from('global_dictionary')
    .select('word')
    .ilike('word', pattern)
    .order('word')
    .limit(8);

  if (error) {
    console.error('[suggest] DB error:', error.message);
    return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 });
  }

  const suggestions = (data ?? []).map((r) => r.word as string);

  return NextResponse.json(
    { success: true, suggestions },
    { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
  );
}
