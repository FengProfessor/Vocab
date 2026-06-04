'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Library, ChevronLeft, Loader2, Plus, CheckCircle2, Search, Sparkles, X, Upload,
} from 'lucide-react';

interface LessonItem {
  package: string;
  name: string;
  cell: string;
  youtubeUrl: string;
  wordCount: number;
}
type Categories = { [cat: string]: LessonItem[] };

// Màu accent theo nhóm chuyên đề — class TĨNH để Tailwind JIT nhận diện (NEVER nội suy class động)
const CAT_STYLE: Record<string, { chip: string; bar: string }> = {
  'Cụm từ & Thành ngữ': { chip: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-400' },
  'Cụm động từ': { chip: 'bg-violet-50 text-violet-600', bar: 'bg-violet-400' },
  'Từ vựng SGK (10 - 11 - 12)': { chip: 'bg-blue-50 text-blue-600', bar: 'bg-blue-400' },
  'Từ vựng theo chủ điểm': { chip: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-400' },
  'Từ vựng A - Z': { chip: 'bg-amber-50 text-amber-600', bar: 'bg-amber-400' },
  'Từ vựng nhóm nghĩa': { chip: 'bg-rose-50 text-rose-600', bar: 'bg-rose-400' },
  'Ngữ pháp & Khác': { chip: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' },
};
const catStyle = (c: string) => CAT_STYLE[c] ?? { chip: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' };

export default function LibraryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Categories | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [importingLesson, setImportingLesson] = useState<string | null>(null);
  const [importedLessons, setImportedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push('/auth'); return; }
      try {
        const res = await authFetch('/api/import/packages');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
          setSelectedCategory(Object.keys(data.categories)[0] || '');
        } else {
          toast.error('Không thể tải thư viện: ' + data.error);
        }
      } catch {
        toast.error('Không thể tải thư viện chuyên đề');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleImportLesson = async (lesson: LessonItem) => {
    if (importingLesson) return;
    const key = `${lesson.package}-${lesson.name}`;
    setImportingLesson(lesson.name);
    toast.loading(`Đang nhập "${lesson.name}"...`, { id: 'lib-import' });
    try {
      const res = await authFetch('/api/import/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: lesson.package, lessonName: lesson.name }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Đã nhập thành công!', { id: 'lib-import' });
        setImportedLessons(prev => new Set(prev).add(key));
        // Kích hoạt AI enrich nền cho các từ chưa có nghĩa (giống luồng CSV ở /import)
        if (data.classroomId) {
          authFetch('/api/words/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classroomId: data.classroomId }),
          }).catch(() => {});
        }
      } else {
        toast.error(data.error || 'Có lỗi khi nhập bài học', { id: 'lib-import' });
      }
    } catch {
      toast.error('Có lỗi kết nối', { id: 'lib-import' });
    } finally {
      setImportingLesson(null);
    }
  };

  const totals = useMemo(() => {
    if (!categories) return { lessons: 0, words: 0 };
    let lessons = 0, words = 0;
    for (const list of Object.values(categories)) {
      lessons += list.length;
      for (const l of list) words += l.wordCount;
    }
    return { lessons, words };
  }, [categories]);

  // Khi gõ tìm kiếm → gộp toàn bộ bài học, lọc theo tên (bỏ qua category đang chọn)
  const visibleLessons = useMemo<Array<LessonItem & { cat: string }>>(() => {
    if (!categories) return [];
    const q = query.trim().toLowerCase();
    if (q) {
      return Object.entries(categories).flatMap(([cat, list]) =>
        list.filter(l => l.name.toLowerCase().includes(q)).map(l => ({ ...l, cat }))
      );
    }
    return (categories[selectedCategory] || []).map(l => ({ ...l, cat: selectedCategory }));
  }, [categories, selectedCategory, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link href="/student">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 font-bold text-sm transition-colors">
            <ChevronLeft className="h-5 w-5" /> Dashboard
          </button>
        </Link>
        <div className="flex items-center gap-2 font-black text-slate-800">
          <Library className="h-6 w-6 text-indigo-600" />
          <span>Thư viện từ vựng</span>
        </div>
        <Link href="/import" className="ml-auto flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-indigo-600 transition-colors">
          <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Nhập thủ công</span>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white p-6 sm:p-10 shadow-xl shadow-indigo-200/50">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Bộ từ vựng biên soạn sẵn
            </div>
            <h1 className="text-2xl sm:text-4xl font-black mb-2 leading-tight">Khám phá theo chuyên đề</h1>
            <p className="text-white/80 font-medium max-w-lg text-sm sm:text-base">
              Từ vựng SGK 10–12, chủ điểm, cụm động từ, thành ngữ... đã gom sẵn. Chọn bài rồi nhập một phát vào danh sách tự học.
            </p>
            <div className="flex gap-3 mt-6">
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
                <div className="text-xl sm:text-2xl font-black">{totals.lessons}</div>
                <div className="text-[10px] uppercase font-bold text-white/70 tracking-wide">Bài học</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
                <div className="text-xl sm:text-2xl font-black">{totals.words.toLocaleString('vi-VN')}</div>
                <div className="text-[10px] uppercase font-bold text-white/70 tracking-wide">Từ vựng</div>
              </div>
            </div>
          </div>
          {/* Khối trang trí */}
          <div className="absolute -right-12 -top-12 w-52 h-52 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute right-24 -bottom-10 w-36 h-36 bg-violet-300/20 rounded-full blur-2xl" />
        </section>

        {/* Thanh tìm kiếm */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bài học theo tên (vd: phrasal, family, topic 3...)"
            className="w-full pl-11 pr-10 py-3 text-sm border rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-slate-700 transition-colors"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Bộ lọc category — ẩn khi đang tìm kiếm */}
        {!query && categories && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {Object.keys(categories).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-white border text-muted-foreground hover:text-slate-800 hover:border-indigo-200'
                  }`}
                >
                  {cat}
                  <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                    {categories[cat].length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lưới bài học */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Đang tải thư viện chuyên đề...</p>
          </div>
        ) : visibleLessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="opacity-30"><Search className="h-12 w-12 mx-auto" /></div>
            <h3 className="font-black text-slate-700">Không tìm thấy bài học</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {query ? `Không có bài nào khớp "${query}". Thử từ khóa khác.` : 'Chuyên đề này chưa có bài học.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold text-muted-foreground">
                {query ? `Kết quả tìm kiếm` : selectedCategory}
              </span>
              <span className="text-xs font-semibold text-slate-400">{visibleLessons.length} bài</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleLessons.map((lesson) => {
                const key = `${lesson.package}-${lesson.name}`;
                const isImported = importedLessons.has(key);
                const isThis = importingLesson === lesson.name;
                const st = catStyle(lesson.cat);
                return (
                  <div
                    key={key}
                    className="group relative bg-white border rounded-2xl p-5 pl-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
                  >
                    {/* Thanh màu accent bên trái */}
                    <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-full ${st.bar}`} />

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${st.chip}`}>
                        {lesson.cat}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {lesson.wordCount} từ
                      </span>
                    </div>

                    <h3 className="font-black text-slate-800 leading-snug line-clamp-2 mb-4 flex-1">
                      {lesson.name}
                    </h3>

                    <button
                      onClick={() => handleImportLesson(lesson)}
                      disabled={importingLesson !== null || isImported}
                      className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
                        isImported
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                      }`}
                    >
                      {isThis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isImported ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      {isThis ? 'Đang nhập...' : isImported ? 'Đã thêm vào danh sách' : 'Nhập học'}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
