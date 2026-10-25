/**
 * Chuẩn hóa header VI (bỏ underscore, gộp trùng).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const m = await import(`./wordbanks-dense.mjs?t=${Date.now()}`);

const KEY_FIX = {
  Quy_tắc: 'Quy tắc',
  Ghi_chú: 'Ghi chú',
  'Ghi nhớ': 'Ghi nhớ',
  'Ghi chú': 'Ghi chú',
  Số_ít: 'Số ít',
  Số_nhiều: 'Số nhiều',
  'Đếm_được (C)': 'Đếm được (C)',
  'Không_đếm (U)': 'Không đếm (U)',
  Mạo_từ: 'Mạo từ',
  Lượng_từ: 'Lượng từ',
  Đi_với: 'Đi với',
  Ngôi_3: 'Ngôi 3',
  Chủ_ngữ: 'Chủ ngữ',
  Trả_lời_ngắn: 'Trả lời ngắn',
  Đầy_đủ: 'Đầy đủ',
  Giới_từ: 'Giới từ',
  So_sánh_hơn: 'So sánh hơn',
  So_sánh_nhất: 'So sánh nhất',
  Đơn_vị: 'Đơn vị',
  Trường_hợp: 'Trường hợp',
  Tính_từ: 'Tính từ',
  Trạng_từ: 'Trạng từ',
};

function fixRow(r) {
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    const nk = KEY_FIX[k] || k.replace(/_/g, ' ');
    if (out[nk] && typeof out[nk] === 'string' && typeof v === 'string') {
      if (v.length > out[nk].length) out[nk] = v;
    } else {
      out[nk] = v;
    }
  }
  return out;
}

function fixBank(b) {
  return {
    title: b.title,
    icon: b.icon,
    note: b.note,
    rows: (b.rows || []).map(fixRow),
  };
}

const packs = {
  UNCOUNTABLE_BANKS: m.UNCOUNTABLE_BANKS.map(fixBank),
  PLURAL_BANKS: m.PLURAL_BANKS.map(fixBank),
  IRREGULAR_PAST_BANK: fixBank(m.IRREGULAR_PAST_BANK),
  ARTICLE_BANKS: m.ARTICLE_BANKS.map(fixBank),
  QUANTIFIER_BANKS: m.QUANTIFIER_BANKS.map(fixBank),
  PRESENT_SIMPLE_BANKS: m.PRESENT_SIMPLE_BANKS.map(fixBank),
  TO_BE_BANKS: m.TO_BE_BANKS.map(fixBank),
  POSSESSIVE_BANKS: m.POSSESSIVE_BANKS.map(fixBank),
  DEMONSTRATIVE_BANKS: m.DEMONSTRATIVE_BANKS.map(fixBank),
  THERE_IS_BANKS: m.THERE_IS_BANKS.map(fixBank),
  PREP_PLACE_BANKS: m.PREP_PLACE_BANKS.map(fixBank),
  PREP_TIME_BANKS: m.PREP_TIME_BANKS.map(fixBank),
  COMPARATIVE_BANKS: m.COMPARATIVE_BANKS.map(fixBank),
};

function esc(s) {
  return JSON.stringify(s);
}

function emit(name, val, isArr) {
  const banks = isArr ? val : [val];
  const parts = banks.map((b) => {
    const rows = (b.rows || [])
      .map((r) => {
        const body = Object.entries(r)
          .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
          .join(', ');
        return `    { ${body} }`;
      })
      .join(',\n');
    const note = b.note ? `\n  note: ${esc(b.note)},` : '';
    return `{
  title: ${esc(b.title)},
  icon: ${esc(b.icon || '')},${note}
  rows: [
${rows}
  ],
}`;
  });
  if (isArr) return `export const ${name} = [\n${parts.join(',\n')}\n];\n`;
  return `export const ${name} = ${parts[0]};\n`;
}

const footer = `
export function banksForSlug(slug) {
  const map = {
    'countable-uncountable': UNCOUNTABLE_BANKS,
    'plural-nouns': PLURAL_BANKS,
    'past-simple': [IRREGULAR_PAST_BANK],
    articles: ARTICLE_BANKS,
    quantifiers: QUANTIFIER_BANKS,
    'present-simple': PRESENT_SIMPLE_BANKS,
    'adverbs-frequency': [PRESENT_SIMPLE_BANKS[1]],
    'verb-to-be': TO_BE_BANKS,
    possessives: POSSESSIVE_BANKS,
    demonstratives: DEMONSTRATIVE_BANKS,
    'there-is-there-are': THERE_IS_BANKS,
    'prepositions-place': PREP_PLACE_BANKS,
    'prepositions-time': PREP_TIME_BANKS,
    'comparatives-superlatives': COMPARATIVE_BANKS,
  };
  return map[slug] || null;
}

export function bankStats() {
  const slugs = [
    'countable-uncountable',
    'plural-nouns',
    'past-simple',
    'articles',
    'quantifiers',
    'present-simple',
    'verb-to-be',
    'possessives',
    'demonstratives',
    'there-is-there-are',
    'prepositions-place',
    'prepositions-time',
    'comparatives-superlatives',
    'adverbs-frequency',
  ];
  const out = {};
  for (const slug of slugs) {
    const banks = banksForSlug(slug) || [];
    out[slug] = {
      tables: banks.length,
      rows: banks.reduce((n, b) => n + (b.rows?.length || 0), 0),
    };
  }
  return out;
}
`;

const header = `/**
 * Wordbanks A0–A1 — header + ghi chú Việt hóa đầy đủ.
 * Ví dụ tiếng Anh giữ nguyên để học.
 */

`;

const body = [
  emit('UNCOUNTABLE_BANKS', packs.UNCOUNTABLE_BANKS, true),
  emit('PLURAL_BANKS', packs.PLURAL_BANKS, true),
  emit('IRREGULAR_PAST_BANK', packs.IRREGULAR_PAST_BANK, false),
  emit('ARTICLE_BANKS', packs.ARTICLE_BANKS, true),
  emit('QUANTIFIER_BANKS', packs.QUANTIFIER_BANKS, true),
  emit('PRESENT_SIMPLE_BANKS', packs.PRESENT_SIMPLE_BANKS, true),
  emit('TO_BE_BANKS', packs.TO_BE_BANKS, true),
  emit('POSSESSIVE_BANKS', packs.POSSESSIVE_BANKS, true),
  emit('DEMONSTRATIVE_BANKS', packs.DEMONSTRATIVE_BANKS, true),
  emit('THERE_IS_BANKS', packs.THERE_IS_BANKS, true),
  emit('PREP_PLACE_BANKS', packs.PREP_PLACE_BANKS, true),
  emit('PREP_TIME_BANKS', packs.PREP_TIME_BANKS, true),
  emit('COMPARATIVE_BANKS', packs.COMPARATIVE_BANKS, true),
].join('\n');

const outPath = path.join(__dirname, 'wordbanks-dense.mjs');
fs.writeFileSync(outPath, header + body + footer, 'utf8');

const m2 = await import(`./wordbanks-dense.mjs?t2=${Date.now()}`);
const keys = new Set();
for (const s of Object.keys(m2.bankStats())) {
  for (const b of m2.banksForSlug(s) || []) {
    for (const r of b.rows || []) Object.keys(r).forEach((k) => keys.add(k));
  }
}
console.log('OK keys:', [...keys].sort().join(' | '));
console.log('sample past', m2.banksForSlug('past-simple')[0].rows[0]);
console.log('stats', m2.bankStats()['countable-uncountable']);
