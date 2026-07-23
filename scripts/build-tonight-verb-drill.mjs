/**
 * Build pack dạy tối nay từ curriculum tay (nghĩa đầy, ví dụ, bẫy VN).
 * node scripts/build-tonight-verb-drill.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'data/vocab-test-bank/tonight-verb-curriculum.json');
const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const lemmas = raw.lemmas || [];

const items = [];
const lemmaList = [];

for (const L of lemmas) {
  const lemma = L.lemma;
  lemmaList.push(lemma);

  items.push({
    lemma,
    pos: L.pos || 'v',
    sense_vi: L.sense_vi,
    example_en: L.example_en,
    example_vi: L.example_vi,
    type: 'meaning_mcq',
    stem: {
      q: `${lemma} (động từ) — chọn nghĩa đúng nhất:`,
      opts: L.meaning_opts,
    },
    answer: L.meaning_answer,
    explain_vi: `${L.sense_vi}\nVí dụ: ${L.example_en}\n→ ${L.example_vi}`,
    meta: { quality: 'curriculum', skill: 'meaning' },
  });

  items.push({
    lemma,
    pos: L.pos || 'v',
    sense_vi: L.sense_vi,
    example_en: L.example_en,
    example_vi: L.example_vi,
    type: 'l2_to_en',
    stem: {
      q: L.l2_q,
      opts: L.l2_opts,
    },
    answer: L.l2_answer,
    explain_vi: L.l2_explain,
    meta: { quality: 'curriculum', skill: 'l2_to_en' },
  });

  items.push({
    lemma,
    pos: L.pos || 'v',
    sense_vi: L.sense_vi,
    example_en: L.example_en,
    example_vi: L.example_vi,
    type: 'collocation_mcq',
    stem: {
      q: L.colo_q,
      opts: L.colo_opts,
    },
    answer: L.colo_answer,
    explain_vi: L.colo_explain,
    meta: { quality: 'curriculum', skill: 'collocation' },
  });
}

const pack = {
  version: 2,
  id: 'tonight-verb-drill',
  title: 'Drill động từ (curriculum)',
  note: 'Nghĩa đầy đủ · ví dụ EN/VI · cụm thật · bẫy make/do/look for… Soạn tay cho lớp, không template máy.',
  built_at: new Date().toISOString(),
  types: ['meaning_mcq', 'l2_to_en', 'collocation_mcq'],
  lemmas: lemmaList,
  lemma_count: lemmaList.length,
  item_count: items.length,
  items,
};

const outData = path.join(root, 'data/vocab-test-bank/tonight-verb-drill.json');
const outPublic = path.join(root, 'public/data/tonight-verb-drill.json');
fs.mkdirSync(path.dirname(outPublic), { recursive: true });
fs.writeFileSync(outData, JSON.stringify(pack, null, 2));
fs.writeFileSync(outPublic, JSON.stringify(pack));
console.log(
  JSON.stringify(
    {
      lemmas: pack.lemma_count,
      items: pack.item_count,
      sample: lemmaList.slice(0, 10),
    },
    null,
    2,
  ),
);
