/**
 * Quiz đơn giản: EN → 4 nghĩa VI.
 * node scripts/build-tonight-verb-drill.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(
  fs.readFileSync(path.join(root, 'data/vocab-test-bank/tonight-verb-curriculum.json'), 'utf8'),
);

const items = [];
const lemmaList = [];

for (const L of raw.lemmas || []) {
  const lemma = L.lemma;
  lemmaList.push(lemma);
  const opts = [L.vi, ...L.wrong].slice(0, 4);
  items.push({
    lemma,
    type: 'meaning_mcq',
    stem: { q: lemma, opts },
    answer: L.vi,
  });
}

const pack = {
  version: 3,
  id: 'tonight-verb-drill',
  title: 'Drill động từ',
  note: 'Từ tiếng Anh → chọn nghĩa tiếng Việt.',
  built_at: new Date().toISOString(),
  types: ['meaning_mcq'],
  lemmas: lemmaList,
  lemma_count: lemmaList.length,
  item_count: items.length,
  items,
};

const outPublic = path.join(root, 'public/data/tonight-verb-drill.json');
const outData = path.join(root, 'data/vocab-test-bank/tonight-verb-drill.json');
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outData, JSON.stringify(pack, null, 2));
fs.writeFileSync(outPublic, JSON.stringify(pack));
console.log(JSON.stringify({ lemmas: lemmaList.length, items: items.length }, null, 2));
