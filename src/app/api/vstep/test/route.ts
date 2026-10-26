import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync, rateLimitUnavailableResponse, tooManyRequests } from '@/lib/api-security';
import {
  loadVstepExamSafe,
  loadRawVstepExam,
  loadVstepSkillPractice,
  getVstepCatalog,
} from '@/lib/vstep-test-loader';
import {
  generateVstepSessionToken,
  bindVstepTokenToClient,
  isVstepHoneypot,
  isClientFlaggedAsBot,
  isVstepSharedClassroomIp,
  isVstepScraperRotationIp,
  flagClientAsBot,
  poisonVstepQuestion,
} from '@/lib/vstep-anti-scraping';
import { VstepSkillType } from '@/lib/vstep-types';

function isRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL ||
      process.env.NODE_ENV === 'production' ||
      process.env.NODE_ENV === 'test' ||
      process.env.TSX_TEST === '1'
  );
}

function getCatalogPracticeSkill(testId?: string | null): VstepSkillType | null {
  if (!testId) return null;
  const item = getVstepCatalog().items.find((candidate) => candidate.id === testId);
  if (
    item?.category === 'listening' ||
    item?.category === 'reading' ||
    item?.category === 'writing' ||
    item?.category === 'speaking'
  ) {
    return item.category;
  }
  return null;
}

