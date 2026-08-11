/**
 * Nightly NLM-generated reading exercises from daily vocabulary.
 *
 * For each classroom that had new words today:
 *   1. Gather today's words (+ due words if < MIN_WORDS)
 *   2. Ask NLM to generate a reading passage + MCQ + cloze + bonus vocab
 *   3. Upsert result into daily_reading_exercises (exercise_date = tomorrow)
 *   4. Send push notification to enrolled students
 *
 * Usage:
 *   npx tsx scripts/generate-daily-reading-nlm.ts
 *   npx tsx scripts/generate-daily-reading-nlm.ts --dry
 *   npx tsx scripts/generate-daily-reading-nlm.ts --classroom=<uuid>
 *   npx tsx scripts/generate-daily-reading-nlm.ts --profile=burn-minh
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

const execFileAsync = promisify(execFile);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ── CLI args ──
function getArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p ? p.split('=').slice(1).join('=') : undefined;
}

const DRY = process.argv.includes('--dry');
const CLASSROOM_FILTER = getArg('classroom');
const NLM_PROFILE = getArg('profile') || process.env.NLM_PROFILE || 'burn-minh';
const DELAY_MS = parseInt(getArg('delay') || '12000', 10);
const MIN_WORDS = 5;
const MAX_WORDS = 20;
const SKIP_PUSH = process.argv.includes('--no-push');

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

// ── Date helpers ──
function todayVN(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
  )
    .toISOString()
    .slice(0, 10);
}

function tomorrowVN(): string {
  const d = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
  );
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── NLM CLI wrapper (reuse from backfill-core-senses-nlm.ts) ──
function withProfile(args: string[]): string[] {
  if (args.includes('-p') || args.includes('--profile')) return args;
  return [...args, '-p', NLM_PROFILE];
}

async function nlm(args: string[], timeoutMs = 300_000): Promise<string> {
  const finalArgs = withProfile(args);
  const { stdout, stderr } = await execFileAsync(NLM_PATH, finalArgs, {
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
    encoding: 'utf8',
    env: { ...process.env, NLM_PROFILE, NOTEBOOKLM_PROFILE: NLM_PROFILE },
  });
  const out = `${stdout || ''}\n${stderr || ''}`.trim();
  if (/authentication may have expired|Cookies have expired|Code 16/i.test(out)) {
    throw new Error('NLM_AUTH_EXPIRED — chạy: nlm login -p ' + NLM_PROFILE);
  }
  return out;
}

function getNotebookId(): string {
  if (process.env.NLM_NOTEBOOK_ID) return process.env.NLM_NOTEBOOK_ID.trim();
  if (fs.existsSync(NOTEBOOK_ID_FILE)) return fs.readFileSync(NOTEBOOK_ID_FILE, 'utf8').trim();
  throw new Error('Chưa có notebook. Set NLM_NOTEBOOK_ID hoặc chạy backfill-core-senses-nlm.ts --setup');
}

// ── JSON parsing (tolerant — NLM output can be messy) ──
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
interface WordItem {
  word: string;
  translation: string;
  pos?: string;
}

interface ClassroomWords {
  classroomId: string;
  classroomName: string;
  teacherId: string;
  words: WordItem[];
}

interface GeneratedExercise {
  title: string;
  passage: string;
  passagePlain: string;
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

// ── Gather today's words per classroom ──
async function gatherClassroomWords(): Promise<ClassroomWords[]> {
  const today = todayVN();
  console.log(`[daily-reading] Gathering words for date: ${today}`);

  // Get all classrooms
  let classrooms: Array<{ id: string; name: string; teacher_id: string }> = [];
  if (CLASSROOM_FILTER) {
    const { data } = await supabase
      .from('classrooms')
      .select('id, name, teacher_id')
      .eq('id', CLASSROOM_FILTER)
      .single();
    if (data) classrooms = [data];
  } else {
    const { data } = await supabase.from('classrooms').select('id, name, teacher_id');
    classrooms = data || [];
  }

  const results: ClassroomWords[] = [];

  for (const cls of classrooms) {
    // Words added today
    const { data: todayWords } = await supabase
      .from('words')
      .select('word, translation, pos')
      .eq('classroom_id', cls.id)
      .gte('created_at', `${today}T00:00:00+07:00`)
      .lt('created_at', `${today}T23:59:59+07:00`)
      .order('created_at', { ascending: false });

    const words: WordItem[] = [];
    const seen = new Set<string>();

    for (const w of todayWords || []) {
      const key = (w.word || '').trim().toLowerCase();
      if (!key || key.length > 50 || seen.has(key)) continue;
      const vi = (w.translation || '').trim();
      if (!vi || vi.length < 2) continue;
      seen.add(key);
      words.push({ word: key, translation: vi, pos: w.pos || undefined });
    }

    // If too few words, supplement with recent words from the same classroom
    if (words.length < MIN_WORDS && words.length > 0) {
      const { data: recentWords } = await supabase
        .from('words')
        .select('word, translation, pos')
        .eq('classroom_id', cls.id)
        .lt('created_at', `${today}T00:00:00+07:00`)
        .order('created_at', { ascending: false })
        .limit(MAX_WORDS - words.length);

      for (const w of recentWords || []) {
        if (words.length >= MAX_WORDS) break;
        const key = (w.word || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        const vi = (w.translation || '').trim();
        if (!vi || vi.length < 2) continue;
        seen.add(key);
        words.push({ word: key, translation: vi, pos: w.pos || undefined });
      }
    }

    if (words.length < MIN_WORDS) {
      console.log(`  [${cls.name}] only ${words.length} words — skip (need ≥${MIN_WORDS})`);
      continue;
    }

    // Cap at MAX_WORDS
    results.push({
      classroomId: cls.id,
      classroomName: cls.name,
      teacherId: cls.teacher_id,
      words: words.slice(0, MAX_WORDS),
    });
  }

  return results;
}

// ── Check if exercise already exists for tomorrow ──
async function exerciseExists(classroomId: string): Promise<boolean> {
  const tomorrow = tomorrowVN();
  const { data } = await supabase
    .from('daily_reading_exercises')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('exercise_date', tomorrow)
    .is('target_user_id', null)
    .eq('status', 'ready')
    .maybeSingle();
  return !!data;
}

// ── Build NLM prompt ──
function buildPrompt(words: WordItem[], classroomName: string): string {
  const wordLines = words
    .map((w) => {
      const bits = [`- ${w.word}`];
      if (w.pos) bits.push(`(${w.pos})`);
      bits.push(`= ${w.translation}`);
      return bits.join(' ');
    })
    .join('\n');

  const numQuestions = words.length <= 8 ? 4 : words.length <= 12 ? 5 : 6;
  const numCloze = Math.min(6, Math.max(4, Math.floor(words.length * 0.5)));

  return `You are an expert ESL teacher and a creative writer.
Write ONE reading passage that recycles ALL the target vocabulary words below.
Your goal is to make the student say "WOW, this is so fun to read!"

CLASS: "${classroomName}"
Target words (${words.length}):
${wordLines}

PASSAGE RULES:
1. Write 150-300 English words (2-3 paragraphs). Make it HIGHLY ENGAGING but REALISTIC (e.g., a funny diary entry, an interesting modern lifestyle article, a relatable daily life story). Do NOT write sci-fi, fantasy, or boring textbook essays.
2. Use ALL target words naturally, avoiding forced or rigid sentences. The story must flow beautifully. First occurrence of each target word MUST be wrapped in **markdown bold**.
3. Passage body: ENGLISH ONLY. No Vietnamese inside the passage.
4. Theme: Auto-detect from the words — MUST pick ONE of the following realistic topics:
   - Daily Life
   - School & Education
   - Environment
   - Health
   - Food & Dining
   - Travel & Transportation
   - Work & Career
   - Technology
   - Entertainment & Media
   - Sports
   - Society & Community
   - Shopping & Money
   - Nature & Animals
   - Science
   - Friends & Emotions
5. Level: A2-B1 (Simple grammar but vivid, emotional, and captivating context).

QUESTION RULES:
1. Exactly ${numQuestions} MCQs. Each: "q", 4 "options", "answer", "explain".
2. GROUNDED ONLY: every fact in question and answer MUST appear in the passage.
3. Do NOT invent days/times/places not in the passage.
4. "answer" = exact copy of one option string (never just a letter).
5. "explain": Viết 2-3 câu giải thích chi tiết, tự nhiên bằng tiếng Việt. Phân tích sâu ngữ cảnh và nghĩa của từ vựng để học sinh hiểu bản chất TẠI SAO đáp án đó đúng. KHÔNG dùng các cụm từ khen ngợi công nghiệp/rập khuôn ở đầu câu (TUYỆT ĐỐI CẤM dùng: "Chính xác!", "Đúng rồi!", "Tuyệt vời!"). Hãy giải thích như một gia sư chuyên môn sâu (VD: "Ở đoạn 2, cụm từ... được dùng để chỉ..., qua đó ta thấy...").

CLOZE RULES:
1. Rewrite the passage replacing exactly ${numCloze} target words with {{0}}, {{1}}, etc.
2. Each blank: "answer" = target word; "options" = 4 real English words (1 correct + 3 clever distractors).

BONUS VOCABULARY:
Include 3-5 bonus words that appear in the passage but are NOT in the target list.
These should be highly useful, practical B1-B2 words that wow the student.
For each: word, translation (Vietnamese), pos, definition_en.

Return ONLY valid JSON (no markdown fence):
{
  "title": "...",
  "passage": "... with **target** words ...",
  "translation": "Bản dịch toàn bộ đoạn văn sang tiếng Việt một cách tự nhiên và truyền cảm...",
  "level": "A2",
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

// ── Find used words ──
function findUsedWords(passage: string, targets: string[]): { used: string[]; missing: string[] } {
  const lower = passage.toLowerCase();
  const used: string[] = [];
  const missing: string[] = [];
  for (const w of targets) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = w.includes(' ') || w.includes('-')
      ? new RegExp(esc, 'i')
      : new RegExp(`\\b${esc}\\b`, 'i');
    if (re.test(lower)) used.push(w);
    else missing.push(w);
  }
  return { used, missing };
}

// ── Normalize NLM response ──
function normalizeResponse(raw: Record<string, unknown>, targets: string[]): GeneratedExercise {
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
  const clozeObj = raw.cloze && typeof raw.cloze === 'object'
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
  if (!clozeText || blanks.length < 3) {
    let t = passagePlain;
    const autoBlanks: typeof blanks = [];
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
    level: String(raw.level || 'A2').trim(),
    questions,
    cloze: { text: clozeText || passagePlain, blanks },
    usedWords,
    coverage,
    bonusWords,
  };
}

// ── Generate exercise for one classroom ──
async function generateForClassroom(
  notebookId: string,
  cw: ClassroomWords,
): Promise<GeneratedExercise | null> {
  const prompt = buildPrompt(cw.words, cw.classroomName);
  const targets = cw.words.map((w) => w.word);

  const maxAttempts = 2;
  let best: GeneratedExercise | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  [nlm] attempt ${attempt}/${maxAttempts} for "${cw.classroomName}" (${cw.words.length} words)`);
      const rawOutput = await nlm(['notebook', 'query', notebookId, prompt], 300_000);
      console.log(`  [nlm] raw head: ${rawOutput.slice(0, 150).replace(/\s+/g, ' ')}`);

      let parsed = parseJsonLoose(rawOutput) as Record<string, unknown>;
      if (typeof parsed.answer === 'string') {
        parsed = parseJsonLoose(parsed.answer) as Record<string, unknown>;
      }
      const result = normalizeResponse(parsed, targets);

      if (!best || result.coverage > best.coverage) {
        best = result;
      }

      if (result.coverage >= 0.75 && result.questions.length >= 3) {
        return result;
      }

      console.log(`  [nlm] coverage=${(result.coverage * 100).toFixed(0)}% questions=${result.questions.length} — retry`);
    } catch (e) {
      console.error(`  [nlm] attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
      if (String(e).includes('NLM_AUTH_EXPIRED')) throw e;
    }

    if (attempt < maxAttempts) await sleep(DELAY_MS);
  }

  return best;
}

// ── Save exercise to DB ──
async function saveExercise(
  classroomId: string,
  sourceDate: string,
  exerciseDate: string,
  sourceWords: WordItem[],
  exercise: GeneratedExercise,
  meta: Record<string, unknown>,
): Promise<boolean> {
  if (DRY) {
    console.log(`  [dry] Would save: "${exercise.title}" coverage=${(exercise.coverage * 100).toFixed(0)}%`);
    return true;
  }

  const { error } = await supabase.from('daily_reading_exercises').upsert(
    {
      classroom_id: classroomId,
      target_user_id: null,
      exercise_date: exerciseDate,
      source_date: sourceDate,
      title: exercise.title,
      passage: exercise.passage,
      passage_plain: exercise.passagePlain,
      level: exercise.level,
      questions: exercise.questions,
      cloze: exercise.cloze,
      source_words: sourceWords,
      used_words: exercise.usedWords,
      coverage: exercise.coverage,
      bonus_words: exercise.bonusWords,
      status: 'ready',
      error_message: null,
      generated_at: new Date().toISOString(),
      generation_meta: meta,
    },
    {
      onConflict: 'classroom_id,exercise_date,target_user_id',
    },
  );

  if (error) {
    console.error(`  [db] Save failed:`, error.message);
    return false;
  }

  return true;
}

// ── Push notification to students ──
async function notifyStudents(classroomId: string, title: string): Promise<number> {
  if (SKIP_PUSH || DRY) return 0;

  try {
    // Dynamic import to avoid Firebase init issues in some environments
    const { sendPushNotificationToUser } = await import('../src/lib/notifications');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('classroom_id', classroomId);

    if (!enrollments?.length) return 0;

    let sent = 0;
    for (const e of enrollments) {
      try {
        const result = await sendPushNotificationToUser(
          e.student_id,
          '📖 Bài luyện đọc mới!',
          `"${title}" — Đọc và làm bài ngay khi thức dậy nhé!`,
          '/practice/daily-reading',
        );
        if ((result as { messageId?: string })?.messageId) sent++;
      } catch {
        // Skip silently — not critical
      }
    }
    return sent;
  } catch (e) {
    console.warn('  [push] notification module unavailable:', e instanceof Error ? e.message : e);
    return 0;
  }
}

// ── Main ──
async function main() {
  console.log('=== Daily Reading Exercise Generator (NLM) ===');
  console.log(`profile=${NLM_PROFILE} dry=${DRY} delay=${DELAY_MS}ms`);
  console.log(`today=${todayVN()} exercise_date=${tomorrowVN()}`);

  if (!fs.existsSync(NLM_PATH)) {
    console.error('nlm.exe not found:', NLM_PATH);
    process.exit(1);
  }

  // Auth check removed because NLM CLI handles it automatically

  const notebookId = getNotebookId();
  console.log('notebook:', notebookId);

  // Gather words
  const classrooms = await gatherClassroomWords();
  console.log(`\nFound ${classrooms.length} classroom(s) with enough words today`);

  if (classrooms.length === 0) {
    console.log('No classrooms with new words — nothing to generate.');
    return;
  }

  const today = todayVN();
  const tomorrow = tomorrowVN();
  let totalOk = 0;
  let totalFail = 0;
  let totalPush = 0;

  for (const cw of classrooms) {
    console.log(`\n── Classroom: "${cw.classroomName}" (${cw.words.length} words) ──`);
    console.log(`   words: ${cw.words.map((w) => w.word).join(', ')}`);

    // Check if already generated
    if (!DRY && await exerciseExists(cw.classroomId)) {
      console.log('  Already has exercise for tomorrow — skip');
      continue;
    }

    const startMs = Date.now();

    try {
      const exercise = await generateForClassroom(notebookId, cw);

      if (!exercise) {
        console.error('  Failed to generate exercise');
        // Save failure record
        if (!DRY) {
          await supabase.from('daily_reading_exercises').upsert(
            {
              classroom_id: cw.classroomId,
              target_user_id: null,
              exercise_date: tomorrow,
              source_date: today,
              title: `[Failed] ${cw.classroomName}`,
              passage: '',
              passage_plain: '',
              questions: [],
              cloze: {},
              source_words: cw.words,
              used_words: [],
              coverage: 0,
              status: 'failed',
              error_message: 'NLM failed to generate valid exercise after max attempts',
              generated_at: new Date().toISOString(),
              generation_meta: { nlm_profile: NLM_PROFILE, notebook_id: notebookId },
            },
            { onConflict: 'classroom_id,exercise_date,target_user_id' },
          );
        }
        totalFail++;
        continue;
      }

      const durationMs = Date.now() - startMs;
      const meta = {
        nlm_profile: NLM_PROFILE,
        notebook_id: notebookId,
        duration_ms: durationMs,
        word_count: cw.words.length,
      };

      const saved = await saveExercise(cw.classroomId, today, tomorrow, cw.words, exercise, meta);

      if (saved) {
        totalOk++;
        console.log(`  ✓ "${exercise.title}" · coverage=${(exercise.coverage * 100).toFixed(0)}% · ${exercise.questions.length} MCQs · ${exercise.cloze.blanks.length} cloze · ${exercise.bonusWords.length} bonus · ${(durationMs / 1000).toFixed(1)}s`);

        // Push notification
        const pushCount = await notifyStudents(cw.classroomId, exercise.title);
        totalPush += pushCount;
        if (pushCount > 0) console.log(`  📱 Notified ${pushCount} student(s)`);
      } else {
        totalFail++;
      }
    } catch (e) {
      totalFail++;
      console.error(`  Classroom error:`, e instanceof Error ? e.message : e);
      if (String(e).includes('NLM_AUTH_EXPIRED')) {
        console.error('NLM auth expired — stopping.');
        process.exit(2);
      }
    }

    // Delay between classrooms
    if (classrooms.indexOf(cw) < classrooms.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`ok=${totalOk} fail=${totalFail} push=${totalPush}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
