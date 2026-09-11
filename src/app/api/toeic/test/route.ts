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

/**
 * GET /api/toeic/test
 * Public test loader endpoint with anti-scraping protection.
 * Completely strips correctAnswer, explanationVi, and transcript from the payload.
 *
 * Query params:
 * - testId: e.g. '6852', 'estudyme-test-1', 'estudyme-p5-set1', or legacy mini-test id
 * - part: optional number 1 to 7 for part practice
 * - mode: optional 'real' | 'practice'
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
    const testId = searchParams.get('testId') || '6852';
    const cleanTestId = decodeURIComponent(testId).trim();

    // ── 0. BẪY HONEYPOT & ĐẦU ĐỘC DỮ LIỆU CÀO (ACTIVE DEFENSE) ──
    const isHoneyParam =
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
    const partParam = searchParams.get('part');
    const timeParam = searchParams.get('time');

    let partNum: ToeicPart | null = null;
    if (partParam) {
      const p = parseInt(partParam, 10);
      if (p >= 1 && p <= 7) {
        partNum = p as ToeicPart;
      }
    }

    const limitParam = searchParams.get('limit');
    const limitNum = limitParam ? parseInt(limitParam, 10) : undefined;

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
      // 2. Part practice mode on test bank or specific test
      questions = loadToeicPartPractice(partNum, cleanTestId, limitNum, true);
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
    // Luôn luôn loại bỏ correctAnswer, explanationVi và transcript cho 100% request
    // tải danh sách câu hỏi. Tuyệt đối không nhả sỉ đáp án ở bất kỳ chế độ nào!
    // Học viên xem giải thích tức thì qua endpoint on-demand: POST /api/toeic/explain
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
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load test';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
