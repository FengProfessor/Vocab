import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

function getGeminiModel() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map((k) => k.trim()).filter(Boolean);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new GoogleGenerativeAI(key).getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
}

type GeneratedExercise = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  type?: string;
};

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

    const body = await req.json() as Record<string, unknown>;
    const { classroomId, topic, level = 'beginner', count = 5, lessonId } = body;
    // classroomId optional — student self-practice mode không cần classroom
    if (!topic) {
      return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

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

    const prompt = `You are an expert English grammar teacher. Generate ${count} grammar exercises on the topic: "${topic}".
Level: ${level} (beginner = A1-A2, intermediate = B1-B2, advanced = C1-C2)${lessonContext}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact format:
[
  {
    "question": "Complete the sentence: She ___ (go) to school every day.",
    "options": ["go", "goes", "going", "went"],
    "correct_answer": "goes",
    "explanation": "With third-person singular subjects (she/he/it), we add -s/-es to the base verb in Present Simple.",
    "type": "fill_blank"
  }
]

Include a mix of:
1. Fill in the blank (type: "fill_blank")
2. Error correction - find the wrong word (type: "error_correction")  
3. Multiple choice (type: "multiple_choice")

Make sure explanations are in ENGLISH, clear and educational. Questions should be practical and relevant.
Return JSON array only, no other text.`;

    const result = await getGeminiModel().generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: AbortSignal.timeout(15000) }
    );
    const rawText = result.response.text();

    let exercises: GeneratedExercise[];
    try {
      exercises = JSON.parse(rawText) as GeneratedExercise[];
    } catch {
      // Fallback: extract JSON array từ raw text
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error('[GrammarGenerate] Invalid AI response:', rawText.slice(0, 200));
        return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
      }
      exercises = JSON.parse(match[0]) as GeneratedExercise[];
    }

    // Route này yêu cầu classroomId để lưu vào grammar_exercises (teacher flow)
    if (typeof classroomId !== 'string' || !classroomId) {
      return NextResponse.json({ success: false, error: 'classroomId is required to save exercises. For student practice, use /api/grammar/quiz' }, { status: 400 });
    }

    // Save to Supabase
    const toInsert = exercises.map((ex) => ({
      classroom_id: classroomId as string,
      topic: topic as string,
      level: level as string,
      question: ex.question,
      options: ex.options,
      correct_answer: ex.correct_answer,
      explanation: ex.explanation,
      lesson_id: typeof lessonId === 'string' ? lessonId : null,
    }));

    const { data, error } = await supabase
      .from('grammar_exercises')
      .insert(toInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Grammar API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate exercises', details: msg }, { status: 500 });
  }
}

// GET - Fetch grammar exercises for a classroom
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');
    const lessonId = searchParams.get('lessonId');

    if (!classroomId && !lessonId) {
      return NextResponse.json({ success: false, error: 'classroomId or lessonId is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('grammar_exercises')
      .select('*')
      .order('created_at', { ascending: false });
    if (classroomId) query = query.eq('classroom_id', classroomId);
    if (lessonId) query = query.eq('lesson_id', lessonId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
