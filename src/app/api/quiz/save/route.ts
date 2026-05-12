import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

/**
 * POST /api/quiz/save
 * Body: { userId, classroomId, score, totalQuestions, quizType, nextReviewDelaySecs? }
 * 
 * Sau khi lưu kết quả quiz, tự động lên lịch push notification cho lần ôn tiếp theo.
 */
export async function POST(req: Request) {
  try {
    const { 
      userId, classroomId, score, totalQuestions, 
      quizType = 'vocabulary',
      nextReviewDelaySecs = null, // Số giây đến lần ôn tiếp theo (do client gửi lên)
    } = await req.json();

    let finalClassroomId = classroomId;

    const supabase = createServiceClient();

    // Fallback if classroomId is missing: find personal classroom
    if (!finalClassroomId && userId) {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('id')
        .eq('name', 'Personal')
        .eq('teacher_id', userId)
        .single();
      if (cls) finalClassroomId = cls.id;
    }

    if (!userId || !finalClassroomId || score === undefined || !totalQuestions) {
      return NextResponse.json({ error: 'userId, classroomId, score, and totalQuestions are required' }, { status: 400 });
    }

    const accuracyPct = Math.round((score / totalQuestions) * 100);

    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: userId,
        classroom_id: finalClassroomId,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        accuracy: accuracyPct,
      })
      .select()
      .single();

    if (error) {
      console.error('Quiz Save Error [DB]:', error.message, error.details, error.hint);
      return NextResponse.json({ 
        error: 'Failed to save quiz results to database',
        details: error.message 
      }, { status: 500 });
    }

    // ── Lên lịch push notification cho lần ôn tiếp theo ──
    if (nextReviewDelaySecs && ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY) {
      const sendAfterDate = new Date(Date.now() + nextReviewDelaySecs * 1000);
      
      // Lấy tên user
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      const firstName = (profile?.full_name || 'bạn').split(' ').pop();

      try {
        await axios.post(
          'https://onesignal.com/api/v1/notifications',
          {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            headings: { en: '⏰ Thời Điểm Ôn Tập Đã Đến!', vi: '⏰ Thời Điểm Ôn Tập Đã Đến!' },
            contents: {
              en: `${firstName} ơi, từ vựng vừa ôn đã sẵn sàng để ôn lại! Học ngay để không quên nhé 🧠`,
              vi: `${firstName} ơi, từ vựng vừa ôn đã sẵn sàng để ôn lại! Học ngay để không quên nhé 🧠`,
            },
            web_url: 'https://lingopro-nu.vercel.app/student',
            // Gửi đúng lúc từ đến hạn
            send_after: sendAfterDate.toUTCString(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
          }
        );
        console.log(`[Quiz/Save] Scheduled notification in ${nextReviewDelaySecs}s for user ${userId}`);
      } catch (pushErr: any) {
        console.warn('[Quiz/Save] Failed to schedule push:', pushErr.response?.data || pushErr.message);
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('POST /api/quiz/save Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
