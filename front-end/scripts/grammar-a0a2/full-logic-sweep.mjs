/**
 * Full logic sweep — all 62 grammar lessons (Grok-owned, no AG).
 *
 *   node scripts/grammar-a0a2/full-logic-sweep.mjs
 *   node scripts/grammar-a0a2/full-logic-sweep.mjs --apply
 *   node scripts/grammar-a0a2/full-logic-sweep.mjs --apply --clear-cache
 *
 * Report: tmp/full-logic-sweep.json
 *
 * Philosophy:
 * - Prefer FALSE NEGATIVE over FALSE POSITIVE (never flip a key without high confidence)
 * - Auto-fix only when rule is deterministic
 * - Residual P0/P1 listed for manual review
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const CLEAR_CACHE = process.argv.includes('--clear-cache');

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

function getOpts(e) {
  const o = e?.opts ?? e?.options;
  return Array.isArray(o) ? o.map((x) => String(x ?? '').trim()).filter(Boolean) : [];
}
function getAns(e) {
  return e?.answer !== undefined ? e.answer : e?.correct_answer;
}
function getType(e) {
  let t = String(e?.type || 'mcq');
  if (t === 'multiple_choice') t = 'mcq';
  if (t === 'fill_blank') t = 'fill';
  if (t === 'error_correction') t = 'error';
  return t;
}
function getQ(e) {
  return String(e?.q || e?.question || '').trim();
}
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.!?…]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function stripQuotes(s) {
  return String(s || '')
    .replace(/^["“'‘]+|["”'’]+$/g, '')
    .trim();
}
function tfBool(raw) {
  if (raw === true || raw === false) return raw;
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (['true', 'đúng', 'yes', 'correct'].includes(s)) return true;
  if (['false', 'sai', 'no', 'incorrect'].includes(s)) return false;
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-CONFIDENCE: sentence is WRONG (for TF must-false / error stems)
// ═══════════════════════════════════════════════════════════════════════════
function isClearlyWrong(sent) {
  const s = stripQuotes(sent).trim();
  if (!s || s.length < 3) return null;

  // ── be agreement (present) ──
  if (/\bthey\s+(is|isn't|is\s+not)\b/i.test(s)) return true;
  if (/\bwe\s+(is|isn't|is\s+not)\b/i.test(s)) return true;
  if (/\byou\s+(is|isn't|is\s+not)\b/i.test(s)) return true;
  if (/\b(he|she|it)\s+(are|aren't|are\s+not|am)\b/i.test(s)) return true;
  if (/\b(tom|anna|mary|john)\s+(are|aren't|am)\b/i.test(s)) return true;
  if (/(?<![a-z])i\s+(is|are)(?!\s+to\b)/i.test(s)) return true; // I is / I are (not "I are to" rare)
  if (/\beveryone\s+are\b/i.test(s)) return true;
  if (/\b(me|him|them|us)\s+(am|is|are|was|were)\b/i.test(s)) return true;

  // ── word-order not + be ──
  if (/\b(he|she|it|tom|they|we|you|i)\s+not\s+(is|are|am|was|were)\b/i.test(s)) return true;
  if (/\bthey\s+not\s+is\b/i.test(s)) return true;

  // ── possessives ──
  if (/\b(mine|yours|hers|ours|theirs)\s+[a-z]{2,}\b/i.test(s)) return true;
  if (/\b(her's|your's|our's|their's)\b/i.test(s)) return true;
  if (/\bit's\s+(tail|name|color|colour|bone|food|owner|leg|ear)\b/i.test(s)) return true;
  if (/\btheir\s+is\s+(a|an)\b/i.test(s)) return true;
  if (/\btoms\s+(bike|car|book|house|bag)\b/i.test(s)) return true;
  if (/\byours\s+bag\b/i.test(s)) return true;
  if (/\bmine\s+(pen|jacket|bag|book|room|bike|car)\b/i.test(s)) return true;
  if (/\bthe red pen is my\.?$/i.test(s)) return true;

  // ── articles / countable ──
  if (/\ban\s+(book|pen|cat|dog|university|European|one|table)\b/i.test(s)) return true;
  if (/\ba\s+(apple|egg|orange|hour|umbrella|elephant|idea|honest)\b/i.test(s)) return true;
  if (/\b(an information|a furniture|a advice|an advice|a news|many water|many milk|much books|much people)\b/i.test(s))
    return true;
  if (/\b(furnitures|informations|advices|homeworks|equipments)\b/i.test(s)) return true;
  if (/\b(sheeps|childs|mouses|gooses)\b/i.test(s)) return true;

  // ── there is/are ──
  if (/\bthere\s+is\s+(many|two|three|four|five|several)\b/i.test(s)) return true;
  if (/\bthere\s+are\s+(a|an)\s+[a-z]+\b/i.test(s)) return true;

  // ── present simple agreement ──
  if (/\b(he|she|it|tom|anna)\s+(work|live|play|like|love|go|want|need)\s+(here|every|in|to|football|hard|English)/i.test(s))
    return true;
  if (/\b(he|she|it)\s+don't\b/i.test(s)) return true;
  if (/\b(they|we|you|i)\s+doesn't\b/i.test(s)) return true;
  if (/\bdoesn't\s+(goes|works|likes|lives|plays|has|do)\b/i.test(s)) return true;
  if (/\bdidn't\s+(went|was|were|had|saw|ate|bought|did|left)\b/i.test(s)) return true;
  if (/\bdo he\b/i.test(s)) return true;
  if (/\bdoes (he|she|it) (lives|works|likes|goes|plays|has)\b/i.test(s)) return true;

  // ── aspect / participle ──
  if (/\b(was|were)\s+play\b/i.test(s)) return true; // was play
  if (/\bhas been work\b/i.test(s)) return true;
  if (/\bhave\s+(saw|went|ate|bought|catched|wrote)\b/i.test(s)) return true;
  if (/\bhas\s+(saw|went|ate|bought|catched|wrote)\b/i.test(s)) return true;
  if (/\b(goed|buyed|catched|teached|writed|eated|drinked)\b/i.test(s)) return true;
  if (/\bi am knowing\b|\bi am wanting\b|\bi am understanding\b/i.test(s)) return true;
  if (/\blooking forward to meet\b/i.test(s)) return true;
  if (/\binterested on\b/i.test(s)) return true;
  if (/\bcapable to\b/i.test(s)) return true;
  if (/\bbehind of\b/i.test(s)) return true;
  if (/\bborn at \d{4}\b/i.test(s)) return true; // born at 2001
  if (/\bsince three years\b|\bsince two years\b|\bsince five years\b/i.test(s)) return true;
  if (/\bhave (bought|seen|gone|done|eaten|written) .{0,40}\blast (week|year|month|Monday|night)\b/i.test(s))
    return true; // PP + past time
  if (/\babout to left\b|\babout to went\b|\babout to came\b/i.test(s)) return true;
  if (/\bnot to forget\b/i.test(s) && /essential|important|vital|necessary that/i.test(s)) return true;
  if (/\bhe not to\b|\bshe not to\b/i.test(s)) return true;
  if (/\bit is report that\b/i.test(s)) return true;
  if (/\bto had (left|gone|been)\b/i.test(s)) return true;
  if (/\bhe is said that\b/i.test(s)) return true;
  if (/\bwhich encouraged\b/i.test(s) && /\bit is my teacher\b/i.test(s)) return true;
  if (/\braining continuous\b/i.test(s)) return true;
  if (/\bgenerally believe that\b/i.test(s)) return true;
  if (/\bhas to goes\b|\bhave to goes\b/i.test(s)) return true;
  if (/\bare a student, don't you\b/i.test(s)) return true;
  if (/\bi am taller\b/i.test(s) && /than i am taller/i.test(s)) return true;
  if (/\bmore (better|worse|bigger|happier|easier|faster)\b/i.test(s)) return true;
  if (/\bi wish i am\b/i.test(s)) return true;
  if (/\bif i am you\b/i.test(s)) return true;
  if (/\bi playing football\b/i.test(s) && !/\b(am|was|were|been)\s+playing\b/i.test(s)) return true;

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HIGH-CONFIDENCE: sentence is CORRECT (whitelist + tight templates ONLY)
// ═══════════════════════════════════════════════════════════════════════════
const FORCE_TRUE_EXACT = [
  /^Tom is happy\.?$/i,
  /^She is a player\.?$/i,
  /^He is a doctor\.?$/i,
  /^I am a student\.?$/i,
  /^I am ready\.?$/i,
  /^I am happy\.?$/i,
  /^I am fine\.?$/i,
  /^They are students\.?$/i,
  /^They are happy\.?$/i,
  /^They are ready\.?$/i,
  /^They are tired\.?$/i,
  /^We are ready\.?$/i,
  /^We are students\.?$/i,
  /^You are ready\.?$/i,
  /^You are free\.?$/i,
  /^He is happy\.?$/i,
  /^He is ready\.?$/i,
  /^She is happy\.?$/i,
  /^She is ready\.?$/i,
  /^It is cold today\.?$/i,
  /^It is fine\.?$/i,
  /^He works here\.?$/i,
  /^She works hard\.?$/i,
  /^I love Tom\.?$/i,
  /^I work every day\.?$/i,
  /^She teaches English\.?$/i,
  /^Tom was happy\.?$/i,
  /^Tom was playing football\.?$/i,
  /^They were not watching TV\.?$/i,
  /^They are not tired\.?$/i,
  /^They aren't tired\.?$/i,
  /^Are you free\??$/i,
  /^Is she free\??$/i,
  /^Is everyone (OK|okay)\??$/i,
  /^Is this your bag\??$/i,
  /^This is my (bag|book|jacket|pen)\.?$/i,
  /^This pen is mine\.?$/i,
  /^The red pen is mine\.?$/i,
  /^The cat wagged its tail\.?$/i,
  /^There is a (book|cat|pen|problem|dog)\b/i,
  /^There is some furniture in the room\.?$/i,
  /^There are (many|two|some|three) /i,
  /^The sun is bright today\.?$/i,
  /^This is her box\.?$/i,
  /^This bag is hers\.?$/i,
  /^This is my jacket\.?$/i,
  /^Does he live here\??$/i,
  /^I was playing football yesterday at 4\.?$/i,
  /^I wish I were rich\.?$/i,
  /^If I were you, I would consult a doctor\.?$/i,
  /^She asked where I was going\.?$/i,
];

function isClearlyCorrect(sent) {
  const s = stripQuotes(sent).replace(/[.?!]+$/, '').trim();
  if (!s) return null;
  if (isClearlyWrong(s) === true) return false;

  const full = s + (sent.trim().endsWith('?') ? '?' : '');
  for (const re of FORCE_TRUE_EXACT) {
    if (re.test(s) || re.test(full) || re.test(sent.trim())) return true;
  }

  // Tight templates — no open-ended "She is …"
  if (/^(I am|You are|He is|She is|It is|We are|They are) (a |an |my |happy|ready|fine|cold|hot|here|late|free|tired|students?)\b/i.test(s))
    return true;
  if (/^(Tom|Anna|Mary|John) is (happy|ready|here|a \w+)\.?$/i.test(s)) return true;
  if (/^Is this your \w+\??$/i.test(s)) return true;
  if (/^This is (my|your|his|her|our|their) \w+\.?$/i.test(s)) return true;
  if (/^This (pen|bag|book|jacket|coat) is (mine|yours|his|hers|ours|theirs)\.?$/i.test(s))
    return true;
  if (/^There is some (furniture|water|milk|rice|money|information|advice) /i.test(s)) return true;

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Poison KEY (answer that claims to be the correct choice but is ungrammatical)
// Very conservative — do NOT flag subjunctive were, past I was, etc.
// ═══════════════════════════════════════════════════════════════════════════
function isPoisonKey(ansStr) {
  const a = String(ansStr || '').trim();
  if (!a) return false;

  // Multi-option "A / B" — poison only if EVERY part is poison
  const parts = a.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);

  const partPoison = (p) => {
    // Present be agreement errors as the WHOLE intended repair
    if (/\bthey\s+(is|isn't|is\s+not)\b/i.test(p) && !/\bthey\s+are\b/i.test(p)) return true;
    if (/\bwe\s+(is|isn't)\b/i.test(p) && !/\bwe\s+are\b/i.test(p)) return true;
    if (/\byou\s+(is|isn't)\b/i.test(p) && !/\byou\s+are\b/i.test(p)) return true;
    if (/\b(he|she|it)\s+(are|aren't|am)\b/i.test(p) && !/\b(he|she|it)\s+is\b/i.test(p)) return true;
    if (/\b(tom|anna)\s+(are|am)\b/i.test(p)) return true;
    if (/(?<![a-z])i\s+(is|are)\b/i.test(p) && !/\bi\s+am\b/i.test(p)) return true;
    // object pronoun as subject
    if (/\b(me|him|them|us)\s+(am|is|are)\b/i.test(p)) return true;
    // possessive + noun
    if (/\b(mine|yours|hers|ours|theirs)\s+(pen|bag|jacket|book|room|bike|car)\b/i.test(p))
      return true;
    if (/\b(her's|your's|our's|their's)\b/i.test(p)) return true;
    // known bad fragments used as keys
    if (/^they is not /i.test(p)) return true;
    if (/^tom are /i.test(p)) return true;
    if (/^she am /i.test(p)) return true;
    if (/^i playing /i.test(p)) return true;
    if (/^does he lives/i.test(p)) return true;
    if (/^do he live/i.test(p)) return true;
    if (/^if i am you/i.test(p)) return true;
    if (/^i wish i am /i.test(p)) return true;
    if (/^she asked where was i/i.test(p)) return true; // wrong word order RS
    return false;
  };

  if (parts.length === 0) return false;
  return parts.every(partPoison);
}

function extractTfSentence(q) {
  let m = q.match(/["“]([^"”]+)["”]\s+is correct/i);
  if (m) return stripQuotes(m[1]);
  m = q.match(/sentence\s+["“]([^"”]+)["”]/i);
  if (m) return stripQuotes(m[1]);
  m = q.match(/^["“]([^"”]+)["”]\.?$/);
  if (m) return stripQuotes(m[1]);
  return null;
}

function extractErrorStem(q) {
  const m = q.match(/(?:find the error|sửa lỗi|sửa)\s*:\s*(.+)$/i);
  if (!m) return null;
  return stripQuotes(m[1]).trim();
}

// ─── Deterministic repairs ──────────────────────────────────────────────────
const REPAIR_TABLE = [
  {
    test: (stem, ans, q) => /they not is tired/i.test(stem || q),
    patch: {
      type: 'error',
      q: 'Find the error: They not is tired.',
      opts: ['They are not tired.', 'They is not tired.', 'They not are tired.'],
      answer: 'They are not tired.',
      fb: "Sai. They → are. Phủ định: They are not / aren't tired.",
    },
  },
  {
    test: (stem) => /^tom are happy/i.test(norm(stem || '')),
    patch: {
      type: 'error',
      q: 'Find the error: Tom are happy.',
      opts: ['Tom is happy.', 'Tom are happy.', 'Tom am happy.'],
      answer: 'Tom is happy.',
      fb: 'Sai. Tom (số ít) → is.',
    },
  },
  {
    test: (stem) => /^tom is happy/i.test(norm(stem || '')),
    // inverted: good stem
    patch: {
      type: 'error',
      q: 'Find the error: Tom are happy.',
      opts: ['Tom is happy.', 'Tom are happy.', 'Tom am happy.'],
      answer: 'Tom is happy.',
      fb: 'Sai. Tom (số ít) → is.',
    },
  },
  {
    test: (stem) => /i was play football/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: I was play football yesterday at 4.',
      opts: [
        'I was playing football yesterday at 4.',
        'I was play football yesterday at 4.',
        'I playing football yesterday at 4.',
      ],
      answer: 'I was playing football yesterday at 4.',
      fb: 'Sai. Past continuous: was/were + V-ing → was playing.',
    },
  },
  {
    test: (stem) => /do he live/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: Do he live here?',
      opts: ['Does he live here?', 'Do he live here?', 'Does he lives here?'],
      answer: 'Does he live here?',
      fb: 'Sai. He → Does (không Do). Does + V nguyên mẫu.',
    },
  },
  {
    test: (stem) => /this is mine jacket/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: This is mine jacket.',
      opts: ['This is my jacket.', 'This is mine jacket.', 'This jacket is my.'],
      answer: 'This is my jacket.',
      fb: 'Sai. mine không + danh từ. Đúng: my jacket.',
    },
  },
  {
    test: (stem) => /is this yours bag/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: Is this yours bag?',
      opts: ['Is this your bag?', 'Is this yours bag?', 'Is this yours?'],
      answer: 'Is this your bag?',
      fb: 'Sai. yours không + bag.',
    },
  },
  {
    test: (stem) => /the red pen is my/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: The red pen is my.',
      opts: ['The red pen is mine.', 'The red pen is my.'],
      answer: 'The red pen is mine.',
      fb: 'Sai. Sau is dùng mine (đại từ sở hữu).',
    },
  },
  {
    test: (stem) => /this is her's/i.test(stem || ''),
    patch: {
      type: 'error',
      q: "Find the error: This is her's box.",
      opts: ["This is her box. / This bag is hers.", "This is her's box."],
      answer: "This is her box. / This bag is hers.",
      fb: "Sai. Không viết her's. Đúng: her box / hers.",
    },
  },
  {
    test: (stem) => /it's tail/i.test(stem || ''),
    patch: {
      type: 'error',
      q: "Find the error: The cat wagged it's tail.",
      opts: ["The cat wagged its tail.", "The cat wagged it's tail."],
      answer: 'The cat wagged its tail.',
      fb: "Sai. Sở hữu = its. it's = it is/has.",
    },
  },
  {
    test: (stem) => /i wish i am rich/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: I wish I am rich.',
      opts: ['I wish I were rich.', 'I wish I am rich now.', 'I wish I was rich. (informal)'],
      answer: 'I wish I were rich.',
      fb: 'Sai. wish + past (were) cho hiện tại trái sự thật.',
    },
  },
  {
    test: (stem) => /if i was you/i.test(stem || ''),
    patch: {
      type: 'error',
      q: 'Find the error: If I was you, I would consult a doctor.',
      opts: [
        'If I were you, I would consult a doctor.',
        'If I was you, I would consult a doctor.',
        'If I am you, I would consult a doctor.',
      ],
      answer: 'If I were you, I would consult a doctor.',
      fb: 'Sai (chuẩn formal). If I were you…',
    },
  },
];

const META_REPLACEMENTS = {
  'be-going-to': {
    type: 'mcq',
    q: 'Look at those dark clouds! It ___ rain soon.',
    opts: ['is going to', 'will', 'was'],
    answer: 'is going to',
    fb: 'is going to = dự đoán có dấu hiệu hiện tại.',
  },
  'countable-uncountable': {
    type: 'mcq',
    q: 'I need some ___ for my new house.',
    opts: ['furniture', 'furnitures', 'a furniture'],
    answer: 'furniture',
    fb: 'furniture = không đếm được.',
  },
  'past-continuous': {
    type: 'mcq',
    q: 'While I ___ my homework, the phone rang.',
    opts: ['was doing', 'did', 'am doing'],
    answer: 'was doing',
    fb: 'was/were + V-ing khi hành động khác xen vào.',
  },
  'present-simple': {
    type: 'mcq',
    q: 'She ___ to the gym every morning.',
    opts: ['goes', 'is going', 'go'],
    answer: 'goes',
    fb: 'She → goes (hiện tại đơn).',
  },
  'future-will': {
    type: 'mcq',
    q: "Don't worry, I ___ help you.",
    opts: ['will', 'am going to', 'was'],
    answer: 'will',
    fb: 'will = quyết định bộc phát.',
  },
  'gerunds-infinitives': {
    type: 'mcq',
    q: "Don't forget ___ the door.",
    opts: ['to lock', 'locking', 'lock'],
    answer: 'to lock',
    fb: 'forget to V = quên việc cần làm.',
  },
  possessives: {
    type: 'mcq',
    q: 'This coat belongs to me. It is ___.',
    opts: ['mine', 'my', 'me'],
    answer: 'mine',
    fb: 'mine đứng một mình.',
  },
  'used-to': {
    type: 'mcq',
    q: 'She ___ live in London as a child.',
    opts: ['used to', 'was used to', 'is used to'],
    answer: 'used to',
    fb: 'used to V = thói quen quá khứ.',
  },
  'verb-to-be': {
    type: 'mcq',
    q: 'Tom and I ___ friends.',
    opts: ['are', 'is', 'am'],
    answer: 'are',
    fb: 'Tom and I → are.',
  },
  articles: {
    type: 'mcq',
    q: 'She is ___ honest person.',
    opts: ['an', 'a', 'the'],
    answer: 'an',
    fb: 'honest → an.',
  },
  'personal-pronouns': {
    type: 'mcq',
    q: 'Can you help ___?',
    opts: ['me', 'I', 'my'],
    answer: 'me',
    fb: 'Tân ngữ me sau help.',
  },
  'there-is-there-are': {
    type: 'mcq',
    q: '___ two cats under the table.',
    opts: ['There are', 'There is', 'They are'],
    answer: 'There are',
    fb: 'two cats → There are.',
  },
  'present-perfect': {
    type: 'mcq',
    q: 'She ___ in London for five years.',
    opts: ['has lived', 'lived', 'is living'],
    answer: 'has lived',
    fb: 'for + khoảng thời gian → present perfect.',
  },
  'question-tags': {
    type: 'mcq',
    q: "You're a student, ___?",
    opts: ["aren't you", "don't you", "isn't you"],
    answer: "aren't you",
    fb: 'You are → tag are + not → aren\'t you.',
  },
};

function isMetaJunk(q, opts) {
  if (/which example fits/i.test(q)) return true;
  if (/Contrast focus/i.test(q)) return true;
  if (opts.some((o) => /another incorrect|^another$/i.test(o))) return true;
  if (/\b(TODO|placeholder|lorem ipsum)\b/i.test(q)) return true;
  return false;
}

function ansInOpts(ansStr, opts) {
  if (!opts.length) return true;
  const a = norm(ansStr);
  return opts.some((o) => norm(o) === a);
}

function processItem(e, idx, slug) {
  const findings = [];
  let next = { ...e };
  let changed = false;
  const type = getType(e);
  const q = getQ(e);
  const opts = getOpts(e);
  const rawAns = getAns(e);
  const ansStr = Array.isArray(rawAns) ? rawAns.join(' / ') : String(rawAns ?? '').trim();
  const fb = String(e?.fb || e?.explanation || '');

  const applyFix = (code, severity, message, patch) => {
    findings.push({
      code,
      severity,
      message,
      index: idx + 1,
      slug,
      q: q.slice(0, 120),
      answer: rawAns,
      fixed: !!patch,
    });
    if (patch) {
      next = { ...next, ...patch };
      if (patch.opts) {
        next.opts = patch.opts;
        delete next.options;
      }
      if (next.answer !== undefined) delete next.correct_answer;
      if (next.q) delete next.question;
      if (next.fb) delete next.explanation;
      changed = true;
    }
  };

  // 1) Meta junk
  if (isMetaJunk(q, opts)) {
    const rep = META_REPLACEMENTS[slug];
    if (rep) {
      applyFix('META_JUNK', 'P1', 'Meta junk → on-topic replacement', { ...rep, case_id: 'meta_replaced' });
    } else {
      applyFix('META_JUNK', 'P1', `Meta junk (no template: ${slug})`, null);
    }
  }

  // 2) TF truth — only high-confidence
  if (type === 'tf') {
    const sent = extractTfSentence(q);
    const ansB = tfBool(rawAns);

    if (sent) {
      const wrong = isClearlyWrong(sent);
      const good = isClearlyCorrect(sent);

      if (good === true && ansB === false) {
        const quoted = sent.includes('?') ? `"${sent.replace(/\?$/, '')}?"` : `"${sent.replace(/[.!]+$/, '')}"`;
        applyFix('TF_TRUE_MARKED_FALSE', 'P0', `Correct English marked FALSE: ${sent}`, {
          type: 'tf',
          q: `${quoted} is correct.`,
          answer: true,
          fb: `Đúng. ${quoted} — chuẩn.`,
        });
      } else if (wrong === true && ansB === true) {
        applyFix('TF_FALSE_MARKED_TRUE', 'P0', `Wrong English marked TRUE: ${sent}`, {
          type: 'tf',
          answer: false,
          fb: `Sai. "${sent}" không chuẩn.`,
        });
      } else if (wrong === true && ansB === false) {
        // already correct key — optional fb upgrade only if fb is poison
      } else if (good === true && ansB === true) {
        // ok
      }

      // Force-list extras (redundant safety)
      if (/^Is this your bag\??$/i.test(sent) && ansB !== true) {
        applyFix('TF_YOUR_BAG', 'P0', 'Is this your bag → true', {
          type: 'tf',
          q: '"Is this your bag?" is correct.',
          answer: true,
          fb: 'Đúng. your + danh từ.',
        });
      }
      if (/^Is everyone (OK|okay)\??$/i.test(sent) && ansB !== true) {
        applyFix('TF_EVERYONE_OK', 'P0', 'Is everyone OK → true', {
          type: 'tf',
          q: '"Is everyone OK?" is correct.',
          answer: true,
          fb: 'Đúng. everyone → is.',
        });
      }
      if (/^There is some furniture in the room\.?$/i.test(sent) && ansB !== true) {
        applyFix('TF_FURNITURE', 'P0', 'There is some furniture → true', {
          type: 'tf',
          q: '"There is some furniture in the room." is correct.',
          answer: true,
          fb: 'Đúng. furniture = không đếm được → There is some furniture.',
        });
      }
      if (/^mine pen$/i.test(sent) && ansB !== false) {
        applyFix('TF_MINE_PEN', 'P0', 'mine pen → false', {
          type: 'tf',
          q: '"mine pen" is correct.',
          answer: false,
          fb: 'Sai. mine không + danh từ.',
        });
      }
    }

    // normalize boolean
    const b = tfBool(getAns(next));
    if (type === 'tf' && b !== null && getAns(next) !== b) {
      next = { ...next, answer: b };
      changed = true;
      if (!findings.some((f) => f.code.startsWith('TF_'))) {
        applyFix('TF_BOOL_NORM', 'P2', `TF answer → boolean ${b}`, { answer: b });
      }
    }
  }

  // 3) Error items
  if (type === 'error' || /find the error/i.test(q)) {
    const stem = extractErrorStem(q) || '';

    for (const row of REPAIR_TABLE) {
      if (row.test(stem, ansStr, q)) {
        // only patch if answer currently wrong OR stem inverted
        const need =
          isPoisonKey(ansStr) ||
          isClearlyWrong(ansStr) === true ||
          isClearlyCorrect(stem) === true ||
          norm(ansStr) !== norm(row.patch.answer);
        if (need && norm(ansStr) !== norm(row.patch.answer)) {
          applyFix('ERROR_REPAIR', 'P0', `Repair table: "${stem}" → "${row.patch.answer}"`, row.patch);
        } else if (isClearlyCorrect(stem) === true) {
          // stem good but answer already correct — still flip stem
          applyFix('ERROR_INVERT_STEM', 'P0', `Invert correct stem "${stem}"`, row.patch);
        }
        break;
      }
    }

    // Stem clearly correct + answer worsens (not covered by table)
    if (stem && isClearlyCorrect(stem) === true) {
      if (isPoisonKey(ansStr) || isClearlyWrong(ansStr) === true) {
        if (!changed) {
          applyFix(
            'ERROR_ON_CORRECT_STEM',
            'P0',
            `Correct stem "${stem}" worsened to "${ansStr}" (manual)`,
            null
          );
        }
      }
    }

    // Answer poison
    if (isPoisonKey(ansStr) && !changed) {
      // Prefer clean opt that is clearly correct or not wrong
      const clean = opts.find((o) => !isPoisonKey(o) && isClearlyWrong(o) !== true && isClearlyCorrect(o) === true);
      const clean2 = opts.find((o) => !isPoisonKey(o) && isClearlyWrong(o) !== true);
      const pick = clean || clean2;
      if (pick && norm(pick) !== norm(ansStr)) {
        // Only auto if pick is clearly better
        if (isClearlyCorrect(pick) === true || isClearlyWrong(stem) === true) {
          applyFix('POISON_ANSWER', 'P0', `Poison "${ansStr}" → "${pick}"`, {
            answer: pick,
            fb: fb && !isPoisonKey(fb) ? fb : `Đúng: ${pick}.`,
          });
        } else {
          applyFix('POISON_ANSWER', 'P0', `Poison key "${ansStr}" (manual — ambiguous opts)`, null);
        }
      } else {
        applyFix('POISON_ANSWER', 'P0', `Poison key "${ansStr}" (manual)`, null);
      }
    }
  }

  // 4) MCQ poison answer
  if (type === 'mcq' && isPoisonKey(ansStr) && !changed) {
    const clean = opts.find((o) => !isPoisonKey(o) && isClearlyCorrect(o) === true);
    if (clean) {
      applyFix('MCQ_POISON', 'P0', `MCQ poison "${ansStr}" → "${clean}"`, {
        answer: clean,
        fb: `Đúng: ${clean}.`,
      });
    } else {
      applyFix('MCQ_POISON', 'P0', `MCQ poison "${ansStr}" (manual)`, null);
    }
  }

  // 5) ans ∉ opts
  if ((type === 'mcq' || type === 'error' || (type === 'fill' && opts.length >= 2)) && opts.length > 0 && !changed) {
    if (!ansInOpts(ansStr, opts)) {
      const hit = opts.find((o) => norm(o) === norm(ansStr));
      if (hit) {
        applyFix('ANS_NORM', 'P2', `Normalize answer casing to opt`, { answer: hit });
      } else {
        const soft = opts.find(
          (o) =>
            (norm(o).includes(norm(ansStr)) || norm(ansStr).includes(norm(o))) &&
            norm(ansStr).length >= 4
        );
        if (soft) {
          applyFix('ANS_SOFT_ALIGN', 'P1', `"${ansStr}" ≈ "${soft}"`, { answer: soft });
        } else {
          applyFix('ANS_NOT_IN_OPTS', 'P1', `"${ansStr}" ∉ [${opts.slice(0, 4).join(' | ')}]`, null);
        }
      }
    }
  }

  // 6) FB teaches wrong form
  if (/Đúng:\s*(She am |Tom are |They was |I is |You is |They is )/i.test(fb) && !changed) {
    applyFix('FB_POISON', 'P1', 'FB teaches wrong form', {
      fb: 'Đúng theo quy tắc chủ ngữ–động từ chuẩn trong bài.',
    });
  }

  // 7) Fill empty
  if (type === 'fill' && (!ansStr || ansStr === 'undefined')) {
    applyFix('FILL_EMPTY', 'P1', 'Empty fill answer', null);
  }

  return { findings, next, changed };
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  console.log(`\n🔍 FULL LOGIC SWEEP v2 (${APPLY ? 'APPLY' : 'AUDIT'}) — conservative\n`);

  const { data: lessons, error } = await sb
    .from('grammar_lessons')
    .select('id, exercises, topic:grammar_topics(slug, level, title_vi)');
  if (error) throw error;

  // Backup first when applying
  if (APPLY) {
    const backup = {
      at: new Date().toISOString(),
      lessons: (lessons || []).map((L) => ({
        id: L.id,
        slug: L.topic?.slug,
        exercises: L.exercises,
      })),
    };
    fs.mkdirSync('tmp', { recursive: true });
    const bp = `tmp/grammar-exercises-backup-logic-${Date.now()}.json`;
    fs.writeFileSync(bp, JSON.stringify(backup), 'utf8');
    console.log(`📦 Backup → ${bp}\n`);
  }

  let totalEx = 0;
  let totalFindings = 0;
  let totalFixed = 0;
  let lessonsUpdated = 0;
  const allFindings = [];
  const byCode = {};
  const bySlug = {};

  for (const L of lessons || []) {
    const slug = L.topic?.slug || 'unknown';
    const exercises = Array.isArray(L.exercises) ? L.exercises.map((e) => ({ ...e })) : [];
    let lessonChanged = false;

    for (let i = 0; i < exercises.length; i++) {
      totalEx++;
      const { findings, next, changed } = processItem(exercises[i], i, slug);
      for (const f of findings) {
        totalFindings++;
        allFindings.push(f);
        byCode[f.code] = (byCode[f.code] || 0) + 1;
        bySlug[slug] = (bySlug[slug] || 0) + 1;
      }
      if (changed) {
        exercises[i] = next;
        lessonChanged = true;
        totalFixed++;
      }
    }

    if (lessonChanged) {
      lessonsUpdated++;
      if (APPLY) {
        const { error: uErr } = await sb
          .from('grammar_lessons')
          .update({ exercises })
          .eq('id', L.id);
        if (uErr) console.error(`❌ ${slug}:`, uErr.message);
        else console.log(`  💾 ${slug}`);
      } else {
        console.log(`  · would update ${slug}`);
      }
    }
  }

  const fixed = allFindings.filter((f) => f.fixed);
  const unfixedP0 = allFindings.filter((f) => !f.fixed && f.severity === 'P0');
  const unfixedP1 = allFindings.filter((f) => !f.fixed && f.severity === 'P1');

  const report = {
    audited_at: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'audit',
    total_lessons: lessons.length,
    total_exercises: totalEx,
    total_findings: totalFindings,
    items_changed: totalFixed,
    lessons_updated: lessonsUpdated,
    fixed_count: fixed.length,
    unfixed_p0: unfixedP0.length,
    unfixed_p1: unfixedP1.length,
    by_code: byCode,
    by_slug: bySlug,
    findings: allFindings,
    unfixed_p0_list: unfixedP0,
    unfixed_p1_list: unfixedP1.slice(0, 100),
  };

  fs.mkdirSync('tmp', { recursive: true });
  fs.writeFileSync('tmp/full-logic-sweep.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('\n================ FULL LOGIC SWEEP v2 ================');
  console.log(`Lessons: ${lessons.length} | Exercises: ${totalEx}`);
  console.log(`Findings: ${totalFindings} | Auto-fixed items: ${totalFixed} | Lessons: ${lessonsUpdated}`);
  console.log(`Unfixed P0: ${unfixedP0.length} | Unfixed P1: ${unfixedP1.length}`);
  console.log('By code:', JSON.stringify(byCode, null, 2));
  if (fixed.length) {
    console.log('\nAuto-fixed:');
    fixed.forEach((f, i) => console.log(`  ${i + 1}. [${f.slug} #${f.index}] ${f.code}: ${f.message}`));
  }
  if (unfixedP0.length) {
    console.log('\nUnfixed P0 (manual):');
    unfixedP0.forEach((f, i) => console.log(`  ${i + 1}. [${f.slug} #${f.index}] ${f.code}: ${f.message}`));
  }
  if (unfixedP1.length) {
    console.log('\nUnfixed P1 (sample):');
    unfixedP1.slice(0, 20).forEach((f, i) =>
      console.log(`  ${i + 1}. [${f.slug} #${f.index}] ${f.code}: ${f.message}`)
    );
  }
  console.log('\n→ tmp/full-logic-sweep.json');
  console.log('====================================================\n');

  if (APPLY && CLEAR_CACHE) {
    try {
      await sb.from('grammar_quiz_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('🧹 cache cleared');
    } catch {
      /* ignore */
    }
  }

  if (!APPLY && totalFixed > 0) console.log('ℹ️  Chạy --apply để ghi DB.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
