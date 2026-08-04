-- Migration: Add 100% discount coupon 'WLU' for 1 year free unlock (internal use)
INSERT INTO public.coupons (
  code,
  discount_pct,
  discount_amount,
  max_uses,
  used_count,
  valid_from,
  valid_until,
  applicable_plans,
  is_active
)
VALUES (
  'WLU',
  100,
  NULL,
  NULL,
  0,
  NOW(),
  NULL,
  ARRAY['pro', 'premium'],
  true
)
ON CONFLICT (code) DO UPDATE SET
  discount_pct = EXCLUDED.discount_pct,
  discount_amount = EXCLUDED.discount_amount,
  is_active = true,
  applicable_plans = EXCLUDED.applicable_plans;
