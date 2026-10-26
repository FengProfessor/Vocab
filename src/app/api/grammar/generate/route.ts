import { NextRequest, NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai-router';
import type { GrammarExample, GrammarLevel } from '@/lib/supabase';
import {
  checkRateLimitAsync,
  getClientIp,
  getRateLimitClientKey,
  safeErrorResponse,
  sanitizeForPrompt,
} from '@/lib/api-security';

// Gemini call dùng AbortSignal.timeout(15000) → cần >15s. Hobby mặc định 10s sẽ kill sớm.
export const maxDuration = 30;

interface GenerateBody {
  topic?: unknown;
  level?: unknown;
}

interface GeneratedLesson {
  title: string;
  theory_vi: string;
  examples: GrammarExample[];
  sections?: {
    legoSlots?: { pattern: string; slots: Record<string, string[]> }[];
    dialogues?: { speaker: string; en: string; vi?: string }[][];
    safeHarbor?: { vi: string; en: string; hint?: string }[];
  };
}

const GRAMMAR_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes classroom topic cache
const MAX_GRAMMAR_CACHE_ENTRIES = 200;
const grammarLessonCache = new Map<string, { data: GeneratedLesson; expiresAt: number }>();
const inflightGrammarGenerations = new Map<string, Promise<GeneratedLesson>>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const clientKey = getRateLimitClientKey(req);

    // Multi-layer rate limit:
    // - 10 req/min per individual client/session (blocks single-user spam)
    // - 360 req/min per shared classroom NAT IP (allows 100-300 students on school Wi-Fi)
    const [clientRl, ipRl] = await Promise.all([
      checkRateLimitAsync(`grammar-generate:${clientKey}`, 10, 60_000),
      checkRateLimitAsync(`grammar-generate-ip:${ip}`, 360, 60_000),
    ]);
    if (!clientRl.allowed || !ipRl.allowed) {
      const resetIn = !clientRl.allowed ? clientRl.resetIn : ipRl.resetIn;
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
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



    const levelLabel = { beginner: 'cơ bản (A1-A2)', intermediate: 'trung cấp (B1-B2)', advanced: 'nâng cao (C1-C2)' }[resolvedLevel];

    const safeTopic = sanitizeForPrompt(topic, 100);
    const cacheKey = `${resolvedLevel}:${safeTopic.trim().toLowerCase()}`;

    // 1. Check short-TTL classroom topic cache
    const cached = grammarLessonCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ success: true, data: cached.data });
    }

    // 2. Single-flight deduplication when 100-300 students request the same topic concurrently
    let generationPromise = inflightGrammarGenerations.get(cacheKey);
    if (!generationPromise) {
      generationPromise = (async (): Promise<GeneratedLesson> => {
        const prompt = `Bạn là giáo viên tiếng Anh chuyên nghiệp. Hãy tạo một bài học ngữ pháp tiếng Anh về chủ đề: "${safeTopic}" ở cấp độ ${levelLabel}.

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
  ],
  "sections": {
    "legoSlots": [
      {
        "pattern": "Câu mẫu tiếng Anh chứa [SLOT]",
        "slots": {
          "[SLOT]": ["từ thay thế 1", "từ thay thế 2", "từ thay thế 3"]
        }
      }
    ],
    "dialogues": [
      [
        { "speaker": "A", "en": "Câu tiếng Anh", "vi": "Dịch tiếng Việt" },
        { "speaker": "B", "en": "Câu tiếng Anh", "vi": "Dịch tiếng Việt" }
      ]
    ],
    "safeHarbor": [
      { "vi": "Câu tiếng Việt để luyện dịch", "en": "Câu tiếng Anh tương ứng", "hint": "Gợi ý ngữ pháp (tùy chọn)" }
    ]
  }
}

Yêu cầu:
- Tạo đúng 5 examples cho phần theory.
- Tạo 2-3 legoSlots (phản xạ ngẫu nhiên).
- Tạo 1-2 đoạn hội thoại (dialogues) ngắn (2-4 câu/đoạn) ứng dụng ngữ pháp này.
- Tạo 3-5 câu safeHarbor (dịch Việt-Anh) để kiểm tra bằng giọng nói.
- theory_vi dùng markdown: **bold** cho thuật ngữ, - list cho điểm quan trọng
- Phù hợp cấp độ ${levelLabel}
- ONLY valid JSON, no explanation outside JSON`;

        const rawText = await getRouter().generate(prompt, 'normal', true);

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (!match) {
            console.error('[GrammarGenerate] Invalid AI response:', rawText.slice(0, 200));
            throw new Error('INVALID_AI_JSON');
          }
          parsed = JSON.parse(match[0]);
        }

        const p = parsed as Record<string, unknown>;
        if (typeof p.title !== 'string' || typeof p.theory_vi !== 'string' || !Array.isArray(p.examples)) {
          throw new Error('MISSING_AI_FIELDS');
        }

        const examples: GrammarExample[] = (p.examples as unknown[])
          .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
          .map((e) => ({
            en: typeof e.en === 'string' ? e.en : '',
            vi: typeof e.vi === 'string' ? e.vi : undefined,
            note: typeof e.note === 'string' && e.note ? e.note : undefined,
          }))
          .filter((e) => e.en.length > 0);

        const lesson: GeneratedLesson = {
          title: p.title as string,
          theory_vi: p.theory_vi as string,
          examples,
          sections: typeof p.sections === 'object' && p.sections !== null ? p.sections as GeneratedLesson['sections'] : undefined,
        };

        if (grammarLessonCache.size >= MAX_GRAMMAR_CACHE_ENTRIES) {
          const oldestKey = grammarLessonCache.keys().next().value;
          if (oldestKey) grammarLessonCache.delete(oldestKey);
        }
        grammarLessonCache.set(cacheKey, {
          data: lesson,
          expiresAt: Date.now() + GRAMMAR_CACHE_TTL_MS,
        });

        return lesson;
      })().finally(() => {
        inflightGrammarGenerations.delete(cacheKey);
      });
      inflightGrammarGenerations.set(cacheKey, generationPromise);
    }

    try {
      const data = await generationPromise;
      return NextResponse.json({ success: true, data });
    } catch (genErr) {
      if (genErr instanceof Error) {
        if (genErr.message === 'INVALID_AI_JSON') {
          return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
        }
        if (genErr.message === 'MISSING_AI_FIELDS') {
          return NextResponse.json({ success: false, error: 'AI response missing required fields' }, { status: 500 });
        }
      }
      throw genErr;
    }
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Failed to generate grammar lesson');
  }
}
