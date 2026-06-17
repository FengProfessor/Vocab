-- Teacher/center sales pilot leads.
-- Public submissions only go through /api/pilot/leads using service_role.

create table if not exists public.pilot_leads (
  id uuid primary key default uuid_generate_v4(),
  contact_name text not null,
  email text not null,
  phone text not null,
  organization text not null,
  teacher_count integer not null check (teacher_count between 1 and 10000),
  student_count integer not null check (student_count between 1 and 1000000),
  message text,
  source text not null default 'teacher_landing',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  admin_note text,
  contacted_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pilot_leads_status_created
  on public.pilot_leads(status, created_at desc);
create index if not exists idx_pilot_leads_email
  on public.pilot_leads(lower(email));

alter table public.pilot_leads enable row level security;

create table if not exists public.pilot_lead_rate_limits (
  key_hash text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.pilot_lead_rate_limits enable row level security;

create or replace function public.check_pilot_lead_rate_limit(
  p_key_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 3600
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.pilot_lead_rate_limits(key_hash, request_count, window_started_at)
  values (p_key_hash, 1, now())
  on conflict (key_hash) do update
  set request_count = case
        when pilot_lead_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then 1
        else pilot_lead_rate_limits.request_count + 1
      end,
      window_started_at = case
        when pilot_lead_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then now()
        else pilot_lead_rate_limits.window_started_at
      end
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.check_pilot_lead_rate_limit(text, integer, integer) from public;
grant execute on function public.check_pilot_lead_rate_limit(text, integer, integer) to service_role;

-- Intentionally no anon/authenticated policies. Service role is the only access path.
comment on table public.pilot_leads is
  'Leads for the 60-day teacher/center sales pilot. Service-role only.';
