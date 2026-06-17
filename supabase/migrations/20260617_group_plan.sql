-- =============================================
-- Gói Nhóm (Group Plan) — 1 owner trả gộp, N ghế Pro chia cho nhóm bạn
-- groups + group_members; orders thêm order_kind + seats
-- =============================================

-- 1. ORDERS: phân biệt order cá nhân vs nhóm + số ghế mua
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_kind text NOT NULL DEFAULT 'individual'
    CHECK (order_kind IN ('individual', 'group'));
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seats integer NOT NULL DEFAULT 1;
-- order.plan giữ 'pro' cho gói nhóm → KHÔNG thêm giá trị mới vào CHECK plan.

-- 2. GROUPS: mỗi gói nhóm đã kích hoạt = 1 row
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'pro' CHECK (plan IN ('pro', 'premium')),
  seat_limit integer NOT NULL DEFAULT 10,     -- gồm cả owner (owner = 1 ghế)
  invite_code text UNIQUE NOT NULL,           -- mã mời 6 ký tự
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. GROUP_MEMBERS: thành viên trong nhóm (gồm cả owner)
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_groups_owner ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- =============================================
-- RLS
-- Đọc/ghi thực tế đi qua service client (createServiceClient) trong API routes.
-- Policy giữ self-scoped, KHÔNG cross-reference bảng kia → tránh đệ quy RLS (Supabase pitfall).
-- =============================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner views own groups" ON public.groups
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users view own membership" ON public.group_members
  FOR SELECT USING (auth.uid() = user_id);
