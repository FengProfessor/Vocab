/**
 * Daily Reading Generator Library.
 *
 * Core generator logic shared between:
 * - On-demand API generation: POST /api/practice/daily-reading/generate
 * - Nightly batch cron job: scripts/generate-daily-reading-nlm.ts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  analyzeVocabularyTier,
  checkPassageRepetition,
  type AdaptiveLevelConfig,
} from '@/lib/daily-reading-level';
import {
  geminiGenerate,
  waitOutGeminiCooldown,
} from '@/lib/gemini-multi';
import { DEMO_PACKS } from '@/lib/pack-passage';

export interface WordItem {
  word: string;
  translation: string;
  pos?: string;
  definition_en?: string;
}

export interface UserCandidate {
  userId: string;
  email: string;
  fullName: string;
  primaryClassroomId?: string;
  words: WordItem[];
  levelConfig: AdaptiveLevelConfig;
}

export interface GeneratedExercise {
  title: string;
  passage: string;
  passagePlain: string;
  translation?: string;
  level: string;
  questions: Array<{
    q: string;
    options: string[];
    answer: string;
    explain: string;
  }>;
  cloze: {
    text: string;
    blanks: Array<{ id: number; answer: string; options: string[] }>;
  };
  usedWords: string[];
  coverage: number;
  bonusWords: Array<{ word: string; translation: string; pos?: string; definition_en?: string }>;
}

export const MAX_WORDS_PER_EXERCISE = 20;

// ── Timezone-safe Vietnam Date Helpers ──
export function getVietnamDate(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function todayVN(): string {
  return getVietnamDate(0);
}

export function tomorrowVN(): string {
  return getVietnamDate(1);
}

// ── JSON & String Helpers ──
export function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

export function cleanChoice(s: string): string {
  return s
    .replace(/^\s*[A-Da-d][).:]\s*/u, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseJsonLoose(raw: string): unknown {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  text = text.replace(/\[\d+\]/g, '');
  const m = text.match(/\{[\s\S]*\}/);
  if (m) text = m[0];
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
  try {
    return JSON.parse(text);
  } catch {
    const fixed = text.replace(/"([^"\\]|\\.)*"/g, (s) =>
      s.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'),
    );
    return JSON.parse(fixed);
  }
}

// ── Inflection-Tolerant Word Finder ──
export function findUsedWords(
  passage: string,
  targets: string[],
): { used: string[]; missing: string[] } {
  const lower = passage.toLowerCase();
  const used: string[] = [];
  const missing: string[] = [];

  const boldMatches = new Set<string>();
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let bm: RegExpExecArray | null;
  while ((bm = boldRegex.exec(passage)) !== null) {
    boldMatches.add(bm[1].toLowerCase().trim());
  }

  for (const w of targets) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let matched = false;

    if (w.includes(' ') || w.includes('-')) {
      matched = new RegExp(esc, 'i').test(lower);
    } else {
      let pattern = `\\b${esc}(?:s|es|ed|ing|d)?\\b`;
      if (w.endsWith('y')) {
        const stem = w.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = `\\b(?:${esc}|${stem}ies|${esc}(?:s|ed|ing)?)\\b`;
      } else if (w.endsWith('e')) {
        const stem = w.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = `\\b(?:${esc}|${stem}(?:es|ed|ing)|${esc}s?)\\b`;
      }
      matched = new RegExp(pattern, 'i').test(lower);
    }

    if (!matched) {
      for (const b of boldMatches) {
        if (b === w || b.startsWith(w) || (w.length > 4 && b.includes(w))) {
          matched = true;
          break;
        }
      }
    }

    if (matched) used.push(w);
    else missing.push(w);
  }
  return { used, missing };
}

import {
  findMatchingSourceWord,
  getLemmaCandidates,
} from '@/lib/daily-reading-morphology';
export { findMatchingSourceWord, getLemmaCandidates };


