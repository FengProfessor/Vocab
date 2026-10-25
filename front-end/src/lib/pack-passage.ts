/**
 * Sinh đoạn văn ôn từ vựng theo pack/unit + chủ đề user chọn.
 * Chỉ gọi khi user bấm Gen AI (on-demand). Coverage check + 1 lần re-gen.
 */
import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';
import { getPackTheme, type PackTheme } from '@/lib/pack-themes';
import {
  DEFAULT_PACK_READING_LEVEL_ID,
  getPackReadingLevel,
  type PackReadingLevel,
} from '@/lib/pack-levels';
import { hasGeminiKeys } from '@/lib/gemini-multi';
import { generateWith3StepFallback } from '@/lib/llm-chain';

export interface PackWord {
  word: string;
  translation?: string;
  pos?: string;
}

export interface PassageQuestion {
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

export interface PassageClozeBlank {
  /** index trong mảng blanks */
  id: number;
  /** từ đúng (target vocab) */
  answer: string;
  options: string[];
}

export interface PackPassageResult {
  title: string;
  /** Đoạn EN; target words bọc **word** */
  passage: string;
  /** Đoạn không markdown — để cloze render */
  passagePlain: string;
  level: string;
  /** Chủ đề user chọn (bắt buộc khi gen) */
  themeId: string;
  themeLabelVi: string;
  /** Cấp độ đọc user chọn */
  readingLevelId: string;
  readingLevelLabelVi: string;
  wordCount: number;
  usedWords: string[];
  missingWords: string[];
  coverage: number;
  questions: PassageQuestion[];
  cloze: {
    /** passage với {{0}} {{1}} placeholders */
    text: string;
    blanks: PassageClozeBlank[];
  };
  meta: {
    attempts: number;
    providerNote: string;
  };
}

import { PACK_PASSAGE_MIN_WORDS, PACK_PASSAGE_MAX_WORDS } from './pack-passage-constants';

export { PACK_PASSAGE_MIN_WORDS, PACK_PASSAGE_MAX_WORDS };

const MIN_WORDS = PACK_PASSAGE_MIN_WORDS;
const MAX_WORDS = PACK_PASSAGE_MAX_WORDS;

export function normalizePackWords(raw: unknown): PackWord[] {
  if (!Array.isArray(raw)) return [];
  const out: PackWord[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    let word = '';
    let translation: string | undefined;
    let pos: string | undefined;

    if (typeof item === 'string') {
      const parts = item
        .trim()
        .split(/\s*[|–—]\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      word = parts[0] ?? '';
      if (parts[1]) translation = parts[1];
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      word =
        typeof o.word === 'string'
          ? o.word
          : typeof o.english === 'string'
            ? o.english
            : '';
      translation =
        typeof o.translation === 'string'
          ? o.translation
          : typeof o.vietnamese === 'string'
            ? o.vietnamese
            : undefined;
      pos = typeof o.pos === 'string' ? o.pos : undefined;
    }

    word = word.trim().toLowerCase();
    if (!word || word.length > 60 || seen.has(word)) continue;
    seen.add(word);
    out.push({
      word: sanitizeForPrompt(word, 60),
      translation: translation ? sanitizeForPrompt(translation, 100) : undefined,
      pos: pos ? sanitizeForPrompt(pos, 30) : undefined,
    });
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

export function parseWordListText(text: string): PackWord[] {
  const lines = text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return normalizePackWords(lines);
}

/** Đếm từ target xuất hiện trong text (word boundary, case-insensitive). */
export function findUsedWords(passage: string, targets: string[]): { used: string[]; missing: string[] } {
  const lower = passage.toLowerCase();
  const used: string[] = [];
  const missing: string[] = [];
  for (const w of targets) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // multi-word phrase: substring; single: word boundary
    const re =
      w.includes(' ') || w.includes('-')
        ? new RegExp(esc, 'i')
        : new RegExp(`\\b${esc}\\b`, 'i');
    if (re.test(lower)) used.push(w);
    else missing.push(w);
  }
  return { used, missing };
}

function stripMarkdownBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả JSON hợp lệ');
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean);
}

/** Làm sạch option/answer: bỏ "A)" "B." "**word**" */
function cleanChoiceText(s: string): string {
  return s
    .replace(/^\s*[A-Da-d][).:\-]\s*/u, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const INVENTED_TIME_RE =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|yesterday|tomorrow|tonight|last week|this morning|on monday|on tuesday)\b/gi;

/**
 * Loại câu hỏi bịa thời gian/địa điểm không có trong đoạn.
 * (Model hay copy "Monday morning" từ few-shot cũ.)
 */
function isQuestionGrounded(q: string, answer: string, passagePlain: string): boolean {
  const p = passagePlain.toLowerCase();
  const qLower = q.toLowerCase();
  const timeHits = qLower.match(INVENTED_TIME_RE) || [];
  for (const t of timeHits) {
    if (!p.includes(t.toLowerCase())) {
      console.warn(`[PackPassage] drop ungrounded Q (time "${t}"): ${q.slice(0, 80)}`);
      return false;
    }
  }
  // Answer nên có ≥1 content word (len>3) xuất hiện trong passage
  const ansWords = answer
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter((w) => w.length > 3 && !/^(that|this|with|from|they|them|were|been|have|does|did|what|where|when|which)$/.test(w));
  if (ansWords.length >= 1) {
    const hit = ansWords.some((w) => p.includes(w));
    if (!hit) {
      console.warn(`[PackPassage] drop ungrounded answer: ${answer.slice(0, 60)}`);
      return false;
    }
  }
  return true;
}

function buildPrompt(
  words: PackWord[],
  opts: {
    title?: string;
    theme: PackTheme;
    readingLevel: PackReadingLevel;
    forceInclude?: string[];
    /** Lần trước quá ngắn — ép viết dài hơn */
    expandLength?: boolean;
    prevWordCount?: number;
  }
): string {
  const title = opts.title || opts.theme.labelEn;
  const theme = opts.theme;
  const rl = opts.readingLevel;
  const midWords = Math.round((rl.minWords + rl.maxWords) / 2);
  const lines = words
    .map((w) => {
      const bits = [`- ${w.word}`];
      if (w.pos) bits.push(`(${w.pos})`);
      if (w.translation) bits.push(`= ${w.translation}`);
      return bits.join(' ');
    })
    .join('\n');

  const forceParts: string[] = [];
  if (opts.forceInclude && opts.forceInclude.length > 0) {
    forceParts.push(
      `CRITICAL RETRY — MISSING WORDS: you MUST include every one naturally: ${opts.forceInclude.join(', ')}.`,
    );
  }
  if (opts.expandLength) {
    forceParts.push(
      `CRITICAL RETRY — PASSAGE TOO SHORT (previous had only ~${opts.prevWordCount ?? '?'} words). ` +
        `You MUST write a LONGER passage of AT LEAST ${rl.minWords} and at most ${rl.maxWords} English words ` +
        `(aim ~${midWords}). Add more scenes, dialogue, reasons, and details — still one coherent story. Do NOT return a short summary.`,
    );
  }
  const force = forceParts.length ? `\n${forceParts.join('\n')}\n` : '';

  return `You are an ESL teacher for Vietnamese secondary students.
Write ONE reading passage that recycles target vocabulary under ONE fixed theme and ONE reading level.

THEME (mandatory — whole passage stays in this topic):
- id: ${theme.id}
- English: ${theme.labelEn}
- Vietnamese: ${theme.labelVi}
- Scene ideas: ${theme.hint}

READING LEVEL (mandatory — match length & difficulty exactly):
- id: ${rl.id}
- CEFR: ${rl.cefr}
- Label: ${rl.labelEn} / ${rl.labelVi}
- **HARD LENGTH TARGET: ${rl.minWords}–${rl.maxWords} English words** (count every word in "passage"; aim ~${midWords})
- Structure: ${rl.paragraphs}
- Language: ${rl.complexity}
- Questions: exactly ${rl.questionCount} MCQs
- Cloze blanks: ${rl.clozeBlanks}
- Question style: ${rl.questionStyle}

UNIT / TITLE: "${sanitizeForPrompt(title, 100)}"
Target words (${words.length}) — use the given sense when provided:
${lines}
${force}
PASSAGE RULES (vocabulary in context & clear simple grammar are priority #1):
1. **WORD COUNT & GRAMMAR SIMPLICITY:** The "passage" field MUST contain **${rl.minWords} to ${rl.maxWords} English words** (${rl.paragraphs}).
   - **KEEP GRAMMAR SIMPLE AND CLEAR:** Use short, direct SVO (Subject + Verb + Object) sentences. Avoid complex relative clauses, passive voice, or long nested phrases.
   - The main goal is for Vietnamese learners to immediately understand HOW each target word is used in a clear, natural real-life context.
2. Use at least 80% of target words naturally (prefer 100%).
3. First occurrence of each used target word MUST be wrapped like **word** (base form as in the list when possible).
4. Passage body: ENGLISH ONLY. No Vietnamese words, no Vietnamese glosses inside the passage.
5. Make the context around each target word so clear that its meaning becomes self-evident.
6. Stay inside the theme; title reflects ${theme.labelEn}.
7. Before you finish JSON, silently count words in "passage". If below ${rl.minWords}, add another paragraph until you reach the range.

QUESTION RULES (CRITICAL — questions must be 100% grounded in THIS passage):
1. Exactly ${rl.questionCount} MCQs. Each has "q", 4 "options", "answer", "explain".
2. **GROUNDED ONLY:** Every fact in the question and in the correct option MUST appear in the passage text.
   - Do NOT invent day/time (Monday, morning, yesterday…) unless that word is in the passage.
   - Do NOT invent places, numbers, or actions not written in the passage.
   - After writing each question, re-read the passage and confirm the correct option is supported by a sentence.
3. **SPECIFIC + EASY (simple English):**
   - Name people/places from the passage (e.g. Mai, the park, her neighbors).
   - One clear focus: Who / What / Where / Why / How did X feel / What did they collect…
   - Short, natural questions a student can understand quickly.
4. **BAD examples (NEVER do this):**
   - Asking "What did Mai do on Monday morning?" when the passage never says Monday/morning.
   - Vague: "What is a problem?" with no link to the text.
   - Options like "B" only, or "She cut down trees / bought a car / went swimming" when unrelated to the story.
   - Correct answer that only roughly matches (passage says "wonderful" but options only "happy" without support — prefer wording close to the passage).
5. **GOOD pattern:**
   - Passage: "They collected thousands of plastic bottles" → Q: "What did they collect at the park?" → options include "Thousands of plastic bottles".
   - Passage: "The epicenter of the event was the park" → Q: "Where was the epicenter of the event?" → "At the park".
6. "options": 4 full answer phrases, similar length. NO "A)" "B." prefixes. 3 distractors must be plausible but clearly wrong based on the passage.
7. "answer" = exact copy of one option string (never only a letter).
8. "explain": 1 short Vietnamese sentence that quotes/paraphrases the supporting detail from the passage.
9. ${rl.questionStyle}

CLOZE RULES:
1. Same story as the passage (English only).
2. Replace ${rl.clozeBlanks} target words with {{0}}, {{1}}, … (placeholders MUST appear in cloze.text).
3. Each blank: "answer" = target word; "options" = 4 REAL English words (1 correct + 3 from the target list). NEVER "distractor1".

Return ONLY valid JSON (no markdown fence):
{
  "title": "Community Clean-Up",
  "passage": "string with **target** words — MUST be ${rl.minWords}-${rl.maxWords} words long",
  "level": "${rl.cefr}",
  "usedWords": ["word1", "word2"],
  "questions": [
    {
      "q": "Where was the epicenter of the clean-up event?",
      "options": ["At Mai's house", "At the local library", "At the park", "At the school"],
      "answer": "At the park",
      "explain": "Đoạn nói epicenter of the event was the park."
    },
    {
      "q": "What did Mai and her friends collect?",
      "options": ["Paper books", "Plastic bottles", "Glass windows", "Metal cans"],
      "answer": "Plastic bottles",
      "explain": "Đoạn nói they collected thousands of plastic bottles."
    }
  ],
  "cloze": {
    "text": ".... {{0}} .... {{1}} ...",
    "blanks": [
      { "id": 0, "answer": "recycle", "options": ["recycle", "pollution", "forest", "climate"] }
    ]
  }
}`;
}

function normalizeResult(
  raw: Record<string, unknown>,
  targets: string[],
  attempts: number,
  theme: PackTheme,
  readingLevel: PackReadingLevel
): PackPassageResult {
  const passage = asString(raw.passage);
  if (!passage || passage.length < 40) {
    throw new Error('Passage quá ngắn hoặc trống');
  }

  const passagePlain = stripMarkdownBold(passage);
  const listedUsed = asStringArray(raw.usedWords).map((w) => w.toLowerCase());
  const { used: detected, missing } = findUsedWords(passagePlain, targets);
  // union AI list + detected
  const usedSet = new Set([...listedUsed, ...detected].map((w) => w.toLowerCase()));
  const usedWords = targets.filter((t) => usedSet.has(t.toLowerCase()));
  const missingWords = targets.filter((t) => !usedSet.has(t.toLowerCase()));
  const coverage = targets.length ? usedWords.length / targets.length : 0;

  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions: PassageQuestion[] = questionsRaw
    .map((q) => {
      if (!q || typeof q !== 'object') return null;
      const o = q as Record<string, unknown>;
      const options = asStringArray(o.options)
        .map(cleanChoiceText)
        .filter(Boolean)
        .slice(0, 6);
      let answer = cleanChoiceText(asString(o.answer));
      // map "B" / "B." → option index
      if (/^[A-Da-d]$/.test(answer) && options.length) {
        const idx = answer.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) answer = options[idx];
      }
      if (!options.includes(answer) && options.length) {
        // fuzzy: answer contained in an option or vice versa
        const hit = options.find(
          (opt) =>
            opt.toLowerCase() === answer.toLowerCase() ||
            opt.toLowerCase().includes(answer.toLowerCase()) ||
            answer.toLowerCase().includes(opt.toLowerCase()),
        );
        if (hit) answer = hit;
        else answer = options[0];
      }
      const qText = cleanChoiceText(asString(o.q)).replace(/\*\*/g, '');
      if (!qText || options.length < 2) return null;
      if (!isQuestionGrounded(qText, answer, passagePlain)) return null;
      return {
        q: sanitizeForPrompt(qText, 300),
        options: options.map((x) => sanitizeForPrompt(x, 200)),
        answer: sanitizeForPrompt(answer, 200),
        explain: sanitizeForPrompt(asString(o.explain, ''), 300),
      };
    })
    .filter((x): x is PassageQuestion => x !== null)
    .slice(0, Math.max(6, readingLevel.questionCount));

