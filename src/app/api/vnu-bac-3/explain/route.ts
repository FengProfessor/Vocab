/**
 * VNU Test Bậc 3 On-Demand Explanation API (Practice Mode Protected)
 * File: src/app/api/vnu-bac-3/explain/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRawVnuBac3Exam,
  verifyVnuSessionToken,
  embedInvisibleWatermark,
} from '@/lib/vnu-bac-3/loader';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { examId, questionId, sessionToken } = body;

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

    // 3. Tìm kiếm đúng 1 câu hỏi được yêu cầu
    let targetQuestion = null;
    let targetTranscript = '';

    for (const section of rawExam.sections) {
      for (const task of section.tasks) {
        for (const q of task.questions) {
          if (q.id === questionId) {
            targetQuestion = q;
            targetTranscript = task.transcript || '';
            break;
          }
        }
        if (targetQuestion) break;
      }
      if (targetQuestion) break;
    }

    if (!targetQuestion) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy câu hỏi ${questionId}.` },
        { status: 404 }
      );
    }

    // 4. Nhúng thủy vân số vô hình Unicode Zero-Width
    const clientIp = request.headers.get('x-forwarded-for') || 'practice_learner';
    const explanation = targetQuestion.explanationVi || 'Chưa có lời giải chi tiết cho câu hỏi này.';
    const watermarkedExplanation = embedInvisibleWatermark(explanation, clientIp);

    // 5. Trả về đúng lời giải của câu hỏi này
    return NextResponse.json({
      success: true,
      questionId,
      correctAnswer: targetQuestion.correctAnswer ?? (targetQuestion.answerIndex === 0 ? 'A' : targetQuestion.answerIndex === 1 ? 'B' : 'C'),
      explanationVi: watermarkedExplanation,
      transcript: targetTranscript,
      vocabularyNotes: targetQuestion.vocabularyNotes || [],
    });
  } catch (error) {
    console.error('Lỗi API /api/vnu-bac-3/explain:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi lấy lời giải.' },
      { status: 500 }
    );
  }
}
