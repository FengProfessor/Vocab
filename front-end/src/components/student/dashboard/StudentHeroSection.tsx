import dynamic from '@/shared/ui/dynamic';
import Link from '@/shared/router/navigation';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { EnableNotifications } from '@/components/EnableNotifications';
import type { ActionSelectionType } from '@/components/student/ActionSelectionModal';
import type { DailyReadingStatus, EnrolledClassroom } from './useStudentDashboard';

const ChallengeWidget = dynamic(
  () => import('@/components/challenge/ChallengeWidget').then((m) => m.ChallengeWidget),
  { ssr: false },
);

/** Compact notification card: "You have a daily reading exercise!" */
export function DailyReadingCard({ status }: { status: DailyReadingStatus }) {
  if (!status.hasNew) return null;

  return (
    <Link
      href="/practice/daily-reading"
      className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white px-3 py-2.5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white shadow-sm">
        🌅
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-indigo-900">Bài luyện đọc mới!</p>
        <p className="mt-0.5 truncate text-[11px] text-indigo-700/80">
          &ldquo;{status.title}&rdquo; · {status.wordCount} từ · Đọc + quiz + điền từ
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400" />
    </Link>
  );
}

export interface StudentHeroSectionProps {
  enrolledClassrooms: EnrolledClassroom[];
  currentClassScope: string;
  onSwitchScope: (newScope: string) => void;
  dailyReadingStatus: DailyReadingStatus;
  reviewDueCount: number;
  newCount: number;
  dailyGoalXp: number;
  todayXp: number;
  todayNewWords: number;
  countsReady: boolean;
  listeningStats: {
    completedCount: number;
    inProgressPercent: number;
    totalCompleted: number;
  };
  learnHref: string;
  reviewHref: string;
  onSelectActionModal: (type: ActionSelectionType) => void;
}

export function StudentHeroSection({
  enrolledClassrooms,
  currentClassScope,
  onSwitchScope,
  dailyReadingStatus,
  reviewDueCount,
  newCount,
  dailyGoalXp,
  todayXp,
  todayNewWords,
  countsReady,
  listeningStats,
  learnHref,
  reviewHref,
  onSelectActionModal,
}: StudentHeroSectionProps) {
  return (
    <>
      {enrolledClassrooms.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSwitchScope('__personal__')}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              currentClassScope === '__personal__'
                ? 'bg-[#7B67FF] text-white shadow-xs'
                : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#A5AAC6]'
            }`}
          >
            Kho cá nhân
          </button>
          {enrolledClassrooms.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSwitchScope(cls.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                currentClassScope === cls.id
                  ? 'bg-[#7B67FF] text-white shadow-xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#272C47] dark:bg-[#161A2E] dark:text-[#A5AAC6]'
              }`}
            >
              Lớp: {cls.name}
            </button>
          ))}
        </div>
      )}

      <EnableNotifications />
      <DailyReadingCard status={dailyReadingStatus} />
      <ChallengeWidget />

      <section className="flex flex-col lg:flex-row items-stretch lg:items-center gap-6 lg:gap-7 rounded-[22px] bg-[#3A2FA8] p-6 sm:p-7 text-white shadow-lg shadow-indigo-950/15">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-white/85">
            Việc nên làm bây giờ
          </div>

          <h2 className="mt-1.5 mb-2 text-2xl sm:text-[30px] font-extrabold leading-[1.2] text-white">
            {reviewDueCount > 0
              ? `Ôn tập ${reviewDueCount} từ đến hạn`
              : `Học ${newCount > 0 ? Math.min(10, newCount) : 10} từ mới`}
          </h2>

          <p className="mb-5 max-w-[420px] text-[14.5px] sm:text-[15px] text-white/90 leading-relaxed">
            {reviewDueCount > 0
              ? `Bạn có ${reviewDueCount} từ vựng đến hạn ôn theo FSRS. Ôn tập ngay để giữ chuỗi và đạt mục tiêu ${dailyGoalXp} XP.`
              : `Bạn đã ôn xong lượt hôm nay. Nạp thêm từ mới để giữ chuỗi và đạt mục tiêu ${dailyGoalXp} XP.`}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {reviewDueCount > 0 ? (
              <>
                <Link
                  href={reviewHref}
                  data-onboarding="review"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5.5 text-[15px] font-bold text-[#2B2090] shadow-sm transition hover:bg-indigo-50 active:scale-[0.99]"
                >
                  <span>Bắt đầu ôn · ~5 phút</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  href={learnHref}
                  data-onboarding="learn"
                  className="inline-flex h-12 items-center px-3.5 text-[14px] font-semibold text-white underline underline-offset-4 hover:text-indigo-200 transition"
                >
                  Học từ mới
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={learnHref}
                  data-onboarding="learn"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5.5 text-[15px] font-bold text-[#2B2090] shadow-sm transition hover:bg-indigo-50 active:scale-[0.99]"
                >
                  <span>Bắt đầu học · ~5 phút</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  href={reviewHref}
                  data-onboarding="review"
                  className="inline-flex h-12 items-center px-3.5 text-[14px] font-semibold text-white underline underline-offset-4 hover:text-indigo-200 transition"
                >
                  Ôn tập tự do
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => onSelectActionModal(reviewDueCount > 0 ? 'review' : 'learn')}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/15 px-3.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/25 cursor-pointer"
              title="Chọn chế độ học / ôn tập"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Chọn chế độ</span>
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[260px] shrink-0 rounded-2xl bg-white/[0.14] p-4">
          <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white/85 tabular-nums">
            Mục tiêu hôm nay · {todayXp}/{dailyGoalXp} XP
          </div>

          <button
            type="button"
            onClick={() => onSelectActionModal('review')}
            className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
          >
            <span
              className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                reviewDueCount === 0
                  ? 'border-white bg-white'
                  : 'border-white/70 bg-transparent'
              }`}
            />
            <span className="truncate">
              Ôn tập từ vựng ·{' '}
              {countsReady
                ? reviewDueCount === 0
                  ? 'hoàn tất'
                  : `${reviewDueCount} cần ôn`
                : '…'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectActionModal('learn')}
            className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
          >
            <span
              className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                todayNewWords >= dailyGoalXp
                  ? 'border-white bg-white'
                  : 'border-white/70 bg-transparent'
              }`}
            />
            <span className="truncate tabular-nums">
              Nạp từ mới · {todayNewWords}/{dailyGoalXp}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectActionModal('listening')}
            className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
          >
            <span
              className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                listeningStats.completedCount > 0
                  ? 'border-white bg-white'
                  : 'border-white/70 bg-transparent'
              }`}
            />
            <span className="truncate">
              Luyện nghe
              {listeningStats.completedCount > 0 ? ` · ${listeningStats.completedCount} bài` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectActionModal('reading')}
            className="flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-semibold text-white hover:text-indigo-100 transition cursor-pointer"
          >
            <span
              className={`h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                dailyReadingStatus.completedCount > 0
                  ? 'border-white bg-white'
                  : 'border-white/70 bg-transparent'
              }`}
            />
            <span className="truncate">
              Luyện đọc
              {dailyReadingStatus.completedCount > 0
                ? ` · ${dailyReadingStatus.completedCount}/${dailyReadingStatus.totalCount}`
                : ''}
            </span>
          </button>
        </div>
      </section>
    </>
  );
}
