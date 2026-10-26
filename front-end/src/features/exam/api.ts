import {
  apiDelete,
  apiGet,
  apiPost,
  callDotNetRaw,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapToeicSubmitToDotNet,
  mapVstepSubmitToDotNet,
} from '@/features/exam/mappers';
import {
  evaluateWithDeterministicRubric,
  type WritingEvalCriteriaScore,
  type WritingEvalRequest,
  type WritingEvalResult,
} from '@/features/exam/writing-rubric';
import {
  AUTHENTIC_TEST_METADATA,
  clusterToeicQuestions,
  convertLegacyMiniTest,
  getToeicCatalogIndex,
  loadAnyToeicTest,
  loadToeicPartPractice,
  loadToeicQuestionsByIds,
  stripSensitiveClusterData,
  stripSensitiveToeicData,
  type ToeicPartPracticeOptions,
} from '@/lib/toeic-test-loader';
import { calculateToeicScore } from '@/lib/toeic-scoring';
import {
  embedInvisibleWatermark as embedToeicWatermark,
  generateToeicSessionToken,
  hashIpForSession,
} from '@/lib/toeic-anti-scraping';
import {
  getVstepCatalog,
  getVstepQuestionExplanation,
  loadRawVstepExam,
  loadVstepExamSafe,
  loadVstepQuestionsByIds,
  loadVstepSkillPractice,
} from '@/lib/vstep-test-loader';
import { calculateVstepScore } from '@/lib/vstep-scoring';
import {
  embedInvisibleWatermark as embedVstepWatermark,
  generateVstepSessionToken,
} from '@/lib/vstep-anti-scraping';
import {
  createVnuSessionToken,
  embedInvisibleWatermark as embedVnuWatermark,
  getRawVnuBac3Exam,
  getVnuBac3Catalog,
  stripSensitiveVnuData,
} from '@/lib/vnu-bac-3/loader';
import { gradeVnuBac3Exam } from '@/lib/vnu-bac-3/scoring';
import type {
  ToeicClientQuestionCluster,
  ToeicExamMode,
  ToeicOptionKey,
  ToeicPart,
  ToeicQuestionCluster,
  ToeicUnifiedQuestion,
} from '@/types/toeic';
import type {
  VstepExam,
  VstepScoreResult,
  VstepSkillType,
} from '@/lib/vstep-types';

export type { WritingEvalCriteriaScore, WritingEvalRequest, WritingEvalResult };

export interface ToeicQuestionHistoryDto {
  questionKey: string;
  testId: string;
  questionNumber: number;
  partNumber: number;
  seenCount: number;
  wrongCount: number;
  correctCount: number;
  lastAnswer: string | null;
  lastCorrect: boolean;
  isFlagged: boolean;
  lastSeenAt: string;
}

const PART_RECOMMENDED_MINUTES: Record<ToeicPart, number> = {
  1: 4,
  2: 10,
  3: 17,
  4: 15,
  5: 12,
  6: 10,
  7: 55,
};

