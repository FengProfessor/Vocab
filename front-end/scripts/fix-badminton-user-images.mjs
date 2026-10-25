/**
 * Xóa ảnh bóng chuyền gán nhầm cho badminton trong words.
 * node scripts/fix-badminton-user-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(root, '..', '.env.local'), 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '').trim() : '';
};
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY');
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const badImg =
  'https://thuthuatnhanh.com/wp-content/uploads/2022/09/hinh-anh-bong-chuyen-nam.jpg';

const patch = await fetch(
  `${url}/rest/v1/words?word=ilike.badminton&image_url=eq.${encodeURIComponent(badImg)}`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      image_url: null,
      image_source: 'none',
      image_confidence: null,
    }),
  },
);
const out = await patch.json();
if (!patch.ok) {
  console.error('failed', patch.status, out);
  process.exit(1);
}
console.log('cleared_images', Array.isArray(out) ? out.length : out);
