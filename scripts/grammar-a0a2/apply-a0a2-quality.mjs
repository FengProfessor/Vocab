/**
 * Apply A0–A2 grammar quality pass:
 * 1) Reorder beginner syllabus (pedagogical)
 * 2) Gold rewrite noun cluster (C/U, plural, articles, quantifiers)
 * 3) Auto-build sections from theory_vi for all beginner+intermediate
 * 4) Cap quiz bank to 24 curated items
 *
 * Usage: node scripts/grammar-a0a2/apply-a0a2-quality.mjs [--dry]
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GOLD_A0 } from './gold-lessons-a0.mjs';
import { banksForSlug, bankStats } from './wordbanks-dense.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry');
const QUIZ_CAP = 24;

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

/** Pedagogical order for beginner = A0–A1 path */
const BEGINNER_ORDER = [
  'countable-uncountable',
  'plural-nouns',
  'articles',
  'quantifiers',
  'personal-pronouns',
  'verb-to-be',
  'demonstratives',
  'possessives',
  'adjectives-basic',
  'there-is-there-are',
  'have-got',
  'present-simple',
  'wh-questions',
  'adverbs-frequency',
  'present-continuous',
  'prepositions-place',
  'imperatives',
  'modals-ability',
  'prepositions-time',
  'past-simple',
  'past-continuous',
  'be-going-to',
  'future-will',
  'comparatives-superlatives',
  'modals-permission',
  'modals-obligation',
  'modals-advice',
  'conditionals-0-1',
];

// ─── Gold sections (noun cluster + A0 core from gold-lessons-a0.mjs) ─────────

