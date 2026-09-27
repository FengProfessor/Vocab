import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/api-security';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  return NextResponse.json(
    { success: false, error: 'Chương trình tri ân nâng cấp máy chủ đã kết thúc.' },
    { status: 410 },
  );
}
