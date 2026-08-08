/**
 * AI: nâng đoạn code-mix (VI + từ EN target) → full English + giải thích wow.
 *
 * Prompt = ESL teacher brief + prompt-engineer pack (grammar-first, POS, golden example).
 * Pro → Gemini (fallback Zhipu); Free → Zhipu. Hard-validate + 1 retry.
 */
import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';
import { hasGeminiKeys } from '@/lib/gemini-multi';
import { generateWith3StepFallback } from '@/lib/llm-chain';

export interface CodeMixWord {
  word: string;
  translation?: string;
  /** n / v / adj / adv / … — POS authoritative for syntax */
  pos?: string;
}

/** Số từ target / lượt luyện (bulk chọn). */
export const CODEMIX_MIN_WORDS = 1;
export const CODEMIX_MAX_WORDS = 20;

export interface WordWowExplain {
  word: string;
  /** Cụm/câu EN chứa từ (trích từ bản nâng cấp) */
  in_sentence: string;
  /** Pattern / collocation hay dùng */
  pattern: string;
  /** Giải thích tiếng Việt ngắn — vì sao dùng vậy */
  why_vi: string;
  /** Tip nhớ / tip dùng */
  tip_vi: string;
}

export interface CodeMixUpgradeResult {
  /** Đoạn EN full — target bọc **word** */
  english: string;
  english_plain: string;
  /** Bản dịch VI mượt (để so) */
  meaning_vi: string;
  /** Level ước lượng A1/A2… */
  level: string;
  /** Điểm wow 1–3 câu */
  wow_note_vi: string;
  words: WordWowExplain[];
  meta: { providerNote: string };
}

const LOG = '[CodeMixUpgrade]';

/** Retry khi hard-fail validation (teacher rubric). */
const RETRY_SUFFIX = `

PREVIOUS OUTPUT FAILED TEACHER QA. Fix ALL of:
- Natural grammar; never ADJ+ADV+NOUN (e.g. "academic perilously situation").
- Adv only before adj/verb (perilously close); before a noun use adj form (perilous situation).
- VI fields: plain Vietnamese only — no **, no #, no "Wow," token, no field bleed.
- meaning_vi must accurately translate YOUR english (academic ≈ học thuật/học tập, not "học viện" unless institution name).
- 2–4 clean sentences; separate clauses if targets cannot share one phrase.
- words[]: one headword each; in_sentence = correct clause from english; pattern short; why_vi ≠ tip_vi.
Return ONLY valid JSON.`;

function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả JSON hợp lệ');
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

/** Dọn markdown / rác model dính vào field VI (plain text cho HS). */
function cleanVi(s: string, maxLen: number): string {
  const t = stripBold(s)
    .replace(/#{1,6}\s*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bWow\b[,!.]?\s*/gi, '')
    .trim();
  return sanitizeForPrompt(t, maxLen);
}

function cleanEn(s: string, maxLen: number): string {
  return s
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/```/g, '')
    .trim()
    .slice(0, maxLen);
}

function formatTargetLines(words: CodeMixWord[]): string {
  return words
    .map((w) => {
      const pos = w.pos ? sanitizeForPrompt(w.pos, 12) : '?';
      const gloss = w.translation
        ? sanitizeForPrompt(w.translation, 80)
        : '(no gloss)';
      // POS authoritative; gloss = sense hint only
      return `- ${sanitizeForPrompt(w.word, 40)} | ${pos} | ${gloss}`;
    })
    .join('\n');
}

/**
 * Prompt = ESL pedagogy + prompt-engineer pack.
 * Priority: grammar > collocation > coverage > student wording.
 */
function buildPrompt(codemix: string, words: CodeMixWord[], level: string): string {
  const wordLines = formatTargetLines(words);
  const levelSafe = sanitizeForPrompt(level, 12);

  return `You are a warm, careful ESL writing coach for Vietnamese teens (A1–B1).
Task: rewrite CODE-MIX (Vietnamese + English targets) into natural full English, then teach each target so the student gets a 30–60s "wow" micro-lesson.

PRIORITY: grammar > collocation > target coverage > copying student wording.

RULES
1) Natural grammatical English first. Never force targets adjacent if that breaks English.
2) Respect POS strictly:
   - adj + noun (academic problem / academic situation)
   - adv modifies verb/adj/adv only (perilously close) — NEVER "academic perilously situation"
   - verb + object; noun as subject/object
