import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  checkRateLimitAsync,
  getClientIp,
  isNumberInRange,
  isValidString,
  safeErrorResponse,
  tooManyRequests,
} from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';

interface LeadBody {
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  organization?: unknown;
  teacherCount?: unknown;
  studentCount?: unknown;
  message?: unknown;
  source?: unknown;
  website?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+().\s-]{8,24}$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimitAsync(`pilot-lead:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = await req.json() as LeadBody;

    // Honeypot: trả thành công giả để bot không thử lại.
    if (typeof body.website === 'string' && body.website.trim()) {
      return NextResponse.json({ success: true });
    }

    if (
      !isValidString(body.contactName, 80)
      || !isValidString(body.email, 160)
      || !isValidString(body.phone, 30)
      || !isValidString(body.organization, 160)
      || !isNumberInRange(body.teacherCount, 1, 10000)
      || !isNumberInRange(body.studentCount, 1, 1000000)
    ) {
      return NextResponse.json({ success: false, error: 'Thông tin chưa hợp lệ.' }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const phone = body.phone.trim();
    if (!EMAIL_PATTERN.test(email) || !PHONE_PATTERN.test(phone)) {
      return NextResponse.json({ success: false, error: 'Email hoặc số điện thoại chưa hợp lệ.' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const keyHash = createHash('sha256').update(`pilot-lead:${ip}`).digest('hex');
    const { data: durableAllowed, error: rateLimitError } = await supabase.rpc('check_pilot_lead_rate_limit', {
      p_key_hash: keyHash,
      p_limit: 5,
      p_window_seconds: 3600,
    });
    if (rateLimitError) throw rateLimitError;
    if (!durableAllowed) return tooManyRequests();

    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : null;
    const source = typeof body.source === 'string' ? body.source.trim().slice(0, 80) : 'teacher_landing';
    const { data, error } = await supabase
      .from('pilot_leads')
      .insert({
        contact_name: body.contactName.trim(),
        email,
        phone,
        organization: body.organization.trim(),
        teacher_count: Math.round(body.teacherCount),
        student_count: Math.round(body.studentCount),
        message: message || null,
        source: source || 'teacher_landing',
      })
      .select('id')
      .single();

    if (error) throw error;
    console.log(`[PilotSales] New center lead ${data.id}`);
    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không thể gửi yêu cầu tư vấn.');
  }
}