const GOLD_NOUNS = {
  'countable-uncountable': {
    title: 'Danh từ đếm được & không đếm được',
    theory_vi: `**Danh từ đếm được (Countable)** có số ít/số nhiều, đi với số và *a/an*.
**Danh từ không đếm được (Uncountable)** không có dạng số nhiều thông thường, không dùng *a/an* trực tiếp, muốn “đếm” phải thêm đơn vị (*a bottle of water*).

## Khi nào dùng
- 🍎 **Đếm được**: one apple, two books
- 💧 **Không đếm được**: water, rice, money, information
- 📦 **Đơn vị**: a piece of advice, two bottles of water

## Lỗi VN hay gặp
- ❌ two waters → ✅ two bottles of water
- ❌ an information → ✅ some information / a piece of information
- ❌ many homeworks → ✅ a lot of homework`,
    sections: {
      definition:
        '**Countable nouns** = đếm được (có số ít/số nhiều). **Uncountable nouns** = không đếm được bằng số tự nhiên (nước, thông tin, tiền…). Tiếng Việt không tách rõ bằng hình thái từ → cần học theo **nhóm + ví dụ**.',
      usage: [
        {
          icon: '🔢',
          label: 'Đếm được (C)',
          en: 'I have two books.',
          vi: 'Có số ít/số nhiều; dùng a/an, many, few, numbers.',
        },
        {
          icon: '🌊',
          label: 'Không đếm được (U)',
          en: 'I need some water.',
          vi: 'Không *a/an*; dùng some/any/much/a lot of; đếm bằng đơn vị.',
        },
        {
          icon: '📦',
          label: 'Đơn vị (unitiser)',
          en: 'a piece of advice / a bottle of water',
          vi: 'Cách “đếm” danh từ U.',
        },
        {
          icon: '⚠️',
          label: 'Bẫy VN',
          en: 'homework / information / furniture (U)',
          vi: 'Không nói homeworks, informations, furnitures.',
        },
      ],
      formula: {
        rows: [
          { Loại: 'Đếm được (C)', 'Số ít': 'a/an + N', 'Số nhiều': 'N + s/es', 'Lượng từ': 'many / a few / numbers' },
          { Loại: 'Không đếm (U)', 'Số ít': 'some/any + N (không a/an)', 'Số nhiều': '— (không *Ns*)', 'Lượng từ': 'much / a little / a lot of' },
          { Loại: 'Đơn vị đếm (unitiser)', 'Số ít': 'a piece/bottle/cup of + U', 'Số nhiều': 'two pieces of…', 'Lượng từ': 'theo đơn vị' },
        ],
        note: 'Không dùng khung do/does ở đây. C/U là về **danh từ**, không phải thì hiện tại đơn.',
      },
      rules: [
        { case: 'C số ít', rule: 'a/an + singular', example: 'a pen · an apple' },
        { case: 'C số nhiều', rule: 'plural form', example: 'three pens · many books' },
        { case: 'U', rule: 'no a/an · no -s', example: 'some water · much rice' },
        { case: 'U + unit', rule: 'measure + of + U', example: 'a glass of milk' },
        { case: 'U trừu tượng', rule: 'learn as list', example: 'advice · information · homework · news · furniture · money' },
      ],
      signals: ['a/an', 'many/few', 'much/little', 'some/any', 'a piece of'],
      mistakes: [
        { wrong: 'two waters', right: 'two bottles of water', why: 'water là U — cần đơn vị' },
        { wrong: 'an information', right: 'some information', why: 'information không dùng a/an' },
        { wrong: 'many homeworks', right: 'a lot of homework', why: 'homework là U, không -s' },
        { wrong: 'furnitures', right: 'furniture / pieces of furniture', why: 'furniture là U' },
        { wrong: 'a rice', right: 'some rice / a bowl of rice', why: 'rice là U' },
      ],
      tips: 'Hỏi: “Đếm 1, 2, 3 được không?” → được = C; không = U. Học list U hay gặp: water, rice, bread, money, advice, information, homework, news, furniture, hair (thường U).',
      comparison:
        '**C vs U:** *apple* (C) → apples; *water* (U) → không *waters* (trừ nghĩa “nhiều loại nước” nâng cao). **Articles:** a/an chỉ với C số ít.',
    },
    examples: [
      { en: 'I have two dogs.', vi: 'Tôi có hai con chó.', note: 'C + số' },
      { en: 'I need some water.', vi: 'Tôi cần một ít nước.', note: 'U + some' },
      { en: 'She bought a book.', vi: 'Cô ấy mua một cuốn sách.', note: 'C số ít + a' },
      { en: 'Can I have a bottle of water?', vi: 'Cho tôi một chai nước?', note: 'unitiser' },
      { en: 'He gave me some advice.', vi: 'Anh ấy cho tôi vài lời khuyên.', note: 'advice = U' },
      { en: 'There is a lot of furniture in the room.', vi: 'Trong phòng có nhiều đồ đạc.', note: 'furniture = U' },
      { en: 'How much rice do you need?', vi: 'Bạn cần bao nhiêu gạo?', note: 'much + U' },
      { en: 'How many apples do you want?', vi: 'Bạn muốn bao nhiêu quả táo?', note: 'many + C plural' },
      { en: 'I have homework today.', vi: 'Hôm nay tôi có bài tập.', note: 'không homeworks' },
      { en: 'The news is on TV.', vi: 'Bản tin đang trên TV.', note: 'news = U + is' },
      { en: 'She has long hair.', vi: 'Cô ấy có tóc dài.', note: 'hair thường U' },
      { en: 'I need a piece of information.', vi: 'Tôi cần một thông tin.', note: 'piece of + U' },
    ],
    seed_exercises: [
      { type: 'mcq', q: 'Choose the correct sentence.', opts: ['I need an information.', 'I need some information.', 'I need informations.'], answer: 'I need some information.', fb: 'information = U', case_id: 'U_no_a' },
      { type: 'mcq', q: 'Choose the correct phrase.', opts: ['two waters', 'two bottles of water', 'two water'], answer: 'two bottles of water', fb: 'U needs a unitiser', case_id: 'unitiser' },
      { type: 'fill', q: 'How ___ rice do you want? (much/many)', opts: ['much', 'many'], answer: 'much', fb: 'rice = U → much', case_id: 'much_many' },
      { type: 'fill', q: 'How ___ books are on the table? (much/many)', opts: ['much', 'many'], answer: 'many', fb: 'books = C plural → many', case_id: 'much_many' },
      { type: 'error', q: 'Find the error: She has many homeworks.', opts: ['She has a lot of homework.', 'She has many homework.', 'She has a homeworks.'], answer: 'She has a lot of homework.', fb: 'homework = U', case_id: 'U_no_s' },
      { type: 'tf', q: 'The word "furniture" is uncountable.', answer: true, fb: 'furniture = U', case_id: 'U_list' },
      { type: 'mcq', q: 'I need ___ water. (some/a)', opts: ['some', 'a', 'many'], answer: 'some', fb: 'water = U → some', case_id: 'U_no_a' },
      { type: 'mcq', q: "There isn't ___ milk.", opts: ['many', 'a', 'any'], answer: 'any', fb: 'U negative → any', case_id: 'any' },
      { type: 'mcq', q: 'I have ___ homework today. (much/many)', opts: ['much', 'many', 'a'], answer: 'much', fb: 'homework = U', case_id: 'much_many' },
      { type: 'error', q: 'Find the error: I have two furnitures.', opts: ['I have two pieces of furniture.', 'I have two furniture.', 'I have a furnitures.'], answer: 'I have two pieces of furniture.', fb: 'furniture = U', case_id: 'unitiser' },
      { type: 'tf', q: '"The news is on TV" is correct (news + is).', answer: true, fb: 'news = U, singular verb', case_id: 'U_list' },
      { type: 'mcq', q: 'She has long ___. (hair/hairs)', opts: ['hair', 'hairs'], answer: 'hair', fb: 'hair usually U', case_id: 'U_list' },
    ],
  },

  'plural-nouns': {
    title: 'Danh từ số nhiều',
    theory_vi: `**Số nhiều (Plural)** dùng khi ≥2. Hầu hết thêm **-s/-es**, một số đổi chính tả, một số **bất quy tắc** (man→men, child→children).

## Case chính
1. +s (book→books)
2. +es (bus→buses)
3. y→ies (city→cities) vs vowel+y→ys (boy→boys)
4. f/fe→ves (knife→knives) + ngoại lệ
5. Irregular: man/men, child/children, sheep/sheep…

## Lỗi VN
- ❌ three book → ✅ three books
- ❌ two childs → ✅ two children`,
    sections: {
      definition:
        '**Plural nouns** = dạng số nhiều của danh từ đếm được. Tiếng Việt không biến hình danh từ → dễ quên *-s* và hay sai bất quy tắc.',
      usage: [
        { icon: '2️⃣', label: 'Số ≥ 2', en: 'I have two sisters.', vi: 'Sau số đếm >1 dùng số nhiều.' },
        { icon: '📦', label: 'Sau many/a few', en: 'There are many boxes.', vi: 'Lượng từ số nhiều.' },
        { icon: '👥', label: 'Chủ ngữ số nhiều', en: 'The children are playing.', vi: 'Đi với are / V không -s.' },
        { icon: '🌍', label: 'Nói chung 1 loài', en: 'Dogs are loyal.', vi: 'Generic plural.' },
      ],
      formula: {
        rows: [
          { 'Trường hợp': 'Thường', 'Quy tắc': 'N + s', 'Ví dụ': 'book → books · day → days' },
          { 'Trường hợp': 's/x/z/ch/sh', 'Quy tắc': 'N + es', 'Ví dụ': 'bus → buses · box → boxes · watch → watches' },
          { 'Trường hợp': 'phụ âm + y', 'Quy tắc': 'y → ies', 'Ví dụ': 'city → cities · baby → babies' },
          { 'Trường hợp': 'nguyên âm + y', 'Quy tắc': 'y → ys', 'Ví dụ': 'boy → boys · key → keys' },
          { 'Trường hợp': 'f / fe (nhiều từ)', 'Quy tắc': 'f/fe → ves', 'Ví dụ': 'knife → knives · leaf → leaves' },
          { 'Trường hợp': 'Ngoại lệ f', 'Quy tắc': 'chỉ + s', 'Ví dụ': 'roof → roofs · belief → beliefs' },
          { 'Trường hợp': 'Bất quy tắc', 'Quy tắc': 'học theo nhóm', 'Ví dụ': 'man→men · child→children · sheep→sheep' },
        ],
        note: 'Luôn check **bất quy tắc trước**, rồi mới áp dụng -s/-es/-ies.',
      },
      rules: [
        { case: '/s/ (cats)', rule: 'sau phụ âm vô thanh', example: 'cats · books · cups' },
        { case: '/z/ (dogs)', rule: 'sau hữu thanh / nguyên âm', example: 'dogs · bags · days' },
        { case: '/ɪz/ (buses)', rule: 'sau sibilant s/z/ch/sh/x', example: 'buses · boxes · dishes' },
        { case: 'vowel change', rule: 'đổi nguyên âm trong từ', example: 'man→men · foot→feet · tooth→teeth · woman→women' },
        { case: '-en / people', rule: 'hậu tố đặc biệt', example: 'child→children · person→people' },
        { case: 'zero plural', rule: 'sg = pl', example: 'sheep · fish · deer' },
      ],
      signals: ['two/three…', 'many', 'a few', 'these/those', 'are'],
      mistakes: [
        { wrong: 'three book', right: 'three books', why: 'VN không biến hình danh từ' },
        { wrong: 'two childs', right: 'two children', why: 'irregular' },
        { wrong: 'three boxs', right: 'three boxes', why: 'x → +es' },
        { wrong: 'many citys', right: 'many cities', why: 'consonant+y → ies' },
        { wrong: 'two boyses', right: 'two boys', why: 'vowel+y chỉ +s' },
        { wrong: 'childrens', right: 'children', why: 'không thêm -s lần 2' },
      ],
      tips: 'Checklist: (1) irregular? (2) s/x/z/ch/sh → es (3) consonant+y → ies (4) còn lại +s. Nghe cuối từ: /s/ /z/ /ɪz/.',
      comparison:
        '**Regular vs irregular:** books vs children. **C vs U:** information không có *informations*. **boys vs cities:** nguyên âm+y khác phụ âm+y.',
    },
    examples: [
      { en: 'I have three books.', vi: 'Tôi có ba cuốn sách.', note: '+s' },
      { en: 'Three buses stop here.', vi: 'Ba xe buýt dừng ở đây.', note: '+es' },
      { en: 'The babies are sleeping.', vi: 'Những em bé đang ngủ.', note: 'y→ies' },
      { en: 'The boys are outside.', vi: 'Những cậu bé ở ngoài.', note: 'vowel+y→ys' },
      { en: 'We need four knives.', vi: 'Chúng tôi cần bốn con dao.', note: 'f→ves' },
      { en: 'The roofs are new.', vi: 'Những mái nhà còn mới.', note: 'ngoại lệ +s' },
      { en: 'Two men are waiting.', vi: 'Hai người đàn ông đang chờ.', note: 'man→men' },
      { en: 'The children are playing.', vi: 'Bọn trẻ đang chơi.', note: 'child→children' },
      { en: 'There are many people here.', vi: 'Có nhiều người ở đây.', note: 'person→people' },
      { en: 'I saw three sheep.', vi: 'Tôi thấy ba con cừu.', note: 'zero plural' },
      { en: 'My feet hurt.', vi: 'Chân tôi đau.', note: 'foot→feet' },
      { en: 'Brush your teeth.', vi: 'Đánh răng đi.', note: 'tooth→teeth' },
      { en: 'The boxes are heavy.', vi: 'Những cái hộp nặng.', note: '+es' },
      { en: 'She has two keys.', vi: 'Cô ấy có hai chìa khóa.', note: 'key→keys' },
      { en: 'The leaves are yellow.', vi: 'Lá vàng.', note: 'leaf→leaves' },
    ],
    seed_exercises: [
      { type: 'mcq', q: 'book → ?', opts: ['books', 'bookes', 'bookies'], answer: 'books', fb: '+s', case_id: 's' },
      { type: 'mcq', q: 'box → ?', opts: ['boxs', 'boxes', 'boxies'], answer: 'boxes', fb: 'x + es', case_id: 'es' },
      { type: 'mcq', q: 'city → ?', opts: ['citys', 'cities', 'cityes'], answer: 'cities', fb: 'consonant+y → ies', case_id: 'ies' },
      { type: 'mcq', q: 'boy → ?', opts: ['boies', 'boys', 'boyes'], answer: 'boys', fb: 'vowel+y → ys', case_id: 'ys' },
      { type: 'mcq', q: 'child → ?', opts: ['childs', 'children', 'childes'], answer: 'children', fb: 'irregular', case_id: 'irreg' },
      { type: 'mcq', q: 'man → ?', opts: ['mans', 'men', 'mens'], answer: 'men', fb: 'vowel change', case_id: 'irreg' },
      { type: 'fill', q: 'two ___ (knife)', opts: ['knives', 'knifes'], answer: 'knives', fb: 'fe→ves', case_id: 'ves' },
      { type: 'fill', q: 'three ___ (sheep)', opts: ['sheep', 'sheeps'], answer: 'sheep', fb: 'zero plural', case_id: 'zero' },
      { type: 'error', q: 'Find the error: I have two foots.', opts: ['I have two feet.', 'I have two footses.', 'I have two foot.'], answer: 'I have two feet.', fb: 'foot→feet', case_id: 'irreg' },
      { type: 'tf', q: '"People" is the plural of "person".', answer: true, fb: 'person→people', case_id: 'irreg' },
      { type: 'mcq', q: 'Choose the correct phrase.', opts: ['three book', 'three books', 'three bookes'], answer: 'three books', fb: 'need -s', case_id: 's' },
      { type: 'error', q: 'Find the error: many citys', opts: ['many cities', 'many cityes', 'many city'], answer: 'many cities', fb: 'y→ies', case_id: 'ies' },
      { type: 'mcq', q: 'tomato → ?', opts: ['tomatos', 'tomatoes', 'tomatoies'], answer: 'tomatoes', fb: 'o→oes (common food)', case_id: 'es' },
      { type: 'mcq', q: 'photo → ?', opts: ['photoes', 'photos', 'photoies'], answer: 'photos', fb: 'photo + s only', case_id: 's' },
      { type: 'fill', q: 'one tooth → two ___', opts: ['teeth', 'tooths'], answer: 'teeth', fb: 'tooth→teeth', case_id: 'irreg' },
      { type: 'mcq', q: 'woman → ?', opts: ['womans', 'women', 'womens'], answer: 'women', fb: 'vowel change', case_id: 'irreg' },
      { type: 'mcq', q: 'leaf → ?', opts: ['leafs', 'leaves', 'leafes'], answer: 'leaves', fb: 'f→ves', case_id: 'ves' },
      { type: 'mcq', q: 'roof → ?', opts: ['rooves', 'roofs', 'roofes'], answer: 'roofs', fb: 'exception +s', case_id: 's' },
      { type: 'tf', q: 'The plural of "sheep" is "sheeps".', answer: false, fb: 'zero plural: sheep', case_id: 'zero' },
      { type: 'error', q: 'Find the error: two childrens', opts: ['two children', 'two childs', 'two child'], answer: 'two children', fb: 'no double plural', case_id: 'irreg' },
    ],
  },

  articles: {
    title: 'Mạo từ (a / an / the)',
    theory_vi: `**a/an** = không xác định (C số ít, lần đầu). **the** = đã xác định / duy nhất / đã nhắc. **Zero article** = danh từ số nhiều chung, U chung, tên riêng…

## Case
- a + phụ âm âm: a book, a university (/j/)
- an + nguyên âm âm: an apple, an hour (/aʊ/)
- the: the sun, the book I bought
- zero: I like music. · She plays football.`,
    sections: {
      definition:
        '**Articles** (*a/an/the*) đứng trước danh từ để báo danh từ đó **chung/chung chung** hay **đã xác định**. Phải gắn với **C/U** và số ít/nhiều.',
      usage: [
        { icon: '🅰️', label: 'a / an (indefinite)', en: 'I saw a dog.', vi: 'C số ít, chưa xác định / lần đầu.' },
        { icon: '🎯', label: 'the (definite)', en: 'The dog was big.', vi: 'Đã biết / vừa nhắc / duy nhất.' },
        { icon: '∅', label: 'Zero article', en: 'I like music. · Dogs are cute.', vi: 'U chung, C số nhiều chung, nhiều tên riêng.' },
        { icon: '🔊', label: 'a/an theo ÂM', en: 'a university · an hour', vi: 'Không theo chữ cái, theo cách đọc.' },
      ],
      formula: {
        rows: [
          { 'Trường hợp': 'C số ít, lần đầu', 'Mạo từ': 'a / an', 'Ví dụ': 'a car · an apple' },
          { 'Trường hợp': 'Đã nhắc / xác định', 'Mạo từ': 'the', 'Ví dụ': 'I bought a pen. The pen is blue.' },
          { 'Trường hợp': 'Duy nhất / hệ thống', 'Mạo từ': 'the', 'Ví dụ': 'the sun · the internet' },
          { 'Trường hợp': 'U nói chung', 'Mạo từ': '∅ (không mạo từ)', 'Ví dụ': 'I need water. · She likes coffee.' },
          { 'Trường hợp': 'C số nhiều nói chung', 'Mạo từ': '∅', 'Ví dụ': 'Cats are independent.' },
          { 'Trường hợp': 'Âm /j/ university', 'Mạo từ': 'a', 'Ví dụ': 'a university · a European country' },
          { 'Trường hợp': 'Âm nguyên âm hour', 'Mạo từ': 'an', 'Ví dụ': 'an hour · an MBA' },
        ],
        note: 'Học **a/an theo pronunciation**, không chỉ theo chữ cái đầu.',
      },
      rules: [
        { case: 'a', rule: 'trước phụ âm âm', example: 'a book · a cat · a university' },
        { case: 'an', rule: 'trước nguyên âm âm', example: 'an apple · an hour · an idea' },
        { case: 'the', rule: 'xác định / unique / second mention', example: 'the moon · the teacher' },
        { case: 'zero', rule: 'generic U / plural', example: 'I study English. · Books help.' },
      ],
      signals: ['a', 'an', 'the', 'first mention', 'second mention'],
      mistakes: [
        { wrong: 'I saw dog.', right: 'I saw a dog.', why: 'C số ít cần mạo từ' },
        { wrong: 'an book', right: 'a book', why: 'book bắt đầu phụ âm âm' },
        { wrong: 'a hour', right: 'an hour', why: 'hour bắt đầu nguyên âm âm' },
        { wrong: 'an university', right: 'a university', why: '/juː/ = phụ âm âm, không dùng an' },
        { wrong: 'Sun is hot.', right: 'The sun is hot.', why: 'unique → the' },
        {
          wrong: 'I like the music. (khi nói nhạc nói chung)',
          right: 'I like music.',
          why: 'U generic thường zero; the music = bản nhạc đã biết',
        },
      ],
      tips: 'Quy trình: (1) C hay U? (2) số ít hay nhiều? (3) đã biết chưa? → a/an | the | ∅. Với a/an: **nghe âm đầu**.',
      comparison:
        '**a/an vs the:** lần đầu vs đã xác định. **the vs zero:** *the dogs* (những con cụ thể) vs *Dogs are…* (loài chó nói chung).',
    },
    examples: [
      { en: 'I have a car.', vi: 'Tôi có một chiếc xe.', note: 'a + C' },
      { en: 'I am reading an article.', vi: 'Tôi đang đọc một bài.', note: 'an + nguyên âm' },
      { en: 'I saw a dog. The dog was big.', vi: 'Tôi thấy một con chó. Con chó đó rất to.', note: 'second mention' },
      { en: 'The sun is bright today.', vi: 'Mặt trời hôm nay sáng.', note: 'unique' },
      { en: 'She studies at a university.', vi: 'Cô ấy học ở một đại học.', note: 'a + /j/' },
      { en: 'It takes an hour.', vi: 'Mất một tiếng.', note: 'an + silent h' },
      { en: 'I like music.', vi: 'Tôi thích nhạc.', note: 'zero + U' },
      { en: 'Cats are cute.', vi: 'Mèo đáng yêu.', note: 'zero + plural generic' },
      { en: 'Close the door, please.', vi: 'Làm ơn đóng cửa.', note: 'the = cửa cụ thể trong phòng' },
      { en: 'He is an honest man.', vi: 'Anh ấy là người thật thà.', note: 'an + /ɒ/ honest' },
      { en: 'I need the book on the table.', vi: 'Tôi cần cuốn sách trên bàn.', note: 'xác định bằng cụm' },
      { en: 'She plays football.', vi: 'Cô ấy chơi bóng đá.', note: 'zero + sport' },
    ],
    seed_exercises: [
      { type: 'mcq', q: '___ apple', opts: ['a', 'an', 'the'], answer: 'an', fb: 'nguyên âm âm', case_id: 'an' },
      { type: 'mcq', q: '___ university', opts: ['a', 'an'], answer: 'a', fb: '/juː/', case_id: 'a_sound' },
      { type: 'mcq', q: '___ hour', opts: ['a', 'an'], answer: 'an', fb: 'silent h', case_id: 'an' },
      { type: 'mcq', q: 'I saw ___ dog. (first mention)', opts: ['a', 'an', 'the'], answer: 'a', fb: 'first mention', case_id: 'a' },
      { type: 'mcq', q: 'I saw a dog. ___ dog was black.', opts: ['A', 'An', 'The'], answer: 'The', fb: 'second mention', case_id: 'the' },
      { type: 'error', q: 'Find the error: Sun is bright.', opts: ['The sun is bright.', 'A sun is bright.', 'Sun are bright.'], answer: 'The sun is bright.', fb: 'unique → the', case_id: 'the' },
      { type: 'tf', q: 'We say "an university".', answer: false, fb: 'Correct: a university (/j/)', case_id: 'a_sound' },
      { type: 'tf', q: 'The sentence "I have a book." is correct English.', answer: true, fb: 'a + C singular first mention', case_id: 'a' },
      { type: 'mcq', q: 'I like ___ music. (music in general)', opts: ['a', 'an', '— (no article)', 'the'], answer: '— (no article)', fb: 'U generic = zero', case_id: 'zero' },
      { type: 'mcq', q: 'Please open ___ window. (the one in this room)', opts: ['a', 'an', 'the'], answer: 'the', fb: 'specific', case_id: 'the' },
      { type: 'error', q: 'Find the error: I saw dog.', opts: ['I saw a dog.', 'I saw an dog.', 'I saw the dogs always.'], answer: 'I saw a dog.', fb: 'C singular needs article', case_id: 'a' },
      { type: 'mcq', q: 'It takes ___ hour.', opts: ['a', 'an', 'the'], answer: 'an', fb: 'hour → /aʊ/', case_id: 'an' },
    ],
  },

  quantifiers: {
    title: 'Lượng từ (some/any/much/many)',
    theory_vi: `**Quantifiers** nói “bao nhiêu”.
- **many / a few** + C plural
- **much / a little** + U
- **some** (+) / **any** (−/?)
- **a lot of** linh hoạt C/U`,
    sections: {
      definition:
        '**Quantifiers** (*some, any, much, many, a lot of, a few, a little*) đi với danh từ để chỉ **lượng**. Phải khớp **C/U**.',
      usage: [
        { icon: '📚', label: 'many / a few', en: 'many books · a few friends', vi: 'C số nhiều' },
        { icon: '💧', label: 'much / a little', en: 'much water · a little milk', vi: 'U' },
        { icon: '➕', label: 'some', en: 'some apples · some rice', vi: 'Khẳng định (C plural hoặc U)' },
        { icon: '❓', label: 'any', en: 'Do you have any sugar? · I don\'t have any pens.', vi: 'Phủ định / nghi vấn' },
      ],
      formula: {
        rows: [
          { 'Lượng từ': 'many', 'Đi với': 'C số nhiều', 'Ví dụ': 'many students' },
          { 'Lượng từ': 'much', 'Đi với': 'U', 'Ví dụ': 'much time' },
          { 'Lượng từ': 'a few', 'Đi với': 'C số nhiều', 'Ví dụ': 'a few eggs' },
          { 'Lượng từ': 'a little', 'Đi với': 'U', 'Ví dụ': 'a little sugar' },
          { 'Lượng từ': 'some', 'Đi với': 'C số nhiều / U (+)', 'Ví dụ': 'some chairs · some tea' },
          { 'Lượng từ': 'any', 'Đi với': 'C số nhiều / U (−/?)', 'Ví dụ': 'any questions · any milk' },
          { 'Lượng từ': 'a lot of', 'Đi với': 'C số nhiều / U', 'Ví dụ': 'a lot of books · a lot of money' },
        ],
        note: 'Trong khẳng định đời thường, *much* ít dùng hơn *a lot of* (*I have a lot of time* > *I have much time*).',
      },
      rules: [
        { case: 'many', rule: 'C plural', example: 'many cars' },
        { case: 'much', rule: 'U', example: 'much rice' },
        { case: 'some', rule: 'affirmative offers/requests OK', example: 'Would you like some tea?' },
        { case: 'any', rule: 'negative / questions', example: 'Is there any milk?' },
      ],
      mistakes: [
        { wrong: 'much books', right: 'many books', why: 'books = C' },
        { wrong: 'many water', right: 'much water / a lot of water', why: 'water = U' },
        { wrong: 'I don\'t have some money.', right: 'I don\'t have any money.', why: 'phủ định → any' },
        { wrong: 'a little friends', right: 'a few friends', why: 'friends = C' },
      ],
      tips: 'Nhìn danh từ: **plural C** → many/a few; **U** → much/a little; **+/−/?** → some/any.',
      comparison: '**a few** (C) ≈ một vài; **a little** (U) ≈ một chút. **few/little** không *a* mang nghĩa “hầu như không”.',
    },
    examples: [
      { en: 'I have many friends.', vi: 'Tôi có nhiều bạn.', note: 'many + C' },
      { en: 'There isn\'t much time.', vi: 'Không còn nhiều thời gian.', note: 'much + U' },
      { en: 'I need some sugar.', vi: 'Tôi cần một ít đường.', note: 'some + U' },
      { en: 'Do you have any questions?', vi: 'Bạn có câu hỏi nào không?', note: 'any + ?' },
      { en: 'She has a few eggs.', vi: 'Cô ấy có vài quả trứng.', note: 'a few + C' },
      { en: 'Add a little salt.', vi: 'Thêm một chút muối.', note: 'a little + U' },
      { en: 'We have a lot of homework.', vi: 'Chúng tôi có nhiều bài tập.', note: 'a lot of + U' },
      { en: 'There are a lot of people.', vi: 'Có rất nhiều người.', note: 'a lot of + C' },
      { en: 'I don\'t have any money.', vi: 'Tôi không có tiền.', note: 'any + −' },
      { en: 'Would you like some tea?', vi: 'Bạn dùng chút trà chứ?', note: 'some trong lời mời' },
    ],
    seed_exercises: [
      { type: 'mcq', q: '___ books (many/much)', opts: ['many', 'much'], answer: 'many', fb: 'C plural', case_id: 'many' },
      { type: 'mcq', q: '___ water (many/much)', opts: ['many', 'much'], answer: 'much', fb: 'U', case_id: 'much' },
      { type: 'fill', q: "I don't have ___ milk. (some/any)", opts: ['any', 'some'], answer: 'any', fb: 'negative → any', case_id: 'any' },
      { type: 'mcq', q: 'a ___ friends', opts: ['little', 'few', 'much'], answer: 'few', fb: 'a few + C', case_id: 'few' },
      { type: 'error', q: 'Find the error: much students', opts: ['many students', 'much student', 'a little students'], answer: 'many students', fb: 'C → many', case_id: 'many' },
      { type: 'tf', q: '"a lot of" can go with countable and uncountable nouns.', answer: true, fb: 'flexible', case_id: 'alot' },
      { type: 'mcq', q: 'Add a ___ salt. (few/little)', opts: ['few', 'little'], answer: 'little', fb: 'a little + U', case_id: 'little' },
      { type: 'mcq', q: 'I have ___ eggs. (a few / a little)', opts: ['a few', 'a little'], answer: 'a few', fb: 'C plural', case_id: 'few' },
      { type: 'fill', q: 'Do you have ___ questions? (some/any)', opts: ['any', 'some'], answer: 'any', fb: 'question → any (default)', case_id: 'any' },
      { type: 'mcq', q: 'Would you like ___ tea? (some/any)', opts: ['some', 'any'], answer: 'some', fb: 'offer → some OK', case_id: 'some' },
      { type: 'error', q: 'Find the error: I don\'t have some money.', opts: ["I don't have any money.", 'I don\'t have many money.', 'I don\'t have a money.'], answer: "I don't have any money.", fb: 'negative → any', case_id: 'any' },
      { type: 'mcq', q: 'There is ___ milk left. (much/many)', opts: ['much', 'many'], answer: 'much', fb: 'U', case_id: 'much' },
      { type: 'mcq', q: 'There are ___ cars. (much/many)', opts: ['much', 'many'], answer: 'many', fb: 'C plural', case_id: 'many' },
      { type: 'tf', q: 'We usually say "a lot of time" rather than "much time" in everyday affirmative speech.', answer: true, fb: 'a lot of common', case_id: 'alot' },
      { type: 'mcq', q: 'She has ___ friends. (a little / a few)', opts: ['a little', 'a few'], answer: 'a few', fb: 'friends = C', case_id: 'few' },
      { type: 'fill', q: 'How ___ sugar do you need? (much/many)', opts: ['much', 'many'], answer: 'much', fb: 'sugar = U', case_id: 'much' },
    ],
  },
};