3) Fix student mistakes in "english". Explain the fix in why_vi (POS + sense + optional wrong→right).
4) Related forms OK when grammar needs them (perilously→perilous; academic→academically). Bold the SURFACE form that appears: **perilous**.
5) If two targets cannot share one phrase safely → separate clauses/sentences (2–4 sentences, ~35–80 words total).
6) Fragments / word dumps → invent a short clear teen-school story using targets correctly. Never mirror broken code-mix.
7) Level aim ${levelSafe}; raise to B1 if targets require it — never produce broken English for "simplicity".
8) Vietnamese fields: PLAIN Vietnamese only. No **, no #, no English dumps in meaning_vi, no "Wow," token, no mixing wow_note into tip_vi.
9) meaning_vi = accurate translation of YOUR english only. Sense-in-context: academic ≈ học thuật / liên quan học tập — NOT "học viện" unless the sentence is about an institution name.
10) wow_note_vi = [short encourage] + [ONE insight about POS/collocation/form-change]. Max 2 sentences.
11) words[]: one object per target headword. pattern = short chunk (≤60 chars). why_vi = POS + meaning + contrast if fixed. tip_vi = 2–3 collocations or 1 memory rule (≠ copy of why_vi). in_sentence = correct EN clause from your upgrade.

BANNED
- ADJ+ADV+NOUN mashups ("academic perilously situation")
- Adv immediately before a noun as if it were an adj
- VI markdown / "Wow," spam / field bleed
- Forcing rare wrong sense of academic (= học viện) when context is study/exams

GOLDEN EXAMPLE
Student: "Hôm nay mình academic perilously situation vì deadline gần."
Targets: academic | adj | học thuật — perilously | adv | suýt / nguy hiểm
GOOD english: "Today I am in a difficult **academic** situation because the deadline is **perilously** close."
BAD english: "Today I face **academic** **perilously** situation because deadline."

STUDENT TEXT:
"""
${sanitizeForPrompt(codemix, 1200)}
"""

TARGET WORDS (headword | POS | VI gloss — POS rules syntax; gloss is sense hint only, not a forced phrase):
${wordLines}

LEVEL AIM: ${levelSafe}

Return ONLY valid JSON (no markdown fences, no text outside JSON):
{"english":"EN with **surface forms** bolded","meaning_vi":"Bản dịch VI plain khớp english","level":"A2","wow_note_vi":"1–2 câu khen + 1 insight POS/collocation","words":[{"word":"headword","in_sentence":"clause from english","pattern":"collocation chunk","why_vi":"POS + nghĩa + (sai→đúng nếu có)","tip_vi":"2–3 collocation hoặc 1 rule nhớ"}]}`;
}

type QaResult = { ok: boolean; hard: string[]; soft: string[] };

/** Teacher rubric — hard fail = reject & retry. */
function validateUpgrade(
  parsed: Record<string, unknown>,
  targets: CodeMixWord[]
): QaResult {
  const hard: string[] = [];
  const soft: string[] = [];

  const english = asString(parsed.english);
  const plain = stripBold(english);
  const meaning = cleanVi(asString(parsed.meaning_vi), 800);
  const wow = cleanVi(asString(parsed.wow_note_vi), 220);
  const wordsRaw = Array.isArray(parsed.words) ? parsed.words : [];

  if (plain.length < 20) hard.push('english_too_short');
  if (meaning.trim().length < 8) hard.push('meaning_vi_empty');

  const viMarkdown = (s: string) => /#{1,6}\s|```/.test(s);
  if (viMarkdown(meaning) || viMarkdown(wow)) hard.push('vi_markdown');

  // Adv jammed before common nouns (classic POS fail)
  if (
    /\bacademic\s+perilously\b/i.test(plain) ||
    /\b\w+ly\s+(situation|problem|pressure|issue|condition|decision|moment|position)\b/i.test(
      plain
    )
  ) {
    hard.push('bad_collocation_adv_before_noun');
  }

  if (targets.length > 0 && wordsRaw.length === 0) hard.push('words_empty');

  for (const item of wordsRaw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const word = asString(o.word);
    if (/\bacademic\s+peril/i.test(word) || word.split(/\s+/).length > 3) {
      hard.push('word_not_headword');
    }
    for (const k of ['why_vi', 'tip_vi'] as const) {
      if (viMarkdown(asString(o[k]))) hard.push(`vi_markdown_${k}`);
    }
  }

  // Soft: coverage (stem heuristic)
  const low = plain.toLowerCase();
  const missing = targets.filter((t) => {
    const w = t.word.toLowerCase();
    const stem = w.replace(/ly$/i, '').replace(/e$/i, '');
    return !low.includes(w) && !(stem.length >= 4 && low.includes(stem));
  });
  if (missing.length) {
    soft.push(`missing_targets:${missing.map((m) => m.word).join(',')}`);
  }
  if (/\bWow\b/i.test(meaning) || /\bWow\b/i.test(wow)) soft.push('wow_token');

  return { ok: hard.length === 0, hard, soft };
}

