import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuthUser, unauthorized, checkRateLimit } from '@/lib/api-security';

// Gemini Vision OCR trên ảnh — chậm hơn text. Đặt 60s để không bị cắt giữa chừng.
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * POST /api/import/ocr
 * Body: { base64: string, mimeType: string }
 * Uses Gemini Vision to extract vocabulary words from an image
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    // Auth: Bearer JWT bắt buộc — OCR gọi Gemini Vision tốn quota
    const auth = await getAuthUser(req);
    if (!auth) return unauthorized();

    // Rate limit: 5 req/min theo user id (fallback IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`ocr:${auth.userId || ip}`, 5, 60_000);
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

    const prompt = `You are a vocabulary extraction assistant. 
Look at this image and extract ALL English vocabulary words that appear to be:
- Underlined or highlighted (especially in red, yellow, or any color)
- Bold or emphasized
- Listed as vocabulary items
- Words that a student might need to learn

Return ONLY a JSON array of lowercase strings. No explanations, no markdown.
Example: ["epicenter", "thousands", "phenomenon", "extraordinary"]

If no clear vocabulary words are found, return an empty array: []`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    ]);

    const rawText = result.response.text();
    console.log('[OCR] OCR raw response:', rawText.substring(0, 500));

    // Extract JSON array from response
    const arrayMatch = rawText.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      return NextResponse.json({ words: [] });
    }

    const words: string[] = JSON.parse(arrayMatch[0]);
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
