/**
 * AI: nâng đoạn code-mix (VI + từ EN target) → full English + giải thích wow.
 */
import { getRouter } from '@/lib/ai-router';
import { sanitizeForPrompt } from '@/lib/api-security';

export interface CodeMixWord {
  word: string;
  translation?: string;
}

/** Số từ target / lượt luyện (bulk chọn). */
export const CODEMIX_MIN_WORDS = 5;
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

function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

function buildPrompt(codemix: string, words: CodeMixWord[], level: string): string {
  const wordLines = words
    .map((w) => {
      const t = w.translation ? ` = ${sanitizeForPrompt(w.translation, 80)}` : '';
      return `- ${sanitizeForPrompt(w.word, 40)}${t}`;
    })
    .join('\n');

  return `You are a warm ESL coach for Vietnamese teens (CEFR ${sanitizeForPrompt(level, 12)}).

The student wrote a CODE-MIX paragraph: Vietnamese shell + some English target words inserted.

STUDENT TEXT:
"""
${sanitizeForPrompt(codemix, 1200)}
"""

TARGET WORDS (keep these English forms; teach natural use):
${wordLines}

TASK:
1) Rewrite into NATURAL full English that keeps the student's meaning/story.
2) KEEP every target word that already appears; if a target is missing, add it only if it still fits the story — never force awkwardly.
3) Wrap each target word in **double asterisks** in the english field (e.g. I **wake up** at 6).
4) For EACH target that appears in the upgrade, explain in Vietnamese HOW it is used (pattern + why + tip) so the student says "wow, so that's how you use it".
5) Keep grammar A1–A2 simple, natural collocations.

Return ONLY valid JSON (no markdown fences):
{
  "english": "Full EN paragraph with **targets** bolded",
  "meaning_vi": "Bản dịch VI mượt của đoạn EN",
  "level": "A1",
  "wow_note_vi": "1–2 câu khen + insight ngắn (tiếng Việt)",
  "words": [
    {
      "word": "wake up",
      "in_sentence": "I wake up at 6 o'clock.",
      "pattern": "wake up + at + time",
      "why_vi": "…",
      "tip_vi": "…"
    }
  ]
}`;
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
      in_sentence: sanitizeForPrompt(asString(o.in_sentence), 200),
      pattern: sanitizeForPrompt(asString(o.pattern), 120),
      why_vi: sanitizeForPrompt(asString(o.why_vi), 280),
      tip_vi: sanitizeForPrompt(asString(o.tip_vi), 200),
    });
  }

  // Ưu tiên order theo targets
  const ordered: WordWowExplain[] = [];
  for (const t of targets) {
    const hit = byWord.get(t.word.toLowerCase());
    if (hit) ordered.push(hit);
  }
  // extras
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
  ].filter((e) =>
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

export async function upgradeCodeMixToEnglish(
  codemix: string,
  words: CodeMixWord[],
  opts?: { level?: string }
): Promise<CodeMixUpgradeResult> {
  const text = codemix.trim();
  if (text.length < 12) throw new Error('Đoạn quá ngắn');
  if (text.length > 2000) throw new Error('Đoạn quá dài (max ~2000 ký tự)');
  if (words.length < CODEMIX_MIN_WORDS) {
    throw new Error(`Cần chọn ${CODEMIX_MIN_WORDS}–${CODEMIX_MAX_WORDS} từ (hiện ${words.length})`);
  }
  if (words.length > CODEMIX_MAX_WORDS) {
    throw new Error(`Tối đa ${CODEMIX_MAX_WORDS} từ/lượt (hiện ${words.length})`);
  }

  const level = opts?.level || 'A1-A2';
  const router = getRouter();
  const prompt = buildPrompt(text, words, level);
  const rawText = await router.generate(prompt, 'smart', true);
  const parsed = parseJsonObject(rawText);

  const english = asString(parsed.english);
  if (!english || english.length < 20) {
    throw new Error('AI trả english rỗng/quá ngắn');
  }

  return {
    english: sanitizeForPrompt(english, 2000),
    english_plain: stripBold(english),
    meaning_vi: sanitizeForPrompt(asString(parsed.meaning_vi), 800),
    level: sanitizeForPrompt(asString(parsed.level, level), 20),
    wow_note_vi: sanitizeForPrompt(asString(parsed.wow_note_vi), 400),
    words: normalizeWords(parsed.words, words),
    meta: { providerNote: 'ai-router (Zhipu/Groq)' },
  };
}
