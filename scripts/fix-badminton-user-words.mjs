/**
 * Sửa translation badminton trong words (sổ HV) khi bị lưu sai "bóng chuyền".
 * node scripts/fix-badminton-user-words.mjs
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
if (!url || !key) {
  console.error('Missing SUPABASE env');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

// Đếm trước
const countRes = await fetch(
  `${url}/rest/v1/words?word=ilike.badminton&translation=eq.${encodeURIComponent('bóng chuyền')}&select=id`,
  { headers: { ...headers, Prefer: 'count=exact' } },
);
const total = countRes.headers.get('content-range');
console.log('content-range before', total);

const patch = await fetch(
  `${url}/rest/v1/words?word=ilike.badminton&translation=eq.${encodeURIComponent('bóng chuyền')}`,
  {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ translation: 'cầu lông' }),
  },
);
const out = await patch.json();
if (!patch.ok) {
  console.error('patch failed', patch.status, out);
  process.exit(1);
}
console.log('updated_rows', Array.isArray(out) ? out.length : out);
console.log('sample', Array.isArray(out) ? out.slice(0, 3) : out);

// Verify residual
const left = await fetch(
  `${url}/rest/v1/words?word=ilike.badminton&translation=eq.${encodeURIComponent('bóng chuyền')}&select=id&limit=5`,
  { headers },
);
console.log('remaining_wrong', await left.json());
