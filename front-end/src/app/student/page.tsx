import { Clock } from 'lucide-react';
import { StudentShell } from '@/components/student/StudentShell';
import { LearningAnalyticsPanel } from '@/components/student/LearningAnalyticsPanel';
import { useStudentDashboard } from '@/components/student/dashboard/useStudentDashboard';
import { StudentHeroSection } from '@/components/student/dashboard/StudentHeroSection';
import { StudentSkillsAndProgressSection } from '@/components/student/dashboard/StudentSkillsAndProgressSection';
import { StudentVaultSidebarSection } from '@/components/student/dashboard/StudentVaultSidebarSection';
import { StudentDashboardModals } from '@/components/student/dashboard/StudentDashboardModals';

export default function StudentDashboard() {
  const {
    isDesktop,
    profile,
    words,
    classroomId,
    currentClassScope,
    enrolledClassrooms,
    dailyActivity,
    todayNewWords,
    countdown,
    selectedWord,
    setSelectedWord,
    selectedWordId,
    setSelectedWordId,
    dailyReadingStatus,
    listeningStats,
    isJoinModalOpen,
    setIsJoinModalOpen,
    joinCode,
    setJoinCode,
    isJoining,
    joinError,
    setJoinError,
    actionModalType,
    setActionModalType,
    totalWords,
    newCount,
    reviewDueCount,
    levelCounts,
    countsReady,
    wordsLoading,
    isLoadingMore,
    avgStabilityDays,
    retentionRate,
    grammarDueCount,
    skillScores,
    quizTrend,
    serverWeakWords,
    analyticsWeakWords,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    gamification,
    studyStreak,
    milestonePopup,
    setMilestonePopup,
    filteredWords,
    activeClassroom,
    showVaultWords,
    setShowVaultWords,
    todayFormattedDate,
    badges,
    reviewHref,
    learnHref,
    dailyGoalXp,
    firstName,
    weekDaysStrip,
    activePack,
    activePackPct,
    activePackHref,
    priorityWords,
    loadMoreWords,
    handleSwitchScope,
    handleUpdateMeaning,
    handleJoinClassroom,
    handleProTrialClaimed,
    handleWordDeleted,
  } = useStudentDashboard();

  return (
    <StudentShell
      title={`Chào ${firstName}, sẵn sàng học chưa?`}
      subtitle={
        <>
          <span>
            {todayFormattedDate} · mục tiêu hôm nay chỉ cần {dailyGoalXp} XP
          </span>
          {countdown && reviewDueCount === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:bg-[#20253F] dark:text-[#B3A8FF]">
              <Clock className="h-3 w-3" />
              {countdown}
            </span>
          )}
        </>
      }
      contentClassName="p-0"
      profile={profile}
      gamification={gamification}
      reviewDueCount={reviewDueCount}
      newCount={newCount}
      classroomId={classroomId}
      onJoinClass={() => {
        setJoinError(null);
        setJoinCode('');
        setIsJoinModalOpen(true);
      }}
    >
      <div
        className="flex w-full flex-1 min-w-0 flex-col text-[14px] leading-[1.45] text-slate-900 dark:text-[#F2F3FB]"
        data-Responsive-mode={isDesktop ? 'desktop' : 'mobile'}
      >
        <div className="flex w-full flex-1 min-w-0 flex-col gap-6 px-4 py-6 sm:px-9 sm:py-7">
          <StudentHeroSection
            enrolledClassrooms={enrolledClassrooms}
            currentClassScope={currentClassScope}
            onSwitchScope={handleSwitchScope}
            dailyReadingStatus={dailyReadingStatus}
            reviewDueCount={reviewDueCount}
            newCount={newCount}
            dailyGoalXp={dailyGoalXp}
            todayXp={gamification.today_xp}
            todayNewWords={todayNewWords}
            countsReady={countsReady}
            listeningStats={listeningStats}
            learnHref={learnHref}
            reviewHref={reviewHref}
            onSelectActionModal={setActionModalType}
          />

          <LearningAnalyticsPanel
            stats={{
              total: totalWords,
              due: reviewDueCount,
              new: newCount,
              learned: Math.max(0, totalWords - newCount),
            }}
            wordBreakdown={{
              l1: levelCounts[0] || 0,
              l2: levelCounts[1] || 0,
              l3: levelCounts[2] || 0,
              l4: levelCounts[3] || 0,
              l5: levelCounts[4] || 0,
              l6: levelCounts[5] || 0,
            }}
            avgStabilityDays={avgStabilityDays}
            retentionRate={retentionRate}
            skillScores={skillScores}
            dailyActivity={dailyActivity}
            quizTrend={quizTrend}
            grammarDue={grammarDueCount}
            weakWords={analyticsWeakWords}
            currentStreak={studyStreak}
            longestStreak={gamification.longest_streak}
            totalXp={gamification.total_xp}
            todayXp={gamification.today_xp}
            dailyGoal={gamification.daily_goal}
          />

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
            <StudentSkillsAndProgressSection
              onSelectActionModal={setActionModalType}
              activePack={activePack}
              activePackPct={activePackPct}
              activePackHref={activePackHref}
              priorityWords={priorityWords}
              serverWeakWords={serverWeakWords}
              reviewHref={reviewHref}
              onSelectWordId={setSelectedWordId}
              profileId={profile?.id}
              studyStreak={studyStreak}
              countsReady={countsReady}
              totalWords={totalWords}
              onProTrialClaimed={handleProTrialClaimed}
              badges={badges}
            />

            <StudentVaultSidebarSection
              weekDaysStrip={weekDaysStrip}
              activeClassroom={activeClassroom}
              countsReady={countsReady}
              totalWords={totalWords}
              showVaultWords={showVaultWords}
              onToggleVaultWords={() => setShowVaultWords((v) => !v)}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              wordsLoading={wordsLoading}
              filteredWords={filteredWords}
              wordsCount={words.length}
              debouncedQuery={debouncedQuery}
              isLoadingMore={isLoadingMore}
              onLoadMoreWords={loadMoreWords}
              onSelectWordId={setSelectedWordId}
              onSelectActionModal={setActionModalType}
            />
          </div>
        </div>
      </div>

      <StudentDashboardModals
        milestonePopup={milestonePopup}
        onCloseMilestonePopup={() => setMilestonePopup(null)}
        selectedWordId={selectedWordId}
        onCloseWordDetail={() => setSelectedWordId(null)}
        onWordDeleted={handleWordDeleted}
        selectedWord={selectedWord}
        onCloseMeaningSelector={() => setSelectedWord(null)}
        onUpdateMeaning={handleUpdateMeaning}
        isJoinModalOpen={isJoinModalOpen}
        isJoining={isJoining}
        joinCode={joinCode}
        joinError={joinError}
        onCloseJoinModal={() => {
          setIsJoinModalOpen(false);
          setJoinError(null);
        }}
        onJoinCodeChange={(code) => {
          setJoinCode(code);
          setJoinError(null);
        }}
        onJoinClassroom={handleJoinClassroom}
        actionModalType={actionModalType}
        onCloseActionModal={() => setActionModalType(null)}
        reviewDueCount={reviewDueCount}
        newCount={newCount}
        currentClassScope={currentClassScope}
      />
    </StudentShell>
  );
}
