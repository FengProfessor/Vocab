import { withSessionErrors } from '@/lib/session-response';
import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/campaign/claim-upgrade-gift
 * Campaign một ngày 06/08/2026 đã kết thúc; endpoint giữ lại để client cũ nhận 410.
 */
async function retiredCampaign(req: Request): Promise<NextResponse> {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  return NextResponse.json(
    { success: false, error: 'Chương trình tri ân 7 ngày Pro đã kết thúc.' },
    { status: 410 },
  );
}

export const POST = withSessionErrors(retiredCampaign);
