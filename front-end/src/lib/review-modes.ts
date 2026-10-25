/**
 * Review modes — cloze / listen / mixed scheduler + map FSRS quality.
 * Dùng chung cho /review hub & session engine.
 */

import { judgeAnswer, type Verdict } from '@/lib/study';

/** Session mode do user chọn trên hub. */
export type ReviewSessionMode = 'mixed' | 'cloze' | 'listen' | 'mcq' | 'type' | 'flash';

/** Item mode thực thi trong 1 card. */
export type ItemMode =
  | 'mcq_vi_en' // nghĩa VI → 4 EN
  | 'mcq_en_vi' // EN → 4 nghĩa
  | 'cloze_mcq' // blank example → 4 options
  | 'cloze_type' // blank example → gõ
  | 'listen_mcq' // nghe → 4 EN
  | 'listen_type' // nghe → gõ (dictation)
  | 'type_vi_en'; // nghĩa → gõ EN

export interface ReviewWordLike {
  id: string;
  word: string;
  translation: string;
  example?: string | null;
  example_vi?: string | null;
  srsLevel?: number;
  reviewCount?: number;
  isDue?: boolean;
}

export interface ClozePayload {
  /** Câu có `___` thay từ target */
  stem: string;
  answer: string;
  /** Câu gốc đầy đủ */
  full: string;
}

/** Escape regex special chars trong word. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Dấu thanh / chữ Việt — dùng phát hiện VI dính trong example EN. */
const VI_CHAR_RE =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

/**
 * Nhiều row lưu example dạng:
 *   "EN sentence. (Bản dịch tiếng Việt.)"
 * → VI nằm trong cùng field `example`, cloze lộ nghĩa.
 * Gỡ ngoặc/viền chứa chữ Việt; giữ câu EN thuần.
 */
export function extractVietnameseSentenceTranslation(example: string | null | undefined): string | null {
  if (!example) return null;
  const s = example.trim();

  // 1) Ngoặc tròn/vuông chứa chữ Việt ở cuối câu: "(Bản dịch tiếng Việt...)"
  const parenMatch = s.match(/[\(\[][^\)\]]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][^\)\]]*[\)\]]$/i);
  if (parenMatch) {
    return parenMatch[0].replace(/^[\(\[]|[\)\]]$/g, '').trim();
  }

  // 2) Phân cách dạng " / " hoặc " | " hoặc " — " theo sau bởi tiếng Việt
  const sepMatch = s.match(/\s*[\/|—–-]\s*([^A-Za-z]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][\s\S]*)$/i);
  if (sepMatch) {
    return sepMatch[1].trim();
  }

  return null;
}

