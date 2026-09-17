import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  safeErrorResponse,
  getClientIp,
  checkRateLimitAsync,
  tooManyRequests,
} from '@/lib/api-security';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChallengeLeadPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  targetGoal?: string;
  challengeInterest?: string;
  hp?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+().\s-]{8,20}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitAsync(`challenge-lead:${ip}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = (await req.json()) as ChallengeLeadPayload;

    // Honeypot anti-bot check
    if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Đăng ký nhận sổ tay thành công!',
        downloadUrl: '/resources/So-Tay-3000-Tu-Vung-LingoPro.pdf',
        testUrl: '/toeic/exam',
        voucherCode: 'CHALLENGE50K',
      });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const targetGoal = typeof body.targetGoal === 'string' ? body.targetGoal.trim() : 'Mục tiêu chung';
    const challengeInterest = typeof body.challengeInterest === 'string' ? body.challengeInterest.trim() : 'Gói 3 hoặc 6 tháng';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp địa chỉ Email hợp lệ.' },
        { status: 400 }
      );
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại/Zalo không đúng định dạng.' },
        { status: 400 }
      );
    }

    // 1. Local backup JSONL logging
    try {
      const backupDir = path.join(process.cwd(), 'data', 'campaign-leads');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const logFile = path.join(backupDir, 'leads-challenge-landing.jsonl');
      const record = {
        email,
        fullName: fullName || email.split('@')[0],
        phone,
        targetGoal,
        challengeInterest,
        createdAt: new Date().toISOString(),
        ip,
      };
      fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
    } catch (e) {
      console.warn('[ChallengeLead] File backup warning:', e);
    }

    // 2. Supabase pilot_leads storage
    try {
      const supabase = createServiceClient();
      const messageContent = [
        `[LEAD MAGNET THỬ THÁCH 180 NGÀY - SỔ TAY 3000 TỪ & TEST TRÌNH ĐỘ]`,
        `Họ tên: ${fullName || 'Chưa cung cấp'}`,
        `Email: ${email}`,
        `Điện thoại / Zalo: ${phone || 'Chưa cung cấp'}`,
        `Mục tiêu: ${targetGoal}`,
        `Quan tâm gói: ${challengeInterest}`,
        `Thời gian đăng ký: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
      ].join('\n');

      const { error } = await supabase
        .from('pilot_leads')
        .insert({
          contact_name: fullName || email.split('@')[0],
          email,
          phone: phone || 'Chưa cung cấp',
          organization: `[Challenge Landing] Mục tiêu: ${targetGoal}`,
          teacher_count: 1,
          student_count: 1,
          source: 'challenge_landing_leadmagnet',
          status: 'new',
          message: messageContent,
        });

      if (error) {
        console.warn('[ChallengeLead] Supabase insert warning:', error.message);
      }
    } catch (dbErr) {
      console.warn('[ChallengeLead] Supabase caught:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Chúc mừng bạn! Sổ tay 3000 từ vựng và link test đã sẵn sàng.',
      downloadUrl: '/resources/So-Tay-3000-Tu-Vung-LingoPro.pdf',
      testUrl: '/toeic/exam',
      voucherCode: 'CHALLENGE50K',
      voucherDiscount: '50.000đ',
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể hoàn tất đăng ký, vui lòng thử lại.');
  }
}
