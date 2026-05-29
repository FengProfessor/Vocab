import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  return handleNotify(userId);
}

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = (await req.json()) as { userId?: string };
  return handleNotify(userId || null);
}

async function handleNotify(userId: string | null): Promise<NextResponse> {
  try {
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: p, error } = await supabase
      .from('profiles')
      .select('telegram_id, full_name')
      .eq('id', userId)
      .single();

    if (error || !p?.telegram_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'User has no telegram_id set in profile',
        profile: p 
      });
    }

    const testMsg = `🔔 <b>TEST THÀNH CÔNG!</b>\n\nChào <b>${p.full_name}</b>,\nĐây là tin nhắn thử nghiệm từ hệ thống LingoPro.\n\nThông báo SRS của bạn sẽ được gửi về đây khi có từ vựng đến hạn!`;
    
    const result = await sendTelegram(p.telegram_id, testMsg);

    return NextResponse.json({ 
      success: result.ok, 
      telegram_response: result,
      telegram_id: p.telegram_id 
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
