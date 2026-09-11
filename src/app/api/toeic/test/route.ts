import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimitAsync, tooManyRequests } from '@/lib/api-security';
import {
  loadAnyToeicTest,
  loadFullToeicTest,
  loadToeicPartPractice,
  convertLegacyMiniTest,
  stripSensitiveToeicData,
  AUTHENTIC_TEST_METADATA,
  getToeicCatalogIndex,
  type ToeicPartPracticeOptions,
} from '@/lib/toeic-test-loader';
import {
  isHoneypotTestId,
  flagClientAsBot,
  isClientFlaggedAsBot,
  createPoisonedQuestionBank,
  poisonUnifiedQuestion,
  generateToeicSessionToken,
  hashIpForSession,
  isWhitelistedIp,
  clearBotFlag,
} from '@/lib/toeic-anti-scraping';
import type { ToeicPart, ToeicUnifiedQuestion } from '@/types/toeic';

const PART_RECOMMENDED_MINUTES: Record<ToeicPart, number> = {
  1: 4,
  2: 10,
  3: 17,
  4: 15,
  5: 12,
  6: 10,
  7: 55,
};

interface TestQueryParams {
  testId?: string;
  part?: string | number | null;
  limit?: string | number | null;
  time?: string | number | null;
  mode?: string | null;
  filterMode?: ToeicPartPracticeOptions['filterMode'] | string | null;
  excludedIds?: string[] | string | null;
  mistakeIds?: string[] | string | null;
  seed?: number | string | null;
  isHoneyDump?: boolean;
}

