import { NextRequest, NextResponse } from 'next/server';
import { loadRawVstepExam, loadVstepQuestionsByIds } from '@/lib/vstep-test-loader';
import { calculateVstepScore } from '@/lib/vstep-scoring';
import {
  verifyVstepSessionToken,
  embedInvisibleWatermark,
  isClientFlaggedAsBot,
  flagClientAsBot,
  poisonVstepQuestion,
  isVstepHoneypot,
} from '@/lib/vstep-anti-scraping';
import { VstepExam, VstepSubmitPayload, VstepScoreResult, VstepSkillType } from '@/lib/vstep-types';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const payload = (await request.json().catch(() => ({}))) as VstepSubmitPayload;
    const { testId, answers = {}, sessionToken, _hp_trap, questionIds } = payload;

    if (!testId || typeof testId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mã đề thi không hợp lệ.' },
        { status: 400 }
      );
    }

    // 1. Bẫy Honeypot (Canary testId hoặc hidden trap field)
    const isHoneypotTriggered = Boolean(_hp_trap || isVstepHoneypot(testId));
    if (isHoneypotTriggered) {
      flagClientAsBot(clientIp, `Submit honeypot triggered: testId=${testId}, trap=${Boolean(_hp_trap)}`);
    }

    const isBot = isHoneypotTriggered || isClientFlaggedAsBot(clientIp);

    // 2. Nếu là bot -> trả về kết quả và review bị đầu độc (HTTP 200 OK - Plausible Data Poisoning)
    if (isBot) {
      const decoyExam = loadRawVstepExam(testId) || loadRawVstepExam('vstep-mock-01');
      if (decoyExam) {
        const poisonedExam: VstepExam = JSON.parse(JSON.stringify(decoyExam));
        for (const section of poisonedExam.sections) {
          for (const task of section.tasks) {
            if (task.questions) {
              task.questions = task.questions.map(poisonVstepQuestion);
            }
          }
        }
        return NextResponse.json({
          success: true,
          scoreResult: {
            overallScore: 6.5,
            cefrLevel: 'B2',
            listeningScore: 6.0,
            readingScore: 7.0,
            listeningCorrect: 21,
            readingCorrect: 28,
            listeningTotal: 35,
            readingTotal: 40,
            partBreakdown: {},
          },
          reviewExam: poisonedExam,
        });
      }
    }

    // 3. BẮT BUỘC: Xác thực token phiên thi (Zero Bulk Leaks Enforcement)
    if (!sessionToken || !verifyVstepSessionToken(sessionToken, clientIp, testId)) {
      return NextResponse.json(
        { success: false, error: 'Phiên làm bài không hợp lệ hoặc đã hết hạn.' },
        { status: 401 }
      );
    }

    // 4. Nạp đề gốc hoặc nạp danh sách câu hỏi theo questionIds (cho dynamic practice sets)
    const rawExam = loadRawVstepExam(testId);

    let reviewExam: VstepExam;
    let listeningCorrect = 0;
    let listeningTotal = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    const partBreakdown: Record<
      string,
      { label: string; correct: number; total: number; accuracy: number }
    > = {};
    const watermarkPayload = `IP:${clientIp}|T:${Date.now()}`;

    if (!rawExam) {
      // Chấm điểm cho dynamic practice sets thông qua master questionIds
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy đề thi cần nộp.' },
          { status: 404 }
        );
      }

      const masterQuestions = loadVstepQuestionsByIds(questionIds);
      if (masterQuestions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Không thể nạp dữ liệu câu hỏi để chấm điểm.' },
          { status: 404 }
        );
      }

      const isListeningExam = testId.includes('listening');
      const targetSkill: VstepSkillType = isListeningExam ? 'listening' : 'reading';

      for (const q of masterQuestions) {
        const userAnswer = answers[q.id] ?? (q.canonicalId ? answers[q.canonicalId] : undefined);
        const isCorrect = typeof userAnswer === 'number' && userAnswer === q.answer;
        const partKey = q.part || (isListeningExam ? 'listening_part' : 'reading_part');

        if (!partBreakdown[partKey]) {
          partBreakdown[partKey] = {
            label: `${targetSkill === 'listening' ? 'Listening' : 'Reading'} — ${partKey.toUpperCase()}`,
            correct: 0,
            total: 0,
            accuracy: 0,
          };
        }

        partBreakdown[partKey].total++;
        if (isCorrect) partBreakdown[partKey].correct++;

        if (isListeningExam) {
          listeningTotal++;
          if (isCorrect) listeningCorrect++;
        } else {
          readingTotal++;
          if (isCorrect) readingCorrect++;
        }

        if (q.explanationVi) {
          q.explanationVi = embedInvisibleWatermark(q.explanationVi, watermarkPayload);
        }
      }

      reviewExam = {
        id: testId,
        title: isListeningExam ? 'Luyện Tập Kỹ Năng Nghe (Listening)' : 'Luyện Tập Kỹ Năng Đọc (Reading)',
        duration: isListeningExam ? 40 : 60,
        sections: [
          {
            type: targetSkill,
            label: isListeningExam ? 'Kỹ Năng Nghe (Listening)' : 'Kỹ Năng Đọc (Reading)',
            timeLimit: isListeningExam ? 40 : 60,
            tasks: [
              {
                id: 'task1',
                questions: masterQuestions,
              },
            ],
          },
        ],
      };
    } else {
      // Chấm điểm cho đề thi đầy đủ thông thường
      reviewExam = JSON.parse(JSON.stringify(rawExam));

      for (const section of reviewExam.sections) {
        const isListening = section.type === 'listening';
        const isReading = section.type === 'reading';

        for (let tIdx = 0; tIdx < section.tasks.length; tIdx++) {
          const task = section.tasks[tIdx];
          const partKey = `${section.type}_${task.id || tIdx + 1}`;

          if (!partBreakdown[partKey]) {
            partBreakdown[partKey] = {
              label: `${section.label} — ${task.id?.toUpperCase() || `Phần ${tIdx + 1}`}`,
              correct: 0,
              total: 0,
              accuracy: 0,
            };
          }

          if (task.questions) {
            for (const q of task.questions) {
              const userAnswer = answers[q.id] ?? (q.canonicalId ? answers[q.canonicalId] : undefined);
              const isCorrect = typeof userAnswer === 'number' && userAnswer === q.answer;

              partBreakdown[partKey].total++;
              if (isCorrect) partBreakdown[partKey].correct++;

              if (isListening) {
                listeningTotal++;
                if (isCorrect) listeningCorrect++;
              } else if (isReading) {
                readingTotal++;
                if (isCorrect) readingCorrect++;
              }

              // Nhúng watermark vào giải thích
              if (q.explanationVi) {
                q.explanationVi = embedInvisibleWatermark(q.explanationVi, watermarkPayload);
              }
            }
          }
        }
      }
    }

    // Tính tỷ lệ % accuracy cho từng part
    for (const p of Object.values(partBreakdown)) {
      p.accuracy = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
    }

    // Tính điểm tổng hợp VSTEP theo barem MOET
    const scoreResult: VstepScoreResult = calculateVstepScore({
      listeningCorrect: listeningTotal > 0 ? listeningCorrect : undefined,
      listeningTotal: listeningTotal > 0 ? listeningTotal : undefined,
      readingCorrect: readingTotal > 0 ? readingCorrect : undefined,
      readingTotal: readingTotal > 0 ? readingTotal : undefined,
      partBreakdown,
    });

    return NextResponse.json({
      success: true,
      scoreResult,
      reviewExam,
    });
  } catch (error) {
    console.error('Lỗi khi nộp bài VSTEP:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ nội bộ khi chấm điểm.' },
      { status: 500 }
    );
  }
}
