import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-security';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const supabase = createServiceClient();
    const { data, error: dbErr } = await supabase.from('profiles').select('*').eq('id', auth.userId).single();
    if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
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
      updates.full_name = body.full_name.trim().slice(0, 50);
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
    if (dbErr) return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
