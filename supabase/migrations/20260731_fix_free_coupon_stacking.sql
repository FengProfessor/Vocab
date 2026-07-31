-- Migration: Fix redeem_free_coupon_order to stack subscription time onto existing plan_expires_at if user has an active plan.

create or replace function public.redeem_free_coupon_order(
  p_user_id uuid,
  p_plan text,
  p_period_months integer,
  p_payment_method text,
  p_coupon_code text,
  p_base_amount integer
)
returns table (
  id uuid,
  amount integer,
  plan text,
  period_months integer,
  status text,
  coupon_code text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
#variable_conflict use_column
declare
  v_coupon public.coupons%rowtype;
  v_old_plan text;
  v_old_expires_at timestamptz;
  v_now timestamptz := now();
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_final_amount integer;
  v_order public.orders%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'redeem_free_coupon_order requires service_role'
      using errcode = '42501';
  end if;

  if p_plan not in ('pro', 'premium') then
    raise exception 'Invalid plan';
  end if;

  if p_period_months not in (1, 3, 6, 12) then
    raise exception 'Invalid period_months';
  end if;

  if p_base_amount is null or p_base_amount <= 0 then
    raise exception 'Invalid base amount';
  end if;

  select *
  into v_coupon
  from public.coupons
  where code = upper(btrim(p_coupon_code))
    and is_active = true
  for update;

  if not found then
    raise exception 'Coupon is not valid';
  end if;

  if v_coupon.valid_from is not null and v_now < v_coupon.valid_from then
    raise exception 'Coupon is not active yet';
  end if;

  if v_coupon.valid_until is not null and v_now > v_coupon.valid_until then
    raise exception 'Coupon has expired';
  end if;

  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    raise exception 'Coupon usage limit reached';
  end if;

  if v_coupon.applicable_plans is not null and not (p_plan = any(v_coupon.applicable_plans)) then
    raise exception 'Coupon is not applicable to this plan';
  end if;

  if v_coupon.discount_pct is not null then
    v_final_amount := greatest(0, round(p_base_amount * (1 - v_coupon.discount_pct / 100.0))::integer);
  elsif v_coupon.discount_amount is not null then
    v_final_amount := greatest(0, p_base_amount - v_coupon.discount_amount);
  else
    raise exception 'Coupon discount is missing';
  end if;

  if v_final_amount <> 0 then
    raise exception 'Coupon does not fully discount this order';
  end if;

  select profiles.plan, profiles.plan_expires_at
  into v_old_plan, v_old_expires_at
  from public.profiles as profiles
  where profiles.id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  v_starts_at := case
    when v_old_expires_at is not null and v_old_expires_at > v_now then v_old_expires_at
    else v_now
  end;

  v_expires_at := v_starts_at + make_interval(months => p_period_months);

  insert into public.orders (
    user_id,
    plan,
    amount,
    payment_method,
    period_months,
    coupon_code,
    status,
    paid_at,
    starts_at,
    expires_at
  )
  values (
    p_user_id,
    p_plan,
    0,
    p_payment_method,
    p_period_months,
    v_coupon.code,
    'paid',
    v_now,
    v_starts_at,
    v_expires_at
  )
  returning * into v_order;

  update public.profiles
  set
    plan = p_plan,
    plan_expires_at = v_expires_at
  where id = p_user_id;

  insert into public.subscription_history (
    user_id,
    old_plan,
    new_plan,
    reason,
    order_id
  )
  values (
    p_user_id,
    coalesce(v_old_plan, 'free'),
    p_plan,
    'payment',
    v_order.id
  );

  update public.coupons
  set used_count = used_count + 1
  where id = v_coupon.id;

  return query
  select
    v_order.id,
    v_order.amount,
    v_order.plan,
    v_order.period_months,
    v_order.status,
    v_order.coupon_code,
    v_order.created_at;
end;
$function$;

comment on function public.redeem_free_coupon_order(uuid, text, integer, text, text, integer) is
  'Atomically creates a paid zero-value order, updates entitlement (stacking on top of active plan), writes history, and increments coupon usage.';

revoke all on function public.redeem_free_coupon_order(uuid, text, integer, text, text, integer) from public;
grant execute on function public.redeem_free_coupon_order(uuid, text, integer, text, text, integer) to service_role;
