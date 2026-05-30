/**
 * GET /api/cron/check-expired — Hạ gói về free khi hết hạn
 *
 * Chạy hàng ngày lúc 2h sáng (vercel cron hoặc external).
 * Bảo vệ bằng CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  // Auth: verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  try {
    // Find expired paid users
    const { data: expiredUsers, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, plan, plan_expires_at')
      .neq('plan', 'free')
      .not('plan_expires_at', 'is', null)
      .lt('plan_expires_at', now);

    if (fetchErr) throw new Error(fetchErr.message);

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ success: true, downgraded: 0, message: 'No expired subscriptions' });
    }

    let downgraded = 0;

    for (const user of expiredUsers) {
      // Downgrade to free
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', user.id);

      if (updateErr) {
        console.error(`[Cron] Failed to downgrade user ${user.id}:`, updateErr.message);
        continue;
      }

      // Log subscription history
      await supabase.from('subscription_history').insert({
        user_id: user.id,
        old_plan: user.plan,
        new_plan: 'free',
        reason: 'expired',
        changed_by: null, // system
      });

      downgraded++;
    }

    console.log(`[Cron] check-expired: downgraded ${downgraded}/${expiredUsers.length} users`);

    return NextResponse.json({
      success: true,
      downgraded,
      total_expired: expiredUsers.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron] check-expired error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
