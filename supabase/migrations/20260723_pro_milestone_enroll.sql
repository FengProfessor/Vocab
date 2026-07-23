-- Pro trial mốc học: chỉ nick từng enroll khi còn dưới mốc (<50 từ + streak <3)
-- mới được claim NEWBIE*. Chặn power user (200+ từ) redeem free Pro.

alter table public.profiles
  add column if not exists pro_milestone_enrolled_at timestamptz;

comment on column public.profiles.pro_milestone_enrolled_at is
  'Thời điểm user vào funnel quà Pro newbie (chỉ set khi words<50 và streak<3). Claim NEWBIE* bắt buộc có cột này.';

create index if not exists idx_profiles_pro_milestone_enrolled
  on public.profiles (pro_milestone_enrolled_at)
  where pro_milestone_enrolled_at is not null;
