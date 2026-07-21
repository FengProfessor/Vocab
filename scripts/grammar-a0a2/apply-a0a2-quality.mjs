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

// ─── Gold sections (noun cluster) ───────────────────────────────────────────

const GOLD = {
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
          { Loại: 'Countable', 'Số ít': 'a/an + N', 'Số nhiều': 'N + s/es', 'Lượng từ': 'many / a few / numbers' },
          { Loại: 'Uncountable', 'Số ít': 'some/any + N (không a/an)', 'Số nhiều': '— (không *Ns*)', 'Lượng từ': 'much / a little / a lot of' },
          { Loại: 'Unitiser', 'Số ít': 'a piece/bottle/cup of + U', 'Số nhiều': 'two pieces of…', 'Lượng từ': 'theo đơn vị' },
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
      { type: 'mcq', q: 'Chọn câu đúng', opts: ['I need an information.', 'I need some information.', 'I need informations.'], answer: 'I need some information.', fb: 'information = U' },
      { type: 'mcq', q: 'Chọn câu đúng', opts: ['two waters', 'two bottles of water', 'two water'], answer: 'two bottles of water', fb: 'cần đơn vị với U' },
      { type: 'fill', q: 'How ___ rice do you want? (much/many)', opts: ['much', 'many'], answer: 'much', fb: 'rice = U → much' },
      { type: 'fill', q: 'How ___ books are on the table? (much/many)', opts: ['much', 'many'], answer: 'many', fb: 'books = C plural → many' },
      { type: 'error', q: 'Sửa lỗi: She has many homeworks.', opts: ['She has a lot of homework.', 'She has many homework.', 'She has a homeworks.'], answer: 'She has a lot of homework.', fb: 'homework = U' },
      { type: 'tf', q: '"Furniture" is uncountable.', answer: true, fb: 'furniture = U' },
      { type: 'mcq', q: 'Chọn đáp án đúng: I bought ___ apple.', opts: ['a', 'some', 'much'], answer: 'a', fb: 'apple = C singular' },
      { type: 'mcq', q: 'Chọn đáp án đúng: There isn\'t ___ milk.', opts: ['many', 'a', 'any'], answer: 'any', fb: 'U phủ định → any' },
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
          { Case: 'Thường', Rule: 'N + s', Example: 'book → books · day → days' },
          { Case: 's/x/z/ch/sh', Rule: 'N + es', Example: 'bus → buses · box → boxes · watch → watches' },
          { Case: 'phụ âm + y', Rule: 'y → ies', Example: 'city → cities · baby → babies' },
          { Case: 'nguyên âm + y', Rule: 'y → ys', Example: 'boy → boys · key → keys' },
          { Case: 'f / fe (nhiều từ)', Rule: 'f/fe → ves', Example: 'knife → knives · leaf → leaves' },
          { Case: 'Ngoại lệ f', Rule: 'chỉ + s', Example: 'roof → roofs · belief → beliefs' },
          { Case: 'Bất quy tắc', Rule: 'học theo nhóm', Example: 'man→men · child→children · sheep→sheep' },
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
      { type: 'mcq', q: 'book → ?', opts: ['books', 'bookes', 'bookies'], answer: 'books', fb: '+s' },
      { type: 'mcq', q: 'box → ?', opts: ['boxs', 'boxes', 'boxies'], answer: 'boxes', fb: 'x + es' },
      { type: 'mcq', q: 'city → ?', opts: ['citys', 'cities', 'cityes'], answer: 'cities', fb: 'consonant+y → ies' },
      { type: 'mcq', q: 'boy → ?', opts: ['boies', 'boys', 'boyes'], answer: 'boys', fb: 'vowel+y → ys' },
      { type: 'mcq', q: 'child → ?', opts: ['childs', 'children', 'childes'], answer: 'children', fb: 'irregular' },
      { type: 'mcq', q: 'man → ?', opts: ['mans', 'men', 'mens'], answer: 'men', fb: 'vowel change' },
      { type: 'fill', q: 'two ___ (knife)', opts: ['knives', 'knifes'], answer: 'knives', fb: 'fe→ves' },
      { type: 'fill', q: 'three ___ (sheep)', opts: ['sheep', 'sheeps'], answer: 'sheep', fb: 'zero plural' },
      { type: 'error', q: 'Sửa: I have two foots.', opts: ['I have two feet.', 'I have two footses.', 'I have two foot.'], answer: 'I have two feet.', fb: 'foot→feet' },
      { type: 'tf', q: '"People" is the plural of "person".', answer: true, fb: 'person→people' },
      { type: 'mcq', q: 'Chọn câu đúng', opts: ['three book', 'three books', 'three bookes'], answer: 'three books', fb: 'cần -s' },
      { type: 'error', q: 'Sửa: many citys', opts: ['many cities', 'many cityes', 'many city'], answer: 'many cities', fb: 'y→ies' },
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
          { Case: 'C singular, lần đầu', Article: 'a / an', Example: 'a car · an apple' },
          { Case: 'Đã nhắc / xác định', Article: 'the', Example: 'I bought a pen. The pen is blue.' },
          { Case: 'Duy nhất / hệ thống', Article: 'the', Example: 'the sun · the internet' },
          { Case: 'U chung', Article: '∅ (zero)', Example: 'I need water. · She likes coffee.' },
          { Case: 'C plural chung', Article: '∅', Example: 'Cats are independent.' },
          { Case: 'Âm /j/ university', Article: 'a', Example: 'a university · a European country' },
          { Case: 'Âm nguyên âm hour', Article: 'an', Example: 'an hour · an MBA' },
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
        { wrong: 'a university (sai nếu nghĩ u=nguyên âm chữ)', right: 'a university', why: '/juː/ = phụ âm âm' },
        { wrong: 'Sun is hot.', right: 'The sun is hot.', why: 'unique → the' },
        { wrong: 'I like the music.' /* often wrong if generic */, right: 'I like music.', why: 'U generic thường zero' },
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
      { type: 'mcq', q: '___ apple', opts: ['a', 'an', 'the'], answer: 'an', fb: 'nguyên âm âm' },
      { type: 'mcq', q: '___ university', opts: ['a', 'an'], answer: 'a', fb: '/juː/' },
      { type: 'mcq', q: '___ hour', opts: ['a', 'an'], answer: 'an', fb: 'silent h' },
      { type: 'fill', q: 'I saw ___ dog. ___ dog was black. (a/the)', answer: 'a / the', fb: 'first then the' },
      { type: 'error', q: 'Sửa: Sun is bright.', opts: ['The sun is bright.', 'A sun is bright.', 'Sun are bright.'], answer: 'The sun is bright.', fb: 'unique' },
      { type: 'tf', q: 'We say "an university".', answer: false, fb: 'a university' },
      { type: 'mcq', q: 'I like ___ music.', opts: ['a', 'an', '— (no article)', 'the'], answer: '— (no article)', fb: 'U generic' },
      { type: 'mcq', q: 'Please open ___ window. (trong phòng này)', opts: ['a', 'an', 'the'], answer: 'the', fb: 'cụ thể' },
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
          { Quantifier: 'many', With: 'C plural', Example: 'many students' },
          { Quantifier: 'much', With: 'U', Example: 'much time' },
          { Quantifier: 'a few', With: 'C plural', Example: 'a few eggs' },
          { Quantifier: 'a little', With: 'U', Example: 'a little sugar' },
          { Quantifier: 'some', With: 'C pl / U (+)', Example: 'some chairs · some tea' },
          { Quantifier: 'any', With: 'C pl / U (−/?)', Example: 'any questions · any milk' },
          { Quantifier: 'a lot of', With: 'C pl / U', Example: 'a lot of books · a lot of money' },
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
      { type: 'mcq', q: '___ books (many/much)', opts: ['many', 'much'], answer: 'many', fb: 'C plural' },
      { type: 'mcq', q: '___ water (many/much)', opts: ['many', 'much'], answer: 'much', fb: 'U' },
      { type: 'fill', q: 'I don\'t have ___ milk. (some/any)', opts: ['any', 'some'], answer: 'any', fb: 'negative' },
      { type: 'mcq', q: 'a ___ friends', opts: ['little', 'few', 'much'], answer: 'few', fb: 'a few + C' },
      { type: 'error', q: 'Sửa: much students', opts: ['many students', 'much student', 'a little students'], answer: 'many students', fb: 'C → many' },
      { type: 'tf', q: '"a lot of" can go with countable and uncountable nouns.', answer: true, fb: 'linh hoạt' },
    ],
  },
};

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