function isProductiveSkill(skill: VstepSkillType | null): skill is 'writing' | 'speaking' {
  return skill === 'writing' || skill === 'speaking';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const skillParam = searchParams.get('skill') as VstepSkillType | null;
    const filterParam = (searchParams.get('filterMode') || searchParams.get('filter') || 'unseen') as
      | 'unseen'
      | 'mistakes'
      | 'all_random';
    const limitParam = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const dumpParam = searchParams.get('dump') || searchParams.get('include_answers');

    // Lấy IP client
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const clientKey =
      request.headers.get('x-client-session-id') ||
      request.headers.get('authorization') ||
      request.cookies.get('sb-access-token')?.value ||
      null;

    // Rate limit: 600 test load requests/min per shared classroom IP
    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      const rl = await checkRateLimitAsync(`vstep-test:${clientIp}`, 600, 60_000);
      if (!rl.allowed) {
        return tooManyRequests();
      }
    }

    // 1. Nếu không truyền testId và không truyền skill, trả về catalog
    if (!testId && !skillParam) {
      const catalog = getVstepCatalog();
      return NextResponse.json({
        success: true,
        catalog,
      });
    }

    // 2. Bẫy Honeypot Canary hoặc tham số cào mồi nhử
    if ((testId && isVstepHoneypot(testId)) || dumpParam === 'true' || dumpParam === '1') {
      if (clientKey) {
        flagClientAsBot(clientKey, `VSTEP Honeypot triggered: testId=${testId}`);
      }
      if (!isVstepSharedClassroomIp(clientIp) || isVstepScraperRotationIp(clientIp)) {
        flagClientAsBot(clientIp, `VSTEP Honeypot triggered: testId=${testId}`);
      }

      // Chế độ đầu độc âm thầm (HTTP 200 OK)
      const raw = loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        const sessionToken = generateVstepSessionToken(clientIp, testId || 'vstep-mock-01');
        bindVstepTokenToClient(sessionToken, clientKey);
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken,
          _hp_honeypot: false,
        });
      }
    }

    // 3. Nếu IP đơn lẻ (hoặc IP đang xoay vòng token bot) hoặc client đã bị gắn cờ Bot -> Trả về đề thi bị đầu độc
    if (
      (clientKey && isClientFlaggedAsBot(clientKey)) ||
      (isClientFlaggedAsBot(clientIp) &&
        (!isVstepSharedClassroomIp(clientIp) || isVstepScraperRotationIp(clientIp)))
    ) {
      const raw = loadRawVstepExam(testId || 'vstep-mock-01') || loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        const sessionToken = generateVstepSessionToken(clientIp, testId || 'vstep-mock-01');
        bindVstepTokenToClient(sessionToken, clientKey);
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken,
        });
      }
    }

    // 4. Client chân chính: chỉ coi là practice nếu có skill rõ ràng hoặc catalog xác nhận đề kỹ năng.
    // Không dùng filterMode để suy đoán vì full mock cũng có thể mang query ?filter=unseen.
    const catalogPracticeSkill = getCatalogPracticeSkill(testId);
    if (testId && isProductiveSkill(catalogPracticeSkill)) {
      const safeExam = loadVstepExamSafe(testId);
      if (!safeExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }
      const sessionToken = generateVstepSessionToken(clientIp, testId);
      bindVstepTokenToClient(sessionToken, clientKey);
      return NextResponse.json({
        success: true,
        exam: safeExam,
        sessionToken,
      });
    }
    if (skillParam || catalogPracticeSkill || testId === 'practice' || testId === 'bank') {
      const targetSkill: VstepSkillType =
        skillParam || catalogPracticeSkill || (testId?.includes('reading') ? 'reading' : 'listening');

      const resolvedPracticeTestId =
        testId === 'bank' || testId === 'practice'
          ? 'bank'
          : testId || undefined;

      const practiceExam = loadVstepSkillPractice({
        skill: targetSkill,
        filterMode: filterParam,
        limit: limitParam,
        testId: resolvedPracticeTestId,
      });

      if (!practiceExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }

      // Phiên thi được nộp bằng ID trên URL, dù nội dung là bộ luyện tập nội bộ.
      const sessionToken = generateVstepSessionToken(clientIp, testId || practiceExam.id);
      bindVstepTokenToClient(sessionToken, clientKey);

      return NextResponse.json({
        success: true,
        exam: practiceExam,
        metadata: practiceExam.metadata,
        sessionToken,
      });
    }

    // 5. Nạp đề thi chuẩn theo testId (Zero Bulk Leaks)
    const safeExam = loadVstepExamSafe(testId!);
    if (!safeExam) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy mã đề thi VSTEP yêu cầu.' },
        { status: 404 }
      );
    }

    const sessionToken = generateVstepSessionToken(clientIp, testId!);
    bindVstepTokenToClient(sessionToken, clientKey);

    return NextResponse.json({
      success: true,
      exam: safeExam,
      sessionToken,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('Lỗi khi nạp VSTEP test:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ khi nạp đề thi.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const clientKey =
      request.headers.get('x-client-session-id') ||
      request.headers.get('authorization') ||
      request.cookies.get('sb-access-token')?.value ||
      null;

    if (isRateLimitEnabled() && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      const rl = await checkRateLimitAsync(`vstep-test:${clientIp}`, 600, 60_000);
      if (!rl.allowed) {
        return tooManyRequests();
      }
    }

    const body = (await request.json().catch(() => ({}))) as {
      testId?: string;
      skill?: VstepSkillType;
      filterMode?: 'unseen' | 'mistakes' | 'all_random';
      filter?: 'unseen' | 'mistakes' | 'all_random';
      excludedIds?: string[];
      mistakeIds?: string[];
      limit?: number;
      seed?: number;
      _hp_trap?: string;
    };

    const testId = body.testId;
    const filterMode = body.filterMode || body.filter || 'unseen';

    // 1. Honeypot check
    if (body._hp_trap || (testId && isVstepHoneypot(testId))) {
      if (clientKey) {
        flagClientAsBot(clientKey, `VSTEP Honeypot triggered in POST: testId=${testId}`);
      }
      if (!isVstepSharedClassroomIp(clientIp) || isVstepScraperRotationIp(clientIp)) {
        flagClientAsBot(clientIp, `VSTEP Honeypot triggered in POST: testId=${testId}`);
      }
      const raw = loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        const sessionToken = generateVstepSessionToken(clientIp, testId || 'vstep-mock-01');
        bindVstepTokenToClient(sessionToken, clientKey);
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken,
          _hp_honeypot: false,
        });
      }
    }

    // 2. Bot check
    if (
      (clientKey && isClientFlaggedAsBot(clientKey)) ||
      (isClientFlaggedAsBot(clientIp) &&
        (!isVstepSharedClassroomIp(clientIp) || isVstepScraperRotationIp(clientIp)))
    ) {
      const raw = loadRawVstepExam(testId || 'vstep-mock-01') || loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        const sessionToken = generateVstepSessionToken(clientIp, testId || 'vstep-mock-01');
        bindVstepTokenToClient(sessionToken, clientKey);
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken,
        });
      }
    }

    // 3. Xử lý luyện tập kỹ năng hoặc bốc đề chống trùng qua POST (tránh lỗi 414 URI Too Long).
    // Full mock vẫn gửi filter/history từ UI, nên không được dùng các field đó để phân loại practice.
    const catalogPracticeSkill = getCatalogPracticeSkill(testId);
    if (testId && isProductiveSkill(catalogPracticeSkill)) {
      const safeExam = loadVstepExamSafe(testId);
      if (!safeExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }
      const sessionToken = generateVstepSessionToken(clientIp, testId);
      bindVstepTokenToClient(sessionToken, clientKey);
      return NextResponse.json({
        success: true,
        exam: safeExam,
        sessionToken,
      });
    }
    const isPracticeQuery = Boolean(
      body.skill || catalogPracticeSkill || testId === 'practice' || testId === 'bank'
    );

    if (isPracticeQuery) {
      const targetSkill: VstepSkillType =
        body.skill ||
        catalogPracticeSkill ||
        (testId?.includes('reading') ? 'reading' : 'listening');

      const resolvedPracticeTestId =
        testId === 'bank' || testId === 'practice'
          ? 'bank'
          : testId || undefined;

      const practiceExam = loadVstepSkillPractice({
        skill: targetSkill,
        filterMode,
        excludedIds: body.excludedIds,
        mistakeIds: body.mistakeIds,
        limit: body.limit,
        seed: body.seed,
        testId: resolvedPracticeTestId,
      });

      if (!practiceExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }

      // Giữ ID phiên khớp với testId mà client gửi lại khi nộp bài.
      const sessionToken = generateVstepSessionToken(clientIp, testId || practiceExam.id);
      bindVstepTokenToClient(sessionToken, clientKey);

      return NextResponse.json({
        success: true,
        exam: practiceExam,
        metadata: practiceExam.metadata,
        sessionToken,
      });
    }

    // 4. Nếu truyền testId đề thông thường không có bộ lọc
    if (!testId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã đề thi hoặc kỹ năng cần luyện tập.' },
        { status: 400 }
      );
    }

    const safeExam = loadVstepExamSafe(testId);
    if (!safeExam) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy mã đề thi VSTEP yêu cầu.' },
        { status: 404 }
      );
    }

    const sessionToken = generateVstepSessionToken(clientIp, testId);
    bindVstepTokenToClient(sessionToken, clientKey);

    return NextResponse.json({
      success: true,
      exam: safeExam,
      sessionToken,
    });
  } catch (error) {
    const unavailable = rateLimitUnavailableResponse(error);
    if (unavailable) return unavailable;
    console.error('Lỗi khi xử lý POST VSTEP test:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ khi nạp đề thi.' },
      { status: 500 }
    );
  }
}
