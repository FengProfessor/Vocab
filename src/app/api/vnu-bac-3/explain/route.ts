/**
 * VNU Test Bậc 3 On-Demand Explanation API (Practice Mode Protected)
 * File: src/app/api/vnu-bac-3/explain/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync, getClientIp, rateLimitUnavailableResponse, tooManyRequests } from '@/lib/api-security';
import {
  getRawVnuBac3Exam,
  getVnuBac3QuestionExplanation,
  verifyVnuSessionToken,
  embedInvisibleWatermark,
} from '@/lib/vnu-bac-3/loader';

function isRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL ||
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.TSX_TEST === '1'
  );
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const body = await request.json().catch(() => ({}));
    const { examId, questionId, sessionToken } = body;

    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'unknown') {
      const rateSessionKey = sessionToken || clientIp;
      const [sessionRl, ipRl] = await Promise.all([
        checkRateLimitAsync(`vnu-explain:${rateSessionKey}`, 60, 60_000),
        checkRateLimitAsync(`vnu-explain-ip:${clientIp}`, 1800, 60_000),
      ]);
      if (!sessionRl.allowed || !ipRl.allowed) {
        return tooManyRequests();
      }
    }

    if (!examId || !questionId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số examId hoặc questionId.' },
        { status: 400 }
      );
    }

    // 1. Xác thực HMAC Session Token
    const isSessionValid = verifyVnuSessionToken(sessionToken, examId);
    if (!isSessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phiên làm bài không hợp lệ hoặc đã hết hạn. Vui lòng làm mới trang.',
        },
        { status: 401 }
      );
    }

    // 2. Nạp đề thi nguyên bản từ Server
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đề thi ${examId}.` },
        { status: 404 }
      );
    }

    // 3. Tra cứu O(1) đúng 1 câu hỏi được yêu cầu
    const lookup = getVnuBac3QuestionExplanation(examId, questionId);
    if (!lookup) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy câu hỏi ${questionId}.` },
        { status: 404 }
      );
    }

    const { question: targetQuestion, transcript: targetTranscript } = lookup;

    // 4. Nhúng thủy vân số vô hình Unicode Zero-Width
    const watermarkId = clientIp !== 'unknown' ? clientIp : 'practice_learner';
    const explanation = targetQuestion.explanationVi || 'Chưa có lời giải chi tiết cho câu hỏi này.';
    const watermarkedExplanation = embedInvisibleWatermark(explanation, watermarkId);

    // 5. Trả về đúng lời giải của câu hỏi này
    return NextResponse.json({
      success: true,
      questionId,
      correctAnswer:
        targetQuestion.correctAnswer ??
        (targetQuestion.answerIndex === 0 ? 'A' : targetQuestion.answerIndex === 1 ? 'B' : 'C'),
      explanationVi: watermarkedExplanation,
      transcript: targetTranscript,
      vocabularyNotes: targetQuestion.vocabularyNotes || [],
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('Lỗi API /api/vnu-bac-3/explain:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi lấy lời giải.' },
      { status: 500 }
    );
  }
}
