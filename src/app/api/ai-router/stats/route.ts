import { NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai-router';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';

// Fail-closed: env rỗng → mảng rỗng → mọi request đều 403 (tránh [''].includes('') = true)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

/**
 * GET /api/ai-router/stats
 * Trả về trạng thái key pool — chỉ admin được xem.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    // ── Auth: admin only ──
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', auth.userId).single();
    if (!ADMIN_EMAILS.includes(profile?.email?.toLowerCase() ?? '')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const stats = getRouter().stats();
    return NextResponse.json({ success: true, stats });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Failed to fetch AI router stats');
  }
}
