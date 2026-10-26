/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiDelete,
  apiGet,
  apiPost,
  callDotNetRaw,
  callLocalApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapToeicSubmitToDotNet,
  mapVstepSubmitToDotNet,
} from '@/features/exam/mappers';

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

/**
 * Domain API service for TOEIC, VSTEP, and VNU Bậc 3 Exams, AI Writing Evaluation, and Question History.
 */
export class ExamApi {
  /**
   * Loads a TOEIC test payload (`/__local_api/toeic/test`).
   */
  public static async getToeicTest(
    input?: Record<string, unknown> | string,
    method: 'GET' | 'POST' = 'GET',
  ) {
    if (method === 'POST' && typeof input === 'object') {
      return callLocalApi('/__local_api/toeic/test', {
        method: 'POST',
        data: normalizePayloadData(input),
      });
    }
    let params: Record<string, unknown> = {};
    if (typeof input === 'string') {
      const qIdx = input.indexOf('?');
      const raw = qIdx >= 0 ? input.slice(qIdx + 1) : input;
      params = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (input) {
      params = input;
    }
    return callLocalApi('/__local_api/toeic/test', {
      method: 'GET',
      params,
    });
  }

  /**
   * Requests detailed explanation for a single TOEIC question (`/__local_api/toeic/explain`).
   */
  public static async explainToeicQuestion(
    rawBody: unknown,
    options?: RequestInit & { signal?: AbortSignal | null; headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    return callLocalApi('/__local_api/toeic/explain', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
      signal: options?.signal,
    });
  }

  /**
   * Grades a TOEIC exam submission and syncs the attempt to `.NET 10` (`POST /api/v1/exams/toeic/submit`).
   */
  public static async submitToeicExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const localRes = await callLocalApi<Record<string, any>>('/__local_api/toeic/submit', {
      method: 'POST',
      data: body,
    });
    const scoreResult = localRes?.scoreResult;

    void callDotNetRaw('/exams/toeic/submit', {
      method: 'POST',
      data: mapToeicSubmitToDotNet(body, scoreResult),
    });

    if (localRes && localRes.ok) {
      return localRes;
    }
    return withResponseCompat(
      { error: 'Không thể chấm điểm bài thi TOEIC.', ...(localRes ?? {}) },
      localRes?.status || 500,
      false,
    );
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
   * Loads a VSTEP exam payload (`/__local_api/vstep/test`).
   */
  public static async getVstepTest(rawBody: unknown) {
    return callLocalApi('/__local_api/vstep/test', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Requests explanation for a VSTEP question (`/__local_api/vstep/explain`).
   */
  public static async explainVstepQuestion(rawBody: unknown) {
    return callLocalApi('/__local_api/vstep/explain', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Grades a VSTEP exam submission and syncs the attempt to `.NET 10` (`POST /api/v1/exams/vstep/submit`).
   */
  public static async submitVstepExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const localRes = await callLocalApi<Record<string, any>>('/__local_api/vstep/submit', {
      method: 'POST',
      data: body,
    });
    const resultObj = localRes?.result || localRes?.scoreResult || {};

    void callDotNetRaw('/exams/vstep/submit', {
      method: 'POST',
      data: mapVstepSubmitToDotNet(body, resultObj),
    });

    if (localRes && localRes.ok) {
      return localRes;
    }
    return withResponseCompat(
      { error: 'Không thể chấm điểm bài thi.', ...(localRes ?? {}) },
      localRes?.status || 500,
      false,
    );
  }

  /**
   * Evaluates a VSTEP or VNU Bậc 3 writing essay via `.NET 10` (`POST /api/v1/exams/writing/evaluate`)
   * with fallback to the local heuristic evaluator.
   */
  public static async evaluateWriting(
    rawBody: unknown,
    examType: 'Vstep' | 'VnuBac3' = 'Vstep',
  ) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/exams/writing/evaluate',
      {
        method: 'POST',
        data: {
          examType,
          taskPrompt: body.prompt || body.taskPrompt || '',
          essayContent: body.essay || body.essayContent || body.userText || body.text || '',
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

    const localEndpoint =
      examType === 'VnuBac3'
        ? '/__local_api/vnu-bac-3/writing-eval'
        : '/__local_api/vstep/writing-eval';
    return callLocalApi(localEndpoint, {
      method: 'POST',
      data: body,
    });
  }

  /**
   * Loads the VNU Bậc 3 exam catalog (`/__local_api/vnu-bac-3?action=catalog`).
   */
  public static async getVnuCatalog() {
    return callLocalApi('/__local_api/vnu-bac-3', {
      method: 'GET',
      params: { action: 'catalog' },
    });
  }

  /**
   * Loads a VNU Bậc 3 exam by ID (`/__local_api/vnu-bac-3/test`).
   */
  public static async getVnuTest(examIdOrUrl: string) {
    const id = examIdOrUrl.includes('?')
      ? new URLSearchParams(examIdOrUrl.slice(examIdOrUrl.indexOf('?') + 1)).get('id') ||
        examIdOrUrl
      : examIdOrUrl;
    return callLocalApi('/__local_api/vnu-bac-3/test', {
      method: 'GET',
      params: { id },
    });
  }

  /**
   * Requests explanation for a VNU Bậc 3 question (`/__local_api/vnu-bac-3/explain`).
   */
  public static async explainVnuQuestion(rawBody: unknown) {
    return callLocalApi('/__local_api/vnu-bac-3/explain', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Grades a VNU Bậc 3 exam submission and syncs the attempt to `.NET 10`.
   */
  public static async submitVnuExam(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const localRes = await callLocalApi<Record<string, any>>('/__local_api/vnu-bac-3/submit', {
      method: 'POST',
      data: body,
    });
    const resultObj = localRes?.result || localRes?.scoreResult || {};

    void callDotNetRaw('/exams/vstep/submit', {
      method: 'POST',
      data: mapVstepSubmitToDotNet(body, resultObj),
    });

    if (localRes && localRes.ok) {
      return localRes;
    }
    return withResponseCompat(
      { error: 'Không thể chấm điểm bài thi.', ...(localRes ?? {}) },
      localRes?.status || 500,
      false,
    );
  }
}
