import { NextResponse } from 'next/server';
import { getAuthUser, unauthorized, checkRateLimitAsync } from '@/lib/api-security';

// Groq Vision OCR trên ảnh — chậm hơn text. Đặt 60s để không bị cắt giữa chừng.
export const maxDuration = 60;

function pickGroqKey(): string {
  const raw = process.env.GROQ_API_KEY || '';
  if (!raw.includes(',')) return raw.trim();
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.length ? keys[Math.floor(Math.random() * keys.length)] : '';
}

/**
 * POST /api/import/ocr
 * Body: { base64: string, mimeType: string }
 * Uses Groq LLaMA 3.2 Vision to extract vocabulary words from an image
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Auth: Bearer JWT bắt buộc — OCR gọi Vision tốn quota
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    // Rate limit: 5 req/min theo user id (fallback IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = await checkRateLimitAsync(`ocr:${auth.userId || ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
      );
    }

    const { base64, mimeType } = (await req.json()) as { base64?: string; mimeType?: string };
    if (!base64 || !mimeType) {
      return NextResponse.json({ success: false, error: 'base64 and mimeType are required' }, { status: 400 });
    }

    const apiKey = pickGroqKey();
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Groq API key not configured' }, { status: 500 });
    }

    const prompt = `You are a vocabulary extraction assistant. 
Look at this image and extract ALL English vocabulary words that appear to be:
- Underlined or highlighted (especially in red, yellow, or any color)
- Bold or emphasized
- Listed as vocabulary items
- Words that a student might need to learn

Return a JSON object with a "words" key containing the list of extracted lowercase strings. No explanations, no markdown.
Example: {"words": ["epicenter", "thousands", "phenomenon", "extraordinary"]}

If no clear vocabulary words are found, return: {"words": []}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Groq OCR API error (HTTP ${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    console.log('[OCR] OCR raw response:', rawText.substring(0, 500));

    let words: string[] = [];
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed.words)) {
        words = parsed.words;
      } else if (Array.isArray(parsed)) {
        words = parsed;
      }
    } catch {
      // Fallback: extract JSON array from response
      const arrayMatch = rawText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        words = JSON.parse(arrayMatch[0]);
      }
    }

    const filtered = words
      .filter(w => typeof w === 'string' && w.length > 1 && w.length < 80)
      .map(w => w.toLowerCase().trim());

    return NextResponse.json({ success: true, words: [...new Set(filtered)] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('OCR Error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
