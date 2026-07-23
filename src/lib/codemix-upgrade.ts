/**
 * AI: nâng đoạn code-mix (VI + từ EN target) → full English + giải thích wow.
 * Pro → Gemini (fallback Zhipu); Free → Zhipu.
 */
import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';
import { geminiGenerate, hasGeminiKeys, resolveGeminiModel } from '@/lib/gemini-multi';

export interface CodeMixWord {
  word: string;
  translation?: string;
  /** n / v / adj / adv / … — giúp AI đúng collocation */
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

/** Dọn markdown / rác model dính vào field VI */
function cleanVi(s: string, maxLen: number): string {
  const t = stripBold(s)
    .replace(/#{1,6}\s*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bWow\b[,!.]?\s*/gi, '')
    .trim();
  return sanitizeForPrompt(t, maxLen);
}

function cleanEn(s: string, maxLen: number): string {
  // Giữ **target** bold; bỏ control / fence
  return s
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/```/g, '')
    .trim()
    .slice(0, maxLen);
}

function buildPrompt(codemix: string, words: CodeMixWord[], level: string): string {
  const wordLines = words
    .map((w) => {
      const t = w.translation ? ` = ${sanitizeForPrompt(w.translation, 80)}` : '';
      const p = w.pos ? ` [${sanitizeForPrompt(w.pos, 12)}]` : '';
      return `- ${sanitizeForPrompt(w.word, 40)}${p}${t}`;
    })
    .join('\n');

  return `You are a careful ESL coach for Vietnamese learners.

The student wrote CODE-MIX text (Vietnamese + some English target words).

STUDENT TEXT:
"""
${sanitizeForPrompt(codemix, 1200)}
"""

TARGET WORDS (with POS when known):
${wordLines}

CRITICAL RULES (must follow):
1) Output NATURAL, GRAMMATICAL English first. Never sacrifice grammar to cram targets together.
2) Respect part of speech:
   - adjective + noun (an academic problem) — NOT "academic perilously situation"
   - adverb modifies verb/adjective/adverb (perilously close, almost perilously late) — NOT before a noun like an adjective
   - verb + object, noun as subject/object, etc.
3) Prefer CORRECT collocations. If the student misused a form, FIX it in the upgrade and teach the right form in why_vi/tip_vi.
4) You may use a closely related form of a target when needed for grammar (perilously → perilous; academic → academically). Bold the form that actually appears: **perilous**.
5) If the student only dumped words / short fragments, invent a short clear story (2–4 simple sentences) that uses the targets correctly — do not invent nonsense.
6) Keep every target sense that fits; if two targets cannot sit in the same phrase, put them in separate clauses/sentences.
7) Level: aim ${sanitizeForPrompt(level, 12)} structure, but raise to B1 if targets require it — never produce broken English for "simplicity".
8) Vietnamese fields: plain Vietnamese only. No English dump, no markdown **, no mixing wow_note into tip_vi.
9) meaning_vi must accurately translate YOUR english (not invent wrong senses like "academic = học viện" when it means "học thuật / liên quan học tập").
10) wow_note_vi: 1–2 short encouraging insights in Vietnamese about how the targets are used.

Return ONLY valid JSON (no markdown fences):
{
  "english": "Full EN with **targets** bolded where they appear",
  "meaning_vi": "Bản dịch VI chính xác của đoạn EN",
  "level": "A2",
  "wow_note_vi": "1–2 câu insight tiếng Việt",
  "words": [
    {
      "word": "academic",
      "in_sentence": "She is in a difficult academic situation.",
      "pattern": "academic + noun (problem/career/year)",
      "why_vi": "Tính từ: academic + danh từ — 'vấn đề học tập / học thuật', không phải tên trường.",
      "tip_vi": "academic year, academic pressure, academic writing."
    }
  ]
}

words[]: one entry per target that appears (use the dictionary headword as "word"). in_sentence must be a correct English clause from your upgrade.`;
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
      pattern: cleanVi(asString(o.pattern), 120),
      why_vi: cleanVi(asString(o.why_vi), 320),
      tip_vi: cleanVi(asString(o.tip_vi), 220),
    });
  }

  // Ưu tiên order theo targets
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
  const prompt = buildPrompt(text, words, level);

  let rawText: string;
  let providerNote: string;

  if (preferGemini) {
    try {
      rawText = await geminiGenerate(prompt, { json: true, temperature: 0.25 });
      providerNote = `gemini:${resolveGeminiModel()}`;
    } catch (gemErr: unknown) {
      const gmsg = gemErr instanceof Error ? gemErr.message : String(gemErr);
      console.warn(`[CodeMixUpgrade] Gemini fail → Zhipu: ${gmsg.slice(0, 160)}`);
      rawText = await getRouter().generate(prompt, 'smart', true);
      providerNote = 'zhipu-fallback';
    }
  } else {
    rawText = await getRouter().generate(prompt, 'smart', true);
    providerNote = 'zhipu';
  }

  const parsed = parseJsonObject(rawText);

  const english = cleanEn(asString(parsed.english), 2000);
  if (!english || stripBold(english).length < 20) {
    throw new Error('AI trả english rỗng/quá ngắn');
  }

  // Cảnh báo nhẹ nếu model vẫn nhồi adj+adv sai kiểu "... academic perilously ..."
  const plainLower = stripBold(english).toLowerCase();
  if (/\bacademic\s+perilously\b/.test(plainLower)) {
    console.warn('[CodeMixUpgrade] suspicious collocation academic+perilously in output');
  }

  return {
    english,
    english_plain: stripBold(english),
    meaning_vi: cleanVi(asString(parsed.meaning_vi), 800),
    level: sanitizeForPrompt(asString(parsed.level, level), 20),
    wow_note_vi: cleanVi(asString(parsed.wow_note_vi), 400),
    words: normalizeWords(parsed.words, words),
    meta: { providerNote },
  };
}
