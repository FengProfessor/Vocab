import { NextRequest, NextResponse } from 'next/server';
import {
  loadVstepExamSafe,
  loadRawVstepExam,
  loadVstepSkillPractice,
  stripSensitiveVstepData,
  getVstepCatalog,
} from '@/lib/vstep-test-loader';
import {
  generateVstepSessionToken,
  isVstepHoneypot,
  isClientFlaggedAsBot,
  flagClientAsBot,
  poisonVstepQuestion,
} from '@/lib/vstep-anti-scraping';
import { VstepExam, VstepSkillType } from '@/lib/vstep-types';

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
      flagClientAsBot(clientIp, `VSTEP Honeypot triggered: testId=${testId}`);

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
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken: generateVstepSessionToken(clientIp, testId || 'vstep-mock-01'),
          _hp_honeypot: false,
        });
      }
    }

    // 3. Nếu IP đã bị gắn cờ Bot trước đó -> Trả về đề thi bị đầu độc
    if (isClientFlaggedAsBot(clientIp)) {
      const raw = loadRawVstepExam(testId || 'vstep-mock-01') || loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken: generateVstepSessionToken(clientIp, testId || 'vstep-mock-01'),
        });
      }
    }

    // 4. Client chân chính: Nếu yêu cầu skill-specific practice hoặc testId là practice/bank
    if (skillParam || testId === 'practice' || testId === 'bank') {
      const targetSkill: VstepSkillType =
        skillParam || (testId?.includes('reading') ? 'reading' : 'listening');

      const practiceExam = loadVstepSkillPractice({
        skill: targetSkill,
        filterMode: filterParam,
        limit: limitParam,
        testId: testId && testId !== 'practice' && testId !== 'bank' ? testId : undefined,
      });

      if (!practiceExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }

      const sessionToken = generateVstepSessionToken(clientIp, practiceExam.id);

      return NextResponse.json({
        success: true,
        exam: practiceExam,
        metadata: (practiceExam as any).metadata,
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

    return NextResponse.json({
      success: true,
      exam: safeExam,
      sessionToken,
    });
  } catch (error) {
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
      flagClientAsBot(clientIp, `VSTEP Honeypot triggered in POST: testId=${testId}`);
      const raw = loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken: generateVstepSessionToken(clientIp, testId || 'vstep-mock-01'),
          _hp_honeypot: false,
        });
      }
    }

    // 2. Bot check
    if (isClientFlaggedAsBot(clientIp)) {
      const raw = loadRawVstepExam(testId || 'vstep-mock-01') || loadRawVstepExam('vstep-mock-01');
      if (raw) {
        for (const section of raw.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        return NextResponse.json({
          success: true,
          exam: raw,
          sessionToken: generateVstepSessionToken(clientIp, testId || 'vstep-mock-01'),
        });
      }
    }

    // 3. Xử lý luyện tập kỹ năng hoặc bốc đề chống trùng qua POST (tránh lỗi 414 URI Too Long)
    const isPracticeQuery =
      body.skill ||
      testId === 'practice' ||
      testId === 'bank' ||
      (Array.isArray(body.excludedIds) && body.excludedIds.length > 0) ||
      (Array.isArray(body.mistakeIds) && body.mistakeIds.length > 0) ||
      Boolean(body.filterMode || body.filter);

    if (isPracticeQuery) {
      const targetSkill: VstepSkillType =
        body.skill ||
        (testId?.includes('reading') ? 'reading' : 'listening');

      const practiceExam = loadVstepSkillPractice({
        skill: targetSkill,
        filterMode,
        excludedIds: body.excludedIds,
        mistakeIds: body.mistakeIds,
        limit: body.limit,
        seed: body.seed,
        testId: testId && testId !== 'practice' && testId !== 'bank' ? testId : undefined,
      });

      if (!practiceExam) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          { status: 404 }
        );
      }

      const sessionToken = generateVstepSessionToken(clientIp, practiceExam.id);

      return NextResponse.json({
        success: true,
        exam: practiceExam,
        metadata: (practiceExam as any).metadata,
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

    return NextResponse.json({
      success: true,
      exam: safeExam,
      sessionToken,
    });
  } catch (error) {
    console.error('Lỗi khi xử lý POST VSTEP test:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ khi nạp đề thi.' },
      { status: 500 }
    );
  }
}
