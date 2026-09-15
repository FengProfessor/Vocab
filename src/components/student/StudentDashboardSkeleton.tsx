import React from 'react';

export function StudentDashboardSkeleton() {
  return (
    <div className="flex min-h-dvh w-full bg-[#f7f8fc] font-sans dark:bg-slate-950">
      {/* Desktop Sidebar Placeholder */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="h-7 w-7 rounded-md bg-indigo-600/40 animate-pulse" />
          <div className="space-y-1">
            <div className="h-3.5 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-slate-100 dark:bg-slate-850 animate-pulse" />
          </div>
        </div>

        {/* Section 1 */}
        <div className="mt-3 space-y-1.5">
          <div className="h-2.5 w-16 rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse px-2" />
          <div className="h-8 w-full rounded-md bg-indigo-50/70 border-l-2 border-indigo-500/50 dark:bg-indigo-950/30 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-slate-100/60 dark:bg-slate-850 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-slate-100/60 dark:bg-slate-850 animate-pulse" />
        </div>

        {/* Section 2 */}
        <div className="mt-4 space-y-1.5">
          <div className="h-2.5 w-20 rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse px-2" />
          <div className="h-8 w-full rounded-md bg-slate-100/60 dark:bg-slate-850 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-slate-100/60 dark:bg-slate-850 animate-pulse" />
          <div className="h-8 w-full rounded-md bg-slate-100/60 dark:bg-slate-850 animate-pulse" />
        </div>

        {/* User Card at bottom */}
        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-2.5 w-14 rounded bg-slate-100 dark:bg-slate-850 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse md:hidden" />
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-14 sm:w-16 rounded-full border border-[#fde2c0] bg-[#fff5e9] animate-pulse" />
            <div className="hidden md:block h-7 w-20 rounded-full border border-[#fbeaa6] bg-[#fffbe8] animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="mx-auto w-full max-w-[920px] flex-1 flex-col gap-3 px-4 py-3 sm:gap-3.5 sm:px-7 sm:py-5 flex">
          {/* Greeting Banner */}
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-950/60 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-5 w-44 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-6 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 animate-pulse" />
            </div>
          </div>

          {/* 2 Main Action Cards (Học từ mới / Ôn tập FSRS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-[84px] rounded-2xl border-2 border-indigo-200/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-indigo-200/60 dark:bg-indigo-900/60" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-indigo-200/70 dark:bg-indigo-900/70" />
                  <div className="h-3 w-36 rounded bg-indigo-100 dark:bg-indigo-950/50" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm" />
            </div>
            <div className="h-[84px] rounded-2xl border-2 border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 animate-pulse flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 rounded bg-emerald-200/70 dark:bg-emerald-900/70" />
                  <div className="h-3 w-36 rounded bg-emerald-100 dark:bg-emerald-950/50" />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm" />
            </div>
          </div>

          {/* Secondary Action Cards */}
          <div className="flex items-center gap-2">
            <div className="h-11 flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
            <div className="h-11 flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
          </div>

          {/* Streak & XP Goal Grid */}
          <div className="grid grid-cols-[1fr_minmax(0,0.95fr)] sm:grid-cols-2 gap-1.5 sm:gap-2.5">
            <div className="h-[104px] rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
            <div className="h-[104px] rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
          </div>

          {/* Word Vault Section Skeleton */}
          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-14 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 animate-pulse" />
              </div>
            </div>

            {/* 3 Stat Boxes */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
              <div className="h-12 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 animate-pulse" />
              <div className="h-12 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 animate-pulse" />
            </div>

            {/* Search & Filter bar */}
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 animate-pulse" />
              <div className="h-10 w-24 rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40 animate-pulse" />
            </div>

            {/* Word Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/60 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="mt-1.5 h-3 w-40 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
