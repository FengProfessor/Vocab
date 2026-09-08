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
    // Rate limit: 60 test load requests per minute per IP
    const rl = await checkRateLimitAsync(`toeic-test:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const { searchParams } = req.nextUrl;
    const testId = searchParams.get('testId') || '6852';
    const cleanTestId = decodeURIComponent(testId).trim();
    const partParam = searchParams.get('part');
    const timeParam = searchParams.get('time');

    let partNum: ToeicPart | null = null;
    if (partParam) {
      const p = parseInt(partParam, 10);
      if (p >= 1 && p <= 7) {
        partNum = p as ToeicPart;
      }
    }

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
    } else if (partNum && !cleanTestId.includes('part_') && !cleanTestId.includes('-set')) {
      // 2. Part practice mode on full test (e.g. ?testId=6852&part=1 or ?testId=estudyme-test-1&part=2)
      questions = loadToeicPartPractice(partNum, cleanTestId);
      title = `Luyện tập TOEIC Part ${partNum} (${cleanTestId})`;
      const minutes = timeParam
        ? parseInt(timeParam, 10)
        : PART_RECOMMENDED_MINUTES[partNum] || 15;
      durationSeconds = minutes * 60;
    } else {
      // 3. Dynamic universal test load (supports Estudyme full tests, practice sets, Study4 tests)
      questions = loadAnyToeicTest(cleanTestId);

      if (partNum && questions.some((q) => q.part !== partNum)) {
        questions = questions.filter((q) => q.part === partNum);
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
        title = meta?.title || `Đề thi TOEIC LR (${cleanTestId})`;
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

    // Anti-scraping: strip sensitive data (correctAnswer, explanationVi, transcript)
    const sanitizedQuestions = stripSensitiveToeicData(questions);

    return NextResponse.json(
      {
        success: true,
        testId: cleanTestId,
        title,
        durationSeconds,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load test';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
