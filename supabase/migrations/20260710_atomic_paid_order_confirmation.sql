-- Xác nhận đơn trả phí trong một transaction, an toàn khi webhook retry/chạy song song.

create unique index if not exists idx_orders_payment_ref_unique
  on public.orders (payment_ref)
  where payment_ref is not null;

create or replace function public.confirm_paid_order(
  p_order_id uuid,
  p_admin_id uuid default null,
  p_payment_ref text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_order public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_now timestamptz := now();
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_payment_ref text := nullif(btrim(p_payment_ref), '');
  v_group public.groups%rowtype;
  v_group_id uuid;
  v_invite_code text;
  v_attempt integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'confirm_paid_order requires service_role' using errcode = '42501';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;

  -- Retry cùng giao dịch đã hoàn tất không tạo lịch sử/coupon lần hai.
  if v_order.status = 'paid'
    and v_order.payment_ref is not distinct from v_payment_ref then
    return jsonb_build_object(
      'success', true, 'idempotent', true, 'plan', v_order.plan,
      'expiresAt', v_order.expires_at
    );
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Order already %', v_order.status using errcode = 'P0001';
  end if;

  if v_payment_ref is not null and exists (
    select 1 from public.orders
    where payment_ref = v_payment_ref and id <> v_order.id
  ) then
    raise exception 'Payment reference already used' using errcode = '23505';
  end if;

  if v_order.period_months not in (1, 3, 6, 12) then
    raise exception 'Invalid order period_months' using errcode = '22023';
  end if;

  if v_order.order_kind = 'individual' then
    select * into v_profile
    from public.profiles
    where id = v_order.user_id
    for update;

    if not found then
      raise exception 'Profile not found' using errcode = 'P0002';
    end if;

    v_starts_at := case
      when v_profile.plan_expires_at > v_now then v_profile.plan_expires_at
      else v_now
    end;
    v_expires_at := v_starts_at + make_interval(months => v_order.period_months);

    update public.profiles
    set plan = v_order.plan, plan_expires_at = v_expires_at
    where id = v_order.user_id;

    insert into public.subscription_history (
      user_id, old_plan, new_plan, reason, order_id, changed_by
    ) values (
      v_order.user_id, coalesce(v_profile.plan, 'free'), v_order.plan,
      'payment', v_order.id, p_admin_id
    );
  elsif v_order.order_kind = 'group' then
    -- Giữ hành vi gói nhóm hiện tại nhưng thực hiện toàn bộ trong transaction.
    v_starts_at := v_now;
    v_expires_at := v_now + make_interval(months => v_order.period_months);

    select * into v_group
    from public.groups
    where owner_id = v_order.user_id and status = 'active'
    order by created_at desc
    limit 1
    for update;

    if found then
      v_group_id := v_group.id;
      update public.groups
      set expires_at = v_expires_at,
          seat_limit = greatest(seat_limit, v_order.seats),
          order_id = v_order.id,
          status = 'active'
      where id = v_group_id;
    else
      for v_attempt in 1..8 loop
        v_invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
        begin
          insert into public.groups (
            owner_id, plan, seat_limit, invite_code, status,
            starts_at, expires_at, order_id
          ) values (
            v_order.user_id, v_order.plan, greatest(v_order.seats, 2),
            v_invite_code, 'active', v_starts_at, v_expires_at, v_order.id
          ) returning id into v_group_id;
          exit;
        exception when unique_violation then
          v_group_id := null;
        end;
      end loop;

      if v_group_id is null then
        raise exception 'Failed to generate unique group invite code';
      end if;

      insert into public.group_members (group_id, user_id)
      values (v_group_id, v_order.user_id)
      on conflict (group_id, user_id) do nothing;
    end if;

    -- Không hạ tier đang còn hiệu lực; đồng bộ expiry cho owner và thành viên.
    update public.profiles as profiles
    set plan = case
          when profiles.plan = 'premium'
            and profiles.plan_expires_at > v_now
            and v_order.plan = 'pro'
          then profiles.plan
          else v_order.plan
        end,
        plan_expires_at = greatest(
          coalesce(profiles.plan_expires_at, v_expires_at), v_expires_at
        )
    where profiles.id in (
      select members.user_id
      from public.group_members as members
      where members.group_id = v_group_id
      union select v_order.user_id
    );

    insert into public.subscription_history (
      user_id, old_plan, new_plan, reason, order_id, changed_by
    ) values (
      v_order.user_id, null, v_order.plan, 'payment', v_order.id, p_admin_id
    );
  else
    raise exception 'Unsupported order kind: %', v_order.order_kind using errcode = '22023';
  end if;

  update public.orders
  set status = 'paid', paid_at = v_now, starts_at = v_starts_at,
      expires_at = v_expires_at, processed_by = p_admin_id,
      payment_ref = v_payment_ref, note = coalesce(p_note, note)
  where id = v_order.id
    and status = 'pending';

  if not found then
    raise exception 'Order already %', v_order.status using errcode = 'P0001';
  end if;

  if v_order.coupon_code is not null then
    update public.coupons
    set used_count = used_count + 1
    where code = v_order.coupon_code;
  end if;

  return jsonb_build_object(
    'success', true, 'idempotent', false, 'plan', v_order.plan,
    'expiresAt', v_expires_at
  );
end;
$function$;

comment on function public.confirm_paid_order(uuid, uuid, text, text) is
  'Atomically and idempotently confirms a paid individual or group order.';

revoke all on function public.confirm_paid_order(uuid, uuid, text, text) from public;
revoke all on function public.confirm_paid_order(uuid, uuid, text, text) from anon;
revoke all on function public.confirm_paid_order(uuid, uuid, text, text) from authenticated;
grant execute on function public.confirm_paid_order(uuid, uuid, text, text) to service_role;

-- Webhook event log: safe replay / audit trail (service_role only).
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  provider text,
  order_id uuid references public.orders(id) on delete set null,
  payment_ref text,
  payload_hash text,
  status text not null default 'received'
    check (status in ('received', 'processed', 'ignored', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists idx_payment_webhook_events_event_key
  on public.payment_webhook_events (event_key);

create index if not exists idx_payment_webhook_events_payment_ref
  on public.payment_webhook_events (payment_ref)
  where payment_ref is not null;

alter table public.payment_webhook_events enable row level security;
revoke all on table public.payment_webhook_events from public, anon, authenticated;
grant all on table public.payment_webhook_events to service_role;
