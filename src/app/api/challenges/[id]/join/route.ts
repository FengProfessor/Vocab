import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, safeErrorResponse } from '@/lib/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) throw new Error('Unauthorized');
    const user = { id: authUser.userId };

    const supabase = createServiceClient();
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeError || !challenge) throw new Error('Không tìm thấy challenge');

    if (challenge.status !== 'open') throw new Error('Challenge không trong thời gian mở đăng ký');

    const now = new Date();
    if (challenge.registration_opens_at && new Date(challenge.registration_opens_at) > now) {
      throw new Error('Chưa đến thời gian mở đăng ký');
    }
    if (challenge.registration_closes_at && new Date(challenge.registration_closes_at) < now) {
      throw new Error('Đã hết thời gian đăng ký');
    }

    const { data: participants, error: partCountError } = await supabase
      .from('challenge_participants')
      .select('id', { count: 'exact' })
      .eq('challenge_id', challenge.id);

    if (challenge.max_participants && participants && participants.length >= challenge.max_participants) {
      throw new Error('Đã đủ số lượng người tham gia tối đa');
    }

    const { data: existingPart } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challenge.id)
      .eq('user_id', user.id)
      .single();

    if (existingPart) throw new Error('Bạn đã tham gia challenge này rồi');

    const amount = challenge.deposit_amount;
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        amount,
        status: 'pending',
        order_kind: 'challenge',
      })
      .select()
      .single();
      
    if (orderError) throw orderError;

    const { data: participant, error: partError } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challenge.id,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (partError) throw partError;

    const bankId = 'MB';
    const accountNo = process.env.BANK_ACCOUNT_NO || '';
    const template = 'compact2';
    const orderPrefix = order.id.substring(0, 8).toUpperCase();
    const description = `LINGOPRO ${orderPrefix}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(description)}`;

    return NextResponse.json({ success: true, order, participant, qrUrl });
  } catch (error: any) {
    return safeErrorResponse(error, 'Lỗi khi đăng ký tham gia challenge');
  }
}