function parseStringArrayParam(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      return raw.startsWith('[')
        ? (JSON.parse(raw) as string[])
        : raw.split(',').map((s) => s.trim()).filter(Boolean);
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return undefined;
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

/**
 * Domain API service for TOEIC, VSTEP, and VNU Bậc 3 Exams, AI Writing Evaluation, and Question History.
 */
export class ExamApi {
  /**
   * Loads a TOEIC test payload with sanitized questions and listening clusters.
   */
  public static async getToeicTest(
    input?: Record<string, unknown> | string,
    method: 'GET' | 'POST' = 'GET',
  ) {
    let params: Record<string, unknown> = {};
    if (method === 'POST' && typeof input === 'object') {
      params = normalizePayloadData(input);
    } else if (typeof input === 'string') {
      const qIdx = input.indexOf('?');
      const raw = qIdx >= 0 ? input.slice(qIdx + 1) : input;
      params = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (input) {
      params = normalizePayloadData(input);
    }

    const rawTestId = String(params.testId || '6852');
    const cleanTestId = decodeURIComponent(rawTestId).trim();

    let partNum: ToeicPart | null = null;
    if (params.part) {
      const p = parseInt(String(params.part), 10);
      if (p >= 1 && p <= 7) {
        partNum = p as ToeicPart;
      }
    }

    let limitNum = params.limit ? parseInt(String(params.limit), 10) : undefined;
    if (partNum && (partNum === 3 || partNum === 4) && limitNum && limitNum > 0) {
      limitNum = Math.max(3, Math.ceil(limitNum / 3) * 3);
    }
    const timeParam = params.time ? String(params.time) : undefined;
    const filterMode =
      (params.filterMode as ToeicPartPracticeOptions['filterMode']) || undefined;
    const parsedExcludedIds = parseStringArrayParam(params.excludedIds ?? params.exclude);
    const parsedMistakeIds = parseStringArrayParam(params.mistakeIds ?? params.mistakes);
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
      questions = loadToeicPartPractice(
        partNum,
        cleanTestId,
        limitNum,
        true,
        practiceOptions,
      );
      const isBank =
        cleanTestId === 'all' ||
        cleanTestId === 'bank' ||
        cleanTestId === 'all-tests' ||
        cleanTestId === 'practice' ||
        cleanTestId === 'part-practice';
      const catalog = getToeicCatalogIndex();
      const fullMetaLookup = catalog.fullTests?.find(
        (t) =>
          t.id === cleanTestId ||
          t.displayId.toLowerCase() === cleanTestId.toLowerCase(),
      );
      const cleanFallbackLabel = cleanTestId
        .replace(/^estudyme-test-(\d+)/i, 'Đề ETS Simulation $1')
        .replace(/^study4_test_(\d+)/i, 'Đề ETS $1');
      const sourceLabel = isBank
        ? 'Ngân hàng đề'
        : fullMetaLookup?.title || cleanFallbackLabel;
      title = `Luyện tập Part ${partNum} (${questions.length} câu — ${sourceLabel})`;
      const minutes = timeParam
        ? parseInt(timeParam, 10)
        : Math.max(
            5,
            Math.ceil(
              questions.length * ((PART_RECOMMENDED_MINUTES[partNum] || 15) / 25),
            ),
          );
      durationSeconds = minutes * 60;
    } else {
      questions = loadAnyToeicTest(cleanTestId);
      if (partNum && questions.some((q) => q.part !== partNum)) {
        questions = questions.filter((q) => q.part === partNum);
      }
      if (limitNum && limitNum > 0 && questions.length > limitNum) {
        questions = questions.slice(0, limitNum);
      }

      const catalog = getToeicCatalogIndex();
      const fullMeta = catalog.fullTests?.find(
        (t) =>
          t.id === cleanTestId ||
          t.displayId.toLowerCase() === cleanTestId.toLowerCase(),
      );

      let practiceMeta: { title: string; durationMinutes: number } | null = null;
      if (!fullMeta && catalog.practiceParts) {
        for (const pKey of Object.keys(catalog.practiceParts)) {
          const item = catalog.practiceParts[pKey]?.find(
            (x) =>
              x.id.toLowerCase() === cleanTestId.toLowerCase() ||
              `estudyme-p${x.part}-set${x.setNumber}`.toLowerCase() ===
                cleanTestId.toLowerCase(),
          );
          if (item) {
            practiceMeta = item;
            break;
          }
        }
      }

      if (practiceMeta) {
        title = practiceMeta.title;
        const minutes = timeParam
          ? parseInt(timeParam, 10)
          : practiceMeta.durationMinutes;
        durationSeconds = minutes * 60;
      } else if (fullMeta) {
        title = fullMeta.title;
        const minutes = timeParam
          ? parseInt(timeParam, 10)
          : fullMeta.durationMinutes;
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
      return withResponseCompat(
        { success: false, error: `Test "${cleanTestId}" not found or empty` },
        404,
        false,
      );
    }

    const deliveredQuestions = stripSensitiveToeicData(questions);
    const rawClusters = clusterToeicQuestions(questions) as ToeicQuestionCluster[];
    const listeningClusters = rawClusters.map(stripSensitiveClusterData);
    const sessionToken = generateToeicSessionToken({
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      testId: cleanTestId,
      ipHash: hashIpForSession('127.0.0.1'),
      issuedAt: Date.now(),
    });

    return withResponseCompat({
      success: true,
      testId: cleanTestId,
      title,
      durationSeconds,
      totalQuestions: deliveredQuestions.length,
      questions: deliveredQuestions,
      clusters: listeningClusters.length > 0 ? listeningClusters : undefined,
      sessionToken,
      part: partNum ?? undefined,
      filterMode: practiceOptions?.filterMode || filterMode || undefined,
    });
  }

  /**
   * Requests detailed explanation for a single TOEIC question.
   */
  public static async explainToeicQuestion(
    rawBody: unknown,
    _options?: LegacyRequestOptions,
  ) {
    const body = normalizePayloadData(rawBody);
    const rawTestId = typeof body.testId === 'string' ? body.testId.trim() : '6852';
    const cleanTestId = decodeURIComponent(rawTestId)
      .replace(/_(real|practice|full_simulation|practice_part)$/, '')
      .replace(/_part[1-7]/, '')
      .replace(/_lim\d+/, '');
    const qNum = Number(body.questionNumber) || 1;
    const requiredPart = body.part ? Number(body.part) : undefined;
    const rawQuestionId =
      typeof body.questionId === 'string' ? body.questionId.trim() : undefined;
    const normalizedQuestionId = rawQuestionId
      ? rawQuestionId.startsWith('q-')
        ? rawQuestionId
        : rawQuestionId.match(/^([a-zA-Z0-9_-]+)-q(\d+)$/)
          ? `q-${rawQuestionId.replace(/-q(\d+)$/, '-$1')}`
          : rawQuestionId
      : undefined;

    let target: ToeicUnifiedQuestion | undefined;

    if (normalizedQuestionId) {
      const found = loadToeicQuestionsByIds([normalizedQuestionId]);
      if (found.length > 0 && found[0].testId !== 'synthetic') {
        if (!requiredPart || found[0].part === requiredPart) {
          target = found[0];
        }
      }
    }

    if (!target && cleanTestId && cleanTestId !== 'bank' && cleanTestId !== 'all') {
      const allQuestions = loadAnyToeicTest(cleanTestId);
      target = allQuestions.find((q) => {
        if (
          normalizedQuestionId &&
          (q.id === normalizedQuestionId ||
            (rawQuestionId && q.id === rawQuestionId))
        ) {
          return !requiredPart || q.part === requiredPart;
        }
        return requiredPart
          ? q.part === requiredPart && q.questionNumber === qNum
          : q.questionNumber === qNum;
      });
    }

    if (!target && requiredPart) {
      const pNum = requiredPart as ToeicPart;
      const partPractice = loadToeicPartPractice(
        pNum,
        cleanTestId || 'bank',
        100,
        true,
      );
      target = partPractice.find(
        (q) =>
          ((normalizedQuestionId &&
            (q.id === normalizedQuestionId ||
              (rawQuestionId && q.id === rawQuestionId))) ||
            q.questionNumber === qNum) &&
          q.part === pNum,
      );
    }

    if (!target && !requiredPart) {
      const allQuestions = loadAnyToeicTest(cleanTestId || '6852');
      target = allQuestions.find((q) => q.questionNumber === qNum);
    }

    if (!target || (requiredPart && target.part !== requiredPart)) {
      return withResponseCompat(
        {
          success: false,
          error: `Question ${qNum} not found in test ${cleanTestId}`,
        },
        404,
        false,
      );
    }

    const resolvedAnswer = (target.correctAnswer || 'A').toUpperCase() as
      | 'A'
      | 'B'
      | 'C'
      | 'D';
    const watermarkedExplanation = embedToeicWatermark(
      target.explanationVi ||
        `Đáp án chính xác là (${resolvedAnswer}). Căn cứ theo nội dung câu hỏi và ngữ pháp chuẩn ETS.`,
      `LP_SPA_${Date.now()}`,
    );

    return withResponseCompat({
      success: true,
      questionNumber: qNum,
      questionId: target.id,
      part: target.part,
      correctAnswer: resolvedAnswer,
      explanationVi: watermarkedExplanation,
      transcript: target.transcript,
    });
  }

  /**
   * Grades a TOEIC exam submission and syncs the attempt to `.NET 10` (`POST /api/v1/exams/toeic/submit`).
   */
  public static async submitToeicExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const rawTestId = body.testId ? decodeURIComponent(String(body.testId)).trim() : '6852';
    const testId = rawTestId
      .replace(/_(real|practice|full_simulation|practice_part)$/, '')
      .replace(/_part[1-7]/, '')
      .replace(/_lim\d+/, '');
    const answers = (body.answers || {}) as Record<number, ToeicOptionKey>;
    const timeSpentSeconds = Math.max(0, Number(body.timeSpentSeconds) || 0);

    let partNum: ToeicPart | null = null;
    if (body.part) {
      const p = Number(body.part);
      if (p >= 1 && p <= 7) {
        partNum = p as ToeicPart;
      }
    }
    const limitNum = body.limit ? Number(body.limit) : undefined;

    let masterQuestions: ToeicUnifiedQuestion[] = [];
    if (Array.isArray(body.questionIds) && body.questionIds.length > 0) {
      masterQuestions = loadToeicQuestionsByIds(body.questionIds).map((q, idx) => ({
        ...q,
        questionNumber: idx + 1,
      }));
      if (!partNum && masterQuestions.length > 0) {
        partNum = masterQuestions[0].part;
      }
    } else {
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
    }

    if (masterQuestions.length === 0) {
      return withResponseCompat(
        { success: false, error: `Test "${testId}" not found` },
        404,
        false,
      );
    }

    const scoreResult = calculateToeicScore(answers, masterQuestions, timeSpentSeconds);
    const { ok } = await callDotNetRaw('/exams/toeic/submit', {
      method: 'POST',
      data: mapToeicSubmitToDotNet(body, scoreResult),
    });

    const reviewQuestions = masterQuestions.map((q) => ({
      ...q,
      explanationVi: embedToeicWatermark(q.explanationVi || '', `UID_SPA_${Date.now()}`),
    }));
    const reviewClusters = clusterToeicQuestions(
      reviewQuestions,
    ) as ToeicClientQuestionCluster[];

    return withResponseCompat({
      success: true,
      scoreResult,
      reviewQuestions,
      reviewClusters: reviewClusters.length > 0 ? reviewClusters : undefined,
      savedToHistory: ok,
      isGuest: !ok,
    });
  }

  /**
   * Retrieves the learner's TOEIC question history via `GET /api/v1/exams/toeic/history`.
   */
  public static async getToeicHistory(): Promise<ToeicQuestionHistoryDto[]> {
    return apiGet<ToeicQuestionHistoryDto[]>('/exams/toeic/history');
  }

  /**
   * Syncs TOEIC question history items via `POST /api/v1/exams/toeic/history`.
   */
  public static async saveToeicHistory(items: Record<string, unknown>[]): Promise<number> {
    return apiPost<number>('/exams/toeic/history', { items });
  }

  /**
   * Clears the learner's TOEIC question history via `DELETE /api/v1/exams/toeic/history`.
   */
  public static async clearToeicHistory(): Promise<number> {
    return apiDelete<number>('/exams/toeic/history');
  }

  /**
   * Loads a VSTEP exam payload.
   */
  public static async getVstepTest(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const testId = typeof body.testId === 'string' ? body.testId : undefined;
    const skillParam = (body.skill as VstepSkillType | undefined) || undefined;
    const filterMode = (body.filterMode || body.filter || 'unseen') as
      | 'unseen'
      | 'mistakes'
      | 'all_random';

    if (!testId && !skillParam) {
      return withResponseCompat({
        success: true,
        catalog: getVstepCatalog(),
      });
    }

    const catalogPracticeSkill = getCatalogPracticeSkill(testId);
    if (testId && isProductiveSkill(catalogPracticeSkill)) {
      const safeExam = loadVstepExamSafe(testId);
      if (!safeExam) {
        return withResponseCompat(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          404,
          false,
        );
      }
      return withResponseCompat({
        success: true,
        exam: safeExam,
        sessionToken: generateVstepSessionToken('127.0.0.1', testId),
      });
    }

    const isPracticeQuery = Boolean(
      skillParam || catalogPracticeSkill || testId === 'practice' || testId === 'bank',
    );
    if (isPracticeQuery) {
      const targetSkill: VstepSkillType =
        skillParam ||
        catalogPracticeSkill ||
        (testId?.includes('reading') ? 'reading' : 'listening');

      const practiceExam = loadVstepSkillPractice({
        skill: targetSkill,
        filterMode,
        excludedIds: Array.isArray(body.excludedIds) ? body.excludedIds : undefined,
        mistakeIds: Array.isArray(body.mistakeIds) ? body.mistakeIds : undefined,
        limit: typeof body.limit === 'number' ? body.limit : undefined,
        seed: typeof body.seed === 'number' ? body.seed : undefined,
        testId:
          testId && testId !== 'practice' && testId !== 'bank' ? testId : undefined,
      });

      if (!practiceExam) {
        return withResponseCompat(
          { success: false, error: 'Không thể nạp bài luyện tập VSTEP yêu cầu.' },
          404,
          false,
        );
      }

      return withResponseCompat({
        success: true,
        exam: practiceExam,
        metadata: practiceExam.metadata,
        sessionToken: generateVstepSessionToken(
          '127.0.0.1',
          testId || practiceExam.id,
        ),
      });
    }

    if (!testId) {
      return withResponseCompat(
        { success: false, error: 'Thiếu mã đề thi hoặc kỹ năng cần luyện tập.' },
        400,
        false,
      );
    }

    const safeExam = loadVstepExamSafe(testId);
    if (!safeExam) {
      return withResponseCompat(
        { success: false, error: 'Không tìm thấy mã đề thi VSTEP yêu cầu.' },
        404,
        false,
      );
    }

    return withResponseCompat({
      success: true,
      exam: safeExam,
      sessionToken: generateVstepSessionToken('127.0.0.1', testId),
    });
  }

  /**
   * Requests explanation for a VSTEP question.
   */
  public static async explainVstepQuestion(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const testId = String(body.testId || '');
    const questionId = String(body.questionId || '');
    const details = getVstepQuestionExplanation(testId, questionId);
    if (!details) {
      return withResponseCompat(
        { success: false, error: 'Không tìm thấy câu hỏi yêu cầu.' },
        404,
        false,
      );
    }

    const protectedExplanation = details.explanationVi
      ? embedVstepWatermark(details.explanationVi, `SPA|T:${Date.now()}`)
      : undefined;

    return withResponseCompat({
      success: true,
      answer: details.answer,
      explanationVi: protectedExplanation,
      tapescript: details.tapescript,
      suggestion: details.suggestion,
    });
  }

  /**
   * Grades a VSTEP exam submission and syncs the attempt to `.NET 10` (`POST /api/v1/exams/vstep/submit`).
   */
  public static async submitVstepExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const testId = typeof body.testId === 'string' ? body.testId : '';
    const answers = (body.answers || {}) as Record<string, number>;
    const questionIds = Array.isArray(body.questionIds)
      ? (body.questionIds as string[])
      : undefined;
    const examMode = body.examMode as ToeicExamMode | undefined;
    const practiceSkill = body.practiceSkill as VstepSkillType | undefined;

    if (!testId) {
      return withResponseCompat(
        { success: false, error: 'Mã đề thi không hợp lệ.' },
        400,
        false,
      );
    }

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
    const watermarkPayload = `SPA|T:${Date.now()}`;
    const isPracticeSubmission = examMode === 'practice' || !rawExam;

    if (isPracticeSubmission) {
      if (!questionIds || questionIds.length === 0) {
        return withResponseCompat(
          { success: false, error: 'Không tìm thấy đề thi cần nộp.' },
          404,
          false,
        );
      }
      const masterQuestions = loadVstepQuestionsByIds(questionIds);
      if (masterQuestions.length === 0) {
        return withResponseCompat(
          { success: false, error: 'Không thể nạp dữ liệu câu hỏi để chấm điểm.' },
          404,
          false,
        );
      }

      const targetSkill: VstepSkillType =
        practiceSkill === 'listening' || practiceSkill === 'reading'
          ? practiceSkill
          : testId.includes('listening')
            ? 'listening'
            : 'reading';
      const isListeningExam = targetSkill === 'listening';

      for (const q of masterQuestions) {
        const userAnswer =
          (q.canonicalId ? answers[q.canonicalId] : undefined) ?? answers[q.id];
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
          q.explanationVi = embedVstepWatermark(q.explanationVi, watermarkPayload);
        }
      }

      reviewExam = {
        id: testId,
        title: isListeningExam
          ? 'Luyện Tập Kỹ Năng Nghe (Listening)'
          : 'Luyện Tập Kỹ Năng Đọc (Reading)',
        duration: isListeningExam ? 40 : 60,
        sections: [
          {
            type: targetSkill,
            label: isListeningExam
              ? 'Kỹ Năng Nghe (Listening)'
              : 'Kỹ Năng Đọc (Reading)',
            timeLimit: isListeningExam ? 40 : 60,
            tasks: [{ id: 'task1', questions: masterQuestions }],
          },
        ],
      };
    } else {
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
              const userAnswer =
                answers[q.id] ??
                (q.canonicalId ? answers[q.canonicalId] : undefined);
              const isCorrect =
                typeof userAnswer === 'number' && userAnswer === q.answer;
              partBreakdown[partKey].total++;
              if (isCorrect) partBreakdown[partKey].correct++;
              if (isListening) {
                listeningTotal++;
                if (isCorrect) listeningCorrect++;
              } else if (isReading) {
                readingTotal++;
                if (isCorrect) readingCorrect++;
              }
              if (q.explanationVi) {
                q.explanationVi = embedVstepWatermark(
                  q.explanationVi,
                  watermarkPayload,
                );
              }
            }
          }
        }
      }
    }

    for (const p of Object.values(partBreakdown)) {
      p.accuracy = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
    }

    const scoreResult: VstepScoreResult = calculateVstepScore({
      listeningCorrect: listeningTotal > 0 ? listeningCorrect : undefined,
      listeningTotal: listeningTotal > 0 ? listeningTotal : undefined,
      readingCorrect: readingTotal > 0 ? readingCorrect : undefined,
      readingTotal: readingTotal > 0 ? readingTotal : undefined,
      partBreakdown,
    });

    const { ok } = await callDotNetRaw('/exams/vstep/submit', {
      method: 'POST',
      data: mapVstepSubmitToDotNet(body, scoreResult as unknown as Record<string, unknown>),
    });

    return withResponseCompat({
      success: true,
      scoreResult,
      reviewExam,
      savedToDb: ok,
    });
  }

  /**
   * Evaluates a VSTEP or VNU Bậc 3 writing essay via `.NET 10` (`POST /api/v1/exams/writing/evaluate`)
   * with fallback to the deterministic rubric evaluator.
   */
  public static async evaluateWriting(
    rawBody: unknown,
    examType: 'Vstep' | 'VnuBac3' = 'Vstep',
  ) {
    const body = normalizePayloadData(rawBody);
    const text = String(
      body.essay || body.essayContent || body.userText || body.text || '',
    ).trim();
    const taskId = String(
      body.taskId || (examType === 'VnuBac3' ? 'task1' : 'part1'),
    );

    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/exams/writing/evaluate',
      {
        method: 'POST',
        data: {
          examType,
          taskPrompt: body.prompt || body.taskPrompt || '',
          essayContent: text,
        },
      },
    );

    if (ok && resBody?.data) {
      return withResponseCompat(
        {
          success: true,
          data: resBody.data,
          evaluation: resBody.data,
          ...resBody.data,
        },
        status,
        true,
      );
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 5) {
      return withResponseCompat(
        {
          success: false,
          error: 'Bài viết quá ngắn (cần tối thiểu 5 từ để chấm điểm nhận xét).',
        },
        400,
        false,
      );
    }

    const evaluation = evaluateWithDeterministicRubric({
      examType: examType === 'VnuBac3' ? 'vnu-bac-3' : 'vstep',
      taskId,
      taskTitle: body.taskTitle ? String(body.taskTitle) : undefined,
      prompt: body.prompt ? String(body.prompt) : undefined,
      minWords: typeof body.minWords === 'number' ? body.minWords : undefined,
      text,
    });

    return withResponseCompat({
      success: true,
      evaluation,
    });
  }

  /**
   * Loads the VNU Bậc 3 exam catalog.
   */
  public static async getVnuCatalog() {
    const catalog = getVnuBac3Catalog();
    return withResponseCompat({
      success: true,
      catalog,
    });
  }

  /**
   * Loads a VNU Bậc 3 exam by ID.
   */
  public static async getVnuTest(examIdOrUrl: string) {
    const id = examIdOrUrl.includes('?')
      ? new URLSearchParams(examIdOrUrl.slice(examIdOrUrl.indexOf('?') + 1)).get(
          'id',
        ) || examIdOrUrl
      : examIdOrUrl;
    const rawExam = getRawVnuBac3Exam(id);
    if (!rawExam) {
      return withResponseCompat(
        { success: false, error: `Không tìm thấy đề thi với mã '${id}'.` },
        404,
        false,
      );
    }
    const sanitizedExam = stripSensitiveVnuData(rawExam);
    const sessionToken = createVnuSessionToken(id, 'spa');
    return withResponseCompat({
      success: true,
      exam: sanitizedExam,
      sessionToken,
    });
  }

  /**
   * Requests explanation for a VNU Bậc 3 question.
   */
  public static async explainVnuQuestion(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const examId = String(body.examId || '');
    const questionId = String(body.questionId || '');
    if (!examId || !questionId) {
      return withResponseCompat(
        { success: false, error: 'Thiếu tham số examId hoặc questionId.' },
        400,
        false,
      );
    }
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return withResponseCompat(
        { success: false, error: `Không tìm thấy đề thi ${examId}.` },
        404,
        false,
      );
    }

    let targetQuestion: {
      id: string;
      explanationVi?: string;
      correctAnswer?: string | number;
      answerIndex?: number;
      vocabularyNotes?: Array<{ word: string; meaning: string; ipa?: string }>;
    } | null = null;
    let targetTranscript = '';
    for (const section of rawExam.sections) {
      for (const task of section.tasks) {
        for (const q of task.questions) {
          if (q.id === questionId) {
            targetQuestion = q;
            targetTranscript = task.transcript || '';
            break;
          }
        }
        if (targetQuestion) break;
      }
      if (targetQuestion) break;
    }

    if (!targetQuestion) {
      return withResponseCompat(
        { success: false, error: `Không tìm thấy câu hỏi ${questionId}.` },
        404,
        false,
      );
    }

    const explanation =
      targetQuestion.explanationVi || 'Chưa có lời giải chi tiết cho câu hỏi này.';
    const watermarkedExplanation = embedVnuWatermark(explanation, 'practice_learner');

    return withResponseCompat({
      success: true,
      questionId,
      correctAnswer:
        targetQuestion.correctAnswer ??
        (targetQuestion.answerIndex === 0
          ? 'A'
          : targetQuestion.answerIndex === 1
            ? 'B'
            : 'C'),
      explanationVi: watermarkedExplanation,
      transcript: targetTranscript,
      vocabularyNotes: targetQuestion.vocabularyNotes || [],
    });
  }

  /**
   * Grades a VNU Bậc 3 exam submission and syncs the attempt to `.NET 10`.
   */
  public static async submitVnuExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const examId = String(body.examId || '');
    if (!examId) {
      return withResponseCompat(
        { success: false, error: 'Thiếu tham số examId.' },
        400,
        false,
      );
    }
    const rawExam = getRawVnuBac3Exam(examId);
    if (!rawExam) {
      return withResponseCompat(
        { success: false, error: `Không tìm thấy đề thi '${examId}'.` },
        404,
        false,
      );
    }

    const result = gradeVnuBac3Exam(
      rawExam,
      (body.answers || {}) as Record<string, string>,
      Number(body.timeSpentSeconds) || 0,
    );

    const { ok } = await callDotNetRaw('/exams/vstep/submit', {
      method: 'POST',
      data: mapVstepSubmitToDotNet(
        body,
        result as unknown as Record<string, unknown>,
      ),
    });

    return withResponseCompat({
      success: true,
      result,
      savedToDb: ok,
    });
  }
}
