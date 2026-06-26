import { NextRequest, NextResponse } from 'next/server';
import { getRouter } from '@/lib/ai-router';
import { checkRateLimit, safeErrorResponse, sanitizeForPrompt, getAuthUser, unauthorized } from '@/lib/api-security';

// Gemini call dùng AbortSignal.timeout(10000). Mặc định Hobby cắt ở 10s → đặt 30s để có headroom.
export const maxDuration = 30;

export interface WordAnnotation {
  word: string;
  role:
    | 'noun'        // danh từ (book, happiness)
    | 'pronoun'     // đại từ (he, she, this)
    | 'verb'        // động từ chính (run, eat)
    | 'auxiliary'   // trợ động từ (is, has, do)
    | 'modal'       // động từ khuyết thiếu (can, will, should)
    | 'adjective'   // tính từ (big, happy)
    | 'adverb'      // trạng từ (quickly, very)
    | 'preposition' // giới từ (in, on, at)
    | 'conjunction' // liên từ (and, but, because)
    | 'determiner'  // hạn định từ (this, my, some)
    | 'article'     // mạo từ (a, an, the)
    | 'interjection'// thán từ (oh, wow)
    // Backward-compat: dữ liệu cũ vẫn dùng nhãn chức năng
    | 'subject' | 'object'
    | 'other';
  start: number;
  end: number;
}

export async function POST(req: NextRequest) {
  try {
    // Route đốt Gemini → bắt buộc JWT, rate limit theo user
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();
    const rl = checkRateLimit(`ai:${auth.userId}`, 20, 60_000); // 20 req/min per user
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const body = await req.json();
    const { sentence, topic } = body as { sentence?: unknown; topic?: unknown };

    // Validate input
    if (typeof sentence !== 'string' || sentence.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'sentence is required and must be a non-empty string' }, { status: 400 });
    }
    if (sentence.length > 500) {
      return NextResponse.json({ success: false, error: 'sentence must not exceed 500 characters' }, { status: 400 });
    }
    // KHÔNG sanitize-mutate sentence (AI trả char offset trên câu gốc → mutate làm lệch offset).
    // Thay vào đó reject nếu chứa pattern injection.
    if (/[\x00-\x1F\x7F]|```/.test(sentence)) {
      return NextResponse.json({ success: false, error: 'sentence contains invalid characters' }, { status: 400 });
    }



    const topicLine = typeof topic === 'string' && topic.trim() ? `Grammar topic context: ${sanitizeForPrompt(topic, 100)}` : '';
    const prompt = `You are an English linguist. Tag every meaningful token in this sentence with ITS PART OF SPEECH (not its syntactic function).
Return a JSON array. Each element: {"word": exact_substring, "role": one_of_roles, "start": char_index, "end": exclusive_char_index}.

Allowed roles (use ONLY these — never use "subject" or "object"):
- noun          (book, happiness, John)
- pronoun       (he, she, it, they, this, who)
- verb          (main verbs: run, eat, became)
- auxiliary     (forms of be/have/do used as helpers: is, has, did)
- modal         (can, could, will, would, must, should, may)
- adjective     (big, blue, careful)
- adverb        (quickly, very, often, here, then)
- preposition   (in, on, at, by, for, with)
- conjunction   (and, but, or, because, although)
- determiner    (this/that/these/those, my/your, some, any, much, many)
- article       (a, an, the)
- interjection  (oh, wow, ah)

Rules:
- Tag EACH word individually. Do NOT group multi-word phrases — one token = one annotation.
- "start" and "end" are exact character offsets in the original sentence (case-sensitive substring).
- Skip punctuation. Skip nothing else.
- For phrasal verbs ("look up"), tag the verb as "verb" and the particle as "adverb".
- For gerunds/infinitives acting as nouns, still tag them as "verb" (their POS).
- ONLY valid JSON array. No markdown. No prose.
${topicLine}
Sentence: "${sentence}"`;

    const rawText = await getRouter().generate(prompt, 'normal', true);

    // Parse với fallback regex
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error('[GrammarAnnotate] Invalid AI response:', rawText.slice(0, 200));
        return NextResponse.json({ success: false, error: 'AI returned invalid JSON' }, { status: 500 });
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        console.error('[GrammarAnnotate] Regex fallback parse failed');
        return NextResponse.json({ success: false, error: 'AI returned unparseable response' }, { status: 500 });
      }
    }

    if (!Array.isArray(parsed)) {
      console.error('[GrammarAnnotate] Response is not an array:', typeof parsed);
      return NextResponse.json({ success: false, error: 'AI response is not an array' }, { status: 500 });
    }

    const sentenceLen = sentence.length;
    const validRoles = new Set([
      'noun', 'pronoun', 'verb', 'auxiliary', 'modal',
      'adjective', 'adverb', 'preposition', 'conjunction',
      'determiner', 'article', 'interjection',
      // Backward-compat: vẫn chấp nhận nhãn cũ từ cache DB
      'subject', 'object', 'other',
    ]);

    const annotations: WordAnnotation[] = (parsed as unknown[])
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
      .filter((item) => {
        const { word, role, start, end } = item as { word?: unknown; role?: unknown; start?: unknown; end?: unknown };
        if (typeof word !== 'string' || typeof role !== 'string' || typeof start !== 'number' || typeof end !== 'number') return false;
        if (!validRoles.has(role)) return false;
        if (start < 0 || end > sentenceLen || start >= end) return false;
        return true;
      })
      .map((item) => ({
        word: item.word as string,
        role: item.role as WordAnnotation['role'],
        start: item.start as number,
        end: item.end as number,
      }));

    return NextResponse.json({ success: true, data: annotations });
  } catch (err: unknown) {
    return safeErrorResponse(err, 'Failed to annotate grammar');
  }
}
