'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, ChevronLeft, Clock3, Download, Loader2, Search, Sparkles, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';
import { StudentShell } from '@/components/student/StudentShell';
import {
  applyGlossesToPacks,
  downloadTopicPdfHtml,
  openBlankPdfWindow,
  suggestPdfFileName,
  writePdfError,
  writePdfLoading,
  writeTopicPdfToWindow,
  type WordGloss,
} from '@/lib/library-topic-pdf';

type ContentType = 'word' | 'phrase' | 'idiom' | 'phrasal_verb';

interface Pack {
  id: string; index: number; title: string; wordCount: number; words: string[];
  progress?: { status: 'in_progress' | 'completed'; reviewedCount: number; wordCount: number; startedAt: string; lastStudiedAt: string; completedAt: string | null };
}
interface Subtopic {
  id: string; title: string; contentType: ContentType; wordCount: number; packCount: number;
  cefrRange: { min: string; max: string } | null; coverImage: string | null; qualityScore: number; previewWords: string[]; packs: Pack[];
}
interface Topic { id: string; title: string; subtopics: Subtopic[] }
type RouteGroup = 'curriculum' | 'exam' | 'communication' | 'extended';
interface Route {
  id: string; title: string; icon: string; coverImage: string; description: string;
  group: RouteGroup; featured: boolean; subtopicCount: number; topics: Topic[];
}
interface CatalogResponse { success: boolean; routes?: Route[]; microPackSize?: number; catalogVersion?: string; error?: string }
interface ImportResponse { success: boolean; imported?: number; classroomId?: string; packId?: string; wordIds?: string[]; message?: string; error?: string }

const ALL = 'all';

function subtopicStatus(sub: Subtopic): 'new' | 'in_progress' | 'completed' {
  const withProgress = sub.packs.filter((p) => p.progress);
  if (withProgress.length === 0) return 'new';
  if (withProgress.every((p) => p.progress?.status === 'completed') && withProgress.length === sub.packs.length) {
    return 'completed';
  }
  return 'in_progress';
}

