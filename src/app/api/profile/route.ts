import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized, safeErrorResponse } from '@/lib/api-security';
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  validateDisplayName,
} from '@/lib/display-name';
import {
  FREE_WORD_SAVE_MONTHLY_LIMIT,
  getEffectivePlan,
  getRemainingDays,
  type Plan,
} from '@/lib/entitlement';
import { getWordSaveUsage } from '@/lib/entitlement-server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();
    const { data, error: dbErr } = await supabase.from('profiles').select('*').eq('id', auth.userId).single();
    if (dbErr) return safeErrorResponse(dbErr, 'Không tải được hồ sơ');

    const rawPlan = (data?.plan as Plan | undefined) ?? 'free';
    const expiresAt = (data?.plan_expires_at as string | null | undefined) ?? null;
    const effectivePlan = getEffectivePlan(rawPlan, expiresAt);
    const remainingDays = getRemainingDays(expiresAt);
    const wordUsage = await getWordSaveUsage(supabase, auth.userId, effectivePlan, data?.created_at);

    return NextResponse.json({
      success: true,
      data,
      entitlement: {
        rawPlan,
        effectivePlan,
        expiresAt,
        remainingDays,
        wordQuota: {
          used: wordUsage.used,
          lifetime: wordUsage.lifetime,
          limit: wordUsage.limit ?? (effectivePlan === 'free' ? FREE_WORD_SAVE_MONTHLY_LIMIT : null),
          remaining: wordUsage.remaining,
        },
      },
      meta: { displayNameMin: DISPLAY_NAME_MIN, displayNameMax: DISPLAY_NAME_MAX },
    });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không tải được hồ sơ');
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();

    const body = await req.json() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (typeof body.full_name === 'string') {
      const checked = validateDisplayName(body.full_name);
      if (!checked.ok) {
        return NextResponse.json({ success: false, error: checked.error }, { status: 400 });
      }
      updates.full_name = checked.name;
    }
    if (typeof body.daily_goal === 'number') {
      updates.daily_goal = Math.max(5, Math.min(50, Math.round(body.daily_goal)));
    }
    if (typeof body.notification_hour === 'number') {
      updates.notification_hour = Math.max(0, Math.min(23, Math.round(body.notification_hour)));
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error: dbErr } = await supabase.from('profiles').update(updates).eq('id', auth.userId).select().single();
    if (dbErr) return safeErrorResponse(dbErr, 'Không cập nhật được hồ sơ');

    // Đồng bộ tên lên room_presence nếu có bảng
    if (typeof updates.full_name === 'string') {
      await supabase
        .from('room_presence')
        .update({
          display_name: updates.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', auth.userId);
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Không cập nhật được hồ sơ');
  }
}
