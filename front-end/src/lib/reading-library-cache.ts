/**
 * Client-side Storage & Snapshot Cache for Reading Library
 * Compliant with GEMINI.md Rule 3 (Instant Hydration & 0ms perceived latency)
 */

import type { ReadingArticle, CEFRLevel } from '@/types/reading-library';

const CACHE_KEY_PREFIX = 'lp:reading_library:query_v1';
const BOOKMARKS_KEY = 'lp:reading_library:bookmarks_v1';

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

function getSession(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLocal(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
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
  const session = getSession();
  if (!session) return null;
  try {
    const raw = session.getItem(buildCacheKey(opts));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLibraryResponse;
    // Stale window: 15 minutes
    if (Date.now() - parsed.timestamp > 15 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLibraryCache(data: CachedLibraryResponse): void {
  const session = getSession();
  if (!session) return;
  try {
    const key = buildCacheKey({
      page: data.page,
      level: data.level,
      theme: data.theme,
      source: data.source,
      search: data.search,
    });
    session.setItem(key, JSON.stringify(data));
  } catch {
    // quota exceeded, ignore
  }
}

export function readLocalBookmarks(): Set<string> {
  const local = getLocal() || getSession();
  if (!local) return new Set();
  try {
    const raw = local.getItem(BOOKMARKS_KEY);
    if (!raw) return new Set();
    const list = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
}

export function writeLocalBookmark(articleId: string, isBookmarked: boolean): void {
  const local = getLocal() || getSession();
  if (!local) return;
  try {
    const current = readLocalBookmarks();
    if (isBookmarked) {
      current.add(articleId);
    } else {
      current.delete(articleId);
    }
    local.setItem(BOOKMARKS_KEY, JSON.stringify(Array.from(current)));
  } catch {
    // ignore quota error
  }
}
