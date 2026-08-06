/**
 * GET /api/billing/stats — Revenue analytics (admin only)
 *
 * Returns: MRR, total revenue, paid users, conversion rate, monthly breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAdminEmails } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: callerProfile } = await supabase.from('profiles').select('email, role').eq('id', user.id).maybeSingle();
    const callerEmail = (callerProfile?.email || user.email || '').toLowerCase().trim();
    const adminEmails = getAdminEmails();
    const isAdminRole = callerProfile?.role === 'admin';
    const isWhitelisted = Boolean(callerEmail && adminEmails.includes(callerEmail));

    if (!isAdminRole && !isWhitelisted) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 1. Total paid orders (all time)
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('amount, plan, paid_at, period_months')
      .eq('status', 'paid');

    const totalRevenue = (paidOrders ?? []).reduce((s, o) => s + (o.amount || 0), 0);
    const totalOrders = paidOrders?.length ?? 0;

    // 2. Current month revenue (MRR proxy)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const currentMonthOrders = (paidOrders ?? []).filter(o => {
      if (!o.paid_at) return false;
      return o.paid_at >= monthStart && o.paid_at <= monthEnd;
    });
    const mrr = currentMonthOrders.reduce((s, o) => s + (o.amount || 0), 0);

    // 3. Paid users count (active subscriptions)
    const { count: paidUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .neq('plan', 'free')
      .or('plan_expires_at.is.null,plan_expires_at.gt.' + now.toISOString());

    // 4. Total users count
    const { count: totalUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    const conversionRate = totalUsersCount && totalUsersCount > 0
      ? Math.round(((paidUsersCount ?? 0) / totalUsersCount) * 100 * 10) / 10
      : 0;

    // 5. Monthly breakdown (last 6 months)
    const monthlyBreakdown: { month: string; revenue: number; orders: number; pro: number; premium: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = d.toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const monthOrders = (paidOrders ?? []).filter(o => o.paid_at && o.paid_at >= mStart && o.paid_at <= mEnd);
      monthlyBreakdown.push({
        month: d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((s, o) => s + (o.amount || 0), 0),
        orders: monthOrders.length,
        pro: monthOrders.filter(o => o.plan === 'pro').length,
        premium: monthOrders.filter(o => o.plan === 'premium').length,
      });
    }

    // 6. Pending orders count
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 7. Recent subscription changes
    const { data: recentChanges } = await supabase
      .from('subscription_history')
      .select('*, profiles!subscription_history_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        totalRevenue,
        totalOrders,
        paidUsers: paidUsersCount ?? 0,
        totalUsers: totalUsersCount ?? 0,
        conversionRate,
        pendingOrders: pendingCount ?? 0,
      },
      monthlyBreakdown,
      recentChanges: recentChanges ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing] Stats error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