  const clozeObj =
    raw.cloze && typeof raw.cloze === 'object'
      ? (raw.cloze as Record<string, unknown>)
      : {};
  let clozeText = asString(clozeObj.text);
  const blanksRaw = Array.isArray(clozeObj.blanks) ? clozeObj.blanks : [];
  const blanks: PassageClozeBlank[] = blanksRaw
    .map((b, i) => {
      if (!b || typeof b !== 'object') return null;
      const o = b as Record<string, unknown>;
      const answer = cleanChoiceText(asString(o.answer)).toLowerCase();
      let options = asStringArray(o.options)
        .map((x) => cleanChoiceText(x).toLowerCase())
        .filter((x) => x && !/^distractor\d*$/i.test(x));
      if (!answer) return null;
      // fill real distractors from targets
      if (options.length < 4) {
        const pool = targets.filter((t) => t !== answer);
        options = [...new Set([answer, ...options, ...pool])].slice(0, 4);
      }
      if (!options.includes(answer)) options = [answer, ...options].slice(0, 4);
      const shuffled = [...new Set(options)].slice(0, 4);
      return {
        id: typeof o.id === 'number' ? o.id : i,
        answer,
        options: shuffled.map((x) => sanitizeForPrompt(x, 60)),
      };
    })
    .filter((x): x is PassageClozeBlank => x !== null)
    .slice(0, 12);

