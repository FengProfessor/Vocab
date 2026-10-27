import {
  apiGet,
  callDotNetRaw,
  callServerOriginApi,
  LegacyRequestOptions,
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
import {
  CATALOG_VERSION,
  getCatalogTree,
  MICRO_PACK_SIZE,
  resolvePack,
} from '@/lib/vocab-catalog';
import { getFoundationVerb, getStarterPack } from '@/lib/roadmap';
import { getVocabItem, getVocabTopic } from '@/lib/vocab-stages';

export interface VocabWordsQuery {
  classroomId?: string | null;
  summary?: boolean | number | string;
  limit?: number;
  offset?: number;
  filter?: string;
  levels?: boolean | number | string;
  noCount?: boolean | number | string;
  status?: string;
  q?: string;
  sort?: string;
  ids?: string;
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

interface ParsedWordsQuery {
  classroomId: string;
  isSummaryOnly: boolean;
  limit: number;
  offset: number;
  filter: string;
  q: string;
  sort: string;
  ids: string;
}

function parseWordsQueryInput(input?: VocabWordsQuery | string): ParsedWordsQuery {
  if (!input) {
    return {
      classroomId: '',
      isSummaryOnly: false,
      limit: 500,
      offset: 0,
      filter: '',
      q: '',
      sort: '',
      ids: '',
    };
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
      filter: sp.get('filter') || sp.get('status') || '',
      q: sp.get('q') || '',
      sort: sp.get('sort') || '',
      ids: sp.get('ids') || '',
    };
  }
  const isSummaryOnly =
    input.summary === true || input.summary === 1 || input.summary === '1';
  return {
    classroomId: input.classroomId || '',
    isSummaryOnly,
    limit: isSummaryOnly ? 0 : input.limit !== undefined ? Number(input.limit) : 500,
    offset: input.offset !== undefined ? Number(input.offset) : 0,
    filter: input.filter || input.status || '',
    q: input.q || '',
    sort: input.sort || '',
    ids: input.ids || '',
  };
}

interface RawAnalyticsCacheEntry {
  ok: boolean;
  status: number;
  data: Record<string, unknown> | undefined;
  timestamp: number;
}

const ANALYTICS_CACHE_TTL_MS = 12_000;
const analyticsCache = new Map<string, RawAnalyticsCacheEntry>();
const inflightAnalytics = new Map<string, Promise<RawAnalyticsCacheEntry>>();

function normalizeScopeKey(classroomId?: string | null): string {
  const raw = (classroomId || '').trim();
  if (!raw || raw === '__personal__' || raw === 'personal') return '__personal__';
  return raw;
}

function buildAnalyticsCacheKey(params: Record<string, unknown>): string {
  const scope = normalizeScopeKey(params.classroomId as string | undefined);
  const limit = Number(params.limit ?? 500);
  const offset = Number(params.offset ?? 0);
  const filter = String(params.filter ?? '').trim().toLowerCase();
  const q = String(params.q ?? '').trim().toLowerCase();
  const sort = String(params.sort ?? '').trim().toLowerCase();
  const ids = String(params.ids ?? '').trim();
  return `${scope}|${limit}|${offset}|${filter}|${q}|${sort}|${ids}`;
}

interface ImportWordPayloadItem {
  word: string;
  translation?: string;
  ipa?: string;
  pos?: string;
  example?: string;
  exampleVi?: string;
}

function enrichClientWordEntry(
  rawWord: string,
  provided?: Partial<{
    translation: string;
    ipa: string;
    pos: string;
    example: string;
    exampleVi: string;
  }>,
): ImportWordPayloadItem {
  const cleanWord = rawWord.trim();
  const stageItem = getVocabItem(cleanWord);
  const verbItem = !stageItem ? getFoundationVerb(cleanWord) : null;

  return {
    word: cleanWord,
    translation:
      provided?.translation?.trim() ||
      stageItem?.meaningVi ||
      verbItem?.meaningVi ||
      undefined,
    ipa: provided?.ipa?.trim() || stageItem?.ipa || verbItem?.ipa || undefined,
    pos: provided?.pos?.trim() || stageItem?.pos || (verbItem ? 'v' : undefined),
    example:
      provided?.example?.trim() ||
      stageItem?.example ||
      verbItem?.example ||
      undefined,
    exampleVi:
      provided?.exampleVi?.trim() ||
      stageItem?.exampleVi ||
      verbItem?.exampleVi ||
      undefined,
  };
}

/**
 * Domain API service for Vocabulary, FSRS-5 reviews, student analytics, and word packages.
 */
export class VocabApi {
  /**
   * Invalidates all cached `/vocab/analytics` responses after word or SRS mutations.
   */
  public static invalidateAnalyticsCache(): void {
    analyticsCache.clear();
    inflightAnalytics.clear();
  }

  /**
   * Shared single-flight & short-TTL fetcher for `GET /api/v1/vocab/analytics`.
   */
  public static async fetchAnalyticsRaw(
    params: Record<string, unknown>,
    options?: LegacyRequestOptions,
  ): Promise<RawAnalyticsCacheEntry> {
    const key = buildAnalyticsCacheKey(params);
    const now = Date.now();
    const cached = analyticsCache.get(key);
    if (cached && now - cached.timestamp < ANALYTICS_CACHE_TTL_MS) {
      return cached;
    }

    // If a summary-only request (limit=0, no filters) is made and we already have a fresh full response for the same scope, reuse its summary metrics!
    const isUnfilteredSummary =
      Number(params.limit ?? 0) === 0 &&
      !params.filter &&
      !params.q &&
      !params.ids;
    if (isUnfilteredSummary) {
      const scopePrefix = `${normalizeScopeKey(params.classroomId as string | undefined)}|`;
      for (const [existingKey, entry] of analyticsCache.entries()) {
        if (
          existingKey.startsWith(scopePrefix) &&
          now - entry.timestamp < ANALYTICS_CACHE_TTL_MS &&
          entry.ok &&
          entry.data
        ) {
          return entry;
        }
      }
      for (const [existingKey, inflight] of inflightAnalytics.entries()) {
        if (existingKey.startsWith(scopePrefix)) {
          return inflight;
        }
      }
    }

    const existingInflight = inflightAnalytics.get(key);
    if (existingInflight) {
      return existingInflight;
    }

    const promise = callDotNetRaw<Record<string, unknown>>('/vocab/analytics', {
      method: 'GET',
      params,
      signal: options?.signal,
      headers: options?.headers,
    })
      .then(({ ok, status, body }) => {
        const entry: RawAnalyticsCacheEntry = {
          ok,
          status,
          data: body?.data ?? undefined,
          timestamp: Date.now(),
        };
        if (ok && body?.data) {
          analyticsCache.set(key, entry);
          // Also populate the summary key (limit=0) for this scope if unfiltered
          if (!params.filter && !params.q && !params.ids) {
            const summaryKey = buildAnalyticsCacheKey({
              classroomId: params.classroomId,
              limit: 0,
              offset: 0,
            });
            analyticsCache.set(summaryKey, entry);
          }
        }
        return entry;
      })
      .finally(() => {
        inflightAnalytics.delete(key);
      });

    inflightAnalytics.set(key, promise);
    return promise;
  }

  /**
   * Fetches words and FSRS L1-L6 analytics via `GET /api/v1/vocab/analytics`.
   */
  public static async getWords(
    query?: VocabWordsQuery | string,
    options?: LegacyRequestOptions,
  ) {
    const parsed = parseWordsQueryInput(query);
    const params: Record<string, unknown> = {
      limit: parsed.limit,
      offset: parsed.offset,
    };
    if (parsed.classroomId) params.classroomId = parsed.classroomId;
    if (parsed.filter) params.filter = parsed.filter;
    if (parsed.q) params.q = parsed.q;
    if (parsed.sort) params.sort = parsed.sort;
    if (parsed.ids) params.ids = parsed.ids;

    const { ok, status, data } = await VocabApi.fetchAnalyticsRaw(params, options);
    const payload = mapVocabAnalyticsToWordsPayload(data, ok);
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
    const { ok, status, data } = await VocabApi.fetchAnalyticsRaw(
      { limit: 0, offset: 0 },
      options,
    );
    const payload = mapVocabAnalyticsToStudentStats(data, isLite, ok);
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
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>('/vocab/due', {
      method: 'GET',
      params: { limit },
    });
    const payload = mapDueWordsPayload(body?.data);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Submits an FSRS-5 card review via `POST /api/v1/vocab/review`.
   */
  public static async submitSrsReview(rawBody: unknown, options?: LegacyRequestOptions) {
    const body = normalizePayloadData(rawBody);
    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
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
    if (success) {
      VocabApi.invalidateAnalyticsCache();
    }
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
   * Fetches user's imported vocabulary packs via `GET /api/v1/vocab/packs`.
   */
  public static async getPacks() {
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>[]>('/vocab/packs', {
      method: 'GET',
    });
    const rawList = Array.isArray(body?.data) ? body.data : [];
    const packs = rawList.map((p) => {
      const wordIds = Array.isArray(p.wordIds) ? p.wordIds.map(String) : [];
      const packId = String(p.packId ?? p.pack_id ?? '');
      const topicId = String(p.topicId ?? p.topic_id ?? '');
      const topicTitle = String(p.topicTitle ?? p.topic_title ?? '');
      const packIndex = Number(p.packIndex ?? p.pack_index ?? 1);
      const packStatus =
        (p.status as 'not_started' | 'in_progress' | 'completed') ?? 'in_progress';
      const wordCount = Number(p.wordCount ?? p.word_count ?? wordIds.length);
      const reviewedCount = Number(p.reviewedCount ?? p.reviewed_count ?? 0);

      return {
        packId,
        topicId,
        topicTitle,
        packIndex,
        status: packStatus,
        wordCount,
        reviewedCount,
        startedAt: p.startedAt ? String(p.startedAt) : null,
        lastStudiedAt: p.lastStudiedAt ? String(p.lastStudiedAt) : null,
        completedAt: p.completedAt ? String(p.completedAt) : null,
        wordIds,
        pack_id: packId,
        topic_id: topicId,
        topic_title: topicTitle,
        pack_index: packIndex,
        word_count: wordCount,
        reviewed_count: reviewedCount,
        words: wordIds.map((wid, idx) => ({ word_id: wid, position: idx })),
      };
    });

    return withResponseCompat(
      {
        success: ok,
        packs,
        data: packs,
      },
      status,
      ok,
    );
  }

  /**
   * Creates or saves vocabulary word(s) to the user's personal or classroom deck.
   */
  public static async saveWords(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const rawWords = Array.isArray(payload.words)
      ? payload.words
      : payload.word
        ? [payload]
        : [];

    if (rawWords.length > 0) {
      const words: ImportWordPayloadItem[] = rawWords.map((item: unknown) => {
        if (typeof item === 'string') {
          return enrichClientWordEntry(item);
        }
        const obj = (item || {}) as Record<string, unknown>;
        return enrichClientWordEntry(String(obj.word || obj.term || ''), {
          translation: obj.translation ? String(obj.translation) : undefined,
          ipa: obj.ipa ? String(obj.ipa) : undefined,
          pos: obj.pos ? String(obj.pos) : undefined,
          example: obj.example ? String(obj.example) : undefined,
          exampleVi: (obj.example_vi ?? obj.exampleVi)
            ? String(obj.example_vi ?? obj.exampleVi)
            : undefined,
        });
      });

      const packId = String(payload.packId || `custom:${Date.now()}`);
      const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
        '/vocab/packs/import',
        {
          method: 'POST',
          data: {
            packId,
            topicId: 'custom',
            topicTitle: 'Từ vựng tự thêm',
            packIndex: 1,
            catalogVersion: CATALOG_VERSION,
            words,
          },
        },
      );
      VocabApi.invalidateAnalyticsCache();
      const resData = (body?.data || {}) as Record<string, unknown>;
      return withResponseCompat(
        {
          success: ok,
          imported: Number(resData.imported ?? words.length),
          classroomId: resData.classroomId ? String(resData.classroomId) : undefined,
          wordIds: Array.isArray(resData.wordIds) ? resData.wordIds.map(String) : [],
          data: resData,
        },
        status,
        ok,
      );
    }

    return callServerOriginApi('/api/words', {
      method: 'POST',
      data: payload,
    });
  }

  /**
   * Updates an existing vocabulary word.
   */
  public static async updateWord(rawBody: unknown) {
    VocabApi.invalidateAnalyticsCache();
    return callServerOriginApi('/api/words', {
      method: 'PUT',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Deletes vocabulary word(s).
   */
  public static async deleteWords(rawBody: unknown) {
    VocabApi.invalidateAnalyticsCache();
    return callServerOriginApi('/api/words', {
      method: 'DELETE',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Updates moderation status of a classroom vocabulary word (`PATCH /api/words/:id/status`).
   */
  public static async updateWordStatus(wordId: string, rawBody: unknown) {
    VocabApi.invalidateAnalyticsCache();
    return callServerOriginApi(`/api/words/${encodeURIComponent(wordId)}/status`, {
      method: 'PATCH',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Triggers background enrichment/refresh for newly imported words (no-op on SPA as `.NET 10` enriches during pack import).
   */
  public static async refreshWords(_rawBody: unknown) {
    return withResponseCompat({
      success: true,
      refreshed: 0,
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
   * Builds the full vocabulary library catalog tree from `vocab-catalog.ts` merged with the user's pack progress.
   */
  public static async getImportPackages() {
    const baseRoutes = getCatalogTree();
    let userPackMap = new Map<
      string,
      {
        status: 'in_progress' | 'completed';
        reviewedCount: number;
        wordCount: number;
        startedAt: string;
        lastStudiedAt: string;
        completedAt: string | null;
      }
    >();

    try {
      const packsRes = await VocabApi.getPacks();
      const packsJson = (await packsRes.json()) as {
        packs?: Array<{
          packId: string;
          status: string;
          reviewedCount: number;
          wordCount: number;
          startedAt?: string;
          lastStudiedAt?: string;
          completedAt?: string | null;
        }>;
      };
      if (Array.isArray(packsJson.packs)) {
        userPackMap = new Map(
          packsJson.packs.map((p) => [
            p.packId,
            {
              status: p.status === 'completed' ? 'completed' : 'in_progress',
              reviewedCount: p.reviewedCount,
              wordCount: p.wordCount,
              startedAt: p.startedAt ?? new Date().toISOString(),
              lastStudiedAt: p.lastStudiedAt ?? new Date().toISOString(),
              completedAt: p.completedAt ?? null,
            },
          ]),
        );
      }
    } catch {
      // Unauthenticated or offline: still render the full catalog tree with default 'not_started' status
    }

    const routes = baseRoutes.map((route) => ({
      ...route,
      topics: route.topics.map((topic) => ({
        ...topic,
        subtopics: topic.subtopics.map((sub) => ({
          ...sub,
          packs: sub.packs.map((pack) => {
            const prog = userPackMap.get(pack.id);
            return {
              ...pack,
              progress: prog,
            };
          }),
        })),
      })),
    }));

    return withResponseCompat({
      success: true,
      catalogVersion: CATALOG_VERSION,
      microPackSize: MICRO_PACK_SIZE,
      packSize: MICRO_PACK_SIZE,
      routes,
    });
  }

  /**
   * Resolves a vocabulary pack (`starter-*`, `topic-*`, or `pack:*`) and imports it via `POST /api/v1/vocab/packs/import`.
   */
  public static async importPackage(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody);
    const packId = String(payload.packId ?? payload.packageId ?? '').trim();
    if (!packId) {
      return withResponseCompat(
        { success: false, error: 'Thiếu mã gói từ vựng (packId).' },
        400,
        false,
      );
    }

    let topicId = packId;
    let topicTitle = packId;
    let packIndex = 1;
    let words: ImportWordPayloadItem[] = [];

    // 1. Check A0 Starter packs (e.g. starter-greetings, starter-daily, starter-toeic-core...)
    const starter = getStarterPack(packId);
    if (starter) {
      topicId = starter.id;
      topicTitle = starter.title;
      packIndex = 1;
      words = starter.words.map((w) => enrichClientWordEntry(w));
    }

    // 2. Check 3,000-word Stage Topics (e.g. topic-stage-1-01 or stage-1-01)
    if (words.length === 0) {
      const cleanStageTopicId = packId.replace(/^topic-/, '');
      const stageTopic = getVocabTopic(cleanStageTopicId);
      if (stageTopic) {
        topicId = stageTopic.id;
        topicTitle = stageTopic.title;
        packIndex = stageTopic.index;
        words = stageTopic.words.map((item) => ({
          word: item.word,
          translation: item.meaningVi,
          ipa: item.ipa,
          pos: item.pos,
          example: item.example,
          exampleVi: item.exampleVi,
        }));
      }
    }

    // 3. Check Library Catalog micro-packs (e.g. pack:thpt:g12:u1:p1, pack:toeic:600:01:p1...)
    if (words.length === 0) {
      const resolved = resolvePack(packId);
      if (resolved) {
        topicId = resolved.subtopicId;
        topicTitle = resolved.subtopicTitle;
        packIndex = resolved.index;
        words = resolved.words.map((word) => enrichClientWordEntry(word));
      }
    }

    if (words.length === 0) {
      return withResponseCompat(
        { success: false, error: `Không tìm thấy gói từ vựng "${packId}".` },
        404,
        false,
      );
    }

    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>(
      '/vocab/packs/import',
      {
        method: 'POST',
        data: {
          packId,
          topicId,
          topicTitle,
          packIndex,
          catalogVersion: CATALOG_VERSION,
          words,
        },
      },
    );

    if (!ok || !body?.data) {
      return withResponseCompat(
        {
          success: false,
          error: body?.message || 'Không mở được gói từ vựng. Vui lòng thử lại.',
        },
        status || 500,
        false,
      );
    }

    VocabApi.invalidateAnalyticsCache();
    const resData = body.data;
    const wordIds = Array.isArray(resData.wordIds) ? resData.wordIds.map(String) : [];

    return withResponseCompat(
      {
        success: true,
        imported: Number(resData.imported ?? 0),
        totalInPack: Number(resData.totalInPack ?? words.length),
        classroomId: String(resData.classroomId ?? ''),
        packId: String(resData.packId ?? packId),
        topicTitle: String(resData.topicTitle ?? topicTitle),
        packIndex: Number(resData.packIndex ?? packIndex),
        wordIds,
        data: resData,
      },
      status,
      true,
    );
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
   * Loads a single vocabulary topic word list on demand from `vocab-stages.ts`.
   */
  public static async getVocabTopic(topicId: string) {
    const cleanId = topicId.replace(/^topic-/, '').trim();
    const topic = getVocabTopic(cleanId);
    if (!topic) {
      return withResponseCompat(
        { success: false, error: `Topic "${topicId}" not found` },
        404,
        false,
      );
    }
    return withResponseCompat({
      success: true,
      topic,
      data: topic,
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
