import { NextResponse } from 'next/server';
import {
  checkRateLimitAsync,
  getAuthUser,
  safeErrorResponse,
  tooManyRequests,
  unauthorized,
} from '@/lib/api-security';
import { parseCsvText, parsePastedVocabText, parseStructuredVocabRows } from '@/lib/teacher-vocab-import';
import { parseDocxBuffer, parseXlsxBuffer } from '@/lib/teacher-vocab-file-parser';

export const runtime = 'nodejs';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/teacher/words/parse-file
 * Đọc và phân tích file Word (.docx), Excel (.xlsx), CSV, TSV, TXT thành preview có cấu trúc.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const rl = await checkRateLimitAsync(`teacher-parse-file:${auth.userId}`, 20, 60_000);
    if (!rl.allowed) return tooManyRequests(Math.ceil(rl.resetIn / 1000));

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn một file hợp lệ.' },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'File đang trống, không có dữ liệu.' },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File vượt quá giới hạn 10 MB.' },
        { status: 400 },
      );
    }

    const fileName = file.name || 'upload';
    const lowerName = fileName.toLowerCase();

    if (lowerName.endsWith('.doc')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Định dạng .doc cũ chưa được hỗ trợ trực tiếp. Vui lòng mở bằng Word và chọn "Save As -> .docx", hoặc copy bảng trong file và dán trực tiếp vào tab "Dán bảng".',
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    if (lowerName.endsWith('.docx')) {
      result = parseDocxBuffer(buffer);
    } else if (lowerName.endsWith('.xlsx')) {
      result = await parseXlsxBuffer(buffer);
    } else if (lowerName.endsWith('.csv')) {
      const text = buffer.toString('utf8');
      result = parseStructuredVocabRows([{ rows: parseCsvText(text) }], 'csv');
    } else if (lowerName.endsWith('.tsv') || lowerName.endsWith('.txt')) {
      const text = buffer.toString('utf8');
      result = parsePastedVocabText(text);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Chỉ hỗ trợ file .docx, .xlsx, .csv, .tsv hoặc .txt.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      fileName,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('.docx') || msg.includes('Excel') || msg.includes('Word')) {
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    return safeErrorResponse(err, 'Không thể đọc file từ vựng');
  }
}