export default function LibraryPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [microPackSize, setMicroPackSize] = useState(15);
  const [catalogVersion, setCatalogVersion] = useState('');
  const [loading, setLoading] = useState(true);

  /** Modal cấp 1: chọn bộ (Lớp 10, TOEIC…) → list unit */
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  /** Trong modal: unit đang xem packs */
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [previewPack, setPreviewPack] = useState<Pack | null>(null);
  const [importingPack, setImportingPack] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [contentFilter, setContentFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      try {
        const res = await authFetch('/api/import/packages');
        const data = await res.json() as CatalogResponse;
        if (!res.ok || !data.success || !data.routes) throw new Error(data.error || 'Không thể tải danh mục');
        if (active) {
          setRoutes(data.routes);
          setMicroPackSize(data.microPackSize ?? 15);
          setCatalogVersion(data.catalogVersion ?? '');
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Không thể tải thư viện');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [router]);

  // ESC đóng modal (pack → unit → route)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || importingPack) return;
      if (previewPack) { setPreviewPack(null); return; }
      if (selectedSubtopic) { setSelectedSubtopic(null); return; }
      if (activeRouteId) { setActiveRouteId(null); setQuery(''); setContentFilter(ALL); setStatusFilter(ALL); }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [importingPack, previewPack, selectedSubtopic, activeRouteId]);

  // Khoá scroll body khi modal mở
  useEffect(() => {
    const open = Boolean(activeRouteId || previewPack);
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [activeRouteId, previewPack]);

  const curriculum = useMemo(() => routes.filter((r) => r.group === 'curriculum'), [routes]);
  const exams = useMemo(() => routes.filter((r) => r.group === 'exam'), [routes]);
  const communication = useMemo(() => routes.filter((r) => r.group === 'communication'), [routes]);
  const extended = useMemo(() => routes.find((r) => r.group === 'extended') ?? null, [routes]);
  const activeRoute = useMemo(() => routes.find((r) => r.id === activeRouteId) ?? null, [routes, activeRouteId]);
  const totals = useMemo(() => routes.reduce((acc, r) => {
    for (const t of r.topics) for (const s of t.subtopics) {
      acc.subs++; acc.packs += s.packCount; acc.words += s.wordCount;
    }
    return acc;
  }, { subs: 0, packs: 0, words: 0 }), [routes]);

  const visibleSubtopics = useMemo(() => {
    if (!activeRoute) return [] as { topicTitle: string; sub: Subtopic }[];
    const q = query.trim().toLocaleLowerCase('vi');
    const out: { topicTitle: string; sub: Subtopic }[] = [];
    for (const t of activeRoute.topics) {
      for (const sub of t.subtopics) {
        if (contentFilter !== ALL && sub.contentType !== contentFilter) continue;
        if (statusFilter !== ALL && subtopicStatus(sub) !== statusFilter) continue;
        if (q) {
          const hay = [sub.title, t.title, ...sub.previewWords].join(' ').toLocaleLowerCase('vi');
          if (!hay.includes(q)) continue;
        }
        out.push({ topicTitle: t.title, sub });
      }
    }
    return out;
  }, [activeRoute, query, contentFilter, statusFilter]);

  /** Group unit theo chủ đề — nút tải PDF cả topic. */
  const unitsByTopic = useMemo(() => {
    const map = new Map<string, Subtopic[]>();
    for (const { topicTitle, sub } of visibleSubtopics) {
      const list = map.get(topicTitle) ?? [];
      list.push(sub);
      map.set(topicTitle, list);
    }
    return [...map.entries()];
  }, [visibleSubtopics]);

  const openRoute = (id: string): void => {
    setActiveRouteId(id);
    setSelectedSubtopic(null);
    setPreviewPack(null);
    setContentFilter(ALL);
    setStatusFilter(ALL);
    setQuery('');
  };

  const closeRouteModal = (): void => {
    setActiveRouteId(null);
    setSelectedSubtopic(null);
    setPreviewPack(null);
    setQuery('');
    setContentFilter(ALL);
    setStatusFilter(ALL);
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  /** Lấy dạng từ + nghĩa + ví dụ từ GD rồi mở PDF. */
  const fetchGlosses = async (words: string[]): Promise<Record<string, WordGloss>> => {
    const unique = [...new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))];
    if (unique.length === 0) return {};
    const res = await authFetch('/api/library/gloss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: unique }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      glosses?: Record<string, WordGloss>;
      stats?: { withDefinition?: number; requested?: number };
      error?: string;
    };
    if (!res.ok || !data.success || !data.glosses) {
      throw new Error(data.error || 'Không tải được nghĩa từ từ điển');
    }
    return data.glosses;
  };

  const openPdfWithGloss = async (
    packs: { title: string; words: string[] }[],
    opts: {
      topicTitle: string;
      unitTitle: string;
      cefrLabel?: string | null;
      successMsg: string;
    },
  ): Promise<void> => {
    if (!activeRoute) return;
    if (pdfLoading) return;
    const flat = packs.flatMap((p) => p.words);
    if (!flat.length) {
      toast.error('Chưa có từ để xuất');
      return;
    }
    if (flat.length > 800) {
      toast.error('Chủ đề quá dài (>800 từ). Hãy tải từng unit.');
      return;
    }

    // QUAN TRỌNG: mở tab NGAY trong click handler (trước await) — mobile chặn popup sau async
    const previewWin = openBlankPdfWindow();
    if (previewWin) {
      writePdfLoading(previewWin, `Đang lấy nghĩa & IPA (${flat.length} từ)…`);
    }

    setPdfLoading(true);
    toast.loading(`Đang lấy nghĩa ${flat.length} từ…`, { id: 'pdf-gloss' });
    try {
      const glosses = await fetchGlosses(flat);
      const enriched = applyGlossesToPacks(packs, glosses);
      const rows = enriched.flatMap((p) => p.words).filter((w) => typeof w !== 'string');
      const withDef = rows.filter((w) => w.definition).length;
      const withIpa = rows.filter((w) => w.ipa).length;
      const pdfInput = {
        routeTitle: activeRoute.title,
        routeIcon: activeRoute.icon,
        topicTitle: opts.topicTitle,
        unitTitle: opts.unitTitle,
        packs: enriched,
        cefrLabel: opts.cefrLabel ?? null,
        siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://lingopro.online',
      };

      let opened = false;
      if (previewWin && !previewWin.closed) {
        opened = writeTopicPdfToWindow(previewWin, pdfInput);
      }

      if (!opened) {
        // Fallback mobile: tải HTML — mở file → Share/In → Lưu PDF
        downloadTopicPdfHtml(
          pdfInput,
          suggestPdfFileName(opts.unitTitle, activeRoute.title),
        );
        toast.success(opts.successMsg, {
          id: 'pdf-gloss',
          description: `${withDef} nghĩa · ${withIpa} IPA · Đã tải file HTML (mở file → In → Lưu PDF)`,
          duration: 7000,
        });
        return;
      }

      toast.success(opts.successMsg, {
        id: 'pdf-gloss',
        description: `${withDef} nghĩa · ${withIpa} IPA / ${flat.length} từ · Bấm «Lưu / In PDF»`,
        duration: 5000,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi xuất PDF';
      if (previewWin && !previewWin.closed) writePdfError(previewWin, msg);
      toast.error(msg, { id: 'pdf-gloss' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadUnitPdf = (sub: Subtopic, topicTitle: string): void => {
    if (!activeRoute) return;
    if (!sub.packs.length) {
      toast.error('Unit chưa có chặng từ');
      return;
    }
    void openPdfWithGloss(
      sub.packs.map((p) => ({ title: p.title, words: p.words })),
      {
        topicTitle,
        unitTitle: sub.title,
        cefrLabel: sub.cefrRange
          ? `${sub.cefrRange.min}${sub.cefrRange.max && sub.cefrRange.max !== sub.cefrRange.min ? `–${sub.cefrRange.max}` : ''}`
          : null,
        successMsg: `PDF · ${suggestPdfFileName(sub.title, activeRoute.title)}`,
      },
    );
  };

  /** PDF cả chủ đề (gom mọi unit cùng topic). */
  const handleDownloadTopicPdf = (topicTitle: string, units: Subtopic[]): void => {
    if (!activeRoute || units.length === 0) return;
    const packs = units.flatMap((u) =>
      u.packs.map((p) => ({
        title: `${u.title} · ${p.title}`,
        words: p.words,
      })),
    );
    if (!packs.length) {
      toast.error('Chủ đề chưa có từ');
      return;
    }
    void openPdfWithGloss(packs, {
      topicTitle,
      unitTitle: topicTitle,
      successMsg: `PDF chủ đề «${topicTitle}»`,
    });
  };

  const handleImportPack = async (): Promise<void> => {
    if (!previewPack || importingPack || previewPack.progress?.status === 'completed') return;
    setImportingPack(previewPack.id);
    toast.loading(`Đang thêm ${previewPack.wordCount} từ...`, { id: 'catalog-import' });
    try {
      const res = await authFetch('/api/import/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: previewPack.id, catalogVersion }),
      });
      const data = await res.json() as ImportResponse;
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể thêm gói từ');
      if (!data.classroomId || !data.wordIds?.length) throw new Error('Gói từ đã thêm nhưng chưa thể mở phiên học');

      const refreshRes = await authFetch('/api/words/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: data.classroomId, wordIds: data.wordIds }),
      });
      const refreshData = await refreshRes.json() as { success?: boolean; error?: string };
      if (!refreshRes.ok || !refreshData.success) {
        toast.warning('Một số từ chưa sẵn sàng. Hệ thống sẽ chỉ mở các từ đã phân tích xong.', { id: 'catalog-import' });
      } else {
        toast.success(data.message || `Đã thêm ${data.imported ?? previewPack.wordCount} từ`, { id: 'catalog-import' });
      }
      const ids = data.wordIds.map((id) => encodeURIComponent(id)).join(',');
      router.push(`/flashcard?class=${encodeURIComponent(data.classroomId)}&mode=learn&ids=${ids}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi kết nối', { id: 'catalog-import' });
    } finally {
      setImportingPack(null);
    }
  };

  /** Card bộ — gọn, không cover to */
  const RouteChip = ({ r }: { r: Route }): React.ReactElement => (
    <button
      type="button"
      onClick={() => openRoute(r.id)}
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition active:scale-[0.99] hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`Mở ${r.title}, ${r.subtopicCount} unit`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
        {r.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-slate-900">{r.title}</h3>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
          {r.subtopicCount} unit · {r.topics.reduce((n, t) => n + t.subtopics.reduce((m, s) => m + s.wordCount, 0), 0).toLocaleString('vi-VN')} từ
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
    </button>
  );

  const Section = ({ title, desc, list }: { title: string; desc: string; list: Route[] }) => {
    if (list.length === 0) return null;
    return (
      <section>
        <div className="mb-2 px-0.5">
          <h2 className="text-base font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {list.map((r) => <RouteChip key={r.id} r={r} />)}
        </div>
      </section>
    );
  };

  return (
    <StudentShell title="Thư viện từ vựng" contentClassName="p-0">
      <div className="min-h-[calc(100dvh-var(--header-h)-var(--safe-top))] bg-slate-50 font-sans text-slate-900">
        <header className="sticky top-0 z-30 flex h-header-safe items-center gap-2 border-b bg-white/90 px-3 backdrop-blur sm:px-6">
          <Link href="/student" className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-indigo-700">
            <ChevronLeft className="h-5 w-5" aria-hidden /><span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-black">
            <span className="text-base">📦</span>
            <span>Thư viện</span>
          </div>
          <Link href="/import" className="ml-auto flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-700">
            <Upload className="h-3.5 w-3.5" aria-hidden />Nhập tay
          </Link>
        </header>

        <main className="mx-auto max-w-2xl space-y-5 p-3 pb-mobile-nav sm:p-6">
          {/* Hero gọn */}
          <section className="rounded-2xl bg-gradient-to-br from-indigo-700 to-violet-600 px-4 py-4 text-white shadow-lg shadow-indigo-200/40">
            <p className="text-[11px] font-bold text-indigo-100">Học ít, nhớ lâu · ~{microPackSize} từ / chặng</p>
            <h1 className="mt-1 text-xl font-black leading-tight sm:text-2xl">
              Chọn bộ → unit → chặng
            </h1>
            <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded-lg bg-white/15 px-2 py-1">{totals.subs} unit</span>
              <span className="rounded-lg bg-white/15 px-2 py-1">{totals.packs} chặng</span>
              <span className="rounded-lg bg-white/15 px-2 py-1">{totals.words.toLocaleString('vi-VN')} từ</span>
            </div>
          </section>

          {loading ? (
            <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-hidden />
              <p className="text-sm font-medium">Đang tải danh mục...</p>
            </div>
          ) : (
            <div className="space-y-5">
              <Section
                title="🎒 Chương trình THPT"
                desc="Bám sách Global Success — Lớp 10 / 11 / 12"
                list={curriculum}
              />
              <Section
                title="🎯 Luyện thi"
                desc="TOEIC · IELTS theo chặng nhỏ"
                list={exams}
              />
              <Section
                title="💬 Giao tiếp"
                desc="Theo mục tiêu đời sống"
                list={communication}
              />
              {extended && (
                <Section
                  title={`${extended.icon} ${extended.title}`}
                  desc={extended.description}
                  list={[extended]}
                />
              )}
            </div>
          )}

          <p className="pb-2 text-center text-xs text-slate-500">
            Có list riêng?{' '}
            <Link href="/import" className="font-bold text-indigo-700 underline-offset-2 hover:underline">
              Nhập thủ công
            </Link>
          </p>
        </main>

        {/* ═══ POPUP: Units của bộ (vd Lớp 10) ═══ */}
        {activeRoute && (
          <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={closeRouteModal}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="route-modal-title"
              className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header + X */}
              <div className="flex shrink-0 items-start gap-3 border-b px-4 py-3.5">
                <span className="text-2xl leading-none">{activeRoute.icon}</span>
                <div className="min-w-0 flex-1">
                  <h2 id="route-modal-title" className="text-lg font-black text-slate-900">
                    {activeRoute.title}
                  </h2>
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">
                    {selectedSubtopic
                      ? `Unit · ${selectedSubtopic.title}`
                      : `${visibleSubtopics.length} unit · chọn để xem chặng ~${microPackSize} từ`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRouteModal}
                  className="touch-target flex shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Đóng"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Body: unit list HOẶC packs của unit */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                {!selectedSubtopic ? (
                  <>
                    {/* Filter gọn */}
                    <div className="mb-3 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Tìm unit..."
                          className="w-full rounded-xl border bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {([[ALL, 'Tất cả'], ['new', 'Chưa học'], ['in_progress', 'Đang học'], ['completed', 'Xong']] as const).map(([v, label]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setStatusFilter(v)}
                            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${
                              statusFilter === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {visibleSubtopics.length === 0 ? (
                      <p className="py-10 text-center text-sm text-slate-500">Không có unit khớp.</p>
                    ) : (
                      <div className="space-y-4">
                        {unitsByTopic.map(([topicTitle, units]) => {
                          const topicWords = units.reduce((n, u) => n + u.wordCount, 0);
                          return (
                            <div key={topicTitle}>
                              <div className="mb-1.5 flex items-center gap-2 px-0.5">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black text-slate-800">{topicTitle}</p>
                                  <p className="text-[10px] font-semibold text-slate-400">
                                    {units.length} unit · {topicWords} từ
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={pdfLoading}
                                  onClick={() => handleDownloadTopicPdf(topicTitle, units)}
                                  className="flex shrink-0 items-center gap-1 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-black text-indigo-700 transition active:scale-[0.98] hover:bg-indigo-100 disabled:opacity-50"
                                  aria-label={`Tải PDF chủ đề ${topicTitle}`}
                                >
                                  {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
                                  PDF chủ đề
                                </button>
                              </div>
                              <ul className="space-y-1.5">
                                {units.map((sub, index) => {
                                  const st = subtopicStatus(sub);
                                  return (
                                    <li key={sub.id} className="flex items-stretch gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubtopic(sub)}
                                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40 active:bg-indigo-50"
                                      >
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                                          {index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-black text-slate-900">{sub.title}</p>
                                          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                            {sub.wordCount} từ · {sub.packCount} chặng
                                            {sub.cefrRange ? ` · ${sub.cefrRange.min}` : ''}
                                          </p>
                                        </div>
                                        {st !== 'new' && (
                                          <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                                              st === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-800'
                                            }`}
                                          >
                                            {st === 'completed' ? 'Xong' : 'Dở'}
                                          </span>
                                        )}
                                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={pdfLoading}
                                        onClick={() => handleDownloadUnitPdf(sub, topicTitle)}
                                        className="flex w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                                        aria-label={`Tải PDF unit ${sub.title}`}
                                        title="Tải PDF unit"
                                      >
                                        {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Back to units */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubtopic(null)}
                      className="mb-3 flex items-center gap-1 text-xs font-bold text-indigo-600"
                    >
                      <ChevronLeft className="h-4 w-4" /> Tất cả unit
                    </button>
                    <div className="mb-3 flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-slate-900">{selectedSubtopic.title}</h3>
                        <p className="text-xs font-semibold text-slate-500">
                          {selectedSubtopic.packCount} chặng · ~{microPackSize} từ / chặng · bấm để xem & học
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={pdfLoading}
                        onClick={() => {
                          const topicTitle =
                            activeRoute?.topics.find((t) => t.subtopics.some((s) => s.id === selectedSubtopic.id))?.title
                            ?? selectedSubtopic.title;
                          handleDownloadUnitPdf(selectedSubtopic, topicTitle);
                        }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-indigo-200 transition active:scale-[0.98] hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
                        {pdfLoading ? 'Đang lấy nghĩa…' : 'Tải PDF'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedSubtopic.packs.map((pack) => (
                        <button
                          key={pack.id}
                          type="button"
                          onClick={() => setPreviewPack(pack)}
                          className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700">
                            {pack.index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900">{pack.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-slate-500">
                              <span className="inline-flex items-center gap-0.5">
                                <BookOpen className="h-3 w-3" aria-hidden />{pack.wordCount} từ
                              </span>
                              <span className="inline-flex items-center gap-0.5">
                                <Clock3 className="h-3 w-3" aria-hidden />5–8p
                              </span>
                            </p>
                            <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">
                              {pack.words.slice(0, 5).join(' · ')}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                              pack.progress?.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : pack.progress
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {pack.progress?.status === 'completed'
                              ? 'Xong'
                              : pack.progress
                                ? `${pack.progress.reviewedCount}/${pack.wordCount}`
                                : 'Mới'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ═══ POPUP: Preview pack + import ═══ */}
        {previewPack && (
          <div
            className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => { if (!importingPack) setPreviewPack(null); }}
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="pack-preview-title"
              className="max-h-[90dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-indigo-600">
                    {selectedSubtopic?.title}
                  </span>
                  <h2 id="pack-preview-title" className="mt-1 text-lg font-black sm:text-xl">
                    {previewPack.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {previewPack.wordCount} từ · khoảng 5–8 phút
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPack(null)}
                  disabled={Boolean(importingPack)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[50dvh] overflow-y-auto p-4 sm:p-5">
                <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {previewPack.words.map((word, index) => (
                    <li
                      key={`${word}-${index}`}
                      className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">
                        {index + 1}
                      </span>
                      {word}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="border-t bg-white p-4 sm:p-5">
                <button
                  type="button"
                  onClick={() => void handleImportPack()}
                  disabled={Boolean(importingPack) || previewPack.progress?.status === 'completed'}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {importingPack ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                  {importingPack
                    ? 'Đang chuẩn bị phiên học...'
                    : previewPack.progress?.status === 'completed'
                      ? 'Đã hoàn thành chặng này'
                      : previewPack.progress
                        ? 'Tiếp tục chặng này'
                        : `Thêm ${previewPack.wordCount} từ & học ngay`}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
