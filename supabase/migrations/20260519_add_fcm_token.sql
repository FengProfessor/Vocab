-- Add fcm_token column to profiles table for Firebase Cloud Messaging
alter table public.profiles
add column fcm_token text;

-- Index for efficient token lookups during push notifications
create index if not exists idx_profiles_fcm_token on public.profiles(fcm_token)
where fcm_token is not null;
