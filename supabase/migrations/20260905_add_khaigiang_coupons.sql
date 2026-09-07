-- Migration: Add 100% discount trial coupons KHAIGIANG3M and THAYPHONG3M for Back-to-School campaign
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
VALUES
  (
    'KHAIGIANG3M',
    100,
    NULL,
    NULL,
    0,
    NOW(),
    '2026-12-31 23:59:59+00',
    ARRAY['pro'],
    true
  ),
  (
    'THAYPHONG3M',
    100,
    NULL,
    NULL,
    0,
    NOW(),
    '2026-12-31 23:59:59+00',
    ARRAY['pro'],
    true
  )
ON CONFLICT (code) DO UPDATE SET
  discount_pct = EXCLUDED.discount_pct,
  discount_amount = EXCLUDED.discount_amount,
  valid_until = EXCLUDED.valid_until,
  applicable_plans = EXCLUDED.applicable_plans,
  is_active = true;
