/**
 * racket definition "còi" sai — nghĩa chính: 1) vợt 2) tiếng ồn.
 * node scripts/fix-racket-definition.mjs
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

const r = await fetch(`${url}/rest/v1/global_dictionary?word=eq.racket&select=word,data`, { headers });
const row = (await r.json())[0];
if (!row) {
  console.error('not found');
  process.exit(1);
}
const data = structuredClone(row.data || {});
console.log('before', data.results?.[0]?.meanings);
data.results = [
  {
    meanings: [
      {
        pos: 'noun',
        definition: 'cái vợt (thể thao)',
        example: 'She bought a new tennis racket.',
        collocations: ['tennis racket', 'badminton racket'],
      },
      {
        pos: 'noun',
        definition: 'tiếng ồn ào, ầm ĩ',
        example: 'Stop making such a racket!',
        collocations: ['make a racket'],
      },
    ],
  },
];
data.familyWords = [
  { pos: 'noun', word: 'racket', meaning: 'cái vợt; tiếng ồn' },
  { pos: 'noun', word: 'racquet', meaning: 'cái vợt (cách viết khác)' },
];
// Keep noise-related synonyms for sense 2; drop if junk
data.synonyms = ['racquet', 'bat', 'noise', 'commotion', 'uproar'];
data.antonyms = ['silence', 'quiet'];

const patch = await fetch(`${url}/rest/v1/global_dictionary?word=eq.racket`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ data }),
});
const out = await patch.json();
console.log('status', patch.status);
console.log(
  'after',
  out[0]?.data?.results?.[0]?.meanings?.map((m) => m.definition),
);
