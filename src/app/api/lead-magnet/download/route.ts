import { NextResponse } from 'next/server';
import { getLeadMagnetBuffer } from '@/lib/lead-magnet-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const fileBuffer = getLeadMagnetBuffer();

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.md"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[LeadMagnetDownload] Error:', error);
    return NextResponse.json(
      { error: 'Không thể tải file tài liệu lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
