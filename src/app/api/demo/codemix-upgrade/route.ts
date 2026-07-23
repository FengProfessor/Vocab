import { NextResponse } from 'next/server';
import {
  offlineCodeMixUpgrade,
  upgradeCodeMixToEnglish,
  CODEMIX_MAX_WORDS,
  CODEMIX_MIN_WORDS,
  type CodeMixWord,
} from '@/lib/codemix-upgrade';
import {
  getClientIp,
  checkRateLimit,
  isValidString,
  getAuthUser,
} from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';
import {
  resolvePlanByUserId,
  checkAndConsumeCodemixUpgrade,
  FREE_CODEMIX_UPGRADE_DAILY_LIMIT,
  type Plan,
} from '@/lib/entitlement';

export const maxDuration = 60;

/**
 * POST /api/demo/codemix-upgrade
 * Body: { text, words, level?, offline? }
 *
 * Quota (luôn enforce):
 * - Free / ẩn danh: FREE_CODEMIX_UPGRADE_DAILY_LIMIT (1) lượt AI / ~24h
 * - Pro/premium: unlimited
 * - offline=true: không trừ lượt (fallback demo)
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`demo-codemix-burst:${ip}`, 12, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều request. Đợi 1 phút.' },
        { status: 429 }
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
        console.warn('[CodeMixUpgrade] resolvePlan failed:', e);
        plan = 'free';
      }
    }

    const body = (await req.json()) as {
      text?: unknown;
      words?: unknown;
      level?: unknown;
      offline?: unknown;
    };

    const text =
      typeof body.text === 'string' && isValidString(body.text, 2200)
        ? body.text.trim()
        : '';
    if (text.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Cần đoạn code-mix ≥ ~12 ký tự.' },
        { status: 400 }
      );
    }

    const words: CodeMixWord[] = [];
    if (Array.isArray(body.words)) {
      for (const item of body.words) {
        if (!item || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const word = typeof o.word === 'string' ? o.word.trim() : '';
        if (!word || word.length > 40) continue;
        const posRaw =
          typeof o.pos === 'string'
            ? o.pos.trim().slice(0, 12)
            : typeof o.partOfSpeech === 'string'
              ? o.partOfSpeech.trim().slice(0, 12)
              : undefined;
        words.push({
          word,
          translation:
            typeof o.translation === 'string'
              ? o.translation.trim().slice(0, 80)
              : typeof o.vi === 'string'
                ? o.vi.trim().slice(0, 80)
                : undefined,
          pos: posRaw || undefined,
        });
        if (words.length >= CODEMIX_MAX_WORDS) break;
      }
    }

    if (words.length < CODEMIX_MIN_WORDS || words.length > CODEMIX_MAX_WORDS) {
      return NextResponse.json(
        {
          success: false,
          error: `Chọn ${CODEMIX_MIN_WORDS}–${CODEMIX_MAX_WORDS} từ (nhận ${words.length}).`,
        },
        { status: 400 }
      );
    }

    const level =
      typeof body.level === 'string' && isValidString(body.level, 20)
        ? body.level.trim()
        : 'A1-A2';

    const forceOffline = body.offline === true;

    // Offline demo: không trừ quota Pro teaser
    if (forceOffline) {
      const data = offlineCodeMixUpgrade(text, words);
      return NextResponse.json({
        success: true,
        data,
        offline: true,
        quota: {
          plan,
          limit: plan === 'free' ? FREE_CODEMIX_UPGRADE_DAILY_LIMIT : null,
          remaining: plan === 'free' ? null : null,
          isPro: plan !== 'free',
          counted: false,
        },
      });
    }

    // Live AI: trừ lượt Free
    const quota = await checkAndConsumeCodemixUpgrade(userId, plan, ip);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'CODEMIX_DAILY_LIMIT',
          message: `Free còn 0/${FREE_CODEMIX_UPGRADE_DAILY_LIMIT} lượt AI nâng đoạn hôm nay. Nâng Pro để không giới hạn.`,
          upgradeTo: quota.upgradeTo ?? 'pro',
          quota: {
            plan: 'free',
            used: quota.used ?? FREE_CODEMIX_UPGRADE_DAILY_LIMIT,
            limit: FREE_CODEMIX_UPGRADE_DAILY_LIMIT,
            remaining: 0,
            isPro: false,
            counted: false,
          },
        },
        { status: 403 }
      );
    }

    const quotaPayload = {
      plan,
      used: quota.used ?? 0,
      limit: quota.limit ?? null,
      remaining: quota.remaining ?? null,
      isPro: plan !== 'free',
      counted: plan === 'free',
    };

    // Pro → Gemini (nhanh/chất hơn); Free → Zhipu
    const isPro = plan !== 'free';
    const preferGemini = isPro;

    console.log(
      `[CodeMixUpgrade] plan=${plan} gemini=${preferGemini} words=${words.length} level=${level}`,
    );

    try {
      const data = await upgradeCodeMixToEnglish(text, words, {
        level,
        preferGemini,
      });
      return NextResponse.json({
        success: true,
        data,
        offline: false,
        quota: {
          ...quotaPayload,
          provider: data.meta?.providerNote ?? (preferGemini ? 'gemini' : 'zhipu'),
        },
      });
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.warn('[CodeMixUpgrade] AI fail → offline:', msg);
      // Đã trừ lượt Free khi AI fail — vẫn trả offline (user đã “dùng” 1 attempt)
      const data = offlineCodeMixUpgrade(text, words);
      return NextResponse.json({
        success: true,
        data,
        offline: true,
        aiError: msg.slice(0, 200),
        quota: quotaPayload,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CodeMixUpgrade] failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
