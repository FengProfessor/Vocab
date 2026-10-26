/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiDelete,
  callDotNetRaw,
  callLocalApi,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapGrammarTopicsList } from '@/features/grammar/mappers';

function extractQueryParam(input: string, key: string): string {
  const qIdx = input.indexOf('?');
  if (qIdx >= 0) {
    const sp = new URLSearchParams(input.slice(qIdx + 1));
    return sp.get(key) || input;
  }
  return input;
}

/**
 * Domain API service for Grammar Topics, Theory, Quizzes, Exercises, and FSRS Grammar Mastery.
 */
export class GrammarApi {
  /**
   * Retrieves canonical grammar topics or classroom grammar exercises via `GET /api/v1/grammar/topics`.
   */
  public static async getTopics(
    params?: Record<string, unknown> | string,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; signal?: AbortSignal | null; [key: string]: any },
  ) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params.startsWith('/') ? '' : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params;
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, any>[]>('/grammar/topics', {
      method: 'GET',
      params: queryParams,
      headers: options?.headers,
      signal: options?.signal,
    });
    const payload = mapGrammarTopicsList(body?.data);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Retrieves grammar due counts and progress summary via `GET /api/v1/vocab/analytics`.
   */
  public static async getProgress(
    _params?: Record<string, unknown> | string,
    options?: RequestInit & { headers?: HeadersInit | Record<string, string>; signal?: AbortSignal | null; [key: string]: any },
  ) {
    const { ok, status, body } = await callDotNetRaw<Record<string, any>>('/vocab/analytics', {
      method: 'GET',
      params: { limit: 0, offset: 0 },
      headers: options?.headers,
      signal: options?.signal,
    });
    const grammarDueCount = Number(body?.data?.grammarDueCount ?? 0);
    return withResponseCompat(
      {
        success: ok,
        dueCount: grammarDueCount,
        data: [] as any[],
      },
      status,
      ok,
    );
  }

  /**
   * Submits grammar topic mastery or review results via `POST /api/v1/grammar/progress`.
   */
  public static async submitProgress(rawBody: unknown) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, any>>(
      '/grammar/progress',
      {
        method: 'POST',
        data: {
          topicSlug: body.topicSlug || body.slug || body.lessonId || body.lesson_id,
          scorePercent: Number(body.scorePercent ?? body.score ?? 100),
        },
      },
    );
    return withResponseCompat(
      {
        success: ok,
        ...(resBody ?? {}),
      },
      status,
      ok,
    );
  }

  /**
   * Retrieves grammar review schedule (`/__local_api/grammar/review`).
   */
  public static async getReviewSchedule(
    daysOrOptions?:
      | number
      | string
      | { days?: number; signal?: AbortSignal | null; headers?: HeadersInit | Record<string, string> },
    options?: RequestInit & { signal?: AbortSignal | null; headers?: HeadersInit | Record<string, string>; [key: string]: any },
  ) {
    let days = 14;
    let resolvedOptions = options;
    if (typeof daysOrOptions === 'number') {
      days = daysOrOptions;
    } else if (typeof daysOrOptions === 'string') {
      const parsed = Number(extractQueryParam(daysOrOptions, 'days'));
      if (!Number.isNaN(parsed) && parsed > 0) days = parsed;
    } else if (daysOrOptions && typeof daysOrOptions === 'object') {
      if (typeof daysOrOptions.days === 'number') days = daysOrOptions.days;
      resolvedOptions = daysOrOptions;
    }

    return callLocalApi('/__local_api/grammar/review', {
      method: 'GET',
      params: { days },
      signal: resolvedOptions?.signal,
      headers: resolvedOptions?.headers,
    });
  }

  /**
   * Submits a grammar review item (`POST /api/v1/grammar/progress`).
   */
  public static async submitReview(rawBody: unknown) {
    return GrammarApi.submitProgress(rawBody);
  }

  /**
   * Retrieves grammar theory content for a topic slug (`/__local_api/grammar/theory`).
   */
  public static async getTheory(topicSlugOrUrl: string) {
    const topic = extractQueryParam(topicSlugOrUrl, 'topic');
    return callLocalApi('/__local_api/grammar/theory', {
      method: 'GET',
      params: { topic },
    });
  }

  /**
   * Retrieves grammar lessons (`/__local_api/grammar/lessons`).
   */
  public static async getLessons(params?: { topicId?: string; id?: string } | string) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      if (qIdx >= 0) {
        queryParams = Object.fromEntries(new URLSearchParams(params.slice(qIdx + 1)).entries());
      }
    } else if (params) {
      queryParams = params as Record<string, unknown>;
    }
    return callLocalApi('/__local_api/grammar/lessons', {
      method: 'GET',
      params: queryParams,
    });
  }

  /**
   * Creates or updates a grammar lesson (`/__local_api/grammar/lessons`).
   */
  public static async saveLesson(rawBody: unknown, method?: 'POST' | 'PUT') {
    const inferredMethod =
      method ||
      (rawBody &&
      typeof rawBody === 'object' &&
      'method' in (rawBody as Record<string, any>) &&
      String((rawBody as Record<string, any>).method).toUpperCase() === 'PUT'
        ? 'PUT'
        : 'POST');
    return callLocalApi('/__local_api/grammar/lessons', {
      method: inferredMethod,
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Deletes a grammar lesson (`/__local_api/grammar/lessons`).
   */
  public static async deleteLesson(lessonIdOrUrl: string) {
    const id = extractQueryParam(lessonIdOrUrl, 'id');
    return callLocalApi('/__local_api/grammar/lessons', {
      method: 'DELETE',
      params: { id },
    });
  }

  /**
   * Creates or updates a classroom grammar exercise.
   */
  public static async createExercise(rawBody: unknown) {
    const inferredMethod =
      rawBody &&
      typeof rawBody === 'object' &&
      'method' in (rawBody as Record<string, any>) &&
      typeof (rawBody as Record<string, any>).method === 'string'
        ? (String((rawBody as Record<string, any>).method).toUpperCase() as
            | 'POST'
            | 'PUT'
            | 'DELETE')
        : 'POST';
    return callServerOriginApi('/api/grammar', {
      method: inferredMethod,
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Deletes a classroom grammar exercise via `DELETE /api/v1/grammar/exercises/{exerciseId}`.
   */
  public static async deleteExercise(exerciseId: string): Promise<boolean> {
    return apiDelete<boolean>(`/grammar/exercises/${exerciseId}`);
  }

  /**
   * Generates grammar lesson content with AI for teachers.
   */
  public static async generateLesson(rawBody: unknown) {
    return callServerOriginApi('/api/grammar/generate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
