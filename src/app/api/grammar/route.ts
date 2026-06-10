import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, safeErrorResponse, getAuthUser, unauthorized, sanitizeForPrompt } from '@/lib/api-security';

// Gemini call dùng AbortSignal.timeout(15000) → cần >15s. Hobby mặc định 10s sẽ kill sớm.
export const maxDuration = 30;

function getGeminiModel() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new GoogleGenerativeAI(key).getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
}

type GeneratedExercise = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  type?: string;
  difficulty?: number;
};

const VALID_TYPES = new Set(['multiple_choice', 'fill_blank', 'error_correction']);

/** Normalize 1 exercise từ AI: trim, dedupe options, validate correct_answer ∈ options, default type/difficulty. */
function normalizeExercise(raw: unknown): Omit<GeneratedExercise, 'difficulty'> & { difficulty: number; type: string } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.question !== 'string' || !item.question.trim()) return null;
  if (!Array.isArray(item.options) || item.options.length !== 4) return null;
  if (typeof item.correct_answer !== 'string') return null;

  const opts = (item.options as unknown[])
    .filter((o): o is string => typeof o === 'string')
    .map((o) => o.trim());
  if (opts.length !== 4) return null;
  if (new Set(opts).size !== 4) return null;

  const correct = item.correct_answer.trim();
  if (!opts.includes(correct)) return null;

  const type = typeof item.type === 'string' && VALID_TYPES.has(item.type) ? item.type : 'multiple_choice';
  const difficulty = typeof item.difficulty === 'number' && [1, 2, 3].includes(item.difficulty) ? item.difficulty : 2;

  return {
    question: item.question.trim(),
    options: opts,
    correct_answer: correct,
    explanation: typeof item.explanation === 'string' ? item.explanation : '',
    type,
    difficulty,
  };
}

// POST - Generate grammar exercises for a classroom using AI
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit: 5 req/min per IP để tránh abuse AI generation
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`grammar-gen:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    // Auth bắt buộc — route dùng service client (bypass RLS) + đốt quota AI
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const body = await req.json() as Record<string, unknown>;
    const { classroomId, topic: rawTopic, level: rawLevel = 'beginner', count: rawCount = 5, lessonId } = body;
    // classroomId optional — student self-practice mode không cần classroom
    if (!rawTopic || typeof rawTopic !== 'string') {
      return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });
    }
    // Sanitize input trước khi nhúng vào prompt (chống prompt injection) + clamp count
    const topic = sanitizeForPrompt(rawTopic, 100);
    const level = ['beginner', 'intermediate', 'advanced'].includes(String(rawLevel)) ? String(rawLevel) : 'beginner';
    const count = Math.min(Math.max(1, parseInt(String(rawCount ?? '5'), 10) || 5), 10);
    if (!topic) {
      return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Lưu vào classroom → phải là giáo viên của lớp đó
    if (typeof classroomId === 'string' && classroomId) {
      const { data: cls } = await supabase
        .from('classrooms')
        .select('teacher_id')
        .eq('id', classroomId)
        .maybeSingle();
      if (!cls || cls.teacher_id !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Not your classroom' }, { status: 403 });
      }
    }

    // Nếu gắn với 1 bài học → lấy lý thuyết để prompt bám sát nội dung
    let lessonContext = '';
    if (lessonId) {
      const { data: lesson } = await supabase
        .from('grammar_lessons')
        .select('title, theory')
        .eq('id', lessonId)
        .maybeSingle();
      if (lesson?.theory) {
        lessonContext = `\nBase the exercises strictly on this lesson:\nLesson: ${lesson.title}\n${String(lesson.theory).slice(0, 2000)}\n`;
      }
    }

    const prompt = `You are an expert English grammar teacher for Vietnamese learners. Generate ${count} grammar exercises on the topic: "${topic}".
Level: ${level} (beginner = A1-A2, intermediate = B1-B2, advanced = C1-C2)${lessonContext}

Return ONLY a valid JSON array (no markdown, no prose) in this exact shape:
[
  {
    "question": "Choose the correct **verb form**: She ___ to school every day.",
    "options": ["go", "goes", "going", "went"],
    "correct_answer": "goes",
    "explanation": "Chủ ngữ 'She' là ngôi 3 số ít, thì hiện tại đơn → động từ phải thêm -s/-es. 'go' sai vì không chia, 'going' là V-ing (cần 'be' đi kèm), 'went' là quá khứ — không hợp với 'every day'.",
    "type": "fill_blank",
    "difficulty": 1
  }
]