  if (!clozeText || blanks.length < 3) {
    // fallback: build cloze from used words
    let t = passagePlain;
    const autoBlanks: PassageClozeBlank[] = [];
    const n = Math.min(6, Math.max(4, usedWords.length));
    usedWords.slice(0, n).forEach((w, i) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${esc}\\b`, 'i');
      if (re.test(t)) {
        t = t.replace(re, `{{${i}}}`);
        autoBlanks.push({
          id: i,
          answer: w,
          options: [w, ...targets.filter((x) => x !== w).slice(0, 3)],
        });
      }
    });
    if (autoBlanks.length >= blanks.length) {
      clozeText = t;
      blanks.length = 0;
      blanks.push(...autoBlanks);
    }
  }

  return {
    title: sanitizeForPrompt(asString(raw.title, theme.labelEn), 120),
    passage,
    passagePlain,
    level: readingLevel.cefr,
    themeId: theme.id,
    themeLabelVi: theme.labelVi,
    readingLevelId: readingLevel.id,
    readingLevelLabelVi: readingLevel.labelVi,
    wordCount: passagePlain.split(/\s+/).filter(Boolean).length,
    usedWords,
    missingWords,
    coverage,
    questions,
    cloze: { text: clozeText || passagePlain, blanks },
    meta: {
      attempts,
      providerNote: 'ai-router (on-demand gen)',
    },
  };
}

export type GeneratePackPassageOpts = {
  /** Bắt buộc — chủ đề bao trùm mọi từ trong list */
  themeId: string;
  /** Cấp độ đọc (starter…advanced). Mặc định elementary A2 */
  readingLevelId?: string;
  title?: string;
  /** @deprecated dùng readingLevelId */
  level?: string;
  minCoverage?: number;
  /**
   * true = thử Gemini multi-key trước (Pro).
   * false = chỉ Zhipu (Free chậm).
   * default: có GEMINI keys thì true.
   */
  preferGemini?: boolean;
};

/**
 * Sinh passage + questions + cloze.
 * Retry nếu coverage thấp HOẶC độ dài < minWords của reading level.
 * Gọi CHỈ khi user bấm Gen AI. Bắt buộc themeId.
 */
export async function generatePackPassage(
  words: PackWord[],
  opts: GeneratePackPassageOpts
): Promise<PackPassageResult> {
  if (words.length < MIN_WORDS) {
    throw new Error(`Cần ít nhất ${MIN_WORDS} từ (hiện ${words.length})`);
  }
  if (words.length > MAX_WORDS) {
    throw new Error(`Tối đa ${MAX_WORDS} từ / 1 đoạn (hiện ${words.length})`);
  }

  const theme = getPackTheme(opts.themeId);
  if (!theme) {
    throw new Error('Chưa chọn chủ đề hợp lệ — chọn 1 theme bao trùm tất cả các từ trước khi Gen AI');
  }

  const readingLevel =
    getPackReadingLevel(opts.readingLevelId) ||
    getPackReadingLevel(DEFAULT_PACK_READING_LEVEL_ID)!;

  const targets = words.map((w) => w.word);
  const minCoverage = opts.minCoverage ?? 0.75;
  /** Chấp nhận ≥ 90% minWords (model flash hay thiếu vài chục từ) */
  const minAcceptWords = Math.floor(readingLevel.minWords * 0.9);
  const maxAttempts = 3;
  const preferGemini = opts.preferGemini ?? hasGeminiKeys();

  let attempts = 0;
  let lastError: Error | null = null;
  let forceInclude: string[] | undefined;
  let expandLength = false;
  let prevWordCount: number | undefined;
  let best: PackPassageResult | null = null;
  let usedProvider = preferGemini ? 'gemini' : 'zhipu';

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const prompt = buildPrompt(words, {
        title: opts.title,
        theme,
        readingLevel,
        forceInclude,
        expandLength,
        prevWordCount,
      });

      const { text: rawText, provider } = await generateWith3StepFallback(prompt, {
        preferGemini,
        jsonMode: true,
        temperature: 0.35,
      });
      usedProvider = provider;

      const parsed = parseJsonObject(rawText);
      const result = normalizeResult(parsed, targets, attempts, theme, readingLevel);
      result.meta.providerNote = usedProvider;

      const coverageOk = result.coverage >= minCoverage;
      const lengthOk = result.wordCount >= minAcceptWords;
      // giữ bản “tốt nhất” nếu vẫn fail hết (ưu tiên coverage rồi length)
      if (
        !best ||
        result.coverage > best.coverage ||
        (result.coverage === best.coverage && result.wordCount > best.wordCount)
      ) {
        best = result;
      }

      if (coverageOk && lengthOk) {
        return result;
      }

      if (!coverageOk) {
        forceInclude = result.missingWords;
        console.log(
          `[PackPassage] coverage=${(result.coverage * 100).toFixed(0)}% missing=${result.missingWords.join(',')} → retry`,
        );
      }
      if (!lengthOk) {
        expandLength = true;
        prevWordCount = result.wordCount;
        console.log(
          `[PackPassage] length=${result.wordCount} < min ${minAcceptWords} (level ${readingLevel.id} target ${readingLevel.minWords}-${readingLevel.maxWords}) → retry expand`,
        );
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.error(`[PackPassage] attempt ${attempts} failed:`, lastError.message);
      if (attempts >= maxAttempts) break;
    }
  }

  if (best) {
    console.warn(
      `[PackPassage] return best-effort coverage=${(best.coverage * 100).toFixed(0)}% words=${best.wordCount} (target ${readingLevel.minWords}-${readingLevel.maxWords})`,
    );
    return best;
  }

  throw lastError ?? new Error('Không sinh được passage');
}

/** Sample packs cho demo UI (không cần DB). */
export const DEMO_PACKS: Array<{
  id: string;
  title: string;
  level: string;
  words: PackWord[];
}> = [
  {
    id: 'demo-family-life',
    title: 'Unit 1 · Family Life',
    level: 'A2',
    words: [
      { word: 'chore', translation: 'việc vặt', pos: 'n' },
      { word: 'responsibility', translation: 'trách nhiệm', pos: 'n' },
      { word: 'household', translation: 'hộ gia đình', pos: 'n' },
      { word: 'share', translation: 'chia sẻ', pos: 'v' },
      { word: 'laundry', translation: 'giặt giũ', pos: 'n' },
      { word: 'grateful', translation: 'biết ơn', pos: 'adj' },
      { word: 'bond', translation: 'mối liên kết', pos: 'n' },
      { word: 'support', translation: 'hỗ trợ', pos: 'v/n' },
      { word: 'routine', translation: 'thói quen hàng ngày', pos: 'n' },
      { word: 'cooperate', translation: 'hợp tác', pos: 'v' },
      { word: 'respect', translation: 'tôn trọng', pos: 'v/n' },
      { word: 'balance', translation: 'cân bằng', pos: 'n/v' },
    ],
  },
  {
    id: 'demo-environment',
    title: 'Unit · Green Living',
    level: 'B1',
    words: [
      { word: 'pollution', translation: 'ô nhiễm', pos: 'n' },
      { word: 'recycle', translation: 'tái chế', pos: 'v' },
      { word: 'plastic', translation: 'nhựa', pos: 'n' },
      { word: 'waste', translation: 'rác thải', pos: 'n' },
      { word: 'protect', translation: 'bảo vệ', pos: 'v' },
      { word: 'energy', translation: 'năng lượng', pos: 'n' },
      { word: 'renewable', translation: 'tái tạo', pos: 'adj' },
      { word: 'climate', translation: 'khí hậu', pos: 'n' },
      { word: 'reduce', translation: 'giảm', pos: 'v' },
      { word: 'ecosystem', translation: 'hệ sinh thái', pos: 'n' },
      { word: 'sustainable', translation: 'bền vững', pos: 'adj' },
      { word: 'awareness', translation: 'nhận thức', pos: 'n' },
    ],
  },
  {
    id: 'demo-school',
    title: 'Unit · School Life',
    level: 'A2',
    words: [
      { word: 'assignment', translation: 'bài tập', pos: 'n' },
      { word: 'deadline', translation: 'hạn chót', pos: 'n' },
      { word: 'concentrate', translation: 'tập trung', pos: 'v' },
      { word: 'revision', translation: 'ôn tập', pos: 'n' },
      { word: 'classmate', translation: 'bạn cùng lớp', pos: 'n' },
      { word: 'improve', translation: 'cải thiện', pos: 'v' },
      { word: 'confident', translation: 'tự tin', pos: 'adj' },
      { word: 'presentation', translation: 'bài thuyết trình', pos: 'n' },
      { word: 'feedback', translation: 'phản hồi', pos: 'n' },
      { word: 'challenge', translation: 'thử thách', pos: 'n/v' },
      { word: 'achieve', translation: 'đạt được', pos: 'v' },
      { word: 'schedule', translation: 'lịch trình', pos: 'n' },
    ],
  },
];
