import { NextRequest, NextResponse } from 'next/server';
import { translateWithDetails, translateBatch } from '@/lib/api/translation';
import { getClientIp, checkRateLimitAsync, tooManyRequests } from '@/lib/api-security';

export const runtime = 'nodejs';

// Max length allowed for translation requests
const MAX_TEXT_LENGTH = 3000;
const MAX_BATCH_SIZE = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit based on IP: 60 requests / minute
    const ip = getClientIp(req);
    const rl = await checkRateLimitAsync(`rl:translate:${ip}`, 60, 60);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = await req.json().catch(() => ({}));
    const { text, texts, sourceLang = 'en', targetLang = 'vi' } = body;

    // Batch translation mode
    if (Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json({ success: true, results: [] });
      }
      if (texts.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
          { success: false, error: `Batch size exceeds limit of ${MAX_BATCH_SIZE}` },
          { status: 400 }
        );
      }

      const invalidItem = texts.find(
        (t) => typeof t !== 'string' || t.length > MAX_TEXT_LENGTH
      );
      if (invalidItem !== undefined) {
        return NextResponse.json(
          { success: false, error: `Each text item must be a string under ${MAX_TEXT_LENGTH} chars` },
          { status: 400 }
        );
      }

      const results = await translateBatch(texts, { sourceLang, targetLang });
      return NextResponse.json({
        success: true,
        results,
        sourceLang,
        targetLang,
      });
    }

    // Single translation mode
    if (typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Field "text" (string) or "texts" (string[]) is required' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Text length exceeds maximum allowed (${MAX_TEXT_LENGTH} chars)` },
        { status: 400 }
      );
    }

    const result = await translateWithDetails(text, { sourceLang, targetLang });

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      fromCache: result.fromCache,
      provider: result.provider,
      sourceLang: result.sourceLang,
      targetLang: result.targetLang,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Translation failed';
    console.error('[API /api/translate Error]:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
