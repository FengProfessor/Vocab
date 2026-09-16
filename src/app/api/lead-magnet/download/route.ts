import { NextRequest, NextResponse } from 'next/server';
import { getLeadMagnetBuffer, getLeadMagnetPdfBuffer } from '@/lib/lead-magnet-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get('format')?.toLowerCase();

    // If markdown format is explicitly requested
    if (format === 'md' || format === 'markdown') {
      const mdBuffer = getLeadMagnetBuffer();
      return new NextResponse(new Uint8Array(mdBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.md"',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Default or format=pdf: Try serving the PDF first
    const pdfBuffer = getLeadMagnetPdfBuffer();
    if (pdfBuffer) {
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Bach-Khoa-Sat-Thu-TOEIC-Listening-ETS-2026-LingoPro.pdf"',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Fallback to markdown if PDF is not generated yet
    const fallbackBuffer = getLeadMagnetBuffer();
    return new NextResponse(new Uint8Array(fallbackBuffer), {
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
