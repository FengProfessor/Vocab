/**
 * [ImageSchema] Probe các cột metadata ảnh trên global_dictionary + words.
 * Nếu thiếu → in SQL ra để copy vào Supabase SQL Editor.
 * Chạy: cd web-app && npx tsx scripts/check-image-schema.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REQUIRED_GD = [
  'image_url',
  'image_source',
  'image_confidence',
  'image_query',
  'image_verified_at',
];
const REQUIRED_WORDS = ['image_url', 'image_source', 'image_confidence'];

const SQL_FIX = `-- Chạy trong Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- An toàn idempotent: chỉ thêm cột thiếu, không xóa gì.

ALTER TABLE global_dictionary
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_source TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS image_confidence SMALLINT,
  ADD COLUMN IF NOT EXISTS image_query TEXT,
  ADD COLUMN IF NOT EXISTS image_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gd_image_pending
  ON global_dictionary (word)
  WHERE image_url IS NULL OR image_source = 'none' OR image_source = 'placeholder';

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS image_source TEXT,
  ADD COLUMN IF NOT EXISTS image_confidence SMALLINT;
`;

async function probe(supabase: ReturnType<typeof createClient>, table: string, col: string): Promise<boolean> {
  const { error } = await supabase.from(table).select(col).limit(1);
  if (!error) return true;
  if (error.message.includes(col) || error.message.includes('column')) return false;
  // Lỗi khác (vd quyền) → coi như có để không hiển thị sai
  console.warn(`[ImageSchema] probe ${table}.${col} bất thường:`, error.message);
  return true;
}

async function main() {
  if (!url || !key) {
    console.error('[ImageSchema] LỖI: thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  console.log('\n=== KIỂM TRA SCHEMA ẢNH ===\n');

  const missing: string[] = [];
  for (const col of REQUIRED_GD) {
    const ok = await probe(supabase, 'global_dictionary', col);
    console.log(`  global_dictionary.${col.padEnd(22)} ${ok ? 'OK' : 'THIẾU'}`);
    if (!ok) missing.push(`global_dictionary.${col}`);
  }
  for (const col of REQUIRED_WORDS) {
    const ok = await probe(supabase, 'words', col);
    console.log(`  words.${col.padEnd(22)}             ${ok ? 'OK' : 'THIẾU'}`);
    if (!ok) missing.push(`words.${col}`);
  }

  if (missing.length === 0) {
    console.log('\n✅ Tất cả cột ảnh đã tồn tại. Không cần chạy migration.\n');
    return;
  }

  console.log(`\n❌ Thiếu ${missing.length} cột. Copy SQL bên dưới chạy ở Supabase Dashboard:\n`);
  console.log('─'.repeat(70));
  console.log(SQL_FIX);
  console.log('─'.repeat(70));
  console.log('\nLink: https://supabase.com/dashboard/project/_/sql/new\n');
  process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