async function handleToeicTestRequest(
  ip: string,
  params: TestQueryParams,
  searchParams: URLSearchParams
) {
  const testId = params.testId || '6852';
  const cleanTestId = decodeURIComponent(testId).trim();

  // ── 0. BẪY HONEYPOT & ĐẦU ĐỘC DỮ LIỆU CÀO (ACTIVE DEFENSE) ──
  const isHoneyParam =
    params.isHoneyDump ||
    searchParams.has('dump') ||
    searchParams.has('include_answers') ||
    searchParams.has('full_dump') ||
    searchParams.has('all_answers');

  if (isHoneypotTestId(cleanTestId) || isHoneyParam) {
    flagClientAsBot(ip, `Hit Honeypot canary: ${cleanTestId}`);
    // Trả về dữ liệu rác đầu độc với mã HTTP 200 OK
    const poisonedCanary = createPoisonedQuestionBank(20, ip);
    return NextResponse.json({
      success: true,
      testId: cleanTestId,
      title: 'TOEIC ETS Simulation Canary Master',
      durationSeconds: 120 * 60,
      totalQuestions: poisonedCanary.length,
      questions: poisonedCanary,
      isCanary: true,
    });
  }

  // Nếu IP đã bị đánh dấu là bot từ trước -> âm thầm trả về dữ liệu đầu độc
  if (isClientFlaggedAsBot(ip)) {
    const genuine = loadAnyToeicTest(cleanTestId);
    const poisonTarget = genuine.length > 0 ? genuine : createPoisonedQuestionBank(30, ip);
    const poisonedQuestions = poisonTarget.map((q) => poisonUnifiedQuestion(q, ip));
    return NextResponse.json({
      success: true,
      testId: cleanTestId,
      title: 'TOEIC ETS Simulation Test',
      durationSeconds: 120 * 60,
      totalQuestions: poisonedQuestions.length,
      questions: poisonedQuestions,
      isPoisoned: true,
    });
  }

  let partNum: ToeicPart | null = null;
  if (params.part) {
    const p = parseInt(String(params.part), 10);
    if (p >= 1 && p <= 7) {
      partNum = p as ToeicPart;
    }
  }

  const limitNum = params.limit ? parseInt(String(params.limit), 10) : undefined;
  const timeParam = params.time ? String(params.time) : undefined;

  // Parse filter options
  const filterMode = (params.filterMode as ToeicPartPracticeOptions['filterMode']) || undefined;

  let parsedExcludedIds: string[] | undefined;
  if (params.excludedIds) {
    if (Array.isArray(params.excludedIds)) {
      parsedExcludedIds = params.excludedIds;
    } else if (typeof params.excludedIds === 'string') {
      try {
        parsedExcludedIds = params.excludedIds.startsWith('[')
          ? JSON.parse(params.excludedIds)
          : params.excludedIds.split(',').map((s) => s.trim()).filter(Boolean);
      } catch {
        parsedExcludedIds = params.excludedIds.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  let parsedMistakeIds: string[] | undefined;
  if (params.mistakeIds) {
    if (Array.isArray(params.mistakeIds)) {
      parsedMistakeIds = params.mistakeIds;
    } else if (typeof params.mistakeIds === 'string') {
      try {
        parsedMistakeIds = params.mistakeIds.startsWith('[')
          ? JSON.parse(params.mistakeIds)
          : params.mistakeIds.split(',').map((s) => s.trim()).filter(Boolean);
      } catch {
        parsedMistakeIds = params.mistakeIds.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  const seed =
    typeof params.seed === 'number'
      ? params.seed
      : params.seed
      ? parseInt(String(params.seed), 10)
      : undefined;

  const practiceOptions: ToeicPartPracticeOptions | undefined =
    filterMode || parsedExcludedIds || parsedMistakeIds || seed !== undefined
      ? {
          filterMode: filterMode || 'unseen',
          excludedIds: parsedExcludedIds,
          mistakeIds: parsedMistakeIds,
          seed,
        }
      : undefined;

  let questions: ToeicUnifiedQuestion[] = [];
  let title = '';
  let durationSeconds = 120 * 60;

  // 1. Check legacy mini-test
  const legacyQuestions = convertLegacyMiniTest(cleanTestId);
  if (legacyQuestions.length > 0) {
    questions = legacyQuestions;
    title = `TOEIC Mini Test (${cleanTestId})`;
    const minutes = timeParam ? parseInt(timeParam, 10) : 20;
    durationSeconds = minutes * 60;
  } else if (
    partNum &&
    (cleanTestId === 'all' ||
      cleanTestId === 'bank' ||
      cleanTestId === 'all-tests' ||
      cleanTestId === 'practice' ||
      cleanTestId === 'part-practice' ||
      (!cleanTestId.includes('part_') && !cleanTestId.includes('-set')))
  ) {
    // 2. Part practice mode on test bank or specific test with options forwarded
    questions = loadToeicPartPractice(partNum, cleanTestId, limitNum, true, practiceOptions);
    const isBank =
      cleanTestId === 'all' ||
      cleanTestId === 'bank' ||
      cleanTestId === 'all-tests' ||
      cleanTestId === 'practice' ||
      cleanTestId === 'part-practice';
    const catalog = getToeicCatalogIndex();
    const fullMetaLookup = catalog.fullTests?.find(
      (t) => t.id === cleanTestId || t.displayId.toLowerCase() === cleanTestId.toLowerCase()
    );
    const cleanFallbackLabel = cleanTestId
      .replace(/^estudyme-test-(\d+)/i, 'Đề ETS Simulation $1')
      .replace(/^study4_test_(\d+)/i, 'Đề ETS $1');
    const sourceLabel = isBank ? 'Ngân hàng đề' : (fullMetaLookup?.title || cleanFallbackLabel);
    title = `Luyện tập Part ${partNum} (${questions.length} câu — ${sourceLabel})`;
    const minutes = timeParam
      ? parseInt(timeParam, 10)
      : Math.max(5, Math.ceil(questions.length * ((PART_RECOMMENDED_MINUTES[partNum] || 15) / 25)));
    durationSeconds = minutes * 60;
  } else {
    // 3. Dynamic universal test load (supports authentic ETS simulation tests)
    questions = loadAnyToeicTest(cleanTestId);

    if (partNum && questions.some((q) => q.part !== partNum)) {
      questions = questions.filter((q) => q.part === partNum);
    }
    if (limitNum && limitNum > 0 && questions.length > limitNum) {
      questions = questions.slice(0, limitNum);
    }

    // Catalog metadata lookup for title and time estimate
    const catalog = getToeicCatalogIndex();
    const fullMeta = catalog.fullTests?.find(
      (t) => t.id === cleanTestId || t.displayId.toLowerCase() === cleanTestId.toLowerCase()
    );

    let practiceMeta: any = null;
    if (!fullMeta && catalog.practiceParts) {
      for (const pKey of Object.keys(catalog.practiceParts)) {
        const item = catalog.practiceParts[pKey]?.find(
          (x) =>
            x.id.toLowerCase() === cleanTestId.toLowerCase() ||
            `estudyme-p${x.part}-set${x.setNumber}`.toLowerCase() === cleanTestId.toLowerCase()
        );
        if (item) {
          practiceMeta = item;
          break;
        }
      }
    }

    if (practiceMeta) {
      title = practiceMeta.title;
      const minutes = timeParam ? parseInt(timeParam, 10) : practiceMeta.durationMinutes;
      durationSeconds = minutes * 60;
    } else if (fullMeta) {
      title = fullMeta.title;
      const minutes = timeParam ? parseInt(timeParam, 10) : fullMeta.durationMinutes;
      durationSeconds = minutes * 60;
    } else {
      const meta = AUTHENTIC_TEST_METADATA.find((t) => t.testId === cleanTestId);
      const cleanDisplay = cleanTestId
        .replace(/^estudyme-test-(\d+)/i, 'ETS Simulation $1')
        .replace(/^study4_test_(\d+)/i, 'ETS $1');
      title = meta?.title || `Đề thi TOEIC LR (${cleanDisplay})`;
      const minutes = timeParam ? parseInt(timeParam, 10) : 120;
      durationSeconds = minutes * 60;
    }
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { success: false, error: `Test "${cleanTestId}" not found or empty` },
      { status: 404 }
    );
  }

  // ── ACTIVE ANTI-SCRAPING: ZERO BULK LEAKS ──
  const deliveredQuestions = stripSensitiveToeicData(questions);

  // Cấp token phiên làm bài có chữ ký HMAC gắn với IP hash và testId
  const sessionToken = generateToeicSessionToken({
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    testId: cleanTestId,
    ipHash: hashIpForSession(ip),
    issuedAt: Date.now(),
  });

  return NextResponse.json(
    {
      success: true,
      testId: cleanTestId,
      title,
      durationSeconds,
      totalQuestions: deliveredQuestions.length,
      questions: deliveredQuestions,
      sessionToken,
      part: partNum ?? undefined,
      filterMode: practiceOptions?.filterMode || filterMode || undefined,
    },
    {
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    }
  );
}

/**
 * GET /api/toeic/test
 * Public test loader endpoint with anti-scraping protection.
 * Completely strips correctAnswer, explanationVi, and transcript from the payload.
 *
 * Query params:
 * - testId: e.g. '6852', 'estudyme-test-1', 'estudyme-p5-set1', or legacy mini-test id
 * - part: optional number 1 to 7 for part practice
 * - mode: optional 'real' | 'practice'
 * - filterMode: optional 'unseen' | 'mistakes' | 'all_random'
 * - excludedIds / exclude: optional comma-separated or JSON array of question IDs
 * - mistakeIds / mistakes: optional comma-separated or JSON array of question IDs
 * - seed: optional deterministic seed
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Auto-unban localhost or explicitly requested reset
    if (isWhitelistedIp(ip) || req.nextUrl.searchParams.get('unban') === '1') {
      clearBotFlag(ip);
    }

    // Rate limit: 60 test load requests per minute per IP
    const rl = await checkRateLimitAsync(`toeic-test:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const { searchParams } = req.nextUrl;
    return await handleToeicTestRequest(
      ip,
      {
        testId: searchParams.get('testId') || '6852',
        part: searchParams.get('part'),
        limit: searchParams.get('limit'),
        time: searchParams.get('time'),
        mode: searchParams.get('mode'),
        filterMode: searchParams.get('filterMode'),
        excludedIds: searchParams.get('excludedIds') || searchParams.get('exclude'),
        mistakeIds: searchParams.get('mistakeIds') || searchParams.get('mistakes'),
        seed: searchParams.get('seed'),
      },
      searchParams
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load test';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * POST /api/toeic/test
 * Public test loader endpoint supporting large excludedIds / mistakeIds payloads.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Auto-unban localhost or explicitly requested reset
    if (isWhitelistedIp(ip) || req.nextUrl.searchParams.get('unban') === '1') {
      clearBotFlag(ip);
    }

    // Rate limit: 60 test load requests per minute per IP
    const rl = await checkRateLimitAsync(`toeic-test:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = await req.json().catch(() => ({}));
    const { searchParams } = req.nextUrl;

    return await handleToeicTestRequest(
      ip,
      {
        testId: body.testId || searchParams.get('testId') || '6852',
        part: body.part ?? searchParams.get('part'),
        limit: body.limit ?? searchParams.get('limit'),
        time: body.time ?? searchParams.get('time'),
        mode: body.mode ?? searchParams.get('mode'),
        filterMode: body.filterMode ?? searchParams.get('filterMode'),
        excludedIds: body.excludedIds ?? searchParams.get('excludedIds') ?? searchParams.get('exclude'),
        mistakeIds: body.mistakeIds ?? searchParams.get('mistakeIds') ?? searchParams.get('mistakes'),
        seed: body.seed ?? searchParams.get('seed'),
        isHoneyDump: Boolean(body.dump || body.include_answers || body.full_dump || body.all_answers),
      },
      searchParams
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load test';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
