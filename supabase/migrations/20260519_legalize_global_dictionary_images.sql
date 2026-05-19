-- Hợp thức hóa các cột ảnh của global_dictionary
-- Trước đây image_url/image_source được thêm bằng ALTER TABLE chạy lén trong
-- api/bot/fill-images/route.ts (vi phạm rule NEVER ALTER TABLE trực tiếp).
-- Migration này ghi nhận chính thức + bổ sung metadata cho pipeline ảnh mới.
-- Idempotent: an toàn cả khi cột đã tồn tại trên production.

ALTER TABLE global_dictionary
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS image_confidence SMALLINT,   -- điểm AI Vision 0-100, NULL = chưa chấm
    ADD COLUMN IF NOT EXISTS image_query TEXT,             -- query thực tế đã dùng để tìm ảnh (audit/debug)
    ADD COLUMN IF NOT EXISTS image_verified_at TIMESTAMPTZ;

-- Index một phần: tăng tốc truy vấn các từ còn thiếu ảnh (cho job backfill)
CREATE INDEX IF NOT EXISTS idx_gd_image_pending
    ON global_dictionary (word)
    WHERE image_url IS NULL OR image_source = 'none';
