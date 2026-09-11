import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimitAsync, tooManyRequests, getAuthUser } from '@/lib/api-security';
import { createServiceClient } from '@/lib/supabase';
import {
  loadAnyToeicTest,
  loadFullToeicTest,
  loadToeicPartPractice,
  convertLegacyMiniTest,
} from '@/lib/toeic-test-loader';
import { calculateToeicScore } from '@/lib/toeic-scoring';
import {
  flagClientAsBot,
  isClientFlaggedAsBot,
  poisonUnifiedQuestion,
  embedInvisibleWatermark,
  isWhitelistedIp,
  clearBotFlag,
} from '@/lib/toeic-anti-scraping';
import type {
  ToeicPart,
  ToeicExamMode,
  ToeicOptionKey,
  ToeicUnifiedQuestion,
} from '@/types/toeic';

interface SubmitRequestBody {
  testId?: string;
  examMode?: ToeicExamMode;
  part?: ToeicPart | number;
  limit?: number;
  answers?: Record<number, ToeicOptionKey>;
  timeSpentSeconds?: number;
  honeypot?: string;
  _hp_trap?: string;
  _hp_author_code?: string;
}

/**
 * POST /api/toeic/submit
 * Secure server-side submit & scoring endpoint.
 *
 * Anti-scraping defenses:
 * 1. Rate limiting (20 requests/minute per IP)
 * 2. Invisible honeypot field trap detection (rejection if bot populates)
 * 3. Dummy question boundary check (answers at index <= 0 or > 200 trigger drop)
 * 4. Master key scoring: answers evaluated securely against server-side dataset
 * 5. Explanations and transcripts returned ONLY after valid submission
 * 6. Authenticated user exam history saved to database (user_roadmap_assessments)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Auto-unban localhost or whitelisted IPs
    if (isWhitelistedIp(ip)) {
      clearBotFlag(ip);
    }

    // 1. Rate Limiting: 20 submit requests per minute per IP
    const rl = await checkRateLimitAsync(`toeic-submit:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = (await req.json().catch(() => ({}))) as SubmitRequestBody;

    // 2. Honeypot Trap Detection & Boundary Tampering Check
    // Bots scanning forms fill hidden inputs or inject out-of-bound keys.
    const isHoneypotTriggered = Boolean(
      body.honeypot ||
      body._hp_trap ||
      body._hp_author_code
    );

    const answerKeys = body.answers ? Object.keys(body.answers).map(Number) : [];
    const hasOutOfBoundsQuestion = answerKeys.some(
      (k) => Number.isNaN(k) || k <= 0 || k > 200 || k === 999 || k === 9999
    );

    if (isHoneypotTriggered || hasOutOfBoundsQuestion) {
      console.warn(`[Anti-Scraping] Honeypot / tampering triggered by IP: ${ip}`);
      flagClientAsBot(ip, 'Honeypot trap or out-of-bounds keys in submit');
    }

    const rawTestId = body.testId ? decodeURIComponent(body.testId).trim() : '6852';
    // Clean testId if mode suffix was attached (e.g. '6852_real' -> '6852')
    const testId = rawTestId
      .replace(/_(real|practice|full_simulation|practice_part)$/, '')
      .replace(/_part[1-7]/, '')
      .replace(/_lim\d+/, '');
    const examMode: ToeicExamMode = body.examMode || 'real';
    const answers = body.answers || {};
    const timeSpentSeconds = Math.max(0, Number(body.timeSpentSeconds) || 0);

    let partNum: ToeicPart | null = null;
    if (body.part) {
      const p = Number(body.part);
      if (p >= 1 && p <= 7) {
        partNum = p as ToeicPart;
      }
    }

    const limitNum = body.limit ? Number(body.limit) : undefined;

    // 3. Load Master Questions on Server (with correctAnswer, explanationVi, transcript)
    let masterQuestions: ToeicUnifiedQuestion[] = [];
    const legacyQuestions = convertLegacyMiniTest(testId);

    if (legacyQuestions.length > 0) {
      masterQuestions = legacyQuestions;
    } else if (
      partNum &&
      (testId === 'all' ||
        testId === 'bank' ||
        testId === 'all-tests' ||
        testId === 'practice' ||
        testId === 'part-practice' ||
        (!testId.includes('part_') && !testId.includes('-set')))
    ) {
      masterQuestions = loadToeicPartPractice(partNum, testId, limitNum, true);
    } else {
      masterQuestions = loadAnyToeicTest(testId);
      if (partNum && masterQuestions.some((q) => q.part !== partNum)) {
        masterQuestions = masterQuestions.filter((q) => q.part === partNum);
      }
      if (limitNum && limitNum > 0 && masterQuestions.length > limitNum) {
        masterQuestions = masterQuestions.slice(0, limitNum);
      }
    }

    if (masterQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: `Test "${testId}" not found` },
        { status: 404 }
      );
    }

    // 4. Server-side Scoring Engine (Official ETS 0-990 barem calculation)
    const scoreResult = calculateToeicScore(answers, masterQuestions, timeSpentSeconds);

    // 5. Authenticated User Persistence
    const auth = await getAuthUser(req);
    let savedToHistory = false;

    if (auth?.userId) {
      try {
        const supabase = createServiceClient();
        const scorePct = masterQuestions.length > 0
          ? Math.round((scoreResult.rawTotal / masterQuestions.length) * 100)
          : 0;

        const tier = examMode === 'real' ? 'exit_exam' : 'checkpoint';
        const targetId = partNum ? `toeic-${testId}-part${partNum}` : `toeic-${testId}`;

        const { error: dbError } = await supabase.from('user_roadmap_assessments').insert({
          user_id: auth.userId,
          track: 'toeic',
          tier,
          target_id: targetId,
          score: scorePct,
          passed: scoreResult.scaledTotal >= 450,
          details: {
            scoreResult,
            testId,
            examMode,
            part: partNum,
            rawTotal: scoreResult.rawTotal,
            scaledTotal: scoreResult.scaledTotal,
            cefrLevel: scoreResult.cefrLevel,
            timeSpentSeconds,
            submittedAt: new Date().toISOString(),
          },
        });

        if (!dbError) {
          savedToHistory = true;
        } else {
          console.warn('[TOEIC Submit] Supabase assessment insert error:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('[TOEIC Submit] Database connection error:', dbErr);
      }
    }

    // 6. Active Cyber Defense: Check suspicious submit dumping
    // Only flag as bot if an impossible number of questions were answered in under 5 seconds
    const answeredCount = Object.keys(answers).length;
    const isFastSubmitDump = answeredCount >= 50 && timeSpentSeconds < 5;
    if (isFastSubmitDump && !isWhitelistedIp(ip)) {
      flagClientAsBot(ip, `Fast submit dumping: ${timeSpentSeconds}s for ${answeredCount} answered questions`);
    }

    const isPoisonedTarget =
      isHoneypotTriggered ||
      hasOutOfBoundsQuestion ||
      isFastSubmitDump ||
      isClientFlaggedAsBot(ip);

    if (isPoisonedTarget) {
      const poisonedReview = masterQuestions.map((q) => poisonUnifiedQuestion(q, ip));
      return NextResponse.json({
        success: true,
        scoreResult,
        reviewQuestions: poisonedReview,
        savedToHistory: false,
        isGuest: true,
        isPoisoned: true,
      });
    }

    // 7. Legitimate User: Return Official Score & Watermarked Master Questions for Review Mode
    const watermarkedReview = masterQuestions.map((q) => ({
      ...q,
      explanationVi: embedInvisibleWatermark(
        q.explanationVi || '',
        `UID_${auth?.userId || 'guest'}_${Date.now()}`
      ),
    }));

    return NextResponse.json({
      success: true,
      scoreResult,
      reviewQuestions: watermarkedReview,
      savedToHistory,
      isGuest: !auth?.userId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error during submission';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
