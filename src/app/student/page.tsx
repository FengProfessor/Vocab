'use client';

import Link from 'next/link';
import { StudentShell } from '@/components/student/StudentShell';
import { useStudentDashboard } from '@/components/student/dashboard/useStudentDashboard';
import { DashboardHeader } from '@/components/student/dashboard/DashboardHeader';
import { PriorityBannerSlot } from '@/components/student/dashboard/PriorityBannerSlot';
import { StudentHeroSection } from '@/components/student/dashboard/StudentHeroSection';
import { StudentSkillsAndProgressSection } from '@/components/student/dashboard/StudentSkillsAndProgressSection';
import { StudentVaultSummaryCard } from '@/components/student/dashboard/StudentVaultSummaryCard';
import { StudentDashboardModals } from '@/components/student/dashboard/StudentDashboardModals';

export default function StudentDashboard() {
  const {
    profile,
    gamification,
    classroomId,
    currentClassScope,
    enrolledClassrooms,
    activeClassroom,
    dailyActivity,
    todayWords,
    todayNewWords,
    todayReviewWords,
    studyStreak,
    readingProgress,
    listeningStats,
    inProgressPacks,
    challengeWidget,
    dashboardSecondarySettled,
    totalWords,
    newCount,
    reviewDueCount,
    levelCounts,
    countsReady,
    masteredCount,
    dailyWordGoal,
    isFreePlan,
    greeting,
    mascotMood,
    actionModalType,
    setActionModalType,
    milestonePopup,
    setMilestonePopup,
    isJoinModalOpen,
    setIsJoinModalOpen,
    joinCode,
    setJoinCode,
    isJoining,
    joinError,
    setJoinError,
    handleSwitchScope,
    handleJoinClassroom,
    handleMilestoneClaimed,
  } = useStudentDashboard();

  const reviewHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/review?class=${encodeURIComponent(currentClassScope)}`
      : '/review';

  const learnHref =
    currentClassScope && currentClassScope !== '__personal__'
      ? `/flashcard?mode=learn&class=${encodeURIComponent(currentClassScope)}`
      : '/flashcard?mode=learn';

  const reviewSessionHref = (mode: string) =>
    currentClassScope && currentClassScope !== '__personal__'
      ? `/review/session?mode=${mode}&class=${encodeURIComponent(currentClassScope)}`
      : `/review/session?mode=${mode}`;

  const learnHeaderLink = (
    <Link
      href={learnHref}
      data-onboarding="learn"
      className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm shadow-inner backdrop-blur-sm md:h-8 md:w-8 md:text-base">
        📖
      </div>
      <div className="min-w-0">
        <div className="flex flex-col items-start gap-0.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
          <span className="truncate text-[11px] font-black uppercase tracking-wide text-white md:text-xs md:tracking-wider">
            Học Từ Mới
          </span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-extrabold leading-none tabular-nums text-white backdrop-blur-sm md:text-[9.5px]">
            {countsReady ? (newCount > 0 ? `${newCount} từ mới` : 'Tất cả') : '...'}
          </span>
        </div>
        <p className="mt-0.5 hidden truncate text-[10.5px] font-medium text-indigo-100 md:block">
          {newCount > 0
            ? 'Thẻ lật thông minh nạp từ nhanh'
            : 'Học flashcard từ vựng đã lưu'}
        </p>
      </div>
    </Link>
  );

  const reviewHeaderLink = (
    <Link
      href={reviewHref}
      data-onboarding="review"
      className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm shadow-inner backdrop-blur-sm md:h-8 md:w-8 md:text-base">
        🔄
      </div>
      <div className="min-w-0">
        <div className="flex flex-col items-start gap-0.5 md:flex-row md:flex-wrap md:items-center md:gap-1.5">
          <span className="truncate text-[11px] font-black uppercase tracking-wide text-white md:text-xs md:tracking-wider">
            Ôn Tập FSRS
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold leading-none tabular-nums backdrop-blur-sm md:text-[9.5px] ${
              reviewDueCount > 0
                ? 'animate-pulse bg-amber-400 text-amber-950'
                : 'bg-white/20 text-white'
            }`}
          >
            {countsReady ? (reviewDueCount > 0 ? `${reviewDueCount} cần ôn` : 'Đã sẵn sàng') : '...'}
          </span>
        </div>
        <p className="mt-0.5 hidden truncate text-[10.5px] font-medium text-emerald-100 md:block">
          {reviewDueCount > 0
            ? 'Đến hạn ôn trước khi quên theo FSRS'
            : 'Ôn luyện tự do củng cố trí nhớ dài hạn'}
        </p>
      </div>
    </Link>
  );

  return (
    <StudentShell
      title="Dashboard"
      contentClassName="p-0"
      hideMobileHeader
      suppressGlobalBanners
      profile={profile}
      gamification={gamification}
      displayStreak={studyStreak}
      reviewDueCount={reviewDueCount}
      classroomId={classroomId}
      onJoinClass={() => {
        setJoinError(null);
        setJoinCode('');
        setIsJoinModalOpen(true);
      }}
    >
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-2 px-3 py-2 md:gap-3 md:px-6 md:py-3">
        {/* Block 1: Compact Header + Exclusive Priority Banner Slot */}
        <DashboardHeader
          greeting={greeting}
          profile={profile}
          mascotMood={mascotMood}
          reviewDueCount={reviewDueCount}
          newCount={newCount}
          todayNewWords={todayNewWords}
          dailyWordGoal={dailyWordGoal}
          countsReady={countsReady}
          totalWords={totalWords}
          masteredCount={masteredCount}
          studyStreak={studyStreak}
          gamification={gamification}
          classroomId={classroomId}
        />

        <PriorityBannerSlot
          profile={profile}
          isFreePlan={isFreePlan}
          challengeWidget={challengeWidget}
          dashboardSecondarySettled={dashboardSecondarySettled}
        />

        {/* Block 2: Action-First Hero + Continue Learning Strip */}
        <StudentHeroSection
          learnHref={learnHref}
          reviewHref={reviewHref}
          reviewSessionHref={reviewSessionHref}
          learnHeaderLink={learnHeaderLink}
          reviewHeaderLink={reviewHeaderLink}
          inProgressPacks={inProgressPacks}
          onOpenActionModal={setActionModalType}
        />

        {/* Block 3 & 4A: Streak Heatmap, Daily Progress, Pro Milestone & Real Shortcuts */}
        <StudentSkillsAndProgressSection
          profile={profile}
          isFreePlan={isFreePlan}
          gamification={gamification}
          studyStreak={studyStreak}
          dailyActivity={dailyActivity}
          todayWords={todayWords}
          todayNewWords={todayNewWords}
          todayReviewWords={todayReviewWords}
          dailyWordGoal={dailyWordGoal}
          reviewDueCount={reviewDueCount}
          countsReady={countsReady}
          totalWords={totalWords}
          readingProgress={readingProgress}
          listeningStats={listeningStats}
          onOpenActionModal={setActionModalType}
          onMilestoneClaimed={handleMilestoneClaimed}
        />

        {/* Block 4B: Compact Vault Summary Card (Full list at /student/vault) */}
        <StudentVaultSummaryCard
          currentClassScope={currentClassScope}
          enrolledClassrooms={enrolledClassrooms}
          activeClassroom={activeClassroom}
          countsReady={countsReady}
          totalWords={totalWords}
          newCount={newCount}
          reviewDueCount={reviewDueCount}
          levelCounts={levelCounts}
          onSwitchScope={handleSwitchScope}
        />
      </div>

      <StudentDashboardModals
        milestonePopup={milestonePopup}
        onCloseMilestone={() => setMilestonePopup(null)}
        isJoinModalOpen={isJoinModalOpen}
        joinCode={joinCode}
        isJoining={isJoining}
        joinError={joinError}
        onChangeJoinCode={(code) => {
          setJoinCode(code);
          setJoinError(null);
        }}
        onCloseJoinModal={() => {
          setIsJoinModalOpen(false);
          setJoinError(null);
        }}
        onSubmitJoinClassroom={() => {
          void handleJoinClassroom();
        }}
        actionModalType={actionModalType}
        onCloseActionModal={() => setActionModalType(null)}
        reviewDueCount={reviewDueCount}
        newCount={newCount}
        currentClassScope={currentClassScope}
      />
    </StudentShell>
  );
}
