/**
 * Fix badminton: definition sai "bóng chuyền" → "môn cầu lông",
 * xóa ảnh volleyball, antonyms rác, normalize IPA.
 * node scripts/fix-badminton.mjs
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

const stripIpa = (s) => String(s || '').trim().replace(/^\/+|\/+$/g, '').trim();

const r = await fetch(`${url}/rest/v1/global_dictionary?word=eq.badminton&select=word,data,image_url,image_source`, {
  headers,
});
const rows = await r.json();
const row = rows[0];
if (!row) {
  console.error('badminton not found');
  process.exit(1);
}

const before = {
  def: row.data?.results?.[0]?.meanings?.[0]?.definition,
  syn: row.data?.synonyms,
  ant: row.data?.antonyms,
  ipa: row.data?.pronunciations?.[0]?.ipa,
  image: row.image_url,
};
console.log('before', before);

const data = structuredClone(row.data || {});
data.word = 'badminton';
data.results = [
  {
    meanings: [
      {
        pos: 'noun',
        definition: 'môn cầu lông',
        example: 'She plays badminton with her friends every weekend.',
        collocations: ['play badminton', 'badminton court', 'badminton racket'],
      },
    ],
  },
];
// Tên môn thể thao không có synonym/antonym thật — để rỗng tránh gán nhầm
data.synonyms = [];
data.antonyms = [];
data.familyWords = [{ pos: 'noun', word: 'badminton', meaning: 'cầu lông' }];
if (Array.isArray(data.pronunciations)) {
  data.pronunciations = data.pronunciations.map((p) => ({
    ...p,
    ipa: stripIpa(p.ipa),
  }));
} else {
  data.pronunciations = [{ ipa: 'ˈbæd.mɪn.tən' }];
}
data.image_search_query = 'badminton player hitting shuttlecock with racket';

const patch = await fetch(`${url}/rest/v1/global_dictionary?word=eq.badminton`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    data,
    image_url: null,
    image_source: 'none',
  }),
});
const out = await patch.json();
if (!patch.ok) {
  console.error('patch failed', patch.status, out);
  process.exit(1);
}
const fixed = out[0];
console.log('after', {
  def: fixed?.data?.results?.[0]?.meanings?.[0]?.definition,
  syn: fixed?.data?.synonyms,
  ant: fixed?.data?.antonyms,
  ipa: fixed?.data?.pronunciations?.[0]?.ipa,
  image: fixed?.image_url,
  status: patch.status,
});

// Optional: user notebook rows still holding wrong translation
const uw = await fetch(
  `${url}/rest/v1/words?word=ilike.badminton&select=id,word,translation&limit=30`,
  { headers },
);
const userWords = await uw.json();
console.log('user_words_sample', userWords);