export function stripEmbeddedVietnamese(example: string): string {
  let s = (example || '').replace(/\s+/g, ' ').trim();
  if (!s || !VI_CHAR_RE.test(s)) return s;

  // 1) Ngoặc tròn/vuông có dấu Việt: "… (Một chế độ ăn…)" / "… […]"
  s = s.replace(/\s*[\(\[][^\)\]]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][^\)\]]*[\)\]]/gi, '');

  // 2) Đuôi sau " / " hoặc " — " toàn VI
  s = s.replace(
    /\s*[\/|—–-]\s*[^A-Za-z]*[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ][\s\S]*$/i,
    '',
  );

  // 3) Còn sót dấu Việt ở đuôi (không còn EN sau đó)
  if (VI_CHAR_RE.test(s)) {
    const cut = s.search(VI_CHAR_RE);
    if (cut > 12) {
      const tail = s.slice(cut);
      // Chỉ cắt nếu phần sau cut KHÔNG chứa câu tiếng Anh dài (tránh cắt nhầm từ mượn như café, résumé)
      if (!/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(tail)) {
        const head = s.slice(0, cut).replace(/[\s\(\[\/|—–-]+$/g, '').trim();
        if (/[A-Za-z]{3,}/.test(head)) s = head;
      }
    }
  }

  return s.replace(/\s+/g, ' ').trim();
}

/** Bảng động từ bất quy tắc tiếng Anh phổ biến */
const IRREGULAR_VERBS: Record<string, string[]> = {
  arise: ['arose', 'arisen'],
  awake: ['awoke', 'awoken'],
  be: ['am', 'is', 'are', 'was', 'were', 'been'],
  bear: ['bore', 'borne', 'born'],
  beat: ['beat', 'beaten'],
  become: ['became', 'become'],
  begin: ['began', 'begun'],
  bend: ['bent'],
  bet: ['bet'],
  bid: ['bid'],
  bind: ['bound'],
  bite: ['bit', 'bitten'],
  bleed: ['bled'],
  blow: ['blew', 'blown'],
  break: ['broke', 'broken'],
  breed: ['bred'],
  bring: ['brought'],
  build: ['built'],
  burn: ['burnt', 'burned'],
  burst: ['burst'],
  buy: ['bought'],
  catch: ['caught'],
  choose: ['chose', 'chosen'],
  cling: ['clung'],
  come: ['came', 'come'],
  cost: ['cost'],
  creep: ['crept'],
  cut: ['cut'],
  deal: ['dealt'],
  dig: ['dug'],
  do: ['did', 'done', 'does'],
  draw: ['drew', 'drawn'],
  dream: ['dreamt', 'dreamed'],
  drink: ['drank', 'drunk'],
  drive: ['drove', 'driven'],
  eat: ['ate', 'eaten'],
  fall: ['fell', 'fallen'],
  feed: ['fed'],
  feel: ['felt'],
  fight: ['fought'],
  find: ['found'],
  flee: ['fled'],
  fly: ['flew', 'flown'],
  forbid: ['forbade', 'forbidden'],
  forget: ['forgot', 'forgotten'],
  forgive: ['forgave', 'forgiven'],
  freeze: ['froze', 'frozen'],
  get: ['got', 'gotten'],
  give: ['gave', 'given'],
  go: ['went', 'gone', 'goes'],
  grow: ['grew', 'grown'],
  hang: ['hung', 'hanged'],
  have: ['has', 'had'],
  hear: ['heard'],
  hide: ['hid', 'hidden'],
  hit: ['hit'],
  hold: ['held'],
  hurt: ['hurt'],
  keep: ['kept'],
  kneel: ['knelt'],
  know: ['knew', 'known'],
  lay: ['laid'],
  lead: ['led'],
  lean: ['leant', 'leaned'],
  leap: ['leapt', 'leaped'],
  learn: ['learnt', 'learned'],
  leave: ['left'],
  lend: ['lent'],
  let: ['let'],
  lie: ['lay', 'lain'],
  light: ['lit', 'lighted'],
  lose: ['lost'],
  make: ['made'],
  mean: ['meant'],
  meet: ['met'],
  pay: ['paid'],
  put: ['put'],
  quit: ['quit'],
  read: ['read'],
  ride: ['rode', 'ridden'],
  ring: ['rang', 'rung'],
  rise: ['rose', 'risen'],
  run: ['ran', 'run'],
  say: ['said'],
  see: ['saw', 'seen'],
  seek: ['sought'],
  sell: ['sold'],
  send: ['sent'],
  set: ['set'],
  sew: ['sewed', 'sewn'],
  shake: ['shook', 'shaken'],
  shine: ['shone'],
  shoot: ['shot'],
  show: ['showed', 'shown'],
  shrink: ['shrank', 'shrunk'],
  shut: ['shut'],
  sing: ['sang', 'sung'],
  sink: ['sank', 'sunk'],
  sit: ['sat'],
  sleep: ['slept'],
  slide: ['slid'],
  smell: ['smelt', 'smelled'],
  speak: ['spoke', 'spoken'],
  spend: ['spent'],
  spill: ['spilt', 'spilled'],
  spin: ['spun'],
  spit: ['spat'],
  split: ['split'],
  spoil: ['spoilt', 'spoiled'],
  spread: ['spread'],
  spring: ['sprang', 'sprung'],
  stand: ['stood'],
  steal: ['stole', 'stolen'],
  stick: ['stuck'],
  sting: ['stung'],
  strike: ['struck'],
  swear: ['swore', 'sworn'],
  sweep: ['swept'],
  swim: ['swam', 'swum'],
  swing: ['swung'],
  take: ['took', 'taken'],
  teach: ['taught'],
  tear: ['tore', 'torn'],
  tell: ['told'],
  think: ['thought'],
  throw: ['threw', 'thrown'],
  understand: ['understood'],
  undertake: ['undertook', 'undertaken'],
  upset: ['upset'],
  wake: ['woke', 'woken'],
  wear: ['wore', 'worn'],
  weep: ['wept'],
  win: ['won'],
  wind: ['wound'],
  withdraw: ['withdrew', 'withdrawn'],
  write: ['wrote', 'written'],
};

const IRREGULAR_VERBS_REV = new Map<string, string>();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  for (const f of forms) {
    if (!IRREGULAR_VERBS_REV.has(f)) {
      IRREGULAR_VERBS_REV.set(f, base);
    }
  }
}

