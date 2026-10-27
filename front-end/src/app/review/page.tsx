import { VocabApi } from '@/features/vocab/api';

import { Suspense, useEffect, useState } from 'react';
import Link from '@/shared/router/navigation';
import { useSearchParams } from '@/shared/router/navigation';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Gamepad2,
  Loader2,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { HUB_MODES } from '@/lib/review-modes';
import {
  readWordSummaryCache,
  readLastWordSummaryCache,
  writeWordSummaryCache,
} from '@/lib/word-summary-cache';
import {
  fetchSessionOnce,
  fetchWordSummaryOnce,
  useStudentContext,
} from '@/components/student/StudentProvider';

function ReviewHubContent() {
  const searchParams = useSearchParams();
  const classParam = searchParams.get('class');
  const studentCtx = useStudentContext();
  const [dueCount, setDueCount] = useState<number | null>(() => {
    const cached = readLastWordSummaryCache();
    if (cached && (!classParam || cached.classroomId === classParam)) {
      return cached.reviewDueCount ?? 0;
    }
    if (
      !classParam &&
      studentCtx?.wordSummary &&
      studentCtx.wordSummary.total > 0
    ) {
      return studentCtx.wordSummary.reviewDueCount ?? 0;
    }
    return null;
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = studentCtx?.session ?? (await fetchSessionOnce());
        if (!session?.user) return;

        const cached = readWordSummaryCache(session.user.id);
        if (cached && !cancelled) {
          if (!classParam || cached.classroomId === classParam) {
            setDueCount(cached.reviewDueCount ?? 0);
          }
        }

        if (!classParam) {
          try {
            const res = await VocabApi.getWords('/api/words?summary=1');
            const data = await res.json().catch(() => null);
            if (!cancelled && data?.success) {
              const count =
                typeof data.reviewDueCount === 'number'
                  ? data.reviewDueCount
                  : (data.dueCount ?? 0);
              setDueCount(count);
              writeWordSummaryCache(session.user.id, {
                total: data.total ?? data.totalWords ?? 0,
                newCount: data.newCount ?? 0,
                reviewDueCount: count,
                dueCount: count,
                classroomId: null,
              });
              return;
            }
          } catch {
            // fallback to provider cache
          }

          const summary = await fetchWordSummaryOnce(session.user.id);
          if (!cancelled && summary) {
            setDueCount(summary.reviewDueCount);
          } else if (!cancelled && !cached) {
            setDueCount(0);
          }
        } else {
          const url = `/api/words?classroomId=${encodeURIComponent(classParam)}&summary=1`;
          const res = await VocabApi.getWords(url, {});
          const data = await res.json().catch(() => null);
          if (!cancelled && data?.success) {
            const count =
              typeof data.reviewDueCount === 'number'
                ? data.reviewDueCount
                : Array.isArray(data.data)
                  ? data.data.length
                  : (data.dueCount ?? 0);
            setDueCount(count);
          } else if (!cancelled && !cached) {
            setDueCount(0);
          }
        }
      } catch {
        if (!cancelled) setDueCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classParam, studentCtx?.session]);

  const withClass = (href: string): string => {
    if (!classParam) return href;
    const join = href.includes('?') ? '&' : '?';
    return `${href}${join}class=${encodeURIComponent(classParam)}`;
  };

  return (
    <StudentShell title="Ôn tập thông minh" contentClassName="max-w-4xl mx-auto px-4 py-6">
      <div className="space-y-6 pb-16">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-black uppercase tracking-wider mb-1">
              <Brain className="w-3.5 h-3.5" /> Thuật toán FSRS 4.5
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Trung Tâm Ôn Tập Ngắt Quãng
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Kết hợp nhận diện, điền khuyết, luyện nghe và gõ chính tả đúng điểm rơi trí nhớ
            </p>
          </div>
        </div>

        {/* ── TODAY'S FSRS COMMAND HERO CARD ── */}
        {dueCount !== null ? (
          <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-200/90 dark:border-indigo-800/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 dark:from-indigo-950/50 dark:via-slate-900 dark:to-violet-950/30 p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" /> Lịch trình hôm nay
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {dueCount > 0 ? (
                    <>
                      Bạn có <span className="text-indigo-600 dark:text-indigo-400">{dueCount} từ</span> đến hạn cần củng cố
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-7 h-7 shrink-0" />
                      Hoàn tất 100% lịch ôn hôm nay!
                    </span>
                  )}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {dueCount > 0
                    ? 'Ôn tập ngay lúc này giúp nhân đôi độ bền trí nhớ (Stability) và ngăn chặn đường cong lãng quên Ebbinghaus.'
                    : 'Trí nhớ từ vựng của bạn đã được khóa chặt cho hôm nay. Bạn có thể ôn tập tự do hoặc thử sức với các trò chơi phản xạ.'}
                </p>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 min-w-[240px]">
                {dueCount > 0 ? (
                  <Link href={withClass('/review/session?mode=mixed')}>
                    <Button className="h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer">
                      <Zap className="w-4 h-4 fill-current text-amber-300" />
                      <span>Bắt đầu ôn ngay ({dueCount} từ)</span>
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href={withClass('/review/session?mode=mixed&free=1')}>
                      <Button className="h-11 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer">
                        <RotateCcw className="w-4 h-4" />
                        <span>Ôn tập tự do (Cả kho)</span>
                      </Button>
                    </Link>
                    <Link href={withClass('/practice')}>
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-2xl font-bold border-indigo-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm cursor-pointer"
                      >
                        Khám phá Trung tâm Thực hành
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs animate-pulse space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {/* ── REVIEW MODES BENTO GRID ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Chọn chế độ ôn tập chuyên biệt
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {HUB_MODES.map((m) => {
              const isHighlighted = m.highlight && (dueCount ?? 0) > 0;
              return (
                <Link
                  key={m.id}
                  href={withClass(m.href)}
                  className={`group flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all hover:shadow-md active:scale-[0.99] ${
                    isHighlighted
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                      isHighlighted
                        ? 'bg-white/15'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2
                        className={`text-base font-black ${
                          isHighlighted
                            ? 'text-white'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {m.title}
                      </h2>
                      {isHighlighted && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-950">
                          Khuyên dùng
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-xs font-medium leading-relaxed ${
                        isHighlighted
                          ? 'text-indigo-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {m.desc}
                    </p>
                  </div>
                  <ArrowRight
                    className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isHighlighted
                        ? 'text-white/80'
                        : 'text-slate-400 group-hover:text-indigo-500'
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── ARCADE GAMES BANNER ── */}
        <Link
          href="/practice/games"
          className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-violet-200/90 dark:border-violet-900/60 bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-white dark:from-violet-950/40 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 transition-all hover:border-violet-400 dark:hover:border-violet-600 shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                Đổi gió với Đấu trường 6 Mini Game Phản xạ
              </p>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Lật thẻ trí nhớ, đua từ 60s, giải mã chữ cái và thám tử ngữ pháp →
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* ── FSRS SCORING GUIDE FOOTER ── */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 text-center">
            Cơ chế tự động tính lịch ôn FSRS
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <span className="font-black text-rose-600 dark:text-rose-400 block">Again (Quên)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Trả lời sai · Lặp lại ngay</span>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <span className="font-black text-indigo-600 dark:text-indigo-400 block">Good (Nhớ chuẩn)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">MCQ đúng · Tăng chu kỳ nhớ</span>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800">
              <span className="font-black text-emerald-600 dark:text-emerald-400 block">Easy (Phản xạ nhanh)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Gõ/Nghe nhanh · Nhảy bậc cao</span>
            </div>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}

export default function ReviewHubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ReviewHubContent />
    </Suspense>
  );
}
