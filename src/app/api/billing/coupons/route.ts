/**
 * GET    /api/billing/coupons — List coupons (admin only)
 * POST   /api/billing/coupons — Create coupon (admin only)
 * DELETE /api/billing/coupons?id=<uuid> — Delete coupon (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Fail-closed: env rỗng → mảng rỗng → mọi request đều 403 (tránh [''].includes('') = true)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function requireAdmin(req: NextRequest) {
  const supabase = createServiceClient();
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return { error: 'Unauthorized', status: 401, supabase, user: null };

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '')) {
    return { error: 'Admin access required', status: 403, supabase, user: null };
  }
  return { error: null, status: 200, supabase, user };
}

export async function GET(req: NextRequest) {
  const { error, status, supabase } = await requireAdmin(req);
  if (error) return NextResponse.json({ error }, { status });

  const { data, error: dbErr } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ success: true, coupons: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { error, status, supabase } = await requireAdmin(req);
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json() as {
    code: string;
    discountPct?: number;
    discountAmount?: number;
    maxUses?: number;
    validUntil?: string;
    applicablePlans?: string[];
  };

  if (!body.code?.trim()) {
    return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
  }

  const { data, error: dbErr } = await supabase
    .from('coupons')
    .insert({
      code: body.code.trim().toUpperCase(),
      discount_pct: body.discountPct ?? null,
      discount_amount: body.discountAmount ?? null,
      max_uses: body.maxUses ?? null,
      valid_until: body.validUntil ?? null,
      applicable_plans: body.applicablePlans ?? null,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ success: true, coupon: data });
}

export async function DELETE(req: NextRequest) {
  const { error, status, supabase } = await requireAdmin(req);
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Coupon id required' }, { status: 400 });

  const { error: dbErr } = await supabase.from('coupons').delete().eq('id', id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
