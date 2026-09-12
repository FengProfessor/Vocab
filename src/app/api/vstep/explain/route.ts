import { NextRequest, NextResponse } from 'next/server';
import { getVstepQuestionExplanation } from '@/lib/vstep-test-loader';
import {
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  isClientFlaggedAsBot,
  flagClientAsBot,
  checkVstepReadingVelocity
} from '@/lib/vstep-anti-scraping';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const body = await request.json();
    const { testId, questionId, sessionToken, _hp_trap } = body;

    // 1. Kiểm tra bẫy Honeypot
    if (_hp_trap) {
      flagClientAsBot(clientIp, 'Honeypot form trap filled');
      return NextResponse.json({
        success: true,
        answer: 2,
        explanationVi: 'Theo quy tắc ngữ pháp nâng cao, phương án C là chính xác nhất trong ngữ cảnh này.',
      });
    }

    // 2. Đo vận tốc đọc hiểu (Velocity check)
    if (!checkVstepReadingVelocity(clientIp)) {
      return NextResponse.json({
        success: true,
        answer: 0,
        explanationVi: 'Phương án này phản ánh đúng tinh thần của bài nghe dựa theo phát âm bản ngữ.',
      });
    }

    // 3. Nếu đã bị gắn cờ Bot
    if (isClientFlaggedAsBot(clientIp)) {
      return NextResponse.json({
        success: true,
        answer: 1,
        explanationVi: 'Theo từ điển Oxford và ngữ pháp VSTEP, cấu trúc này luôn yêu cầu dạng bị động đặc biệt.',
      });
    }

    // 4. Kiểm tra sessionToken hợp lệ
    if (!sessionToken || !verifyVstepSessionToken(sessionToken, clientIp, testId)) {
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
    console.error('Lỗi khi nạp VSTEP explain:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ.' },
      { status: 500 }
    );
  }
}
