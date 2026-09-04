/**
 * Nightly NLM-generated reading exercises personalized per user.
 *
 * For each active user (added words today or has SRS reviews due):
 *   1. Gather user's words (words.added_by = user_id)
 *   2. Supplement with due SRS words if < threshold (3 for B2-C1, 5 for A1-B1)
 *   3. Automatically adapt CEFR level (A1-A2, B1-B2, C1-C2)
 *   4. Ask NLM to generate personalized reading passage + MCQ + cloze + bonus vocab
 *   5. Save result into daily_reading_exercises (exercise_date = tomorrow, target_user_id = user_id)
 *   6. Send push notification to user
 *
 * Usage:
 *   npx tsx scripts/generate-daily-reading-nlm.ts
 *   npx tsx scripts/generate-daily-reading-nlm.ts --dry
 *   npx tsx scripts/generate-daily-reading-nlm.ts --user=taphong2002@gmail.com
 *   npx tsx scripts/generate-daily-reading-nlm.ts --user=<uuid>
 *   npx tsx scripts/generate-daily-reading-nlm.ts --profile=burn-minh --delay=12000
 *
 * Env:
 *   NLM_NOTEBOOK_ID or scripts/.nlm-notebook-id
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  analyzeVocabularyTier,
  checkPassageRepetition,
  type AdaptiveLevelConfig,
} from '../src/lib/daily-reading-level';
import { geminiGenerate, hasGeminiKeys } from '../src/lib/gemini-multi';

const execFileAsync = promisify(execFile);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ── CLI args ──
function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const DRY = process.argv.includes('--dry');
const MOCK = process.argv.includes('--mock');
const FORCE = process.argv.includes('--force') || process.argv.includes('--refresh');
const USER_FILTER = getArg('user');
const CLASSROOM_FILTER = getArg('classroom');
const NLM_PROFILE = getArg('profile') || process.env.NLM_PROFILE || 'burn-minh';
const DELAY_MS = parseInt(getArg('delay') || '12000', 10);
const MAX_WORDS = 20;
const SKIP_PUSH = process.argv.includes('--no-push');
const DATE_ARG = getArg('date') || getArg('exercise-date');
const SOURCE_DATE_ARG = getArg('source-date');

// ── NLM binary ──
const NLM_PATH =
  process.env.NLM_PATH ||
  path.join(process.env.USERPROFILE || '', '.local', 'bin', 'nlm.exe');

const NOTEBOOK_ID_FILE = path.resolve(__dirname, '.nlm-notebook-id');

// ── Supabase ──
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Date helpers (timezone-safe Asia/Ho_Chi_Minh) ──
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

export function getVietnamHour(): number {
  const hrStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: 'numeric',
    hour12: false,
  }).format(new Date());
  return parseInt(hrStr, 10);
}

export function todayVN(): string {
  return getVietnamDate(0);
}

export function tomorrowVN(): string {
  return getVietnamDate(1);
}

/**
 * Resolves exerciseDate and sourceDate according to execution context:
 * - If --date or --exercise-date is provided: respects it directly.
 * - At 2:00 AM (local VN hour < 5): exercise is for TODAY (ready when students wake up),
 *   source words from YESTERDAY.
 * - Daytime/evening (hour >= 5): exercise is pre-generated for TOMORROW,
 *   source words from TODAY.
 */
export function resolveExerciseDates(): { exerciseDate: string; sourceDate: string } {
  if (DATE_ARG) {
    const exDate = DATE_ARG;
    const [y, m, d] = exDate.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
    return { exerciseDate: exDate, sourceDate: SOURCE_DATE_ARG || prev };
  }

  const vnHour = getVietnamHour();
  if (vnHour < 5) {
    return {
      exerciseDate: getVietnamDate(0),
      sourceDate: SOURCE_DATE_ARG || getVietnamDate(-1),
    };
  }

  return {
    exerciseDate: getVietnamDate(1),
    sourceDate: SOURCE_DATE_ARG || getVietnamDate(0),
  };
}

