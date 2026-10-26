import { use } from 'react';
import { ExamLegalDisclaimer } from '@/components/exam/ExamLegalDisclaimer';
import { StudentShell } from '@/components/student/StudentShell';
import { ToeicFlaggedReviewView } from '@/components/toeic/ToeicFlaggedReviewView';
import { useToeicCatalog } from '@/components/toeic/useToeicCatalog';
import { ToeicCatalogHeader } from '@/components/toeic/ToeicCatalogHeader';
import { ToeicFullTestTab } from '@/components/toeic/ToeicFullTestTab';
import { ToeicPartPracticeTab } from '@/components/toeic/ToeicPartPracticeTab';

type PageSearchParams = Record<string, string | string[] | undefined>;

/** Giống URLSearchParams.get(): lấy giá trị đầu tiên nếu param lặp lại. */
function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function ToeicCatalogContent({
  tabParam,
  partParam,
}: {
  tabParam: string | null;
  partParam: string | null;
}) {
  const {
    activeTab,
    setActiveTab,
    selectedPart,
    setSelectedPart,
    selectedListeningYear,
    setSelectedListeningYear,
    reviewCount,
    testFilter,
    setTestFilter,
    searchQuery,
    setSearchQuery,
    displayLayout,
    handleLayoutChange,
    userExamStatus,
    getTestsForYear,
    selectedSource,
    setSelectedSource,
    selectedFilterMode,
    setSelectedFilterMode,
    selectedCount,
    setSelectedCount,
    customCountInput,
    setCustomCountInput,
    selectedMode,
    setSelectedMode,
    partProgress,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleResetConfirm,
    partRailRef,
    railCanScrollLeft,
    railCanScrollRight,
    checkRailScroll,
    scrollPartRail,
    handleSelectPart,
    displayedFullTests,
    setCurrentPage,
    totalTestPages,
    safeTestPage,
    paginatedFullTests,
    currentPartMeta,
    presetsForCurrentPart,
    isClusterPart,
    effectiveCount,
    estimatedTimeMinutes,
    totalQuestionsFormatted,
    totalFullTestsCount,
    full200Count,
    totalPracticeQuestionsFormatted,
    totalPracticeSetsCount,
  } = useToeicCatalog({ tabParam, partParam });

  return (
    <div className="min-h-screen max-w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      <ToeicCatalogHeader
        totalQuestionsFormatted={totalQuestionsFormatted}
        totalFullTestsCount={totalFullTestsCount}
        reviewCount={reviewCount}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
      />

      <main className="mx-auto max-w-3xl px-3 sm:px-4 py-5 sm:py-6 space-y-5 min-w-0 overflow-x-hidden">
        {activeTab === 'full_test' && (
          <ToeicFullTestTab
            testFilter={testFilter}
            onTestFilterChange={setTestFilter}
            totalFullTestsCount={totalFullTestsCount}
            full200Count={full200Count}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            displayedFullTests={displayedFullTests}
            paginatedFullTests={paginatedFullTests}
            displayLayout={displayLayout}
            onLayoutChange={handleLayoutChange}
            safeTestPage={safeTestPage}
            totalTestPages={totalTestPages}
            onPageChange={setCurrentPage}
            userExamStatus={userExamStatus}
          />
        )}

        {activeTab === 'practice_parts' && (
          <ToeicPartPracticeTab
            selectedPart={selectedPart}
            onSelectPart={handleSelectPart}
            totalPracticeQuestionsFormatted={totalPracticeQuestionsFormatted}
            totalPracticeSetsCount={totalPracticeSetsCount}
            partRailRef={partRailRef}
            railCanScrollLeft={railCanScrollLeft}
            railCanScrollRight={railCanScrollRight}
            onCheckRailScroll={checkRailScroll}
            onScrollPartRail={scrollPartRail}
            currentPartMeta={currentPartMeta}
            partProgress={partProgress}
            isResetConfirmOpen={isResetConfirmOpen}
            onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
            onCloseResetConfirm={() => setIsResetConfirmOpen(false)}
            onConfirmReset={handleResetConfirm}
            selectedListeningYear={selectedListeningYear}
            onSelectListeningYear={setSelectedListeningYear}
            getTestsForYear={getTestsForYear}
            selectedSource={selectedSource}
            onSelectSource={setSelectedSource}
            selectedFilterMode={selectedFilterMode}
            onSelectFilterMode={setSelectedFilterMode}
            presetsForCurrentPart={presetsForCurrentPart}
            selectedCount={selectedCount}
            onSelectCount={setSelectedCount}
            customCountInput={customCountInput}
            onCustomCountInputChange={setCustomCountInput}
            isClusterPart={isClusterPart}
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
            effectiveCount={effectiveCount}
            estimatedTimeMinutes={estimatedTimeMinutes}
          />
        )}

        {activeTab === 'review_flagged' && (
          <ToeicFlaggedReviewView
            onSwitchToPractice={(p) => {
              setSelectedPart(p || 1);
              setActiveTab('practice_parts');
            }}
          />
        )}
      </main>

      <ExamLegalDisclaimer examType="toeic" className="mt-12" />
    </div>
  );
}

export default function ToeicHubPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const params = use(searchParams);
  return (
    <StudentShell title="Thi thử TOEIC chuẩn ETS" contentClassName="p-0">
      <ToeicCatalogContent
        tabParam={firstParam(params.tab)}
        partParam={firstParam(params.part)}
      />
    </StudentShell>
  );
}
