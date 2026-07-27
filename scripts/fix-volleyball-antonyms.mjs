/**
 * volleyball antonyms = ["none"] là rác.
 * node scripts/fix-volleyball-antonyms.mjs
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

const r = await fetch(`${url}/rest/v1/global_dictionary?word=eq.volleyball&select=word,data`, { headers });
const row = (await r.json())[0];
if (!row) {
  console.error('not found');
  process.exit(1);
}
const data = structuredClone(row.data || {});
console.log('before ant', data.antonyms);
data.antonyms = [];
// badminton không phải synonym của volleyball
if (Array.isArray(data.synonyms)) {
  data.synonyms = data.synonyms.filter((s) => String(s).toLowerCase() !== 'badminton');
}
const patch = await fetch(`${url}/rest/v1/global_dictionary?word=eq.volleyball`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ data }),
});
const out = await patch.json();
console.log('status', patch.status, 'after ant', out[0]?.data?.antonyms, 'syn', out[0]?.data?.synonyms);