// ── NLM CLI wrapper ──
function withProfile(args: string[]): string[] {
  if (args.includes('-p') || args.includes('--profile')) return args;
  // If calling 'notebook query', place -p before notebookId and question so CLI parser parses correctly
  if (args[0] === 'notebook' && args[1] === 'query') {
    return ['notebook', 'query', '-p', NLM_PROFILE, ...args.slice(2)];
  }
  return [...args, '-p', NLM_PROFILE];
}

export let nlmKnownUnavailableReason: string | null = null;

export function setNlmKnownUnavailableReason(reason: string | null): void {
  nlmKnownUnavailableReason = reason;
}

export function isNlmAuthOrNetworkError(text: string): boolean {
  return /authentication may have expired|cookies have expired|code 16|authentication expired|authentication error|clientauthenticationerror|run ['"]?nlm login['"]?|http 40[13]|fetch failed|econnrefused|econnreset|etimedout|enotfound|timed? ?out|nlm_auth_expired/i.test(
    text,
  );
}

async function nlm(args: string[], timeoutMs = 300_000): Promise<string> {
  const finalArgs = withProfile(args);
  try {
    const { stdout, stderr } = await execFileAsync(NLM_PATH, finalArgs, {
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
      encoding: 'utf8',
      env: { ...process.env, NLM_PROFILE, NOTEBOOKLM_PROFILE: NLM_PROFILE },
    });
    const out = `${stdout || ''}\n${stderr || ''}`.trim();
    if (isNlmAuthOrNetworkError(out)) {
      nlmKnownUnavailableReason = `NLM auth error: ${out.slice(0, 100)}`;
      throw new Error(`NLM_AUTH_EXPIRED: ${out.slice(0, 160)}`);
    }
    return out;
  } catch (err: unknown) {
    const execErr = err as { message?: string; stdout?: string; stderr?: string };
    const combinedOutput = [execErr.message, execErr.stdout, execErr.stderr]
      .filter(Boolean)
      .join('\n');
    if (isNlmAuthOrNetworkError(combinedOutput)) {
      const summary = (execErr.stdout || execErr.stderr || execErr.message || 'NLM auth expired').trim().slice(0, 120);
      nlmKnownUnavailableReason = `NLM auth error: ${summary}`;
      throw new Error(`NLM_AUTH_EXPIRED: ${summary}`);
    }
    throw err instanceof Error ? err : new Error(combinedOutput || String(err));
  }
}

function getNotebookId(): string {
  if (process.env.NLM_NOTEBOOK_ID) return process.env.NLM_NOTEBOOK_ID.trim();
  if (fs.existsSync(NOTEBOOK_ID_FILE)) return fs.readFileSync(NOTEBOOK_ID_FILE, 'utf8').trim();
  return '';
}