// ── Build Adaptive Prompt ──
export function buildDailyReadingPrompt(
  words: WordItem[],
  levelConfig: AdaptiveLevelConfig,
  userDisplayName: string,
): string {
  const wordLines = words
    .map((w) => {
      const bits = [`- ${w.word}`];
      if (w.pos) bits.push(`(${w.pos})`);
      bits.push(`= ${w.translation}`);
      return bits.join(' ');
    })
    .join('\n');

  const numQuestions = levelConfig.numQuestions;
  const numCloze = levelConfig.clozeBlanksCount;

  return `You are an expert ESL educator and a gifted writer.
Write ONE reading passage tailored for Vietnamese learner "${userDisplayName}" that naturally incorporates ALL target vocabulary words below.

TARGET LEVEL: ${levelConfig.labelEn} (${levelConfig.cefr})
- Passage length target: EXACTLY ${levelConfig.minWords}–${levelConfig.maxWords} English words (${levelConfig.paragraphs}).
- Complexity: ${levelConfig.complexity}
- Style guidelines: ${levelConfig.passageGuidelines}
- Question focus: ${levelConfig.questionGuidelines}

Target words (${words.length}):
${wordLines}

PASSAGE RULES:
1. Write ${levelConfig.minWords}–${levelConfig.maxWords} English words.
2. Use ALL target words naturally in realistic contexts. First occurrence of each target word MUST be wrapped in **markdown bold**.
3. Passage body: ENGLISH ONLY. No Vietnamese inside the passage body.
4. Auto-detect a realistic theme from the words (Daily Life, Science & Tech, Environment, Education & Work, Culture & Society, Health & Emotions).
5. ANTI-REPETITION MANDATE (QUALITY GATE): TUYỆT ĐỐI KHÔNG dùng các câu mẫu máy móc rập khuôn (ví dụ: cấm dùng 'In this context, X plays an essential role', 'impacts the overarching...', hoặc lặp lại cùng một khuôn mẫu ngữ pháp). Mỗi câu phải có cấu trúc ngữ pháp độc lập, tự nhiên, sinh động và kết nối logic mượt mà.

QUESTION RULES:
1. Exactly ${numQuestions} MCQs. Each: "q", 4 "options", "answer", "explain".
2. GROUNDED ONLY: every fact in question and answer MUST appear in the passage. Never invent unmentioned days, times, or places.
3. "answer" = exact copy of one option string (never just a letter).
4. "explain": Viết 2-3 câu giải thích chi tiết, tự nhiên bằng tiếng Việt. Phân tích sâu ngữ cảnh và nghĩa của từ vựng để học sinh hiểu bản chất TẠI SAO đáp án đó đúng. TUYỆT ĐỐI CẤM dùng các cụm từ khen ngợi công nghiệp ở đầu câu (như "Chính xác!", "Đúng rồi!", "Tuyệt vời!").

CLOZE RULES:
1. Rewrite the passage replacing exactly ${numCloze} target words with {{0}}, {{1}}, etc.
2. Each blank: "id" (number), "answer" (target word), "options" (4 real English words: 1 correct + 3 clever distractors).

BONUS VOCABULARY:
Include 2-4 bonus words that appear in the passage but are NOT in the target list.
For each: word, translation (Vietnamese), pos, definition_en.

Return ONLY valid JSON (no markdown fence):
{
  "title": "...",
  "passage": "... with **target** words ...",
  "translation": "Bản dịch toàn bộ đoạn văn sang tiếng Việt một cách tự nhiên và truyền cảm...",
  "level": "${levelConfig.cefr}",
  "usedWords": ["word1", "word2"],
  "questions": [
    {"q": "...", "options": ["A","B","C","D"], "answer": "B", "explain": "..."}
  ],
  "cloze": {
    "text": "... {{0}} ... {{1}} ...",
    "blanks": [
      {"id": 0, "answer": "word", "options": ["word","other1","other2","other3"]}
    ]
  },
  "bonusWords": [
    {"word": "...", "translation": "...", "pos": "n", "definition_en": "..."}
  ]
}`;
}

