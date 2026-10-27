import {
  callDotNetRaw,
  callServerOriginApi,
  normalizePayloadData,
} from '@/shared/api/client';
import { withResponseCompat } from '@/shared/api/unwrap';
import {
  mapDailyReadingResponse,
  normalizeReadingArticle,
} from '@/features/reading/mappers';
import { loadAllLocalReadingArticles } from '@/lib/reading-article-parser';
import { isValidPackThemeId } from '@/lib/pack-themes';
import { readLocalBookmarks, writeLocalBookmark } from '@/lib/reading-library-cache';
import type { CEFRLevel, ReadingArticle } from '@/types/reading-library';

let cachedMergedCatalogPromise: Promise<ReadingArticle[]> | null = null;

function hasValidQuestionStems(questions?: ReadingArticle['questions']): boolean {
  return Boolean(
    Array.isArray(questions) &&
      questions.length > 0 &&
      questions.every((q) => Boolean(q?.question && q.question.trim().length > 0)),
  );
}

async function getFullReadingCatalog(): Promise<ReadingArticle[]> {
  if (!cachedMergedCatalogPromise) {
    cachedMergedCatalogPromise = (async () => {
      const [localArticles, remoteRes] = await Promise.all([
        loadAllLocalReadingArticles(),
        callDotNetRaw<Record<string, unknown>[]>('/reading/articles', {
          method: 'GET',
        }).catch(() => ({ ok: false, status: 0, body: null })),
      ]);

      const remoteRaw = Array.isArray(remoteRes.body?.data) ? remoteRes.body.data : [];
      const remoteArticles = remoteRaw
        .map((item) => normalizeReadingArticle(item))
        .filter((art) => Boolean(art.slug && art.passage));

      if (remoteArticles.length === 0) {
        return localArticles;
      }

      const localBySlug = new Map<string, ReadingArticle>();
      for (const localArt of localArticles) {
        localBySlug.set(localArt.slug, localArt);
      }

      // Preserve exact database order (ORDER BY created_at DESC from public.reading_articles)
      // as in commit e9911557a95f51f714f746c8b8078d61c95ac4bf, while enriching any missing local fields.
      const seenSlugs = new Set<string>();
      const merged: ReadingArticle[] = [];

      for (const dbArt of remoteArticles) {
        seenSlugs.add(dbArt.slug);
        const localArt = localBySlug.get(dbArt.slug);
        if (localArt) {
          merged.push({
            ...localArt,
            ...dbArt,
            id: dbArt.id || localArt.id,
            passage: dbArt.passage || localArt.passage,
            passage_plain: dbArt.passage_plain || localArt.passage_plain,
            translation: dbArt.translation || localArt.translation,
            summary: dbArt.summary || localArt.summary,
            cloze: dbArt.cloze?.blanks?.length ? dbArt.cloze : localArt.cloze,
            questions: hasValidQuestionStems(dbArt.questions)
              ? dbArt.questions
              : hasValidQuestionStems(localArt.questions)
                ? localArt.questions
                : dbArt.questions?.length
                  ? dbArt.questions
                  : localArt.questions,
            vocabulary_highlights: dbArt.vocabulary_highlights?.length
              ? dbArt.vocabulary_highlights
              : localArt.vocabulary_highlights,
            mindmap_data: dbArt.mindmap_data?.root ? dbArt.mindmap_data : localArt.mindmap_data,
          });
        } else {
          merged.push(dbArt);
        }
      }

      for (const localArt of localArticles) {
        if (!seenSlugs.has(localArt.slug)) {
          merged.push(localArt);
        }
      }

      return merged;
    })();
  }
  return cachedMergedCatalogPromise;
}

/**
 * Domain API service for Reading Library, Daily Reading, Pack Passages, and CodeMix Practice.
 */
