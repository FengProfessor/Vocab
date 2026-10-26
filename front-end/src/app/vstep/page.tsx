import { Suspense } from 'react';
import { ExamLegalDisclaimer } from '@/components/exam/ExamLegalDisclaimer';
import {
  ITEMS_PER_PAGE,
  normalizeViText,
  getPaginationPages,
  formatAttemptDate,
} from '@/components/vstep/vstepCatalogConstants';
import { useVstepCatalog } from '@/components/vstep/useVstepCatalog';
import { VstepCatalogHeader, VstepVnuBanner } from '@/components/vstep/VstepCatalogHeader';
import { VstepFullMockTab } from '@/components/vstep/VstepFullMockTab';
import {
  VstepSkillPracticeTab,
  VstepResetModal,
} from '@/components/vstep/VstepSkillPracticeTab';

export { ITEMS_PER_PAGE, normalizeViText, getPaginationPages, formatAttemptDate };

function VstepCatalogContent() {
  const {
    activeTab,
    setActiveTab,
    selectedPracticeSkill,
    setSelectedPracticeSkill,
    testFilter,
    setTestFilter,
    selectedSource,
    setSelectedSource,
    selectedLevel,
    setSelectedLevel,
    searchQuery,
    setSearchQuery,
    displayLayout,
    handleLayoutChange,
    filterMode,
    setFilterMode,
    examSummaries,
    hasMounted,
    isResetModalOpen,
    setIsResetModalOpen,
    resetOption,
    setResetOption,
    bankTotals,
    listeningStats,
    readingStats,
    draftSummaries,
    filteredItems,
    counts,
    totalPages,
    safePage,
    paginatedItems,
    handlePageChange,
    handleExecuteReset,
    isObjectivePractice,
    currentSkillProgress,
    selectedSkillMeta,
    getPracticeHref,
    getPracticeWorkload,
  } = useVstepCatalog();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans pb-20">
      <VstepCatalogHeader
        bankTotals={bankTotals}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          setTestFilter('all');
        }}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <VstepVnuBanner />

        {activeTab === 'full_mock' && (
          <VstepFullMockTab
            testFilter={testFilter}
            onTestFilterChange={setTestFilter}
            bankTotals={bankTotals}
            counts={counts}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredItems={filteredItems}
            paginatedItems={paginatedItems}
            displayLayout={displayLayout}
            onLayoutChange={handleLayoutChange}
            hasMounted={hasMounted}
            examSummaries={examSummaries}
            draftSummaries={draftSummaries}
            totalPages={totalPages}
            safePage={safePage}
            onPageChange={handlePageChange}
          />
        )}

        {activeTab === 'skill_practice' && (
          <VstepSkillPracticeTab
            bankTotals={bankTotals}
            selectedPracticeSkill={selectedPracticeSkill}
            onSelectPracticeSkill={setSelectedPracticeSkill}
            selectedSkillMeta={selectedSkillMeta}
            isObjectivePractice={isObjectivePractice}
            currentSkillProgress={currentSkillProgress}
            onOpenResetModalForSkill={(option) => {
              setResetOption(option);
              setIsResetModalOpen(true);
            }}
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            selectedSource={selectedSource}
            onSelectedSourceChange={setSelectedSource}
            selectedLevel={selectedLevel}
            onSelectedLevelChange={setSelectedLevel}
            counts={counts}
            filteredItems={filteredItems}
            paginatedItems={paginatedItems}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            displayLayout={displayLayout}
            onLayoutChange={handleLayoutChange}
            hasMounted={hasMounted}
            examSummaries={examSummaries}
            draftSummaries={draftSummaries}
            getPracticeHref={getPracticeHref}
            getPracticeWorkload={getPracticeWorkload}
            totalPages={totalPages}
            safePage={safePage}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <VstepResetModal
        open={isResetModalOpen}
        resetOption={resetOption}
        onSelectResetOption={setResetOption}
        listeningStats={listeningStats}
        readingStats={readingStats}
        bankTotals={bankTotals}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleExecuteReset}
      />

      <ExamLegalDisclaimer examType="vstep" className="mt-12" />
    </div>
  );
}

export default function VstepCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center text-xs font-mono text-slate-500">
          Đang tải hệ thống khảo thí VSTEP...
        </div>
      }
    >
      <VstepCatalogContent />
    </Suspense>
  );
}
