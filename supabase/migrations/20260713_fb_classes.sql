-- Lớp học live Facebook trả phí theo cohort (vd: 10 buổi = 50k).
-- Nội dung học ở group FB; app chỉ thu tiền + cấp mã + quản roster/kick.
-- KHÔNG cấp entitlement Pro (khác hẳn order individual/group).

-- 1. Bảng khóa (mỗi cohort = 1 khóa có ngày kết thúc cố định)
create table if not exists public.fb_classes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  price         integer not null default 50000,       -- VNĐ
  session_count integer not null default 10,           -- số buổi
  start_date    date,
  end_date      date not null,                          -- = ngày buổi cuối → mốc hết hạn
  fb_group_url  text,                                   -- link group KÍN (chỉ lộ sau khi trả phí)
  status        text not null default 'active'
                  check (status in ('active','ended','cancelled')),
  created_at    timestamptz not null default now()
);

alter table public.fb_classes enable row level security;

-- Ai đăng nhập cũng đọc được thông tin khóa (trang mua). owner toàn quyền khóa của mình.
drop policy if exists fb_classes_select on public.fb_classes;
create policy fb_classes_select on public.fb_classes
  for select using (true);

drop policy if exists fb_classes_owner_write on public.fb_classes;
create policy fb_classes_owner_write on public.fb_classes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 2. orders: liên kết khóa FB + link Facebook cá nhân HS (để kick)
alter table public.orders add column if not exists fb_class_id uuid
  references public.fb_classes(id) on delete set null;
alter table public.orders add column if not exists fb_profile_url text;

-- 3. Mở rộng order_kind cho 'fbclass' (bỏ mọi CHECK cũ trên cột này rồi thêm lại)
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel  on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'orders' and nsp.nspname = 'public' and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%order_kind%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
  alter table public.orders
    add constraint orders_order_kind_check
    check (order_kind in ('individual','group','fbclass'));
end $$;

create index if not exists idx_orders_fb_class
  on public.orders(fb_class_id) where fb_class_id is not null;
