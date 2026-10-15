-- Migration: Expand user_roadmap_assessments_track_check to support 'vstep' and 'vnu-bac-3' exam submissions

alter table public.user_roadmap_assessments
  drop constraint if exists user_roadmap_assessments_track_check;

alter table public.user_roadmap_assessments
  add constraint user_roadmap_assessments_track_check
  check (track in ('cefr', 'thpt', 'toeic', 'vstep', 'vnu-bac-3'));
