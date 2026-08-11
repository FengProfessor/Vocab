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
import {
  getClientIp,
  checkRateLimit,
  isValidString,
  getAuthUser,
} from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

let prebuiltCache: Record<string, any> | null = null;
function getPrebuiltPassages(): Record<string, any> {
  if (prebuiltCache) return prebuiltCache;
  const candidates = [
    path.join(process.cwd(), 'src', 'data', 'vocab', 'prebuilt-pack-passages.json'),
    path.join(process.cwd(), 'data', 'vocab', 'prebuilt-pack-passages.json'),
    path.resolve(__dirname, '../../../../../../src/data/vocab/prebuilt-pack-passages.json'),
    path.resolve(__dirname, '../../../../../src/data/vocab/prebuilt-pack-passages.json'),
    path.resolve(__dirname, '../../../../src/data/vocab/prebuilt-pack-passages.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        prebuiltCache = JSON.parse(content);
        console.log(`[PackPassage] Loaded prebuilt passages from: ${filePath}`);
        return prebuiltCache || {};
      }
    } catch (e) {
      console.warn(`[PackPassage] Path check failed for ${filePath}:`, e);
    }
  }
  return {};
}
import {
  FREE_PACK_READING_DAILY_LIMIT,
  type Plan,
} from '@/lib/entitlement';
import {
  resolvePlanByUserId,
  checkAndConsumePackReading,
} from '@/lib/entitlement-server';

/** Gen AI + retry length có thể >60s */
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

/**
 * GET  /api/practice/pack-passage → themes + levels + packs + quota hint
 * POST /api/practice/pack-passage → gen on-demand
 *
 * Free: 2 gen/ngày · Zhipu (chậm)
 * Pro:  ∞ · Gemini multi-key (nhanh), fallback Zhipu
 */
export async function GET(req: Request): Promise<NextResponse> {
  const auth = await getAuthUser(req);
  let plan: Plan = 'free';
  let quota: {
    plan: Plan;
    limit: number | null;
    remaining: number | null;
    isPro: boolean;
  } = {
    plan: 'free',
    limit: FREE_PACK_READING_DAILY_LIMIT,
    remaining: FREE_PACK_READING_DAILY_LIMIT,
    isPro: false,
  };

  if (auth?.userId) {
    try {
      const supabase = createServiceClient();
      plan = await resolvePlanByUserId(supabase, auth.userId);
      if (plan !== 'free') {
        quota = { plan, limit: null, remaining: null, isPro: true };
      }
    } catch {
      /* free default */
    }
  }

  return NextResponse.json({
    success: true,
    themes: PACK_THEMES,
    readingLevels: PACK_READING_LEVELS,
    defaultReadingLevelId: DEFAULT_PACK_READING_LEVEL_ID,
    minWords: PACK_PASSAGE_MIN_WORDS,
    maxWords: PACK_PASSAGE_MAX_WORDS,
    freeDailyLimit: FREE_PACK_READING_DAILY_LIMIT,
    quota,
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

    const auth = await getAuthUser(req);
    const userId = auth?.userId ?? null;

    let plan: Plan = 'free';
    if (userId) {
      try {
        const supabase = createServiceClient();
        plan = await resolvePlanByUserId(supabase, userId);
      } catch (e) {
        console.warn('[PackPassage] resolvePlan failed:', e);
        plan = 'free';
      }
    }

    const isPro = plan !== 'free';

    // Free: 2/ngày; Pro: ∞
    const quota = await checkAndConsumePackReading(userId, plan, ip);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'PACK_READING_DAILY_LIMIT',
          message: `Free hết ${FREE_PACK_READING_DAILY_LIMIT} lượt tạo đoạn đọc hôm nay. Nâng Pro để Gen nhanh (Gemini) không giới hạn.`,
          upgradeTo: 'pro',
          quota: {
            plan: 'free',
            used: FREE_PACK_READING_DAILY_LIMIT,
            limit: FREE_PACK_READING_DAILY_LIMIT,
            remaining: 0,
            isPro: false,
            counted: false,
            provider: 'zhipu',
          },
        },
        { status: 403 },
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
      const prebuiltStore = getPrebuiltPassages();
      const prebuilt = prebuiltStore[body.packId.trim()];
      if (prebuilt) {
        return NextResponse.json({
          success: true,
          data: prebuilt,
          meta: {
            prebuilt: true,
            fastLookup: true,
            latencyMs: 0
          }
        });
      }
      const pack = DEMO_PACKS.find((p) => p.id === body.packId);
      if (pack) {
        if (words.length === 0) words = pack.words;
        title = title || pack.title;
      }
    }

    if (words.length === 0 && typeof body.text === 'string') {
      words = parseWordListText(body.text);
    }

    if (words.length < PACK_PASSAGE_MIN_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Cần ≥${PACK_PASSAGE_MIN_WORDS} từ (nhận ${words.length}).`,
        },
        { status: 400 },
      );
    }
    if (words.length > PACK_PASSAGE_MAX_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Tối đa ${PACK_PASSAGE_MAX_WORDS} từ / 1 đoạn (nhận ${words.length}).`,
        },
        { status: 400 },
      );
    }

    // Free → Zhipu chậm; Pro → Gemini nhanh
    const preferGemini = isPro;

    console.log(
      `[PackPassage] gen plan=${plan} gemini=${preferGemini} theme=${themeId} level=${readingLevelId} words=${words.length}`,
    );

    const data = await generatePackPassage(words, {
      themeId,
      readingLevelId,
      title,
      preferGemini,
    });

    return NextResponse.json({
      success: true,
      data,
      meta: {
        wordCountInput: words.length,
        themeId,
        readingLevelId,
        onDemand: true,
        plan,
        provider: preferGemini ? 'gemini' : 'zhipu',
      },
      quota: {
        plan,
        used: quota.used ?? 0,
        limit: isPro ? null : FREE_PACK_READING_DAILY_LIMIT,
        remaining: isPro ? null : (quota.remaining ?? 0),
        isPro,
        counted: !isPro,
        provider: preferGemini ? 'gemini' : 'zhipu',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PackPassage] failed:', msg);
    return NextResponse.json(
      {
        success: false,
        error:
          msg.includes('timeout') || msg.includes('Timeout')
            ? 'Gen quá lâu / timeout. Thử cấp độ thấp hơn hoặc ít từ hơn (8–12 từ).'
            : msg.slice(0, 400) || 'Gen thất bại',
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
