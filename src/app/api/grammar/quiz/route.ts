import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  topic: string;
  level: string;
}

interface AIQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

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
    const { data: lesson, error: lessonErr } = await supabase
      .from('grammar_lessons')
      .select('title, theory, theory_vi, topic:grammar_topics(title, level)')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonErr || !lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const topic = lesson.topic as unknown as { title: string; level: string } | null;
    const topicTitle = topic?.title ?? 'English Grammar';
    const level = topic?.level ?? 'intermediate';
    const content = (lesson.theory_vi || lesson.theory || '').slice(0, 2000);

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
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const levelLabel = { beginner: 'cơ bản (A1-A2)', intermediate: 'trung cấp (B1-B2)', advanced: 'nâng cao (C1-C2)' }[level as 'beginner' | 'intermediate' | 'advanced'] ?? 'trung cấp (B1-B2)';

    const prompt = `Bạn là giáo viên tiếng Anh. Hãy tạo 5 câu hỏi trắc nghiệm dựa trên bài học ngữ pháp sau.

Bài học: "${lesson.title}"
Chủ đề: ${topicTitle}
Cấp độ: ${levelLabel}
Nội dung:
${content}

Trả về JSON array (KHÔNG markdown, chỉ JSON thuần):
[
  {
    "question": "Câu hỏi trắc nghiệm tiếng Anh thực tế, bám sát nội dung bài",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correct_answer": "Đáp án đúng (phải là 1 trong 4 options)",
    "explanation": "Giải thích ngắn tại sao đáp án đúng, dùng tiếng Việt"
  }
]

Yêu cầu:
- Đúng 5 câu hỏi, đa dạng: fill-in-blank, error correction, multiple choice
- options luôn có 4 phần tử
- correct_answer phải là chuỗi khớp chính xác với 1 trong 4 options
- Phù hợp cấp độ ${levelLabel}
- ONLY valid JSON array, no explanation outside JSON`;

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

    const questions: QuizQuestion[] = (parsed as unknown[])
      .filter((q): q is AIQuestion => {
        if (typeof q !== 'object' || q === null) return false;
        const item = q as Record<string, unknown>;
        return (
          typeof item.question === 'string' &&
          Array.isArray(item.options) &&
          (item.options as unknown[]).length === 4 &&
          typeof item.correct_answer === 'string' &&
          (item.options as unknown[]).includes(item.correct_answer)
        );
      })
      .map((q, i) => ({
        id: `ai-${i}`,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: typeof q.explanation === 'string' ? q.explanation : '',
        topic: topicTitle,
        level,
      }));

    if (questions.length === 0) {
      return NextResponse.json({ success: false, error: 'AI returned no valid questions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: questions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[GrammarQuiz] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
