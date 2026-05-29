import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GrammarExample, GrammarLevel } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';

interface GenerateBody {
  topic?: unknown;
  level?: unknown;
}

interface GeneratedLesson {
  title: string;
  theory_vi: string;
  examples: GrammarExample[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`ai:${ip}`, 5, 60_000); // 5 req/min per IP
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = await req.json() as GenerateBody;
    const { topic, level } = body;

    if (typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'topic is required' }, { status: 400 });
    }
    if (topic.length > 100) {
      return NextResponse.json({ success: false, error: 'topic must not exceed 100 characters' }, { status: 400 });
    }
    const validLevels: GrammarLevel[] = ['beginner', 'intermediate', 'advanced'];
    const resolvedLevel: GrammarLevel =
      typeof level === 'string' && validLevels.includes(level as GrammarLevel)
        ? (level as GrammarLevel)
        : 'intermediate';

    // Multi-key rotation
    let apiKey = process.env.GEMINI_API_KEY || '';
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

    const levelLabel = { beginner: 'cơ bản (A1-A2)', intermediate: 'trung cấp (B1-B2)', advanced: 'nâng cao (C1-C2)' }[resolvedLevel];

    const prompt = `Bạn là giáo viên tiếng Anh chuyên nghiệp. Hãy tạo một bài học ngữ pháp tiếng Anh về chủ đề: "${topic.trim()}" ở cấp độ ${levelLabel}.

Trả về JSON với cấu trúc sau (KHÔNG có markdown, chỉ JSON thuần):
{
  "title": "Tên bài học ngắn gọn (tiếng Việt, tối đa 60 ký tự)",
  "theory_vi": "Giải thích ngữ pháp bằng tiếng Việt, markdown format, 200-400 từ. Bao gồm: định nghĩa, công thức/cấu trúc, khi nào dùng, ví dụ mini trong phần lý thuyết.",
  "examples": [
    {
      "en": "Câu ví dụ tiếng Anh đa dạng và tự nhiên",
      "vi": "Dịch tiếng Việt chính xác",
      "note": "Ghi chú ngữ pháp nếu cần (có thể để rỗng)"
    }
  ]
}

Yêu cầu:
- Tạo đúng 5 examples, đa dạng cấu trúc câu (affirmative, negative, question, v.v.)
- theory_vi dùng markdown: **bold** cho thuật ngữ, - list cho điểm quan trọng
- Phù hợp cấp độ ${levelLabel}
- ONLY valid JSON, no explanation outside JSON`;

    const result = await model.generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: AbortSignal.timeout(15000) }
    );

    const rawText = result.response.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error('[GrammarGenerate] Invalid AI response:', rawText.slice(0, 200));
        return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
      }
      parsed = JSON.parse(match[0]);
    }

    const p = parsed as Record<string, unknown>;
    if (typeof p.title !== 'string' || typeof p.theory_vi !== 'string' || !Array.isArray(p.examples)) {
      return NextResponse.json({ success: false, error: 'AI response missing required fields' }, { status: 500 });
    }

    const examples: GrammarExample[] = (p.examples as unknown[])
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => ({
        en: typeof e.en === 'string' ? e.en : '',
        vi: typeof e.vi === 'string' ? e.vi : undefined,
        note: typeof e.note === 'string' && e.note ? e.note : undefined,
      }))
      .filter((e) => e.en.length > 0);

    const data: GeneratedLesson = {
      title: p.title as string,
      theory_vi: p.theory_vi as string,
      examples,
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[GrammarGenerate] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
