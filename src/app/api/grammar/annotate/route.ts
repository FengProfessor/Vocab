import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit } from '@/lib/rate-limit';

export interface WordAnnotation {
  word: string;
  role: 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'article' | 'other';
  start: number;
  end: number;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`ai:${ip}`, 20, 60_000); // 20 req/min per IP
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

    // Multi-key rotation — copy pattern từ ai-enrich.ts
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
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const topicLine = typeof topic === 'string' && topic.trim() ? `Grammar topic context: ${topic.trim()}` : '';
    const prompt = `Analyze this English sentence and identify the grammatical role of each meaningful word/phrase.
Return a JSON array. Each element: {"word": exact_substring, "role": one_of_roles, "start": char_index, "end": exclusive_char_index}.
Roles: subject, verb, object, adjective, adverb, preposition, conjunction, article, other.
Rules:
- "start" and "end" must be exact character positions in the original sentence string (case-sensitive match).
- Multi-word subjects/objects (e.g. "the big dog") can be one annotation.
- Articles (a, an, the) → role "article".
- Cover only meaningful tokens, skip punctuation.
- Return ONLY valid JSON array, no markdown, no explanation.
${topicLine}
Sentence: "${sentence}"`;

    const result = await model.generateContent(
      { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
      { signal: AbortSignal.timeout(10000) },
    );

    const rawText = result.response.text();

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
    const validRoles = new Set(['subject', 'verb', 'object', 'adjective', 'adverb', 'preposition', 'conjunction', 'article', 'other']);

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
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GrammarAnnotate] Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
