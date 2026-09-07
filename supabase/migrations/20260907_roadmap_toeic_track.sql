-- Migration: 20260907_roadmap_toeic_track.sql
-- Bổ sung track 'toeic' vào user_roadmap và user_roadmap_assessments
-- Mở rộng level_id chấp nhận các cấp TOEIC: 'toeic-450', 'toeic-650', 'toeic-800'

-- 1. user_roadmap: nới lỏng check constraint trên track
alter table public.user_roadmap drop constraint if exists user_roadmap_track_check;
alter table public.user_roadmap
  add constraint user_roadmap_track_check
  check (track in ('cefr', 'thpt', 'toeic'));

-- 2. user_roadmap: nới lỏng check constraint trên level_id
alter table public.user_roadmap drop constraint if exists user_roadmap_level_id_check;
alter table public.user_roadmap
  add constraint user_roadmap_level_id_check
  check (level_id in (
    'A0', 'A1', 'A2', 'B1', 'B2',
    'lop-10', 'lop-11', 'lop-12',
    'toeic-450', 'toeic-650', 'toeic-800'
  ));

-- 3. user_roadmap_assessments: nếu bảng đã tồn tại, nới lỏng check constraint trên track
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'user_roadmap_assessments'
  ) then
    alter table public.user_roadmap_assessments drop constraint if exists user_roadmap_assessments_track_check;
    alter table public.user_roadmap_assessments
      add constraint user_roadmap_assessments_track_check
      check (track in ('cefr', 'thpt', 'toeic'));
  end if;
end $$;
