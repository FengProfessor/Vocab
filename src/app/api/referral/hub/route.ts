import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function maskName(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'Bạn học mới';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    const s = parts[0];
    return s.length > 2 ? `${s.slice(0, 2)}***` : `${s}***`;
  }
  return parts
    .map((p, i) => (i === parts.length - 1 ? p : `${p[0]}***`))
    .join(' ');
}

function generateRandomCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Fetch or auto-create referral link
    let { data: link } = await supabase
      .from('referral_links')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!link) {
      const code = generateRandomCode(6);
      const { data: newLink } = await supabase
        .from('referral_links')
        .insert({ user_id: user.id, referral_code: code })
        .select()
        .single();
      link = newLink;
    }

    const origin = req.nextUrl.origin || 'https://lingopro.online';
    const referralCode = link?.referral_code || '';
    const shareUrl = referralCode ? `${origin}/invite/${referralCode}` : '';

    // 2. Fetch referral logs
    const { data: logs } = await supabase
      .from('referral_logs')
      .select('id, referee_id, status, created_at, activated_at, converted_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    const logsList = logs || [];
    const totalInvited = logsList.length;
    const activatedCount = logsList.filter((l) => l.status === 'activated' || l.status === 'converted').length;
    const convertedCount = logsList.filter((l) => l.status === 'converted').length;

    // Fetch referee profiles for display (masked)
    const refereeIds = logsList.map((l) => l.referee_id).filter(Boolean);
    let refereeNamesMap: Record<string, string> = {};
    if (refereeIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', refereeIds);
      if (profs) {
        profs.forEach((p) => {
          refereeNamesMap[p.id] = maskName(p.full_name || p.email?.split('@')[0]);
        });
      }
    }

    // 3. Fetch Ledger Transactions
    const { data: txs } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', user.id);

    const txList = txs || [];
    let totalProDays = 0;
    let availableCash = 0;
    let pendingCash = 0;

    for (const tx of txList) {
      if (tx.reward_type === 'pro_days' && tx.status === 'available') {
        totalProDays += Number(tx.pro_days || 0);
      } else if (['affiliate_cash', 'cash_commission', 'milestone_bonus'].includes(tx.reward_type)) {
        if (tx.status === 'available') {
          availableCash += Number(tx.amount || 0);
        } else if (tx.status === 'pending_clearance') {
          pendingCash += Number(tx.amount || 0);
        }
      } else if (tx.reward_type === 'payout_debit' && tx.status === 'deducted') {
        availableCash += Number(tx.amount || 0); // amount is negative for debit
      }
    }

    if (availableCash < 0) availableCash = 0;

    // 4. Milestone calculation
    // Bronze: 0-2 friends | Silver: 3-9 friends (+30d Pro) | Gold Ambassador: >=10 friends (+20% comm + 200k)
    let currentRank = 'Bronze';
    let nextMilestone = {
      target: 3,
      current: activatedCount,
      reward: 'Tặng thêm 30 ngày Pro VIP miễn phí',
    };

    if (activatedCount >= 10) {
      currentRank = 'Gold Ambassador';
      nextMilestone = {
        target: 20,
        current: activatedCount,
        reward: 'Nhận 20% hoa hồng vĩnh viễn & Quà tặng Đại sứ LingoPro',
      };
    } else if (activatedCount >= 3) {
      currentRank = 'Silver';
      nextMilestone = {
        target: 10,
        current: activatedCount,
        reward: 'Thăng hạng Gold Ambassador + Thưởng nóng 200.000đ tiền mặt',
      };
    }

    // Format referral items
    const formattedReferrals = logsList.map((log) => ({
      id: log.id,
      name: refereeNamesMap[log.referee_id] || 'Học viên ẩn danh',
      status: log.status,
      createdAt: log.created_at,
      activatedAt: log.activated_at,
      convertedAt: log.converted_at,
    }));

    return NextResponse.json({
      success: true,
      referralCode,
      shareUrl,
      clicksCount: link?.clicks_count || 0,
      stats: {
        totalInvited,
        activatedCount,
        convertedCount,
        totalProDays,
        availableCash,
        pendingCash,
      },
      rank: {
        currentRank,
        nextMilestone,
      },
      referrals: formattedReferrals,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
