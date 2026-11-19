import { NextResponse } from 'next/server';
import { getAuthUser, safeErrorResponse, unauthorized } from '@/lib/api-security';
import { buildDocxTemplateBuffer, buildExcelTemplateBuffer } from '@/lib/teacher-vocab-file-parser';

export const runtime = 'nodejs';

/**
 * GET /api/teacher/words/template?format=xlsx|docx
 * Tải file mẫu nhập từ vựng chuẩn LingoPro cho giáo viên.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();

    if (format === 'docx') {
      const buf = await buildDocxTemplateBuffer();
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="mau-tu-vung-lingopro.docx"',
          'Cache-Control': 'private, no-store',
        },
      });
    }

    const buf = await buildExcelTemplateBuffer();
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="mau-tu-vung-lingopro.xlsx"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể tạo file mẫu');
  }
}