/** Danh từ số nhiều bất quy tắc phổ biến */
const IRREGULAR_NOUNS: Record<string, string> = {
  child: 'children',
  person: 'people',
  man: 'men',
  woman: 'women',
  foot: 'feet',
  tooth: 'teeth',
  mouse: 'mice',
  goose: 'geese',
  ox: 'oxen',
  life: 'lives',
  leaf: 'leaves',
  shelf: 'shelves',
  knife: 'knives',
  half: 'halves',
  thief: 'thieves',
  wife: 'wives',
  wolf: 'wolves',
  loaf: 'loaves',
  calf: 'calves',
  crisis: 'crises',
  basis: 'bases',
  analysis: 'analyses',
  criterion: 'criteria',
  phenomenon: 'phenomena',
  datum: 'data',
};

const IRREGULAR_NOUNS_REV = new Map<string, string>();
for (const [sing, plur] of Object.entries(IRREGULAR_NOUNS)) {
  IRREGULAR_NOUNS_REV.set(plur, sing);
}

/**
 * Generate regular and irregular English inflections for a single word.
 * Returns array of variations including base and inflected forms.
 */
export function getWordInflections(term: string): string[] {
  const t = term.trim();
  if (!t || t.length < 2) return [t];

  const variants = new Set<string>();
  variants.add(t);

  const lower = t.toLowerCase();

  const add = (v: string) => {
    if (v && v.length >= 2) variants.add(v);
  };

  // 1. If term looks already inflected or irregular, derive potential base forms
  const baseCandidates = new Set<string>([lower]);

  // Irregular verb form reverse lookup (e.g. bought -> buy, went -> go, saw -> see)
  const revVerbBase = IRREGULAR_VERBS_REV.get(lower);
  if (revVerbBase) {
    baseCandidates.add(revVerbBase);
  }

  // Irregular noun form reverse lookup (e.g. children -> child, people -> person, lives -> life)
  const revNounBase = IRREGULAR_NOUNS_REV.get(lower);
  if (revNounBase) {
    baseCandidates.add(revNounBase);
  }

  if (lower.endsWith('ies') && lower.length > 4) {
    baseCandidates.add(lower.slice(0, -3) + 'y'); // studies -> study
  }
  if (lower.endsWith('ied') && lower.length > 4) {
    baseCandidates.add(lower.slice(0, -3) + 'y'); // studied -> study
  }
  if (lower.endsWith('ing') && lower.length > 4) {
    baseCandidates.add(lower.slice(0, -3)); // walking -> walk
    baseCandidates.add(lower.slice(0, -3) + 'e'); // making -> make
    // Consonant doubling: stopping -> stop, planning -> plan
    if (lower.length > 5 && lower[lower.length - 4] === lower[lower.length - 5]) {
      baseCandidates.add(lower.slice(0, -4));
    }
  }
  if (lower.endsWith('ed') && lower.length > 4) {
    baseCandidates.add(lower.slice(0, -2)); // walked -> walk
    baseCandidates.add(lower.slice(0, -1)); // decided -> decide
    // Consonant doubling: planned -> plan, stopped -> stop
    if (lower.length > 5 && lower[lower.length - 3] === lower[lower.length - 4]) {
      baseCandidates.add(lower.slice(0, -3));
    }
  }
  if (lower.endsWith('es') && lower.length > 3) {
    baseCandidates.add(lower.slice(0, -2)); // watches -> watch, boxes -> box
    baseCandidates.add(lower.slice(0, -1)); // decides -> decide
  }
  if (lower.endsWith('s') && !lower.endsWith('ss') && !lower.endsWith('is') && !lower.endsWith('us') && lower.length > 3) {
    baseCandidates.add(lower.slice(0, -1)); // cats -> cat
  }

  // 2. For each base candidate, generate standard regular inflections + irregular forms
  for (const b of baseCandidates) {
    add(b);

    // Irregular verb forms (e.g. buy -> bought; go -> went, gone, goes)
    const irrForms = IRREGULAR_VERBS[b];
    if (irrForms) {
      for (const form of irrForms) add(form);
    }

    // Irregular noun forms (e.g. child -> children, life -> lives)
    const irrPlur = IRREGULAR_NOUNS[b];
    if (irrPlur) {
      add(irrPlur);
    }

    // Plural / 3rd person singular (-s, -es, -ies)
    if (/[^aeiou]y$/i.test(b)) {
      add(b.slice(0, -1) + 'ies');
      add(b.slice(0, -1) + 'ied');
    } else if (/(?:[sxz]|sh|ch)$/i.test(b)) {
      add(b + 'es');
      add(b + 'ed');
    } else if (b.endsWith('e')) {
      add(b + 's');
      add(b + 'd');
    } else {
      add(b + 's');
      add(b + 'ed');
    }

    // Past / Participle & Gerund (-ed, -ing)
    if (b.endsWith('ie')) {
      add(b.slice(0, -2) + 'ying');
    } else if (b.endsWith('ee')) {
      add(b + 'ing');
    } else if (b.endsWith('e')) {
      add(b.slice(0, -1) + 'ing');
    } else {
      add(b + 'ing');
    }

    // Consonant doubling: CVC (consonant-vowel-consonant, not ending in w, x, y)
    // e.g. plan -> planned, planning; stop -> stopped, stopping; beg -> begged, begging
    const cvcMatch = b.match(/[^aeiou][aeiou]([bdgklmnprstvz])$/i);
    if (cvcMatch) {
      const c = cvcMatch[1];
      add(b + c + 'ed');
      add(b + c + 'ing');
      add(b + c + 'er');
      add(b + c + 'est');
    }

    // Regular comparative / superlative
    if (/[^aeiou]y$/i.test(b)) {
      add(b.slice(0, -1) + 'ier');
      add(b.slice(0, -1) + 'iest');
    } else if (b.endsWith('e')) {
      add(b + 'r');
      add(b + 'st');
    } else {
      add(b + 'er');
      add(b + 'est');
    }
  }

  return Array.from(variants);
}

