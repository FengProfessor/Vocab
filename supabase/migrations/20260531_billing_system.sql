-- =============================================
-- Billing System — Orders, Subscriptions, Coupons
-- =============================================

-- 1. ORDERS: mỗi lần user thanh toán = 1 order
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan text NOT NULL CHECK (plan IN ('pro', 'premium', 'school')),
  amount integer NOT NULL,                -- VNĐ
  currency text DEFAULT 'VND',
  payment_method text CHECK (payment_method IN ('vnpay', 'momo', 'bank_transfer', 'manual')),
  payment_ref text,                       -- mã giao dịch gateway
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
  note text,                              -- ghi chú admin
  coupon_code text,                       -- mã giảm giá đã dùng
  period_months integer DEFAULT 1,        -- số tháng mua
  starts_at timestamptz,                  -- bắt đầu gói
  expires_at timestamptz,                 -- hết hạn gói
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  processed_by uuid REFERENCES public.profiles(id) -- admin duyệt
);

-- 2. SUBSCRIPTION HISTORY: log mọi thay đổi gói
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  old_plan text,
  new_plan text NOT NULL,
  reason text,                            -- 'upgrade', 'downgrade', 'expired', 'admin_manual', 'payment'
  order_id uuid REFERENCES public.orders(id),
  changed_by uuid REFERENCES public.profiles(id), -- null = hệ thống tự thay đổi
  created_at timestamptz DEFAULT now()
);

-- 3. COUPONS: mã giảm giá
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_pct integer CHECK (discount_pct IS NULL OR (discount_pct BETWEEN 1 AND 100)),
  discount_amount integer,                -- VNĐ (dùng 1 trong 2: pct hoặc amount)
  max_uses integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  applicable_plans text[],                -- e.g. ARRAY['pro','premium']
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT discount_type_check CHECK (
    (discount_pct IS NOT NULL AND discount_amount IS NULL) OR
    (discount_pct IS NULL AND discount_amount IS NOT NULL)
  )
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Orders: users see own, admin sees all (via service client)
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscription history: users see own
CREATE POLICY "Users view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- Coupons: read-only for authenticated
CREATE POLICY "Authenticated users read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- =============================================
-- RPC: tăng used_count của coupon (gọi từ confirmOrder, service role)
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.coupons SET used_count = used_count + 1 WHERE code = p_code;
$$;