// ── Normalize AI Response ──
export function normalizeDailyReadingResponse(
  raw: Record<string, unknown>,
  targets: string[],
): GeneratedExercise {
  const passage = String(raw.passage || '').trim();
  if (!passage || passage.length < 40) throw new Error('Passage quá ngắn hoặc trống');

  const passagePlain = stripBold(passage);
  const { used: usedWords } = findUsedWords(passagePlain, targets);
  const coverage = targets.length ? usedWords.length / targets.length : 0;

  // Questions
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = questionsRaw
    .map((q: unknown) => {
      if (!q || typeof q !== 'object') return null;
      const o = q as Record<string, unknown>;
      const options = (Array.isArray(o.options) ? o.options : [])
        .filter((x): x is string => typeof x === 'string')
        .map(cleanChoice)
        .filter(Boolean)
        .slice(0, 4);
      let answer = cleanChoice(String(o.answer || ''));
      if (/^[A-Da-d]$/.test(answer) && options.length) {
        const idx = answer.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) answer = options[idx];
      }
      if (!options.includes(answer) && options.length) {
        const hit = options.find(
          (opt) =>
            opt.toLowerCase() === answer.toLowerCase() ||
            opt.toLowerCase().includes(answer.toLowerCase()),
        );
        answer = hit || options[0];
      }
      const qText = cleanChoice(String(o.q || '')).replace(/\*\*/g, '');
      if (!qText || options.length < 2) return null;
      return {
        q: qText.slice(0, 300),
        options: options.map((x) => x.slice(0, 200)),
        answer: answer.slice(0, 200),
        explain: String(o.explain || '').trim().slice(0, 300),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Cloze
  const clozeObj =
    raw.cloze && typeof raw.cloze === 'object'
      ? (raw.cloze as Record<string, unknown>)
      : {};
  let clozeText = String(clozeObj.text || '').trim();
  const blanksRaw = Array.isArray(clozeObj.blanks) ? clozeObj.blanks : [];
  const blanks = blanksRaw
    .map((b: unknown, i: number) => {
      if (!b || typeof b !== 'object') return null;
      const o = b as Record<string, unknown>;
      const answer = cleanChoice(String(o.answer || '')).toLowerCase();
      let options = (Array.isArray(o.options) ? o.options : [])
        .filter((x): x is string => typeof x === 'string')
        .map((x) => cleanChoice(x).toLowerCase())
        .filter((x) => x && !/^distractor\d*$/i.test(x));
      if (!answer) return null;
      if (options.length < 4) {
        const pool = targets.filter((t) => t !== answer);
        options = [...new Set([answer, ...options, ...pool])].slice(0, 4);
      }
      if (!options.includes(answer)) options = [answer, ...options].slice(0, 4);
      return {
        id: typeof o.id === 'number' ? o.id : i,
        answer,
        options: [...new Set(options)].slice(0, 4),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Fallback cloze from passage
  if (!clozeText || blanks.length < 2) {
    let t = passagePlain;
    const autoBlanks: typeof blanks = [];
    const n = Math.min(usedWords.length, Math.min(8, Math.max(2, Math.round(usedWords.length * 0.5))));
    usedWords.slice(0, n).forEach((w, i) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${esc}(?:s|es|ed|ing|d)?\\b`, 'i');
      if (re.test(t)) {
        t = t.replace(re, `{{${i}}}`);
        autoBlanks.push({
          id: i,
          answer: w,
          options: [w, ...targets.filter((x) => x !== w).slice(0, 3)],
        });
      }
    });
    if (autoBlanks.length >= blanks.length && autoBlanks.length >= 2) {
      clozeText = t;
      blanks.length = 0;
      blanks.push(...autoBlanks);
    }
  }

  // Bonus words
  const bonusWordsRaw = Array.isArray(raw.bonusWords) ? raw.bonusWords : [];
  const bonusWords = bonusWordsRaw
    .filter((b: unknown): b is Record<string, unknown> => !!b && typeof b === 'object')
    .map((b: Record<string, unknown>) => ({
      word: String(b.word || '').trim().toLowerCase(),
      translation: String(b.translation || b.vi || '').trim(),
      pos: b.pos ? String(b.pos).trim() : undefined,
      definition_en: b.definition_en ? String(b.definition_en).trim() : undefined,
    }))
    .filter((b) => b.word && b.translation && b.word.length <= 30)
    .slice(0, 5);

  return {
    title: String(raw.title || 'Daily Reading').trim().slice(0, 120),
    passage,
    passagePlain,
    translation: raw.translation ? String(raw.translation).trim() : undefined,
    level: String(raw.level || 'A2').trim(),
    questions,
    cloze: { text: clozeText || passagePlain, blanks },
    usedWords,
    coverage,
    bonusWords,
  };
}

// ── Gather User Words ──
export async function gatherUserCandidate(
  supabase: SupabaseClient,
  userId: string,
  userInfo?: { email?: string; fullName?: string },
  options?: { sourceDate?: string; exerciseDate?: string },
): Promise<UserCandidate | null> {
  const currentToday = todayVN();
  const sourceDate = options?.sourceDate || getVietnamDate(-1);
  const exerciseDate = options?.exerciseDate || currentToday;

  // 1. Words added by user recently (or in general if active)
  const { data: recentWords } = await supabase
    .from('words')
    .select('id, word, translation, pos, classroom_id')
    .eq('added_by', userId)
    .gte('created_at', `${sourceDate}T00:00:00+07:00`)
    .lte('created_at', `${exerciseDate}T23:59:59+07:00`)
    .order('created_at', { ascending: false });

  const words: WordItem[] = [];
  const seen = new Set<string>();
  let primaryClassroomId: string | undefined;

  for (const w of recentWords || []) {
    const key = (w.word || '').trim().toLowerCase();
    if (!key || key.length > 50 || seen.has(key)) continue;
    const vi = (w.translation || '').trim();
    if (!vi || vi.length < 2) continue;
    seen.add(key);
    words.push({ word: key, translation: vi, pos: w.pos || undefined });
    if (!primaryClassroomId && w.classroom_id) primaryClassroomId = w.classroom_id;
  }

  // 2. Initial level check
  let levelConfig = analyzeVocabularyTier(words);
  let threshold = levelConfig.minThreshold;

  // 3. Supplement with due SRS words if < threshold or < MAX_WORDS
  if (words.length < threshold || words.length < 10) {
    const { data: dueSrs } = await supabase
      .from('srs_progress')
      .select('word_id')
      .eq('user_id', userId)
      .lte('next_review_date', `${exerciseDate}T23:59:59+07:00`)
      .limit(MAX_WORDS_PER_EXERCISE * 2);

    const dueWordIds = (dueSrs || [])
      .map((s) => s.word_id)
      .filter((id): id is string => !!id);

    if (dueWordIds.length > 0) {
      const { data: srsWords } = await supabase
        .from('words')
        .select('id, word, translation, pos, classroom_id')
        .in('id', dueWordIds.slice(0, 50));

      for (const w of srsWords || []) {
        if (words.length >= MAX_WORDS_PER_EXERCISE) break;
        const key = (w.word || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        const vi = (w.translation || '').trim();
        if (!vi || vi.length < 2) continue;
        seen.add(key);
        words.push({ word: key, translation: vi, pos: w.pos || undefined });
        if (!primaryClassroomId && w.classroom_id) primaryClassroomId = w.classroom_id;
      }
    }
  }

  // 4. Also supplement with any words added by user if still below threshold
  if (words.length < threshold) {
    const { data: anyUserWords } = await supabase
      .from('words')
      .select('id, word, translation, pos, classroom_id')
      .eq('added_by', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_WORDS_PER_EXERCISE);

    for (const w of anyUserWords || []) {
      if (words.length >= MAX_WORDS_PER_EXERCISE) break;
      const key = (w.word || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      const vi = (w.translation || '').trim();
      if (!vi || vi.length < 2) continue;
      seen.add(key);
      words.push({ word: key, translation: vi, pos: w.pos || undefined });
      if (!primaryClassroomId && w.classroom_id) primaryClassroomId = w.classroom_id;
    }
  }

  // 5. Also supplement with any active SRS words of this user (e.g. from classroom / flashcards)
  if (words.length < threshold) {
    const { data: recentSrs } = await supabase
      .from('srs_progress')
      .select('word_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(MAX_WORDS_PER_EXERCISE * 2);

    const recentWordIds = (recentSrs || [])
      .map((s) => s.word_id)
      .filter((id): id is string => !!id);

    if (recentWordIds.length > 0) {
      const { data: srsWords } = await supabase
        .from('words')
        .select('id, word, translation, pos, classroom_id')
        .in('id', recentWordIds.slice(0, 50));

      for (const w of srsWords || []) {
        if (words.length >= MAX_WORDS_PER_EXERCISE) break;
        const key = (w.word || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        const vi = (w.translation || '').trim();
        if (!vi || vi.length < 2) continue;
        seen.add(key);
        words.push({ word: key, translation: vi, pos: w.pos || undefined });
        if (!primaryClassroomId && w.classroom_id) primaryClassroomId = w.classroom_id;
      }
    }
  }

  // Resolve primary classroom
  if (!primaryClassroomId) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('classroom_id')
      .eq('student_id', userId)
      .limit(1)
      .maybeSingle();
    if (enrollment?.classroom_id) {
      primaryClassroomId = enrollment.classroom_id;
    }
  }

  const candidateWords = words.slice(0, MAX_WORDS_PER_EXERCISE);
  levelConfig = analyzeVocabularyTier(candidateWords);
  threshold = levelConfig.minThreshold;

  // Gate check: need at least threshold words (3 for B2-C1, 5 for A1-B1)
  if (candidateWords.length < threshold) {
    return null;
  }

  return {
    userId,
    email: userInfo?.email || '',
    fullName: userInfo?.fullName || userInfo?.email?.split('@')[0] || 'Learner',
    primaryClassroomId,
    words: candidateWords,
    levelConfig,
  };
}

// ── Check if user has an uncompleted exercise ──
export async function findUserUncompletedExercise(
  supabase: SupabaseClient,
  userId: string,
  limitDays = 14,
): Promise<{ id: string; exercise_date: string; title: string; exercise: Record<string, unknown> } | null> {
  try {
    const cutoffDate = getVietnamDate(-limitDays);
    const { data: exercises, error } = await supabase
      .from('daily_reading_exercises')
      .select('*')
      .eq('target_user_id', userId)
      .eq('status', 'ready')
      .gte('exercise_date', cutoffDate)
      .order('exercise_date', { ascending: false })
      .limit(10);

    if (error || !exercises || exercises.length === 0) return null;

    const exIds = exercises.map((e) => e.id);
    const { data: completions } = await supabase
      .from('daily_reading_completions')
      .select('exercise_id, completed_at')
      .eq('user_id', userId)
      .in('exercise_id', exIds);

    const completedIds = new Set(
      (completions || [])
        .filter((c) => Boolean(c.completed_at))
        .map((c) => c.exercise_id),
    );

    for (const ex of exercises) {
      if (!completedIds.has(ex.id)) {
        return {
          id: ex.id,
          exercise_date: ex.exercise_date,
          title: ex.title,
          exercise: ex,
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('[findUserUncompletedExercise] Error:', err);
    return null;
  }
}

// ── Generate Exercise with Gemini Multi-Key Engine ──
export async function generateExerciseWithGemini(
  prompt: string,
  targets: string[],
  levelConfig: AdaptiveLevelConfig,
  maxAttempts = 2,
): Promise<GeneratedExercise | null> {
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const rawOutput = await geminiGenerate(currentPrompt, {
        json: true,
        temperature: 0.35,
      });

      let parsed = parseJsonLoose(rawOutput) as Record<string, unknown>;
      if (typeof parsed.answer === 'string') {
        parsed = parseJsonLoose(parsed.answer) as Record<string, unknown>;
      }

      const result = normalizeDailyReadingResponse(parsed, targets);
      if (!result.level) result.level = levelConfig.cefr;

      // Quality Gate: Anti-Repetition Check
      const repCheck = checkPassageRepetition(result.passage, targets);
      if (!repCheck.passed) {
        console.warn(`[generator] Anti-Repetition Check REJECTED attempt ${attempt}: ${repCheck.reason}`);
        if (attempt < maxAttempts) {
          currentPrompt = `${prompt}\n\nCRITICAL RE-GENERATION NOTICE: Your previous passage was REJECTED by the Quality Gate because it contained repetitive sentence frames (${repCheck.reason}). Rewrite the passage completely. Every single sentence must have diverse, unique grammar with zero formulaic repetition!`;
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        return null;
      }

      if (result.coverage >= 0.70 && result.questions.length >= 3) {
        return result;
      }

      console.warn(`[generator] Low coverage (${(result.coverage * 100).toFixed(0)}%) or few questions (${result.questions.length}) on attempt ${attempt}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[generator] Attempt ${attempt} failed:`, msg);

      if (/cooldown|rate.?limit|429/i.test(msg)) {
        const waited = await waitOutGeminiCooldown(65_000);
        if (waited) {
          console.log(`[generator] Gemini key cooldown expired. Retrying generation...`);
          continue;
        }
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  return null;
}

// ── Generate from Starter Pack ──
export async function generateStarterReadingExercise(
  packId: string,
  userDisplayName: string,
): Promise<{ exercise: GeneratedExercise; candidate: UserCandidate } | null> {
  const pack = DEMO_PACKS.find((p) => p.id === packId) || DEMO_PACKS[0];
  if (!pack) return null;

  const words: WordItem[] = pack.words.map((w) => ({
    word: w.word.trim().toLowerCase(),
    translation: w.translation || '',
    pos: w.pos,
  }));

  const levelConfig = analyzeVocabularyTier(words);
  const candidate: UserCandidate = {
    userId: '',
    email: '',
    fullName: userDisplayName,
    words,
    levelConfig,
  };

  const prompt = buildDailyReadingPrompt(words, levelConfig, userDisplayName);
  const targets = words.map((w) => w.word);
  const exercise = await generateExerciseWithGemini(prompt, targets, levelConfig, 2);

  if (!exercise) return null;
  return { exercise, candidate };
}

// ── Save Exercise to Supabase ──
export async function saveDailyReadingExercise(
  supabase: SupabaseClient,
  userId: string,
  exerciseDate: string,
  sourceDate: string,
  exercise: GeneratedExercise,
  candidateWords: WordItem[],
  classroomId?: string,
  meta?: Record<string, unknown>,
): Promise<string | null> {
  // Check if row already exists for target_user_id and exercise_date
  let existingId: string | undefined;
  try {
    const { data } = await supabase
      .from('daily_reading_exercises')
      .select('id')
      .eq('target_user_id', userId)
      .eq('exercise_date', exerciseDate)
      .limit(1);
    if (data && data.length > 0) {
      existingId = data[0].id;
    }
  } catch {}

  const rowData: Record<string, unknown> = {
    classroom_id: classroomId || null,
    target_user_id: userId,
    exercise_date: exerciseDate,
    source_date: sourceDate,
    title: exercise.title,
    passage: exercise.passage,
    passage_plain: exercise.passagePlain,
    level: exercise.level,
    questions: exercise.questions,
    cloze: exercise.cloze,
    source_words: candidateWords,
    used_words: exercise.usedWords,
    coverage: exercise.coverage,
    bonus_words: exercise.bonusWords,
    status: 'ready',
    error_message: null,
    generated_at: new Date().toISOString(),
    generation_meta: {
      ...meta,
      ...(exercise.translation ? { translation: exercise.translation } : {}),
    },
  };

  if (existingId) {
    const { error } = await supabase
      .from('daily_reading_exercises')
      .update(rowData)
      .eq('id', existingId);
    if (error) {
      console.error('[saveDailyReadingExercise] Update failed:', error.message);
      return null;
    }
    return existingId;
  } else {
    const { data: inserted, error } = await supabase
      .from('daily_reading_exercises')
      .insert(rowData)
      .select('id')
      .single();
    if (error) {
      console.error('[saveDailyReadingExercise] Insert failed:', error.message);
      return null;
    }
    return inserted?.id || null;
  }
}

export function formatExerciseForClient(
  e: Record<string, unknown>,
  authUserId: string,
  classroomName = 'Kho từ cá nhân',
  completion: {
    mcqScore: number;
    mcqTotal: number;
    clozeScore: number;
    clozeTotal: number;
    completedAt: string;
  } | null = null,
) {
  const isPersonal = e.target_user_id === authUserId;
  const meta =
    e.generation_meta && typeof e.generation_meta === 'object'
      ? (e.generation_meta as Record<string, unknown>)
      : {};
  const translation =
    (e.translation as string) ||
    (typeof meta.translation === 'string' ? meta.translation : undefined);

  return {
    id: e.id as string,
    classroomId: (e.classroom_id as string) || null,
    classroomName,
    isPersonal,
    exerciseDate: e.exercise_date as string,
    sourceDate: e.source_date as string,
    title: e.title as string,
    passage: e.passage as string,
    passagePlain: (e.passage_plain as string) || stripBold(String(e.passage || '')),
    translation,
    level: (e.level as string) || 'A2',
    questions: Array.isArray(e.questions)
      ? (e.questions as GeneratedExercise['questions'])
      : [],
    cloze:
      e.cloze && typeof e.cloze === 'object'
        ? (e.cloze as GeneratedExercise['cloze'])
        : { text: '', blanks: [] },
    sourceWords: Array.isArray(e.source_words) ? (e.source_words as WordItem[]) : [],
    usedWords: Array.isArray(e.used_words) ? (e.used_words as string[]) : [],
    coverage: typeof e.coverage === 'number' ? e.coverage : 0,
    bonusWords: Array.isArray(e.bonus_words) ? (e.bonus_words as WordItem[]) : [],
    generatedAt: (e.generated_at as string) || new Date().toISOString(),
    completion,
  };
}
