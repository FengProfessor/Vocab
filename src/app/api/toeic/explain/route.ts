import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, checkRateLimitAsync, tooManyRequests } from '@/lib/api-security';
import {
  loadAnyToeicTest,
  loadToeicQuestionsByIds,
  loadToeicPartPractice,
} from '@/lib/toeic-test-loader';
import type { ToeicPart, ToeicUnifiedQuestion } from '@/types/toeic';
import {
  isHoneypotTestId,
  flagClientAsBot,
  isClientFlaggedAsBot,
  checkReadingVelocity,
  poisonUnifiedQuestion,
  embedInvisibleWatermark,
  verifyToeicSessionToken,
  isWhitelistedIp,
  clearBotFlag,
} from '@/lib/toeic-anti-scraping';

interface ExplainRequestBody {
  testId?: string;
  questionNumber?: number | string;
  questionId?: string;
  part?: number | string;
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

    // Auto-unban localhost or explicitly requested reset
    if (isWhitelistedIp(ip) || req.nextUrl.searchParams.get('unban') === '1') {
      clearBotFlag(ip);
    }

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

    // 3. Behavioral Velocity Limiting (Protects against programmatic scrapers)
    checkReadingVelocity(ip, 300, 10);

    // 4. ACTIVE DATA POISONING: ONLY trigger if client hit a honeypot trap or is an identified bot!
    // Legitimate users clicking fast or toggling explanations will NEVER receive poisoned data!
    if (isHoneypotTriggered || isClientFlaggedAsBot(ip)) {
      const allMaster = loadAnyToeicTest(cleanTestId);
      const targetPart = body.part ? Number(body.part) : undefined;
      const filteredMaster = targetPart ? allMaster.filter((q) => q.part === targetPart) : allMaster;
      const fallbackTarget =
        filteredMaster.find((q) => q.questionNumber === qNum) || filteredMaster[0] || allMaster[0];

      if (fallbackTarget) {
        const poisoned = poisonUnifiedQuestion(fallbackTarget, ip);
        return NextResponse.json({
          success: true,
          questionNumber: qNum,
          questionId: fallbackTarget.id,
          part: fallbackTarget.part,
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
    let target: ToeicUnifiedQuestion | undefined;
    const requiredPart = body.part ? Number(body.part) : undefined;
    const rawQuestionId = typeof body.questionId === 'string' ? body.questionId.trim() : undefined;
    const normalizedQuestionId = rawQuestionId
      ? rawQuestionId.startsWith('q-')
        ? rawQuestionId
        : rawQuestionId.match(/^([a-zA-Z0-9_-]+)-q(\d+)$/)
        ? `q-${rawQuestionId.replace(/-q(\d+)$/, '-$1')}`
        : rawQuestionId
      : undefined;

    // A. Priority 1: Match by unique question ID (100% accurate across all 15,000+ questions)
    if (normalizedQuestionId) {
      const found = loadToeicQuestionsByIds([normalizedQuestionId]);
      if (found.length > 0 && found[0].testId !== 'synthetic') {
        if (!requiredPart || found[0].part === requiredPart) {
          target = found[0];
        }
      }
    }

    // B. Priority 2: Match in specific test
    if (!target && cleanTestId && cleanTestId !== 'bank' && cleanTestId !== 'all') {
      const allQuestions = loadAnyToeicTest(cleanTestId);
      target = allQuestions.find((q) => {
        if (
          normalizedQuestionId &&
          (q.id === normalizedQuestionId || (rawQuestionId && q.id === rawQuestionId))
        ) {
          return !requiredPart || q.part === requiredPart;
        }
        return requiredPart
          ? q.part === requiredPart && q.questionNumber === qNum
          : q.questionNumber === qNum;
      });
    }

    // C. Priority 3: Match in part practice with renumber = true (matching client 1..N indexing)
    if (!target && requiredPart) {
      const pNum = requiredPart as ToeicPart;
      const partPractice = loadToeicPartPractice(pNum, cleanTestId || 'bank', 100, true);
      target = partPractice.find(
        (q) =>
          ((normalizedQuestionId &&
            (q.id === normalizedQuestionId || (rawQuestionId && q.id === rawQuestionId))) ||
            q.questionNumber === qNum) &&
          q.part === pNum
      );
    }

    // D. Safe Fallback: Only when part is NOT specified, match canonical test
    if (!target && !requiredPart) {
      const allQuestions = loadAnyToeicTest(cleanTestId || '6852');
      target = allQuestions.find((q) => q.questionNumber === qNum);
    }

    // Strict validation: if requiredPart was specified, target must match it
    if (!target || (requiredPart && target.part !== requiredPart)) {
      return NextResponse.json(
        { success: false, error: `Question ${qNum} not found in test ${cleanTestId}` },
        { status: 404 }
      );
    }

    // Ensure correctAnswer is strictly defined (never empty or missing)
    const resolvedAnswer = (target.correctAnswer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D';

    // Embed invisible zero-width watermark (IP Hash + Timestamp)
    const watermarkedExplanation = embedInvisibleWatermark(
      target.explanationVi || `Đáp án chính xác là (${resolvedAnswer}). Căn cứ theo nội dung câu hỏi và ngữ pháp chuẩn ETS.`,
      `LP_${ip.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      questionNumber: qNum,
      questionId: target.id,
      part: target.part,
      correctAnswer: resolvedAnswer,
      explanationVi: watermarkedExplanation,
      transcript: target.transcript,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch explanation';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