/** Merge hand-authored A0 core (pronouns, be, tenses…) */
const GOLD = { ...GOLD_NOUNS, ...GOLD_A0 };

// ─── Parse legacy theory_vi → sections ──────────────────────────────────────

function parseTheoryToSections(theory) {
  const t = (theory || '').trim();
  if (!t) return null;

  const getSection = (name) => {
    const re = new RegExp(`##\\s*${name}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
    const m = t.match(re);
    return m ? m[0].replace(new RegExp(`^##\\s*${name}\\s*`, 'i'), '').trim() : '';
  };

  const definition = t.split(/\n##\s/)[0].trim();
  const usageRaw = getSection('Khi nào dùng');
  const formulaRaw = getSection('Công thức');
  const mistakesRaw = getSection('Lỗi thường gặp');
  const tipsRaw = getSection('Mẹo nhớ');
  const comparisonRaw = getSection('So sánh');

  const usage = [];
  for (const line of usageRaw.split(/\n/)) {
    const m = line.match(/^[-*]\s*(?:(\S+)\s+)?\*\*(.+?)\*\*\s*:?\s*(.*)$/);
    if (m) {
      const rest = m[3] || '';
      const parts = rest.split(/\s*[—–-]\s*\*?/);
      usage.push({
        icon: m[1] && /\p{Emoji}/u.test(m[1]) ? m[1] : '•',
        label: m[2].trim(),
        en: (parts[0] || '').replace(/\*/g, '').trim(),
        vi: (parts[1] || '').replace(/\*/g, '').trim(),
      });
    }
  }

  const rules = [];
  for (const line of formulaRaw.split(/\n/)) {
    const form = line.match(/\*\*form:\*\*\s*([^·*]+)/i);
    const structure = line.match(/\*\*structure:\*\*\s*([^·*]+)/i) || line.match(/\*\*base:\*\*\s*([^·*]+)/i);
    const example = line.match(/\*\*example:\*\*\s*(.+)$/i);
    if (form || structure) {
      rules.push({
        case: (form?.[1] || '').trim() || '—',
        rule: (structure?.[1] || '').trim() || '—',
        example: (example?.[1] || '').replace(/\*/g, '').trim() || '—',
      });
    }
  }

  const mistakes = [];
  for (const line of mistakesRaw.split(/\n/)) {
    const m = line.match(/❌\s*(.+?)\s*→\s*✅\s*\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$/);
    if (m) {
      mistakes.push({
        wrong: m[1].replace(/\*/g, '').trim(),
        right: m[2].trim(),
        why: m[3].replace(/\*/g, '').trim(),
      });
    }
  }

  const sections = {
    definition: definition || undefined,
    usage: usage.length ? usage : undefined,
    formula: rules.length
      ? {
          rows: rules.map((r) => ({
            Case: r.case,
            Rule: r.rule,
            Example: r.example,
          })),
          note: formulaRaw.match(/^>\s*(.+)$/m)?.[1],
        }
      : undefined,
    rules: rules.length ? rules : undefined,
    mistakes: mistakes.length ? mistakes : undefined,
    tips: tipsRaw.replace(/^>\s*/gm, '').trim() || undefined,
    comparison: comparisonRaw.replace(/^>\s*/gm, '').trim() || undefined,
  };

  // must have at least definition
  if (!sections.definition && !sections.usage && !sections.rules) return null;
  return sections;
}

const VI_DIACRITICS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function isPollutedQuestion(q) {
  const s = String(q || '');
  if (!s.trim()) return true;
  // Pure / mostly Vietnamese stems (old bot)
  if (VI_DIACRITICS.test(s)) {
    const letters = (s.match(/[A-Za-z]+/g) || []).join('');
    if (letters.length < 12) return true;
  }
  if (/câu sau đúng|câu nào|chọn câu đúng|ngữ pháp không/i.test(s)) return true;
  // Known wrong keys / pollution
  if (/\bmay you\b/i.test(s)) return true;
  if (/\bcan you lend\b/i.test(s) && /pen/i.test(s)) return true;
  // Agent FAIL: "I have the book" marked false — ban this stem from banks
  if (/i have the book/i.test(s) && !/first|second|mention/i.test(s)) return true;
  return false;
}

function curateExercises(existing, seed = [], cap = QUIZ_CAP, goldOnlySeed = false) {
  const normQ = (e) =>
    String(e?.q || e?.question || '')
      .trim()
      .toLowerCase();

  const score = (e) => {
    let s = 0;
    if (e?.fb || e?.explanation) s += 3;
    const opts = e?.opts || e?.options || [];
    if (Array.isArray(opts) && opts.length >= 2) s += 2;
    const ans = e?.answer ?? e?.correct_answer;
    if (ans !== undefined && ans !== null && String(ans).length > 0) s += 2;
    const t = e?.type || '';
    if (['mcq', 'fill', 'error', 'tf', 'multiple_choice', 'fill_blank', 'error_correction'].includes(t))
      s += 1;
    const q = normQ(e);
    if (q.length > 8) s += 1;
    if (q.includes('___') || q.includes('?')) s += 1;
    if (e?.case_id) s += 2;
    if (isPollutedQuestion(e?.q || e?.question)) s -= 20;
    return s;
  };

  const pool = [];
  const seen = new Set();
  // Gold lessons: SEED ONLY — never merge old bank (preposition pollution, bad keys)
  const sources = goldOnlySeed
    ? [...(seed || [])]
    : [...(seed || []), ...(Array.isArray(existing) ? existing : [])];

  for (const e of sources) {
    if (!e || typeof e !== 'object') continue;
    const qRaw = e.q || e.question;
    if (isPollutedQuestion(qRaw)) continue;
    const q = normQ(e);
    if (!q || seen.has(q)) continue;
    seen.add(q);
    let type = e.type;
    if (type === 'multiple_choice') type = 'mcq';
    if (type === 'fill_blank') type = 'fill';
    if (type === 'error_correction') type = 'error';
    pool.push({
      type: type || 'mcq',
      q: qRaw,
      opts: e.opts || e.options || undefined,
      answer: e.answer !== undefined ? e.answer : e.correct_answer,
      fb: e.fb || e.explanation || '',
      case_id: e.case_id,
      _score: score(e) + (goldOnlySeed ? 5 : 0),
    });
  }

  pool.sort((a, b) => b._score - a._score);

  const byType = { mcq: [], fill: [], error: [], tf: [], other: [] };
  for (const e of pool) {
    const k = byType[e.type] ? e.type : 'other';
    byType[k].push(e);
  }

  const out = [];
  const takeRound = () => {
    for (const k of ['mcq', 'fill', 'error', 'tf', 'other']) {
      if (out.length >= cap) break;
      const arr = byType[k];
      if (arr?.length) out.push(arr.shift());
    }
  };
  while (out.length < cap && Object.values(byType).some((a) => a.length)) takeRound();

  return out.map(({ _score, ...e }) => e);
}

function theoryFromSections(sections, title) {
  if (!sections) return '';
  const lines = [`**${title}**`, '', sections.definition || ''];
  if (sections.usage?.length) {
    lines.push('', '## Khi nào dùng', '');
    for (const u of sections.usage) {
      lines.push(`- ${u.icon || '•'} **${u.label}**: ${u.en || ''} — *${u.vi || ''}*`);
    }
  }
  if (sections.formula?.rows?.length) {
    lines.push('', '## Công thức', '');
    for (const r of sections.formula.rows) {
      const vals = Object.values(r).join(' · ');
      lines.push(`- ${vals}`);
    }
    if (sections.formula.note) lines.push('', `> ${sections.formula.note}`);
  }
  if (sections.mistakes?.length) {
    lines.push('', '## Lỗi thường gặp', '');
    for (const m of sections.mistakes) {
      lines.push(`- ❌ ${m.wrong} → ✅ **${m.right}** — ${m.why || ''}`);
    }
  }
  if (sections.tips) {
    lines.push('', '## Mẹo nhớ', '', sections.tips);
  }
  if (sections.comparison) {
    lines.push('', '## So sánh', '', sections.comparison);
  }
  return lines.join('\n');
}

// ─── main ───────────────────────────────────────────────────────────────────

const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: topics, error: te } = await sb
  .from('grammar_topics')
  .select('id,slug,title,title_vi,level,order_index');
if (te) throw te;

const { data: lessons, error: le } = await sb
  .from('grammar_lessons')
  .select('id,topic_id,title,theory_vi,examples,sections,exercises');
if (le) throw le;

const topicBySlug = Object.fromEntries((topics || []).map((t) => [t.slug, t]));
const lessonByTopicId = Object.fromEntries((lessons || []).map((l) => [l.topic_id, l]));

const log = [];
let updatedTopics = 0;
let updatedLessons = 0;

// 1) Reorder beginner
for (let i = 0; i < BEGINNER_ORDER.length; i++) {
  const slug = BEGINNER_ORDER[i];
  const t = topicBySlug[slug];
  if (!t) {
    log.push(`WARN missing beginner slug: ${slug}`);
    continue;
  }
  const order_index = i + 1;
  if (t.order_index !== order_index || t.level !== 'beginner') {
    log.push(`topic order ${slug}: ${t.order_index}→${order_index}`);
    if (!DRY) {
      const { error } = await sb
        .from('grammar_topics')
        .update({ order_index, level: 'beginner' })
        .eq('id', t.id);
      if (error) throw error;
    }
    updatedTopics++;
  }
}

// intermediate keep relative order but ensure level intermediate (A2 band)
const inter = (topics || [])
  .filter((t) => t.level === 'intermediate')
  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
inter.forEach((t, idx) => {
  const order_index = idx + 1;
  if (t.order_index !== order_index) {
    log.push(`intermediate reorder ${t.slug}: ${t.order_index}→${order_index}`);
    if (!DRY) {
      // fire and forget in loop - await
    }
  }
});
for (let i = 0; i < inter.length; i++) {
  const t = inter[i];
  const order_index = i + 1;
  if (t.order_index !== order_index) {
    if (!DRY) {
      const { error } = await sb
        .from('grammar_topics')
        .update({ order_index, level: 'intermediate' })
        .eq('id', t.id);
      if (error) throw error;
    }
    updatedTopics++;
  }
}

// 2) Upgrade lessons: beginner + intermediate + advanced (wordbanks full path)
const a0a2Topics = (topics || []).filter(
  (t) =>
    t.level === 'beginner' ||
    t.level === 'intermediate' ||
    t.level === 'advanced' ||
    BEGINNER_ORDER.includes(t.slug)
);

for (const t of a0a2Topics) {
  const lesson = lessonByTopicId[t.id];
  if (!lesson) {
    log.push(`WARN no lesson for ${t.slug}`);
    continue;
  }

  const gold = GOLD[t.slug];
  let sections = gold?.sections || parseTheoryToSections(lesson.theory_vi);
  if (!sections) {
    sections = {
      definition: (lesson.theory_vi || '').slice(0, 500) || `Bài: ${lesson.title}`,
    };
  }

  // Bảng case dày (U list, irregular plurals, V1–V2–V3…) — format chuyên đề GV
  const denseBanks = banksForSlug(t.slug);
  if (denseBanks?.length) {
    sections = {
      ...sections,
      wordbanks: denseBanks,
    };
  }

  let examples = Array.isArray(lesson.examples) ? lesson.examples : [];
  if (gold?.examples?.length) {
    // keep annotations from old if same en
    const byEn = Object.fromEntries(examples.map((e) => [String(e.en || '').toLowerCase(), e]));
    examples = gold.examples.map((e) => {
      const old = byEn[String(e.en || '').toLowerCase()];
      return old?.annotations ? { ...e, annotations: old.annotations } : e;
    });
  }

  // ensure min examples density
  if (examples.length < 6 && gold?.examples) examples = gold.examples;

  const exercises = curateExercises(
    lesson.exercises,
    gold?.seed_exercises || [],
    QUIZ_CAP,
    Boolean(gold) // gold: ưu tiên seed, lọc pollution bank cũ
  );

  const theory_vi = gold?.theory_vi || theoryFromSections(sections, lesson.title) || lesson.theory_vi;

  const payload = {
    sections,
    examples,
    exercises,
    theory_vi,
    title: gold?.title || lesson.title,
  };

  const wbN = sections.wordbanks?.reduce((n, b) => n + (b.rows?.length || 0), 0) || 0;
  log.push(
    `lesson ${t.slug}: sections=yes examples=${examples.length} quiz=${exercises.length}${gold ? ' GOLD' : ''}${wbN ? ` wordbanks=${wbN}rows` : ''}`
  );

  if (!DRY) {
    const { error } = await sb.from('grammar_lessons').update(payload).eq('id', lesson.id);
    if (error) {
      log.push(`ERROR ${t.slug}: ${error.message}`);
      continue;
    }
    // clear quiz cache
    await sb.from('grammar_quiz_cache').delete().eq('lesson_id', lesson.id);
  }
  updatedLessons++;
}

const report = {
  dry: DRY,
  updatedTopics,
  updatedLessons,
  beginnerOrder: BEGINNER_ORDER,
  quizCap: QUIZ_CAP,
  wordbankStats: bankStats(),
  log,
  at: new Date().toISOString(),
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-a0a2-apply-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ dry: DRY, updatedTopics, updatedLessons, logLines: log.length }, null, 2));
console.log(log.slice(0, 40).join('\n'));
if (log.length > 40) console.log(`... +${log.length - 40} more`);
console.log(DRY ? '\n[DRY RUN] re-run without --dry to write DB' : '\n[DONE] DB updated');
