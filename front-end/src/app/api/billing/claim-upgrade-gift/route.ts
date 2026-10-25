import { withSessionErrors } from '@/lib/session-response';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

async function retiredCampaign(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  return NextResponse.json(
    { success: false, error: 'Chương trình tri ân nâng cấp máy chủ đã kết thúc.' },
    { status: 410 },
  );
}

export const POST = withSessionErrors(retiredCampaign);
