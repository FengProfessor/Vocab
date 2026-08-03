'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { HUB_MODES } from '@/lib/review-modes';
import { authFetch } from '@/lib/auth-fetch';

function ReviewHubContent() {
  const searchParams = useSearchParams();
  const classParam = searchParams.get('class');
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = classParam
          ? `/api/words?classroomId=${classParam}&filter=review`
          : `/api/words?filter=review`;
        const res = await authFetch(url);
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.data)) {
          setDueCount(data.data.length);
        } else if (!cancelled) {
          setDueCount(0);
        }
      } catch {
        if (!cancelled) setDueCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classParam]);

  const withClass = (href: string): string => {
    if (!classParam) return href;
    const join = href.includes('?') ? '&' : '?';
    return `${href}${join}class=${encodeURIComponent(classParam)}`;
  };

  return (
    <StudentShell title="Ôn tập" contentClassName="max-w-lg mx-auto">
      <div className="space-y-5 px-1 pb-8 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Ôn tập đa dạng</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Mix recognition · cloze · nghe · gõ — FSRS chung 1 pipeline
            </p>
          </div>
          <Link
            href="/student"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm active:scale-95"
            aria-label="Về dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </div>

        {dueCount !== null && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Hôm nay</p>
            <p className="mt-0.5 text-lg font-black text-indigo-900">
              {dueCount > 0 ? (
                <>
                  {dueCount} từ đến hạn ôn
                </>
              ) : (
                'Không có từ nào đến hạn ôn 🎉'
              )}
            </p>
            {dueCount === 0 && (
              <p className="mt-1.5 text-sm font-medium text-indigo-600 leading-snug">
                Muốn luyện thêm? Vào{' '}
                <Link href={withClass('/practice')} className="font-bold underline underline-offset-2 hover:text-indigo-800">
                  Sử dụng từ
                </Link>{' '}
                để làm quiz mà không ảnh hưởng thuật toán ghi nhớ.
              </p>
            )}
          </div>
        )}

        <div className="grid gap-3">
          {HUB_MODES.map((m) => {
            // Modes that POST /api/words/srs — disable when no due words to protect scheduling
            // Only 'mcq' (/quiz) is safe: no SRS update, loads all words for recognition practice
            const isFsrsMode = m.id !== 'mcq';
            const disabled = isFsrsMode && dueCount === 0;

            if (disabled) {
              return (
                <div
                  key={m.id}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 opacity-50 cursor-not-allowed"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl bg-slate-100">
                    {m.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-black text-slate-400">{m.title}</h2>
                    <p className="mt-0.5 text-sm font-medium leading-snug text-slate-400">
                      Chưa có từ đến hạn
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={m.id}
                href={withClass(m.href)}
                className={`group flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition-all active:scale-[0.98] ${
                  m.highlight
                    ? 'border-indigo-200 bg-indigo-600 text-white shadow-indigo-200/60'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                    m.highlight ? 'bg-white/15' : 'bg-slate-50'
                  }`}
                >
                  {m.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-base font-black ${m.highlight ? 'text-white' : 'text-slate-900'}`}
                    >
                      {m.title}
                    </h2>
                    {m.highlight && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-50">
                        Gợi ý
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-0.5 text-sm font-medium leading-snug ${
                      m.highlight ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {m.desc}
                  </p>
                </div>
                <span
                  className={`mt-1 shrink-0 text-lg font-black ${
                    m.highlight ? 'text-white/70' : 'text-slate-300 group-hover:text-indigo-400'
                  }`}
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>

        <p className="px-1 text-center text-[11px] font-medium text-slate-400">
          MCQ đúng tối đa Good · gõ/nghe nhanh có thể Easy · sai = Again
        </p>
      </div>
    </StudentShell>
  );
}

export default function ReviewHubPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ReviewHubContent />
    </Suspense>
  );
}
