import { NextResponse } from 'next/server';
import { getLeadMagnetContent } from '@/lib/lead-magnet-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = getLeadMagnetContent();

    return NextResponse.json({
      success: true,
      title: 'Bách Khoa Toàn Thư Thực Chiến: Sát Thủ Bài Nghe TOEIC ETS 2024 - 2026',
      content,
      publishedAt: '2026-09-15',
    });
  } catch (error) {
    console.error('[LeadMagnetEbook] Error:', error);
    return NextResponse.json(
      { error: 'Không thể tải nội dung Ebook lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
