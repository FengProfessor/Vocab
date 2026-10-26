import {
  apiDelete,
  callDotNetRaw,
  callServerOriginApi,
  LegacyRequestOptions,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import { mapGrammarTopicsList } from '@/features/grammar/mappers';
import {
  UNIFIED_GRAMMAR_TOPICS,
  getTopicBySlug,
} from '@/lib/grammar-roadmap-data';
import { readLocalGrammarWrongQueue } from '@/lib/grammar-exercises';
import topicAssetsData from '@/data/grammar-topic-assets.json';

function extractQueryParam(input: string, key: string): string {
  const qIdx = input.indexOf('?');
  if (qIdx >= 0) {
    const sp = new URLSearchParams(input.slice(qIdx + 1));
    return sp.get(key) || input;
  }
  return input;
}

interface CustomGrammarLesson {
  id: string;
  topic_id: string;
  title: string;
  theory_vi: string;
  examples: Array<{ en: string; vi: string }>;
  created_at: string;
}

const LOCAL_CUSTOM_LESSONS_KEY = 'lingopro_custom_grammar_lessons_v1';

function readCustomLessons(): CustomGrammarLesson[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CUSTOM_LESSONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomGrammarLesson[]) : [];
  } catch {
    return [];
  }
}

function writeCustomLessons(lessons: CustomGrammarLesson[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_CUSTOM_LESSONS_KEY, JSON.stringify(lessons));
  } catch {
    // ignore storage quota errors
  }
}