/**
 * Sinh danh sách ứng viên (candidate strings) để match trong câu ví dụ:
 * - Gỡ ngoặc và xử lý các biến thể: "balanced (diet)" → "balanced (diet)", "balanced diet", "balanced"
 * - Bỏ "to " ở đầu nếu là verb infinitive: "to decide" → "decide"
 * - Xử lý dấu gạch chéo / ("turn on/off" -> "turn on", "turn off")
 * - Xử lý đại từ placeholder trong idioms: "make up one's mind" -> "made up her mind", "make up his mind"...
 * - Xử lý placeholder sb/sth ("take sb/sth for granted" -> "take for granted")
 * - Phrasal verbs separable: "turn off" -> "turn it off", "turned it off"
 * - Sinh hình thái từ (inflections: -s, -es, -ed, -ing, consonant doubling, irregular forms)
 * - Match cụm từ dài nhất trước (longest first)
 */
export function generateClozeCandidates(rawWord: string): string[] {
  const w = rawWord?.trim();
  if (!w) return [];

  const rawSet = new Set<string>();
  rawSet.add(w);

  // 1. Xử lý ngoặc đơn () hoặc ngoặc vuông []
  // a) Bỏ dấu ngoặc nhưng giữ nội dung: "balanced (diet)" -> "balanced diet"
  const withoutParens = w.replace(/[\(\)\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (withoutParens) rawSet.add(withoutParens);

  // b) Bỏ cả dấu ngoặc và nội dung bên trong: "balanced (diet)" -> "balanced"
  const strippedParens = w.replace(/[\(\[][^\)\]]*[\)\]]/g, ' ').replace(/\s+/g, ' ').trim();
  if (strippedParens) rawSet.add(strippedParens);

  // 2. Mở rộng từ tiền tố "to ", gạch chéo /, hyphen / space, và placeholder đại từ/sb/sth
  const basePhrases = new Set<string>();

  const addPhrase = (phrase: string) => {
    const p = phrase.trim().replace(/\s+/g, ' ');
    if (p) basePhrases.add(p);
  };

  for (const item of rawSet) {
    addPhrase(item);

    // Bỏ "to " ở đầu
    if (/^to\s+/i.test(item)) {
      addPhrase(item.replace(/^to\s+/i, ''));
    }

    // Xử lý dấu gạch chéo / (ví dụ: "turn on/off" -> "turn on", "turn off"; "and/or" -> "and", "or")
    if (item.includes('/')) {
      const parts = item.split('/');
      if (parts.length === 2) {
        const leftWords = parts[0].trim().split(/\s+/);
        const rightWords = parts[1].trim().split(/\s+/);
        if (leftWords.length > 1 && rightWords.length === 1) {
          addPhrase([...leftWords.slice(0, -1), leftWords[leftWords.length - 1]].join(' '));
          addPhrase([...leftWords.slice(0, -1), rightWords[0]].join(' '));
        } else {
          for (const part of parts) addPhrase(part);
        }
      }
    }

    // Xử lý hyphen / space
    if (item.includes('-')) {
      addPhrase(item.replace(/-/g, ' '));
    }
    if (item.includes(' ') && !item.includes('(')) {
      addPhrase(item.replace(/\s+/g, '-'));
    }

    // Xử lý placeholder đại từ one's / someone's / sb's (ví dụ: "make up one's mind", "at one's own pace")
    if (/\b(one['’]s|someone['’]s|sb['’]s)\b/i.test(item)) {
      const pronouns = ['my', 'your', 'his', 'her', 'our', 'their', 'its', "one's"];
      for (const p of pronouns) {
        addPhrase(item.replace(/\b(one['’]s|someone['’]s|sb['’]s)\b/gi, p));
      }
      // Dạng bỏ hẳn placeholder
      addPhrase(item.replace(/\b(one['’]s|someone['’]s|sb['’]s)\s*/gi, ''));
    }

    // Xử lý sb/sth placeholder (ví dụ: "take sb/sth for granted" -> "take for granted")
    if (/\b(sb\/sth|sth\/sb|sb|sth|somebody|something)\b/i.test(item)) {
      addPhrase(item.replace(/\b(sb\/sth|sth\/sb|sb|sth|somebody|something)\b/gi, '').replace(/\s+/g, ' '));
    }
  }

  // 3. Sinh biến thể hình thái (morphological variants) cho từng base phrase
  const allCandidates = new Set<string>();

  for (const phrase of basePhrases) {
    allCandidates.add(phrase);

    const words = phrase.split(/\s+/);
    if (words.length === 1) {
      // Single word lemma: sinh inflections đầy đủ (kể cả irregular)
      const inflections = getWordInflections(words[0]);
      for (const inf of inflections) {
        allCandidates.add(inf);
      }
    } else {
      // Multi-word phrase:
      // - Biến thể của từ đầu tiên (động từ: "carry out" -> "carried out", "take over" -> "took over")
      const firstInflections = getWordInflections(words[0]);
      for (const inf of firstInflections) {
        allCandidates.add([inf, ...words.slice(1)].join(' '));
      }
      // - Biến thể của từ cuối cùng (danh từ: "credit card" -> "credit cards", "life cycle" -> "life cycles")
      const lastInflections = getWordInflections(words[words.length - 1]);
      for (const inf of lastInflections) {
        allCandidates.add([...words.slice(0, -1), inf].join(' '));
      }

      // - Phrasal verbs 2 từ có đại từ xen giữa (separable: "turn off" -> "turn it off", "turned it off", "picked him up")
      if (words.length === 2) {
        const particle = words[1].toLowerCase();
        const commonParticles = new Set(['up', 'down', 'on', 'off', 'in', 'out', 'away', 'back', 'over', 'through']);
        if (commonParticles.has(particle)) {
          const pronouns = ['it', 'them', 'him', 'her', 'me', 'us', 'you'];
          for (const inf of firstInflections) {
            for (const pron of pronouns) {
              allCandidates.add(`${inf} ${pron} ${words[1]}`);
            }
          }
        }
      }
    }
  }

  // 4. Sắp xếp độ dài giảm dần: candidate dài nhất match trước
  return Array.from(allCandidates)
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function buildCandidatePattern(cand: string): RegExp {
  // Thoát ký tự đặc biệt, đồng thời hỗ trợ cả dấu nháy đơn thẳng ' và nháy cong ’, khoảng trắng linh hoạt
  const escaped = escapeRegExp(cand)
    .replace(/['’]/g, "['’]")
    .replace(/\s+/g, '\\s+');
  const startBoundary = /^\w/.test(cand) ? '\\b' : '(?<=^|\\s|[([{"\'])';
  const endBoundary = /\w$/.test(cand) ? '\\b' : '(?=$|\\s|[.,!?;:)\\]}"\'])';
  return new RegExp(`${startBoundary}${escaped}${endBoundary}`, 'i');
}

/**
 * Tạo cloze từ example: blank từ target (word boundary, case-insensitive, morphological variants).
 * Fallback: dùng translation context nếu example thiếu/không chứa word.
 */
export function makeCloze(example: string | null | undefined, word: string): ClozePayload | null {
  const w = word?.trim();
  if (!w) return null;

  // Gỡ VI dính trong example trước khi blank
  const full = stripEmbeddedVietnamese(example || '');
  if (full) {
    const candidates = generateClozeCandidates(w);
    for (const cand of candidates) {
      const pattern = buildCandidatePattern(cand);
      const m = full.match(pattern);
      if (m && m.index !== undefined) {
        const matchedText = m[0];
        const stem = full.slice(0, m.index) + '___' + full.slice(m.index + matchedText.length);
        return { stem, answer: matchedText, full };
      }
    }
  }

  // Không có example hợp lệ hoặc không match được candidate nào → stem tối giản
  return {
    stem: `___`,
    answer: w,
    full: w,
  };
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 distractor + correct, shuffle. field = word | translation. */
export function buildWordChoices(
  correct: ReviewWordLike,
  pool: ReviewWordLike[],
  field: 'word' | 'translation',
  n = 4,
): string[] {
  const correctVal = (field === 'word' ? correct.word : correct.translation).trim();
  const others = [...new Set(
    shuffle(pool.filter((w) => w.id !== correct.id))
      .map((w) => (field === 'word' ? w.word : w.translation)?.trim())
      .filter((value): value is string => Boolean(value))
      .filter((value) => value.toLowerCase() !== correctVal.toLowerCase()),
  )].slice(0, Math.max(0, n - 1));

  // Không đủ distractor → pad bằng placeholder (hiếm)
  while (others.length < n - 1) {
    others.push(`(option ${others.length + 1})`);
  }
  return shuffle([correctVal, ...others]);
}

function pickWeighted(
  entries: Array<{ mode: ItemMode; weight: number }>,
  lastMode?: ItemMode | null,
): ItemMode {
  const valid = entries.filter((e) => e.weight > 0);
  if (valid.length === 0) return 'mcq_vi_en';
  if (valid.length === 1) return valid[0].mode;

  const roll = (pool: Array<{ mode: ItemMode; weight: number }>): ItemMode => {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * total;
    for (const item of pool) {
      r -= item.weight;
      if (r <= 0) return item.mode;
    }
    return pool[pool.length - 1].mode;
  };

  let chosen = roll(valid);
  if (lastMode && chosen === lastMode) {
    const withoutLast = valid.filter((e) => e.mode !== lastMode);
    if (withoutLast.length > 0) {
      chosen = roll(withoutLast);
    }
  }
  return chosen;
}

/**
 * Chọn item mode theo session + maturity + anti-streak.
 * - Mixed mode:
 *   - Khi có example: cloze_mcq chiếm ~25-35% cho MỌI level.
 *   - Level mature (>= 3): bổ sung thêm cloze_type (~15-25%).
 *   - Các mode khác cân bằng hài hòa: mcq_vi_en, mcq_en_vi, listen_mcq, type_vi_en, listen_type.
 *   - Khi không có example: phân bổ hợp lý theo level giữa mcq, listen, type.
 * - Anti-streak: nếu lastMode trùng với mode vừa quay, ưu tiên chọn mode khác hợp lệ.
 */
export function pickItemMode(
  word: ReviewWordLike,
  session: ReviewSessionMode,
  _poolHasExamples?: boolean,
  lastMode?: ItemMode | null,
): ItemMode {
  const level = word.srsLevel ?? 0;
  // Chỉ coi cloze-able khi example thực sự chứa target (không fallback stem "___")
  const cloze = makeCloze(word.example, word.word);
  const hasExample = Boolean(
    cloze && cloze.stem.includes('___') && cloze.stem !== '___' && cloze.full !== cloze.answer,
  );

  if (session === 'cloze') {
    if (!hasExample) return 'type_vi_en';
    const entries: Array<{ mode: ItemMode; weight: number }> =
      level >= 3
        ? [
            { mode: 'cloze_type', weight: 0.55 },
            { mode: 'cloze_mcq', weight: 0.45 },
          ]
        : [
            { mode: 'cloze_mcq', weight: 0.70 },
            { mode: 'cloze_type', weight: 0.30 },
          ];
    return pickWeighted(entries, lastMode);
  }

  if (session === 'listen') {
    const entries: Array<{ mode: ItemMode; weight: number }> =
      level >= 3
        ? [
            { mode: 'listen_type', weight: 0.60 },
            { mode: 'listen_mcq', weight: 0.40 },
          ]
        : [
            { mode: 'listen_mcq', weight: 0.65 },
            { mode: 'listen_type', weight: 0.35 },
          ];
    return pickWeighted(entries, lastMode);
  }

  if (session === 'mcq') {
    const entries: Array<{ mode: ItemMode; weight: number }> = [
      { mode: 'mcq_vi_en', weight: 0.50 },
      { mode: 'mcq_en_vi', weight: 0.50 },
    ];
    return pickWeighted(entries, lastMode);
  }

  if (session === 'type') {
    return 'type_vi_en';
  }

  // mixed (và fallback session)
  let entries: Array<{ mode: ItemMode; weight: number }>;

  if (level <= 1) {
    if (hasExample) {
      entries = [
        { mode: 'cloze_mcq', weight: 0.30 }, // ~30% cloze recognition
        { mode: 'mcq_vi_en', weight: 0.25 },
        { mode: 'mcq_en_vi', weight: 0.20 },
        { mode: 'listen_mcq', weight: 0.15 },
        { mode: 'type_vi_en', weight: 0.05 },
        { mode: 'listen_type', weight: 0.05 },
      ];
    } else {
      entries = [
        { mode: 'mcq_vi_en', weight: 0.30 },
        { mode: 'mcq_en_vi', weight: 0.30 },
        { mode: 'listen_mcq', weight: 0.20 },
        { mode: 'type_vi_en', weight: 0.10 },
        { mode: 'listen_type', weight: 0.10 },
      ];
    }
  } else if (level <= 2) {
    if (hasExample) {
      entries = [
        { mode: 'cloze_mcq', weight: 0.30 },
        { mode: 'type_vi_en', weight: 0.20 },
        { mode: 'listen_mcq', weight: 0.20 },
        { mode: 'mcq_vi_en', weight: 0.15 },
        { mode: 'mcq_en_vi', weight: 0.10 },
        { mode: 'listen_type', weight: 0.05 },
      ];
    } else {
      entries = [
        { mode: 'type_vi_en', weight: 0.25 },
        { mode: 'listen_mcq', weight: 0.25 },
        { mode: 'mcq_vi_en', weight: 0.20 },
        { mode: 'mcq_en_vi', weight: 0.15 },
        { mode: 'listen_type', weight: 0.15 },
      ];
    }
  } else {
    // mature (level >= 3)
    if (hasExample) {
      entries = [
        { mode: 'cloze_mcq', weight: 0.25 }, // ~25%
        { mode: 'cloze_type', weight: 0.20 }, // ~20%
        { mode: 'listen_type', weight: 0.20 },
        { mode: 'type_vi_en', weight: 0.15 },
        { mode: 'listen_mcq', weight: 0.10 },
        { mode: 'mcq_vi_en', weight: 0.05 },
        { mode: 'mcq_en_vi', weight: 0.05 },
      ];
    } else {
      entries = [
        { mode: 'type_vi_en', weight: 0.35 },
        { mode: 'listen_type', weight: 0.30 },
        { mode: 'listen_mcq', weight: 0.15 },
        { mode: 'mcq_vi_en', weight: 0.10 },
        { mode: 'mcq_en_vi', weight: 0.10 },
      ];
    }
  }

  return pickWeighted(entries, lastMode);
}

/**
 * Map kết quả → FSRS quality.
 * MCQ recognition: cap Good (4) — không Easy spam.
 * Production đúng + nhanh (<3s) → Easy (5).
 */
export function resultToQuality(opts: {
  correct: boolean;
  close?: boolean;
  itemMode: ItemMode;
  elapsedMs?: number;
}): 0 | 3 | 4 | 5 {
  const isMcq =
    opts.itemMode === 'mcq_vi_en' ||
    opts.itemMode === 'mcq_en_vi' ||
    opts.itemMode === 'cloze_mcq' ||
    opts.itemMode === 'listen_mcq';

  if (!opts.correct) {
    if (opts.close) return 3;
    return 0;
  }

  if (isMcq) return 4; // cap Good

  const fast = typeof opts.elapsedMs === 'number' && opts.elapsedMs > 0 && opts.elapsedMs < 3000;
  return fast ? 5 : 4;
}

export function verdictAndQuality(
  guess: string,
  answer: string,
  itemMode: ItemMode,
  elapsedMs?: number,
): { verdict: Verdict; quality: 0 | 3 | 4 | 5 } {
  const verdict = judgeAnswer(guess, answer);
  const quality = resultToQuality({
    correct: verdict === 'correct',
    close: verdict === 'close',
    itemMode,
    elapsedMs,
  });
  return { verdict, quality };
}

export function itemModeLabel(m: ItemMode): { en: string; vi: string; emoji: string } {
  switch (m) {
    case 'mcq_vi_en':
      return { en: 'MCQ', vi: 'Nghĩa → chọn từ', emoji: '🅰' };
    case 'mcq_en_vi':
      return { en: 'MCQ', vi: 'Từ → chọn nghĩa', emoji: '🅱' };
    case 'cloze_mcq':
      return { en: 'Cloze', vi: 'Điền chỗ trống', emoji: '🧩' };
    case 'cloze_type':
      return { en: 'Cloze type', vi: 'Gõ vào chỗ trống', emoji: '✏️' };
    case 'listen_mcq':
      return { en: 'Listen', vi: 'Nghe → chọn', emoji: '🎧' };
    case 'listen_type':
      return { en: 'Dictation', vi: 'Nghe → gõ', emoji: '✍️' };
    case 'type_vi_en':
      return { en: 'Type', vi: 'Nghĩa → gõ từ', emoji: '⌨️' };
    default:
      return { en: 'Review', vi: 'Ôn', emoji: '📚' };
  }
}

export const HUB_MODES: Array<{
  id: ReviewSessionMode;
  href: string;
  emoji: string;
  title: string;
  desc: string;
  highlight?: boolean;
}> = [
  {
    id: 'mixed',
    href: '/review/session?mode=mixed',
    emoji: '⚡',
    title: 'Ôn hỗn hợp',
    desc: 'Tự đổi MCQ · cloze · nghe · gõ theo độ nhớ',
    highlight: true,
  },
  {
    id: 'cloze',
    href: '/review/session?mode=cloze',
    emoji: '🧩',
    title: 'Cloze câu ví dụ',
    desc: 'Điền từ vào chỗ trống trong context',
  },
  {
    id: 'listen',
    href: '/review/session?mode=listen',
    emoji: '🎧',
    title: 'Nghe & chép',
    desc: 'Nghe TTS → chọn hoặc gõ từ',
  },
  {
    id: 'mcq',
    href: '/quiz',
    emoji: '🅰',
    title: '4 đáp án',
    desc: 'Quiz nhận diện nhanh EN ↔ VI',
  },
  {
    id: 'type',
    href: '/writing',
    emoji: '✍️',
    title: 'Gõ từ',
    desc: 'Active recall: nghĩa → gõ tiếng Anh',
  },
  {
    id: 'flash',
    href: '/flashcard',
    emoji: '🃏',
    title: 'Flashcard',
    desc: 'Lật thẻ + tự chấm Again/Hard/Good/Easy',
  },
];
