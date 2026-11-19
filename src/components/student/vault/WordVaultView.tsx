'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import {
  fetchWordSummaryOnce,
  useStudentContext,
  type WordSummaryData,
} from '@/components/student/StudentProvider';
import { Badge } from '@/components/ui/badge';
import { WordCardSkeleton } from '@/components/ui/WordCardSkeleton';
import { authFetch } from '@/lib/auth-fetch';
import { SRS_LEVEL_LABELS, SRS_LEVEL_STABILITY_HINT } from '@/lib/srs';
import { parseIpa } from '@/lib/study';
import { supabase, type Word } from '@/lib/supabase';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  invalidateWordSummaryCache,
} from '@/lib/word-summary-cache';

const WordDetailModal = dynamic(
  () => import('@/components/student/WordDetailModal').then((m) => m.WordDetailModal),
  { ssr: false },
);

const WORDS_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

const LEVEL_BAR_COLORS = [
  'bg-rose-400',
  'bg-amber-400',
  'bg-sky-400',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-purple-500',
] as const;

type VaultStatusFilter = 'all' | 'new' | 'due' | 'learned' | 'mastered';
type VaultSortBy = 'newest' | 'oldest' | 'az' | 'hardest';

type WordWithSource = Word & {
  source?: string;
  reviewCount?: number;
};

interface EnrolledClassroom {
  id: string;
  name: string;
  description?: string | null;
}

const STATUS_OPTIONS: ReadonlyArray<{ value: VaultStatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'new', label: 'Mới' },
  { value: 'due', label: 'Đến hạn' },
  { value: 'learned', label: 'Đã học' },
  { value: 'mastered', label: 'Thành thạo' },
];

const EMPTY_SUMMARY: WordSummaryData = {
  total: 0,
  newCount: 0,
  reviewDueCount: 0,
  dueCount: 0,
  classroomId: null,
  levelCounts: [0, 0, 0, 0, 0, 0],
};

function hasClassQueryParam(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(new URLSearchParams(window.location.search).get('class')?.trim());
  } catch {
    return false;
  }
}

function normalizeSummary(data: WordSummaryData): WordSummaryData {
  return {
    ...data,
    levelCounts:
      Array.isArray(data.levelCounts) && data.levelCounts.length === 6
        ? data.levelCounts
        : [0, 0, 0, 0, 0, 0],
  };
}

function resolvePersonalSummaryFallback(
  userId: string | null,
  contextSummary?: WordSummaryData,
): WordSummaryData | null {
  if (
    contextSummary &&
    (!contextSummary.classroomId || contextSummary.classroomId === '__personal__') &&
    (contextSummary.total > 0 || (contextSummary.levelCounts?.length ?? 0) === 6)
  ) {
    return normalizeSummary(contextSummary);
  }
  const cached = userId ? readWordSummaryCache(userId) : readLastWordSummaryCache();
  if (cached && (!cached.classroomId || cached.classroomId === '__personal__')) {
    return normalizeSummary({
      total: cached.total,
      newCount: cached.newCount,
      reviewDueCount: cached.reviewDueCount,
      dueCount: cached.dueCount ?? 0,
      classroomId: cached.classroomId ?? null,
      levelCounts: cached.levelCounts,
    });
  }
  return null;
}

function buildInitialSummary(contextSummary?: WordSummaryData): {
  summary: WordSummaryData;
  ready: boolean;
} {
  if (hasClassQueryParam()) {
    return {
      summary: EMPTY_SUMMARY,
      ready: false,
    };
  }
  const initial = resolvePersonalSummaryFallback(null, contextSummary);
  if (initial) {
    return {
      summary: initial,
      ready: true,
    };
  }
  return {
    summary: EMPTY_SUMMARY,
    ready: false,
  };
}