Order & variety:
- Sort the array from easy → hard. Set "difficulty": 1 (easy), 2 (medium), or 3 (hard).
- Mix the 3 types in this proportion: at least 1 of each.
  · "fill_blank"        — câu chứa "___" (3 underscore) ở chỗ trống. Options là 4 từ/cụm có thể điền vào.
  · "error_correction"  — câu chứa 1 lỗi. 4 options là 4 token (word/phrase) trong câu, chọn token SAI. Prefix question với "Find the error: " kèm câu sai.
  · "multiple_choice"   — câu hỏi khái niệm hoặc chọn câu đúng nhất.

Highlight keyword:
- Trong "question", BẮT BUỘC dùng cú pháp **markdown bold** để nhấn mạnh từ khóa ngữ pháp chính (verb form, tense, article, preposition, …) hoặc phần học sinh cần chú ý. Ví dụ: "Choose the correct **preposition**:" hoặc "Find the **wrong** word:".
- Chỉ bold 1-3 token, không bold quá nhiều.

Distractor strategy (đáp án nhiễu) — BẮT BUỘC mô phỏng lỗi thường gặp của học sinh Việt:
- Quên thêm -s/-es ở ngôi 3 số ít hiện tại đơn.
- Nhầm thì (present vs past vs perfect).
- Bỏ "to be" trong thì tiếp diễn ("She going" thay vì "She is going").
- Sai trật tự tính từ / trạng từ.
- Lẫn lộn a/an/the/Ø.
- Lẫn lộn much/many, few/little, since/for.

Explanation language: TIẾNG VIỆT (vì người học là người Việt). Mỗi explanation phải:
1. Giải thích vì sao đáp án ĐÚNG đúng (quy tắc).
2. Giải thích ngắn vì sao MỖI distractor sai.
Tối đa 3 câu, súc tích, không dài dòng.

correct_answer phải khớp CHÍNH XÁC (case-sensitive, no extra spaces) với 1 trong 4 options.
Return JSON array only, no other text.`;

    const result = await getGeminiModel().generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: AbortSignal.timeout(15000) }
    );
    const rawText = result.response.text();

    let rawExercises: unknown[];
    try {
      rawExercises = JSON.parse(rawText);
    } catch {
      // Fallback: extract JSON array từ raw text
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error('[GrammarGenerate] Invalid AI response:', rawText.slice(0, 200));
        return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
      }
      rawExercises = JSON.parse(match[0]);
    }

    if (!Array.isArray(rawExercises)) {
      return NextResponse.json({ success: false, error: 'AI response is not an array' }, { status: 500 });
    }

    // Normalize + validate, drop câu lỗi format
    const exercises = rawExercises
      .map(normalizeExercise)
      .filter((e): e is NonNullable<ReturnType<typeof normalizeExercise>> => e !== null)
      // Easy → Hard
      .sort((a, b) => a.difficulty - b.difficulty);

    if (exercises.length === 0) {
      return NextResponse.json({ success: false, error: 'AI returned no valid exercises' }, { status: 500 });
    }

    // Route này yêu cầu classroomId để lưu vào grammar_exercises (teacher flow)
    if (typeof classroomId !== 'string' || !classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required to save exercises. For student practice, use /api/grammar/quiz' }, { status: 400 });
    }

    const toInsert = exercises.map((ex) => ({
      classroom_id: classroomId as string,
      topic: topic as string,
      level: level as string,
      question: ex.question,
      options: ex.options,
      correct_answer: ex.correct_answer,
      explanation: ex.explanation,
      type: ex.type,
      difficulty: ex.difficulty,
      lesson_id: typeof lessonId === 'string' ? lessonId : null,
    }));

    const { data, error } = await supabase
      .from('grammar_exercises')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to generate exercises');
  }
}

// GET - Fetch grammar exercises for a classroom
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth bắt buộc — service client bypass RLS, không auth = ai cũng đọc được bài của mọi lớp
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');
    const lessonId = searchParams.get('lessonId');

    if (!classroomId && !lessonId) {
      return NextResponse.json({ success: false, error: 'classroomId or lessonId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Đọc theo classroom → phải là giáo viên của lớp HOẶC học sinh đã enroll
    if (classroomId) {
      const [{ data: cls }, { data: enrollment }] = await Promise.all([
        supabase.from('classrooms').select('teacher_id').eq('id', classroomId).maybeSingle(),
        supabase.from('enrollments').select('id').eq('classroom_id', classroomId).eq('student_id', auth.userId).maybeSingle(),
      ]);
      const isTeacher = cls?.teacher_id === auth.userId;
      if (!isTeacher && !enrollment) {
        return NextResponse.json({ success: false, error: 'Not a member of this classroom' }, { status: 403 });
      }
    }
    // Sort easy → hard cho drill, fallback created_at để stable
    let query = supabase
      .from('grammar_exercises')
      .select('*')
      .order('difficulty', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (classroomId) query = query.eq('classroom_id', classroomId);
    if (lessonId) query = query.eq('lesson_id', lessonId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Failed to fetch exercises');
  }
}
