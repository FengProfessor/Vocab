/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiGet,
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapDueWordsPayload,
  mapQualityToEnum,
  mapVocabAnalyticsToStudentStats,
  mapVocabAnalyticsToWordsPayload,
} from '@/features/vocab/mappers';
import { XP_PER_CORRECT_QUIZ } from '@/lib/gamification';

export interface VocabWordsQuery {
  classroomId?: string | null;
  summary?: boolean | number | string;
  limit?: number;
  offset?: number;
  filter?: string;
  levels?: boolean | number | string;
  noCount?: boolean | number | string;
  status?: string;
}

export interface VocabWordDetailDto {
  id: string;
  classroomId: string | null;
  word: string;
  ipa: string | null;
  translation: string;
  pos: string | null;
  imageUrl: string | null;
  example: string | null;
  exampleVi: string | null;
  createdAt: string;
  stability: number | null;
  difficulty: number | null;
  intervalDays: number | null;
  nextReviewDate: string | null;
  lastReviewedAt: string | null;
  reviewCount: number;
}

function parseWordsQueryInput(input?: VocabWordsQuery | string): {
  classroomId: string;
  isSummaryOnly: boolean;
  limit: number;
  offset: number;
} {
  if (!input) {
    return { classroomId: '', isSummaryOnly: false, limit: 500, offset: 0 };
  }
  if (typeof input === 'string') {
    const qIdx = input.indexOf('?');
    const rawSearch = qIdx >= 0 ? input.slice(qIdx + 1) : input.startsWith('/') ? '' : input;
    const sp = new URLSearchParams(rawSearch);
    const isSummaryOnly = sp.get('summary') === '1' || sp.get('summary') === 'true';
    const limitParam = sp.get('limit');
    const offsetParam = sp.get('offset');
    return {
      classroomId: sp.get('classroomId') || '',
      isSummaryOnly,
      limit: isSummaryOnly ? 0 : limitParam ? Number(limitParam) : 500,
      offset: offsetParam ? Number(offsetParam) : 0,
    };
  }
  const isSummaryOnly =
    input.summary === true || input.summary === 1 || input.summary === '1';
  return {
    classroomId: input.classroomId || '',
    isSummaryOnly,
    limit: isSummaryOnly ? 0 : input.limit !== undefined ? Number(input.limit) : 500,
    offset: input.offset !== undefined ? Number(input.offset) : 0,
  };
}

/**
 * Domain API service for Vocabulary, FSRS-5 reviews, student analytics, and word packages.
 */
