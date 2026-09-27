import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { getAdminEmails, getAuthUser, forbidden, unauthorized } from '@/lib/api-security';

type TelegramResponse = { ok: boolean; error?: string; [k: string]: unknown };

async function sendTelegram(chatId: string, text: string): Promise<TelegramResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is missing' };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return (await res.json()) as TelegramResponse;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: msg };
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}

export async function POST(req: Request): Promise<NextResponse> {
  if (process.env.ALLOW_TEST_ROUTES !== 'true') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const supabase = createServiceClient();
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', auth.userId)
      .maybeSingle();

    const callerEmail = (callerProfile?.email || auth.email || '').trim().toLowerCase();
    const isAdmin = callerProfile?.role === 'admin' || getAdminEmails().includes(callerEmail);
    if (!isAdmin) return forbidden('Admin access required');

    const body = (await req.json().catch(() => null)) as { userId?: unknown } | null;
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json({ success: false, error: 'Valid userId is required' }, { status: 400 });
    }

    const { data: p, error } = await supabase
      .from('profiles')
      .select('telegram_id, full_name')
      .eq('id', userId)
      .single();

    if (error || !p?.telegram_id) {
      return NextResponse.json({ success: false, error: 'Notification target unavailable' }, { status: 404 });
    }

    const testMsg = `🔔 <b>TEST THÀNH CÔNG!</b>\n\nChào <b>${p.full_name}</b>,\nĐây là tin nhắn thử nghiệm từ hệ thống LingoPro.\n\nThông báo SRS của bạn sẽ được gửi về đây khi có từ vựng đến hạn!`;
    
    const result = await sendTelegram(p.telegram_id, testMsg);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: 'Notification provider failed' }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[TestNotify] Request failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
