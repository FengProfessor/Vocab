import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import {
  safeErrorResponse,
  isValidString,
  getClientIp,
  checkRateLimitAsync,
  tooManyRequests,
} from '@/lib/api-security';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CampaignLeadPayload {
  fullName?: string;
  phone?: string;
  birthYear?: string | number;
  targetRole?: string;
  province?: string;
  currentLevel?: string;
  needConsulting?: boolean;
  hp?: string;
}

const PHONE_REGEX = /^[0-9+().\s-]{8,20}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting: 10 requests / minute per IP
    const ip = getClientIp(req);
    const rl = await checkRateLimitAsync(`campaign-khaigiang:${ip}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = (await req.json()) as CampaignLeadPayload;

    // Honeypot check: if automated bot filled hp field, fake success immediately
    if (typeof body.hp === 'string' && body.hp.trim().length > 0) {
      return NextResponse.json({
        success: true,
        code: 'KHAIGIANG3M',
        days: 90,
        message: 'Đăng ký thành công! Mã 3 tháng Pro của bạn là KHAIGIANG3M',
      });
    }

    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const birthYear = body.birthYear ? String(body.birthYear).trim() : 'Không rõ';
    const targetRole = typeof body.targetRole === 'string' ? body.targetRole.trim() : 'Chưa rõ';
    const province = typeof body.province === 'string' ? body.province.trim() : 'Toàn quốc';
    const currentLevel = typeof body.currentLevel === 'string' ? body.currentLevel.trim() : 'Mất gốc';
    const needConsulting = Boolean(body.needConsulting);

    if (!fullName || !isValidString(fullName, 100)) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập họ và tên của bạn.' }, { status: 400 });
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Số điện thoại/Zalo không hợp lệ, vui lòng kiểm tra lại.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const virtualEmail = `${cleanPhone || 'lead'}@khaigiang0509.lingopro.vn`;

    // 1. Backup to local logs for safety
    try {
      const backupDir = path.join(process.cwd(), 'data', 'campaign-leads');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const logFile = path.join(backupDir, 'leads-khaigiang-0509.jsonl');
      const record = {
        fullName,
        phone,
        birthYear,
        targetRole,
        province,
        currentLevel,
        needConsulting,
        createdAt: new Date().toISOString(),
      };
      fs.appendFileSync(logFile, JSON.stringify(record) + '\n', 'utf8');
    } catch (e) {
      console.warn('[CampaignLead] File backup warning:', e);
    }

    // 2. Insert into Supabase pilot_leads so admin can view at /admin/pilot-leads
    try {
      const supabase = createServiceClient();
      const messageContent = [
        `[KHAI GIẢNG 05/09]`,
        `Tư vấn lớp mất gốc Thầy Phong: ${needConsulting ? '👉 CẦN TƯ VẤN (Ưu tiên gọi)' : 'Tự học app'}`,
        `Năm sinh: ${birthYear}`,
        `Đối tượng: ${targetRole}`,
        `Tỉnh/Thành phố: ${province}`,
        `Trình độ hiện tại: ${currentLevel}`,
      ].join('\n');

      const { data, error } = await supabase
        .from('pilot_leads')
        .insert({
          contact_name: fullName,
          email: virtualEmail,
          phone: phone,
          organization: `[KhaiGiang] ${province} - ${targetRole} (${birthYear})`,
          teacher_count: 1,
          student_count: 1,
          source: 'tiktok_khaigiang_0509',
          status: 'new',
          message: messageContent,
        })
        .select('id')
        .single();

      if (error) {
        console.warn('[CampaignLead] Supabase insert warning:', error.message);
      } else {
        console.log(`[CampaignLead] Saved lead id: ${data?.id}`);
      }
    } catch (dbErr) {
      console.warn('[CampaignLead] DB insert caught:', dbErr);
    }

    return NextResponse.json({
      success: true,
      code: 'KHAIGIANG3M',
      days: 90,
      message: 'Đăng ký thành công! Mã 3 tháng Pro của bạn là KHAIGIANG3M',
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể gửi thông tin, vui lòng thử lại.');
  }
}