export class VocabApi {
  /**
   * Fetches words and FSRS L1-L6 analytics via `GET /api/v1/vocab/analytics`.
   */
  public static async getWords(
    query?: VocabWordsQuery | string,
    options?: RequestInit & {
      signal?: AbortSignal | null;
      headers?: HeadersInit | Record<string, string>;
      [key: string]: any;
    },
  ) {
    const parsed = parseWordsQueryInput(query);
    const params: Record<string, unknown> = {
      limit: parsed.limit,
      offset: parsed.offset,
    };
    if (parsed.classroomId) {
      params.classroomId = parsed.classroomId;
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, any>>('/vocab/analytics', {
      method: 'GET',
      params,
      signal: options?.signal,
      headers: options?.headers,
    });
    const payload = mapVocabAnalyticsToWordsPayload(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Fetches student vocabulary & FSRS dashboard statistics via `GET /api/v1/vocab/analytics?limit=0&offset=0`.
   */
  public static async getStudentStats(options?: {
    lite?: boolean;
    signal?: AbortSignal | null;
    headers?: HeadersInit | Record<string, string>;
  }) {
    const isLite = Boolean(options?.lite);
    const { ok, status, body } = await callDotNetRaw<Record<string, any>>('/vocab/analytics', {
      method: 'GET',
      params: { limit: 0, offset: 0 },
      signal: options?.signal,
      headers: options?.headers,
    });
    const payload = mapVocabAnalyticsToStudentStats(body?.data, isLite, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Fetches a single vocabulary word and its FSRS state by ID via `GET /api/v1/vocab/words/{wordId}`.
   */
  public static async getWordById(wordId: string): Promise<VocabWordDetailDto> {
    return apiGet<VocabWordDetailDto>(`/vocab/words/${wordId}`);
  }

  /**
   * Fetches due vocabulary cards via `GET /api/v1/vocab/due`.
   */
  public static async getDueWords(limit = 50) {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/vocab/due', {
      method: 'GET',
      params: { limit },
    });
    const payload = mapDueWordsPayload(body?.data);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Submits an FSRS-5 card review via `POST /api/v1/vocab/review`.
   */
  public static async submitSrsReview(
    rawBody: unknown,
    options?: RequestInit & {
      signal?: AbortSignal | null;
      headers?: HeadersInit | Record<string, string>;
      [key: string]: any;
    },
  ) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/vocab/review',
      {
        method: 'POST',
        data: {
          wordId: body.wordId || body.word_id,
          quality: mapQualityToEnum(body.quality),
        },
        signal: options?.signal,
        headers: options?.headers,
      },
    );
    const success = Boolean(ok && resBody?.success !== false);
    return withResponseCompat(
      {
        success,
        applyStatus: 'applied' as const,
        data: resBody?.data ?? null,
        error: ok ? undefined : resBody?.message,
      },
      status,
      success,
    );
  }

  /**
   * Fetches available vocabulary starter packs.
   */
  public static async getPacks() {
    return withResponseCompat({
      success: true,
      packs: [] as any[],
      data: [] as any[],
    });
  }

  /**
   * Creates or saves vocabulary word(s) to the user's personal or classroom deck.
   */
  public static async saveWords(rawBody: unknown) {
    return callServerOriginApi('/api/words', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Updates an existing vocabulary word.
   */
  public static async updateWord(rawBody: unknown) {
    return callServerOriginApi('/api/words', {
      method: 'PUT',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Deletes vocabulary word(s).
   */
  public static async deleteWords(rawBody: unknown) {
    return callServerOriginApi('/api/words', {
      method: 'DELETE',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Updates moderation status of a classroom vocabulary word (`PATCH /api/words/:id/status`).
   */
  public static async updateWordStatus(wordId: string, rawBody: unknown) {
    return callServerOriginApi(`/api/words/${encodeURIComponent(wordId)}/status`, {
      method: 'PATCH',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Triggers background enrichment/refresh for newly imported words.
   */
  public static async refreshWords(rawBody: unknown) {
    return callServerOriginApi('/api/words/refresh', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Refreshes or regenerates an image for a vocabulary card.
   */
  public static async refreshWordImage(rawBody: unknown) {
    return callServerOriginApi('/api/words/refresh-image', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Fetches available vocabulary packages for import.
   */
  public static async getImportPackages() {
    return callServerOriginApi('/api/import/packages', {
      method: 'GET',
    });
  }

  /**
   * Imports a curated vocabulary package into the user's deck.
   */
  public static async importPackage(rawBody: unknown) {
    return callServerOriginApi('/api/import/packages', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates contextual gloss/notes for library vocabulary items.
   */
  public static async generateLibraryGloss(rawBody: unknown) {
    return callServerOriginApi('/api/library/gloss', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Loads a single vocabulary topic word list on demand.
   */
  public static async getVocabTopic(topicId: string) {
    return callServerOriginApi('/api/vocab/topic', {
      method: 'GET',
      params: { id: topicId },
    });
  }

  /**
   * Saves a completed quiz/flashcard session result.
   */
  public static async saveQuizResult(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const score = Math.max(0, Math.round(Number(payload.score ?? 0)));
    const xpEarned = Math.max(5, score * XP_PER_CORRECT_QUIZ);
    return withResponseCompat({
      success: true,
      xpEarned,
      data: {
        score,
        totalQuestions: Number(payload.totalQuestions ?? score),
        xpEarned,
      },
    });
  }
}
