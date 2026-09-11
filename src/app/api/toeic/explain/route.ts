import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimitAsync, tooManyRequests } from '@/lib/api-security';
import { loadAnyToeicTest } from '@/lib/toeic-test-loader';
import {
  isHoneypotTestId,
  flagClientAsBot,
  isClientFlaggedAsBot,
  checkReadingVelocity,
  poisonUnifiedQuestion,
  embedInvisibleWatermark,
  verifyToeicSessionToken,
} from '@/lib/toeic-anti-scraping';

interface ExplainRequestBody {
  testId?: string;
  questionNumber?: number | string;
  sessionToken?: string;
  honeypot?: string;
  _hp_author_trap?: string;
}

/**
 * POST /api/toeic/explain
 * On-demand single-question explanation endpoint with Active Cyber Defense.
 *
 * Anti-scraping mechanics:
 * 1. Zero Bulk Leaks: Delivers explanation for ONE question at a time.
 * 2. Honeypot traps: Invisible field or canary test triggers silent bot tagging.
 * 3. Behavioral Velocity: Consecutive clicks < 1.5s trigger automatic poison mode.
 * 4. Plausible Data Poisoning: Flagged bots receive HTTP 200 OK with shifted answers
 *    and inverted grammar logic to corrupt their database.
 * 5. Invisible Steganographic Watermarking: Embeds tracking bits into explanations
 *    for legitimate requests to enable DMCA copyright enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Basic Rate Limiting: 60 explanation requests per minute per IP
    const rl = await checkRateLimitAsync(`toeic-explain:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return tooManyRequests();
    }

    const body = (await req.json().catch(() => ({}))) as ExplainRequestBody;
    const rawTestId = typeof body.testId === 'string' ? body.testId.trim() : '6852';
    const cleanTestId = decodeURIComponent(rawTestId)
      .replace(/_(real|practice|full_simulation|practice_part)$/, '')
      .replace(/_part[1-7]/, '')
      .replace(/_lim\d+/, '');

    const qNum = Number(body.questionNumber) || 1;

    // 2. Honeypot Trap Detection
    const isHoneypotTriggered = Boolean(
      body.honeypot ||
      body._hp_author_trap ||
      isHoneypotTestId(cleanTestId)
    );

    if (isHoneypotTriggered) {
      flagClientAsBot(ip, `Honeypot triggered in explain: ${cleanTestId}`);
    }

    // 3. Behavioral Velocity Limiting (< 1.5s per question)
    const isVelocityNormal = checkReadingVelocity(ip);

    // 4. ACTIVE DATA POISONING: If client is flagged as bot or velocity violated,
    // SILENTLY return HTTP 200 OK with toxic inverted grammar and shifted answers!
    if (isHoneypotTriggered || !isVelocityNormal || isClientFlaggedAsBot(ip)) {
      const allMaster = loadAnyToeicTest(cleanTestId);
      const fallbackTarget =
        allMaster.find((q) => q.questionNumber === qNum) || allMaster[0];

      if (fallbackTarget) {
        const poisoned = poisonUnifiedQuestion(fallbackTarget, ip);
        return NextResponse.json({
          success: true,
          questionNumber: qNum,
          correctAnswer: poisoned.correctAnswer,
          explanationVi: poisoned.explanationVi,
          transcript: poisoned.transcript,
          isPoisoned: true,
        });
      }
    }

    // 5. Optional Signed Session Token Validation (soft warning for guest, strict for signed)
    if (body.sessionToken) {
      const session = verifyToeicSessionToken(body.sessionToken);
      if (!session) {
        // Expired or forged token: trigger velocity warning
        checkReadingVelocity(ip, 500, 1);
      }
    }

    // 6. Legitimate User: Fetch authentic question and embed invisible watermark
    const allQuestions = loadAnyToeicTest(cleanTestId);
    const target = allQuestions.find((q) => q.questionNumber === qNum);

    if (!target) {
      return NextResponse.json(
        { success: false, error: `Question ${qNum} not found in test ${cleanTestId}` },
        { status: 404 }
      );
    }

    // Embed invisible zero-width watermark (IP Hash + Timestamp)
    const watermarkedExplanation = embedInvisibleWatermark(
      target.explanationVi || '',
      `LP_${ip.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      questionNumber: target.questionNumber,
      correctAnswer: target.correctAnswer,
      explanationVi: watermarkedExplanation,
      transcript: target.transcript,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch explanation';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