function buildDefaultLessons(): CustomGrammarLesson[] {
  const custom = readCustomLessons();
  const baseLessons: CustomGrammarLesson[] = UNIFIED_GRAMMAR_TOPICS.map((t) => {
    const assets =
      (topicAssetsData as Record<
        string,
        Array<{ caption?: string; usageAnalysisVi?: { rule?: string } }>
      >)[t.slug] ?? [];
    return {
      id: `lesson-${t.slug}`,
      topic_id: t.slug,
      title: t.title,
      theory_vi: t.summary,
      examples: assets.slice(0, 4).map((a) => ({
        en: a.caption ?? '',
        vi: a.usageAnalysisVi?.rule ?? '',
      })),
      created_at: new Date(0).toISOString(),
    };
  });
  return [...custom, ...baseLessons];
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
    options?: LegacyRequestOptions,
  ) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params.startsWith('/') ? '' : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params;
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>('/grammar/topics', {
      method: 'GET',
      params: queryParams,
      headers: options?.headers,
      signal: options?.signal,
    });
    const rawList = Array.isArray(body?.data) && body.data.length > 0
      ? body.data
      : UNIFIED_GRAMMAR_TOPICS.map((t) => ({
          id: t.slug,
          slug: t.slug,
          title: t.title,
          titleVi: t.title_vi,
          level: t.level,
          certLevel: t.level,
          sortOrder: t.order,
        }));
    const payload = mapGrammarTopicsList(rawList);
    return withResponseCompat(payload, status, ok || rawList.length > 0);
  }

  /**
   * Retrieves grammar due counts and progress summary via `GET /api/v1/vocab/analytics`.
   */
  public static async getProgress(
    _params?: Record<string, unknown> | string,
    options?: LegacyRequestOptions,
  ) {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>('/vocab/analytics', {
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
        data: [] as Record<string, unknown>[],
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
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
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
   * Retrieves grammar review schedule for the given window of days.
   */
  public static async getReviewSchedule(
    daysOrOptions?:
      | number
      | string
      | { days?: number; signal?: AbortSignal | null; headers?: HeadersInit | Record<string, string> },
    _options?: LegacyRequestOptions,
  ) {
    let days = 14;
    if (typeof daysOrOptions === 'number') {
      days = daysOrOptions;
    } else if (typeof daysOrOptions === 'string') {
      const parsed = Number(extractQueryParam(daysOrOptions, 'days'));
      if (!Number.isNaN(parsed) && parsed > 0) days = parsed;
    } else if (daysOrOptions && typeof daysOrOptions === 'object') {
      if (typeof daysOrOptions.days === 'number') days = daysOrOptions.days;
    }

    const queue = readLocalGrammarWrongQueue(days).map((item) => item.exercise);
    return withResponseCompat({
      success: true,
      count: queue.length,
      data: queue,
    });
  }

  /**
   * Submits a grammar review item (`POST /api/v1/grammar/progress`).
   */
  public static async submitReview(rawBody: unknown) {
    return GrammarApi.submitProgress(rawBody);
  }

  /**
   * Retrieves grammar theory content for a topic slug from the embedded curriculum catalog.
   */
  public static async getTheory(topicSlugOrUrl: string) {
    const topicSlug = extractQueryParam(topicSlugOrUrl, 'topic');
    const topicObj = getTopicBySlug(topicSlug);
    if (!topicObj) {
      return withResponseCompat(
        {
          success: false,
          error: `Grammar topic '${topicSlug}' not found.`,
        },
        404,
        false,
      );
    }

    const assets =
      (topicAssetsData as Record<
        string,
        Array<{
          caption?: string;
          usageAnalysisVi?: {
            rule?: string;
            contextReason?: string;
            commonMistake?: string;
          };
        }>
      >)[topicSlug] ?? [];

    const rules = assets
      .filter((a) => a.usageAnalysisVi?.rule)
      .map((a, idx) => ({
        case: `Quy tắc ${idx + 1}`,
        rule: a.usageAnalysisVi?.rule ?? '',
        example: a.caption ?? '',
      }));

    const mistakes = assets
      .filter((a) => a.usageAnalysisVi?.commonMistake)
      .map((a) => ({
        wrong: '',
        right: a.caption ?? '',
        why: a.usageAnalysisVi?.commonMistake ?? '',
      }));

    return withResponseCompat({
      success: true,
      data: {
        slug: topicObj.slug,
        title: topicObj.title,
        title_vi: topicObj.title_vi,
        level: topicObj.level,
        definition: topicObj.summary,
        rules,
        mistakes,
      },
    });
  }

  /**
   * Retrieves grammar lessons filtered by `id` or `topicId`.
   */
  public static async getLessons(params?: { topicId?: string; id?: string } | string) {
    let queryParams: Record<string, string> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      if (qIdx >= 0) {
        queryParams = Object.fromEntries(new URLSearchParams(params.slice(qIdx + 1)).entries());
      }
    } else if (params) {
      queryParams = params as Record<string, string>;
    }

    const allLessons = buildDefaultLessons();
    if (queryParams.id) {
      const found = allLessons.find((l) => l.id === queryParams.id) ?? null;
      return withResponseCompat({
        success: Boolean(found),
        data: found,
      });
    }
    if (queryParams.topicId) {
      const filtered = allLessons.filter((l) => l.topic_id === queryParams.topicId);
      return withResponseCompat({
        success: true,
        data: filtered,
      });
    }
    return withResponseCompat({
      success: true,
      data: allLessons,
    });
  }

  /**
   * Creates or updates a grammar lesson in client storage.
   */
  public static async saveLesson(rawBody: unknown, _method?: 'POST' | 'PUT') {
    const payload = normalizePayloadData(rawBody);
    const current = readCustomLessons();
    const id = String(payload.id || `lesson-custom-${Date.now()}`);
    const nextLesson: CustomGrammarLesson = {
      id,
      topic_id: String(payload.topic_id || ''),
      title: String(payload.title || ''),
      theory_vi: String(payload.theory_vi || ''),
      examples: Array.isArray(payload.examples)
        ? (payload.examples as Array<{ en: string; vi: string }>)
        : [],
      created_at: new Date().toISOString(),
    };
    const nextList = [nextLesson, ...current.filter((item) => item.id !== id)];
    writeCustomLessons(nextList);

    return withResponseCompat({
      success: true,
      data: nextLesson,
    });
  }

  /**
   * Deletes a custom grammar lesson by ID.
   */
  public static async deleteLesson(lessonIdOrUrl: string) {
    const id = extractQueryParam(lessonIdOrUrl, 'id');
    const current = readCustomLessons();
    writeCustomLessons(current.filter((item) => item.id !== id));
    return withResponseCompat({
      success: true,
    });
  }

  /**
   * Creates or updates a classroom grammar exercise.
   */
  public static async createExercise(rawBody: unknown) {
    const record =
      rawBody && typeof rawBody === 'object'
        ? (rawBody as Record<string, unknown>)
        : {};
    const inferredMethod =
      typeof record.method === 'string'
        ? (record.method.toUpperCase() as 'POST' | 'PUT' | 'DELETE')
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