function curateExercises(existing, seed = [], cap = QUIZ_CAP) {
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
    return s;
  };

  const pool = [];
  const seen = new Set();
  for (const e of [...(seed || []), ...(Array.isArray(existing) ? existing : [])]) {
    if (!e || typeof e !== 'object') continue;
    const q = normQ(e);
    if (!q || seen.has(q)) continue;
    seen.add(q);
    // normalize type
    let type = e.type;
    if (type === 'multiple_choice') type = 'mcq';
    if (type === 'fill_blank') type = 'fill';
    if (type === 'error_correction') type = 'error';
    pool.push({
      type: type || 'mcq',
      q: e.q || e.question,
      opts: e.opts || e.options || undefined,
      answer: e.answer !== undefined ? e.answer : e.correct_answer,
      fb: e.fb || e.explanation || '',
      case_id: e.case_id,
      _score: score(e),
    });
  }

  pool.sort((a, b) => b._score - a._score);

  // diversify types
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

// 2) Upgrade lessons: beginner + intermediate only
const a0a2Topics = (topics || []).filter(
  (t) => t.level === 'beginner' || t.level === 'intermediate' || BEGINNER_ORDER.includes(t.slug)
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

  const exercises = curateExercises(lesson.exercises, gold?.seed_exercises || [], QUIZ_CAP);

  const theory_vi = gold?.theory_vi || theoryFromSections(sections, lesson.title) || lesson.theory_vi;

  const payload = {
    sections,
    examples,
    exercises,
    theory_vi,
    title: gold?.title || lesson.title,
  };

  log.push(
    `lesson ${t.slug}: sections=yes examples=${examples.length} quiz=${exercises.length}${gold ? ' GOLD' : ''}`
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
  log,
  at: new Date().toISOString(),
};

fs.mkdirSync('tmp', { recursive: true });
fs.writeFileSync('tmp/grammar-a0a2-apply-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ dry: DRY, updatedTopics, updatedLessons, logLines: log.length }, null, 2));
console.log(log.slice(0, 40).join('\n'));
if (log.length > 40) console.log(`... +${log.length - 40} more`);
console.log(DRY ? '\n[DRY RUN] re-run without --dry to write DB' : '\n[DONE] DB updated');
