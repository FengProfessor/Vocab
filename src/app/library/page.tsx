'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BookOpen, ChevronLeft, Clock3, Layers3, Library, Loader2, Search, Sparkles, Upload, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { supabase } from '@/lib/supabase';

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
interface Route { id: string; title: string; icon: string; coverImage: string; description: string; featured: boolean; subtopicCount: number; topics: Topic[] }
interface CatalogResponse { success: boolean; routes?: Route[]; microPackSize?: number; catalogVersion?: string; error?: string }
interface ImportResponse { success: boolean; imported?: number; classroomId?: string; packId?: string; wordIds?: string[]; message?: string; error?: string }

const CONTENT_LABEL: Record<ContentType, string> = { word: 'Từ', phrase: 'Cụm từ', idiom: 'Thành ngữ', phrasal_verb: 'Phrasal verb' };
const ALL = 'all';

function subtopicStatus(sub: Subtopic): 'new' | 'in_progress' | 'completed' {
  const withProgress = sub.packs.filter((p) => p.progress);
  if (withProgress.length === 0) return 'new';
  if (withProgress.every((p) => p.progress?.status === 'completed') && withProgress.length === sub.packs.length) return 'completed';
  return 'in_progress';
}

export default function LibraryPage() {
  const router = useRouter();
  const panelRef = useRef<HTMLElement>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [microPackSize, setMicroPackSize] = useState(15);
  const [catalogVersion, setCatalogVersion] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!previewPack) return;
    const onEsc = (e: KeyboardEvent): void => { if (e.key === 'Escape' && !importingPack) setPreviewPack(null); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [importingPack, previewPack]);

  const featured = useMemo(() => routes.filter((r) => r.featured), [routes]);
  const extended = useMemo(() => routes.find((r) => !r.featured) ?? null, [routes]);
  const activeRoute = useMemo(() => routes.find((r) => r.id === activeRouteId) ?? null, [routes, activeRouteId]);
  const totals = useMemo(() => routes.reduce((acc, r) => {
    for (const t of r.topics) for (const s of t.subtopics) { acc.subs++; acc.packs += s.packCount; acc.words += s.wordCount; }
    return acc;
  }, { subs: 0, packs: 0, words: 0 }), [routes]);

  // Subtopic hiển thị trong route đang chọn (áp filter)
  const visibleSubtopics = useMemo(() => {
    if (!activeRoute) return [] as { topicTitle: string; sub: Subtopic }[];
    const q = query.trim().toLocaleLowerCase('vi');
    const out: { topicTitle: string; sub: Subtopic }[] = [];
    for (const t of activeRoute.topics) for (const sub of t.subtopics) {
      if (contentFilter !== ALL && sub.contentType !== contentFilter) continue;
      if (statusFilter !== ALL && subtopicStatus(sub) !== statusFilter) continue;
      if (q) {
        const hay = [sub.title, ...sub.previewWords].join(' ').toLocaleLowerCase('vi');
        if (!hay.includes(q)) continue;
      }
      out.push({ topicTitle: t.title, sub });
    }
    return out;
  }, [activeRoute, query, contentFilter, statusFilter]);

  const openRoute = (id: string): void => {
    setActiveRouteId(id);
    setSelectedSubtopic(null);
    setContentFilter(ALL); setStatusFilter(ALL); setQuery('');
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const openSubtopic = (sub: Subtopic): void => {
    setSelectedSubtopic(sub);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleImportPack = async (): Promise<void> => {
    if (!previewPack || importingPack || previewPack.progress?.status === 'completed') return;
    setImportingPack(previewPack.id);
    toast.loading(`Đang thêm ${previewPack.wordCount} từ...`, { id: 'catalog-import' });
    try {
      const res = await authFetch('/api/import/packages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: previewPack.id, catalogVersion }),
      });
      const data = await res.json() as ImportResponse;
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể thêm gói từ');
      if (!data.classroomId || !data.wordIds?.length) throw new Error('Gói từ đã thêm nhưng chưa thể mở phiên học');

      const refreshRes = await authFetch('/api/words/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const RouteCard = ({ r, big }: { r: Route; big?: boolean }): React.ReactElement => (
    <button
      type="button"
      onClick={() => openRoute(r.id)}
      className="group overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      aria-label={`Mở lộ trình ${r.title}, ${r.subtopicCount} chủ đề`}
    >
      <div className={`relative ${big ? 'h-36' : 'h-28'} overflow-hidden bg-slate-200`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/image-proxy?url=${encodeURIComponent(r.coverImage)}`} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <span className="absolute left-3 top-3 text-2xl" aria-hidden="true">{r.icon}</span>
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-lg font-black leading-tight text-white drop-shadow">{r.title}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{r.description}</p>
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-black text-indigo-700">
          <span className="flex items-center gap-1 text-xs font-bold text-slate-500"><Layers3 className="h-3.5 w-3.5" aria-hidden="true" />{r.subtopicCount} chủ đề</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur sm:px-6">
        <Link href="/student" className="flex items-center gap-1 text-sm font-bold text-slate-500 transition-colors hover:text-indigo-700">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" /><span className="hidden sm:inline">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 font-black"><Library className="h-5 w-5 text-indigo-600" aria-hidden="true" /><span>Thư viện từ vựng</span></div>
        <Link href="/import" className="ml-auto flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-indigo-700">
          <Upload className="h-4 w-4" aria-hidden="true" />Nhập thủ công
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-200/50 sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <Sparkles className="h-4 w-4" aria-hidden="true" />Học ít, nhớ lâu
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">5–8 phút cho <span className="text-amber-300">{microPackSize} từ</span></h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-indigo-100 sm:text-base">Chọn lộ trình phù hợp mục tiêu, vào chủ đề rồi học từng chặng nhỏ.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold sm:text-sm">
              <span className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">{totals.subs} chủ đề</span>
              <span className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">{totals.packs} chặng học</span>
              <span className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">{totals.words.toLocaleString('vi-VN')} từ</span>
            </div>
          </div>
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
            <p className="text-sm font-medium">Đang tải danh mục...</p>
          </div>
        ) : (
          <>
            {/* ── Lộ trình nổi bật ── */}
            <section aria-labelledby="featured-title">
              <div className="mb-4 flex items-end justify-between gap-4 px-1">
                <div>
                  <h2 id="featured-title" className="text-xl font-black">Lộ trình nổi bật</h2>
                  <p className="text-sm text-slate-500">7 lộ trình theo mục tiêu giao tiếp & học tập.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((r) => <RouteCard key={r.id} r={r} big />)}
              </div>
            </section>

            {/* ── Route đang chọn → subtopics ── */}
            {activeRoute && (
              <section ref={panelRef} className="scroll-mt-20 rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60 sm:p-7" aria-labelledby="route-panel-title">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wide text-indigo-600">{activeRoute.icon} Lộ trình</span>
                    <h2 id="route-panel-title" className="mt-1 text-2xl font-black">{activeRoute.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{activeRoute.description}</p>
                  </div>
                  <button type="button" onClick={() => { setActiveRouteId(null); setSelectedSubtopic(null); }} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng lộ trình">
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Filters */}
                <div className="mt-5 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm chủ đề hoặc từ mẫu..."
                      className="w-full rounded-2xl border bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([[ALL, 'Tất cả loại'], ['word', 'Từ'], ['phrase', 'Cụm từ'], ['idiom', 'Thành ngữ'], ['phrasal_verb', 'Phrasal verb']] as const).map(([v, label]) => (
                      <button key={v} type="button" onClick={() => setContentFilter(v)} aria-pressed={contentFilter === v}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${contentFilter === v ? 'bg-indigo-600 text-white' : 'border bg-white text-slate-600 hover:border-indigo-200'}`}>{label}</button>
                    ))}
                    <span className="mx-1 w-px self-stretch bg-slate-200" aria-hidden="true" />
                    {([[ALL, 'Mọi trạng thái'], ['new', 'Chưa học'], ['in_progress', 'Đang học'], ['completed', 'Hoàn thành']] as const).map(([v, label]) => (
                      <button key={v} type="button" onClick={() => setStatusFilter(v)} aria-pressed={statusFilter === v}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${statusFilter === v ? 'bg-indigo-600 text-white' : 'border bg-white text-slate-600 hover:border-indigo-200'}`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Subtopic grid */}
                {visibleSubtopics.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-dashed bg-slate-50 py-10 text-center text-sm text-slate-500">Không có chủ đề khớp bộ lọc.</p>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleSubtopics.map(({ topicTitle, sub }) => {
                      const st = subtopicStatus(sub);
                      return (
                        <button key={sub.id} type="button" onClick={() => openSubtopic(sub)}
                          className={`group overflow-hidden rounded-2xl border bg-white text-left transition hover:border-indigo-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selectedSubtopic?.id === sub.id ? 'ring-2 ring-indigo-400' : ''}`}>
                          <div className="relative h-24 overflow-hidden bg-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sub.coverImage ? `/api/image-proxy?url=${encodeURIComponent(sub.coverImage)}` : `/api/image-proxy?url=${encodeURIComponent(activeRoute.coverImage)}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                            <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-black text-indigo-700">{CONTENT_LABEL[sub.contentType]}</span>
                            {st !== 'new' && (
                              <span className={`absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-black ${st === 'completed' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>{st === 'completed' ? 'Xong' : 'Đang học'}</span>
                            )}
                          </div>
                          <div className="p-3.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{topicTitle}</p>
                            <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">{sub.title}</h4>
                            <div className="mt-2 flex items-center gap-3 text-[11px] font-bold text-slate-500">
                              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" aria-hidden="true" />{sub.wordCount} từ</span>
                              <span className="flex items-center gap-1"><Layers3 className="h-3 w-3" aria-hidden="true" />{sub.packCount} chặng</span>
                              {sub.cefrRange && <span className="rounded bg-slate-100 px-1.5 py-0.5">{sub.cefrRange.min}{sub.cefrRange.max !== sub.cefrRange.min ? `–${sub.cefrRange.max}` : ''}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Packs của subtopic đang chọn */}
                {selectedSubtopic && (
                  <div className="mt-6 rounded-2xl border bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-black text-slate-800">Chặng học · {selectedSubtopic.title}</h3>
                      <span className="text-xs font-bold text-slate-400">{selectedSubtopic.packCount} chặng</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedSubtopic.packs.map((pack) => (
                        <button key={pack.id} type="button" onClick={() => setPreviewPack(pack)}
                          className="group rounded-2xl border bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-black text-slate-800">{pack.title}</span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black ${pack.progress?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : pack.progress ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                              {pack.progress?.status === 'completed' ? 'Hoàn thành' : pack.progress ? `${pack.progress.reviewedCount}/${pack.wordCount}` : 'Chưa học'}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />{pack.wordCount} từ</span>
                            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />5–8 phút</span>
                          </div>
                          <p className="mt-3 line-clamp-1 text-xs text-slate-400">{pack.words.slice(0, 4).join(' · ')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Thư viện mở rộng ── */}
            {extended && (
              <section aria-labelledby="extended-title" className="pt-2">
                <div className="mb-4 px-1">
                  <h2 id="extended-title" className="text-xl font-black">{extended.icon} {extended.title}</h2>
                  <p className="text-sm text-slate-500">{extended.description}</p>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <RouteCard r={extended} />
                </div>
              </section>
            )}
          </>
        )}

        <div className="py-4 text-center text-xs text-slate-500">
          Có danh sách riêng?{' '}
          <Link href="/import" className="font-bold text-indigo-700 underline-offset-4 hover:underline">Nhập từ thủ công</Link>
        </div>
      </main>

      {/* Preview modal */}
      {previewPack && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => { if (!importingPack) setPreviewPack(null); }} role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="pack-preview-title" className="max-h-[90dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <span className="text-xs font-black uppercase tracking-wide text-indigo-600">{selectedSubtopic?.title}</span>
                <h2 id="pack-preview-title" className="mt-1 text-xl font-black">{previewPack.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{previewPack.wordCount} từ · khoảng 5–8 phút</p>
              </div>
              <button type="button" onClick={() => setPreviewPack(null)} disabled={Boolean(importingPack)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40" aria-label="Đóng xem trước" autoFocus>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[55dvh] overflow-y-auto p-5">
              <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {previewPack.words.map((word, index) => (
                  <li key={`${word}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-black text-indigo-700">{index + 1}</span>{word}
                  </li>
                ))}
              </ol>
            </div>
            <div className="border-t bg-white p-5">
              <button type="button" onClick={() => void handleImportPack()} disabled={Boolean(importingPack) || previewPack.progress?.status === 'completed'}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
                {importingPack ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                {importingPack ? 'Đang chuẩn bị phiên học...' : previewPack.progress?.status === 'completed' ? 'Đã hoàn thành chặng này' : previewPack.progress ? 'Tiếp tục chặng này' : `Thêm ${previewPack.wordCount} từ & học ngay`}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">Từ đã có sẽ được giữ nguyên, không tạo bản sao.</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
