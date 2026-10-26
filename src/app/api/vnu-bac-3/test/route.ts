/**
 * VNU Test Bậc 3 Exam Fetch API (Zero Bulk Leaks Protected)
 * File: src/app/api/vnu-bac-3/test/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync, getClientIp, rateLimitUnavailableResponse, tooManyRequests } from '@/lib/api-security';
import {
  getSafeVnuBac3Exam,
  getVnuBac3Catalog,
  createVnuSessionToken,
} from '@/lib/vnu-bac-3/loader';

function isRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL ||
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.TSX_TEST === '1'
  );
}

export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'unknown') {
      const rl = await checkRateLimitAsync(`vnu-test:${clientIp}`, 600, 60_000);
      if (!rl.allowed) {
        return tooManyRequests();
      }
    }

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

    // 3. Nạp đề thi đã làm sạch dữ liệu nhạy cảm từ bộ nhớ đệm (Zero Bulk Leaks)
    const sanitizedExam = getSafeVnuBac3Exam(examId);
    if (!sanitizedExam) {
      return NextResponse.json(
        {
          success: false,
          error: `Không tìm thấy đề thi với mã '${examId}'.`,
        },
        { status: 404 }
      );
    }

    // 4. Cấp Session Token có chữ ký HMAC (có sequence nonce cho 300 học viên cùng IP)
    const sessionToken = createVnuSessionToken(examId, clientIp);

    return NextResponse.json({
      success: true,
      exam: sanitizedExam,
      sessionToken,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
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
    const clientIp = getClientIp(request);
    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'unknown') {
      const rl = await checkRateLimitAsync(`vnu-test:${clientIp}`, 600, 60_000);
      if (!rl.allowed) {
        return tooManyRequests();
      }
    }

    const body = await request.json().catch(() => ({}));
    const examId = body.examId || body.id;

    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số examId.' },
        { status: 400 }
      );
    }

    const sanitizedExam = getSafeVnuBac3Exam(examId);
    if (!sanitizedExam) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đề thi với mã '${examId}'.` },
        { status: 404 }
      );
    }

    const sessionToken = createVnuSessionToken(examId, clientIp);

    return NextResponse.json({
      success: true,
      exam: sanitizedExam,
      sessionToken,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('Lỗi POST /api/vnu-bac-3/test:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ.' },
      { status: 500 }
    );
  }
}