export class ReadingApi {
  /**
   * Retrieves bilingual reading articles with full 588-article catalog, filtering, single-article lookup, and pagination.
   */
  public static async getArticles(params?: Record<string, unknown> | string) {
    let queryParams: Record<string, string> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : params.startsWith('/') ? '' : params;
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      );
    }

    const catalog = await getFullReadingCatalog();

    const idParam = queryParams.id?.trim();
    const slugParam = queryParams.slug?.trim();

    // Case 1: Single article lookup by ID or Slug
    if (idParam || slugParam) {
      const match = catalog.find(
        (a) =>
          (idParam && (a.id === idParam || a.slug === idParam)) ||
          (slugParam && (a.slug === slugParam || a.id === slugParam)),
      );
      if (!match) {
        return withResponseCompat({ error: 'Article not found', article: null }, 404, false);
      }
      return withResponseCompat({ success: true, article: match }, 200, true);
    }

    // Case 2: Paginated list with filters (level, theme, source, search) matching commit e9911557a95f51f714f746c8b8078d61c95ac4bf
    const levelParam = queryParams.level?.trim();
    const themeParam = queryParams.theme?.trim();
    const sourceParam = queryParams.source?.trim();
    const search = (queryParams.search || queryParams.q || '').trim().toLowerCase();
    const withContent = queryParams.with_content !== 'false';
    const page = Math.max(1, parseInt(queryParams.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || '20', 10) || 20));
    const offset = (page - 1) * limit;

    let filtered = catalog;

    if (levelParam && levelParam.toLowerCase() !== 'all') {
      const levels = levelParam.split(',').map((l) => l.trim().toUpperCase() as CEFRLevel);
      filtered = filtered.filter((a) => levels.includes(a.cefr_level));
    }

    if (themeParam && themeParam.toLowerCase() !== 'all' && isValidPackThemeId(themeParam)) {
      filtered = filtered.filter((a) => a.theme_id === themeParam);
    }

    if (sourceParam && sourceParam.toLowerCase() !== 'all') {
      const srcLower = sourceParam.toLowerCase();
      filtered = filtered.filter((a) => a.source_type === srcLower);
    }

    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          (a.passage_plain || '').toLowerCase().includes(search),
      );
    }

    const totalCount = filtered.length;
    const pageItems = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    const sanitizedItems = withContent
      ? pageItems
      : pageItems.map((a) => ({
          id: a.id || a.slug,
          slug: a.slug,
          title: a.title,
          cefr_level: a.cefr_level,
          theme_id: a.theme_id,
          summary: a.summary,
          word_count: a.word_count,
          estimated_read_minutes: a.estimated_read_minutes,
          source_type: a.source_type,
          difficulty_score: a.difficulty_score,
          created_at: a.created_at,
          status: a.status,
        }));

    return withResponseCompat(
      {
        success: true,
        articles: sanitizedItems,
        data: sanitizedItems,
        pagination: {
          page,
          limit,
          hasMore,
          total: totalCount,
        },
        filters: {
          level: levelParam || null,
          theme: themeParam || null,
          source: sourceParam || null,
        },
        source: 'database',
      },
      200,
      true,
    );
  }

  /**
   * Retrieves reading progress and bookmarks.
   */
  public static async getProgress() {
    const bookmarks = Array.from(readLocalBookmarks());
    return withResponseCompat(
      {
        success: true,
        bookmarks,
        progress: [],
      },
      200,
      true,
    );
  }

  /**
   * Submits reading progress (handles both Reading Library bookmarks/scores and Daily Reading completion).
   */
  public static async submitProgress(rawBody: unknown) {
    const payload = normalizePayloadData(rawBody) as Record<string, unknown> | undefined;

    // Reading Library bookmark / article progress payload
    if (payload && ('article_id' in payload || 'is_bookmarked' in payload || 'mcq_score' in payload)) {
      const articleId = String(payload.article_id || '');
      if (articleId && typeof payload.is_bookmarked === 'boolean') {
        writeLocalBookmark(articleId, payload.is_bookmarked);
      }
      return withResponseCompat(
        {
          success: true,
          progress: payload,
        },
        200,
        true,
      );
    }

    const { ok, status, body: resBody } = await callDotNetRaw<Record<string, unknown>>(
      '/reading/daily/submit',
      {
        method: 'POST',
        data: payload,
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
   * Retrieves the daily reading exercise via `GET /api/v1/reading/daily`.
   */
  public static async getDailyReading(params?: { recent?: number } | string) {
    let queryParams: Record<string, unknown> = {};
    if (typeof params === 'string') {
      const qIdx = params.indexOf('?');
      const raw = qIdx >= 0 ? params.slice(qIdx + 1) : '';
      queryParams = Object.fromEntries(new URLSearchParams(raw).entries());
    } else if (params) {
      queryParams = params as Record<string, unknown>;
    }
    const { ok, status, body } = await callDotNetRaw<Record<string, unknown>>('/reading/daily', {
      method: 'GET',
      params: queryParams,
    });
    const payload = mapDailyReadingResponse(body?.data, ok);
    return withResponseCompat(payload, status, ok);
  }

  /**
   * Submits daily reading completion (`POST /api/v1/reading/daily/submit`).
   */
  public static async submitDailyReading(rawBody: unknown) {
    return ReadingApi.submitProgress(rawBody);
  }

  /**
   * Saves a word encountered in daily reading.
   */
  public static async saveDailyReadingWord(rawBody: unknown) {
    return callServerOriginApi('/api/practice/daily-reading/save-word', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a custom daily reading passage.
   */
  public static async generateDailyReading(rawBody?: unknown) {
    return callServerOriginApi('/api/practice/daily-reading/generate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a reading passage from a vocabulary pack (`/api/practice/pack-passage`).
   */
  public static async generatePackPassage(rawBody: unknown) {
    return callServerOriginApi('/api/practice/pack-passage', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Evaluates or upgrades a CodeMix sentence (`/api/practice/codemix-upgrade`).
   */
  public static async upgradeCodemix(rawBody: unknown) {
    return callServerOriginApi('/api/practice/codemix-upgrade', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Loads demo pack passage data (`/api/demo/pack-passage`).
   */
  public static async getDemoPackPassage() {
    return callServerOriginApi('/api/demo/pack-passage', {
      method: 'GET',
    });
  }

  /**
   * Generates a vocabulary mindmap (`/api/mindmap/generate`).
   */
  public static async generateMindmap(rawBody: unknown) {
    return callServerOriginApi('/api/mindmap/generate', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }

  /**
   * Generates a NotebookLM-style synthesis (`/api/mindmap/nlm`).
   */
  public static async generateMindmapNlm(rawBody: unknown) {
    return callServerOriginApi('/api/mindmap/nlm', {
      method: 'POST',
      data: normalizePayloadData(rawBody),
    });
  }
}
