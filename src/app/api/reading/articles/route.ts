/**
 * Reading Articles API Endpoint
 *
 * Query reading articles with high-performance range pagination,
 * CEFR level filtering (A1-C2), and 15 theme classifications.
 * Compliant with GEMINI.md Rule 3:
 * - No premature HEAD count queries (detects hasMore via limit + 1)
 * - Concurrent Promise.all pipelines
 * - Resilient fallback to local catalog if table is not yet migrated
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { parseToeicArticles, parseVstepArticles } from '@/lib/reading-article-parser';
import { isValidPackThemeId } from '@/lib/pack-themes';
import type { ReadingArticle, CEFRLevel } from '@/types/reading-library';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// In-memory cache for local fallback
let localCache: ReadingArticle[] | null = null;

function getLocalArticles(): ReadingArticle[] {
  if (localCache) return localCache;

  const list: ReadingArticle[] = [];
  try {
    const toeic = parseToeicArticles();
    list.push(...toeic);
  } catch (e) {
    console.warn('[Reading API] Failed to load local TOEIC articles:', e);
  }

  try {
    const vstep = parseVstepArticles();
    list.push(...vstep);
  } catch (e) {
    console.warn('[Reading API] Failed to load local VSTEP articles:', e);
  }

  try {
    const extPath = path.resolve(process.cwd(), 'src/data/reading/external-starter-articles.json');
    if (fs.existsSync(extPath)) {
      const extRaw = fs.readFileSync(extPath, 'utf-8');
      const extList: ReadingArticle[] = JSON.parse(extRaw);
      list.push(...extList);
    }
  } catch (e) {
    console.warn('[Reading API] Failed to load external starter articles:', e);
  }

  localCache = list;
  return list;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const levelParam = searchParams.get('level');
    const themeParam = searchParams.get('theme');
    const sourceParam = searchParams.get('source');
    const search = searchParams.get('search')?.trim();
    const withContent = searchParams.get('with_content') !== 'false';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const includeCount = searchParams.get('include_count') === 'true';

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 1. Single article lookup by ID or Slug
    if (id || slug) {
      try {
        const supabase = createServiceClient();
        let query = supabase.from('reading_articles').select('*');

        if (id) {
          if (UUID_REGEX.test(id)) {
            query = query.eq('id', id);
          } else {
            // Slug was passed into id param
            query = query.eq('slug', id);
          }
        } else if (slug) {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return NextResponse.json(
            { article: data },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
              },
            }
          );
        }
      } catch (err) {
        console.warn('[Reading API] Supabase single query error:', err);
      }

      // Check local cache fallback for single article
      const localArticles = getLocalArticles();
      const match = localArticles.find(
        (a) => (id && (a.id === id || a.slug === id)) || (slug && a.slug === slug)
      );
      if (match) {
        return NextResponse.json({ article: match });
      }

      return NextResponse.json(
        { error: 'Article not found', article: null },
        { status: 404 }
      );
    }

    // 2. Range query for articles list (GEMINI.md Rule 3)
    let supabaseResult: {
      articles: ReadingArticle[];
      hasMore: boolean;
      total?: number;
    } | null = null;

    try {
      const supabase = createServiceClient();

      // Range pagination according to GEMINI.md Rule 3:
      // Fetch limit + 1 items to determine hasMore without premature HEAD count query
      const from = (page - 1) * limit;
      const to = from + limit; // retrieves limit + 1 records

      const selectCols = withContent
        ? '*'
        : 'id, slug, title, cefr_level, theme_id, summary, word_count, estimated_read_minutes, source_type, difficulty_score, created_at, status';

      let query = supabase
        .from('reading_articles')
        .select(selectCols)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (levelParam && levelParam.toLowerCase() !== 'all') {
        const levels = levelParam.split(',').map((l) => l.trim().toUpperCase());
        if (levels.length === 1) {
          query = query.eq('cefr_level', levels[0]);
        } else {
          query = query.in('cefr_level', levels);
        }
      }

      if (themeParam && isValidPackThemeId(themeParam)) {
        query = query.eq('theme_id', themeParam);
      }

      if (sourceParam && sourceParam.toLowerCase() !== 'all') {
        query = query.eq('source_type', sourceParam);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const queryPromise = query;
      let countPromise: Promise<number | undefined> = Promise.resolve(undefined);

      // Only perform exact count if explicitly requested AND client asks for it
      if (includeCount) {
        let countQuery = supabase
          .from('reading_articles')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published');

        if (levelParam && levelParam.toLowerCase() !== 'all') {
          const levels = levelParam.split(',').map((l) => l.trim().toUpperCase());
          countQuery = levels.length === 1 ? countQuery.eq('cefr_level', levels[0]) : countQuery.in('cefr_level', levels);
        }
        if (themeParam && isValidPackThemeId(themeParam)) {
          countQuery = countQuery.eq('theme_id', themeParam);
        }
        if (sourceParam && sourceParam.toLowerCase() !== 'all') {
          countQuery = countQuery.eq('source_type', sourceParam);
        }
        if (search) {
          countQuery = countQuery.ilike('title', `%${search}%`);
        }

        countPromise = Promise.resolve(
          countQuery.then(({ count }) => count ?? undefined)
        );
      }

      // Concurrent pipeline execution
      const [res, totalCount] = await Promise.all([queryPromise, countPromise]);

      if (!res.error && res.data) {
        const rows = res.data as unknown as ReadingArticle[];
        const hasMore = rows.length > limit;
        const pageItems = hasMore ? rows.slice(0, limit) : rows;

        supabaseResult = {
          articles: pageItems,
          hasMore,
          total: totalCount,
        };
      }
    } catch {
      // Supabase table missing or connection issue — fall back smoothly
      supabaseResult = null;
    }

    // 2. If Supabase returned results, respond immediately
    if (supabaseResult) {
      return NextResponse.json(
        {
          articles: supabaseResult.articles,
          pagination: {
            page,
            limit,
            hasMore: supabaseResult.hasMore,
            total: supabaseResult.total,
          },
          filters: {
            level: levelParam || null,
            theme: themeParam || null,
            source: sourceParam || null,
          },
          source: 'database',
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        }
      );
    }

    // 3. Fallback: Query local articles in memory
    const localArticles = getLocalArticles();

    let filtered = localArticles;

    if (levelParam && levelParam.toLowerCase() !== 'all') {
      const levels = levelParam.split(',').map((l) => l.trim().toUpperCase() as CEFRLevel);
      filtered = filtered.filter((a) => levels.includes(a.cefr_level));
    }

    if (themeParam && isValidPackThemeId(themeParam)) {
      filtered = filtered.filter((a) => a.theme_id === themeParam);
    }

    if (sourceParam && sourceParam.toLowerCase() !== 'all') {
      filtered = filtered.filter((a) => a.source_type === sourceParam);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) => a.title.toLowerCase().includes(q) || a.passage_plain.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const pageItems = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

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

    return NextResponse.json(
      {
        articles: sanitizedItems,
        pagination: {
          page,
          limit,
          hasMore,
          total,
        },
        filters: {
          level: levelParam || null,
          theme: themeParam || null,
          source: sourceParam || null,
        },
        source: 'local_fallback',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch reading articles' },
      { status: 500 }
    );
  }
}
