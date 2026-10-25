/**
 * VNU Test Bậc 3 Exam Fetch API (Zero Bulk Leaks Protected)
 * File: src/app/api/vnu-bac-3/test/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRawVnuBac3Exam,
  getVnuBac3Catalog,
  stripSensitiveVnuData,
  createVnuSessionToken,
} from '@/lib/vnu-bac-3/loader';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('id') || searchParams.get('examId');
    const getCatalog = searchParams.get('catalog') === 'true';
    const isDumpHoneyTrap = searchParams.get('dump') === 'true' || searchParams.get('include_answers') === '1';

    // 1. Phục vụ Catalog Index
    if (getCatalog || !examId) {
      const catalog = getVnuBac3Catalog();
      return NextResponse.json({
        success: true,
        catalog,
      });
    }

    // 2. Honeypot Canary Trap
    if (isDumpHoneyTrap || examId.includes('canary') || examId.includes('honeypot')) {
      // Silent Poison Mode: HTTP 200 với dữ liệu giả lập
      return NextResponse.json({
        success: true,
        message: 'Decoy Canary Mode Activated',
        exam: {
          id: examId,
          title: 'Decoy VNU Test Simulation',
          status: 'poisoned',
          canaryTrapped: true,
        },
      });
    }

    // 3. Nạp đề thi nguyên bản
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return NextResponse.json(
        {
          success: false,
          error: `Không tìm thấy đề thi với mã '${examId}'.`,
        },
        { status: 404 }
      );
    }

    // 4. Triệt tiêu 100% dữ liệu nhạy cảm (Zero Bulk Leaks)
    const sanitizedExam = stripSensitiveVnuData(rawExam);

    // 5. Cấp Session Token có chữ ký HMAC
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous';
    const sessionToken = createVnuSessionToken(examId, clientIp);

    return NextResponse.json({
      success: true,
      exam: sanitizedExam,
      sessionToken,
    });
  } catch (error) {
    console.error('Lỗi API /api/vnu-bac-3/test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Lỗi máy chủ nội bộ khi nạp đề thi.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const examId = body.examId || body.id;

    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số examId.' },
        { status: 400 }
      );
    }

    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đề thi với mã '${examId}'.` },
        { status: 404 }
      );
    }

    const sanitizedExam = stripSensitiveVnuData(rawExam);
    const clientIp = request.headers.get('x-forwarded-for') || 'anonymous';
    const sessionToken = createVnuSessionToken(examId, clientIp);

    return NextResponse.json({
      success: true,
      exam: sanitizedExam,
      sessionToken,
    });
  } catch (error) {
    console.error('Lỗi POST /api/vnu-bac-3/test:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ.' },
      { status: 500 }
    );
  }
}
