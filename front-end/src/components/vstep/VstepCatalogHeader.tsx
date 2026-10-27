import Link from '@/shared/router/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Layers,
  Mic2,
  PenLine,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { VstepActiveTab, VstepBankTotals } from './vstepCatalogConstants';

export interface VstepCatalogHeaderProps {
  bankTotals: VstepBankTotals;
  activeTab: VstepActiveTab;
  onSelectTab: (tab: VstepActiveTab) => void;
}

export function VstepCatalogHeader({
  bankTotals,
  activeTab,
  onSelectTab,
}: VstepCatalogHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          <Link href="/student" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            LingoPro
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">Khảo Thí VSTEP</span>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white">
          Hệ Thống Khảo Thí &amp; Luyện Thi VSTEP
        </h1>

        <p className="mt-2 max-w-3xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Phòng thi máy tính trực tuyến chuẩn định dạng B1-B2-C1: {bankTotals.totalMockExams} Đề Full Mock 4 kỹ năng, {bankTotals.totalPracticeSets} bài luyện chuyên sâu, chống trùng đề và barem điểm 10.0.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Kho Câu Hỏi</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {bankTotals.totalQuestions.toLocaleString('vi-VN')}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">câu</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Nghe {bankTotals.totalListening.toLocaleString('vi-VN')} · Đọc {bankTotals.totalReading.toLocaleString('vi-VN')} câu
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Đề Full Mock</span>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {bankTotals.totalMockExams}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">đề thi</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              4 kỹ năng · 172 phút thi
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Bài Luyện Tập</span>
              <Layers className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {bankTotals.totalPracticeSets}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">bài</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Nghe &amp; Đọc chuyên sâu
            </p>
          </div>

          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 transition-colors hover:border-slate-400 dark:hover:border-slate-600">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Barem Khảo Thí</span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                10.0
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">điểm</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Chuẩn 6 Bậc B1–B2–C1
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/60 p-3 sm:p-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'full_mock'}
              onClick={() => onSelectTab('full_mock')}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-sm border transition-all cursor-pointer text-left ${
                activeTab === 'full_mock'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-base font-bold ${
                    activeTab === 'full_mock'
                      ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                      Đề Thi Full Mock (4 Kỹ Năng)
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      activeTab === 'full_mock'
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Mô phỏng 172 phút chuẩn phòng thi máy tính B1-B2-C1
                  </p>
                </div>
              </div>

              <span
                className={`hidden sm:inline-flex rounded-sm px-2.5 py-1 font-mono text-xs font-bold tabular-nums shrink-0 ${
                  activeTab === 'full_mock'
                    ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                    : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                [{bankTotals.totalMockExams} Đề]
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'skill_practice'}
              onClick={() => onSelectTab('skill_practice')}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-sm border transition-all cursor-pointer text-left ${
                activeTab === 'skill_practice'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-base font-bold ${
                    activeTab === 'skill_practice'
                      ? 'bg-white/10 text-white dark:bg-slate-900/10 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider">
                      Luyện Tập Kỹ Năng &amp; Chuyên Đề
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      activeTab === 'skill_practice'
                        ? 'text-slate-300 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Luyện đủ Nghe · Đọc · Viết · Nói theo từng kỹ năng
                  </p>
                </div>
              </div>

              <span
                className={`hidden sm:inline-flex rounded-sm px-2.5 py-1 font-mono text-xs font-bold tabular-nums shrink-0 ${
                  activeTab === 'skill_practice'
                    ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                    : 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                [{bankTotals.totalPracticeSets} Bài]
              </span>
            </button>

            <Link
              href="/vstep/speaking"
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-sm border transition-all cursor-pointer text-left border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/60 dark:hover:bg-amber-950/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm font-mono text-base font-bold bg-amber-500 text-slate-950 shadow-sm">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      VSTEP Speaking Lab
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">
                    Luyện Part 1–3, chấm điểm mẫu B1-B2-C1 &amp; bấm giờ 12 phút
                  </p>
                </div>
              </div>

              <span className="hidden sm:inline-flex rounded-sm px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums shrink-0 border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                [Mới]
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function VstepVnuBanner() {
  return (
    <section
      aria-label="Kỳ thi Chuẩn đầu ra Bậc 3 (VNU Test Bậc 3 - ULIS ĐHQGHN)"
      className="rounded-sm border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-xs transition-colors hover:border-slate-400 dark:hover:border-slate-700"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider rounded-xs border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Kỳ thi Chuẩn đầu ra Bậc 3 (VNU Test Bậc 3 - ULIS ĐHQGHN)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-medium rounded-xs border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              4 Kỹ Năng Toàn Diện
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-medium rounded-xs border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Chuẩn CEFR B1
            </span>
          </div>

          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Phân Hệ Khảo Thí &amp; Luyện Thi Chuẩn Đầu Ra Bậc 3 ULIS
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Luyện tập và thi thử trực tuyến mô phỏng bài thi Chuẩn đầu ra Tiếng Anh Bậc 3 của Trường Đại học Ngoại ngữ – Đại học Quốc gia Hà Nội (ULIS ĐHQGHN). Đầy đủ <strong>4 kỹ năng</strong>: Đọc (Reading 25 câu), Nghe (Listening 20 câu với <strong>Realistic Audio Player</strong> giới hạn 2 lượt nghe chuẩn quy chế), Viết (Writing 2 tasks kèm bộ đếm từ và bài mẫu), và Nói (Speaking 2 parts có thẻ Cue Cards). Bao gồm đề minh họa chính thức ULIS và bộ đề chuẩn hóa tương đương Cambridge PET B1.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 font-mono text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              Reading (25 Qs / 40 phút)
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="h-3.5 w-3.5 text-emerald-500" />
              Listening (20 Qs / Audio Player 2 lượt)
            </span>
            <span className="flex items-center gap-1.5">
              <PenLine className="h-3.5 w-3.5 text-amber-500" />
              Writing (Task 1 &amp; Task 2)
            </span>
            <span className="flex items-center gap-1.5">
              <Mic2 className="h-3.5 w-3.5 text-purple-500" />
              Speaking (Part 1 &amp; Cue Cards)
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
              Barem Thang 10.0 ULIS
            </span>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
          <Link
            href="/vnu-bac-3"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm font-mono text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-xs group"
          >
            <span>Vào Phòng Thi VNU Bậc 3</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Đề Minh Họa &amp; Cambridge PET
          </span>
        </div>
      </div>
    </section>
  );
}
