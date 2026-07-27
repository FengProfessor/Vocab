/**
 * Xóa antonyms sai của "teach" (learn/study = cặp vai trò, không phải trái nghĩa).
 * node scripts/fix-teach-antonyms.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
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

const r = await fetch(`${url}/rest/v1/global_dictionary?word=eq.teach&select=word,data`, {
  headers,
});
const rows = await r.json();
const row = rows[0];
if (!row) {
  console.error('teach not found');
  process.exit(1);
}
const data = { ...(row.data || {}) };
console.log('before', { synonyms: data.synonyms, antonyms: data.antonyms });
data.antonyms = [];
// keep good synonyms; drop learn if wrongly in syn
if (Array.isArray(data.synonyms)) {
  data.synonyms = data.synonyms.filter(
    (s) => !['learn', 'study', 'learning', 'blackbeard', 'thatch'].includes(String(s).toLowerCase()),
  );
}
const patch = await fetch(`${url}/rest/v1/global_dictionary?word=eq.teach`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ data }),
});
const out = await patch.json();
console.log('status', patch.status);
console.log('after', { synonyms: out[0]?.data?.synonyms, antonyms: out[0]?.data?.antonyms });
