-- Migration: 20260906_create_translations_cache.sql
-- Description: Bảng lưu trữ cache bản dịch từ LibreTranslate / NMT engine

CREATE TABLE IF NOT EXISTS public.translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    source_lang TEXT NOT NULL DEFAULT 'en',
    target_lang TEXT NOT NULL DEFAULT 'vi',
    translated_text TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'libretranslate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_translations_source_target UNIQUE (source_text, source_lang, target_lang)
);

COMMENT ON TABLE public.translations IS 'Cache các bản dịch từ LibreTranslate/NMT để giảm tải server và tối ưu tốc độ';

-- Indexes for fast exact lookups
CREATE INDEX IF NOT EXISTS idx_translations_lookup 
    ON public.translations (source_text, target_lang);

CREATE INDEX IF NOT EXISTS idx_translations_full_lookup 
    ON public.translations (source_text, source_lang, target_lang);

-- Row Level Security (RLS)
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc công khai (mọi client/user đều có thể xem bản dịch đã cache)
CREATE POLICY "Public read translations cache"
    ON public.translations
    FOR SELECT
    USING (true);

-- Cho phép thêm hoặc cập nhật bản dịch
CREATE POLICY "Public insert translations cache"
    ON public.translations
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update translations cache"
    ON public.translations
    FOR UPDATE
    USING (true);
