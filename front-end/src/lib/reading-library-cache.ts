/**
 * Client-side Storage & Snapshot Cache for Reading Library
 * Compliant with GEMINI.md Rule 3 (Instant Hydration & 0ms perceived latency)
 */

import type { ReadingArticle } from '@/types/reading-library';
import { BrowserStorage, STORAGE_KEYS } from '@/shared/lib/storage';

const CACHE_KEY_PREFIX = `${STORAGE_KEYS.READING_LIBRARY_QUERY_PREFIX}:v2`;
const BOOKMARKS_KEY = STORAGE_KEYS.READING_LIBRARY_BOOKMARKS;

export interface CachedLibraryResponse {
  articles: ReadingArticle[];
  hasMore: boolean;
  total?: number;
  page: number;
  level: string;
  theme: string;
  source: string;
  search: string;
  timestamp: number;
}

export function buildCacheKey(opts: {
  page: number;
  level: string;
  theme: string;
  source: string;
  search: string;
}): string {
  return `${CACHE_KEY_PREFIX}:${opts.level || 'all'}:${opts.theme || 'all'}:${opts.source || 'all'}:${opts.page}:${opts.search || ''}`;
}

export function readLibraryCache(opts: {
  page: number;
  level: string;
  theme: string;
  source: string;
  search: string;
}): CachedLibraryResponse | null {
  const parsed = BrowserStorage.getSession<CachedLibraryResponse | null>(buildCacheKey(opts), null);
  if (!parsed || !Array.isArray(parsed.articles)) return null;
  // Stale window: 15 minutes
  if (Date.now() - parsed.timestamp > 15 * 60 * 1000) return null;
  // Invalidate legacy/broken cache entries missing snake_case ReadingArticle fields or full catalog
  if (
    parsed.articles.length === 0 ||
    parsed.articles.some((a) => !a?.cefr_level || !a?.passage) ||
    ((!opts.level || opts.level === 'all') &&
      (!opts.theme || opts.theme === 'all') &&
      (!opts.source || opts.source === 'all') &&
      !opts.search &&
      (parsed.total ?? parsed.articles.length) < 18)
  ) {
    return null;
  }
  return parsed;
}

export function writeLibraryCache(data: CachedLibraryResponse): void {
  const key = buildCacheKey({
    page: data.page,
    level: data.level,
    theme: data.theme,
    source: data.source,
    search: data.search,
  });
  BrowserStorage.setSession(key, data);
}

export function readLocalBookmarks(): Set<string> {
  const list = BrowserStorage.getLocal<string[] | null>(
    BOOKMARKS_KEY,
    BrowserStorage.getSession<string[] | null>(BOOKMARKS_KEY, null),
  );
  return new Set(Array.isArray(list) ? list : []);
}

export function writeLocalBookmark(articleId: string, isBookmarked: boolean): void {
  const current = readLocalBookmarks();
  if (isBookmarked) {
    current.add(articleId);
  } else {
    current.delete(articleId);
  }
  const serialized = Array.from(current);
  BrowserStorage.setLocal(BOOKMARKS_KEY, serialized);
  BrowserStorage.setSession(BOOKMARKS_KEY, serialized);
}
