import { NextResponse } from 'next/server';
import {
  generatePackPassage,
  normalizePackWords,
  parseWordListText,
  DEMO_PACKS,
  PACK_PASSAGE_MIN_WORDS,
  PACK_PASSAGE_MAX_WORDS,
} from '@/lib/pack-passage';
import { PACK_THEMES, isValidPackThemeId } from '@/lib/pack-themes';
import {
  PACK_READING_LEVELS,
  DEFAULT_PACK_READING_LEVEL_ID,
  isValidPackReadingLevelId,
} from '@/lib/pack-levels';
import { getClientIp, checkRateLimit, isValidString } from '@/lib/api-security';

export const maxDuration = 120;

/**
 * GET  /api/practice/pack-passage → themes + levels + sample packs
 * POST /api/practice/pack-passage → gen on-demand (bắt buộc themeId + readingLevelId)
 *
 * Body: { themeId, readingLevelId?, packId?, words?, text?, title? }
 * Không pre-gen — chỉ chạy khi client bấm Gen AI.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    themes: PACK_THEMES,
    readingLevels: PACK_READING_LEVELS,
    defaultReadingLevelId: DEFAULT_PACK_READING_LEVEL_ID,
    minWords: PACK_PASSAGE_MIN_WORDS,
    maxWords: PACK_PASSAGE_MAX_WORDS,
    packs: DEMO_PACKS.map((p) => ({
      id: p.id,
      title: p.title,
      level: p.level,
      wordCount: p.words.length,
      words: p.words,
    })),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`practice-passage:${ip}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều request. Đợi 1 phút rồi Gen lại.' },
        { status: 429 },
      );
    }

    const body = (await req.json()) as {
      themeId?: unknown;
      readingLevelId?: unknown;
      packId?: unknown;
      words?: unknown;
      text?: unknown;
      title?: unknown;
      level?: unknown;
    };

    if (!isValidPackThemeId(body.themeId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chọn 1 chủ đề bao trùm tất cả các từ trước khi Gen AI.',
          themes: PACK_THEMES.map((t) => ({ id: t.id, labelVi: t.labelVi, emoji: t.emoji })),
        },
        { status: 400 },
      );
    }
    const themeId = body.themeId;

    const readingLevelId = isValidPackReadingLevelId(body.readingLevelId)
      ? body.readingLevelId
      : DEFAULT_PACK_READING_LEVEL_ID;

    let words = normalizePackWords(body.words);
    let title =
      typeof body.title === 'string' && isValidString(body.title, 100)
        ? body.title.trim()
        : undefined;

    if (typeof body.packId === 'string' && body.packId.trim()) {
      const pack = DEMO_PACKS.find((p) => p.id === body.packId);
      if (!pack) {
        return NextResponse.json(
          { success: false, error: `packId không tồn tại: ${body.packId}` },
          { status: 400 },
        );
      }
      if (words.length === 0) words = pack.words;
      title = title || pack.title;
    }

    if (words.length === 0 && typeof body.text === 'string') {
      words = parseWordListText(body.text);
    }

    if (words.length < PACK_PASSAGE_MIN_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Cần ≥${PACK_PASSAGE_MIN_WORDS} từ (nhận ${words.length}). Dán list "word | nghĩa" hoặc chọn pack mẫu.`,
        },
        { status: 400 },
      );
    }
    if (words.length > PACK_PASSAGE_MAX_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Tối đa ${PACK_PASSAGE_MAX_WORDS} từ / 1 đoạn (nhận ${words.length}). Bớt từ hoặc chia gói.`,
        },
        { status: 400 },
      );
    }

    console.log(
      `[PackPassage] gen theme=${themeId} level=${readingLevelId} words=${words.length} title=${title ?? '-'}`,
    );

    const data = await generatePackPassage(words, {
      themeId,
      readingLevelId,
      title,
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        wordCountInput: words.length,
        themeId,
        readingLevelId,
        onDemand: true,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PackPassage] failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
