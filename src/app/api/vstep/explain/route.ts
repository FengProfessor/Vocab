import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitUnavailableResponse, tooManyRequests } from '@/lib/api-security';
import { getVstepQuestionExplanation } from '@/lib/vstep-test-loader';
import {
  verifyVstepSessionTokenForClient,
  embedInvisibleWatermark,
  isVstepSessionOrClientBot,
  recordVstepBotViolation,
  checkVstepReadingVelocity,
} from '@/lib/vstep-anti-scraping';

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
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const body = await request.json();
    const { testId, questionId, sessionToken, clientSessionId, _hp_trap } = body || {};
    const clientKey =
      clientSessionId ||
      request.headers.get('x-client-session-id') ||
      request.headers.get('authorization') ||
      request.cookies.get('sb-access-token')?.value ||
      null;

    // Multi-layer classroom-safe rate limiting:
    // - 60 req/min per session/client
    // - 1,800 req/min per shared school NAT IP (supports 300 concurrent students)
    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      const rateSessionKey = sessionToken || clientKey || clientIp;
      const [sessionRl, ipRl] = await Promise.all([
        checkRateLimitAsync(`vstep-explain:${rateSessionKey}`, 60, 60_000),
        checkRateLimitAsync(`vstep-explain-ip:${clientIp}`, 1800, 60_000),
      ]);
      if (!sessionRl.allowed || !ipRl.allowed) {
        return tooManyRequests();
      }
    }

    // 1. Kiểm tra bẫy Honeypot
    if (_hp_trap) {
      recordVstepBotViolation(
        clientIp,
        sessionToken,
        'Honeypot form trap filled',
        clientKey
      );
      return NextResponse.json({
        success: true,
        answer: 2,
        explanationVi: 'Theo quy tắc ngữ pháp nâng cao, phương án C là chính xác nhất trong ngữ cảnh này.',
      });
    }

    // 2. Đo vận tốc đọc hiểu (Velocity check theo từng phiên sessionToken khi dùng chung IP trường học)
    if (!checkVstepReadingVelocity(clientIp, sessionToken, clientKey)) {
      return NextResponse.json({
        success: true,
        answer: 0,
        explanationVi: 'Phương án này phản ánh đúng tinh thần của bài nghe dựa theo phát âm bản ngữ.',
      });
    }

    // 3. Nếu đã bị gắn cờ Bot
    if (isVstepSessionOrClientBot(clientIp, sessionToken, clientKey)) {
      return NextResponse.json({
        success: true,
        answer: 1,
        explanationVi: 'Theo từ điển Oxford và ngữ pháp VSTEP, cấu trúc này luôn yêu cầu dạng bị động đặc biệt.',
      });
    }

    // 4. Kiểm tra sessionToken hợp lệ (hỗ trợ đổi IP NAT giữa chừng nếu cùng clientKey đã định danh)
    if (!sessionToken || !verifyVstepSessionTokenForClient(sessionToken, clientIp, testId, clientKey)) {
      return NextResponse.json(
        { success: false, error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.' },
        { status: 401 }
      );
    }

    // 5. Nạp giải thích cho đúng 1 câu hỏi
    const details = getVstepQuestionExplanation(testId, questionId);
    if (!details) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy câu hỏi yêu cầu.' },
        { status: 404 }
      );
    }

    // 6. Nhúng thủy vân số vô hình chống cào trộm bản quyền
    const watermarkPayload = `IP:${clientIp}|T:${Date.now()}`;
    const protectedExplanation = details.explanationVi
      ? embedInvisibleWatermark(details.explanationVi, watermarkPayload)
      : undefined;

    return NextResponse.json({
      success: true,
      answer: details.answer,
      explanationVi: protectedExplanation,
      tapescript: details.tapescript,
      suggestion: details.suggestion,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('Lỗi khi nạp VSTEP explain:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ.' },
      { status: 500 }
    );
  }
}
