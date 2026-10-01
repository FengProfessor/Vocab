import { authorizeWebAdmin } from '@/lib/admin-auth';
import { PRIVATE_SESSION_HEADERS, withSessionErrors } from '@/lib/session-response';
/**
 * GET    /api/billing/coupons — List coupons (admin only)
 * POST   /api/billing/coupons — Create coupon (admin only)
 * DELETE /api/billing/coupons?id=<uuid> — Delete coupon (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function couponFailure() {
  console.error('[Coupons] operation_failed');
  return NextResponse.json({ success: false, error: 'Coupon operation failed' }, {
    status: 500, headers: PRIVATE_SESSION_HEADERS,
  });
}

async function listCoupons(req: NextRequest) {
  const admin = await authorizeWebAdmin(req);
  if (admin.response) return admin.response;
  const { supabase } = admin;

  const { data, error: dbErr } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbErr) return couponFailure();
  return NextResponse.json({ success: true, coupons: data ?? [] });
}

async function createCoupon(req: NextRequest) {
  const admin = await authorizeWebAdmin(req);
  if (admin.response) return admin.response;
  const { supabase } = admin;

  const body = await req.json().catch(() => null) as {
    code: string;
    discountPct?: number;
    discountAmount?: number;
    maxUses?: number;
    validUntil?: string;
    applicablePlans?: string[];
  } | null;

  if (!body || typeof body.code !== 'string' || !body.code.trim()) {
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

  if (dbErr) return couponFailure();
  return NextResponse.json({ success: true, coupon: data });
}

async function deleteCoupon(req: NextRequest) {
  const admin = await authorizeWebAdmin(req);
  if (admin.response) return admin.response;
  const { supabase } = admin;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Coupon id required' }, { status: 400 });

  const { error: dbErr } = await supabase.from('coupons').delete().eq('id', id);
  if (dbErr) return couponFailure();
  return NextResponse.json({ success: true });
}

export const GET = withSessionErrors(listCoupons);
export const POST = withSessionErrors(createCoupon);
export const DELETE = withSessionErrors(deleteCoupon);
