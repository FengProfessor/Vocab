-- Migration: Add province and city columns to profiles table for geo-targeting and localization
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN public.profiles.province IS 'Tỉnh/Thành phố của học sinh phục vụ phân khúc lớp học và thông báo';
COMMENT ON COLUMN public.profiles.city IS 'Tùy chọn alias thành phố của học sinh';

CREATE INDEX IF NOT EXISTS idx_profiles_province ON public.profiles(province)
  WHERE province IS NOT NULL;