export function WordVaultView() {
  const router = useRouter();
  const studentCtx = useStudentContext();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const userId = authUserId ?? studentCtx?.session?.user?.id ?? null;
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [currentClassScope, setCurrentClassScope] = useState<string>('__personal__');
  const [enrolledClassrooms, setEnrolledClassrooms] = useState<EnrolledClassroom[]>([]);

  const [summaryState, setSummaryState] = useState<{
    summary: WordSummaryData;
    ready: boolean;
  }>(() => buildInitialSummary(studentCtx?.wordSummary));

  const [words, setWords] = useState<WordWithSource[]>([]);
  const [listTotal, setListTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VaultStatusFilter>('all');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<VaultSortBy>('newest');

  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const listRequestSeqRef = useRef(0);
  const summaryRequestSeqRef = useRef(0);
  const personalSummaryRef = useRef<WordSummaryData | undefined>(studentCtx?.wordSummary);

  useEffect(() => {
    personalSummaryRef.current = studentCtx?.wordSummary;
  }, [studentCtx?.wordSummary]);

  const ctxSummary = studentCtx?.wordSummary;
  const ctxSummaryReady = Boolean(
    ctxSummary &&
      (!ctxSummary.classroomId || ctxSummary.classroomId === '__personal__') &&
      (ctxSummary.total > 0 || (ctxSummary.levelCounts?.length ?? 0) === 6),
  );
  const useContextPersonalSummary =
    scopeInitialized &&
    currentClassScope === '__personal__' &&
    ctxSummaryReady &&
    Boolean(ctxSummary);

  const summary: WordSummaryData = useContextPersonalSummary
    ? normalizeSummary(ctxSummary!)
    : summaryState.summary;

  const countsReady = useContextPersonalSummary ? true : summaryState.ready;

  // Sync ?class= on mount & check auth
  useEffect(() => {
    let isCancelled = false;

    const bootstrapAuth = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      try {
        const params = new URLSearchParams(window.location.search);
        const urlClass = params.get('class')?.trim() || '';
        if (urlClass) {
          setCurrentClassScope(urlClass);
        }
      } catch {
        // ignore malformed URL
      } finally {
        if (!isCancelled) {
          setScopeInitialized(true);
        }
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (isCancelled) return;
        if (error) return;
        if (!session?.user) {
          const redirectTarget = `${window.location.pathname}${window.location.search}`;
          router.replace(`/auth?redirectTo=${encodeURIComponent(redirectTarget)}`);
          return;
        }
        setAuthUserId(session.user.id);
      } catch {
        // preserve offline state
      }
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (isCancelled) return;
      if (event === 'SIGNED_OUT') {
        router.replace('/auth');
      } else if (nextSession?.user?.id) {
        setAuthUserId(nextSession.user.id);
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  // Debounce search query (<= 300ms)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Fetch enrolled classrooms once on auth
  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    const loadClassrooms = async () => {
      try {
        const res = await authFetch('/api/student/classrooms');
        if (!res.ok) return;
        const json = (await res.json()) as {
          success?: boolean;
          classrooms?: EnrolledClassroom[];
        };
        if (!isCancelled && json?.success && Array.isArray(json.classrooms)) {
          setEnrolledClassrooms(json.classrooms);
        }
      } catch {
        // optional classroom switcher
      }
    };

    void loadClassrooms();
    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const fetchSummary = useCallback(
    async (scope: string, forceFresh = false) => {
      if (!userId) return;
      const reqId = ++summaryRequestSeqRef.current;

      if (scope === '__personal__') {
        const fresh = forceFresh
          ? await authFetch('/api/words?summary=1&levels=1')
              .then((r) => (r.ok ? r.json() : null))
              .then((j) =>
                j?.success
                  ? ({
                      total: Number(j.total ?? 0),
                      newCount: Number(j.newCount ?? 0),
                      reviewDueCount: Number(j.reviewDueCount ?? 0),
                      dueCount: Number(j.dueCount ?? 0),
                      classroomId: j.classroomId ?? null,
                      levelCounts: Array.isArray(j.levelCounts)
                        ? j.levelCounts.map((n: unknown) => Number(n) || 0)
                        : [0, 0, 0, 0, 0, 0],
                    } satisfies WordSummaryData)
                  : null,
              )
              .catch(() => null)
          : await fetchWordSummaryOnce(userId);

        if (reqId !== summaryRequestSeqRef.current) return;
        if (!fresh) {
          const fallback = resolvePersonalSummaryFallback(userId, personalSummaryRef.current);
          if (fallback) {
            setSummaryState({ summary: fallback, ready: true });
          }
          return;
        }
        setSummaryState({ summary: normalizeSummary(fresh), ready: true });
        return;
      }

      try {
        const res = await authFetch(
          `/api/words?summary=1&levels=1&classroomId=${encodeURIComponent(scope)}`,
        );
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          total?: number;
          newCount?: number;
          reviewDueCount?: number;
          dueCount?: number;
          classroomId?: string | null;
          levelCounts?: unknown[];
        } | null;
        if (reqId !== summaryRequestSeqRef.current) return;
        if (res.ok && json?.success) {
          setSummaryState({
            summary: {
              total: Number(json.total ?? 0),
              newCount: Number(json.newCount ?? 0),
              reviewDueCount: Number(json.reviewDueCount ?? 0),
              dueCount: Number(json.dueCount ?? 0),
              classroomId: json.classroomId ?? scope,
              levelCounts:
                Array.isArray(json.levelCounts) && json.levelCounts.length === 6
                  ? json.levelCounts.map((n) => Number(n) || 0)
                  : [0, 0, 0, 0, 0, 0],
            },
            ready: true,
          });
        }
      } catch {
        // keep prior summary on transient failure
      }
    },
    [userId],
  );

  // Sync summary when scope or user changes
  useEffect(() => {
    if (!userId || !scopeInitialized) return;
    let isCancelled = false;
    void Promise.resolve().then(() => {
      if (!isCancelled) {
        void fetchSummary(currentClassScope);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [userId, scopeInitialized, currentClassScope, fetchSummary]);

  const fetchWordsPage = useCallback(
    async (targetOffset: number) => {
      if (!userId || !scopeInitialized) return;
      const reqId = ++listRequestSeqRef.current;
      const isInitialPage = targetOffset === 0;

      await Promise.resolve();
      if (reqId !== listRequestSeqRef.current) return;

      if (isInitialPage) {
        setIsLoadingList(true);
      } else {
        setIsLoadingMore(true);
      }
      setListError(null);

      try {
        const params = new URLSearchParams({
          limit: String(WORDS_PAGE_SIZE),
          offset: String(targetOffset),
          status: statusFilter,
          sort: sortBy,
        });
        if (currentClassScope !== '__personal__') {
          params.set('classroomId', currentClassScope);
        }
        const trimmedQ = debouncedQuery.trim();
        if (trimmedQ) {
          params.set('q', trimmedQ);
        }
        if (levelFilter !== null) {
          params.set('level', String(levelFilter));
        }

        const res = await authFetch(`/api/words?${params.toString()}`);
        const json = (await res.json().catch(() => null)) as {
          success?: boolean;
          data?: WordWithSource[];
          total?: number | null;
          hasMore?: boolean;
          error?: string;
          message?: string;
        } | null;

        if (reqId !== listRequestSeqRef.current) return;

        if (!res.ok || !json?.success) {
          const fallbackMsg =
            res.status === 429
              ? 'Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.'
              : res.status === 401
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : res.status === 503
                  ? 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.'
                  : 'Không tải được danh sách từ. Vui lòng thử lại.';
          const rawMessage = typeof json?.message === 'string' ? json.message.trim() : '';
          const rawError = typeof json?.error === 'string' ? json.error.trim() : '';
          const isMachineCode =
            /^[A-Z0-9_]+$/.test(rawError) ||
            rawError === 'Unauthorized' ||
            rawError === 'Authentication temporarily unavailable';
          const displayMsg =
            rawMessage || (!isMachineCode && rawError ? rawError : '') || fallbackMsg;
          setListError(displayMsg);
          return;
        }

        const incoming = Array.isArray(json.data) ? json.data : [];
        if (isInitialPage) {
          setWords(incoming);
        } else {
          setWords((prev) => {
            const seen = new Set(prev.map((w) => w.id));
            const next = [...prev];
            for (const item of incoming) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                next.push(item);
              }
            }
            return next;
          });
        }

        setListTotal(typeof json.total === 'number' ? json.total : null);
        setHasMore(Boolean(json.hasMore));
      } catch {
        if (reqId !== listRequestSeqRef.current) return;
        setListError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      } finally {
        if (reqId === listRequestSeqRef.current) {
          setIsLoadingList(false);
          setIsLoadingMore(false);
        }
      }
    },
    [userId, scopeInitialized, currentClassScope, debouncedQuery, statusFilter, levelFilter, sortBy],
  );

  // Trigger list fetch when query params change
  useEffect(() => {
    if (!userId || !scopeInitialized) return;
    let isCancelled = false;
    void Promise.resolve().then(() => {
      if (!isCancelled) {
        void fetchWordsPage(0);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [userId, scopeInitialized, fetchWordsPage]);

  const handleScopeChange = (nextScope: string) => {
    setCurrentClassScope(nextScope);
    setWords([]);
    setListTotal(null);
    setHasMore(false);
    if (nextScope === '__personal__') {
      const fallback = resolvePersonalSummaryFallback(userId, personalSummaryRef.current);
      if (fallback) {
        setSummaryState({ summary: fallback, ready: true });
      } else {
        setSummaryState((prev) => ({ summary: prev.summary, ready: false }));
      }
    } else {
      setSummaryState((prev) => ({ summary: prev.summary, ready: false }));
    }
    try {
      const url = new URL(window.location.href);
      if (nextScope === '__personal__') {
        url.searchParams.delete('class');
      } else {
        url.searchParams.set('class', nextScope);
      }
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // ignore
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setStatusFilter('all');
    setLevelFilter(null);
  };

  const handleWordDeleted = (deletedId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== deletedId));
    setListTotal((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    const nextTotal = Math.max(0, summary.total - 1);
    setSummaryState((prev) => ({
      summary: {
        ...prev.summary,
        total: Math.max(0, prev.summary.total - 1),
      },
      ready: prev.ready,
    }));

    if (userId) {
      invalidateWordSummaryCache(userId);
    }
    const hasActiveCtxSession = Boolean(studentCtx?.session?.user?.id);
    if (currentClassScope === '__personal__') {
      studentCtx?.updateWordSummary({ total: nextTotal });
      if (hasActiveCtxSession) {
        void studentCtx?.refreshWordSummary();
      } else {
        void fetchSummary(currentClassScope, true);
      }
    } else {
      if (hasActiveCtxSession) {
        void studentCtx?.refreshWordSummary();
      }
      void fetchSummary(currentClassScope, true);
    }
  };

  const activeClassroom = enrolledClassrooms.find((c) => c.id === currentClassScope) ?? null;
  const levelCounts =
    Array.isArray(summary.levelCounts) && summary.levelCounts.length === 6
      ? summary.levelCounts
      : [0, 0, 0, 0, 0, 0];
  const maxLevelCount = Math.max(1, ...levelCounts);

  const hasActiveFilters = Boolean(
    debouncedQuery.trim() || statusFilter !== 'all' || levelFilter !== null,
  );
  const canLoadMore = hasMore || (listTotal !== null && words.length < listTotal);
  const remainingCount = listTotal !== null ? Math.max(0, listTotal - words.length) : null;

  return (
    <StudentShell title="Kho từ vựng">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3.5 pb-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/student"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>
            <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">
              {activeClassroom ? `Từ vựng · ${activeClassroom.name}` : 'Kho từ vựng'}
            </h1>
            <Badge variant="outline" className="h-6 shrink-0 px-2 text-xs font-bold tabular-nums">
              {countsReady ? summary.total : '…'} từ
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/import"
              className="inline-flex h-8 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nạp từ mới</span>
            </Link>
            <Link
              href="/library"
              className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3.5 text-xs font-extrabold text-white transition hover:bg-emerald-700"
            >
              <span>Thư viện</span>
            </Link>
          </div>
        </div>

        {/* Conditional Classroom Scope Switcher */}
        {enrolledClassrooms.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-500">Phạm vi kho từ</span>
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <select
                aria-label="Phạm vi kho từ"
                value={currentClassScope}
                onChange={(e) => handleScopeChange(e.target.value)}
                className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-background pl-3 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="__personal__">Tất cả kho</option>
                {enrolledClassrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Vault Summary & L1-L6 SRS Mastery Bars */}
        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-center">
              <div
                className={`text-base font-black tabular-nums text-slate-800 ${
                  !countsReady ? 'animate-pulse text-slate-400' : ''
                }`}
              >
                {countsReady ? summary.total : '…'}
              </div>
              <div className="text-[11px] font-bold text-slate-400">Tích lũy</div>
            </div>
            <div className="rounded-xl bg-indigo-50/80 px-2.5 py-2 text-center">
              <div
                className={`text-base font-black tabular-nums text-indigo-700 ${
                  !countsReady ? 'animate-pulse' : ''
                }`}
              >
                {countsReady ? Math.max(0, summary.total - summary.newCount) : '…'}
              </div>
              <div className="text-[11px] font-bold text-indigo-400">Đã học</div>
            </div>
            <div className="rounded-xl bg-amber-50/80 px-2.5 py-2 text-center">
              <div
                className={`text-base font-black tabular-nums text-amber-700 ${
                  !countsReady ? 'animate-pulse' : ''
                }`}
              >
                {countsReady ? summary.reviewDueCount : '…'}
              </div>
              <div className="text-[11px] font-bold text-amber-600/80">Cần ôn</div>
            </div>
          </div>

          {countsReady && (summary.total > 0 || levelFilter !== null) && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  Mức độ nhớ · L1–L6
                </span>
                <div className="flex items-center gap-2">
                  {levelFilter !== null && (
                    <button
                      type="button"
                      onClick={() => setLevelFilter(null)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20"
                    >
                      <span>L{levelFilter}</span>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <span className="text-[10px] font-bold tabular-nums text-slate-400">
                    {levelCounts.reduce((a, b) => a + b, 0)}/{summary.total} từ
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-1.5 sm:gap-2">
                {levelCounts.map((count, idx) => {
                  const lvl = idx + 1;
                  const barH = Math.round(4 + (count / maxLevelCount) * 40);
                  const isActive = levelFilter === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevelFilter((prev) => (prev === lvl ? null : lvl))}
                      aria-pressed={isActive}
                      title={`L${lvl}: ${SRS_LEVEL_STABILITY_HINT[idx]} · ~interval ${SRS_LEVEL_LABELS[idx]} · ${count} từ`}
                      className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center rounded-lg px-1 py-1 transition ${
                        isActive ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-white/80'
                      }`}
                    >
                      <span className="mb-0.5 text-[10px] font-black tabular-nums text-slate-600">
                        {count}
                      </span>
                      <div
                        className={`w-full max-w-[30px] rounded-t-md ${LEVEL_BAR_COLORS[idx]}`}
                        style={{ height: barH }}
                      />
                      <span className="mt-1 text-[9px] font-extrabold text-slate-500">L{lvl}</span>
                      <span className="text-[8px] font-bold uppercase text-slate-400">
                        {SRS_LEVEL_LABELS[idx]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Search + Sort + Status Filter Bar */}
        <section className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                aria-label="Tìm trong kho"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trong kho..."
                className="min-h-[40px] w-full rounded-xl border bg-background py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setSearchQuery('');
                    setDebouncedQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative shrink-0 sm:w-40">
              <select
                aria-label="Sắp xếp từ vựng"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as VaultSortBy)}
                className="min-h-[40px] w-full cursor-pointer appearance-none rounded-xl border bg-background py-2 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="az">A → Z</option>
                <option value="hardest">Khó nhất</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`min-h-[32px] shrink-0 cursor-pointer rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {opt.label}
              </button>
            ))}

            {hasActiveFilters && (
              <span className="ml-auto shrink-0 whitespace-nowrap pl-2 text-xs font-semibold tabular-nums text-muted-foreground">
                {listTotal !== null ? `${listTotal}/${summary.total}` : `${words.length}`}
              </span>
            )}
          </div>

          {/* List Content */}
          {listError ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-6 text-center"
            >
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <p className="text-sm font-semibold text-rose-800">{listError}</p>
              <button
                type="button"
                onClick={() => void fetchWordsPage(0)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : isLoadingList ? (
            <WordCardSkeleton count={6} />
          ) : words.length === 0 ? (
            hasActiveFilters ? (
              <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center text-muted-foreground">
                <Search className="h-6 w-6 opacity-30" />
                <p className="text-sm font-semibold text-slate-700">Không tìm thấy từ</p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                <Sparkles className="h-6 w-6 text-emerald-600" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">Kho từ vựng chưa có từ nào</p>
                  <p className="text-xs text-muted-foreground">
                    Nạp từ mới hoặc chọn gói từ trong thư viện để bắt đầu học.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/import"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Nạp từ mới</span>
                  </Link>
                  <Link
                    href="/library"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mở thư viện</span>
                  </Link>
                </div>
              </div>
            )
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {words.map((word) => {
                  const isTeacherImport =
                    word.source === 'teacher_import' ||
                    word.dictionary_data?.source === 'teacher_import';
                  const ipaText = word.ipa ? parseIpa(word.ipa) : '';

                  return (
                    <div
                      key={word.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedWordId(word.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedWordId(word.id);
                        }
                      }}
                      className="group relative min-w-0 cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5 transition-all hover:border-primary/40 hover:bg-white hover:shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-baseline gap-1.5">
                            <h4 className="truncate text-base font-black text-primary">
                              {word.word}
                            </h4>
                            {word.pos && (
                              <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                                {word.pos}
                              </span>
                            )}
                            {isTeacherImport && (
                              <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black text-indigo-700">
                                GV
                              </span>
                            )}
                          </div>
                          {ipaText && (
                            <div className="truncate font-mono text-[11px] font-semibold text-muted-foreground">
                              {ipaText}
                            </div>
                          )}
                        </div>
                        <Badge
                          className={`shrink-0 text-[10px] ${
                            (word.srsLevel ?? 0) >= 5
                              ? 'bg-emerald-500 text-white'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          L{word.srsLevel || 1}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-600">
                        {word.translation}
                      </p>
                    </div>
                  );
                })}
              </div>

              {canLoadMore && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => void fetchWordsPage(words.length)}
                    disabled={isLoadingMore}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang tải…</span>
                      </>
                    ) : (
                      <span>
                        {remainingCount !== null ? `Tải thêm (${remainingCount})` : 'Tải thêm'}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <WordDetailModal
        wordId={selectedWordId}
        onClose={() => setSelectedWordId(null)}
        onDeleted={handleWordDeleted}
      />
    </StudentShell>
  );
}
