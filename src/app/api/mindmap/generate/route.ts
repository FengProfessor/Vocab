import { NextResponse } from 'next/server';
import {
  generateMindMap,
  normalizeWordInputs,
  parseWordText,
  MIN_WORDS,
  MAX_WORDS,
} from '@/lib/mindmap';
import {
  getAuthUser,
  getClientIp,
  checkRateLimitAsync,
  isValidString,
} from '@/lib/api-security';

/**
 * POST /api/mindmap/generate
 * Body: { words: string[] | {word,translation?,pos?}[], text?: string, title?: string }
 * Tạo hierarchical thematic mind map từ 5–80 từ (khuyến nghị 40–60).
 *
 * Auth optional: có JWT → rate limit theo user; không login vẫn gen được (rate limit IP chặt hơn)
 * để GV thử prototype / in nhanh mà không bị chặn Unauthorized.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const auth = await getAuthUser(req);
    const ip = getClientIp(req);
    // Login: 8/phút; guest: 3/phút (chặn abuse quota AI)
    const rlKey = auth ? `mindmap:u:${auth.userId}` : `mindmap:ip:${ip}`;
    const rl = await checkRateLimitAsync(rlKey, auth ? 8 : 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều request. Thử lại sau 1 phút.' },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      words?: unknown;
      text?: unknown;
      title?: unknown;
    };

    let inputs = normalizeWordInputs(body.words);
    if (inputs.length === 0 && typeof body.text === 'string') {
      inputs = parseWordText(body.text);
    }

    if (inputs.length < MIN_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Cần ít nhất ${MIN_WORDS} từ (nhận ${inputs.length}). Dán 40–60 từ để map đẹp.`,
        },
        { status: 400 }
      );
    }
    if (inputs.length > MAX_WORDS) {
      return NextResponse.json(
        { success: false, error: `Tối đa ${MAX_WORDS} từ mỗi lần` },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === 'string' && isValidString(body.title, 100)
        ? body.title.trim()
        : undefined;

    console.log(
      `[MindMap] generate user=${auth?.userId.slice(0, 8) ?? 'guest'} words=${inputs.length} title=${title ?? '-'}`
    );

    const result = await generateMindMap(inputs, { title });

    return NextResponse.json({
      success: true,
      data: result,
      meta: { wordCount: inputs.length },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[MindMap] generate failed:', msg);
    const isValidationErr = msg.includes('Cần ít nhất') || msg.includes('Tối đa');
    return NextResponse.json(
      { success: false, error: isValidationErr ? msg : 'Không tạo được mind map. Thử lại sau.' },
      { status: isValidationErr ? 400 : 500 },
    );
  }
}
