import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, safeErrorResponse } from '@/lib/api-security';
import { resolveUserPlan, checkAccess } from '@/lib/entitlement';

// Gemini call dùng AbortSignal.timeout(15000) → cần >15s. Hobby mặc định 10s sẽ kill sớm.
export const maxDuration = 30;

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  level: string;
  type: 'multiple_choice' | 'fill_blank' | 'error_correction';
  difficulty: number;
}

const VALID_TYPES = new Set(['multiple_choice', 'fill_blank', 'error_correction']);

const QUIZ_MODEL = 'gemini-2.5-flash';
const QUIZ_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 ngày

/**
 * POST /api/grammar/quiz
 * Generate 5 quiz questions từ nội dung bài học, trả về mà KHÔNG lưu DB.
 * Dùng cho student self-practice — không cần classroom.
 * Body: { lessonId: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`grammar-quiz:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = await req.json() as Record<string, unknown>;
    const { lessonId } = body;

    if (typeof lessonId !== 'string' || !lessonId.trim()) {
      return NextResponse.json({ success: false, error: 'lessonId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Gate: AI quiz ngữ pháp là tính năng Premium. (Không chặn khi ENTITLEMENT_ENFORCED=false.)
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const { plan } = await resolveUserPlan(supabase, token);
    const access = checkAccess(plan, 'grammar_ai');
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: 'premium_required', upgradeTo: access.upgradeTo },
        { status: 403 },
      );
    }

    // ── Cache đọc: tái dùng quiz đã sinh cho lesson này → giảm ~80% gọi Gemini ──
    const { data: cached } = await supabase
      .from('grammar_quiz_cache')
      .select('questions, model, created_at')
      .eq('lesson_id', lessonId)
      .maybeSingle();
    if (
      cached &&
      cached.model === QUIZ_MODEL &&
      Date.now() - new Date(cached.created_at).getTime() < QUIZ_CACHE_TTL_MS &&
      Array.isArray(cached.questions) &&
      cached.questions.length > 0
    ) {
      return NextResponse.json({ success: true, data: cached.questions, cached: true });
    }

    const { data: lesson, error: lessonErr } = await supabase
      .from('grammar_lessons')
      .select('title, theory, theory_vi, examples, topic:grammar_topics(title, level)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonErr || !lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const topic = lesson.topic as unknown as { title: string; level: string } | null;
    const topicTitle = topic?.title ?? 'English Grammar';
    const level = topic?.level ?? 'intermediate';
    const content = (lesson.theory_vi || lesson.theory || '').slice(0, 2000);

    // Tận dụng examples từ lesson để prompt có data cụ thể (không chỉ lý thuyết)
    const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
    const exampleBlock = examples
      .slice(0, 5)
      .map((ex: { en?: string; vi?: string }, i: number) =>
        `  ${i + 1}. ${ex.en ?? ''}${ex.vi ? ` (VN: ${ex.vi})` : ''}`,
      )
      .join('\n');

    // Multi-key rotation
    let apiKey = process.env.GEMINI_API_KEY ?? '';
    if (apiKey.includes(',')) {
      const keys = apiKey.split(',').map((k) => k.trim()).filter(Boolean);
      apiKey = keys[Math.floor(Math.random() * keys.length)];
    }
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: QUIZ_MODEL,
      generationConfig: { responseMimeType: 'application/json' },
    });

    const levelLabel = { beginner: 'cơ bản (A1-A2)', intermediate: 'trung cấp (B1-B2)', advanced: 'nâng cao (C1-C2)' }[level as 'beginner' | 'intermediate' | 'advanced'] ?? 'trung cấp (B1-B2)';

    const prompt = `You are an English grammar teacher for Vietnamese learners. Create 5 multiple-choice questions based STRICTLY on the lesson below.

Lesson title: "${lesson.title}"
Topic: ${topicTitle}
Level: ${levelLabel}

Theory:
${content}
${exampleBlock ? `\nExample sentences from the lesson:\n${exampleBlock}\n` : ''}

Return a JSON array (no markdown, no prose) using this EXACT shape:
[
  {
    "question": "Choose the correct **verb form**: She ___ to school every day.",
    "options": ["actual answer 1", "actual answer 2", "actual answer 3", "actual answer 4"],
    "correct_answer": "string that MATCHES one of the 4 options character-for-character",
    "explanation": "Tiếng Việt: giải thích vì sao đáp án đúng đúng, và ngắn gọn vì sao các distractor sai.",
    "type": "fill_blank",
    "difficulty": 1
  }
]

Constraints:
- Exactly 5 questions.
- "options" always has exactly 4 strings; no duplicates.
- "correct_answer" must equal one of the 4 options exactly (no extra spaces, same case).
- Sort the array from easy → hard. Use "difficulty": 1, 2, or 3.
- Set "type" to one of: "fill_blank", "error_correction", or "multiple_choice".
  · fill_blank: câu có "___" (3 underscore) tại chỗ trống.
  · error_correction: question prefix "Find the error: " + câu chứa lỗi; 4 options là 4 token trong câu, chọn token SAI.
  · multiple_choice: câu hỏi khái niệm hoặc chọn câu đúng nhất.
- Mix question types: ≥1 fill_blank, ≥1 error_correction, ≥1 multiple_choice.
- Highlight keyword: dùng **markdown bold** trong "question" để nhấn từ khóa ngữ pháp chính (1-3 token, ví dụ "**verb form**", "**preposition**", "**wrong** word"). Không bold quá nhiều.
- Distractor strategy — simulate common Vietnamese-learner mistakes:
  · Missing 3rd-person -s/-es in Present Simple.
  · Tense confusion (present vs past vs perfect).
  · Dropping the auxiliary "be" in continuous tenses.
  · Wrong article (a/an/the/Ø).
  · Confusing much/many, few/little, since/for.
- Explanation MUST be in Vietnamese (the learner's language) and address why each distractor is wrong (max 3 short sentences).
- Match the level: ${levelLabel}.
- Output JSON array only.`;

    const result = await model.generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: AbortSignal.timeout(15000) }
    );

    const rawText = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error('[GrammarQuiz] Invalid AI response:', rawText.slice(0, 200));
        return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ success: false, error: 'AI response is not an array' }, { status: 500 });
    }

    type Normalized = {
      question: string;
      options: string[];
      correct_answer: string;
      explanation: string;
      type: 'multiple_choice' | 'fill_blank' | 'error_correction';
      difficulty: number;
    };

    const questions: QuizQuestion[] = (parsed as unknown[])
      .map((raw): Normalized | null => {
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

        const difficulty = typeof item.difficulty === 'number' && [1, 2, 3].includes(item.difficulty)
          ? item.difficulty
          : 2;
        const qType = typeof item.type === 'string' && VALID_TYPES.has(item.type)
          ? (item.type as Normalized['type'])
          : 'multiple_choice';

        return {
          question: item.question.trim(),
          options: opts,
          correct_answer: correct,
          explanation: typeof item.explanation === 'string' ? item.explanation : '',
          type: qType,
          difficulty,
        };
      })
      .filter((q): q is Normalized => q !== null)
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((q, i) => ({
        id: `ai-${i}`,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        topic: topicTitle,
        level,
        type: q.type,
        difficulty: q.difficulty,
      }));

    if (questions.length === 0) {
      return NextResponse.json({ success: false, error: 'AI returned no valid questions' }, { status: 500 });
    }

    // ── Cache ghi: lưu lại cho lần sau (kể cả student khác cùng lesson) ──
    try {
      await supabase
        .from('grammar_quiz_cache')
        .upsert(
          { lesson_id: lessonId, questions, model: QUIZ_MODEL, created_at: new Date().toISOString() },
          { onConflict: 'lesson_id' },
        );
    } catch (cacheErr) {
      // Lỗi cache không được chặn response
      console.warn('[GrammarQuiz] Cache write failed:', cacheErr instanceof Error ? cacheErr.message : cacheErr);
    }

    return NextResponse.json({ success: true, data: questions, cached: false });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Failed to generate quiz');
  }
}
