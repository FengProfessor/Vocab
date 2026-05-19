-- Bổ sung metadata ảnh + synonyms/antonyms cho bảng words.
-- image_url + dictionary_data đã có (migration 20260410, 20260412).
-- LƯU Ý: api/words/route.ts (enrichWord) đang ghi synonyms/antonyms nhưng
-- bảng words chưa có 2 cột này → toàn bộ lệnh update fail âm thầm (kéo theo
-- image_url cũng không lưu được). Migration này khắc phục.
-- Idempotent: an toàn cả khi cột đã tồn tại.

ALTER TABLE words
    ADD COLUMN IF NOT EXISTS image_source TEXT,
    ADD COLUMN IF NOT EXISTS image_confidence SMALLINT,   -- điểm AI Vision 0-100, NULL = chưa chấm
    ADD COLUMN IF NOT EXISTS synonyms TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS antonyms TEXT[] DEFAULT '{}';