// ── JSON parsing ──
function parseJsonLoose(raw: string): unknown {
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

// ── Types ──
export interface WordItem {
  word: string;
  translation: string;
  pos?: string;
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

// ── Strip markdown bold ──
function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1');
}

// ── Clean option text ──
function cleanChoice(s: string): string {
  return s
    .replace(/^\s*[A-Da-d][).:]\s*/u, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Find used words with inflection tolerance ──
export function findUsedWords(passage: string, targets: string[]): { used: string[]; missing: string[] } {
  const lower = passage.toLowerCase();
  const used: string[] = [];
  const missing: string[] = [];

  // Extract bold words from passage if present (e.g. **word**)
  const boldMatches = new Set<string>();
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let bm: RegExpExecArray | null;
  while ((bm = boldRegex.exec(passage)) !== null) {
    boldMatches.add(bm[1].toLowerCase().trim());
  }

  for (const w of targets) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let matched = false;

    // 1. Direct match (phrase or word)
    if (w.includes(' ') || w.includes('-')) {
      matched = new RegExp(esc, 'i').test(lower);
    } else {
      // Inflection-tolerant match:
      // handles plurals (-s, -es, -ies), past (-ed, -d), gerund (-ing)
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

    // 2. Bold tags check fallback
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

// ── Gather words for one user (R1: added_by = user_id + SRS due fallback) ──
export async function gatherUserWords(
  user: {
    id: string;
    email: string;
    full_name?: string;
  },
  dates?: { sourceDate: string; exerciseDate: string },
): Promise<UserCandidate | null> {
  const { sourceDate, exerciseDate } = dates || resolveExerciseDates();
  const userId = user.id;

  // 1. Words added in target cycle (from sourceDate 00:00 through exerciseDate 23:59)
  const { data: todayWords } = await supabase
    .from('words')
    .select('id, word, translation, pos, classroom_id')
    .eq('added_by', userId)
    .gte('created_at', `${sourceDate}T00:00:00+07:00`)
    .lte('created_at', `${exerciseDate}T23:59:59+07:00`)
    .order('created_at', { ascending: false });

  const words: WordItem[] = [];
  const seen = new Set<string>();
  let primaryClassroomId: string | undefined;

  for (const w of todayWords || []) {
    const key = (w.word || '').trim().toLowerCase();
    if (!key || key.length > 50 || seen.has(key)) continue;
    const vi = (w.translation || '').trim();
    if (!vi || vi.length < 2) continue;
    seen.add(key);
    words.push({ word: key, translation: vi, pos: w.pos || undefined });
    if (!primaryClassroomId && w.classroom_id) primaryClassroomId = w.classroom_id;
  }

  const todayNewCount = words.length;

  // 2. Initial level check to know minimum threshold
  let levelConfig = analyzeVocabularyTier(words);
  let threshold = levelConfig.minThreshold;

  // 3. If below threshold, supplement with words due for SRS review of this user
  if (words.length < threshold) {
    const { data: dueSrs } = await supabase
      .from('srs_progress')
      .select('word_id')
      .eq('user_id', userId)
      .lte('next_review_date', `${exerciseDate}T23:59:59+07:00`)
      .limit(MAX_WORDS * 2);

    const dueWordIds = (dueSrs || [])
      .map((s) => s.word_id)
      .filter((id): id is string => !!id);

    if (dueWordIds.length > 0) {
      const { data: srsWords } = await supabase
        .from('words')
        .select('id, word, translation, pos, classroom_id')
        .in('id', dueWordIds.slice(0, 50));

      for (const w of srsWords || []) {
        if (words.length >= MAX_WORDS) break;
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

  // 4. Resolve primary classroom: prioritize enrolled classroom so teachers can see progress
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

  // Fallback to owned classroom if user is a teacher
  if (!primaryClassroomId) {
    const { data: ownedCls } = await supabase
      .from('classrooms')
      .select('id')
      .eq('teacher_id', userId)
      .limit(1)
      .maybeSingle();
    if (ownedCls?.id) {
      primaryClassroomId = ownedCls.id;
    }
  }

  // 5. Re-evaluate adaptive level on the complete candidate word set
  const candidateWords = words.slice(0, MAX_WORDS);
  levelConfig = analyzeVocabularyTier(candidateWords);
  threshold = levelConfig.minThreshold;

  // Requirement R1 Gate check:
  // "Nếu user không có từ mới và kho từ < 3 từ, bỏ qua không sinh bài rỗng để tiết kiệm tài nguyên."
  if (todayNewCount === 0 && candidateWords.length < 3) {
    console.log(`  [${user.email || userId}] 0 new words & word pool < 3 — skip (save resources)`);
    return null;
  }

  // Threshold check: 3 for B2-C1, 5 for A1-B1
  if (candidateWords.length < threshold) {
    console.log(
      `  [${user.email || userId}] only ${candidateWords.length} words (need >= ${threshold} for ${levelConfig.cefr}) — skip`,
    );
    return null;
  }

  return {
    userId,
    email: user.email || '',
    fullName: user.full_name || user.email?.split('@')[0] || 'Learner',
    primaryClassroomId,
    words: candidateWords,
    levelConfig,
  };
}

// ── Check if exercise already exists and passes Quality Gate for exerciseDate ──
async function exerciseExists(userId: string, exerciseDate: string): Promise<boolean> {
  if (FORCE) return false;
  try {
    const { data } = await supabase
      .from('daily_reading_exercises')
      .select('id, passage')
      .eq('exercise_date', exerciseDate)
      .eq('target_user_id', userId)
      .eq('status', 'ready')
      .limit(1);
    if (!data || data.length === 0) return false;
    const passage = data[0].passage || '';
    const quality = checkPassageRepetition(passage);
    if (!quality.passed) {
      console.log(`   [quality-gate] Existing exercise for ${exerciseDate} failed Quality Gate (${quality.reason}) — will re-generate.`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ── Build Adaptive NLM prompt (R2) ──
export function buildPrompt(
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

// ── Normalize NLM response ──
export function normalizeResponse(raw: Record<string, unknown>, targets: string[]): GeneratedExercise {
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

export interface GenerationResult {
  exercise: GeneratedExercise;
  engine: 'nlm' | 'gemini_fallback';
  fallbackReason?: string;
}

// ── Gemini fallback generator ──
export async function generateWithGeminiFallback(
  basePrompt: string,
  candidate: UserCandidate,
): Promise<GeneratedExercise | null> {
  const targets = candidate.words.map((w) => w.word);
  const maxAttempts = 2;
  let currentPrompt = basePrompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `  [gemini-fallback] Attempt ${attempt}/${maxAttempts} for "${candidate.fullName}" (${candidate.words.length} words, tier ${candidate.levelConfig.cefr})...`,
      );
      const rawOutput = await geminiGenerate(currentPrompt, {
        json: true,
        temperature: 0.35,
      });

      let parsed = parseJsonLoose(rawOutput) as Record<string, unknown>;
      if (typeof parsed.answer === 'string') {
        parsed = parseJsonLoose(parsed.answer) as Record<string, unknown>;
      }

      const result = normalizeResponse(parsed, targets);
      if (!result.level) result.level = candidate.levelConfig.cefr;

      // Quality Gate: Anti-Repetition Check
      const repCheck = checkPassageRepetition(result.passage, targets);
      if (!repCheck.passed) {
        console.warn(
          `  [quality-gate] Gemini attempt ${attempt} REJECTED: ${repCheck.reason}`,
        );
        if (attempt < maxAttempts) {
          currentPrompt = `${basePrompt}\n\nCRITICAL RE-GENERATION NOTICE: Your previous passage was REJECTED by the Quality Gate because it contained repetitive sentence frames (${repCheck.reason}). Rewrite the passage completely. Every single sentence must have diverse, unique grammar with zero formulaic repetition!`;
          await sleep(2000);
          continue;
        }
        return null;
      }

      console.log(`  [quality-gate] ✓ Anti-Repetition Check passed for Gemini output!`);

      if (result.coverage >= 0.70 && result.questions.length >= 3) {
        return result;
      }

      console.log(
        `  [gemini-fallback] coverage=${(result.coverage * 100).toFixed(0)}% questions=${result.questions.length} — retry`,
      );
    } catch (err) {
      console.error(
        `  [gemini-fallback] Attempt ${attempt} failed:`,
        err instanceof Error ? err.message : err,
      );
    }

    if (attempt < maxAttempts) await sleep(2000);
  }

  return null;
}

// ── Generate exercise for one user ──
export async function generateForUser(
  notebookId: string,
  candidate: UserCandidate,
): Promise<GenerationResult | null> {
  const prompt = buildPrompt(candidate.words, candidate.levelConfig, candidate.fullName);
  const targets = candidate.words.map((w) => w.word);

  const forceGemini =
    process.argv.includes('--gemini') || process.argv.includes('--gemini-only');

  // 1. Direct Gemini if requested, NLM binary/notebook not available, or NLM known unavailable in this run
  if (forceGemini || !fs.existsSync(NLM_PATH) || !notebookId || nlmKnownUnavailableReason) {
    if (nlmKnownUnavailableReason) {
      console.log(`  [generator] NLM previously unavailable (${nlmKnownUnavailableReason}). Using Gemini Multi-Key directly...`);
    } else {
      console.log(`  [generator] Directly utilizing Gemini Multi-Key engine...`);
    }
    const geminiEx = await generateWithGeminiFallback(prompt, candidate);
    return geminiEx
      ? {
          exercise: geminiEx,
          engine: 'gemini_fallback',
          fallbackReason: nlmKnownUnavailableReason || 'NLM unavailable or forced Gemini',
        }
      : null;
  }

  // 2. Primary engine: NotebookLM CLI
  const maxAttempts = 2;
  let best: GeneratedExercise | null = null;
  let failureReason = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `  [nlm] attempt ${attempt}/${maxAttempts} for "${candidate.fullName}" (${candidate.words.length} words, tier ${candidate.levelConfig.cefr})`,
      );
      const rawOutput = await nlm(['notebook', 'query', notebookId, prompt], 300_000);
      console.log(`  [nlm] raw head: ${rawOutput.slice(0, 150).replace(/\s+/g, ' ')}`);

      let parsed = parseJsonLoose(rawOutput) as Record<string, unknown>;
      if (typeof parsed.answer === 'string') {
        parsed = parseJsonLoose(parsed.answer) as Record<string, unknown>;
      }
      const result = normalizeResponse(parsed, targets);
      if (!result.level) result.level = candidate.levelConfig.cefr;

      // Quality Gate: Anti-Repetition Check
      const repCheck = checkPassageRepetition(result.passage, targets);
      if (!repCheck.passed) {
        console.warn(`  [quality-gate] NLM passage REJECTED: ${repCheck.reason}`);
        failureReason = repCheck.reason || 'NLM generated repetitive templates';
        break; // Switch to Gemini fallback immediately
      }

      if (!best || result.coverage > best.coverage) {
        best = result;
      }

      if (result.coverage >= 0.75 && result.questions.length >= 3) {
        return { exercise: result, engine: 'nlm' };
      }

      console.log(
        `  [nlm] coverage=${(result.coverage * 100).toFixed(0)}% questions=${result.questions.length} — retry`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  [nlm] attempt ${attempt} failed:`, msg);
      failureReason = msg;
      if (isNlmAuthOrNetworkError(msg)) {
        console.warn(
          `  [nlm] Auth or network error detected (${msg.slice(0, 100)}). Activating automatic Gemini fallback...`,
        );
        break;
      }
    }

    if (attempt < maxAttempts) await sleep(DELAY_MS);
  }

  // If NLM had a valid passage that passed Quality Gate
  if (best && best.coverage >= 0.75 && best.questions.length >= 3) {
    const repCheck = checkPassageRepetition(best.passage, targets);
    if (repCheck.passed) {
      return { exercise: best, engine: 'nlm' };
    }
  }

  // 3. Fallback to Gemini Multi-Key Engine
  console.log(
    `  [fallback] NLM failed or unviable (${failureReason || 'low coverage'}). Falling back to Gemini Multi-Key...`,
  );
  const fallbackEx = await generateWithGeminiFallback(prompt, candidate);
  if (fallbackEx) {
    return {
      exercise: fallbackEx,
      engine: 'gemini_fallback',
      fallbackReason: failureReason || 'NLM unviable',
    };
  }

  return null;
}

// ── Save exercise to DB (R3: target_user_id = user_id) ──
async function saveExercise(
  candidate: UserCandidate,
  sourceDate: string,
  exerciseDate: string,
  exercise: GeneratedExercise,
  meta: Record<string, unknown>,
): Promise<boolean> {
  if (DRY) {
    console.log(
      `  [dry] Would save for user ${candidate.email}: "${exercise.title}" level=${exercise.level} coverage=${(exercise.coverage * 100).toFixed(0)}%`,
    );
    return true;
  }

  // Find existing row ID if already present for this user & date
  let existingId: string | undefined;
  try {
    const { data: existing } = await supabase
      .from('daily_reading_exercises')
      .select('id')
      .eq('target_user_id', candidate.userId)
      .eq('exercise_date', exerciseDate)
      .limit(1);
    if (existing && existing.length > 0) {
      existingId = existing[0].id;
    }
  } catch {}

  const rowData: Record<string, unknown> = {
    classroom_id: candidate.primaryClassroomId || null,
    target_user_id: candidate.userId,
    exercise_date: exerciseDate,
    source_date: sourceDate,
    title: exercise.title,
    passage: exercise.passage,
    passage_plain: exercise.passagePlain,
    level: exercise.level || candidate.levelConfig.cefr,
    questions: exercise.questions,
    cloze: exercise.cloze,
    source_words: candidate.words,
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

  let error;
  if (existingId) {
    const res = await supabase.from('daily_reading_exercises').update(rowData).eq('id', existingId);
    error = res.error;
  } else {
    const res = await supabase.from('daily_reading_exercises').insert(rowData);
    error = res.error;
  }

  if (error) {
    console.error(`  [db] Save failed for user ${candidate.email}:`, error.message);
    return false;
  }

  return true;
}

// ── Push notification to user ──
async function notifyUser(userId: string, title: string): Promise<boolean> {
  if (SKIP_PUSH || DRY) return false;

  try {
    const { sendPushNotificationToUser } = await import('../src/lib/notifications');
    const result = await sendPushNotificationToUser(
      userId,
      '📖 Bài luyện đọc mới!',
      `"${title}" — Đọc và làm bài cá nhân hóa ngay khi thức dậy nhé!`,
      '/practice/daily-reading',
    );
    return !!(result as { messageId?: string })?.messageId;
  } catch {
    return false;
  }
}

// ── Active Users Queue ──
async function getActiveUsersQueue(
  sourceDate: string,
  exerciseDate: string,
): Promise<Array<{ id: string; email: string; full_name?: string }>> {
  if (USER_FILTER) {
    let q = supabase.from('profiles').select('id, email, full_name');
    if (USER_FILTER.includes('@')) {
      q = q.eq('email', USER_FILTER);
    } else {
      q = q.eq('id', USER_FILTER);
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) {
      console.error(`User not found for filter: ${USER_FILTER}`);
      return [];
    }
    return [data];
  }

  // 1. Users who added words in current cycle (from sourceDate 00:00 through exerciseDate 23:59)
  const { data: wordUsers } = await supabase
    .from('words')
    .select('added_by')
    .gte('created_at', `${sourceDate}T00:00:00+07:00`)
    .lte('created_at', `${exerciseDate}T23:59:59+07:00`)
    .not('added_by', 'is', null);

  // 2. Users who have due SRS reviews
  const { data: srsUsers } = await supabase
    .from('srs_progress')
    .select('user_id')
    .lte('next_review_date', `${exerciseDate}T23:59:59+07:00`);

  const userIds = new Set<string>();
  for (const w of wordUsers || []) if (w.added_by) userIds.add(w.added_by);
  for (const s of srsUsers || []) if (s.user_id) userIds.add(s.user_id);

  if (userIds.size === 0) return [];

  // Batch query profiles to avoid URI length overflow in postgREST
  const idList = Array.from(userIds);
  const profiles: Array<{ id: string; email: string; full_name?: string }> = [];
  const chunkSize = 50;
  for (let i = 0; i < idList.length; i += chunkSize) {
    const chunk = idList.slice(i, i + chunkSize);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', chunk);
    if (data) profiles.push(...data);
  }

  return profiles;
}

// ── Main ──
async function main() {
  console.log('=== Personalized Daily Reading Exercise Generator (NLM) ===');
  console.log(`profile=${NLM_PROFILE} dry=${DRY} delay=${DELAY_MS}ms`);

  const { exerciseDate, sourceDate } = resolveExerciseDates();
  console.log(`source_date=${sourceDate} exercise_date=${exerciseDate}`);

  const hasNlm = fs.existsSync(NLM_PATH);
  if (!hasNlm) {
    console.warn(`[NLM] nlm.exe not found at ${NLM_PATH}. Proceeding with Gemini Multi-Key fallback.`);
  }

  const notebookId = getNotebookId();
  if (notebookId) {
    console.log('notebook:', notebookId);
  }

  // Active Users Queue
  const activeUsers = await getActiveUsersQueue(sourceDate, exerciseDate);
  console.log(`\nActive users queue: ${activeUsers.length} user(s)`);

  if (activeUsers.length === 0) {
    console.log('No active users with new words or due reviews in this window — nothing to generate.');
    return;
  }

  let totalOk = 0;
  let totalFail = 0;
  let totalPush = 0;

  for (let i = 0; i < activeUsers.length; i++) {
    const user = activeUsers[i];
    console.log(`\n[${i + 1}/${activeUsers.length}] Processing user: ${user.email} (${user.id})`);

    const candidate = await gatherUserWords(user, { sourceDate, exerciseDate });
    if (!candidate) continue;

    console.log(
      `   Words (${candidate.words.length}): ${candidate.words.map((w) => w.word).join(', ')}`,
    );
    console.log(
      `   Adaptive Level: ${candidate.levelConfig.labelEn} (${candidate.levelConfig.cefr}) [Target: ${candidate.levelConfig.minWords}-${candidate.levelConfig.maxWords} words]`,
    );

    // Check if already generated for exerciseDate
    if (!DRY && (await exerciseExists(candidate.userId, exerciseDate))) {
      console.log(`   Already has valid exercise for ${exerciseDate} — skip`);
      continue;
    }

    const startMs = Date.now();

    try {
      const genResult = await generateForUser(notebookId, candidate);

      if (!genResult || !genResult.exercise) {
        console.error('   Failed to generate exercise');
        totalFail++;
        continue;
      }

      const { exercise, engine, fallbackReason } = genResult;
      const durationMs = Date.now() - startMs;
      const meta: Record<string, unknown> = {
        engine,
        nlm_profile: NLM_PROFILE,
        notebook_id: notebookId || null,
        duration_ms: durationMs,
        word_count: candidate.words.length,
        adaptive_level: candidate.levelConfig.cefr,
        quality_gate: 'passed',
      };
      if (fallbackReason) {
        meta.fallback_reason = fallbackReason;
      }

      const saved = await saveExercise(candidate, sourceDate, exerciseDate, exercise, meta);

      if (saved) {
        totalOk++;
        console.log(
          `   ✓ [${engine}] "${exercise.title}" · Level ${exercise.level} · coverage=${(exercise.coverage * 100).toFixed(0)}% · ${exercise.questions.length} MCQs · ${exercise.cloze.blanks.length} cloze · ${exercise.bonusWords.length} bonus · ${(durationMs / 1000).toFixed(1)}s`,
        );

        // Push notification
        const notified = await notifyUser(candidate.userId, exercise.title);
        if (notified) {
          totalPush++;
          console.log(`   📱 Notified user ${candidate.email}`);
        }
      } else {
        totalFail++;
      }
    } catch (e) {
      console.error(`   User generation error:`, e instanceof Error ? e.message : e);
      try {
        console.log(`   Attempting emergency Gemini fallback for ${candidate.email}...`);
        const fallbackPrompt = buildPrompt(candidate.words, candidate.levelConfig, candidate.fullName);
        const fallbackEx = await generateWithGeminiFallback(fallbackPrompt, candidate);
        if (fallbackEx) {
          const durationMs = Date.now() - startMs;
          const meta = {
            engine: 'gemini_fallback',
            nlm_profile: NLM_PROFILE,
            duration_ms: durationMs,
            word_count: candidate.words.length,
            adaptive_level: candidate.levelConfig.cefr,
            fallback_reason: e instanceof Error ? e.message : String(e),
            quality_gate: 'passed',
          };
          const saved = await saveExercise(candidate, sourceDate, exerciseDate, fallbackEx, meta);
          if (saved) {
            totalOk++;
            console.log(`   ✓ Recovered with Gemini fallback for ${candidate.email}!`);
            await notifyUser(candidate.userId, fallbackEx.title);
            continue;
          }
        }
      } catch (gemErr) {
        console.error(`   Emergency Gemini fallback failed:`, gemErr instanceof Error ? gemErr.message : gemErr);
      }
      totalFail++;
    }

    // Delay between users
    if (i < activeUsers.length - 1) {
      console.log(`   Waiting ${DELAY_MS}ms before next user...`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`ok=${totalOk} fail=${totalFail} push=${totalPush}`);
}

// Run if directly executed
if (require.main === module || process.argv[1]?.endsWith('generate-daily-reading-nlm.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