function normalizeWords(
  raw: unknown,
  targets: CodeMixWord[]
): WordWowExplain[] {
  const list = Array.isArray(raw) ? raw : [];
  const byWord = new Map<string, WordWowExplain>();

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const word = asString(o.word).toLowerCase();
    if (!word) continue;
    byWord.set(word, {
      word: sanitizeForPrompt(asString(o.word), 40),
      in_sentence: cleanEn(stripBold(asString(o.in_sentence)), 200),
      // Teacher caps: pattern short, why/tip tight
      pattern: cleanVi(asString(o.pattern), 80),
      why_vi: cleanVi(asString(o.why_vi), 200),
      tip_vi: cleanVi(asString(o.tip_vi), 140),
    });
  }

  const ordered: WordWowExplain[] = [];
  for (const t of targets) {
    const hit = byWord.get(t.word.toLowerCase());
    if (hit) ordered.push(hit);
  }
  for (const [k, v] of byWord) {
    if (!ordered.some((x) => x.word.toLowerCase() === k)) ordered.push(v);
  }
  return ordered.slice(0, 12);
}

function toResult(
  parsed: Record<string, unknown>,
  words: CodeMixWord[],
  level: string,
  providerNote: string
): CodeMixUpgradeResult {
  const english = cleanEn(asString(parsed.english), 2000);
  if (!english || stripBold(english).length < 20) {
    throw new Error('AI trả english rỗng/quá ngắn');
  }

  return {
    english,
    english_plain: stripBold(english),
    meaning_vi: cleanVi(asString(parsed.meaning_vi), 800),
    level: sanitizeForPrompt(asString(parsed.level, level), 20),
    // Teacher: encourage + 1 insight
    wow_note_vi: cleanVi(asString(parsed.wow_note_vi), 220),
    words: normalizeWords(parsed.words, words),
    meta: { providerNote },
  };
}

/** Offline fallback khi AI fail — vẫn demo được UI wow */
export function offlineCodeMixUpgrade(
  codemix: string,
  words: CodeMixWord[]
): CodeMixUpgradeResult {
  const english =
    "Today I **wake up** at 6 o'clock. I **eat** bread and then **go** to school. In the afternoon I **study** English. At night I **sleep** early.";
  const explains: WordWowExplain[] = [
    {
      word: 'wake up',
      in_sentence: "I wake up at 6 o'clock.",
      pattern: 'wake up + at + time',
      why_vi: 'Phrasal verb: wake (thức) + up. Hay đi với giờ: at 6, at 7 a.m.',
      tip_vi: 'Không nói "I wake at 6" khi ý là thức dậy — cần "wake up".',
    },
    {
      word: 'eat',
      in_sentence: 'I eat bread.',
      pattern: 'eat + food',
      why_vi: 'Động từ ăn + món ăn (bread, rice, breakfast).',
      tip_vi: 'Buổi ăn: eat breakfast / lunch / dinner.',
    },
    {
      word: 'go',
      in_sentence: 'I go to school.',
      pattern: 'go to + place',
      why_vi: 'Đi đến nơi → go to school / work / the market.',
      tip_vi: 'go home (không "go to home").',
    },
    {
      word: 'study',
      in_sentence: 'I study English.',
      pattern: 'study + subject',
      why_vi: 'Học môn/kỹ năng: study English, study math.',
      tip_vi: 'study ≠ learn (study = ôn/học có chủ đích).',
    },
    {
      word: 'sleep',
      in_sentence: 'I sleep early.',
      pattern: 'sleep + early/late',
      why_vi: 'Ngủ — trạng từ thời gian: early, late, well.',
      tip_vi: 'go to sleep / go to bed = bắt đầu đi ngủ.',
    },
  ].filter(
    (e) =>
      words.some((w) => w.word.toLowerCase() === e.word.toLowerCase()) ||
      codemix.toLowerCase().includes(e.word.toLowerCase())
  );

  return {
    english,
    english_plain: stripBold(english),
    meaning_vi:
      'Hôm nay tôi thức dậy lúc 6 giờ. Tôi ăn bánh mì rồi đi học. Buổi chiều tôi học tiếng Anh. Tối tôi ngủ sớm.',
    level: 'A1',
    wow_note_vi:
      '(Offline demo) Bản mẫu A1: giữ target, thêm giới từ/collocation tự nhiên — bật AI key để nâng đoạn của chính bạn.',
    words: explains.length
      ? explains
      : words.slice(0, 5).map((w) => ({
          word: w.word,
          in_sentence: `… ${w.word} …`,
          pattern: w.word,
          why_vi: w.translation
            ? `Nghĩa: ${w.translation}. Dùng trong ngữ cảnh đoạn của bạn.`
            : 'Dùng trong ngữ cảnh đoạn của bạn.',
          tip_vi: 'Thử đặt vào câu I / You + V …',
        })),
    meta: { providerNote: 'offline-fallback' },
  };
}

