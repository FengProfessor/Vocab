/**
 * VNU Test Bậc 3 Submission & Grading API (Server-Authoritative Evaluation)
 * File: src/app/api/vnu-bac-3/submit/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRawVnuBac3Exam, verifyVnuSessionToken } from '@/lib/vnu-bac-3/loader';
import { gradeVnuBac3Exam } from '@/lib/vnu-bac-3/scoring';
import { VnuBac3Submission } from '@/types/vnu-bac-3';
import { getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as VnuBac3Submission;
    const { examId, mode, answers, timeSpentSeconds = 0, sessionToken } = body;

    if (!examId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số examId.' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra session token (nếu được gửi kèm)
    if (sessionToken) {
      const isValid = verifyVnuSessionToken(sessionToken, examId);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Phiên nộp bài không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
          },
          { status: 401 }
        );
      }
    }

    // 2. Nạp đề thi nguyên bản từ Server (Master Authoritative Data)
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đề thi '${examId}'.` },
        { status: 404 }
      );
    }

    // 3. Chấm điểm server-side độc lập
    const result = gradeVnuBac3Exam(rawExam, answers || {}, timeSpentSeconds);

    // 4. Lưu kết quả vào user_roadmap_assessments nếu học viên đã đăng nhập
    let savedToDb = false;
    try {
      const authUser = await getAuthUser(request).catch(() => null);
      if (authUser?.userId) {
        const supabase = createServiceClient();
        const scorePct = Math.round((result.overallScore || 0) * 10);
        const basePayload = {
          user_id: authUser.userId,
          tier: mode === 'practice' ? 'checkpoint' : 'exit_exam',
          target_id: examId,
          score: scorePct,
          passed: result.isPassed,
          details: {
            examType: 'vnu-bac-3',
            examTitle: rawExam.title,
            mode: mode ?? 'full_simulation',
            timeSpentSeconds,
            readingScore: result.readingScore,
            readingCorrect: result.readingCorrect,
            readingTotal: result.readingTotal,
            listeningScore: result.listeningScore,
            listeningCorrect: result.listeningCorrect,
            listeningTotal: result.listeningTotal,
            overallScore: result.overallScore,
            statusLabel: result.statusLabel,
          },
        };
        let { error: dbErr } = await supabase
          .from('user_roadmap_assessments')
          .insert({ ...basePayload, track: 'vnu-bac-3' });
        if (dbErr) {
          const retryRes = await supabase
            .from('user_roadmap_assessments')
            .insert({ ...basePayload, track: 'cefr' });
          dbErr = retryRes.error;
        }
        if (!dbErr) {
          savedToDb = true;
        }
      }
    } catch {
      // Non-fatal: vẫn trả về kết quả chấm bài cho client
    }

    return NextResponse.json({
      success: true,
      result,
      savedToDb,
    });
  } catch (error) {
    console.error('Lỗi API /api/vnu-bac-3/submit:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ trong quá trình chấm điểm.' },
      { status: 500 }
    );
  }
}
