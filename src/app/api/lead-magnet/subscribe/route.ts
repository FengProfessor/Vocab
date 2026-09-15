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

interface SubscribePayload {
  email?: string;
  fullName?: string;
  phone?: string;
  targetScore?: string;
  currentScore?: string;
  diagnosticScore?: number;
  dimensionScores?: Record<number, number>;
  hp?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+().\s-]{8,20}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitAsync(`lead-magnet-sub:${ip}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = (await req.json()) as SubscribePayload;

    // Honeypot check
    if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
      return NextResponse.json({
        success: true,
        downloadUrl: '/api/lead-magnet/download',
        promoCode: 'SATTHUTOEIC',
        message: 'Đăng ký nhận tài liệu thành công!',
      });
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const targetScore = typeof body.targetScore === 'string' ? body.targetScore.trim() : '800+';
    const currentScore = typeof body.currentScore === 'string' ? body.currentScore.trim() : 'Chưa rõ';
    const diagnosticScore = typeof body.diagnosticScore === 'number' ? body.diagnosticScore : null;

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

    // 1. Local backup JSONL
    try {
      const backupDir = path.join(process.cwd(), 'data', 'campaign-leads');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const logFile = path.join(backupDir, 'leads-toeic-listening-2026.jsonl');
      const record = {
        email,
        fullName: fullName || email.split('@')[0],
        phone,
        targetScore,
        currentScore,
        diagnosticScore,
        dimensionScores: body.dimensionScores ?? {},
        createdAt: new Date().toISOString(),
        ip,
      };
      fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
    } catch (e) {
      console.warn('[LeadMagnet] File backup warning:', e);
    }

    // 2. Supabase pilot_leads
    try {
      const supabase = createServiceClient();
      const messageContent = [
        `[EBOOK SÁT THỦ TOEIC LISTENING 2024-2026]`,
        `Họ tên: ${fullName || 'Chưa cung cấp'}`,
        `Email: ${email}`,
        `Điện thoại/Zalo: ${phone || 'Không có'}`,
        `Điểm hiện tại: ${currentScore}`,
        `Mục tiêu: ${targetScore}`,
        diagnosticScore !== null ? `Điểm chẩn đoán 15 chiều: ${diagnosticScore}/30 điểm` : 'Chưa làm bài test chẩn đoán',
        `Thời gian đăng ký: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
      ].join('\n');

      const { error } = await supabase
        .from('pilot_leads')
        .insert({
          contact_name: fullName || email.split('@')[0],
          email,
          phone: phone || null,
          organization: `[Ebook TOEIC Listening 2026] Target ${targetScore}`,
          teacher_count: 1,
          student_count: 1,
          source: 'lead_magnet_toeic_2026',
          status: 'new',
          message: messageContent,
        });

      if (error) {
        console.warn('[LeadMagnet] Supabase insert warning:', error.message);
      }
    } catch (dbErr) {
      console.warn('[LeadMagnet] Supabase caught:', dbErr);
    }

    return NextResponse.json({
      success: true,
      downloadUrl: '/api/lead-magnet/download',
      promoCode: 'SATTHUTOEIC',
      message: 'Đăng ký thành công! Bạn có thể tải ngay Ebook hoặc xem trực tuyến.',
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể hoàn tất đăng ký, vui lòng thử lại.');
  }
}