export type UpgradeCodeMixOpts = {
  level?: string;
  /** Pro: Gemini trước, fail → Zhipu. Free: Zhipu. */
  preferGemini?: boolean;
};

async function callModel(
  prompt: string,
  preferGemini: boolean
): Promise<{ rawText: string; providerNote: string }> {
  const { text: rawText, provider: providerNote } = await generateWith3StepFallback(prompt, {
    preferGemini,
    jsonMode: true,
    temperature: 0.22,
  });
  return { rawText, providerNote };
}

export async function upgradeCodeMixToEnglish(
  codemix: string,
  words: CodeMixWord[],
  opts?: UpgradeCodeMixOpts
): Promise<CodeMixUpgradeResult> {
  const text = codemix.trim();
  if (text.length < 12) throw new Error('Đoạn quá ngắn');
  if (text.length > 2000) throw new Error('Đoạn quá dài (max ~2000 ký tự)');
  if (words.length < CODEMIX_MIN_WORDS) {
    throw new Error(
      `Cần chọn ${CODEMIX_MIN_WORDS}–${CODEMIX_MAX_WORDS} từ (hiện ${words.length})`
    );
  }
  if (words.length > CODEMIX_MAX_WORDS) {
    throw new Error(
      `Tối đa ${CODEMIX_MAX_WORDS} từ/lượt (hiện ${words.length})`
    );
  }

  const level = opts?.level || 'A2';
  const preferGemini = opts?.preferGemini === true && hasGeminiKeys();
  let prompt = buildPrompt(text, words, level);

  let lastHard: string[] = [];
  let lastProvider = preferGemini ? 'gemini' : 'zhipu';

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 1) {
      prompt = `${buildPrompt(text, words, level)}${RETRY_SUFFIX}`;
      console.warn(`${LOG} retry after hard QA: ${lastHard.join(',')}`);
    }

    const { rawText, providerNote } = await callModel(prompt, preferGemini);
    lastProvider = providerNote;

    let parsed: Record<string, unknown>;
    try {
      parsed = parseJsonObject(rawText);
    } catch (e) {
      lastHard = ['not_json'];
      if (attempt === 0) continue;
      throw e instanceof Error ? e : new Error(String(e));
    }

    const qa = validateUpgrade(parsed, words);
    if (qa.soft.length) {
      console.warn(`${LOG} soft QA: ${qa.soft.join('; ')}`);
    }
    if (!qa.ok) {
      lastHard = qa.hard;
      console.warn(`${LOG} hard QA fail (attempt ${attempt + 1}): ${qa.hard.join(',')}`);
      if (attempt === 0) continue;
      // Lần 2 vẫn hard-fail → vẫn trả (đã clean) để HS không trắng màn; log để theo dõi
      console.error(`${LOG} serving after failed retry: ${qa.hard.join(',')}`);
    }

    const result = toResult(parsed, words, level, providerNote);
    if (attempt === 1) {
      result.meta.providerNote = `${providerNote}+retry`;
    }
    return result;
  }

  throw new Error(`AI QA fail (${lastProvider}): ${lastHard.join(',') || 'unknown'}`);
}
