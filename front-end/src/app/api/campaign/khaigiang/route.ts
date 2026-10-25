import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: 'Chương trình tặng 3 tháng Pro Khai Giảng 05/09 đã kết thúc. Hẹn gặp lại bạn ở các sự kiện tiếp theo!',
    },
    { status: 410 },
  );
}
